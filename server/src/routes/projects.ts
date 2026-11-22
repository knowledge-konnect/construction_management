import type { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../auth.js';
import {
    authorizeCompany,
    authorizeOwnedResource,
    COMPANY_MANAGEMENT_ROLES,
    getPrimaryMembership,
    QUOTATION_ROLES,
    requireAuth,
    resolveProjectScopedAccess,
} from '../authz.js';
import {
    createProjectExpenseForProject,
    createProjectForCompany,
    createProjectFromQuotation,
    createProjectReceiptForProject,
    createProjectUnitForProject,
    deleteProjectUnitRow,
    generateProjectNumber,
    getProjectCompanyId,
    getProjectExpenseRowById,
    getProjectReceiptRowById,
    getProjectRowById,
    getProjectUnitRowById,
    listProjectExpensesForCompany,
    listProjectReceiptsForProject,
    listProjectsForCompany,
    listProjectUnitsForProject,
    updateProjectExpenseRow,
    updateProjectReceiptRow,
    updateProjectRow,
    updateProjectUnitRow,
    voidProjectExpenseRow,
    voidProjectReceiptRow,
} from '../projects.js';
import { findUserById } from '../auth.js';
import {
    listProjectStagesForProject,
    listProjectProgressUpdatesForProject,
    listProjectAttachmentsForProject,
    listInvestorContributionsForInvestor,
} from '../projects.js';
import { getProjectScopedAccessForRead } from '../routeHelpers.js';
import { validateProjectPayload } from '../validation.js';

export function registerProjectRoutes(app: FastifyInstance) {
    // ─── List projects ─────────────────────────────────────────────────────────
    app.get('/api/projects', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
        if (membership) {
            try {
                const projects = await listProjectsForCompany(membership.companyId);
                return reply.send({ projects });
            } catch (err: any) {
                app.log.error(err, 'Failed to list projects');
                return reply.status(500).send({ error: 'Failed to load projects.' });
            }
        }

        const projectScope = await getProjectScopedAccessForRead(request, reply, 'projects');
        if (!projectScope) return;

        try {
            const projects = await Promise.all(
                Array.from(projectScope.projectIds).map(async (projectId) => getProjectRowById(projectId)),
            );
            return reply.send({ projects: projects.filter(Boolean) });
        } catch (err: any) {
            app.log.error(err, 'Failed to list project-scoped projects');
            return reply.status(500).send({ error: 'Failed to load projects.' });
        }
    });

    // ─── Get single project ────────────────────────────────────────────────────
    app.get('/api/projects/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        let project: any = null;

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                project = await getProjectRowById(id);
                return project?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (membership) {
            return reply.send({ project });
        }

        const projectScope = await getProjectScopedAccessForRead(request, reply, 'project detail', id);
        if (!projectScope) return;

        project = await getProjectRowById(id);
        if (!project) {
            return reply.status(404).send({ error: 'Project not found.' });
        }
        return reply.send({ project });
    });

    // ─── Create project ────────────────────────────────────────────────────────
    app.post('/api/projects', async (request, reply) => {
        const userId = requireAuth(request, reply);
        if (!userId) return;

        const body = request.body as any;

        const validationError = validateProjectPayload(body);
        if (validationError) {
            return reply.status(400).send({ error: validationError });
        }

        const requestedCompanyId = body.company_id || body.companyId || null;

        try {
            const membership = await getPrimaryMembership(userId);

            if (!membership) {
                return reply.status(400).send({ error: 'No company found for this user. Create a company before saving a project.' });
            }

            if (requestedCompanyId && requestedCompanyId !== membership.companyId) {
                return reply.status(403).send({ error: 'Forbidden.' });
            }

            if (!QUOTATION_ROLES.includes(membership.role)) {
                return reply.status(403).send({ error: 'Forbidden.' });
            }

            const projectNumber = body.project_number || (await generateProjectNumber(membership.companyId));
            const project = await createProjectForCompany(
                membership.companyId,
                {
                    ...body,
                    company_id: membership.companyId,
                    project_number: projectNumber,
                    name: body.name,
                    customer_id: body.customer_id ?? body.customerId ?? null,
                    source_document_id: body.source_document_id ?? body.sourceDocumentId ?? null,
                    project_type_id: body.project_type_id ?? body.projectTypeId ?? null,
                    project_type_snapshot: body.project_type_snapshot ?? body.projectTypeSnapshot ?? body.projectType ?? null,
                    business_model: body.business_model ?? body.businessModel ?? null,
                    projected_sales_value: body.projected_sales_value ?? body.projectedSalesValue ?? null,
                    land_cost: body.land_cost ?? body.landCost ?? null,
                    description: body.description ?? null,
                    site_address: body.site_address ?? body.siteAddress ?? null,
                    contract_amount: body.contract_amount ?? body.contractAmount ?? 0,
                    budget_amount: body.budget_amount ?? body.budgetAmount ?? null,
                    start_date: body.start_date ?? body.startDate ?? null,
                    expected_end_date: body.expected_end_date ?? body.expectedEndDate ?? null,
                    actual_end_date: body.actual_end_date ?? body.actualEndDate ?? null,
                    status: body.status ?? 'planned',
                    stage_drafts: Array.isArray(body.stage_drafts)
                        ? body.stage_drafts
                        : Array.isArray(body.stages)
                            ? body.stages
                            : null,
                },
                membership.userId,
            );

            return reply.status(201).send({ project });
        } catch (err: any) {
            app.log.error(err, 'Failed to create project');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400) return reply.status(400).send({ error: err.message });
            if (statusCode === 403) return reply.status(403).send({ error: 'Forbidden.' });
            if (statusCode === 409) return reply.status(409).send({ error: err.message });
            return reply.status(500).send({ error: 'Failed to create project.' });
        }
    });

    // ─── Create project from quotation ─────────────────────────────────────────
    app.post('/api/projects/from-quotation/:quotationId', async (request, reply) => {
        const { quotationId } = request.params as { quotationId: string };
        const userId = requireAuth(request, reply);
        if (!userId) return;

        try {
            const membership = await getPrimaryMembership(userId);
            if (!membership) {
                return reply.status(400).send({ error: 'No company found for this user. Create a company before creating a project.' });
            }

            if (!QUOTATION_ROLES.includes(membership.role)) {
                return reply.status(403).send({ error: 'Forbidden.' });
            }

            const project = await createProjectFromQuotation(membership.companyId, quotationId, membership.userId);
            return reply.status(201).send({ project });
        } catch (err: any) {
            app.log.error(err, 'Failed to create project from quotation');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 404) return reply.status(statusCode).send({ error: err.message });
            if (statusCode === 409) return reply.status(409).send({ error: err.message });
            return reply.status(500).send({ error: 'Failed to create project from quotation.' });
        }
    });

    // ─── Update project ────────────────────────────────────────────────────────
    app.put('/api/projects/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = request.body as any;
        const validationError = validateProjectPayload({
            ...body,
            name: body.name ?? '',
        });
        if (validationError) {
            return reply.status(400).send({ error: validationError });
        }

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const project = await getProjectRowById(id);
                return project?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        try {
            const project = await updateProjectRow(id, {
                ...body,
                customer_id: body.customer_id ?? body.customerId,
                source_document_id: body.source_document_id ?? body.sourceDocumentId,
                project_type_id: body.project_type_id ?? body.projectTypeId,
                project_type_snapshot: body.project_type_snapshot ?? body.projectTypeSnapshot ?? body.projectType,
                business_model: body.business_model ?? body.businessModel,
                projected_sales_value: body.projected_sales_value ?? body.projectedSalesValue,
                land_cost: body.land_cost ?? body.landCost,
                site_address: body.site_address ?? body.siteAddress,
                contract_amount: body.contract_amount ?? body.contractAmount,
                budget_amount: body.budget_amount ?? body.budgetAmount ?? null,
                start_date: body.start_date ?? body.startDate,
                expected_end_date: body.expected_end_date ?? body.expectedEndDate,
                actual_end_date: body.actual_end_date ?? body.actualEndDate,
            });
            return reply.send({ project });
        } catch (err: any) {
            app.log.error(err, 'Failed to update project');
            return reply.status(500).send({ error: 'Failed to update project.' });
        }
    });

    // ─── Delete project ────────────────────────────────────────────────────────
    app.delete('/api/projects/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const project = await getProjectRowById(id);
                return project?.company_id ?? null;
            },
            { allowedRoles: COMPANY_MANAGEMENT_ROLES },
        );
        if (!membership) return;

        try {
            const { error } = await supabaseAdmin.from('projects').delete().eq('id', id);
            if (error) throw error;
            return reply.send({ ok: true });
        } catch (err: any) {
            app.log.error(err, 'Failed to delete project');
            return reply.status(500).send({ error: 'Failed to delete project.' });
        }
    });

    // ─── External project portal (client/investor) ─────────────────────────────
    app.get('/api/external/projects', async (request, reply) => {
        const userId = requireAuth(request, reply);
        if (!userId) return;

        const user = await findUserById(userId);
        if (!user) {
            return reply.status(404).send({ error: 'User not found.' });
        }

        if (user.role !== 'client' && user.role !== 'investor') {
            return reply.status(403).send({ error: 'Forbidden.' });
        }

        const projectScope = await resolveProjectScopedAccess(userId);
        if (!projectScope || projectScope.authorizedProjectIds.length === 0) {
            return reply.send({ projects: [] });
        }

        const allowedProjectIds = new Set(projectScope.authorizedProjectIds);
        const clientProjectIds = new Set(projectScope.clientProjectIds);
        const userEmail = String(user.email ?? '').trim().toLowerCase();

        const projects = await Promise.all(
            Array.from(allowedProjectIds).map(async (projectId) => {
                const project = await getProjectRowById(projectId);
                if (!project) return null;
                if (user.role === 'client' && !clientProjectIds.has(projectId)) return null;
                if (user.role === 'investor' && clientProjectIds.has(projectId)) return null;

                const stages = await listProjectStagesForProject(projectId, project.company_id);
                const updates = await listProjectProgressUpdatesForProject(projectId, project.company_id);
                const attachments = await listProjectAttachmentsForProject(projectId, project.company_id);
                const receipts = await listProjectReceiptsForProject(projectId, project.company_id);
                const amountPaidByClient = receipts
                    .filter((row: any) => !row?.voided_at)
                    .reduce((sum: number, row: any) => sum + Number(row?.amount ?? 0), 0);
                const contractValue = Number(project.contract_amount ?? 0);
                const outstandingAmount = Math.max(0, contractValue - amountPaidByClient);

                let myInvestment = 0;
                let myFundingHistory: Array<{ id: string; date: string | null; amount: number; reference: string | null }> = [];
                if (user.role === 'investor') {
                    const { data: investorRows, error: investorError } = await supabaseAdmin
                        .from('project_investors')
                        .select('*')
                        .eq('project_id', projectId)
                        .eq('is_active', true);

                    if (investorError) throw investorError;

                    const matchingInvestors = (investorRows ?? []).filter((row: any) => {
                        const rowEmail = String(row?.email ?? '').trim().toLowerCase();
                        const rowUserId = row?.user_id;
                        const emailMatches = rowUserId == null && rowEmail && rowEmail === userEmail;
                        const userMatches = rowUserId === userId;
                        return userMatches || emailMatches;
                    });

                    const contributions = await Promise.all(
                        matchingInvestors.map(async (row: any) => listInvestorContributionsForInvestor(row.id, project.company_id)),
                    );

                    const fundingRows = contributions.flat();
                    myFundingHistory = fundingRows.map((row: any) => ({
                        id: String(row.id),
                        date: row.contribution_date ?? null,
                        amount: Number(row.amount ?? 0),
                        reference: row.reference_number ?? null,
                    }));
                    myInvestment = myFundingHistory.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
                }

                return {
                    id: project.id,
                    name: project.name,
                    status: project.status,
                    siteAddress: project.site_address ?? null,
                    description: project.description ?? null,
                    startDate: project.start_date ?? null,
                    expectedEndDate: project.expected_end_date ?? null,
                    actualEndDate: project.actual_end_date ?? null,
                    projectTypeSnapshot: project.project_type_snapshot ?? null,
                    progressPercent: stages.length > 0
                        ? Math.round(stages.reduce((sum: number, row: any) => sum + Number(row.completion_percentage ?? 0), 0) / stages.length)
                        : null,
                    milestoneCount: stages.length,
                    updateCount: updates.length,
                    documentCount: attachments.length,
                    totalContractValue: user.role === 'client' ? contractValue : null,
                    amountPaidByClient: user.role === 'client' ? amountPaidByClient : null,
                    outstandingAmount: user.role === 'client' ? outstandingAmount : null,
                    nextPaymentDueDate: null,
                    paymentHistory: user.role === 'client'
                        ? receipts
                            .filter((row: any) => !row?.voided_at)
                            .map((row: any) => ({
                                id: String(row.id),
                                date: row.received_date ?? null,
                                amount: Number(row.amount ?? 0),
                                reference: row.reference_number ?? null,
                            }))
                        : [],
                    myInvestment: user.role === 'investor' ? myInvestment : null,
                    myFundingHistory,
                    milestones: stages.map((row: any) => ({
                        id: String(row.id),
                        name: String(row.name ?? 'Milestone'),
                        status: String(row.status ?? 'pending'),
                        targetDate: row.target_date ?? row.due_date ?? null,
                        completionPercent: Number(row.completion_percentage ?? 0),
                    })),
                    updates: updates.map((row: any) => ({
                        id: String(row.id),
                        title: String(row.title ?? 'Project update'),
                        message: row.message ?? null,
                        createdAt: row.created_at ?? null,
                    })),
                    documents: attachments.map((row: any) => ({
                        id: String(row.id),
                        name: String(row.original_filename ?? 'Document'),
                        fileType: row.mime_type ?? null,
                        createdAt: row.created_at ?? null,
                    })),
                };
            }),
        );

        return reply.send({ projects: projects.filter(Boolean) });
    });

    // ─── Project units ─────────────────────────────────────────────────────────
    app.get('/api/projects/:projectId/units', async (request, reply) => {
        const { projectId } = request.params as { projectId: string };

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const project = await getProjectRowById(projectId);
                return project?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        try {
            const result = await listProjectUnitsForProject(projectId, membership.companyId);
            return reply.send(result);
        } catch (err: any) {
            app.log.error(err, 'Failed to list project units');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to load project inventory.' });
        }
    });

    app.post('/api/projects/:projectId/units', async (request, reply) => {
        const { projectId } = request.params as { projectId: string };
        const body = request.body as any;

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const project = await getProjectRowById(projectId);
                return project?.company_id ?? null;
            },
            { allowedRoles: COMPANY_MANAGEMENT_ROLES },
        );
        if (!membership) return;

        try {
            const unit = await createProjectUnitForProject(projectId, membership.companyId, body ?? {});
            return reply.status(201).send({ unit });
        } catch (err: any) {
            app.log.error(err, 'Failed to create project unit');
            const statusCode = typeof err?.statusCode === 'number'
                ? err.statusCode
                : err?.code === '23505'
                    ? 409
                    : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404 || statusCode === 409) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to create project inventory unit.' });
        }
    });

    app.put('/api/projects/:projectId/units/:unitId', async (request, reply) => {
        const { projectId, unitId } = request.params as { projectId: string; unitId: string };
        const body = request.body as any;

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const unit = await getProjectUnitRowById(unitId);
                return unit?.project?.company_id ?? null;
            },
            { allowedRoles: COMPANY_MANAGEMENT_ROLES },
        );
        if (!membership) return;

        const unit = await getProjectUnitRowById(unitId);
        if (!unit) {
            return reply.status(404).send({ error: 'Project unit not found.' });
        }
        if (unit.project_id !== projectId) {
            return reply.status(400).send({ error: 'This unit does not belong to the selected project.' });
        }

        try {
            const updated = await updateProjectUnitRow(unitId, membership.companyId, body ?? {});
            return reply.send({ unit: updated });
        } catch (err: any) {
            app.log.error(err, 'Failed to update project unit');
            const statusCode = typeof err?.statusCode === 'number'
                ? err.statusCode
                : err?.code === '23505'
                    ? 409
                    : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404 || statusCode === 409) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to update project inventory unit.' });
        }
    });

    app.delete('/api/projects/:projectId/units/:unitId', async (request, reply) => {
        const { projectId, unitId } = request.params as { projectId: string; unitId: string };

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const unit = await getProjectUnitRowById(unitId);
                return unit?.project?.company_id ?? null;
            },
            { allowedRoles: COMPANY_MANAGEMENT_ROLES },
        );
        if (!membership) return;

        const unit = await getProjectUnitRowById(unitId);
        if (!unit) {
            return reply.status(404).send({ error: 'Project unit not found.' });
        }
        if (unit.project_id !== projectId) {
            return reply.status(400).send({ error: 'This unit does not belong to the selected project.' });
        }

        try {
            await deleteProjectUnitRow(unitId, membership.companyId);
            return reply.send({ ok: true });
        } catch (err: any) {
            app.log.error(err, 'Failed to delete project unit');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to delete project inventory unit.' });
        }
    });

    // ─── Project expenses ──────────────────────────────────────────────────────
    app.get('/api/project-expenses', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (membership) {
            const queryProjectId = (request.query as { projectId?: string }).projectId;
            const projectId = queryProjectId && queryProjectId !== 'undefined' ? queryProjectId : null;

            try {
                const expenses = await listProjectExpensesForCompany(membership.companyId, projectId);
                return reply.send({ expenses });
            } catch (err: any) {
                app.log.error(err, 'Failed to list project expenses');
                return reply.status(500).send({ error: 'Failed to load supplier bills.' });
            }
        }

        const queryProjectId = (request.query as { projectId?: string }).projectId;
        const projectId = queryProjectId && queryProjectId !== 'undefined' ? queryProjectId : null;
        const projectScope = await getProjectScopedAccessForRead(request, reply, 'project expenses', projectId ?? null, {
            requireFinancialAccess: true,
        });
        if (!projectScope) return;

        const finalProjectIds = projectId ? [projectId] : Array.from(projectScope.projectIds);
        try {
            const expenses = await Promise.all(
                finalProjectIds.map(async (id) => {
                    const project = await getProjectRowById(id);
                    if (!project || !projectScope.projectIds.has(id)) return [] as any[];
                    return listProjectExpensesForCompany(project.company_id, id);
                }),
            );
            return reply.send({ expenses: expenses.flat() });
        } catch (err: any) {
            app.log.error(err, 'Failed to list project-scoped expenses');
            return reply.status(500).send({ error: 'Failed to load supplier bills.' });
        }
    });

    app.post('/api/project-expenses', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        const body = request.body as { expense?: any };
        const payload = body?.expense ?? body;
        if (!payload?.projectId) {
            return reply.status(400).send({ error: 'Project is required.' });
        }

        if (!payload?.category && !payload?.description && !payload?.supplierName && !payload?.supplierBillNumber && !payload?.billAmount) {
            return reply.status(400).send({ error: 'Expense details are required.' });
        }

        try {
            const result = await createProjectExpenseForProject(payload.projectId, membership.companyId, payload, membership.userId);
            return reply.status(201).send({ expense: result });
        } catch (err: any) {
            app.log.error(err, 'Failed to create project expense');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 404 || statusCode === 403) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to save supplier bill.' });
        }
    });

    app.put('/api/project-expenses/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = request.body as { expense?: any };
        const payload = body?.expense ?? body;

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const row = await getProjectExpenseRowById(id);
                return row?.project?.company_id ?? null;
            },
            { allowedRoles: COMPANY_MANAGEMENT_ROLES },
        );
        if (!membership) return;

        try {
            const result = await updateProjectExpenseRow(id, membership.companyId, payload ?? {});
            return reply.send({ expense: result });
        } catch (err: any) {
            app.log.error(err, 'Failed to update project expense');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 404 || statusCode === 403) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to update supplier bill.' });
        }
    });

    app.delete('/api/project-expenses/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const row = await getProjectExpenseRowById(id);
                return row?.project?.company_id ?? null;
            },
            { allowedRoles: COMPANY_MANAGEMENT_ROLES },
        );
        if (!membership) return;

        try {
            await voidProjectExpenseRow(id, membership.companyId);
            return reply.send({ ok: true });
        } catch (err: any) {
            app.log.error(err, 'Failed to delete project expense');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 404 || statusCode === 403) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to delete supplier bill.' });
        }
    });

    // ─── Project receipts (client payments) ───────────────────────────────────
    app.get('/api/project-receipts', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (membership) {
            const projectId = (request.query as { projectId?: string }).projectId;
            if (!projectId) {
                return reply.status(400).send({ error: 'Project is required.' });
            }

            try {
                const companyProjectId = await getProjectCompanyId(projectId);
                if (!companyProjectId || companyProjectId !== membership.companyId) {
                    return reply.status(403).send({ error: 'Forbidden.' });
                }

                const receipts = await listProjectReceiptsForProject(projectId, membership.companyId);
                return reply.send({ receipts });
            } catch (err: any) {
                app.log.error(err, 'Failed to list project receipts');
                return reply.status(500).send({ error: 'Failed to load client receipts.' });
            }
        }

        const projectId = (request.query as { projectId?: string }).projectId;
        if (!projectId) {
            return reply.status(400).send({ error: 'Project is required.' });
        }
        const projectScope = await getProjectScopedAccessForRead(request, reply, 'project receipts', projectId, {
            requireClientReceiptAccess: true,
        });
        if (!projectScope) return;

        const project = await getProjectRowById(projectId);
        if (!project) {
            return reply.status(404).send({ error: 'Project not found.' });
        }

        const receipts = await listProjectReceiptsForProject(projectId, project.company_id);
        return reply.send({ receipts });
    });

    app.post('/api/project-receipts', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        const body = request.body as { receipt?: any };
        const payload = body?.receipt ?? body;
        if (!payload?.projectId) {
            return reply.status(400).send({ error: 'Project is required.' });
        }

        try {
            const receipt = await createProjectReceiptForProject(payload.projectId, membership.companyId, payload, membership.userId);
            return reply.status(201).send({ receipt });
        } catch (err: any) {
            app.log.error(err, 'Failed to create project receipt');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 403) return reply.status(403).send({ error: err.message || 'Forbidden.' });
            if (statusCode === 404) return reply.status(404).send({ error: err.message || 'Resource not found.' });
            if (statusCode === 409) return reply.status(409).send({ error: err.message });
            const isProduction = process.env.NODE_ENV === 'production';
            return reply.status(500).send({
                error: isProduction ? 'Failed to save client receipt.' : (err.message || 'Failed to save client receipt.'),
            });
        }
    });

    app.put('/api/project-receipts/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = request.body as { receipt?: any };
        const payload = body?.receipt ?? body;

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const row = await getProjectReceiptRowById(id);
                return row?.project?.company_id ?? null;
            },
            { allowedRoles: COMPANY_MANAGEMENT_ROLES },
        );
        if (!membership) return;

        try {
            const result = await updateProjectReceiptRow(id, membership.companyId, payload ?? {});
            return reply.send({ receipt: result });
        } catch (err: any) {
            app.log.error(err, 'Failed to update project receipt');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404 || statusCode === 409) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to update client receipt.' });
        }
    });

    app.delete('/api/project-receipts/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const row = await getProjectReceiptRowById(id);
                return row?.project?.company_id ?? null;
            },
            { allowedRoles: COMPANY_MANAGEMENT_ROLES },
        );
        if (!membership) return;

        try {
            await voidProjectReceiptRow(id, membership.companyId);
            return reply.send({ ok: true });
        } catch (err: any) {
            app.log.error(err, 'Failed to delete project receipt');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to delete client receipt.' });
        }
    });
}
