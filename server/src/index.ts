import cors from '@fastify/cors';
import Fastify from 'fastify';
import {
    comparePassword,
    createUser,
    createUserProfile,
    findUserByEmail,
    findUserById,
    getErrorText,
    getUserProfile,
    hashPassword,
    isTransientNetworkError,
    signJwt,
    supabaseAdmin,
    updateLastLogin,
    updateUserPassword,
    verifyJwt,
} from './auth.js';
import type { CompanyMembership } from './authz.js';
import {
    authorizeCompany,
    authorizeOwnedResource,
    COMPANY_MANAGEMENT_ROLES,
    COMPANY_READ_ROLES,
    ensureCompanyMembership,
    getPrimaryMembership,
    QUOTATION_ROLES,
    requireAuth,
    resolveProjectScopedAccess,
} from './authz.js';
import {
    BUSINESS_MODEL_VALUES,
    calculateProjectedMargin,
    DEFAULT_ENABLED_BUSINESS_MODELS,
    normalizeBusinessModel,
    normalizeBusinessModels,
    type BusinessModel,
} from './businessModels.js';
import {
    createCompany,
    createCompanySettings,
    getCompanyById,
    updateCompany,
    upsertCompanySettings,
} from './company.js';
import {
    createCustomerForCompany,
    deleteCustomerRow,
    getCustomerRow,
    listCustomersForCompany,
    updateCustomerRow,
} from './customers.js';
import {
    getFlatBillingRow,
    listFlatBillingsForCompany,
    saveFlatBillingToDatabase,
    softDeleteFlatBilling,
} from './flatBilling.js';
import {
    cancelInvoiceRow,
    createInvoiceForCompany,
    deleteInvoiceRow,
    getInvoiceRowById,
    issueInvoiceRow,
    listInvoicesForCompany,
    peekNextInvoiceNumber,
    updateInvoiceRow,
    validateInvoicePayload,
} from './invoices.js';
import {
    createMaterialReceiptForProject,
    deleteMaterialReceiptForProject,
    getMaterialReceiptById,
    listMaterialReceiptsForProject,
} from './materialReceipts.js';
import {
    createPartyForCompany,
    deletePartyRow,
    getPartyRow,
    listPartiesForCompany,
    updatePartyRow,
} from './parties.js';
import {
    createInvestorContributionForInvestor,
    createProjectAttachmentForProject,
    createProjectClientAccessForProject,
    createProjectExpenseForProject,
    createProjectExpensePaymentForExpense,
    createProjectForCompany,
    createProjectFromQuotation,
    createProjectInvestorForProject,
    createProjectProgressUpdateForProject,
    createProjectReceiptForProject,
    createProjectStageForProject,
    createProjectUnitForProject,
    deleteInvestorContributionRow,
    deleteProjectAttachmentRow,
    deleteProjectInvestorRow,
    deleteProjectProgressUpdateRow,
    deleteProjectStageRow,
    deleteProjectUnitRow,
    generateProjectNumber,
    getInvestorContributionRowById,
    getProjectCompanyId,
    getProjectExpensePaymentRowById,
    getProjectExpenseRowById,
    getProjectInvestorCompanyIdById,
    getProjectInvestorRowById,
    getProjectProgressUpdateRowById,
    getProjectReceiptRowById,
    getProjectRowById,
    getProjectStageRowById,
    getProjectUnitRowById,
    listInvestorContributionsForInvestor,
    listProjectAttachmentsForProject,
    listProjectClientAccessForProject,
    listProjectExpensePaymentsForExpense,
    listProjectExpensesForCompany,
    listProjectInvestorsForProject,
    listProjectProgressUpdatesForProject,
    listProjectReceiptsForProject,
    listProjectsForCompany,
    listProjectStagesForProject,
    listProjectUnitsForProject,
    revokeProjectClientAccessRow,
    updateInvestorContributionRow,
    updateProjectExpensePaymentRow,
    updateProjectExpenseRow,
    updateProjectInvestorRow,
    updateProjectProgressUpdateRow,
    updateProjectReceiptRow,
    updateProjectRow,
    updateProjectStageRow,
    updateProjectUnitRow,
    voidProjectExpensePaymentRow,
    voidProjectExpenseRow,
    voidProjectReceiptRow
} from './projects.js';
import {
    cancelPurchaseOrder,
    createPurchaseOrderForProject,
    getPurchaseOrderById,
    listPurchaseOrdersForProject,
    updatePurchaseOrderForProject,
    updatePurchaseOrderStatus,
} from './purchaseOrders.js';
import {
    createReceiptAllocationForInvoice,
    createReceiptForCompany,
    deleteReceiptRow,
    getReceiptRowById,
    listPaymentAllocationsForInvoice,
    listPaymentAllocationsForReceipt,
    listReceiptsForCompany,
    updateReceiptRow,
} from './receipts.js';
import { allocateDocumentNumber, peekNextDocumentNumber } from './sequence.js';
import {
    applySuccessfulPayment,
    cancelSubscription,
    confirmPaymentFromWebhook,
    createRazorpayOrder,
    getSubscriptionSummary,
    releaseQuotationSlot,
    reserveQuotationSlot,
    verifyRazorpaySignature,
    verifyRazorpayWebhookSignature,
    type BillingCycle,
} from './subscription.js';
import {
    createSupplierForCompany,
    deleteSupplierRow,
    getSupplierRow,
    listSuppliersForCompany,
    updateSupplierRow,
} from './suppliers.js';
import { createOrLinkTeamMember, listTeamMembers, updateTeamMember } from './team.js';
import {
    findActivePasswordReset,
    findActiveRefreshToken,
    issuePasswordResetToken,
    issueRefreshToken,
    markPasswordResetUsed,
    revokeAllRefreshTokensForUser,
    revokeRefreshToken,
} from './tokens.js';
import {
    isNonEmptyString,
    validateAddTeamMemberPayload,
    validateCompanyPayload,
    validateCustomerPayload,
    validateFlatBillingPayload,
    validatePartyPayload,
    validateProjectPayload,
    validateQuotationPayload,
    validateSupplierPayload,
} from './validation.js';

const app = Fastify({ logger: true, bodyLimit: 10 * 1024 * 1024 }); // 10 MB — safer headroom for base64-encoded logo/signature payloads

const TECHNICAL_ERROR_PATTERN = /(insert failed|update failed|delete failed|sql|postgres|supabase|stack|trace|exception|jwt_secret|razorpay_key|ecconn|enotfound|econnrefused|pgrst|schema|relation|column|table|violates|duplicate key value|syntax error|permission denied)/i;

function fallbackErrorByStatus(statusCode: number): string {
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

function sanitizeUserFacingError(error: unknown, statusCode: number): string {
    if (typeof error !== 'string') return fallbackErrorByStatus(statusCode);
    const trimmed = error.trim();
    if (!trimmed) return fallbackErrorByStatus(statusCode);
    if (TECHNICAL_ERROR_PATTERN.test(trimmed)) return fallbackErrorByStatus(statusCode);
    return trimmed;
}

app.addHook('preSerialization', async (_request, reply, payload) => {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload;
    const nextPayload = payload as Record<string, unknown>;
    if (typeof nextPayload.error === 'string') {
        nextPayload.error = sanitizeUserFacingError(nextPayload.error, reply.statusCode);
    }
    return nextPayload;
});

// Captures the raw request body alongside the normally-parsed JSON. Needed
// ONLY for the Razorpay webhook (POST /api/webhooks/razorpay), whose
// signature is computed over the exact raw bytes Razorpay sent — re-stringifying
// the parsed object would not reliably reproduce the same bytes. Every other
// route is unaffected: request.body is still the parsed JSON object exactly
// as before.
app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (request, body, done) => {
    (request as any).rawBody = body;
    if (!body || body.length === 0) {
        done(null, {});
        return;
    }
    try {
        done(null, JSON.parse(body.toString('utf8')));
    } catch (err) {
        done(err as Error, undefined);
    }
});

function parseNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number(value) || 0;
    return 0;
}

function parseDateOrNull(value: unknown): Date | null {
    if (!value || typeof value !== 'string') return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function inDateRange(value: unknown, from?: Date | null, to?: Date | null): boolean {
    const date = parseDateOrNull(value);
    if (!date) return false;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
}

function toMoney(value: unknown): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function monthKeyFromDate(value: string | Date | null | undefined): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function yearKeyFromDate(value: string | Date | null | undefined): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return String(date.getFullYear());
}

function formatMoneyNumber(value: number): number {
    return Number(value.toFixed(2));
}

async function getCompanyFinancialReport(companyId: string, projectId?: string | null) {
    const [projects, invoices, expenses, receipts, allocations, investors, customers] = await Promise.all([
        listProjectsForCompany(companyId),
        supabaseAdmin.from('invoices').select('*').eq('company_id', companyId).then((result) => result.data ?? []),
        supabaseAdmin.from('project_expenses').select('*').eq('company_id', companyId).then((result) => result.data ?? []),
        supabaseAdmin.from('project_receipts').select('*').eq('company_id', companyId).then((result) => result.data ?? []),
        supabaseAdmin.from('payment_allocations').select('*').eq('company_id', companyId).then((result) => result.data ?? []),
        supabaseAdmin.from('project_investor_contributions').select('*').eq('company_id', companyId).then((result) => result.data ?? []),
        supabaseAdmin.from('customers').select('id, name').eq('company_id', companyId).then((result) => result.data ?? []),
    ]);

    const projectIds = new Set((projects ?? []).map((project: any) => project.id));
    const customerMap = new Map((customers ?? []).map((customer: any) => [customer.id, customer]));
    const invoiceRows = (invoices ?? []).filter((invoice: any) => {
        if (projectId) return invoice.project_id === projectId || (!invoice.project_id && projectId === 'company-wide');
        return !invoice.project_id || projectIds.has(invoice.project_id);
    });
    const expenseRows = (expenses ?? []).filter((expense: any) => {
        if (projectId) return expense.project_id === projectId || (!expense.project_id && projectId === 'company-wide');
        return !expense.project_id || projectIds.has(expense.project_id);
    });
    const receiptRows = (receipts ?? []).filter((receipt: any) => {
        if (projectId) return receipt.project_id === projectId || (!receipt.project_id && projectId === 'company-wide');
        return !receipt.project_id || projectIds.has(receipt.project_id);
    });

    const issuedInvoices = invoiceRows.filter((invoice: any) => String(invoice.status ?? '').trim() !== 'Cancelled');
    const issuedInvoiceIds = new Set(issuedInvoices.map((invoice: any) => invoice.id));
    const paidAllocations = (allocations ?? []).filter((allocation: any) => issuedInvoiceIds.has(allocation.invoice_id));

    const allocatedByInvoice = new Map<string, number>();
    for (const allocation of paidAllocations) {
        const nextTotal = (allocatedByInvoice.get(allocation.invoice_id) ?? 0) + toMoney(allocation.allocated_amount);
        allocatedByInvoice.set(allocation.invoice_id, nextTotal);
    }

    const totalBilled = issuedInvoices.reduce((sum: number, invoice: any) => sum + toMoney(invoice.grand_total), 0);
    const totalCollected = receiptRows.filter((receipt: any) => !receipt.voided_at).reduce((sum: number, receipt: any) => sum + toMoney(receipt.amount), 0);
    const totalExpenses = expenseRows.filter((expense: any) => (expense.status ?? 'void') !== 'void').reduce((sum: number, expense: any) => sum + toMoney(expense.bill_amount), 0);
    const investorContributions = (investors ?? []).reduce((sum: number, contribution: any) => sum + toMoney(contribution.amount), 0);
    const totalOutstanding = issuedInvoices.reduce((sum: number, invoice: any) => {
        const paid = allocatedByInvoice.get(invoice.id) ?? 0;
        const outstanding = Math.max(0, toMoney(invoice.grand_total) - paid);
        return sum + outstanding;
    }, 0);

    const collectionEfficiency = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;
    const netCashFlow = totalCollected - totalExpenses;

    const defaulters = Array.from(
        issuedInvoices.reduce((map: Map<string, any>, invoice: any) => {
            const outstanding = Math.max(0, toMoney(invoice.grand_total) - (allocatedByInvoice.get(invoice.id) ?? 0));
            if (outstanding <= 0) return map;
            const customerId = invoice.customer_id ?? 'unknown';
            const existing = map.get(customerId) ?? {
                customerId,
                customerName: customerMap.get(customerId)?.name ?? 'Unknown customer',
                outstanding: 0,
                invoices: 0,
                dueInvoices: 0,
            };
            existing.outstanding += outstanding;
            existing.invoices += 1;
            if (invoice.due_date) {
                const dueDate = new Date(invoice.due_date);
                if (!Number.isNaN(dueDate.getTime()) && dueDate < new Date()) existing.dueInvoices += 1;
            }
            map.set(customerId, existing);
            return map;
        }, new Map()).values(),
    )
        .map((row: any) => ({ ...row, outstanding: formatMoneyNumber(row.outstanding) }))
        .sort((a: any, b: any) => b.outstanding - a.outstanding);

    const projectSummaries = (projects ?? []).map((project: any) => {
        const projectInvoices = issuedInvoices.filter((invoice: any) => invoice.project_id === project.id);
        const projectExpenses = expenseRows.filter((expense: any) => expense.project_id === project.id && (expense.status ?? 'void') !== 'void');
        const projectReceipts = receiptRows.filter((receipt: any) => receipt.project_id === project.id && !receipt.voided_at);
        const projectInvestorContributions = (investors ?? []).filter((contribution: any) => contribution.project_id === project.id).reduce((sum: number, contribution: any) => sum + toMoney(contribution.amount), 0);

        const billed = projectInvoices.reduce((sum: number, invoice: any) => sum + toMoney(invoice.grand_total), 0);
        const collected = projectReceipts.reduce((sum: number, receipt: any) => sum + toMoney(receipt.amount), 0);
        const expenses = projectExpenses.reduce((sum: number, expense: any) => sum + toMoney(expense.bill_amount), 0);
        const outstanding = projectInvoices.reduce((sum: number, invoice: any) => {
            const paid = allocatedByInvoice.get(invoice.id) ?? 0;
            return sum + Math.max(0, toMoney(invoice.grand_total) - paid);
        }, 0);

        return {
            projectId: project.id,
            projectName: project.name,
            contractValue: formatMoneyNumber(toMoney(project.contract_amount)),
            billed: formatMoneyNumber(billed),
            collected: formatMoneyNumber(collected),
            outstanding: formatMoneyNumber(outstanding),
            expenses: formatMoneyNumber(expenses),
            netCashFlow: formatMoneyNumber(collected - expenses),
        };
    });

    return {
        totalContract: formatMoneyNumber(projects.reduce((sum: number, project: any) => sum + toMoney(project.contract_amount), 0)),
        totalBilled: formatMoneyNumber(totalBilled),
        totalCollected: formatMoneyNumber(totalCollected),
        totalOutstanding: formatMoneyNumber(totalOutstanding),
        totalExpenses: formatMoneyNumber(totalExpenses),
        totalCost: formatMoneyNumber(totalExpenses),
        totalCollections: formatMoneyNumber(totalCollected),
        supplierOutstanding: formatMoneyNumber(totalOutstanding),
        netCashFlow: formatMoneyNumber(netCashFlow),
        collectionEfficiency: formatMoneyNumber(collectionEfficiency),
        defaulters,
        projectSummaries,
        projectsCount: projects.length,
        activeProjects: projects.filter((project: any) => project.status === 'in_progress' || project.status === 'planned').length,
    };
}

async function getCompanyFinancialMonthlySeries(companyId: string, projectId?: string | null) {
    const report = await getCompanyFinancialReport(companyId, projectId);
    const [invoices, expenses, receipts, investorContributions] = await Promise.all([
        supabaseAdmin.from('invoices').select('*').eq('company_id', companyId).then((result) => (result.data ?? []).filter((invoice: any) => {
            if (projectId) return invoice.project_id === projectId || (!invoice.project_id && projectId === 'company-wide');
            return !invoice.project_id || !!invoice.project_id;
        })),
        supabaseAdmin.from('project_expenses').select('*').eq('company_id', companyId).then((result) => result.data ?? []),
        supabaseAdmin.from('project_receipts').select('*').eq('company_id', companyId).then((result) => result.data ?? []),
        supabaseAdmin.from('project_investor_contributions').select('*').eq('company_id', companyId).then((result) => result.data ?? []),
    ]);

    const monthMap = new Map<string, any>();
    for (const invoice of invoices.filter((row: any) => String(row.status ?? '').trim() !== 'Cancelled')) {
        const key = monthKeyFromDate(invoice.invoice_date ?? invoice.created_at);
        if (!key) continue;
        const current = monthMap.get(key) ?? { month: key, billed: 0, collected: 0, expenses: 0, netCashFlow: 0 };
        current.billed += toMoney(invoice.grand_total);
        monthMap.set(key, current);
    }
    for (const receipt of receipts.filter((row: any) => !row.voided_at)) {
        const key = monthKeyFromDate(receipt.received_date ?? receipt.created_at);
        if (!key) continue;
        const current = monthMap.get(key) ?? { month: key, billed: 0, collected: 0, expenses: 0, netCashFlow: 0 };
        current.collected += toMoney(receipt.amount);
        monthMap.set(key, current);
    }
    for (const expense of expenses.filter((row: any) => (row.status ?? 'void') !== 'void')) {
        const key = monthKeyFromDate(expense.bill_date ?? expense.created_at);
        if (!key) continue;
        const current = monthMap.get(key) ?? { month: key, billed: 0, collected: 0, expenses: 0, netCashFlow: 0 };
        current.expenses += toMoney(expense.bill_amount);
        monthMap.set(key, current);
    }
    const monthEntries = Array.from(monthMap.values()).map((entry: any) => {
        entry.netCashFlow = entry.collected - entry.expenses;
        return {
            month: entry.month,
            billed: formatMoneyNumber(entry.billed),
            collected: formatMoneyNumber(entry.collected),
            expenses: formatMoneyNumber(entry.expenses),
            netCashFlow: formatMoneyNumber(entry.netCashFlow),
        };
    });

    return {
        summary: {
            totalBilled: report.totalBilled,
            totalCollected: report.totalCollected,
            totalExpenses: report.totalExpenses,
            totalOutstanding: report.totalOutstanding,
            netCashFlow: report.netCashFlow,
        },
        monthly: monthEntries.sort((a: any, b: any) => a.month.localeCompare(b.month)),
    };
}

async function getCompanyFinancialYearlySeries(companyId: string, projectId?: string | null) {
    const [invoices, expenses, receipts, investorContributions] = await Promise.all([
        supabaseAdmin.from('invoices').select('*').eq('company_id', companyId).then((result) => result.data ?? []),
        supabaseAdmin.from('project_expenses').select('*').eq('company_id', companyId).then((result) => result.data ?? []),
        supabaseAdmin.from('project_receipts').select('*').eq('company_id', companyId).then((result) => result.data ?? []),
        supabaseAdmin.from('project_investor_contributions').select('*').eq('company_id', companyId).then((result) => result.data ?? []),
    ]);

    const filteredInvoices = invoices.filter((row: any) => {
        if (projectId) return row.project_id === projectId || (!row.project_id && projectId === 'company-wide');
        return String(row.status ?? '').trim() !== 'Cancelled';
    });
    const filteredReceipts = receipts.filter((row: any) => {
        if (projectId) return row.project_id === projectId || (!row.project_id && projectId === 'company-wide');
        return !row.voided_at;
    });
    const filteredExpenses = expenses.filter((row: any) => {
        if (projectId) return row.project_id === projectId || (!row.project_id && projectId === 'company-wide');
        return (row.status ?? 'void') !== 'void';
    });
    const filteredContributions = investorContributions.filter((row: any) => {
        if (projectId) return row.project_id === projectId || (!row.project_id && projectId === 'company-wide');
        return true;
    });

    const yearMap = new Map<string, any>();
    for (const invoice of filteredInvoices) {
        const key = yearKeyFromDate(invoice.invoice_date ?? invoice.created_at);
        if (!key) continue;
        const current = yearMap.get(key) ?? { year: key, billed: 0, collected: 0, expenses: 0, netCashFlow: 0 };
        current.billed += toMoney(invoice.grand_total);
        yearMap.set(key, current);
    }
    for (const receipt of filteredReceipts.filter((row: any) => !row.voided_at)) {
        const key = yearKeyFromDate(receipt.received_date ?? receipt.created_at);
        if (!key) continue;
        const current = yearMap.get(key) ?? { year: key, billed: 0, collected: 0, expenses: 0, netCashFlow: 0 };
        current.collected += toMoney(receipt.amount);
        yearMap.set(key, current);
    }
    for (const expense of filteredExpenses) {
        const key = yearKeyFromDate(expense.bill_date ?? expense.created_at);
        if (!key) continue;
        const current = yearMap.get(key) ?? { year: key, billed: 0, collected: 0, expenses: 0, netCashFlow: 0 };
        current.expenses += toMoney(expense.bill_amount);
        yearMap.set(key, current);
    }
    for (const contribution of filteredContributions) {
        const key = yearKeyFromDate(contribution.contribution_date ?? contribution.created_at);
        if (!key) continue;
        const current = yearMap.get(key) ?? { year: key, billed: 0, collected: 0, expenses: 0, netCashFlow: 0 };
        current.netCashFlow += toMoney(contribution.amount);
        yearMap.set(key, current);
    }

    return Array.from(yearMap.values()).map((entry: any) => {
        entry.netCashFlow = entry.collected + entry.netCashFlow - entry.expenses;
        return {
            year: entry.year,
            billed: formatMoneyNumber(entry.billed),
            collected: formatMoneyNumber(entry.collected),
            expenses: formatMoneyNumber(entry.expenses),
            netCashFlow: formatMoneyNumber(entry.netCashFlow),
        };
    }).sort((a: any, b: any) => a.year.localeCompare(b.year));
}

async function getProjectScopedAccessForRead(
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

async function getOutstandingByExpenseId(companyId: string, projectId?: string | null): Promise<Map<string, number>> {
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

function getRequestMeta(request: any): { userAgent: string | null; ip: string | null } {
    return {
        userAgent: (request.headers['user-agent'] as string | undefined) ?? null,
        ip: request.ip ?? null,
    };
}

function mapStatusToDb(status: string): string {
    switch (status) {
        case 'DRAFT':
            return 'Draft';
        case 'GENERATED':
            return 'Generated';
        case 'SENT':
            return 'Sent';
        case 'ACCEPTED':
            return 'Accepted';
        case 'REJECTED':
            return 'Rejected';
        case 'EXPIRED':
            return 'Expired';
        default:
            return 'Draft';
    }
}

function buildDocumentPayload(quotation: any, companyId: string, documentNumber: string, customerId: string | null, partyId: string | null) {
    const additionalCharges = (quotation.additionalCharges ?? []).reduce((total: number, item: any) => total + Number(item?.amount ?? 0), 0);
    const taxAmount = quotation.tax?.applicable
        ? Math.round((Number(quotation.subtotal ?? 0) * Number(quotation.tax?.rate ?? 0)) / 100 * 100) / 100
        : 0;

    return {
        id: quotation.id,
        company_id: companyId,
        customer_id: customerId,
        party_id: partyId,
        document_type: 'Quotation',
        document_number: documentNumber,
        status: mapStatusToDb(quotation.status),
        quotation_date: quotation.quotationDate || null,
        valid_until: quotation.validUntil || null,
        project_type_id: quotation.projectTypeId ?? quotation.project_type_id ?? null,
        project_name: quotation.project?.name ?? '',
        project_type: quotation.project?.projectType ?? '',
        project_location: quotation.project?.address ?? '',
        area_unit_id: quotation.areaUnitId ?? quotation.area_unit_id ?? null,
        builtup_area: parseNumber(quotation.project?.builtupArea),
        area_unit: quotation.project?.builtupAreaUnit ?? '',
        floors: quotation.project?.floors ?? '',
        subtotal: quotation.subtotal ?? 0,
        additional_charges: additionalCharges,
        discount: quotation.discount?.value ?? 0,
        tax_rate_id: quotation.taxRateId ?? quotation.tax_rate_id ?? null,
        tax_name: quotation.tax?.name ?? null,
        tax_percentage: quotation.tax?.rate ?? 0,
        tax_amount: taxAmount,
        grand_total: quotation.grandTotal ?? 0,
        notes: quotation.customerNotes ?? '',
        created_at: quotation.createdAt ?? new Date().toISOString(),
        updated_at: quotation.updatedAt ?? new Date().toISOString(),
    };
}

function buildTermsPayload(documentId: string, terms: any[]) {
    return (terms ?? []).map((term: any) => ({
        id: term.id,
        document_id: documentId,
        description: term.text,
        display_order: term.displayOrder,
    }));
}

async function getQuotationRowsForCompany(companyId: string) {
    const { data, error } = await supabaseAdmin
        .from('documents')
        .select(`*, customers(name,mobile,email,address), document_sections(id,section_name,display_order,document_items(*)), document_specifications(*), document_inclusions(*), document_exclusions(*), payment_schedules(*), document_terms(*)`)
        .eq('company_id', companyId)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
}

async function getQuotationRowById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('documents')
        .select(`*, customers(name,mobile,email,address), document_sections(id,section_name,display_order,document_items(*)), document_specifications(*), document_inclusions(*), document_exclusions(*), payment_schedules(*), document_terms(*)`)
        .eq('id', id)
        .eq('is_deleted', false)
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function saveQuotationToDatabase(quotation: any, companyId: string) {

    // The row may already exist (an autosave/draft update). Load it first to
    // find (a) whether it already belongs to a DIFFERENT company — which
    // would mean this request is trying to hijack another company's document
    // by reusing its id, and must be rejected — (b) its existing
    // document_number, which is preserved rather than re-derived from
    // whatever the client sent, and (c) any customer_id already linked to it.
    const { data: existingDoc, error: existingDocError } = await supabaseAdmin
        .from('documents')
        .select('id, company_id, document_number, customer_id, party_id, is_deleted')
        .eq('id', quotation.id)
        .maybeSingle();

    if (existingDocError) throw existingDocError;

    if (existingDoc && existingDoc.company_id !== companyId) {
        const err: any = new Error('This document belongs to a different company.');
        err.statusCode = 403;
        throw err;
    }

    if (existingDoc?.is_deleted) {
        const err: any = new Error('This quotation has been deleted and can no longer be modified.');
        err.statusCode = 409;
        throw err;
    }

    const isNewQuotation = !existingDoc;
    const selectedPartyId = (quotation.customerPartyId ?? quotation.customer_party_id ?? existingDoc?.party_id ?? null) as string | null;
    const normalizedPartyId = selectedPartyId ? String(selectedPartyId).trim() || null : null;

    if (isNewQuotation) {
        // Existing quotations (edits/autosaves) are never subject to this —
        // only genuinely new documents count against the monthly limit. This
        // reservation is atomic (compare-and-swap against
        // company_quotation_usage — see subscription.ts) and happens BEFORE
        // anything is written, so a rejected request never creates a
        // partial row that would need cleaning up, and two concurrent
        // requests can never both succeed past the limit.
        await reserveQuotationSlot(companyId);
    }

    try {
        const documentNumber = existingDoc
            ? existingDoc.document_number
            : await allocateDocumentNumber(companyId, 'Quotation');

        // Resolve/keep-in-sync a customers-table row backing this quotation's
        // embedded customer info, and link it via documents.customer_id. The
        // quotation's own customer fields (used for PDF/display) are left
        // completely untouched — this only adds a structural link, scoped
        // strictly to `companyId` (never a client-supplied customer id), so a
        // quotation can never end up linked to another company's customer.
        let customerId: string | null = existingDoc?.customer_id ?? null;
        const customerName = String(quotation.customer?.name ?? '').trim();
        if (customerName) {
            const customerFields = {
                name: customerName,
                email: quotation.customer?.email ?? null,
                mobile: quotation.customer?.mobile ?? null,
                address: quotation.customer?.address ?? null,
                city: quotation.customer?.city ?? null,
                state: quotation.customer?.state ?? null,
                pincode: quotation.customer?.pincode ?? null,
            };

            if (normalizedPartyId) {
                const { data: party, error: partyError } = await supabaseAdmin
                    .from('parties')
                    .select('id, company_id, is_customer, is_active, is_deleted')
                    .eq('id', normalizedPartyId)
                    .maybeSingle();

                if (partyError) throw partyError;
                if (!party) {
                    const err: any = new Error('Selected customer contact could not be found.');
                    err.statusCode = 404;
                    throw err;
                }
                if (party.company_id !== companyId || !party.is_customer || !party.is_active || party.is_deleted) {
                    const err: any = new Error('Selected customer contact is not a valid active customer for this company.');
                    err.statusCode = 403;
                    throw err;
                }

                const { data: existingCustomer, error: existingCustomerError } = await supabaseAdmin
                    .from('customers')
                    .select('id, company_id, party_id')
                    .eq('company_id', companyId)
                    .eq('party_id', normalizedPartyId)
                    .eq('is_deleted', false)
                    .maybeSingle();

                if (existingCustomerError) throw existingCustomerError;
                if (existingCustomer) {
                    customerId = existingCustomer.id;
                    await updateCustomerRow(existingCustomer.id, { ...customerFields, party_id: normalizedPartyId });
                } else {
                    const created = await createCustomerForCompany(companyId, { ...customerFields, party_id: normalizedPartyId });
                    customerId = created.id;
                }
            } else if (customerId) {
                const linkedCustomer = await getCustomerRow(customerId);
                if (linkedCustomer && linkedCustomer.company_id === companyId) {
                    await updateCustomerRow(customerId, customerFields);
                } else {
                    // Linked row is missing or (shouldn't happen) belongs to a
                    // different company — re-create under the correct company
                    // rather than ever link across a company boundary.
                    const created = await createCustomerForCompany(companyId, customerFields);
                    customerId = created.id;
                }
            } else {
                const created = await createCustomerForCompany(companyId, customerFields);
                customerId = created.id;
            }
        }

        const documentPayload = buildDocumentPayload(quotation, companyId, documentNumber, customerId, normalizedPartyId);

        const { data: documentData, error: documentError } = await supabaseAdmin
            .from('documents')
            .upsert(documentPayload, { onConflict: 'id' })
            .select('id, document_number')
            .single();

        if (documentError) {
            throw new Error(`documents insert failed: ${documentError.message}`);
        }

        const documentId = documentData?.id ?? quotation.id;

        // Delete existing child rows before re-inserting the current state.
        // Order matters: document_items reference document_sections via
        // section_id, so items must be deleted BEFORE their parent sections —
        // deleting a section while its items still reference it would either
        // fail on a foreign-key constraint or (if no FK exists) leave orphaned
        // item rows pointing at a section_id that no longer exists. Every step
        // checks its error and throws immediately, so a failure here stops the
        // operation rather than silently continuing to delete/insert further
        // tables (which is what could previously leave partial/orphaned data).
        const { data: existingSections, error: existingSectionsError } = await supabaseAdmin
            .from('document_sections')
            .select('id')
            .eq('document_id', documentId);
        if (existingSectionsError) throw existingSectionsError;

        const existingSectionIds = (existingSections ?? []).map((s: any) => s.id);
        if (existingSectionIds.length > 0) {
            const { error } = await supabaseAdmin.from('document_items').delete().in('section_id', existingSectionIds);
            if (error) throw new Error(`document_items delete failed: ${error.message}`);
        }

        {
            const { error } = await supabaseAdmin.from('document_sections').delete().eq('document_id', documentId);
            if (error) throw new Error(`document_sections delete failed: ${error.message}`);
        }
        {
            const { error } = await supabaseAdmin.from('document_terms').delete().eq('document_id', documentId);
            if (error) throw new Error(`document_terms delete failed: ${error.message}`);
        }
        {
            const { error } = await supabaseAdmin.from('document_specifications').delete().eq('document_id', documentId);
            if (error) throw new Error(`document_specifications delete failed: ${error.message}`);
        }
        {
            const { error } = await supabaseAdmin.from('document_inclusions').delete().eq('document_id', documentId);
            if (error) throw new Error(`document_inclusions delete failed: ${error.message}`);
        }
        {
            const { error } = await supabaseAdmin.from('document_exclusions').delete().eq('document_id', documentId);
            if (error) throw new Error(`document_exclusions delete failed: ${error.message}`);
        }
        {
            const { error } = await supabaseAdmin.from('payment_schedules').delete().eq('document_id', documentId);
            if (error) throw new Error(`payment_schedules delete failed: ${error.message}`);
        }

        const sectionRows = (quotation.boqSections ?? []).map((section: any) => ({
            id: section.id,
            document_id: documentId,
            section_name: section.title,
            display_order: section.displayOrder,
        }));

        const itemRows = (quotation.boqSections ?? []).flatMap((section: any) =>
            (section.items ?? []).map((item: any) => ({
                id: item.id,
                section_id: section.id,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                rate: item.rate,
                amount: item.amount,
                display_order: item.displayOrder,
            })),
        );

        const specificationRows = (quotation.specifications ?? []).map((spec: any) => ({
            id: spec.id,
            document_id: documentId,
            specification_type: spec.title,
            description: spec.description,
            display_order: spec.displayOrder,
        }));

        const inclusionRows = (quotation.inclusions ?? []).map((description: string) => ({
            document_id: documentId,
            description,
        }));

        const exclusionRows = (quotation.exclusions ?? []).map((description: string) => ({
            document_id: documentId,
            description,
        }));

        const paymentRows = (quotation.paymentSchedule ?? []).map((stage: any) => ({
            id: stage.id,
            document_id: documentId,
            stage_name: stage.name,
            percentage: stage.percentage,
            amount: stage.amount,
            due_date: stage.dueDate || null,
            status: stage.status ?? null,
            display_order: stage.displayOrder,
        }));

        const termRows = buildTermsPayload(documentId, quotation.terms ?? []);

        // Insert order mirrors delete order's dependency: sections BEFORE items,
        // since items reference section_id.
        if (sectionRows.length > 0) {
            const { error } = await supabaseAdmin.from('document_sections').insert(sectionRows);
            if (error) throw new Error(`document_sections insert failed: ${error.message}`);
        }
        if (itemRows.length > 0) {
            const { error } = await supabaseAdmin.from('document_items').insert(itemRows);
            if (error) throw new Error(`document_items insert failed: ${error.message}`);
        }
        if (specificationRows.length > 0) {
            const { error } = await supabaseAdmin.from('document_specifications').insert(specificationRows);
            if (error) throw new Error(`document_specifications insert failed: ${error.message}`);
        }
        if (inclusionRows.length > 0) {
            const { error } = await supabaseAdmin.from('document_inclusions').insert(inclusionRows);
            if (error) throw new Error(`document_inclusions insert failed: ${error.message}`);
        }
        if (exclusionRows.length > 0) {
            const { error } = await supabaseAdmin.from('document_exclusions').insert(exclusionRows);
            if (error) throw new Error(`document_exclusions insert failed: ${error.message}`);
        }
        if (paymentRows.length > 0) {
            const { error } = await supabaseAdmin.from('payment_schedules').insert(paymentRows);
            if (error) throw new Error(`payment_schedules insert failed: ${error.message}`);
        }
        if (termRows.length > 0) {
            const { error } = await supabaseAdmin.from('document_terms').insert(termRows);
            if (error) throw new Error(`document_terms insert failed: ${error.message}`);
        }

        return { ok: true, id: documentId, documentNumber: documentData?.document_number ?? documentNumber };
    } catch (err) {
        if (isNewQuotation) {
            // The slot was reserved but this new quotation failed to
            // actually get created (an unrelated DB error) — give the slot
            // back rather than charging the company's monthly limit for a
            // request that never produced a document.
            await releaseQuotationSlot(companyId);
        }
        throw err;
    }
}

await app.register(cors, {
    origin: true,
    credentials: true,
});

// ─── Auth helper ───────────────────────────────────────────────────────────────
// requireAuth (JWT verification) and the company-level authorization helpers
// (authorizeCompany, authorizeOwnedResource, getMembership, getPrimaryMembership,
// ensureCompanyMembership) now live in ./authz.ts so they can be reused across
// every company-scoped route below instead of being duplicated per-route.

// ─── POST /api/signup ──────────────────────────────────────────────────────────

app.post('/api/signup', async (request, reply) => {
    const body = request.body as { email?: string; password?: string; fullName?: string };

    if (!body.email || !body.password) {
        return reply.status(400).send({ error: 'Email and password are required.' });
    }

    try {
        // Check duplicate
        const existing = await findUserByEmail(body.email);
        if (existing) {
            return reply.status(409).send({ error: 'An account with this email already exists.' });
        }

        // Create user row in public.users
        const passwordHash = await hashPassword(body.password);
        let user: Awaited<ReturnType<typeof createUser>>;
        try {
            user = await createUser(body.email, passwordHash);
        } catch (err: any) {
            app.log.error(err, 'Failed to create user');
            return reply.status(500).send({ error: 'Failed to create account. Please try again.' });
        }

        // Create profile row in public.user_profiles (non-fatal if it fails)
        try {
            await createUserProfile(user.id, body.fullName ?? null);
        } catch (err: any) {
            // Profile creation failed — log but don't block the response.
            // User can update profile later.
            app.log.warn(err, 'Failed to create user profile for user %s', user.id);
        }

        const token = signJwt({ sub: user.id, email: user.email, role: user.role });

        let refreshToken: string | null = null;
        try {
            refreshToken = await issueRefreshToken(user.id, getRequestMeta(request));
        } catch (err: any) {
            // Non-fatal: the access token still works, just without silent renewal
            // until the next successful login/refresh.
            app.log.warn(err, 'Failed to issue refresh token for user %s', user.id);
        }

        return reply.status(201).send({
            token,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                fullName: body.fullName ?? null,
                role: user.role,
                mustChangePassword: false,
            },
        });
    } catch (err: any) {
        app.log.error(err, 'Failed to create account');
        const message = getErrorText(err);
        if (isTransientNetworkError(err) || /fetch failed|ECONNRESET|ECONNREFUSED|ENOTFOUND|TLS|network/i.test(message)) {
            return reply.status(503).send({ error: 'Authentication service is temporarily unavailable. Please try again in a moment.' });
        }
        return reply.status(500).send({ error: 'Failed to create account. Please try again.' });
    }
});

// ─── POST /api/login ───────────────────────────────────────────────────────────

app.post('/api/login', async (request, reply) => {
    const body = request.body as { email?: string; password?: string };

    if (!body.email || !body.password) {
        return reply.status(400).send({ error: 'Email and password are required.' });
    }

    try {
        const user = await findUserByEmail(body.email);

        // Use same error message for missing user and wrong password — prevents email enumeration
        if (!user) {
            return reply.status(401).send({ error: 'Invalid email or password.' });
        }

        // Check account is active
        if (!user.is_active) {
            return reply.status(403).send({ error: 'This account has been deactivated. Please contact support.' });
        }

        const valid = await comparePassword(body.password, user.password_hash);
        if (!valid) {
            return reply.status(401).send({ error: 'Invalid email or password.' });
        }

        // Update last_login_at (non-fatal)
        updateLastLogin(user.id).catch((err) =>
            app.log.warn(err, 'Failed to update last_login_at for user %s', user.id)
        );

        // Fetch full_name from user_profiles
        const profile = await getUserProfile(user.id).catch(() => null);

        const token = signJwt({ sub: user.id, email: user.email, role: user.role });

        let refreshToken: string | null = null;
        try {
            refreshToken = await issueRefreshToken(user.id, getRequestMeta(request));
        } catch (err: any) {
            app.log.warn(err, 'Failed to issue refresh token for user %s', user.id);
        }

        return reply.send({
            token,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                fullName: profile?.full_name ?? null,
                role: user.role,
                mustChangePassword: !!user.must_change_password,
            },
        });
    } catch (err: any) {
        app.log.error(err, 'Login failed due to backend auth service issue');
        const message = getErrorText(err);
        if (isTransientNetworkError(err) || /fetch failed|ECONNRESET|ECONNREFUSED|ENOTFOUND|TLS|network/i.test(message)) {
            return reply.status(503).send({ error: 'Authentication service is temporarily unavailable. Please try again in a moment.' });
        }
        return reply.status(500).send({ error: 'Login failed. Please try again.' });
    }
});

// ─── POST /api/refresh ─────────────────────────────────────────────────────────
// Exchanges a still-valid refresh token for a new short-lived access token.
// The refresh token itself is rotated (old one revoked, new one issued) on
// every use, so a leaked-and-reused old token is immediately detectable as
// invalid the next time the legitimate client tries to use it.

app.post('/api/refresh', async (request, reply) => {
    const body = request.body as { refreshToken?: string };
    if (!isNonEmptyString(body?.refreshToken)) {
        return reply.status(401).send({ error: 'Refresh token is required.' });
    }

    try {
        const existing = await findActiveRefreshToken(body.refreshToken);
        if (!existing) {
            return reply.status(401).send({ error: 'Invalid or expired refresh token.' });
        }

        const user = await findUserById(existing.userId);
        if (!user || !user.is_active) {
            return reply.status(401).send({ error: 'Invalid or expired refresh token.' });
        }

        // Rotation: revoke the token just used, issue a brand new one.
        await revokeRefreshToken(body.refreshToken);
        const newRefreshToken = await issueRefreshToken(user.id, getRequestMeta(request));
        const token = signJwt({ sub: user.id, email: user.email, role: user.role });

        return reply.send({ token, refreshToken: newRefreshToken });
    } catch (err: any) {
        app.log.error(err, 'Failed to refresh token');
        return reply.status(500).send({ error: 'Failed to refresh token.' });
    }
});

// ─── POST /api/logout ──────────────────────────────────────────────────────────
// Revokes the presented refresh token so it can never be used again. The
// short-lived access token isn't separately revocable (by design — it just
// expires within 15 minutes), but without a valid refresh token it can no
// longer be silently renewed.

app.post('/api/logout', async (request, reply) => {
    const body = request.body as { refreshToken?: string };
    if (isNonEmptyString(body?.refreshToken)) {
        try {
            await revokeRefreshToken(body.refreshToken);
        } catch (err: any) {
            app.log.warn(err, 'Failed to revoke refresh token on logout');
        }
    }
    return reply.send({ ok: true });
});

// ─── Password reset ─────────────────────────────────────────────────────────────

app.post('/api/password-reset/request', async (request, reply) => {
    const body = request.body as { email?: string };
    if (!isNonEmptyString(body?.email)) {
        return reply.status(400).send({ error: 'Email is required.' });
    }

    // Always return the same generic response whether or not the account
    // exists — this prevents the endpoint being used to enumerate emails.
    const genericResponse = { ok: true, message: 'If an account exists for that email, a reset link has been generated.' };

    try {
        const user = await findUserByEmail(body.email);
        if (!user || !user.is_active) {
            return reply.send(genericResponse);
        }

        const token = await issuePasswordResetToken(user.id);

        // NOTE: there is no outbound email provider configured in this
        // project (no SMTP/email-API env vars). Delivering the reset token
        // to the user's inbox requires wiring up a real email service before
        // production — the token is intentionally NEVER written to logs
        // (see requirement 5 / 14).
        //
        // As a development-only convenience so the flow is testable
        // end-to-end without an email provider, the raw token is included in
        // the API response ONLY when explicitly opted into via
        // ALLOW_DEV_PASSWORD_RESET_TOKEN=true in the backend's .env. This is
        // deliberately an explicit opt-in (not "NODE_ENV !== 'production'")
        // so a deployment that simply forgets to set NODE_ENV can never leak
        // a reset token by default — the safe default is "never expose".
        // Remove this block entirely once a real email send is wired up.
        const devTokenEnabled = process.env.ALLOW_DEV_PASSWORD_RESET_TOKEN === 'true';
        const devToken = devTokenEnabled ? token : undefined;

        return reply.send({ ...genericResponse, ...(devToken ? { devToken } : {}) });
    } catch (err: any) {
        app.log.error(err, 'Failed to process password reset request');
        // Still return the generic response — don't leak internal state via errors either.
        return reply.send(genericResponse);
    }
});

app.post('/api/password-reset/confirm', async (request, reply) => {
    const body = request.body as { token?: string; newPassword?: string };
    if (!isNonEmptyString(body?.token) || !isNonEmptyString(body?.newPassword)) {
        return reply.status(400).send({ error: 'Reset token and new password are required.' });
    }
    if (body.newPassword.length < 8) {
        return reply.status(400).send({ error: 'Password must be at least 8 characters.' });
    }

    try {
        const reset = await findActivePasswordReset(body.token);
        if (!reset) {
            return reply.status(400).send({ error: 'Invalid or expired reset token.' });
        }

        const passwordHash = await hashPassword(body.newPassword);
        await updateUserPassword(reset.userId, passwordHash);
        await markPasswordResetUsed(reset.id);
        // Force re-login everywhere — a password reset should invalidate any
        // sessions started before the account owner regained control.
        await revokeAllRefreshTokensForUser(reset.userId);

        return reply.send({ ok: true });
    } catch (err: any) {
        app.log.error(err, 'Failed to confirm password reset');
        return reply.status(500).send({ error: 'Failed to reset password.' });
    }
});

// ─── GET /api/me ───────────────────────────────────────────────────────────────

app.get('/api/me', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ error: 'Missing or malformed authorization header.' });
    }

    const token = authHeader.slice(7);
    const payload = verifyJwt(token) as { sub?: string } | null;
    if (!payload?.sub) {
        return reply.status(401).send({ error: 'Invalid or expired token.' });
    }

    const user = await findUserById(payload.sub);
    if (!user) {
        return reply.status(404).send({ error: 'User not found.' });
    }

    if (!user.is_active) {
        return reply.status(403).send({ error: 'This account has been deactivated.' });
    }

    const profile = await getUserProfile(user.id).catch(() => null);

    return reply.send({
        user: {
            id: user.id,
            email: user.email,
            fullName: profile?.full_name ?? null,
            role: user.role,
            mustChangePassword: !!user.must_change_password,
        },
    });
});

// ─── POST /api/change-password ─────────────────────────────────────────────────
// Self-service password change for the authenticated user. Used both for the
// forced first-login flow (an admin-created teammate must set their own
// password before doing anything else — see must_change_password) and as a
// general "change my password" action. Unlike the forgot-password flow, this
// does NOT revoke other sessions — a user proactively changing their own
// password from an active, already-authenticated session isn't a signal of
// compromise the way a password-reset-token flow is.

app.post('/api/change-password', async (request, reply) => {
    const userId = requireAuth(request, reply);
    if (!userId) return;

    const body = request.body as { currentPassword?: string; newPassword?: string };
    if (!isNonEmptyString(body?.currentPassword) || !isNonEmptyString(body?.newPassword)) {
        return reply.status(400).send({ error: 'Current and new password are required.' });
    }
    if (body.newPassword.length < 8) {
        return reply.status(400).send({ error: 'New password must be at least 8 characters.' });
    }

    try {
        const user = await findUserById(userId);
        if (!user) {
            return reply.status(404).send({ error: 'User not found.' });
        }

        const valid = await comparePassword(body.currentPassword, user.password_hash);
        if (!valid) {
            return reply.status(401).send({ error: 'Current password is incorrect.' });
        }

        const newHash = await hashPassword(body.newPassword);
        await updateUserPassword(userId, newHash, true);

        // Re-issue an access token with the flag cleared so the frontend can
        // drop the forced redirect immediately, without a full logout/login.
        const token = signJwt({ sub: user.id, email: user.email, role: user.role });

        return reply.send({ ok: true, token });
    } catch (err: any) {
        app.log.error(err, 'Failed to change password');
        return reply.status(500).send({ error: 'Failed to change password.' });
    }
});

// ─── GET /api/company ──────────────────────────────────────────────────────────

app.get('/api/company', async (request, reply) => {
    const userId = requireAuth(request, reply);
    if (!userId) return;

    try {
        // No explicit companyId is supplied here — resolve the caller's own
        // company via their company_users membership. No company yet is a
        // normal state (new user), not an authorization failure.
        const membership = await getPrimaryMembership(userId);
        if (!membership) {
            return reply.send({ company: null });
        }

        const data = await getCompanyById(membership.companyId);
        return reply.send({ company: data ? { ...data, callerRole: membership.role } : null });
    } catch (err: any) {
        app.log.error(err, 'Failed to get company');
        return reply.status(500).send({ error: 'Failed to load company.' });
    }
});

// ─── POST /api/company ─────────────────────────────────────────────────────────

app.post('/api/company', async (request, reply) => {
    const userId = requireAuth(request, reply);
    if (!userId) return;

    const body = request.body as any;

    const validationError = validateCompanyPayload(body);
    if (validationError) {
        return reply.status(400).send({ error: validationError });
    }

    try {
        const { data: existingMembershipRows, error: membershipLookupError } = await supabaseAdmin
            .from('company_users')
            .select('company_id')
            .eq('user_id', userId)
            .limit(2);
        if (membershipLookupError) throw membershipLookupError;

        if ((existingMembershipRows ?? []).length > 0) {
            return reply.status(409).send({ error: 'This account already belongs to a company.' });
        }

        const company = await createCompany(userId, {
            name: body.name ?? '',
            address: body.address ?? null,
            phone: body.phone ?? null,
            email: body.email ?? null,
            website: body.website ?? null,
            gst_number: body.gst_number ?? null,
            pan_number: body.pan_number ?? null,
            logo_url: body.logo_url ?? null,
            primary_color: body.primary_color ?? null,
            secondary_color: body.secondary_color ?? null,
        });

        try {
            const requestedEnabledModels = Array.isArray(body.enabled_business_models)
                ? body.enabled_business_models
                : Array.isArray(body.enabledBusinessModels)
                    ? body.enabledBusinessModels
                    : DEFAULT_ENABLED_BUSINESS_MODELS;
            const invalidEnabledModels = requestedEnabledModels.filter((value: unknown) => normalizeBusinessModel(value) === null);
            if (invalidEnabledModels.length > 0) {
                return reply.status(400).send({ error: `Enabled business models must be a subset of: ${BUSINESS_MODEL_VALUES.join(', ')}.` });
            }
            const enabledBusinessModels = normalizeBusinessModels(requestedEnabledModels);

            await createCompanySettings(company.id, {
                authorized_person: body.authorized_person ?? null,
                designation: body.designation ?? null,
                signature_url: body.signature_url ?? null,
                bank_name: body.bank_name ?? null,
                account_name: body.account_name ?? null,
                account_number: body.account_number ?? null,
                ifsc: body.ifsc ?? null,
                branch: body.branch ?? null,
                upi_id: body.upi_id ?? null,
                quotation_prefix: body.quotation_prefix || 'QTN',
                booking_prefix: body.booking_prefix || 'BR',
                default_validity_days: body.default_validity_days ?? 30,
                default_terms: body.default_terms ?? null,
                default_tax_name: body.default_tax_name ?? 'GST',
                default_tax_rate: body.default_tax_rate ?? 0,
                enabled_business_models: enabledBusinessModels.length > 0 ? enabledBusinessModels : DEFAULT_ENABLED_BUSINESS_MODELS,
                invoice_prefix: body.invoice_prefix || 'INV',
            });

            await ensureCompanyMembership(company.id, userId, 'owner');
        } catch (creationErr: any) {
            const rollback = await supabaseAdmin
                .from('companies')
                .delete()
                .eq('id', company.id);

            if (rollback.error) {
                app.log.error(rollback.error, 'Failed to rollback partially-created company %s', company.id);
            }

            throw creationErr;
        }

        const full = await getCompanyById(company.id);
        return reply.status(201).send({ company: full });
    } catch (err: any) {
        app.log.error(err, 'Failed to create company');
        return reply.status(500).send({ error: 'Failed to create company.' });
    }
});

// ─── GET /api/company/:companyId ──────────────────────────────────────────────

app.get('/api/company/:companyId', async (request, reply) => {
    const { companyId } = request.params as { companyId: string };

    // companyId comes from the frontend — treat it only as a requested
    // context and verify it against company_users before trusting it.
    const membership = await authorizeCompany(request, reply, {
        requestedCompanyId: companyId,
        allowedRoles: COMPANY_READ_ROLES, // owner/admin/staff can all view company details
    });
    if (!membership) return;

    try {
        const data = await getCompanyById(membership.companyId);
        return reply.send({ company: data ? { ...data, callerRole: membership.role } : null });
    } catch (err: any) {
        app.log.error(err, 'Failed to get company by id');
        return reply.status(500).send({ error: 'Failed to load company.' });
    }
});

// ─── PUT /api/company/:companyId ───────────────────────────────────────────────

app.put('/api/company/:companyId', async (request, reply) => {
    const { companyId } = request.params as { companyId: string };
    const body = request.body as any;

    const validationError = validateCompanyPayload(body);
    if (validationError) {
        return reply.status(400).send({ error: validationError });
    }

    // companyId comes from the frontend — treat it only as a requested
    // context and verify it against company_users before trusting it.
    // Only owner/admin members may update company management data.
    const membership = await authorizeCompany(request, reply, {
        requestedCompanyId: companyId,
        allowedRoles: COMPANY_MANAGEMENT_ROLES,
    });
    if (!membership) return;

    try {
        await updateCompany(membership.companyId, {
            name: body.name,
            address: body.address,
            phone: body.phone,
            email: body.email,
            website: body.website,
            gst_number: body.gst_number,
            pan_number: body.pan_number,
            logo_url: body.logo_url,
            primary_color: body.primary_color,
            secondary_color: body.secondary_color,
        });

        const requestedEnabledModels = Array.isArray(body.enabled_business_models)
            ? body.enabled_business_models
            : Array.isArray(body.enabledBusinessModels)
                ? body.enabledBusinessModels
                : DEFAULT_ENABLED_BUSINESS_MODELS;
        const invalidEnabledModels = requestedEnabledModels.filter((value: unknown) => normalizeBusinessModel(value) === null);
        if (invalidEnabledModels.length > 0) {
            return reply.status(400).send({ error: `Enabled business models must be a subset of: ${BUSINESS_MODEL_VALUES.join(', ')}.` });
        }
        const enabledBusinessModels = normalizeBusinessModels(requestedEnabledModels);

        const { data: usedProjectRows, error: usedProjectError } = await supabaseAdmin
            .from('projects')
            .select('business_model')
            .eq('company_id', membership.companyId)
            .not('business_model', 'is', null);
        if (usedProjectError) throw usedProjectError;

        const usedModels = new Set(
            (usedProjectRows ?? [])
                .map((row) => normalizeBusinessModel(row.business_model))
                .filter((model): model is BusinessModel => model !== null),
        );

        const disabledInUse = BUSINESS_MODEL_VALUES.filter((model) => !enabledBusinessModels.includes(model) && usedModels.has(model));
        if (disabledInUse.length > 0) {
            return reply.status(400).send({ error: `Cannot disable business models currently assigned to projects: ${disabledInUse.join(', ')}.` });
        }

        await upsertCompanySettings(membership.companyId, {
            authorized_person: body.authorized_person ?? null,
            designation: body.designation ?? null,
            signature_url: body.signature_url ?? null,
            bank_name: body.bank_name ?? null,
            account_name: body.account_name ?? null,
            account_number: body.account_number ?? null,
            ifsc: body.ifsc ?? null,
            branch: body.branch ?? null,
            upi_id: body.upi_id ?? null,
            quotation_prefix: body.quotation_prefix || 'QTN',
            booking_prefix: body.booking_prefix || 'BR',
            default_validity_days: body.default_validity_days ?? 30,
            default_terms: body.default_terms ?? null,
            default_tax_name: body.default_tax_name ?? 'GST',
            default_tax_rate: body.default_tax_rate ?? 0,
            enabled_business_models: enabledBusinessModels.length > 0 ? enabledBusinessModels : DEFAULT_ENABLED_BUSINESS_MODELS,
            invoice_prefix: body.invoice_prefix || 'INV',
        });

        const full = await getCompanyById(membership.companyId);
        return reply.send({ company: full });
    } catch (err: any) {
        app.log.error(err, 'Failed to update company');
        return reply.status(500).send({ error: 'Failed to update company.' });
    }
});

// ─── Shared Parties ─────────────────────────────────────────────────────────
app.get('/api/parties', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
    if (!membership) return;

    const { type, search, activeOnly } = request.query as { type?: string; search?: string; activeOnly?: string | boolean };

    try {
        const parties = await listPartiesForCompany(membership.companyId, {
            type: type && type !== 'null' ? type : 'all',
            search,
            activeOnly: activeOnly === true || activeOnly === 'true',
        });
        return reply.send({ parties });
    } catch (err: any) {
        app.log.error(err, 'Failed to list parties');
        return reply.status(500).send({ error: 'Failed to load parties.' });
    }
});

app.get('/api/parties/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    let party: any = null;

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            party = await getPartyRow(id);
            return party?.company_id ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    return reply.send({ party });
});

app.post('/api/parties', async (request, reply) => {
    const body = request.body as any;
    const validationError = validatePartyPayload(body);
    if (validationError) {
        return reply.status(400).send({ error: validationError });
    }

    const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
    if (!membership) return;

    try {
        const party = await createPartyForCompany(membership.companyId, {
            ...body,
            is_customer: Boolean(body?.is_customer ?? false),
            is_supplier: Boolean(body?.is_supplier ?? false),
            is_investor: Boolean(body?.is_investor ?? false),
        });
        return reply.status(201).send({ party });
    } catch (err: any) {
        app.log.error(err, 'Failed to create party');
        if (err?.code === '23514' && err?.constraint === 'parties_has_role') {
            return reply.status(400).send({ error: 'General contacts are not enabled yet for this database. Apply migration 0019_generic_party_contact_support.sql and try again.' });
        }
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400) return reply.status(400).send({ error: err.message });
        if (statusCode === 409) return reply.status(409).send({ error: err.message });
        return reply.status(500).send({ error: 'Failed to create party.' });
    }
});

app.put('/api/parties/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    if (body?.name !== undefined && !isNonEmptyString(body.name)) {
        return reply.status(400).send({ error: 'Party name cannot be empty.' });
    }
    const validationError = validatePartyPayload({
        ...body,
        name: body?.name ?? 'placeholder',
        is_customer: Boolean(body?.is_customer ?? false),
        is_supplier: Boolean(body?.is_supplier ?? false),
        is_investor: Boolean(body?.is_investor ?? false),
    });
    if (validationError && validationError !== 'Party name is required.') {
        return reply.status(400).send({ error: validationError });
    }

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const existing = await getPartyRow(id);
            return existing?.company_id ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    try {
        const party = await updatePartyRow(id, body);
        return reply.send({ party });
    } catch (err: any) {
        app.log.error(err, 'Failed to update party');
        if (err?.code === '23514' && err?.constraint === 'parties_has_role') {
            return reply.status(400).send({ error: 'General contacts are not enabled yet for this database. Apply migration 0019_generic_party_contact_support.sql and try again.' });
        }
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400) return reply.status(400).send({ error: err.message });
        if (statusCode === 409) return reply.status(409).send({ error: err.message });
        return reply.status(500).send({ error: 'Failed to update party.' });
    }
});

app.delete('/api/parties/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const existing = await getPartyRow(id);
            return existing?.company_id ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    try {
        await deletePartyRow(id, membership.userId);
        return reply.send({ ok: true });
    } catch (err: any) {
        app.log.error(err, 'Failed to delete party');
        return reply.status(500).send({ error: 'Failed to delete party.' });
    }
});

// ─── Customers ──────────────────────────────────────────────────────────────
// Previously the frontend queried the `customers` table directly via
// Supabase with the anon key (see src/services/customer.service.ts). These
// routes move that behind the authorized backend so every customer
// operation goes through the same company_users check as everything else.

app.get('/api/customers', async (request, reply) => {
    // No explicit companyId — list the caller's own company's customers.
    const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
    if (!membership) return;

    try {
        const customers = await listCustomersForCompany(membership.companyId);
        return reply.send({ customers });
    } catch (err: any) {
        app.log.error(err, 'Failed to list customers');
        return reply.status(500).send({ error: 'Failed to load customers.' });
    }
});

app.get('/api/customers/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    let customer: any = null;

    // Identified only by id — load it first to find its owning company, then verify membership.
    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            customer = await getCustomerRow(id);
            return customer?.company_id ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    return reply.send({ customer });
});

app.post('/api/customers', async (request, reply) => {
    const body = request.body as any;
    const validationError = validateCustomerPayload(body);
    if (validationError) {
        return reply.status(400).send({ error: validationError });
    }

    const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
    if (!membership) return;

    try {
        const customer = await createCustomerForCompany(membership.companyId, body);
        return reply.status(201).send({ customer });
    } catch (err: any) {
        app.log.error(err, 'Failed to create customer');
        const statusCode = typeof err?.statusCode === 'number'
            ? err.statusCode
            : err?.code === '23505'
                ? 409
                : 500;
        if (statusCode === 400 || statusCode === 403 || statusCode === 404 || statusCode === 409) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to create customer.' });
    }
});

app.put('/api/customers/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    if (body?.name !== undefined && !isNonEmptyString(body.name)) {
        return reply.status(400).send({ error: 'Customer name cannot be empty.' });
    }
    if (body?.email !== undefined) {
        const validationError = validateCustomerPayload({ name: body.name ?? 'placeholder', email: body.email });
        if (validationError && validationError !== 'Customer name is required.') {
            return reply.status(400).send({ error: validationError });
        }
    }

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const existing = await getCustomerRow(id);
            return existing?.company_id ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    try {
        const customer = await updateCustomerRow(id, body);
        return reply.send({ customer });
    } catch (err: any) {
        app.log.error(err, 'Failed to update customer');
        const statusCode = typeof err?.statusCode === 'number'
            ? err.statusCode
            : err?.code === '23505'
                ? 409
                : 500;
        if (statusCode === 400 || statusCode === 403 || statusCode === 404 || statusCode === 409) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to update customer.' });
    }
});

app.delete('/api/customers/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const existing = await getCustomerRow(id);
            return existing?.company_id ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    try {
        await deleteCustomerRow(id, membership.userId);
        return reply.send({ ok: true });
    } catch (err: any) {
        app.log.error(err, 'Failed to delete customer');
        return reply.status(500).send({ error: 'Failed to delete customer.' });
    }
});

// ─── Invoices ───────────────────────────────────────────────────────────────

app.get('/api/invoices', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
    if (!membership) return;

    const projectId = (request.query as { projectId?: string } | undefined)?.projectId ?? null;
    try {
        const invoices = await listInvoicesForCompany(membership.companyId, projectId);
        return reply.send({ invoices });
    } catch (err: any) {
        app.log.error(err, 'Failed to list invoices');
        return reply.status(500).send({ error: 'Failed to load invoices.' });
    }
});

app.get('/api/invoices/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    let invoice: any = null;

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            invoice = await getInvoiceRowById(id);
            return invoice?.company_id ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    return reply.send({ invoice });
});

app.get('/api/invoices/next-sequence', async (request, reply) => {
    const userId = requireAuth(request, reply);
    if (!userId) return;

    try {
        const membership = await getPrimaryMembership(userId);
        if (!membership) {
            return reply.send({ nextSequence: 1 });
        }

        const preview = await peekNextInvoiceNumber(membership.companyId);
        const match = preview.match(/(\d+)$/);
        return reply.send({ nextSequence: match ? Number(match[1]) : 1 });
    } catch (err: any) {
        app.log.error(err, 'Failed to get invoice sequence');
        return reply.status(500).send({ error: 'Failed to get invoice sequence.' });
    }
});

app.post('/api/invoices', async (request, reply) => {
    const userId = requireAuth(request, reply);
    if (!userId) return;

    const body = request.body as { invoice?: any; companyId?: string };
    if (!body?.invoice) {
        return reply.status(400).send({ error: 'Invoice payload is required.' });
    }

    const validationError = validateInvoicePayload(body.invoice);
    if (validationError) {
        return reply.status(400).send({ error: validationError });
    }

    const requestedCompanyId = body.companyId && body.companyId !== 'local-company' ? body.companyId : null;

    try {
        const membership = await getPrimaryMembership(userId);
        if (!membership) {
            return reply.status(400).send({ error: 'No company found for this user. Create a company before saving an invoice.' });
        }

        if (requestedCompanyId && requestedCompanyId !== membership.companyId) {
            return reply.status(403).send({ error: 'Forbidden.' });
        }

        if (!QUOTATION_ROLES.includes(membership.role)) {
            return reply.status(403).send({ error: 'Forbidden.' });
        }

        const invoice = await createInvoiceForCompany(membership.companyId, {
            ...body.invoice,
            company_id: membership.companyId,
        });
        return reply.status(201).send({ invoice });
    } catch (err: any) {
        app.log.error(err, 'Failed to create invoice');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 403) return reply.status(403).send({ error: 'Forbidden.' });
        if (statusCode === 409) return reply.status(409).send({ error: err.message });
        return reply.status(500).send({ error: 'Failed to save invoice.' });
    }
});

app.put('/api/invoices/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    if (!body || typeof body !== 'object') {
        return reply.status(400).send({ error: 'Invoice payload is required.' });
    }

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const existing = await getInvoiceRowById(id);
            return existing?.company_id ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    try {
        const invoice = await updateInvoiceRow(id, membership.companyId, body);
        return reply.send({ invoice });
    } catch (err: any) {
        app.log.error(err, 'Failed to update invoice');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400) return reply.status(400).send({ error: err.message });
        if (statusCode === 409) return reply.status(409).send({ error: err.message });
        return reply.status(500).send({ error: 'Failed to update invoice.' });
    }
});

app.post('/api/invoices/:id/issue', async (request, reply) => {
    const { id } = request.params as { id: string };

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const existing = await getInvoiceRowById(id);
            return existing?.company_id ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    try {
        const invoice = await issueInvoiceRow(id, membership.companyId);
        return reply.send({ invoice });
    } catch (err: any) {
        app.log.error(err, 'Failed to issue invoice');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 409) return reply.status(409).send({ error: err.message });
        return reply.status(500).send({ error: 'Failed to issue invoice.' });
    }
});

app.post('/api/invoices/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string };

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const existing = await getInvoiceRowById(id);
            return existing?.company_id ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    try {
        const invoice = await cancelInvoiceRow(id, membership.companyId);
        return reply.send({ invoice });
    } catch (err: any) {
        app.log.error(err, 'Failed to cancel invoice');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 409) return reply.status(409).send({ error: err.message });
        return reply.status(500).send({ error: 'Failed to cancel invoice.' });
    }
});

app.delete('/api/invoices/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const existing = await getInvoiceRowById(id);
            return existing?.company_id ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    try {
        const result = await deleteInvoiceRow(id, membership.companyId);
        return reply.send(result);
    } catch (err: any) {
        app.log.error(err, 'Failed to delete invoice');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 409) return reply.status(409).send({ error: err.message });
        return reply.status(500).send({ error: 'Failed to delete invoice.' });
    }
});

// ─── Receipts & Payments ─────────────────────────────────────────────────────

app.get('/api/receipts', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
    if (!membership) return;

    const { projectId, customerId } = request.query as { projectId?: string; customerId?: string };
    try {
        const receipts = await listReceiptsForCompany(membership.companyId, {
            projectId: projectId && projectId !== 'null' ? projectId : null,
            customerId: customerId && customerId !== 'null' ? customerId : null,
        });
        return reply.send({ receipts });
    } catch (err: any) {
        app.log.error(err, 'Failed to list receipts');
        return reply.status(500).send({ error: 'Failed to load receipts.' });
    }
});

app.get('/api/receipts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const receipt = await getReceiptRowById(id);
            return receipt?.companyId ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    const receipt = await getReceiptRowById(id);
    if (!receipt) {
        return reply.status(404).send({ error: 'Receipt not found.' });
    }

    const allocations = await listPaymentAllocationsForReceipt(id, membership.companyId);
    return reply.send({ receipt: { ...receipt, allocations } });
});

app.post('/api/receipts', async (request, reply) => {
    const userId = requireAuth(request, reply);
    if (!userId) return;

    const body = request.body as { receipt?: any; companyId?: string };
    if (!body?.receipt) {
        return reply.status(400).send({ error: 'Receipt payload is required.' });
    }

    const membership = await getPrimaryMembership(userId);
    if (!membership) {
        return reply.status(400).send({ error: 'No company found for this user. Create a company before saving a receipt.' });
    }

    const requestedCompanyId = body.companyId && body.companyId !== 'local-company' ? body.companyId : null;
    if (requestedCompanyId && requestedCompanyId !== membership.companyId) {
        return reply.status(403).send({ error: 'Forbidden.' });
    }
    if (!QUOTATION_ROLES.includes(membership.role)) {
        return reply.status(403).send({ error: 'Forbidden.' });
    }

    try {
        const receipt = await createReceiptForCompany(membership.companyId, { ...body.receipt, company_id: membership.companyId }, userId);
        return reply.status(201).send({ receipt });
    } catch (err: any) {
        app.log.error(err, 'Failed to create receipt');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 403 || statusCode === 404 || statusCode === 409) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to save receipt.' });
    }
});

app.put('/api/receipts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const receipt = await getReceiptRowById(id);
            return receipt?.companyId ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    try {
        const receipt = await updateReceiptRow(id, membership.companyId, body ?? {});
        return reply.send({ receipt });
    } catch (err: any) {
        app.log.error(err, 'Failed to update receipt');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 403 || statusCode === 404 || statusCode === 409) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to update receipt.' });
    }
});

app.delete('/api/receipts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const receipt = await getReceiptRowById(id);
            return receipt?.companyId ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    try {
        const result = await deleteReceiptRow(id, membership.companyId);
        return reply.send(result);
    } catch (err: any) {
        app.log.error(err, 'Failed to delete receipt');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to delete receipt.' });
    }
});

app.get('/api/receipts/:id/allocations', async (request, reply) => {
    const { id } = request.params as { id: string };

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const receipt = await getReceiptRowById(id);
            return receipt?.companyId ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    try {
        const allocations = await listPaymentAllocationsForReceipt(id, membership.companyId);
        return reply.send({ allocations });
    } catch (err: any) {
        app.log.error(err, 'Failed to list receipt allocations');
        return reply.status(500).send({ error: 'Failed to load receipt allocations.' });
    }
});

app.post('/api/receipts/:id/allocations', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
        invoiceId?: string;
        invoice_id?: string;
        amount?: number | string;
        invoiceAmount?: number | string;
    };
    const invoiceId = body?.invoiceId ?? body?.invoice_id;
    const amount = body?.amount ?? body?.invoiceAmount ?? 0;

    if (!invoiceId) {
        return reply.status(400).send({ error: 'Invoice is required.' });
    }

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const receipt = await getReceiptRowById(id);
            return receipt?.companyId ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    try {
        const result = await createReceiptAllocationForInvoice(id, invoiceId, membership.companyId, amount);
        return reply.status(201).send(result);
    } catch (err: any) {
        app.log.error(err, 'Failed to allocate receipt');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to allocate receipt.' });
    }
});

app.get('/api/invoices/:id/payments', async (request, reply) => {
    const { id } = request.params as { id: string };

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const invoice = await getInvoiceRowById(id);
            return invoice?.company_id ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    try {
        const allocations = await listPaymentAllocationsForInvoice(id, membership.companyId);
        return reply.send({ allocations });
    } catch (err: any) {
        app.log.error(err, 'Failed to list invoice allocations');
        return reply.status(500).send({ error: 'Failed to load invoice payments.' });
    }
});

// ─── Suppliers ──────────────────────────────────────────────────────────────
app.get('/api/suppliers', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
    if (!membership) return;

    try {
        const suppliers = await listSuppliersForCompany(membership.companyId);
        return reply.send({ suppliers });
    } catch (err: any) {
        app.log.error(err, 'Failed to list suppliers');
        return reply.status(500).send({ error: 'Failed to load suppliers.' });
    }
});

app.get('/api/suppliers/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    let supplier: any = null;

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            supplier = await getSupplierRow(id);
            return supplier?.company_id ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    return reply.send({ supplier });
});

app.post('/api/suppliers', async (request, reply) => {
    const body = request.body as any;
    const validationError = validateSupplierPayload(body);
    if (validationError) {
        return reply.status(400).send({ error: validationError });
    }

    const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
    if (!membership) return;

    try {
        const supplier = await createSupplierForCompany(membership.companyId, body);
        return reply.status(201).send({ supplier });
    } catch (err: any) {
        app.log.error(err, 'Failed to create supplier');
        const statusCode = typeof err?.statusCode === 'number'
            ? err.statusCode
            : err?.code === '23505'
                ? 409
                : 500;
        if (statusCode === 400 || statusCode === 403 || statusCode === 404 || statusCode === 409) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to create supplier.' });
    }
});

app.put('/api/suppliers/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    if (body?.name !== undefined && !isNonEmptyString(body.name)) {
        return reply.status(400).send({ error: 'Supplier name cannot be empty.' });
    }
    const supplierValidationError = validateSupplierPayload({
        name: body?.name ?? 'placeholder',
        mobile: body?.mobile,
        gstin: body?.gstin,
    });
    if (supplierValidationError && supplierValidationError !== 'Supplier name is required.') {
        return reply.status(400).send({ error: supplierValidationError });
    }

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const existing = await getSupplierRow(id);
            return existing?.company_id ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    try {
        const supplier = await updateSupplierRow(id, body);
        return reply.send({ supplier });
    } catch (err: any) {
        app.log.error(err, 'Failed to update supplier');
        const statusCode = typeof err?.statusCode === 'number'
            ? err.statusCode
            : err?.code === '23505'
                ? 409
                : 500;
        if (statusCode === 400 || statusCode === 403 || statusCode === 404 || statusCode === 409) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to update supplier.' });
    }
});

app.delete('/api/suppliers/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const existing = await getSupplierRow(id);
            return existing?.company_id ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    try {
        await deleteSupplierRow(id);
        return reply.send({ ok: true });
    } catch (err: any) {
        app.log.error(err, 'Failed to delete supplier');
        return reply.status(500).send({ error: 'Failed to delete supplier.' });
    }
});

// ─── Projects ───────────────────────────────────────────────────────────────

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

    const projectScope = await getProjectScopedAccessForRead(request, reply, 'projects list');
    if (!projectScope) return;

    try {
        const projects = await Promise.all(Array.from(projectScope.projectIds).map(async (projectId) => getProjectRowById(projectId)));
        return reply.send({ projects: projects.filter(Boolean) });
    } catch (err: any) {
        app.log.error(err, 'Failed to list project-scoped projects');
        return reply.status(500).send({ error: 'Failed to load projects.' });
    }
});

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

app.post('/api/projects', async (request, reply) => {
    const userId = requireAuth(request, reply);
    if (!userId) return;

    const body = request.body as any;

    const validationError = validateProjectPayload(body);
    if (validationError) {
        return reply.status(400).send({ error: validationError });
    }

    const requestedCompanyId = body.company_id || body.companyId || null;
    let membership: CompanyMembership | null;

    try {
        membership = await getPrimaryMembership(userId);

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
                    : (Array.isArray(body.stages) ? body.stages : null),
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
        const expenses = await Promise.all(finalProjectIds.map(async (id) => {
            const project = await getProjectRowById(id);
            if (!project || !projectScope.projectIds.has(id)) return [];
            return listProjectExpensesForCompany(project.company_id, id);
        }));
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
        const result = await createProjectReceiptForProject(payload.projectId, membership.companyId, payload, membership.userId);
        return reply.status(201).send({ receipt: result });
    } catch (err: any) {
        app.log.error(err, 'Failed to create project receipt');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 404 || statusCode === 403) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to save client receipt.' });
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
        if (statusCode === 400 || statusCode === 404 || statusCode === 403) {
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
        if (statusCode === 400 || statusCode === 404 || statusCode === 403) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to delete client receipt.' });
    }
});

app.get('/api/project-purchase-orders', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
    if (!membership) return;

    const projectId = (request.query as { projectId?: string }).projectId;
    if (!projectId) return reply.status(400).send({ error: 'Project is required.' });

    try {
        const companyProjectId = await getProjectCompanyId(projectId);
        if (!companyProjectId || companyProjectId !== membership.companyId) {
            return reply.status(403).send({ error: 'Forbidden.' });
        }

        const purchaseOrders = await listPurchaseOrdersForProject(projectId, membership.companyId);
        return reply.send({ purchaseOrders });
    } catch (err: any) {
        app.log.error(err, 'Failed to list project purchase orders');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to load purchase orders.' });
    }
});

app.get('/api/project-purchase-orders/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
    if (!membership) return;

    try {
        const purchaseOrder = await getPurchaseOrderById(id, membership.companyId);
        if (!purchaseOrder) {
            return reply.status(404).send({ error: 'Purchase order not found.' });
        }

        const companyProjectId = await getProjectCompanyId(purchaseOrder.projectId);
        if (!companyProjectId || companyProjectId !== membership.companyId) {
            return reply.status(403).send({ error: 'Forbidden.' });
        }

        return reply.send({ purchaseOrder });
    } catch (err: any) {
        app.log.error(err, 'Failed to fetch project purchase order');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 403 || statusCode === 404) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to load purchase order.' });
    }
});

app.post('/api/project-purchase-orders', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
    if (!membership) return;

    const body = request.body as { purchaseOrder?: any };
    const payload = body?.purchaseOrder ?? body;
    if (!payload?.projectId) {
        return reply.status(400).send({ error: 'Project is required.' });
    }

    try {
        const purchaseOrder = await createPurchaseOrderForProject(payload.projectId, membership.companyId, payload);
        return reply.status(201).send({ purchaseOrder });
    } catch (err: any) {
        app.log.error(err, 'Failed to create project purchase order');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to save purchase order.' });
    }
});

app.put('/api/project-purchase-orders/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { purchaseOrder?: any };
    const payload = body?.purchaseOrder ?? body;

    const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
    if (!membership) return;

    try {
        const existing = await getPurchaseOrderById(id, membership.companyId);
        if (!existing) {
            return reply.status(404).send({ error: 'Purchase order not found.' });
        }

        const purchaseOrder = await updatePurchaseOrderForProject(id, membership.companyId, payload ?? {});
        return reply.send({ purchaseOrder });
    } catch (err: any) {
        app.log.error(err, 'Failed to update project purchase order');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to update purchase order.' });
    }
});

app.patch('/api/project-purchase-orders/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string };
    const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
    if (!membership) return;

    const status = (request.body as { status?: unknown })?.status ?? (request.body as any)?.purchaseOrder?.status;
    if (!status) {
        return reply.status(400).send({ error: 'Status is required.' });
    }

    try {
        const purchaseOrder = await updatePurchaseOrderStatus(id, membership.companyId, status);
        return reply.send({ purchaseOrder });
    } catch (err: any) {
        app.log.error(err, 'Failed to update project purchase order status');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to update purchase order status.' });
    }
});

app.post('/api/project-purchase-orders/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string };
    const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
    if (!membership) return;

    try {
        const purchaseOrder = await cancelPurchaseOrder(id, membership.companyId);
        return reply.send({ purchaseOrder });
    } catch (err: any) {
        app.log.error(err, 'Failed to cancel project purchase order');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to cancel purchase order.' });
    }
});

app.get('/api/project-material-receipts', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
    if (!membership) return;

    const projectId = (request.query as { projectId?: string }).projectId;
    if (!projectId) return reply.status(400).send({ error: 'Project is required.' });

    try {
        const companyProjectId = await getProjectCompanyId(projectId);
        if (!companyProjectId || companyProjectId !== membership.companyId) {
            return reply.status(403).send({ error: 'Forbidden.' });
        }

        const materialReceipts = await listMaterialReceiptsForProject(projectId, membership.companyId);
        return reply.send({ materialReceipts });
    } catch (err: any) {
        app.log.error(err, 'Failed to list project material receipts');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to load material receipts.' });
    }
});

app.get('/api/project-material-receipts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
    if (!membership) return;

    try {
        const materialReceipt = await getMaterialReceiptById(id, membership.companyId);
        if (!materialReceipt) {
            return reply.status(404).send({ error: 'Material receipt not found.' });
        }

        const companyProjectId = await getProjectCompanyId(materialReceipt.projectId);
        if (!companyProjectId || companyProjectId !== membership.companyId) {
            return reply.status(403).send({ error: 'Forbidden.' });
        }

        return reply.send({ materialReceipt });
    } catch (err: any) {
        app.log.error(err, 'Failed to fetch project material receipt');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 403 || statusCode === 404) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to load material receipt.' });
    }
});

app.post('/api/project-material-receipts', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
    if (!membership) return;

    const body = request.body as { materialReceipt?: any };
    const payload = body?.materialReceipt ?? body;
    if (!payload?.projectId) {
        return reply.status(400).send({ error: 'Project is required.' });
    }

    try {
        const materialReceipt = await createMaterialReceiptForProject(payload.projectId, membership.companyId, payload);
        return reply.status(201).send({ materialReceipt });
    } catch (err: any) {
        app.log.error(err, 'Failed to create project material receipt');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to save material receipt.' });
    }
});

app.delete('/api/project-material-receipts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
    if (!membership) return;

    try {
        const deleted = await deleteMaterialReceiptForProject(id, membership.companyId);
        return reply.send({ ok: deleted });
    } catch (err: any) {
        app.log.error(err, 'Failed to delete project material receipt');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to delete material receipt.' });
    }
});

app.get('/api/project-stages', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
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

            const stages = await listProjectStagesForProject(projectId, membership.companyId);
            return reply.send({ stages });
        } catch (err: any) {
            app.log.error(err, 'Failed to list project stages');
            return reply.status(500).send({ error: 'Failed to load project stages.' });
        }
    }

    const projectId = (request.query as { projectId?: string }).projectId;
    if (!projectId) {
        return reply.status(400).send({ error: 'Project is required.' });
    }
    const projectScope = await getProjectScopedAccessForRead(request, reply, 'project stages', projectId);
    if (!projectScope) return;

    const project = await getProjectRowById(projectId);
    if (!project) {
        return reply.status(404).send({ error: 'Project not found.' });
    }

    const stages = await listProjectStagesForProject(projectId, project.company_id);
    return reply.send({ stages });
});

app.post('/api/project-stages', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
    if (!membership) return;

    const body = request.body as { stage?: any };
    const payload = body?.stage ?? body;
    if (!payload?.projectId) {
        return reply.status(400).send({ error: 'Project is required.' });
    }

    try {
        const result = await createProjectStageForProject(payload.projectId, membership.companyId, payload, membership.userId);
        return reply.status(201).send({ stage: result });
    } catch (err: any) {
        app.log.error(err, 'Failed to create project stage');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 404 || statusCode === 403) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to save project stage.' });
    }
});

app.put('/api/project-stages/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { stage?: any };
    const payload = body?.stage ?? body;

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const row = await getProjectStageRowById(id);
            return row?.project?.company_id ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    try {
        const result = await updateProjectStageRow(id, membership.companyId, payload ?? {});
        return reply.send({ stage: result });
    } catch (err: any) {
        app.log.error(err, 'Failed to update project stage');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 404 || statusCode === 403) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to update project stage.' });
    }
});

app.delete('/api/project-stages/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const row = await getProjectStageRowById(id);
            return row?.project?.company_id ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    try {
        await deleteProjectStageRow(id, membership.companyId);
        return reply.send({ ok: true });
    } catch (err: any) {
        app.log.error(err, 'Failed to delete project stage');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 404 || statusCode === 403) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to delete project stage.' });
    }
});

app.get('/api/project-progress-updates', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
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

            const updates = await listProjectProgressUpdatesForProject(projectId, membership.companyId);
            return reply.send({ updates });
        } catch (err: any) {
            app.log.error(err, 'Failed to list project progress updates');
            return reply.status(500).send({ error: 'Failed to load site updates.' });
        }
    }

    const projectId = (request.query as { projectId?: string }).projectId;
    if (!projectId) {
        return reply.status(400).send({ error: 'Project is required.' });
    }
    const projectScope = await getProjectScopedAccessForRead(request, reply, 'project progress updates', projectId);
    if (!projectScope) return;

    const project = await getProjectRowById(projectId);
    if (!project) {
        return reply.status(404).send({ error: 'Project not found.' });
    }

    const updates = await listProjectProgressUpdatesForProject(projectId, project.company_id);
    return reply.send({ updates });
});

app.post('/api/project-progress-updates', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
    if (!membership) return;

    const body = request.body as { update?: any };
    const payload = body?.update ?? body;
    if (!payload?.projectId) {
        return reply.status(400).send({ error: 'Project is required.' });
    }

    try {
        const result = await createProjectProgressUpdateForProject(payload.projectId, membership.companyId, payload, membership.userId);
        return reply.status(201).send({ update: result });
    } catch (err: any) {
        app.log.error(err, 'Failed to create project progress update');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 404 || statusCode === 403) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to save site update.' });
    }
});

app.put('/api/project-progress-updates/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { update?: any };
    const payload = body?.update ?? body;

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const row = await getProjectProgressUpdateRowById(id);
            return row?.project?.company_id ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    try {
        const result = await updateProjectProgressUpdateRow(id, membership.companyId, payload ?? {});
        return reply.send({ update: result });
    } catch (err: any) {
        app.log.error(err, 'Failed to update project progress update');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 404 || statusCode === 403) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to update site update.' });
    }
});

app.delete('/api/project-progress-updates/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const row = await getProjectProgressUpdateRowById(id);
            return row?.project?.company_id ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    try {
        await deleteProjectProgressUpdateRow(id, membership.companyId);
        return reply.send({ ok: true });
    } catch (err: any) {
        app.log.error(err, 'Failed to delete project progress update');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 404 || statusCode === 403) {
            return reply.status(statusCode).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Failed to delete site update.' });
    }
});

app.get('/api/project-attachments', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
    if (membership) {
        const projectId = (request.query as { projectId?: string }).projectId;
        if (!projectId) return reply.status(400).send({ error: 'Project is required.' });

        try {
            const attachments = await listProjectAttachmentsForProject(projectId, membership.companyId);
            return reply.send({ attachments });
        } catch (err: any) {
            app.log.error(err, 'Failed to list project attachments');
            return reply.status(500).send({ error: 'Failed to load project attachments.' });
        }
    }

    const projectId = (request.query as { projectId?: string }).projectId;
    if (!projectId) return reply.status(400).send({ error: 'Project is required.' });
    const projectScope = await getProjectScopedAccessForRead(request, reply, 'project attachments', projectId);
    if (!projectScope) return;

    const project = await getProjectRowById(projectId);
    if (!project) {
        return reply.status(404).send({ error: 'Project not found.' });
    }

    const attachments = await listProjectAttachmentsForProject(projectId, project.company_id);
    return reply.send({ attachments });
});

app.post('/api/project-attachments', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
    if (!membership) return;

    const body = request.body as { attachment?: any };
    const payload = body?.attachment ?? body;
    if (!payload?.projectId) return reply.status(400).send({ error: 'Project is required.' });

    try {
        const attachment = await createProjectAttachmentForProject(payload.projectId, membership.companyId, payload, membership.userId);
        return reply.status(201).send({ attachment });
    } catch (err: any) {
        app.log.error(err, 'Failed to create project attachment');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 403 || statusCode === 404) return reply.status(statusCode).send({ error: err.message });
        return reply.status(500).send({ error: 'Failed to save project attachment.' });
    }
});

app.delete('/api/project-attachments/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
    if (!membership) return;

    try {
        await deleteProjectAttachmentRow(id, membership.companyId);
        return reply.send({ ok: true });
    } catch (err: any) {
        app.log.error(err, 'Failed to delete project attachment');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 403 || statusCode === 404) return reply.status(statusCode).send({ error: err.message });
        return reply.status(500).send({ error: 'Failed to delete project attachment.' });
    }
});

app.get('/api/project-client-access', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
    if (!membership) return;

    const projectId = (request.query as { projectId?: string }).projectId;
    if (!projectId) return reply.status(400).send({ error: 'Project is required.' });

    try {
        const access = await listProjectClientAccessForProject(projectId, membership.companyId);
        return reply.send({ access });
    } catch (err: any) {
        app.log.error(err, 'Failed to list project client access');
        return reply.status(500).send({ error: 'Failed to load project client access.' });
    }
});

app.post('/api/project-client-access', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
    if (!membership) return;

    const body = request.body as { access?: any };
    const payload = body?.access ?? body;
    if (!payload?.projectId) return reply.status(400).send({ error: 'Project is required.' });

    try {
        const access = await createProjectClientAccessForProject(payload.projectId, membership.companyId, payload, membership.userId);
        return reply.status(201).send({ access });
    } catch (err: any) {
        app.log.error(err, 'Failed to create project client access');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 403 || statusCode === 404) return reply.status(statusCode).send({ error: err.message });
        return reply.status(500).send({ error: 'Failed to create project client access.' });
    }
});

app.delete('/api/project-client-access/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
    if (!membership) return;

    try {
        await revokeProjectClientAccessRow(id, membership.companyId);
        return reply.send({ ok: true });
    } catch (err: any) {
        app.log.error(err, 'Failed to revoke project client access');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 403 || statusCode === 404) return reply.status(statusCode).send({ error: err.message });
        return reply.status(500).send({ error: 'Failed to revoke project client access.' });
    }
});

app.get('/api/project-expense-payments', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
    if (!membership) return;

    const projectExpenseId = (request.query as { projectExpenseId?: string }).projectExpenseId;
    if (!projectExpenseId) return reply.status(400).send({ error: 'Supplier bill is required.' });

    try {
        const payments = await listProjectExpensePaymentsForExpense(projectExpenseId, membership.companyId);
        return reply.send({ payments });
    } catch (err: any) {
        app.log.error(err, 'Failed to list supplier payments');
        return reply.status(500).send({ error: 'Failed to load supplier payments.' });
    }
});

app.post('/api/project-expense-payments', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
    if (!membership) return;

    const body = request.body as { payment?: any };
    const payload = body?.payment ?? body;
    if (!payload?.projectExpenseId) return reply.status(400).send({ error: 'Supplier bill is required.' });

    try {
        const payment = await createProjectExpensePaymentForExpense(payload.projectExpenseId, membership.companyId, payload, membership.userId);
        return reply.status(201).send({ payment });
    } catch (err: any) {
        app.log.error(err, 'Failed to create supplier payment');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 403 || statusCode === 404) return reply.status(statusCode).send({ error: err.message });
        return reply.status(500).send({ error: 'Failed to save supplier payment.' });
    }
});

app.put('/api/project-expense-payments/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { payment?: any };
    const payload = body?.payment ?? body;

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const row = await getProjectExpensePaymentRowById(id);
            return row?.project?.company_id ?? null;
        },
        { allowedRoles: COMPANY_MANAGEMENT_ROLES },
    );
    if (!membership) return;

    try {
        const payment = await updateProjectExpensePaymentRow(id, membership.companyId, payload ?? {});
        return reply.send({ payment });
    } catch (err: any) {
        app.log.error(err, 'Failed to update supplier payment');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 403 || statusCode === 404) return reply.status(statusCode).send({ error: err.message });
        return reply.status(500).send({ error: 'Failed to update supplier payment.' });
    }
});

app.delete('/api/project-expense-payments/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const row = await getProjectExpensePaymentRowById(id);
            return row?.project?.company_id ?? null;
        },
        { allowedRoles: COMPANY_MANAGEMENT_ROLES },
    );
    if (!membership) return;

    try {
        await voidProjectExpensePaymentRow(id, membership.companyId);
        return reply.send({ ok: true });
    } catch (err: any) {
        app.log.error(err, 'Failed to delete supplier payment');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 403 || statusCode === 404) return reply.status(statusCode).send({ error: err.message });
        return reply.status(500).send({ error: 'Failed to delete supplier payment.' });
    }
});

app.get('/api/project-investors', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
    if (!membership) return;

    const projectId = (request.query as { projectId?: string }).projectId;
    if (!projectId) return reply.status(400).send({ error: 'Project is required.' });

    try {
        const investors = await listProjectInvestorsForProject(projectId, membership.companyId);
        return reply.send({ investors });
    } catch (err: any) {
        app.log.error(err, 'Failed to list project investors');
        return reply.status(500).send({ error: 'Failed to load project investors.' });
    }
});

app.post('/api/project-investors', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
    if (!membership) return;

    const body = request.body as { investor?: any };
    const payload = body?.investor ?? body;
    if (!payload?.projectId || !isNonEmptyString(payload?.name)) {
        return reply.status(400).send({ error: 'Project and investor name are required.' });
    }

    try {
        const investor = await createProjectInvestorForProject(payload.projectId, membership.companyId, payload, membership.userId);
        return reply.status(201).send({ investor });
    } catch (err: any) {
        app.log.error(err, 'Failed to create project investor');
        if (err?.code === '42703' && String(err?.message ?? '').includes('party_id')) {
            return reply.status(500).send({
                error: 'Investor-party linking is not available because the database schema is outdated. Please run migration 0009_project_investor_party_id.sql.',
            });
        }
        const statusCode = typeof err?.statusCode === 'number'
            ? err.statusCode
            : err?.code === '23505'
                ? 409
                : 500;
        if (statusCode === 400 || statusCode === 403 || statusCode === 404 || statusCode === 409) {
            return reply.status(statusCode).send({ error: err.message || 'This investor is already linked to this project.' });
        }
        return reply.status(500).send({ error: 'Failed to save project investor.' });
    }
});

app.put('/api/project-investors/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { investor?: any };
    const payload = body?.investor ?? body;

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const row = await getProjectInvestorRowById(id);
            return row?.project?.company_id ?? null;
        },
        { allowedRoles: COMPANY_MANAGEMENT_ROLES },
    );
    if (!membership) return;

    try {
        const investor = await updateProjectInvestorRow(id, membership.companyId, payload ?? {});
        return reply.send({ investor });
    } catch (err: any) {
        app.log.error(err, 'Failed to update project investor');
        if (err?.code === '42703' && String(err?.message ?? '').includes('party_id')) {
            return reply.status(500).send({
                error: 'Investor-party linking is not available because the database schema is outdated. Please run migration 0009_project_investor_party_id.sql.',
            });
        }
        const statusCode = typeof err?.statusCode === 'number'
            ? err.statusCode
            : err?.code === '23505'
                ? 409
                : 500;
        if (statusCode === 400 || statusCode === 403 || statusCode === 404 || statusCode === 409) {
            return reply.status(statusCode).send({ error: err.message || 'This investor is already linked to this project.' });
        }
        return reply.status(500).send({ error: 'Failed to update project investor.' });
    }
});

app.delete('/api/project-investors/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => getProjectInvestorCompanyIdById(id),
        { allowedRoles: COMPANY_MANAGEMENT_ROLES },
    );
    if (!membership) return;

    try {
        await deleteProjectInvestorRow(id, membership.companyId);
        return reply.send({ ok: true });
    } catch (err: any) {
        app.log.error(err, 'Failed to delete project investor');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 403 || statusCode === 404) return reply.status(statusCode).send({ error: err.message });
        return reply.status(500).send({ error: 'Failed to delete project investor.' });
    }
});

app.get('/api/investor-contributions', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
    if (!membership) return;

    const investorId = (request.query as { investorId?: string }).investorId;
    if (!investorId) return reply.status(400).send({ error: 'Investor is required.' });

    try {
        const contributions = await listInvestorContributionsForInvestor(investorId, membership.companyId);
        return reply.send({ contributions });
    } catch (err: any) {
        app.log.error(err, 'Failed to list investor contributions');
        return reply.status(500).send({ error: 'Failed to load investor contributions.' });
    }
});

app.post('/api/investor-contributions', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
    if (!membership) return;

    const body = request.body as { contribution?: any };
    const payload = body?.contribution ?? body;
    if (!payload?.investorId) return reply.status(400).send({ error: 'Investor is required.' });

    try {
        const contribution = await createInvestorContributionForInvestor(payload.investorId, membership.companyId, payload, membership.userId);
        return reply.status(201).send({ contribution });
    } catch (err: any) {
        app.log.error(err, 'Failed to create investor contribution');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 403 || statusCode === 404) return reply.status(statusCode).send({ error: err.message });
        return reply.status(500).send({ error: err.message || 'Failed to save investor contribution.' });
    }
});

app.put('/api/investor-contributions/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { contribution?: any };
    const payload = body?.contribution ?? body;

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const row = await getInvestorContributionRowById(id);
            return row?.project?.company_id ?? null;
        },
        { allowedRoles: COMPANY_MANAGEMENT_ROLES },
    );
    if (!membership) return;

    try {
        const contribution = await updateInvestorContributionRow(id, membership.companyId, payload ?? {});
        return reply.send({ contribution });
    } catch (err: any) {
        app.log.error(err, 'Failed to update investor contribution');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400 || statusCode === 403 || statusCode === 404) return reply.status(statusCode).send({ error: err.message });
        return reply.status(500).send({ error: 'Failed to update investor contribution.' });
    }
});

app.delete('/api/investor-contributions/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const row = await getInvestorContributionRowById(id);
            return row?.project?.company_id ?? null;
        },
        { allowedRoles: COMPANY_MANAGEMENT_ROLES },
    );
    if (!membership) return;

    try {
        await deleteInvestorContributionRow(id, membership.companyId);
        return reply.send({ ok: true });
    } catch (err: any) {
        app.log.error(err, 'Failed to delete investor contribution');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 403 || statusCode === 404) return reply.status(statusCode).send({ error: err.message });
        return reply.status(500).send({ error: 'Failed to delete investor contribution.' });
    }
});

const MASTER_TABLE_MAP: Record<string, string> = {
    projectTypes: 'project_types',
    units: 'units_of_measure',
    expenseCategories: 'expense_categories',
    paymentMethods: 'payment_methods',
    taxRates: 'tax_rates',
    stageTemplates: 'project_stage_templates',
};

function getMasterRowKey(table: string, row: any): string {
    if (table === 'project_stage_templates') {
        const key = String(row?.template_code ?? row?.code ?? row?.name ?? '').trim().toLowerCase();
        const projectTypeId = row?.project_type_id ?? 'global';
        return `${table}:${String(projectTypeId)}:${key}`;
    }
    const key = String(row?.code ?? '').trim().toLowerCase();
    return `${table}:${key}`;
}

function isMasterRowActive(row: any): boolean {
    if (!row || row.is_active === false) return false;
    return true;
}

function isTaxRateCurrent(row: any, todayIso: string): boolean {
    if (!row || row.is_active === false) return false;
    const effectiveFrom = String(row.effective_from ?? '').trim();
    const effectiveTo = String(row.effective_to ?? '').trim();
    if (effectiveFrom && effectiveFrom > todayIso) return false;
    if (effectiveTo && effectiveTo < todayIso) return false;
    return true;
}

function mergeMasterRows(rows: any[], table: string, companyId: string): any[] {
    const merged = new Map<string, any>();
    const todayIso = new Date().toISOString().slice(0, 10);

    for (const row of rows ?? []) {
        if (row?.company_id != null && row.company_id !== companyId) {
            continue;
        }
        if (!isMasterRowActive(row)) continue;
        if (table === 'tax_rates' && !isTaxRateCurrent(row, todayIso)) continue;

        const key = getMasterRowKey(table, row);
        const existing = merged.get(key);
        if (!existing || (row.company_id === companyId && existing.company_id !== companyId)) {
            merged.set(key, row);
        }
    }

    return Array.from(merged.values()).sort((a, b) => {
        if (table === 'tax_rates') {
            const aDate = new Date(String(a?.effective_from ?? '1970-01-01')).getTime();
            const bDate = new Date(String(b?.effective_from ?? '1970-01-01')).getTime();
            if (aDate !== bDate) return bDate - aDate;
        }

        const aSort = Number(a?.sort_order ?? a?.sequence_number ?? 0);
        const bSort = Number(b?.sort_order ?? b?.sequence_number ?? 0);
        if (aSort !== bSort) return aSort - bSort;
        if (table === 'project_stage_templates') {
            const aSeq = Number(a?.sequence_number ?? Number.MAX_SAFE_INTEGER);
            const bSeq = Number(b?.sequence_number ?? Number.MAX_SAFE_INTEGER);
            if (aSeq !== bSeq) return aSeq - bSeq;
        }
        const aLabel = String(a?.name ?? a?.code ?? a?.template_code ?? '').toLowerCase();
        const bLabel = String(b?.name ?? b?.code ?? b?.template_code ?? '').toLowerCase();
        return aLabel.localeCompare(bLabel);
    });
}

app.get('/api/masters/:type', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_READ_ROLES });
    if (!membership) return;

    const { type } = request.params as { type: string };
    const table = MASTER_TABLE_MAP[type];
    if (!table) return reply.status(404).send({ error: 'Master type not found.' });

    try {
        let query = supabaseAdmin.from(table).select('*').or(`company_id.eq.${membership.companyId},company_id.is.null`);
        if (table === 'tax_rates') query = query.order('effective_from', { ascending: false });
        else if (table === 'project_stage_templates') query = query.order('sequence_number', { ascending: true });
        else query = query.order('sort_order', { ascending: true });
        const { data, error } = await query;
        if (error) throw error;
        return reply.send({ items: mergeMasterRows(data ?? [], table, membership.companyId) });
    } catch (err: any) {
        app.log.error(err, 'Failed to load master data');
        return reply.status(500).send({ error: 'Failed to load master data.' });
    }
});

app.post('/api/masters/:type', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
    if (!membership) return;

    const { type } = request.params as { type: string };
    const body = request.body as any;
    const table = MASTER_TABLE_MAP[type];
    if (!table) return reply.status(404).send({ error: 'Master type not found.' });

    try {
        if (body?.company_id && body.company_id !== membership.companyId) {
            return reply.status(403).send({ error: 'Forbidden.' });
        }

        const payload = { ...body, company_id: body?.company_id ?? membership.companyId };
        if (table === 'tax_rates') {
            payload.code = String(payload.code ?? '').trim();
            payload.name = String(payload.name ?? '').trim();
            payload.rate_percentage = Number(payload.rate_percentage ?? payload.ratePercentage ?? 0);
            payload.effective_from = payload.effective_from ?? payload.effectiveFrom ?? null;
        }
        const { data, error } = await supabaseAdmin.from(table).insert(payload).select('*').single();
        if (error) throw error;
        return reply.status(201).send({ item: data });
    } catch (err: any) {
        app.log.error(err, 'Failed to create master data row');
        return reply.status(500).send({ error: 'Failed to create master data row.' });
    }
});

app.put('/api/masters/:type/:id', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
    if (!membership) return;

    const { type, id } = request.params as { type: string; id: string };
    const body = request.body as any;
    const table = MASTER_TABLE_MAP[type];
    if (!table) return reply.status(404).send({ error: 'Master type not found.' });

    try {
        if (body?.company_id && body.company_id !== membership.companyId) {
            return reply.status(403).send({ error: 'Forbidden.' });
        }

        const { data: existing, error: existingError } = await supabaseAdmin.from(table).select('id, company_id').eq('id', id).maybeSingle();
        if (existingError) throw existingError;
        if (!existing) return reply.status(404).send({ error: 'Master row not found.' });
        if (existing.company_id !== membership.companyId) return reply.status(403).send({ error: 'Forbidden.' });

        const payload = { ...(body ?? {}), company_id: membership.companyId };
        const { data, error } = await supabaseAdmin.from(table).update(payload).eq('id', id).select('*').single();
        if (error) throw error;
        return reply.send({ item: data });
    } catch (err: any) {
        app.log.error(err, 'Failed to update master data row');
        return reply.status(500).send({ error: 'Failed to update master data row.' });
    }
});

app.delete('/api/masters/:type/:id', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
    if (!membership) return;

    const { type, id } = request.params as { type: string; id: string };
    const table = MASTER_TABLE_MAP[type];
    if (!table) return reply.status(404).send({ error: 'Master type not found.' });

    try {
        const { data: existing, error: existingError } = await supabaseAdmin.from(table).select('id, company_id').eq('id', id).maybeSingle();
        if (existingError) throw existingError;
        if (!existing) return reply.status(404).send({ error: 'Master row not found.' });
        if (existing.company_id !== membership.companyId) return reply.status(403).send({ error: 'Forbidden.' });

        const { error } = await supabaseAdmin.from(table).update({ is_active: false }).eq('id', id);
        if (error) throw error;
        return reply.send({ ok: true });
    } catch (err: any) {
        app.log.error(err, 'Failed to delete master data row');
        return reply.status(500).send({ error: 'Failed to delete master data row.' });
    }
});

app.get('/api/reports/dashboard', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
    if (!membership) return;

    try {
        const report = await getCompanyFinancialReport(membership.companyId, null);
        return reply.send({ dashboard: report });
    } catch (err: any) {
        app.log.error(err, 'Failed to generate dashboard report');
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
        const projects = await Promise.all(Array.from(projectScope.projectIds).map(async (projectId) => getProjectRowById(projectId)));
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
        const expensesLists = await Promise.all(projectIds.map(async (id) => {
            const project = await getProjectRowById(id);
            if (!project || !projectScope.projectIds.has(id)) return [] as any[];
            return listProjectExpensesForCompany(project.company_id, id);
        }));
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
        const expensesLists = await Promise.all(projectIds.map(async (id) => {
            const project = await getProjectRowById(id);
            if (!project || !projectScope.projectIds.has(id)) return [] as any[];
            return listProjectExpensesForCompany(project.company_id, id);
        }));
        const expenses = expensesLists.flat();
        const outstandingByExpense = await getOutstandingByExpenseId(projectIds.length > 0 ? (await getProjectRowById(projectIds[0]))?.company_id ?? '' : '', projectId ?? null);
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
        const investorSummaries = await Promise.all(investors.map(async (investor: any) => {
            const contributions = await listInvestorContributionsForInvestor(investor.id, membership.companyId);
            const totalContributed = contributions.reduce((sum: number, row: any) => sum + Number(row.amount ?? 0), 0);
            return { investor, contributions, totalContributed };
        }));
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

// ─── Team management ────────────────────────────────────────────────────────
// Owner/admin only for adding/editing members — companyId is always the
// requested-and-verified company via authorizeCompany, never trusted from
// the frontend directly. Backs the Team page: an admin creates a login
// (typing the password themselves) for a teammate who doesn't have an
// account yet, or links an existing account to this company.

app.get('/api/company/:companyId/users', async (request, reply) => {
    const { companyId } = request.params as { companyId: string };

    const membership = await authorizeCompany(request, reply, {
        requestedCompanyId: companyId,
        allowedRoles: COMPANY_READ_ROLES, // any active member can see who else is on the team
    });
    if (!membership) return;

    try {
        const members = await listTeamMembers(membership.companyId);
        return reply.send({ members });
    } catch (err: any) {
        app.log.error(err, 'Failed to list team members');
        return reply.status(500).send({ error: 'Failed to load team members.' });
    }
});

app.post('/api/company/:companyId/users', async (request, reply) => {
    const { companyId } = request.params as { companyId: string };
    const body = request.body as { email?: string; fullName?: string; password?: string; role?: 'admin' | 'staff' };

    const validationError = validateAddTeamMemberPayload(body);
    if (validationError) {
        return reply.status(400).send({ error: validationError });
    }

    const membership = await authorizeCompany(request, reply, {
        requestedCompanyId: companyId,
        allowedRoles: COMPANY_MANAGEMENT_ROLES, // owner/admin only
    });
    if (!membership) return;

    try {
        const result = await createOrLinkTeamMember(
            membership.companyId,
            body.email!.trim().toLowerCase(),
            body.role!,
            body.password,
            body.fullName?.trim() || null,
        );
        return reply.status(201).send({ member: result });
    } catch (err: any) {
        app.log.error(err, 'Failed to add team member');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 400) return reply.status(400).send({ error: err.message });
        if (statusCode === 409) return reply.status(409).send({ error: err.message });
        return reply.status(500).send({ error: 'Failed to add team member.' });
    }
});

app.put('/api/company/:companyId/users/:userId', async (request, reply) => {
    const { companyId, userId: targetUserId } = request.params as { companyId: string; userId: string };
    const body = request.body as { role?: 'admin' | 'staff'; isActive?: boolean };

    if (body.role !== undefined && body.role !== 'admin' && body.role !== 'staff') {
        return reply.status(400).send({ error: 'Role must be admin or staff.' });
    }

    const membership = await authorizeCompany(request, reply, {
        requestedCompanyId: companyId,
        allowedRoles: COMPANY_MANAGEMENT_ROLES, // owner/admin only
    });
    if (!membership) return;

    if (targetUserId === membership.userId) {
        return reply.status(400).send({ error: 'You cannot change your own membership here.' });
    }

    try {
        await updateTeamMember(membership.companyId, targetUserId, { role: body.role, isActive: body.isActive });
        return reply.send({ ok: true });
    } catch (err: any) {
        app.log.error(err, 'Failed to update team member');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 404) return reply.status(404).send({ error: err.message });
        if (statusCode === 400) return reply.status(400).send({ error: err.message });
        return reply.status(500).send({ error: 'Failed to update team member.' });
    }
});

// ─── Subscription / Billing ─────────────────────────────────────────────────
// Billing belongs to the COMPANY, never an individual user — every route here
// resolves companyId the same way as everywhere else (JWT -> company_users),
// never from anything the client claims. Status is readable by any active
// member; checkout/verify/cancel are owner/admin only, same tier as company
// settings management.

app.get('/api/subscription', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
    if (!membership) return;

    try {
        const summary = await getSubscriptionSummary(membership.companyId);
        return reply.send(summary);
    } catch (err: any) {
        app.log.error(err, 'Failed to load subscription');
        return reply.status(500).send({ error: 'Failed to load subscription.' });
    }
});

app.post('/api/subscription/checkout', async (request, reply) => {
    const body = request.body as { billingCycle?: BillingCycle };
    if (body?.billingCycle !== 'monthly' && body?.billingCycle !== 'yearly') {
        return reply.status(400).send({ error: 'billingCycle must be "monthly" or "yearly".' });
    }

    const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
    if (!membership) return;

    try {
        const order = await createRazorpayOrder(membership.companyId, body.billingCycle);
        return reply.send({
            ...order,
            keyId: process.env.RAZORPAY_KEY_ID,
            billingCycle: body.billingCycle,
        });
    } catch (err: any) {
        app.log.error(err, 'Failed to create checkout order');
        const message = getErrorText(err);
        if (/Razorpay checkout is temporarily unavailable|ECONNRESET|fetch failed|TLS|network|timeout|timed out|socket disconnected/i.test(message) || isTransientNetworkError(err)) {
            return reply.status(503).send({ error: 'Payment gateway is temporarily unavailable. Please try again in a moment.' });
        }
        return reply.status(500).send({ error: 'Failed to start checkout.' });
    }
});

app.post('/api/subscription/verify', async (request, reply) => {
    const body = request.body as {
        billingCycle?: BillingCycle;
        razorpayOrderId?: string;
        razorpayPaymentId?: string;
        razorpaySignature?: string;
    };
    if (
        (body?.billingCycle !== 'monthly' && body?.billingCycle !== 'yearly') ||
        !isNonEmptyString(body?.razorpayOrderId) ||
        !isNonEmptyString(body?.razorpayPaymentId) ||
        !isNonEmptyString(body?.razorpaySignature)
    ) {
        return reply.status(400).send({ error: 'Missing or invalid payment details.' });
    }

    const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
    if (!membership) return;

    try {
        // The ONLY thing that determines whether this payment is real —
        // never trust a frontend claim of "payment succeeded" on its own.
        const valid = verifyRazorpaySignature(body.razorpayOrderId!, body.razorpayPaymentId!, body.razorpaySignature!);
        if (!valid) {
            return reply.status(400).send({ error: 'Payment verification failed.' });
        }

        await applySuccessfulPayment(membership.companyId, body.billingCycle!, body.razorpayOrderId!, body.razorpayPaymentId!);
        return reply.send({ ok: true });
    } catch (err: any) {
        app.log.error(err, 'Failed to verify payment');
        return reply.status(500).send({ error: 'Failed to verify payment.' });
    }
});

app.post('/api/subscription/cancel', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
    if (!membership) return;

    try {
        await cancelSubscription(membership.companyId);
        return reply.send({ ok: true });
    } catch (err: any) {
        app.log.error(err, 'Failed to cancel subscription');
        return reply.status(500).send({ error: 'Failed to cancel subscription.' });
    }
});

// Razorpay webhook — the authoritative, server-to-server confirmation that a
// payment succeeded, independent of whether the customer's browser stayed
// open long enough for the Checkout success callback to fire (a closed tab
// or dropped connection right after paying would otherwise leave the
// company stuck on the free plan despite a completed charge). Configure
// this URL in the Razorpay dashboard, subscribed to "payment.captured".
// No JWT here — Razorpay calls this directly — so the ONLY trust boundary
// is the webhook signature, verified against the raw request body.
app.post('/api/webhooks/razorpay', async (request, reply) => {
    const signature = request.headers['x-razorpay-signature'] as string | undefined;
    const rawBody = (request as any).rawBody as Buffer | undefined;

    if (!signature || !rawBody) {
        return reply.status(400).send({ error: 'Missing signature or body.' });
    }

    let validSignature: boolean;
    try {
        validSignature = verifyRazorpayWebhookSignature(rawBody, signature);
    } catch (err: any) {
        app.log.error(err, 'Razorpay webhook not configured');
        return reply.status(500).send({ error: 'Webhook not configured.' });
    }
    if (!validSignature) {
        app.log.warn('Rejected Razorpay webhook: invalid signature');
        return reply.status(400).send({ error: 'Invalid signature.' });
    }

    try {
        const event = request.body as any;
        if (event?.event === 'payment.captured') {
            const payment = event?.payload?.payment?.entity;
            if (payment?.order_id && payment?.id) {
                await confirmPaymentFromWebhook(payment.order_id, payment.id);
            }
        }
        // 2xx for anything verified, whether or not we acted on it — an
        // event type we don't handle isn't a delivery failure and shouldn't
        // trigger Razorpay's retry schedule.
        return reply.send({ received: true });
    } catch (err: any) {
        app.log.error(err, 'Failed to process Razorpay webhook');
        // A real processing failure (e.g. a transient DB error) SHOULD be
        // retried by Razorpay, hence non-2xx here specifically.
        return reply.status(500).send({ error: 'Webhook processing failed.' });
    }
});

// ─── Flat Billing / Booking Receipts ────────────────────────────────────────
// Same persistence architecture as quotations (documents + payment_schedules
// + document_terms + customers, document_type = 'BookingReceipt'), plus the
// dedicated booking_receipt_details table for receipt-only fields. Previously
// this data lived only in browser localStorage (see src/lib/flatBilling.ts on
// the frontend) — these routes move it behind the authorized backend so it's
// company-scoped, backed up, and available across devices like quotations.

app.get('/api/flat-billings', async (request, reply) => {
    const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
    if (!membership) return;

    const projectId = (request.query as { projectId?: string } | undefined)?.projectId ?? null;

    try {
        const flatBillings = await listFlatBillingsForCompany(membership.companyId, projectId || null);
        return reply.send({ flatBillings });
    } catch (err: any) {
        app.log.error(err, 'Failed to list flat billings');
        return reply.status(500).send({ error: 'Failed to load receipts.' });
    }
});

app.get('/api/flat-billings/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    let flatBilling: any = null;

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            flatBilling = await getFlatBillingRow(id);
            return flatBilling?.company_id ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    return reply.send({ flatBilling });
});

app.post('/api/flat-billings', async (request, reply) => {
    const userId = requireAuth(request, reply);
    if (!userId) return;

    const body = request.body as { flatBilling?: any; companyId?: string };
    if (!body?.flatBilling) {
        return reply.status(400).send({ error: 'Receipt payload is required.' });
    }

    const validationError = validateFlatBillingPayload(body.flatBilling);
    if (validationError) {
        return reply.status(400).send({ error: validationError });
    }

    const requestedCompanyId = body.companyId && body.companyId !== 'local-company' ? body.companyId : null;

    try {
        const membership = await getPrimaryMembership(userId);

        if (!membership) {
            return reply.status(400).send({ error: 'No company found for this user. Create a company before saving a receipt.' });
        }

        if (requestedCompanyId && requestedCompanyId !== membership.companyId) {
            return reply.status(403).send({ error: 'Forbidden.' });
        }

        if (!QUOTATION_ROLES.includes(membership.role)) {
            return reply.status(403).send({ error: 'Forbidden.' });
        }

        const result = await saveFlatBillingToDatabase(body.flatBilling, membership.companyId);
        return reply.send(result);
    } catch (err: any) {
        app.log.error(err, 'Failed to save flat billing');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 403) return reply.status(403).send({ error: 'Forbidden.' });
        if (statusCode === 409) return reply.status(409).send({ error: err.message });
        return reply.status(500).send({ error: 'Failed to save receipt.' });
    }
});

app.delete('/api/flat-billings/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const { data, error } = await supabaseAdmin
                .from('documents')
                .select('id, company_id')
                .eq('id', id)
                .eq('document_type', 'BookingReceipt')
                .eq('is_deleted', false)
                .maybeSingle();
            if (error) throw error;
            return data?.company_id ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    try {
        await softDeleteFlatBilling(id, membership.userId);
        return reply.send({ ok: true });
    } catch (err: any) {
        app.log.error(err, 'Failed to delete flat billing');
        return reply.status(500).send({ error: 'Failed to delete receipt.' });
    }
});

app.get('/api/flat-billings/next-sequence', async (request, reply) => {
    const userId = requireAuth(request, reply);
    if (!userId) return;

    const queryCompanyId = (request.query as { companyId?: string }).companyId;
    const requestedCompanyId = queryCompanyId && queryCompanyId !== 'local-company' ? queryCompanyId : null;

    try {
        const membership = await getPrimaryMembership(userId);

        if (!membership) {
            return reply.send({ nextSequence: 1 });
        }

        if (requestedCompanyId && requestedCompanyId !== membership.companyId) {
            return reply.status(403).send({ error: 'Forbidden.' });
        }

        const preview = await peekNextDocumentNumber(membership.companyId, 'BookingReceipt');
        const match = preview.match(/(\d+)$/);
        return reply.send({ nextSequence: match ? Number(match[1]) : 1 });
    } catch (err: any) {
        app.log.error(err, 'Failed to get receipt sequence');
        return reply.status(500).send({ error: 'Failed to get receipt sequence.' });
    }
});

// ─── Quotation persistence ─────────────────────────────────────────────────

app.post('/api/quotations', async (request, reply) => {
    const userId = requireAuth(request, reply);
    if (!userId) return;

    const body = request.body as { quotation?: any; companyId?: string };
    if (!body?.quotation) {
        return reply.status(400).send({ error: 'Quotation payload is required.' });
    }

    const validationError = validateQuotationPayload(body.quotation);
    if (validationError) {
        return reply.status(400).send({ error: validationError });
    }

    // body.companyId (and the old body.userId) are frontend-supplied context
    // ONLY — never trusted directly. If a specific companyId was requested it
    // must be verified against company_users; the authenticated user_id from
    // the JWT is always used, never a client-supplied one.
    const requestedCompanyId = body.companyId && body.companyId !== 'local-company' ? body.companyId : null;

    try {
        const membership = await getPrimaryMembership(userId);

        if (!membership) {
            return reply.status(400).send({ error: 'No company found for this user. Create a company before saving a quotation.' });
        }

        if (requestedCompanyId && requestedCompanyId !== membership.companyId) {
            return reply.status(403).send({ error: 'Forbidden.' });
        }

        if (!QUOTATION_ROLES.includes(membership.role)) {
            return reply.status(403).send({ error: 'Forbidden.' });
        }

        const result = await saveQuotationToDatabase(body.quotation, membership.companyId);
        return reply.send(result);
    } catch (err: any) {
        app.log.error(err, 'Failed to save quotation');
        if (err?.code === 'QUOTATION_LIMIT_REACHED') {
            return reply.status(403).send({ error: err.message, code: err.code });
        }
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 403) return reply.status(403).send({ error: 'Forbidden.' });
        if (statusCode === 409) return reply.status(409).send({ error: err.message });
        return reply.status(500).send({ error: 'Failed to save quotation.' });
    }
});

app.get('/api/quotations', async (request, reply) => {
    const userId = requireAuth(request, reply);
    if (!userId) return;

    try {
        // No explicit companyId here — use the caller's own membership.
        // Any active role (owner/admin/staff) may list their company's quotations.
        const membership = await getPrimaryMembership(userId);
        if (!membership) {
            return reply.send({ quotations: [] });
        }

        const quotations = await getQuotationRowsForCompany(membership.companyId);
        return reply.send({ quotations });
    } catch (err: any) {
        app.log.error(err, 'Failed to list quotations');
        return reply.status(500).send({ error: 'Failed to load quotations.' });
    }
});

app.get('/api/quotations/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    // This resource is identified only by its own id — load the row first to
    // find which company owns it, THEN verify the authenticated user belongs
    // to that company. A client-supplied company is never trusted; here there
    // isn't even one to trust, the id alone determines the owning company.
    let quotation: any = null;
    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            quotation = await getQuotationRowById(id);
            return quotation?.company_id ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    return reply.send({ quotation });
});

app.delete('/api/quotations/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    // This resource is identified only by its own id — load the row first to
    // find which company owns it, THEN verify the authenticated user belongs
    // to that company (and, being a delete, keep it open to any of the
    // existing quotation roles rather than restricting it further). Already
    // soft-deleted rows are excluded here so a repeat delete 404s cleanly
    // instead of re-touching a quotation that's already gone.
    const membership = await authorizeOwnedResource(
        request,
        reply,
        async () => {
            const { data, error } = await supabaseAdmin
                .from('documents')
                .select('id, company_id')
                .eq('id', id)
                .eq('is_deleted', false)
                .maybeSingle();
            if (error) throw error;
            return data?.company_id ?? null;
        },
        { allowedRoles: QUOTATION_ROLES },
    );
    if (!membership) return;

    try {
        // Soft delete: preserve the quotation and all of its BOQ/child data
        // (document_sections, document_items, specifications, inclusions,
        // exclusions, payment_schedules, terms) for history — only flag it
        // as deleted and hide it from normal list/get queries (see
        // getQuotationRowsForCompany / getQuotationRowById above).
        const { error } = await supabaseAdmin
            .from('documents')
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                deleted_by: membership.userId,
            })
            .eq('id', id);
        if (error) throw error;

        return reply.send({ ok: true });
    } catch (err: any) {
        app.log.error(err, 'Failed to delete quotation');
        return reply.status(500).send({ error: 'Failed to delete quotation.' });
    }
});

app.get('/api/quotations/next-sequence', async (request, reply) => {
    const userId = requireAuth(request, reply);
    if (!userId) return;

    // The query-string companyId is frontend-supplied context ONLY — it is
    // never used directly as a filter. It must first be verified against
    // company_users, exactly like every other companyId in this file.
    const queryCompanyId = (request.query as { companyId?: string }).companyId;
    const requestedCompanyId = queryCompanyId && queryCompanyId !== 'local-company' ? queryCompanyId : null;

    try {
        const membership = await getPrimaryMembership(userId);

        if (!membership) {
            // No company yet — mirrors the previous 'local-company' behaviour
            // of starting numbering at 1 rather than treating this as an error.
            return reply.send({ nextSequence: 1 });
        }

        if (requestedCompanyId && requestedCompanyId !== membership.companyId) {
            return reply.status(403).send({ error: 'Forbidden.' });
        }

        // Preview only — does not consume/reserve a number. The real,
        // race-free allocation happens in allocateDocumentNumber (sequence.ts)
        // when the document is actually first saved.
        const preview = await peekNextDocumentNumber(membership.companyId, 'Quotation');
        const match = preview.match(/(\d+)$/);
        return reply.send({ nextSequence: match ? Number(match[1]) : 1 });
    } catch (err: any) {
        app.log.error(err, 'Failed to get quotation sequence');
        return reply.status(500).send({ error: 'Failed to get quotation sequence.' });
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
                const rawDate = row.quotation_date ?? row.created_at ?? row.date ?? row.updated_at ?? null;
                if (!rawDate) return sum;
                const valueDate = new Date(rawDate);
                if (Number.isNaN(valueDate.getTime()) || valueDate < start || valueDate > end) return sum;
                return sum + Number(row.grand_total ?? 0);
            }, 0);

            const costForMonth = expenses.filter((row) => {
                const rawDate = row.bill_date ?? row.created_at ?? null;
                if (!rawDate) return false;
                const valueDate = new Date(rawDate);
                return !Number.isNaN(valueDate.getTime()) && valueDate >= start && valueDate <= end && (row.status ?? 'void') !== 'void';
            }).reduce((sum, row) => sum + Number(row.bill_amount ?? 0), 0);

            const profitForMonth = revenueForMonth - costForMonth;
            const marginForMonth = revenueForMonth > 0 ? (profitForMonth / revenueForMonth) * 100 : 0;

            return {
                label,
                revenue: revenueForMonth,
                cost: costForMonth,
                profit: profitForMonth,
                margin: marginForMonth,
                key,
            };
        });

        return reply.send({
            summary: {
                revenue,
                cost: projectCost,
                profit,
                margin,
                projectsTracked: projects.length,
                projectsAtRisk,
                months: monthSummaries.map(({ label, revenue: monthRevenue, cost: monthCost, profit: monthProfit, margin: monthMargin }) => ({
                    label,
                    revenue: monthRevenue,
                    cost: monthCost,
                    profit: monthProfit,
                    margin: monthMargin,
                })),
            },
        });
    } catch (err: any) {
        app.log.error(err, 'Failed to generate report summary');
        return reply.status(500).send({ error: 'Failed to generate report summary.' });
    }
});

// ─── Server start ──────────────────────────────────────────────────────────────

// Health endpoint for load balancers and Render
app.get('/api/health', async () => ({ ok: true, time: new Date().toISOString(), uptime: process.uptime() }));

// Use the port provided by the hosting environment (Render sets `PORT`).
const PORT = Number(process.env.PORT) || 4000;
app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    app.log.info(`Server listening at ${address}`);
});
