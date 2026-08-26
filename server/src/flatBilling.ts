import { supabaseAdmin } from './auth.js';
import { createCustomerForCompany, getCustomerRow, updateCustomerRow } from './customers.js';
import { allocateDocumentNumber } from './sequence.js';

export interface FlatBillingPaymentPayload {
    id?: string;
    stage: string;
    amount: number;
    dueDate?: string | null;
    status?: string | null;
}

export interface FlatBillingPayload {
    id: string;
    date?: string | null;
    bookingId?: string | null;
    buyerName: string;
    buyerAddress?: string | null;
    buyerPhone?: string | null;
    buyerPanAadhar?: string | null;
    flatNo?: string | null;
    floor?: string | null;
    blockTower?: string | null;
    areaSqft?: string | number | null;
    ratePerSqft?: string | number | null;
    payments?: FlatBillingPaymentPayload[];
    terms?: string[];
}

const SELECT_FLAT_BILLING = `*, customers(name,mobile,email,address), booking_receipt_details(*), payment_schedules(*), document_terms(*)`;

export async function listFlatBillingsForCompany(companyId: string) {
    const { data, error } = await supabaseAdmin
        .from('documents')
        .select(SELECT_FLAT_BILLING)
        .eq('company_id', companyId)
        .eq('document_type', 'BookingReceipt')
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
}

export async function getFlatBillingRow(id: string) {
    const { data, error } = await supabaseAdmin
        .from('documents')
        .select(SELECT_FLAT_BILLING)
        .eq('id', id)
        .eq('document_type', 'BookingReceipt')
        .eq('is_deleted', false)
        .maybeSingle();

    if (error) throw error;
    return data;
}

function toNullableNumber(value: unknown): number | null {
    if (value === undefined || value === null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

export async function saveFlatBillingToDatabase(billing: FlatBillingPayload, companyId: string) {
    // Same cross-company-hijack guard as saveQuotationToDatabase: load the
    // existing row (if any) first, reject if it belongs to a different
    // company, and reject modifying an already soft-deleted receipt.
    const { data: existingDoc, error: existingDocError } = await supabaseAdmin
        .from('documents')
        .select('id, company_id, document_number, customer_id, is_deleted')
        .eq('id', billing.id)
        .maybeSingle();

    if (existingDocError) throw existingDocError;

    if (existingDoc && existingDoc.company_id !== companyId) {
        const err: any = new Error('This receipt belongs to a different company.');
        err.statusCode = 403;
        throw err;
    }
    if (existingDoc?.is_deleted) {
        const err: any = new Error('This receipt has been deleted and can no longer be modified.');
        err.statusCode = 409;
        throw err;
    }

    const documentNumber = existingDoc
        ? existingDoc.document_number
        : await allocateDocumentNumber(companyId, 'BookingReceipt');

    // Resolve/keep-in-sync a customers-table row for the buyer — identical
    // pattern to saveQuotationToDatabase's customer linking: created once,
    // then kept stable and synced on later saves, always scoped to companyId.
    let customerId: string | null = existingDoc?.customer_id ?? null;
    const buyerName = String(billing.buyerName ?? '').trim();
    if (buyerName) {
        const customerFields = {
            name: buyerName,
            email: null,
            mobile: billing.buyerPhone ?? null,
            address: billing.buyerAddress ?? null,
            city: null,
            state: null,
            pincode: null,
        };

        if (customerId) {
            const linkedCustomer = await getCustomerRow(customerId);
            if (linkedCustomer && linkedCustomer.company_id === companyId) {
                await updateCustomerRow(customerId, customerFields);
            } else {
                const created = await createCustomerForCompany(companyId, customerFields);
                customerId = created.id;
            }
        } else {
            const created = await createCustomerForCompany(companyId, customerFields);
            customerId = created.id;
        }
    }

    const areaSqft = toNullableNumber(billing.areaSqft);
    const ratePerSqft = toNullableNumber(billing.ratePerSqft);
    const grandTotal = areaSqft !== null && ratePerSqft !== null ? Math.round(areaSqft * ratePerSqft * 100) / 100 : 0;

    const documentPayload = {
        id: billing.id,
        company_id: companyId,
        customer_id: customerId,
        document_type: 'BookingReceipt',
        document_number: documentNumber,
        status: 'Draft',
        quotation_date: billing.date || null,
        builtup_area: areaSqft,
        area_unit: 'sqft',
        grand_total: grandTotal,
    };

    const { data: documentData, error: documentError } = await supabaseAdmin
        .from('documents')
        .upsert(documentPayload, { onConflict: 'id' })
        .select('id, document_number')
        .single();

    if (documentError) {
        throw new Error(`documents upsert failed: ${documentError.message}`);
    }

    const documentId = documentData?.id ?? billing.id;

    {
        const { error } = await supabaseAdmin
            .from('booking_receipt_details')
            .upsert(
                {
                    document_id: documentId,
                    booking_id: billing.bookingId || null,
                    flat_no: billing.flatNo || null,
                    floor: billing.floor || null,
                    block_tower: billing.blockTower || null,
                    rate_per_sqft: ratePerSqft,
                    buyer_pan_aadhar: billing.buyerPanAadhar || null,
                },
                { onConflict: 'document_id' },
            );
        if (error) throw new Error(`booking_receipt_details upsert failed: ${error.message}`);
    }

    // Delete-then-reinsert payment_schedules/document_terms, same safe
    // pattern as saveQuotationToDatabase: every error checked, nothing
    // proceeds silently past a failure.
    {
        const { error } = await supabaseAdmin.from('payment_schedules').delete().eq('document_id', documentId);
        if (error) throw new Error(`payment_schedules delete failed: ${error.message}`);
    }
    {
        const { error } = await supabaseAdmin.from('document_terms').delete().eq('document_id', documentId);
        if (error) throw new Error(`document_terms delete failed: ${error.message}`);
    }

    const paymentRows = (billing.payments ?? []).map((p, idx) => ({
        id: p.id,
        document_id: documentId,
        stage_name: p.stage,
        amount: p.amount,
        due_date: p.dueDate || null,
        status: p.status ?? null,
        display_order: idx,
    }));
    if (paymentRows.length > 0) {
        const { error } = await supabaseAdmin.from('payment_schedules').insert(paymentRows);
        if (error) throw new Error(`payment_schedules insert failed: ${error.message}`);
    }

    const termRows = (billing.terms ?? [])
        .filter((t) => t && t.trim())
        .map((description, idx) => ({ document_id: documentId, description, display_order: idx }));
    if (termRows.length > 0) {
        const { error } = await supabaseAdmin.from('document_terms').insert(termRows);
        if (error) throw new Error(`document_terms insert failed: ${error.message}`);
    }

    return { ok: true, id: documentId, receiptNumber: documentData?.document_number ?? documentNumber };
}

export async function softDeleteFlatBilling(id: string, userId: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from('documents')
        .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: userId })
        .eq('id', id)
        .eq('document_type', 'BookingReceipt');
    if (error) throw error;
}
