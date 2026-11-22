/**
 * routeHelpers.ts
 *
 * Shared utilities used across multiple route files.
 * These were previously inline in index.ts.
 */

import { supabaseAdmin } from './auth.js';
import type { CompanyMembership } from './authz.js';
import {
    getPrimaryMembership,
    requireAuth,
    resolveProjectScopedAccess,
} from './authz.js';
import { listProjectExpensesForCompany } from './projects.js';

// ─── Error sanitization ──────────────────────────────────────────────────────

const TECHNICAL_ERROR_PATTERN =
    /(insert failed|update failed|delete failed|sql|postgres|supabase|stack|trace|exception|jwt_secret|razorpay_key|ecconn|enotfound|econnreset|econnrefused|pgrst|schema|relation|column|table|violates|duplicate key value|syntax error|permission denied)/i;

export function fallbackErrorByStatus(statusCode: number): string {
    if (statusCode === 400) return 'Please check the entered information and try again.';
    if (statusCode === 401) return 'Your session has expired. Please sign in again.';
    if (statusCode === 403) return 'You do not have permission to perform this action.';
    if (statusCode === 404) return 'The requested record could not be found.';
    if (statusCode === 409) return 'This record conflicts with existing information. Please review and try again.';
    if (statusCode === 422) return 'Please correct the highlighted fields and try again.';
    if (statusCode === 429) return 'Too many requests. Please wait a moment and try again.';
    if (statusCode >= 500) return 'Something went wrong on our side. Please try again later.';
    return 'Something went wrong. Please try again.';
}

export function sanitizeUserFacingError(error: unknown, statusCode: number): string {
    if (typeof error !== 'string') return fallbackErrorByStatus(statusCode);
    const trimmed = error.trim();
    if (!trimmed) return fallbackErrorByStatus(statusCode);
    if (TECHNICAL_ERROR_PATTERN.test(trimmed)) return fallbackErrorByStatus(statusCode);
    return trimmed;
}

// ─── Date / number utilities ─────────────────────────────────────────────────

export function parseNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number(value) || 0;
    return 0;
}

export function parseDateOrNull(value: unknown): Date | null {
    if (!value || typeof value !== 'string') return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function inDateRange(
    value: unknown,
    from?: Date | null,
    to?: Date | null,
): boolean {
    const date = parseDateOrNull(value);
    if (!date) return false;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
}

export function toMoney(value: unknown): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

export function monthKeyFromDate(value: string | Date | null | undefined): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function yearKeyFromDate(value: string | Date | null | undefined): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return String(date.getFullYear());
}

export function formatMoneyNumber(value: number): number {
    return Number(value.toFixed(2));
}

export function getRequestMeta(request: any): { userAgent: string | null; ip: string | null } {
    return {
        userAgent: (request.headers['user-agent'] as string | undefined) ?? null,
        ip: request.ip ?? null,
    };
}

// ─── Project-scoped access helper ────────────────────────────────────────────

export async function getProjectScopedAccessForRead(
    request: any,
    reply: any,
    routeName: string,
    projectId?: string | null,
    options?: { requireFinancialAccess?: boolean; requireClientReceiptAccess?: boolean },
): Promise<{ projectIds: Set<string>; membership: CompanyMembership | null; projectScope: any } | null> {
    const userId = requireAuth(request, reply);
    if (!userId) return null;

    const membership = await getPrimaryMembership(userId);
    if (membership) {
        return { projectIds: new Set<string>(), membership, projectScope: null };
    }

    const projectScope = await resolveProjectScopedAccess(userId);
    if (!projectScope || projectScope.authorizedProjectIds.length === 0) {
        reply.status(403).send({ error: `Forbidden: ${routeName}` });
        return null;
    }

    if (projectId && !projectScope.authorizedProjectIds.includes(projectId)) {
        reply.status(403).send({ error: `Forbidden: ${routeName}` });
        return null;
    }

    if (options?.requireFinancialAccess && !projectScope.investorFinancialAccess) {
        reply.status(403).send({ error: `Forbidden: ${routeName}` });
        return null;
    }

    if (options?.requireClientReceiptAccess && !projectScope.investorClientReceiptAccess) {
        reply.status(403).send({ error: `Forbidden: ${routeName}` });
        return null;
    }

    return { projectIds: new Set(projectScope.authorizedProjectIds), membership: null, projectScope };
}

// ─── Outstanding expense helper ───────────────────────────────────────────────

export async function getOutstandingByExpenseId(
    companyId: string,
    projectId?: string | null,
): Promise<Map<string, number>> {
    const expenses = await listProjectExpensesForCompany(companyId, projectId ?? null);
    const expenseIds = expenses.map((row) => row.id).filter(Boolean);
    const outstanding = new Map<string, number>();
    if (expenseIds.length === 0) return outstanding;

    const { data: paymentRows, error: paymentsError } = await supabaseAdmin
        .from('project_expense_payments')
        .select('project_expense_id, amount, voided_at')
        .in('project_expense_id', expenseIds);
    if (paymentsError) throw paymentsError;

    const paidByExpense = new Map<string, number>();
    for (const payment of paymentRows ?? []) {
        if (payment.voided_at) continue;
        const expenseId = String(payment.project_expense_id ?? '');
        if (!expenseId) continue;
        paidByExpense.set(expenseId, (paidByExpense.get(expenseId) ?? 0) + Number(payment.amount ?? 0));
    }

    for (const expense of expenses) {
        if (expense.status === 'void') continue;
        const billAmount = Number(expense.bill_amount ?? 0);
        const paidAmount = paidByExpense.get(expense.id) ?? 0;
        outstanding.set(expense.id, Math.max(0, billAmount - paidAmount));
    }

    return outstanding;
}

// ─── Financial report helpers ─────────────────────────────────────────────────

export async function getCompanyFinancialReport(companyId: string, projectId?: string | null) {
    const [projects, invoices, expenses, receipts, allocations, investors, customers, expensePayments] = await Promise.all([
        (await import('./projects.js')).listProjectsForCompany(companyId),
        supabaseAdmin.from('invoices').select('*').eq('company_id', companyId).then((r) => r.data ?? []),
        supabaseAdmin.from('project_expenses').select('*').eq('company_id', companyId).then((r) => r.data ?? []),
        supabaseAdmin.from('project_receipts').select('*').eq('company_id', companyId).then((r) => r.data ?? []),
        supabaseAdmin.from('payment_allocations').select('*').eq('company_id', companyId).then((r) => r.data ?? []),
        supabaseAdmin.from('project_investor_contributions').select('*').eq('company_id', companyId).then((r) => r.data ?? []),
        supabaseAdmin.from('customers').select('id, name').eq('company_id', companyId).then((r) => r.data ?? []),
        supabaseAdmin.from('project_expense_payments').select('project_expense_id, amount, voided_at').eq('company_id', companyId).then((r) => r.data ?? []),
    ]);

    const allProjects = projects ?? [];
    const scopedProjects = projectId
        ? allProjects.filter((p: any) => p.id === projectId)
        : allProjects;
    const projectIds = new Set(scopedProjects.map((p: any) => p.id));
    const isInScope = (rowProjectId: string | null | undefined) => {
        if (projectId) return rowProjectId === projectId || (!rowProjectId && projectId === 'company-wide');
        return !rowProjectId || projectIds.has(rowProjectId);
    };
    const customerMap = new Map((customers ?? []).map((c: any) => [c.id, c]));

    const invoiceRows = (invoices ?? []).filter((inv: any) => {
        return isInScope(inv.project_id);
    });
    const expenseRows = (expenses ?? []).filter((exp: any) => {
        return isInScope(exp.project_id);
    });
    const receiptRows = (receipts ?? []).filter((rec: any) => {
        return isInScope(rec.project_id);
    });
    const investorRows = (investors ?? []).filter((contribution: any) => isInScope(contribution.project_id));

    const issuedInvoices = invoiceRows.filter((inv: any) => String(inv.status ?? '').trim() === 'Issued');
    const issuedInvoiceIds = new Set(issuedInvoices.map((inv: any) => inv.id));
    const paidAllocations = (allocations ?? []).filter((a: any) => issuedInvoiceIds.has(a.invoice_id));

    const allocatedByInvoice = new Map<string, number>();
    for (const allocation of paidAllocations) {
        const next = (allocatedByInvoice.get(allocation.invoice_id) ?? 0) + toMoney(allocation.allocated_amount);
        allocatedByInvoice.set(allocation.invoice_id, next);
    }

    const totalBilled = issuedInvoices.reduce((s: number, inv: any) => s + toMoney(inv.grand_total), 0);
    const totalCollected = receiptRows
        .filter((r: any) => !r.voided_at)
        .reduce((s: number, r: any) => s + toMoney(r.amount), 0);
    const totalExpenses = expenseRows
        .filter((e: any) => (e.status ?? 'void') !== 'void')
        .reduce((s: number, e: any) => s + toMoney(e.bill_amount), 0);
    const investorContributions = investorRows.reduce((s: number, c: any) => s + toMoney(c.amount), 0);
    const totalOutstanding = issuedInvoices.reduce((s: number, inv: any) => {
        const paid = allocatedByInvoice.get(inv.id) ?? 0;
        return s + Math.max(0, toMoney(inv.grand_total) - paid);
    }, 0);

    const collectionEfficiency = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;
    const expenseIdsInScope = new Set(expenseRows.map((e: any) => String(e.id ?? '')).filter(Boolean));

    // Actual expense cash outflow must come from valid payment entries, not bill amounts.
    const paidByExpense = new Map<string, number>();
    for (const payment of expensePayments ?? []) {
        if (payment.voided_at) continue;
        const expId = String(payment.project_expense_id ?? '');
        if (!expId || !expenseIdsInScope.has(expId)) continue;
        paidByExpense.set(expId, (paidByExpense.get(expId) ?? 0) + toMoney(payment.amount));
    }
    const totalExpensePayments = Array.from(paidByExpense.values()).reduce((sum, value) => sum + value, 0);
    const netCashFlow = totalCollected - totalExpensePayments;

    // ── Supplier outstanding: bill_amount minus actual (non-voided) payments ──
    const supplierOutstanding = expenseRows
        .filter((e: any) => (e.status ?? 'void') !== 'void')
        .reduce((sum: number, e: any) => {
            const bill = toMoney(e.bill_amount);
            const paid = paidByExpense.get(e.id) ?? 0;
            return sum + Math.max(0, bill - paid);
        }, 0);

    const defaulters = Array.from(
        issuedInvoices
            .reduce((map: Map<string, any>, inv: any) => {
                const outstanding = Math.max(0, toMoney(inv.grand_total) - (allocatedByInvoice.get(inv.id) ?? 0));
                if (outstanding <= 0) return map;
                const customerId = inv.customer_id ?? 'unknown';
                const existing = map.get(customerId) ?? {
                    customerId,
                    customerName: customerMap.get(customerId)?.name ?? 'Unknown customer',
                    outstanding: 0,
                    invoices: 0,
                    dueInvoices: 0,
                };
                existing.outstanding += outstanding;
                existing.invoices += 1;
                if (inv.due_date) {
                    const dueDate = new Date(inv.due_date);
                    if (!Number.isNaN(dueDate.getTime()) && dueDate < new Date()) existing.dueInvoices += 1;
                }
                map.set(customerId, existing);
                return map;
            }, new Map())
            .values(),
    )
        .map((row: any) => ({ ...row, outstanding: formatMoneyNumber(row.outstanding) }))
        .sort((a: any, b: any) => b.outstanding - a.outstanding);

    const projectSummaries = scopedProjects.map((project: any) => {
        const pInvoices = issuedInvoices.filter((inv: any) => inv.project_id === project.id);
        const pExpenses = expenseRows.filter((e: any) => e.project_id === project.id && (e.status ?? 'void') !== 'void');
        const pReceipts = receiptRows.filter((r: any) => r.project_id === project.id && !r.voided_at);

        const billed = pInvoices.reduce((s: number, inv: any) => s + toMoney(inv.grand_total), 0);
        const collected = pReceipts.reduce((s: number, r: any) => s + toMoney(r.amount), 0);
        const exps = pExpenses.reduce((s: number, e: any) => s + toMoney(e.bill_amount), 0);
        const paidExpenses = pExpenses.reduce((s: number, e: any) => s + (paidByExpense.get(e.id) ?? 0), 0);
        const outstanding = pInvoices.reduce((s: number, inv: any) => {
            const paid = allocatedByInvoice.get(inv.id) ?? 0;
            return s + Math.max(0, toMoney(inv.grand_total) - paid);
        }, 0);

        const projectBudget = toMoney(project.budget_amount);
        const budgetUtilization = projectBudget > 0 ? formatMoneyNumber((exps / projectBudget) * 100) : null;

        return {
            projectId: project.id,
            projectName: project.name,
            status: project.status ?? 'planned',
            businessModel: project.business_model ?? null,
            contractValue: formatMoneyNumber(toMoney(project.contract_amount)),
            projectedSalesValue: formatMoneyNumber(toMoney(project.projected_sales_value)),
            projectBudget: formatMoneyNumber(projectBudget),
            expectedEndDate: project.expected_end_date ?? null,
            billed: formatMoneyNumber(billed),
            collected: formatMoneyNumber(collected),
            outstanding: formatMoneyNumber(outstanding),
            expenses: formatMoneyNumber(exps),
            netCashFlow: formatMoneyNumber(collected - paidExpenses),
            budgetUtilization,
        };
    });

    // Projects at risk: distinct projects with overdue invoices, budget overrun, or past expected end date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const projectsAtRiskSet = new Set<string>();
    // Overdue invoices
    for (const inv of issuedInvoices) {
        if (!inv.project_id) continue;
        const outstanding = Math.max(0, toMoney(inv.grand_total) - (allocatedByInvoice.get(inv.id) ?? 0));
        if (outstanding > 0 && inv.due_date) {
            const due = new Date(inv.due_date);
            if (!Number.isNaN(due.getTime()) && due < today) {
                projectsAtRiskSet.add(inv.project_id);
            }
        }
    }
    // Budget overrun
    for (const summary of projectSummaries) {
        if (summary.projectBudget > 0 && summary.expenses > summary.projectBudget) {
            projectsAtRiskSet.add(summary.projectId);
        }
        if (summary.expectedEndDate && summary.status !== 'completed' && summary.status !== 'cancelled') {
            const end = new Date(summary.expectedEndDate);
            if (!Number.isNaN(end.getTime()) && end < today) {
                projectsAtRiskSet.add(summary.projectId);
            }
        }
    }

    return {
        totalContract: formatMoneyNumber(projects.reduce((s: number, p: any) => s + toMoney(p.contract_amount), 0)),
        totalBilled: formatMoneyNumber(totalBilled),
        totalCollected: formatMoneyNumber(totalCollected),
        totalOutstanding: formatMoneyNumber(totalOutstanding),
        totalExpenses: formatMoneyNumber(totalExpenses),
        totalCost: formatMoneyNumber(totalExpenses),
        totalCollections: formatMoneyNumber(totalCollected),
        supplierOutstanding: formatMoneyNumber(supplierOutstanding),
        netCashFlow: formatMoneyNumber(netCashFlow),
        collectionEfficiency: formatMoneyNumber(collectionEfficiency),
        defaulters,
        projectSummaries,
        projectsCount: scopedProjects.length,
        activeProjects: scopedProjects.filter((p: any) => p.status === 'in_progress' || p.status === 'planned').length,
        projectsAtRisk: projectsAtRiskSet.size,
    };
}

export async function getCompanyFinancialMonthlySeries(companyId: string, projectId?: string | null) {
    const report = await getCompanyFinancialReport(companyId, projectId);
    const isInScope = (rowProjectId: string | null | undefined) => {
        if (!projectId) return true;
        return rowProjectId === projectId || (!rowProjectId && projectId === 'company-wide');
    };
    const [invoices, expenses, receipts] = await Promise.all([
        supabaseAdmin.from('invoices').select('*').eq('company_id', companyId).then((r) =>
            (r.data ?? []).filter((inv: any) => {
                return isInScope(inv.project_id);
            }),
        ),
        supabaseAdmin.from('project_expenses').select('*').eq('company_id', companyId).then((r) =>
            (r.data ?? []).filter((exp: any) => isInScope(exp.project_id)),
        ),
        supabaseAdmin.from('project_receipts').select('*').eq('company_id', companyId).then((r) =>
            (r.data ?? []).filter((rec: any) => isInScope(rec.project_id)),
        ),
    ]);

    const monthMap = new Map<string, any>();
    for (const inv of invoices.filter((r: any) => String(r.status ?? '').trim() === 'Issued')) {
        const key = monthKeyFromDate(inv.invoice_date ?? inv.created_at);
        if (!key) continue;
        const cur = monthMap.get(key) ?? { month: key, billed: 0, collected: 0, expenses: 0, netCashFlow: 0 };
        cur.billed += toMoney(inv.grand_total);
        monthMap.set(key, cur);
    }
    for (const rec of receipts.filter((r: any) => !r.voided_at)) {
        const key = monthKeyFromDate(rec.received_date ?? rec.created_at);
        if (!key) continue;
        const cur = monthMap.get(key) ?? { month: key, billed: 0, collected: 0, expenses: 0, netCashFlow: 0 };
        cur.collected += toMoney(rec.amount);
        monthMap.set(key, cur);
    }
    for (const exp of expenses.filter((r: any) => (r.status ?? 'void') !== 'void')) {
        const key = monthKeyFromDate(exp.bill_date ?? exp.created_at);
        if (!key) continue;
        const cur = monthMap.get(key) ?? { month: key, billed: 0, collected: 0, expenses: 0, netCashFlow: 0 };
        cur.expenses += toMoney(exp.bill_amount);
        monthMap.set(key, cur);
    }

    const monthly = Array.from(monthMap.values())
        .map((entry: any) => ({
            month: entry.month,
            billed: formatMoneyNumber(entry.billed),
            collected: formatMoneyNumber(entry.collected),
            expenses: formatMoneyNumber(entry.expenses),
            netCashFlow: formatMoneyNumber(entry.collected - entry.expenses),
        }))
        .sort((a: any, b: any) => a.month.localeCompare(b.month));

    return {
        summary: {
            totalBilled: report.totalBilled,
            totalCollected: report.totalCollected,
            totalExpenses: report.totalExpenses,
            totalOutstanding: report.totalOutstanding,
            netCashFlow: report.netCashFlow,
        },
        monthly,
    };
}

export async function getCompanyFinancialYearlySeries(companyId: string, projectId?: string | null) {
    const [invoices, expenses, receipts, investorContributions] = await Promise.all([
        supabaseAdmin.from('invoices').select('*').eq('company_id', companyId).then((r) => r.data ?? []),
        supabaseAdmin.from('project_expenses').select('*').eq('company_id', companyId).then((r) => r.data ?? []),
        supabaseAdmin.from('project_receipts').select('*').eq('company_id', companyId).then((r) => r.data ?? []),
        supabaseAdmin.from('project_investor_contributions').select('*').eq('company_id', companyId).then((r) => r.data ?? []),
    ]);

    const filteredInvoices = invoices.filter((r: any) => {
        const inScope = projectId
            ? r.project_id === projectId || (!r.project_id && projectId === 'company-wide')
            : true;
        return inScope && String(r.status ?? '').trim() === 'Issued';
    });
    const filteredReceipts = receipts.filter((r: any) => {
        if (projectId) return r.project_id === projectId || (!r.project_id && projectId === 'company-wide');
        return !r.voided_at;
    });
    const filteredExpenses = expenses.filter((r: any) => {
        const inScope = projectId
            ? r.project_id === projectId || (!r.project_id && projectId === 'company-wide')
            : true;
        return inScope && (r.status ?? 'void') !== 'void';
    });
    const filteredContributions = investorContributions.filter((r: any) => {
        if (projectId) return r.project_id === projectId || (!r.project_id && projectId === 'company-wide');
        return true;
    });

    const yearMap = new Map<string, any>();
    for (const inv of filteredInvoices) {
        const key = yearKeyFromDate(inv.invoice_date ?? inv.created_at);
        if (!key) continue;
        const cur = yearMap.get(key) ?? { year: key, billed: 0, collected: 0, expenses: 0, netCashFlow: 0 };
        cur.billed += toMoney(inv.grand_total);
        yearMap.set(key, cur);
    }
    for (const rec of filteredReceipts.filter((r: any) => !r.voided_at)) {
        const key = yearKeyFromDate(rec.received_date ?? rec.created_at);
        if (!key) continue;
        const cur = yearMap.get(key) ?? { year: key, billed: 0, collected: 0, expenses: 0, netCashFlow: 0 };
        cur.collected += toMoney(rec.amount);
        yearMap.set(key, cur);
    }
    for (const exp of filteredExpenses) {
        const key = yearKeyFromDate(exp.bill_date ?? exp.created_at);
        if (!key) continue;
        const cur = yearMap.get(key) ?? { year: key, billed: 0, collected: 0, expenses: 0, netCashFlow: 0 };
        cur.expenses += toMoney(exp.bill_amount);
        yearMap.set(key, cur);
    }
    for (const contribution of filteredContributions) {
        const key = yearKeyFromDate(contribution.contribution_date ?? contribution.created_at);
        if (!key) continue;
        const cur = yearMap.get(key) ?? { year: key, billed: 0, collected: 0, expenses: 0, netCashFlow: 0 };
        cur.netCashFlow += toMoney(contribution.amount);
        yearMap.set(key, cur);
    }

    return Array.from(yearMap.values())
        .map((entry: any) => ({
            year: entry.year,
            billed: formatMoneyNumber(entry.billed),
            collected: formatMoneyNumber(entry.collected),
            expenses: formatMoneyNumber(entry.expenses),
            netCashFlow: formatMoneyNumber(entry.collected + entry.netCashFlow - entry.expenses),
        }))
        .sort((a: any, b: any) => a.year.localeCompare(b.year));
}

// ─── Quotation helpers (used by both quotations and flatBilling routes) ───────

export function mapStatusToDb(status: string): string {
    switch (status) {
        case 'DRAFT': return 'Draft';
        case 'GENERATED': return 'Generated';
        case 'SENT': return 'Sent';
        case 'ACCEPTED': return 'Accepted';
        case 'REJECTED': return 'Rejected';
        case 'EXPIRED': return 'Expired';
        default: return 'Draft';
    }
}

export async function getQuotationRowsForCompany(companyId: string) {
    const { data, error } = await supabaseAdmin
        .from('documents')
        .select(`*, customers(name,mobile,email,address,city,state,pincode), document_sections(id,section_name,display_order,document_items(*)), document_specifications(*), document_inclusions(*), document_exclusions(*), payment_schedules(*), document_terms(*)`)
        .eq('company_id', companyId)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
}

export async function getQuotationRowById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('documents')
        .select(`*, customers(name,mobile,email,address,city,state,pincode), document_sections(id,section_name,display_order,document_items(*)), document_specifications(*), document_inclusions(*), document_exclusions(*), payment_schedules(*), document_terms(*)`)
        .eq('id', id)
        .eq('is_deleted', false)
        .maybeSingle();
    if (error) throw error;
    return data;
}
