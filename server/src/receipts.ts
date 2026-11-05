import { supabaseAdmin } from './auth.js';

export type ReceiptPaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other';
export type ReceiptVisibility = 'internal' | 'published';

const VALID_RECEIPT_PAYMENT_METHODS: ReceiptPaymentMethod[] = ['cash', 'upi', 'bank_transfer', 'cheque', 'other'];
const VALID_RECEIPT_VISIBILITY_VALUES: ReceiptVisibility[] = ['internal', 'published'];

function parseNumber(value: unknown, fallback = 0): number {
    if (value === null || value === undefined || value === '') return fallback;
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function roundCurrency(value: number): number {
    return Number(Math.round((value + Number.EPSILON) * 100) / 100);
}

export function normalizeReceiptPaymentMethod(value: unknown): ReceiptPaymentMethod {
    return VALID_RECEIPT_PAYMENT_METHODS.includes(value as ReceiptPaymentMethod)
        ? (value as ReceiptPaymentMethod)
        : 'cash';
}

export function normalizeReceiptVisibility(value: unknown): ReceiptVisibility {
    return VALID_RECEIPT_VISIBILITY_VALUES.includes(value as ReceiptVisibility)
        ? (value as ReceiptVisibility)
        : 'internal';
}

function normalizeProjectId(value: unknown): string | null {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

async function ensureProjectBelongsToCompany(companyId: string, projectId: string | null): Promise<void> {
    if (!projectId) return;

    const { data, error } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('company_id', companyId)
        .maybeSingle();

    if (error) throw error;
    if (!data) {
        const err: any = new Error('Selected project is not valid for this company.');
        err.statusCode = 400;
        throw err;
    }
}

async function ensureCustomerBelongsToCompany(companyId: string, customerId: string | null): Promise<void> {
    if (!customerId) return;

    const { data, error } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('id', customerId)
        .eq('company_id', companyId)
        .maybeSingle();

    if (error) throw error;
    if (!data) {
        const err: any = new Error('Selected customer is not valid for this company.');
        err.statusCode = 400;
        throw err;
    }
}

async function ensurePaymentMethodAllowed(companyId: string, paymentMethodId: string | null): Promise<void> {
    if (!paymentMethodId) return;

    const { data, error } = await supabaseAdmin
        .from('payment_methods')
        .select('id')
        .eq('id', paymentMethodId)
        .or(`company_id.eq.${companyId},company_id.is.null`)
        .maybeSingle();

    if (error) throw error;
    if (!data) {
        const err: any = new Error('Selected payment method is not allowed for this company.');
        err.statusCode = 400;
        throw err;
    }
}

async function getReceiptAllocatedAmount(receiptId: string): Promise<number> {
    const { data, error } = await supabaseAdmin
        .from('payment_allocations')
        .select('allocated_amount')
        .eq('receipt_id', receiptId);

    if (error) throw error;
    return (data ?? []).reduce((sum, row) => sum + parseNumber(row?.allocated_amount ?? 0, 0), 0);
}

async function getInvoiceAllocatedAmount(invoiceId: string): Promise<number> {
    const { data, error } = await supabaseAdmin
        .from('payment_allocations')
        .select('allocated_amount')
        .eq('invoice_id', invoiceId);

    if (error) throw error;
    return (data ?? []).reduce((sum, row) => sum + parseNumber(row?.allocated_amount ?? 0, 0), 0);
}

async function getInvoiceRowById(invoiceId: string): Promise<any | null> {
    const { data, error } = await supabaseAdmin
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .maybeSingle();

    if (error) throw error;
    return data ?? null;
}

function mapReceiptRow(row: any) {
    const project = Array.isArray(row?.projects) ? row.projects[0] ?? null : row?.projects ?? null;
    const customer = Array.isArray(row?.customers) ? row.customers[0] ?? null : row?.customers ?? null;

    return {
        id: row.id,
        companyId: row.company_id,
        projectId: row.project_id ?? null,
        customerId: row.customer_id ?? null,
        project: project ? {
            id: project.id,
            name: project.name ?? null,
            projectNumber: project.project_number ?? null,
            companyId: project.company_id ?? null,
        } : null,
        customer: customer ? {
            id: customer.id,
            name: customer.name ?? null,
            mobile: customer.mobile ?? null,
            email: customer.email ?? null,
        } : null,
        receiptNumber: row.receipt_number ?? '',
        amount: Number(row.amount ?? 0),
        receivedDate: row.received_date ?? null,
        paymentMethodId: row.payment_method_id ?? null,
        paymentMethod: normalizeReceiptPaymentMethod(row.payment_method),
        referenceNumber: row.reference_number ?? null,
        notes: row.notes ?? null,
        visibilityStatus: normalizeReceiptVisibility(row.visibility_status),
        createdAt: row.created_at ?? null,
        updatedAt: row.updated_at ?? null,
        voidedAt: row.voided_at ?? null,
    };
}

function mapAllocationRow(row: any) {
    return {
        id: row.id,
        companyId: row.company_id,
        invoiceId: row.invoice_id,
        receiptId: row.receipt_id,
        allocatedAmount: Number(row.allocated_amount ?? 0),
        createdAt: row.created_at ?? null,
    };
}

export async function listReceiptsForCompany(companyId: string, filters: { projectId?: string | null; customerId?: string | null } = {}) {
    let query = supabaseAdmin
        .from('project_receipts')
        .select('*, projects!project_id(id, name, project_number, company_id), customers!customer_id(id, name, mobile, email)')
        .eq('company_id', companyId)
        .order('received_date', { ascending: false });

    if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
    } else if (filters.projectId === null) {
        query = query.is('project_id', null);
    }

    if (filters.customerId) {
        query = query.eq('customer_id', filters.customerId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = data ?? [];
    const mapped = await Promise.all(rows.map(async (row: any) => {
        const allocatedAmount = await getReceiptAllocatedAmount(row.id);
        return {
            ...mapReceiptRow(row),
            allocatedAmount: roundCurrency(allocatedAmount),
            unallocatedAmount: roundCurrency(Math.max(0, Number(row.amount ?? 0) - allocatedAmount)),
        };
    }));

    return mapped;
}

export async function getReceiptRowById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('project_receipts')
        .select('*, projects!project_id(id, name, project_number, company_id), customers!customer_id(id, name, mobile, email)')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const allocatedAmount = await getReceiptAllocatedAmount(data.id);
    const amount = Number(data.amount ?? 0);
    return {
        ...mapReceiptRow(data),
        allocatedAmount: roundCurrency(allocatedAmount),
        unallocatedAmount: roundCurrency(Math.max(0, amount - allocatedAmount)),
    };
}

function buildReceiptPayload(companyId: string, payload: any, userId: string) {
    const projectId = normalizeProjectId(payload?.projectId ?? payload?.project_id ?? null);
    const customerId = typeof payload?.customerId === 'string' ? payload.customerId.trim() || null : (payload?.customer_id ?? null);
    const receiptNumber = String(payload?.receiptNumber ?? payload?.receipt_number ?? '').trim();
    const amount = parseNumber(payload?.amount ?? 0, 0);
    const paymentMethod = normalizeReceiptPaymentMethod(payload?.paymentMethod ?? payload?.payment_method ?? 'cash');
    const visibilityStatus = normalizeReceiptVisibility(payload?.visibilityStatus ?? payload?.visibility_status ?? 'internal');

    return {
        company_id: companyId,
        project_id: projectId,
        customer_id: customerId,
        receipt_number: receiptNumber || `RCPT-${Date.now()}`,
        amount: roundCurrency(Math.max(0, amount)),
        received_date: payload?.receivedDate ?? payload?.received_date ?? null,
        payment_method_id: payload?.paymentMethodId ?? payload?.payment_method_id ?? null,
        payment_method: paymentMethod,
        reference_number: payload?.referenceNumber ?? payload?.reference_number ?? null,
        notes: payload?.notes ?? null,
        visibility_status: visibilityStatus,
        created_by: userId,
    };
}

async function validateReceiptPayload(companyId: string, payload: any, isUpdate = false) {
    const amount = parseNumber(payload?.amount ?? 0, 0);
    if (amount <= 0) {
        const err: any = new Error('Receipt amount must be greater than zero.');
        err.statusCode = 400;
        throw err;
    }

    const projectId = normalizeProjectId(payload?.projectId ?? payload?.project_id ?? null);
    const customerId = typeof payload?.customerId === 'string' ? payload.customerId.trim() || null : (payload?.customer_id ?? null);
    const paymentMethodId = payload?.paymentMethodId ?? payload?.payment_method_id ?? null;

    await ensureProjectBelongsToCompany(companyId, projectId);
    await ensureCustomerBelongsToCompany(companyId, customerId);
    await ensurePaymentMethodAllowed(companyId, paymentMethodId);

    const receiptNumber = String(payload?.receiptNumber ?? payload?.receipt_number ?? '').trim();
    if (!receiptNumber && !isUpdate) {
        // generated later if absent, so no validation error needed here.
    }

    if (projectId) {
        const { data, error } = await supabaseAdmin
            .from('project_receipts')
            .select('id')
            .eq('company_id', companyId)
            .eq('project_id', projectId)
            .eq('receipt_number', receiptNumber || (payload?.receiptNumber ?? payload?.receipt_number ?? ''))
            .maybeSingle();

        if (!error && data && !isUpdate) {
            const err: any = new Error('A receipt with this number already exists for the selected project.');
            err.statusCode = 409;
            throw err;
        }
    } else {
        const { data, error } = await supabaseAdmin
            .from('project_receipts')
            .select('id')
            .eq('company_id', companyId)
            .is('project_id', null)
            .eq('receipt_number', receiptNumber || (payload?.receiptNumber ?? payload?.receipt_number ?? ''))
            .maybeSingle();

        if (!error && data && !isUpdate) {
            const err: any = new Error('A company-level receipt with this number already exists.');
            err.statusCode = 409;
            throw err;
        }
    }
}

export async function createReceiptForCompany(companyId: string, payload: any, userId: string) {
    const record = payload && typeof payload === 'object' && 'projectId' in payload ? payload : payload ?? {};
    await validateReceiptPayload(companyId, record, false);

    const insertPayload = buildReceiptPayload(companyId, record, userId);
    const { data, error } = await supabaseAdmin
        .from('project_receipts')
        .insert(insertPayload)
        .select('*, projects!project_id(id, name, project_number, company_id), customers!customer_id(id, name, mobile, email)')
        .single();

    if (error) throw error;
    return {
        ...mapReceiptRow(data),
        allocatedAmount: 0,
        unallocatedAmount: roundCurrency(Number(data.amount ?? 0)),
    };
}

export async function updateReceiptRow(id: string, companyId: string, payload: any) {
    const existing = await getReceiptRowById(id);
    if (!existing) {
        const err: any = new Error('Receipt not found.');
        err.statusCode = 404;
        throw err;
    }
    if (existing.companyId !== companyId) {
        const err: any = new Error('This receipt belongs to a different company.');
        err.statusCode = 403;
        throw err;
    }

    if (existing.allocatedAmount > 0) {
        const nextAmount = payload?.amount !== undefined ? parseNumber(payload.amount, existing.amount) : existing.amount;
        if (nextAmount < existing.allocatedAmount) {
            const err: any = new Error('Receipt allocations already exist; the receipt amount cannot be reduced below the allocated total.');
            err.statusCode = 400;
            throw err;
        }
    }

    const updates: Record<string, unknown> = {};
    if (payload?.amount !== undefined) updates.amount = roundCurrency(Math.max(0, parseNumber(payload.amount, 0)));
    if (payload?.receiptNumber !== undefined || payload?.receipt_number !== undefined) updates.receipt_number = String(payload.receiptNumber ?? payload.receipt_number ?? '').trim() || `RCPT-${Date.now()}`;
    if (payload?.customerId !== undefined || payload?.customer_id !== undefined) updates.customer_id = payload.customerId ?? payload.customer_id ?? null;
    if (payload?.projectId !== undefined || payload?.project_id !== undefined) updates.project_id = normalizeProjectId(payload.projectId ?? payload.project_id ?? null);
    if (payload?.receivedDate !== undefined || payload?.received_date !== undefined) updates.received_date = payload.receivedDate ?? payload.received_date ?? null;
    if (payload?.paymentMethodId !== undefined || payload?.payment_method_id !== undefined) updates.payment_method_id = payload.paymentMethodId ?? payload.payment_method_id ?? null;
    if (payload?.paymentMethod !== undefined || payload?.payment_method !== undefined) updates.payment_method = normalizeReceiptPaymentMethod(payload.paymentMethod ?? payload.payment_method ?? 'cash');
    if (payload?.referenceNumber !== undefined || payload?.reference_number !== undefined) updates.reference_number = payload.referenceNumber ?? payload.reference_number ?? null;
    if (payload?.notes !== undefined) updates.notes = payload.notes ?? null;
    if (payload?.visibilityStatus !== undefined || payload?.visibility_status !== undefined) updates.visibility_status = normalizeReceiptVisibility(payload.visibilityStatus ?? payload.visibility_status ?? 'internal');

    if (updates.project_id !== undefined) {
        await ensureProjectBelongsToCompany(companyId, updates.project_id as string | null);
    }
    if (updates.customer_id !== undefined) {
        await ensureCustomerBelongsToCompany(companyId, updates.customer_id as string | null);
    }
    if (updates.payment_method_id !== undefined) {
        await ensurePaymentMethodAllowed(companyId, updates.payment_method_id as string | null);
    }

    const { data, error } = await supabaseAdmin
        .from('project_receipts')
        .update(updates)
        .eq('id', id)
        .select('*, projects!project_id(id, name, project_number, company_id), customers!customer_id(id, name, mobile, email)')
        .single();

    if (error) throw error;
    const allocatedAmount = await getReceiptAllocatedAmount(id);
    return {
        ...mapReceiptRow(data),
        allocatedAmount: roundCurrency(allocatedAmount),
        unallocatedAmount: roundCurrency(Math.max(0, Number(data.amount ?? 0) - allocatedAmount)),
    };
}

export async function deleteReceiptRow(id: string, companyId: string) {
    const existing = await getReceiptRowById(id);
    if (!existing) {
        const err: any = new Error('Receipt not found.');
        err.statusCode = 404;
        throw err;
    }
    if (existing.companyId !== companyId) {
        const err: any = new Error('This receipt belongs to a different company.');
        err.statusCode = 403;
        throw err;
    }
    if (existing.allocatedAmount > 0) {
        const err: any = new Error('Receipts with payment allocations cannot be deleted because payment history must be preserved.');
        err.statusCode = 400;
        throw err;
    }

    const { error } = await supabaseAdmin
        .from('project_receipts')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return { ok: true };
}

export async function listPaymentAllocationsForReceipt(receiptId: string, companyId?: string | null) {
    let query = supabaseAdmin
        .from('payment_allocations')
        .select('*')
        .eq('receipt_id', receiptId)
        .order('created_at', { ascending: false });

    if (companyId) {
        query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row: any) => mapAllocationRow(row));
}

export async function listPaymentAllocationsForInvoice(invoiceId: string, companyId?: string | null) {
    let query = supabaseAdmin
        .from('payment_allocations')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: false });

    if (companyId) {
        query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row: any) => mapAllocationRow(row));
}

export async function createReceiptAllocationForInvoice(receiptId: string, invoiceId: string, companyId: string, requestedAmount: unknown) {
    const receipt = await getReceiptRowById(receiptId);
    if (!receipt) {
        const err: any = new Error('Receipt not found.');
        err.statusCode = 404;
        throw err;
    }
    if (receipt.companyId !== companyId) {
        const err: any = new Error('This receipt belongs to a different company.');
        err.statusCode = 403;
        throw err;
    }

    const invoice = await getInvoiceRowById(invoiceId);
    if (!invoice) {
        const err: any = new Error('Invoice not found.');
        err.statusCode = 404;
        throw err;
    }
    if (invoice.company_id !== companyId) {
        const err: any = new Error('This invoice belongs to a different company.');
        err.statusCode = 403;
        throw err;
    }

    const desiredAmount = Math.max(0, parseNumber(requestedAmount, 0));
    const receiptRemaining = roundCurrency(Math.max(0, Number(receipt.amount ?? 0) - Number(receipt.allocatedAmount ?? 0)));
    const invoiceOutstanding = roundCurrency(Math.max(0, Number(invoice.grand_total ?? 0) - await getInvoiceAllocatedAmount(invoiceId)));

    if (desiredAmount <= 0) {
        const err: any = new Error('Allocation amount must be greater than zero.');
        err.statusCode = 400;
        throw err;
    }
    if (receiptRemaining <= 0) {
        const err: any = new Error('This receipt has no remaining balance to allocate.');
        err.statusCode = 400;
        throw err;
    }
    if (invoiceOutstanding <= 0) {
        const err: any = new Error('This invoice is already fully paid.');
        err.statusCode = 400;
        throw err;
    }

    const allocatedAmount = roundCurrency(Math.min(desiredAmount, receiptRemaining, invoiceOutstanding));
    if (allocatedAmount <= 0) {
        const err: any = new Error('Requested amount exceeds the remaining receipt balance or invoice outstanding amount.');
        err.statusCode = 400;
        throw err;
    }

    const { data, error } = await supabaseAdmin
        .from('payment_allocations')
        .insert({
            company_id: companyId,
            invoice_id: invoiceId,
            receipt_id: receiptId,
            allocated_amount: allocatedAmount,
        })
        .select('*')
        .single();

    if (error) throw error;
    return {
        allocation: mapAllocationRow(data),
        receiptRemaining,
        invoiceOutstanding,
        allocatedAmount,
    };
}
