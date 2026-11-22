import type { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../auth.js';
import {
    authorizeCompany,
    COMPANY_MANAGEMENT_ROLES,
    COMPANY_READ_ROLES,
    QUOTATION_ROLES,
} from '../authz.js';
import { calculateProjectedMargin } from '../businessModels.js';
import { listFlatBillingsForCompany } from '../flatBilling.js';
import {
    getProjectRowById,
    listInvestorContributionsForInvestor,
    listProjectExpensesForCompany,
    listProjectInvestorsForProject,
    listProjectReceiptsForProject,
    listProjectsForCompany,
} from '../projects.js';
import {
    getCompanyFinancialMonthlySeries,
    getCompanyFinancialReport,
    getCompanyFinancialYearlySeries,
    getOutstandingByExpenseId,
    getProjectScopedAccessForRead,
    getQuotationRowsForCompany,
    inDateRange,
    parseDateOrNull,
} from '../routeHelpers.js';

export function registerReportRoutes(app: FastifyInstance) {
    app.get('/api/reports/dashboard', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        const { projectId } = request.query as { projectId?: string };

        try {
            const report = await getCompanyFinancialReport(membership.companyId, projectId ?? null);
            return reply.send({ dashboard: report });
        } catch (err: any) {
            app.log.error(err, 'Failed to generate dashboard report');
            return reply.status(500).send({ error: 'Failed to generate dashboard report.' });
        }
    });

    // Aggregated dashboard endpoint that also includes project progress and pending supplier payments
    app.get('/api/reports/dashboard-v2', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        try {
            // Step 1: get project rows for this company (needed for .in() filters and progress base rows).
            // Use service-level listing to avoid schema drift (e.g. is_deleted vs deleted_at).
            const projectRows = await listProjectsForCompany(membership.companyId);
            const scopedProjectRows = (projectRows ?? [])
                .filter((row: any) => !row?.deleted_at && row?.is_deleted !== true)
                .filter((row: any) => Boolean(row?.id));
            const projectIds = scopedProjectRows.map((row: any) => String(row.id));

            // Step 2: fetch everything in parallel
            const [report, stagesData, progressData, expensePaymentsData, expensesData] = await Promise.all([
                getCompanyFinancialReport(membership.companyId, null),
                projectIds.length > 0
                    ? supabaseAdmin
                        .from('project_stages')
                        .select('id, project_id, name, sequence_number, status, planned_end_date, actual_end_date, completion_percentage')
                        .in('project_id', projectIds)
                        .order('sequence_number', { ascending: true })
                        .then((r) => r.data ?? [])
                    : Promise.resolve([]),
                projectIds.length > 0
                    ? supabaseAdmin
                        .from('project_progress_updates')
                        .select('id, project_id, stage_id, progress_percentage, update_date, created_at')
                        .in('project_id', projectIds)
                        .order('update_date', { ascending: false })
                        .then((r) => r.data ?? [])
                    : Promise.resolve([]),
                supabaseAdmin
                    .from('project_expense_payments')
                    .select('project_expense_id, amount, voided_at')
                    .eq('company_id', membership.companyId)
                    .then((r) => r.data ?? []),
                supabaseAdmin
                    .from('project_expenses')
                    .select('id, project_id, bill_amount, status, due_date')
                    .eq('company_id', membership.companyId)
                    .then((r) => r.data ?? []),
            ]);

            // Per-project: current stage, latest progress, expected end date
            const stagesByProject = new Map<string, any[]>();
            for (const stage of stagesData) {
                const arr = stagesByProject.get(stage.project_id) ?? [];
                arr.push(stage);
                stagesByProject.set(stage.project_id, arr);
            }

            // Latest progress update per project (already ordered desc by update_date)
            const latestProgressByProject = new Map<string, any>();
            const latestProgressDateByProject = new Map<string, string>();
            for (const update of progressData) {
                if (!latestProgressByProject.has(update.project_id)) {
                    latestProgressByProject.set(update.project_id, update);
                    latestProgressDateByProject.set(update.project_id, update.update_date ?? update.created_at ?? '');
                }
            }

            const projectProgress = scopedProjectRows.map((project: any) => {
                const projectId = String(project.id);
                const stages = stagesByProject.get(projectId) ?? [];
                const inProgressStage = stages.find((s: any) => s.status === 'in_progress');
                const currentStage = inProgressStage ?? stages[stages.length - 1] ?? null;
                const latestUpdate = latestProgressByProject.get(projectId) ?? null;
                const latestProgressDate = latestProgressDateByProject.get(projectId) ?? null;

                // Progress: prefer latest update percentage, fall back to stage completion
                const progressPercent = latestUpdate?.progress_percentage != null
                    ? Number(latestUpdate.progress_percentage)
                    : currentStage?.completion_percentage != null
                        ? Number(currentStage.completion_percentage)
                        : null;

                return {
                    projectId,
                    projectName: project.name,
                    status: project.status ?? 'planned',
                    expectedEndDate: project.expected_end_date ?? null,
                    currentStageName: currentStage?.name ?? null,
                    progressPercent,
                    latestProgressDate,
                };
            });

            // Pending supplier payments: non-void expenses with an outstanding balance
            const paidByExpense = new Map<string, number>();
            for (const payment of expensePaymentsData) {
                if (payment.voided_at) continue;
                const expId = String(payment.project_expense_id ?? '');
                if (!expId) continue;
                paidByExpense.set(expId, (paidByExpense.get(expId) ?? 0) + Number(payment.amount ?? 0));
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const pendingSupplierPayments = (expensesData as any[])
                .filter((e) => (e.status ?? 'void') !== 'void')
                .reduce<Array<{ expenseId: string; projectId: string | null; outstanding: number; dueDate: string | null; isOverdue: boolean }>>((acc, e) => {
                    const bill = Number(e.bill_amount ?? 0);
                    const paid = paidByExpense.get(e.id) ?? 0;
                    const outstanding = Math.max(0, bill - paid);
                    if (outstanding > 0) {
                        acc.push({
                            expenseId: e.id,
                            projectId: e.project_id ?? null,
                            outstanding,
                            dueDate: e.due_date ?? null,
                            isOverdue: e.due_date ? new Date(e.due_date) < today : false,
                        });
                    }
                    return acc;
                }, []);

            return reply.send({
                dashboard: report,
                projectProgress,
                pendingSupplierPayments,
            });
        } catch (err: any) {
            app.log.error(err, 'Failed to generate v2 dashboard report');
            return reply.status(500).send({ error: 'Failed to generate dashboard report.' });
        }
    });

    app.get('/api/reports/monthly', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        const { projectId } = request.query as { projectId?: string };

        try {
            const data = await getCompanyFinancialMonthlySeries(membership.companyId, projectId ?? null);
            return reply.send(data);
        } catch (err: any) {
            app.log.error(err, 'Failed to generate monthly financial report');
            return reply.status(500).send({ error: 'Failed to generate monthly financial report.' });
        }
    });

    app.get('/api/reports/yearly', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        const { projectId } = request.query as { projectId?: string };

        try {
            const data = await getCompanyFinancialYearlySeries(membership.companyId, projectId ?? null);
            return reply.send({ yearly: data });
        } catch (err: any) {
            app.log.error(err, 'Failed to generate yearly financial report');
            return reply.status(500).send({ error: 'Failed to generate yearly financial report.' });
        }
    });

    app.get('/api/reports/defaulters', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        try {
            const report = await getCompanyFinancialReport(membership.companyId, null);
            return reply.send({ defaulters: report.defaulters ?? [] });
        } catch (err: any) {
            app.log.error(err, 'Failed to generate defaulter report');
            return reply.status(500).send({ error: 'Failed to generate defaulter report.' });
        }
    });

    app.get('/api/reports/projects', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_READ_ROLES });
        if (membership) {
            const { status, from, to } = request.query as { status?: string; from?: string; to?: string };
            const fromDate = parseDateOrNull(from);
            const toDate = parseDateOrNull(to);

            try {
                let projects = await listProjectsForCompany(membership.companyId);
                if (status) projects = projects.filter((row) => row.status === status);
                projects = projects.filter((row) => {
                    const value = row.start_date ?? row.created_at;
                    if (!fromDate && !toDate) return true;
                    return inDateRange(value, fromDate, toDate);
                });
                return reply.send({ projects });
            } catch (err: any) {
                app.log.error(err, 'Failed to generate projects report');
                return reply.status(500).send({ error: 'Failed to generate projects report.' });
            }
        }

        const projectScope = await getProjectScopedAccessForRead(request, reply, 'project report');
        if (!projectScope) return;

        try {
            const projects = await Promise.all(
                Array.from(projectScope.projectIds).map(async (projectId) => getProjectRowById(projectId)),
            );
            return reply.send({ projects: projects.filter(Boolean) });
        } catch (err: any) {
            app.log.error(err, 'Failed to generate project-scoped projects report');
            return reply.status(500).send({ error: 'Failed to generate projects report.' });
        }
    });

    app.get('/api/reports/expenses', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (membership) {
            const { projectId, from, to } = request.query as { projectId?: string; from?: string; to?: string };
            const fromDate = parseDateOrNull(from);
            const toDate = parseDateOrNull(to);

            try {
                let expenses = await listProjectExpensesForCompany(membership.companyId, projectId ?? null);
                expenses = expenses.filter((row) => {
                    if (!fromDate && !toDate) return true;
                    return inDateRange(row.bill_date ?? row.created_at, fromDate, toDate);
                });

                const total = expenses.filter((row) => row.status !== 'void').reduce((sum, row) => sum + Number(row.bill_amount ?? 0), 0);
                return reply.send({ expenses, total });
            } catch (err: any) {
                app.log.error(err, 'Failed to generate expense report');
                return reply.status(500).send({ error: 'Failed to generate expense report.' });
            }
        }

        const { projectId, from, to } = request.query as { projectId?: string; from?: string; to?: string };
        const fromDate = parseDateOrNull(from);
        const toDate = parseDateOrNull(to);
        const targetProjectId = projectId ?? null;
        const projectScope = await getProjectScopedAccessForRead(request, reply, 'project expense report', targetProjectId, {
            requireFinancialAccess: true,
        });
        if (!projectScope) return;

        const projectIds = targetProjectId ? [targetProjectId] : Array.from(projectScope.projectIds);
        try {
            const expensesLists = await Promise.all(
                projectIds.map(async (id) => {
                    const project = await getProjectRowById(id);
                    if (!project || !projectScope.projectIds.has(id)) return [] as any[];
                    return listProjectExpensesForCompany(project.company_id, id);
                }),
            );
            let expenses = expensesLists.flat();
            expenses = expenses.filter((row) => {
                if (!fromDate && !toDate) return true;
                return inDateRange(row.bill_date ?? row.created_at, fromDate, toDate);
            });
            const total = expenses.filter((row) => row.status !== 'void').reduce((sum, row) => sum + Number(row.bill_amount ?? 0), 0);
            return reply.send({ expenses, total });
        } catch (err: any) {
            app.log.error(err, 'Failed to generate project-scoped expense report');
            return reply.status(500).send({ error: 'Failed to generate expense report.' });
        }
    });

    app.get('/api/reports/collections', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (membership) {
            const { projectId, from, to } = request.query as { projectId?: string; from?: string; to?: string };
            const fromDate = parseDateOrNull(from);
            const toDate = parseDateOrNull(to);

            try {
                const projectIds = projectId
                    ? [projectId]
                    : (await supabaseAdmin.from('projects').select('id').eq('company_id', membership.companyId)).data?.map((row: any) => row.id) ?? [];

                const { data, error } = await supabaseAdmin
                    .from('project_receipts')
                    .select('*')
                    .in('project_id', projectIds)
                    .order('received_date', { ascending: false });
                if (error) throw error;

                const receipts = (data ?? []).filter((row: any) => inDateRange(row.received_date ?? row.created_at, fromDate, toDate));
                const total = receipts.filter((row: any) => !row.voided_at).reduce((sum: number, row: any) => sum + Number(row.amount ?? 0), 0);
                return reply.send({ receipts, total });
            } catch (err: any) {
                app.log.error(err, 'Failed to generate collections report');
                return reply.status(500).send({ error: 'Failed to generate collections report.' });
            }
        }

        const { projectId, from, to } = request.query as { projectId?: string; from?: string; to?: string };
        const fromDate = parseDateOrNull(from);
        const toDate = parseDateOrNull(to);
        const targetProjectId = projectId ?? null;
        const projectScope = await getProjectScopedAccessForRead(request, reply, 'project collection report', targetProjectId, {
            requireClientReceiptAccess: true,
        });
        if (!projectScope) return;

        const projectIds = targetProjectId ? [targetProjectId] : Array.from(projectScope.projectIds);
        try {
            const { data, error } = await supabaseAdmin
                .from('project_receipts')
                .select('*')
                .in('project_id', projectIds)
                .order('received_date', { ascending: false });
            if (error) throw error;
            const receipts = (data ?? []).filter((row: any) => inDateRange(row.received_date ?? row.created_at, fromDate, toDate));
            const total = receipts.filter((row: any) => !row.voided_at).reduce((sum: number, row: any) => sum + Number(row.amount ?? 0), 0);
            return reply.send({ receipts, total });
        } catch (err: any) {
            app.log.error(err, 'Failed to generate project-scoped collections report');
            return reply.status(500).send({ error: 'Failed to generate collections report.' });
        }
    });

    app.get('/api/reports/supplier-outstanding', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (membership) {
            const projectId = (request.query as { projectId?: string }).projectId;
            try {
                const expenses = await listProjectExpensesForCompany(membership.companyId, projectId ?? null);
                const outstandingByExpense = await getOutstandingByExpenseId(membership.companyId, projectId ?? null);
                const outstanding = expenses
                    .filter((row) => row.status !== 'void')
                    .map((row) => ({
                        ...row,
                        outstandingAmount: Number(outstandingByExpense.get(row.id) ?? 0),
                    }))
                    .filter((row) => row.outstandingAmount > 0);
                const totalOutstanding = outstanding.reduce((sum, row) => sum + Number(row.outstandingAmount ?? 0), 0);
                return reply.send({ outstanding, totalOutstanding });
            } catch (err: any) {
                app.log.error(err, 'Failed to generate supplier outstanding report');
                return reply.status(500).send({ error: 'Failed to generate supplier outstanding report.' });
            }
        }

        const projectId = (request.query as { projectId?: string }).projectId ?? null;
        const projectScope = await getProjectScopedAccessForRead(request, reply, 'supplier outstanding report', projectId, {
            requireFinancialAccess: true,
        });
        if (!projectScope) return;

        const projectIds = projectId ? [projectId] : Array.from(projectScope.projectIds);
        try {
            const expensesLists = await Promise.all(
                projectIds.map(async (id) => {
                    const project = await getProjectRowById(id);
                    if (!project || !projectScope.projectIds.has(id)) return [] as any[];
                    return listProjectExpensesForCompany(project.company_id, id);
                }),
            );
            const expenses = expensesLists.flat();
            const outstandingByExpense = await getOutstandingByExpenseId(
                projectIds.length > 0 ? (await getProjectRowById(projectIds[0]))?.company_id ?? '' : '',
                projectId ?? null,
            );
            const outstanding = expenses
                .filter((row) => row.status !== 'void')
                .map((row) => ({
                    ...row,
                    outstandingAmount: Number(outstandingByExpense.get(row.id) ?? 0),
                }))
                .filter((row) => row.outstandingAmount > 0);
            const totalOutstanding = outstanding.reduce((sum, row) => sum + Number(row.outstandingAmount ?? 0), 0);
            return reply.send({ outstanding, totalOutstanding });
        } catch (err: any) {
            app.log.error(err, 'Failed to generate project-scoped supplier outstanding report');
            return reply.status(500).send({ error: 'Failed to generate supplier outstanding report.' });
        }
    });

    app.get('/api/reports/investors', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        const projectId = (request.query as { projectId?: string }).projectId;
        if (!projectId) return reply.status(400).send({ error: 'Project is required.' });

        try {
            const investors = await listProjectInvestorsForProject(projectId, membership.companyId);
            const investorSummaries = await Promise.all(
                investors.map(async (investor: any) => {
                    const contributions = await listInvestorContributionsForInvestor(investor.id, membership.companyId);
                    const totalContributed = contributions.reduce((sum: number, row: any) => sum + Number(row.amount ?? 0), 0);
                    return { investor, contributions, totalContributed };
                }),
            );
            return reply.send({ investors: investorSummaries });
        } catch (err: any) {
            app.log.error(err, 'Failed to generate investor report');
            return reply.status(500).send({ error: 'Failed to generate investor report.' });
        }
    });

    app.get('/api/reports/project-financials', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (membership) {
            const projectId = (request.query as { projectId?: string }).projectId;
            if (!projectId) return reply.status(400).send({ error: 'Project is required.' });

            try {
                const [expenses, receipts, investors] = await Promise.all([
                    listProjectExpensesForCompany(membership.companyId, projectId),
                    listProjectReceiptsForProject(projectId, membership.companyId),
                    listProjectInvestorsForProject(projectId, membership.companyId),
                ]);

                const project = await getProjectRowById(projectId);
                const contractValue = Number(project?.contract_amount ?? 0);
                const projectBudget = Number(project?.budget_amount ?? 0);
                const actualCost = expenses.filter((row: any) => row.status !== 'void').reduce((sum: number, row: any) => sum + Number(row.bill_amount ?? 0), 0);
                const customerCollections = receipts.filter((row: any) => !row.voided_at).reduce((sum: number, row: any) => sum + Number(row.amount ?? 0), 0);

                let investorContributions = 0;
                for (const investor of investors) {
                    const contributions = await listInvestorContributionsForInvestor(investor.id, membership.companyId);
                    investorContributions += contributions.reduce((sum: number, row: any) => sum + Number(row.amount ?? 0), 0);
                }

                const expectedProjectMargin = calculateProjectedMargin({
                    businessModel: (project as any)?.business_model,
                    developmentArrangement: (project as any)?.development_arrangement,
                    contractAmount: project?.contract_amount,
                    budgetAmount: project?.budget_amount,
                    projectedSalesValue: (project as any)?.projected_sales_value,
                    landCost: (project as any)?.land_cost,
                });
                const budgetRemaining = projectBudget - actualCost;
                const budgetUtilization = projectBudget > 0 ? (actualCost / projectBudget) * 100 : 0;
                const cashBasedProfitLoss = customerCollections - actualCost;
                const netCashFlow = customerCollections - actualCost;
                return reply.send({
                    summary: {
                        contractValue,
                        projectBudget,
                        actualCost,
                        customerCollections,
                        investorContributions,
                        expectedProjectMargin,
                        cashBasedProfitLoss,
                        budgetRemaining,
                        budgetUtilization,
                        netCashFlow,
                    },
                });
            } catch (err: any) {
                app.log.error(err, 'Failed to generate project financial report');
                return reply.status(500).send({ error: 'Failed to generate project financial report.' });
            }
        }

        const projectId = (request.query as { projectId?: string }).projectId;
        if (!projectId) return reply.status(400).send({ error: 'Project is required.' });
        const projectScope = await getProjectScopedAccessForRead(request, reply, 'project financial report', projectId, {
            requireFinancialAccess: true,
        });
        if (!projectScope) return;

        try {
            const project = await getProjectRowById(projectId);
            if (!project) return reply.status(404).send({ error: 'Project not found.' });
            const [expenses, receipts, investors] = await Promise.all([
                listProjectExpensesForCompany(project.company_id, projectId),
                listProjectReceiptsForProject(projectId, project.company_id),
                listProjectInvestorsForProject(projectId, project.company_id),
            ]);

            const contractValue = Number(project.contract_amount ?? 0);
            const projectBudget = Number(project.budget_amount ?? 0);
            const actualCost = expenses.filter((row: any) => row.status !== 'void').reduce((sum: number, row: any) => sum + Number(row.bill_amount ?? 0), 0);
            const customerCollections = receipts.filter((row: any) => !row.voided_at).reduce((sum: number, row: any) => sum + Number(row.amount ?? 0), 0);

            let investorContributions = 0;
            for (const investor of investors) {
                const contributions = await listInvestorContributionsForInvestor(investor.id, project.company_id);
                investorContributions += contributions.reduce((sum: number, row: any) => sum + Number(row.amount ?? 0), 0);
            }

            const expectedProjectMargin = calculateProjectedMargin({
                businessModel: (project as any)?.business_model,
                developmentArrangement: (project as any)?.development_arrangement,
                contractAmount: project?.contract_amount,
                budgetAmount: project?.budget_amount,
                projectedSalesValue: (project as any)?.projected_sales_value,
                landCost: (project as any)?.land_cost,
            });
            const budgetRemaining = projectBudget - actualCost;
            const budgetUtilization = projectBudget > 0 ? (actualCost / projectBudget) * 100 : 0;
            const cashBasedProfitLoss = customerCollections - actualCost;
            const netCashFlow = customerCollections - actualCost;
            return reply.send({
                summary: {
                    contractValue,
                    projectBudget,
                    actualCost,
                    customerCollections,
                    investorContributions,
                    expectedProjectMargin,
                    cashBasedProfitLoss,
                    budgetRemaining,
                    budgetUtilization,
                    netCashFlow,
                },
            });
        } catch (err: any) {
            app.log.error(err, 'Failed to generate project-scoped financial report');
            return reply.status(500).send({ error: 'Failed to generate project financial report.' });
        }
    });

    app.get('/api/reports/company-summary', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        const { from, to } = request.query as { from?: string; to?: string };
        const fromDate = parseDateOrNull(from);
        const toDate = parseDateOrNull(to);

        try {
            const [projects, quotations, expenses] = await Promise.all([
                listProjectsForCompany(membership.companyId),
                getQuotationRowsForCompany(membership.companyId),
                listProjectExpensesForCompany(membership.companyId),
            ]);

            const quotationRevenue = quotations
                .filter((row) => inDateRange(row.quotation_date ?? row.created_at, fromDate, toDate))
                .reduce((sum, row) => sum + Number(row.grand_total ?? 0), 0);

            const expenseTotal = expenses
                .filter((row) => row.status !== 'void' && inDateRange(row.bill_date ?? row.created_at, fromDate, toDate))
                .reduce((sum, row) => sum + Number(row.bill_amount ?? 0), 0);

            return reply.send({
                summary: {
                    projectsTracked: projects.length,
                    quotationRevenue,
                    expenseTotal,
                    profitEstimate: quotationRevenue - expenseTotal,
                },
            });
        } catch (err: any) {
            app.log.error(err, 'Failed to generate company summary report');
            return reply.status(500).send({ error: 'Failed to generate company summary report.' });
        }
    });

    app.get('/api/reports/summary', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
        if (!membership) return;

        try {
            const [projects, quotations, expenses, flatBillings] = await Promise.all([
                listProjectsForCompany(membership.companyId),
                getQuotationRowsForCompany(membership.companyId),
                listProjectExpensesForCompany(membership.companyId),
                listFlatBillingsForCompany(membership.companyId),
            ]);

            const acceptedRevenue = quotations
                .filter((row) => String(row.status ?? '').trim() === 'Accepted' || String(row.status ?? '').trim() === 'ACCEPTED')
                .reduce((sum, row) => sum + Number(row.grand_total ?? 0), 0);

            const bookingRevenue = flatBillings.reduce((sum, row) => {
                const amount = Number(row.grand_total ?? 0);
                return sum + (Number.isFinite(amount) ? amount : 0);
            }, 0);

            const projectCost = expenses
                .filter((row) => (row.status ?? 'void') !== 'void')
                .reduce((sum, row) => sum + Number(row.bill_amount ?? 0), 0);

            const revenue = acceptedRevenue + bookingRevenue;
            const profit = revenue - projectCost;
            const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
            const projectsAtRisk = projects.filter((row) => row.status === 'on_hold' || row.status === 'cancelled').length;

            const now = new Date();
            const months = Array.from({ length: 6 }, (_, index) => {
                const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
                const label = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
                return {
                    key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
                    label,
                    start: new Date(date.getFullYear(), date.getMonth(), 1),
                    end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999),
                };
            });

            const monthSummaries = months.map(({ key, label, start, end }) => {
                const revenueForMonth = [...quotations, ...flatBillings].reduce((sum, row) => {
                    const rawDate = (row as any).quotation_date ?? (row as any).created_at ?? (row as any).date ?? (row as any).updated_at ?? null;
                    if (!rawDate) return sum;
                    const valueDate = new Date(rawDate);
                    if (Number.isNaN(valueDate.getTime()) || valueDate < start || valueDate > end) return sum;
                    return sum + Number((row as any).grand_total ?? 0);
                }, 0);

                const costForMonth = expenses
                    .filter((row) => {
                        const rawDate = (row as any).bill_date ?? (row as any).created_at ?? null;
                        if (!rawDate) return false;
                        const valueDate = new Date(rawDate);
                        return !Number.isNaN(valueDate.getTime()) && valueDate >= start && valueDate <= end && ((row as any).status ?? 'void') !== 'void';
                    })
                    .reduce((sum, row) => sum + Number((row as any).bill_amount ?? 0), 0);

                const profitForMonth = revenueForMonth - costForMonth;
                const marginForMonth = revenueForMonth > 0 ? (profitForMonth / revenueForMonth) * 100 : 0;

                return { label, revenue: revenueForMonth, cost: costForMonth, profit: profitForMonth, margin: marginForMonth, key };
            });

            return reply.send({
                summary: {
                    revenue,
                    cost: projectCost,
                    profit,
                    margin,
                    projectsTracked: projects.length,
                    projectsAtRisk,
                    months: monthSummaries.map(({ label, revenue: r, cost: c, profit: p, margin: m }) => ({
                        label,
                        revenue: r,
                        cost: c,
                        profit: p,
                        margin: m,
                    })),
                },
            });
        } catch (err: any) {
            app.log.error(err, 'Failed to generate report summary');
            return reply.status(500).send({ error: 'Failed to generate report summary.' });
        }
    });
}
