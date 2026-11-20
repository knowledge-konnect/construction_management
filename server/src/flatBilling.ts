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
    bookingStatus?: string | null;
    projectId?: string | null;
    projectUnitId?: string | null;
    projectName?: string | null;
    buyerName: string;
    buyerAddress?: string | null;
    buyerPhone?: string | null;
    buyerPanAadhar?: string | null;
    flatNo?: string | null;
    floor?: string | null;
    blockTower?: string | null;
    areaSqft?: string | number | null;
    ratePerSqft?: string | number | null;
    agreementValue?: string | number | null;
    balanceDue?: string | number | null;
    paymentMode?: string | null;
    dueDate?: string | null;
    payments?: FlatBillingPaymentPayload[];
    terms?: string[];
}

const SELECT_FLAT_BILLING = `*, customers(name,mobile,email,address), projects!project_id(name), booking_receipt_details(*), payment_schedules(*), document_terms(*)`;

export async function listFlatBillingsForCompany(companyId: string, projectId?: string | null) {
    let query = supabaseAdmin
        .from('documents')
        .select(SELECT_FLAT_BILLING)
        .eq('company_id', companyId)
        .eq('document_type', 'BookingReceipt')
        .eq('is_deleted', false);

    if (projectId) {
        query = query.eq('project_id', projectId);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

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

function normalizeBookingStatus(value: unknown): string | null {
    const raw = typeof value === 'string' ? value.trim() : '';
    if (!raw) return null;
    const normalized = raw.toLowerCase();
    if (normalized === 'draft') return 'Draft';
    if (normalized === 'confirmed') return 'Confirmed';
    if (normalized === 'cancelled') return 'Cancelled';
    if (normalized === 'completed') return 'Completed';
    return null;
}

function formatInventoryFloorLabel(value: number | null | undefined): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return '';
    if (value === 0) return 'Ground Floor';
    if (value === -1) return 'Basement -1';
    if (value === -2) return 'Basement -2';

    const suffix = value % 100 >= 11 && value % 100 <= 13
        ? 'th'
        : ['th', 'st', 'nd', 'rd'][Math.min((value % 10), 3)] ?? 'th';

    return `${value}${suffix} Floor`;
}

async function ensureBookingInventoryConsistency(billing: FlatBillingPayload, companyId: string): Promise<void> {
    const selectedUnitId = typeof billing.projectUnitId === 'string' && billing.projectUnitId.trim()
        ? billing.projectUnitId.trim()
        : null;

    if (!selectedUnitId) return;

    const { data: unit, error: unitError } = await supabaseAdmin
        .from('project_units')
        .select('id, project_id, company_id, flat_no, floor, block_tower')
        .eq('id', selectedUnitId)
        .maybeSingle();

    if (unitError) throw unitError;

    if (!unit) {
        const err: any = new Error('Selected project unit was not found.');
        err.statusCode = 404;
        throw err;
    }

    if (unit.company_id !== companyId) {
        const err: any = new Error('Selected project unit does not belong to the current company.');
        err.statusCode = 403;
        throw err;
    }

    if (billing.projectId && unit.project_id !== billing.projectId) {
        const err: any = new Error('Selected unit does not belong to the chosen project.');
        err.statusCode = 400;
        throw err;
    }

    if (billing.flatNo && String(unit.flat_no ?? '').trim().toLowerCase() !== billing.flatNo.trim().toLowerCase()) {
        const err: any = new Error('Selected unit does not match the provided flat number.');
        err.statusCode = 400;
        throw err;
    }

    if (billing.blockTower && unit.block_tower && String(unit.block_tower).trim().toLowerCase() !== billing.blockTower.trim().toLowerCase()) {
        const err: any = new Error('Selected unit does not match the provided tower / block.');
        err.statusCode = 400;
        throw err;
    }

    if (billing.floor) {
        const expectedFloor = formatInventoryFloorLabel(unit.floor == null ? null : Number(unit.floor));
        if (!expectedFloor || expectedFloor !== billing.floor.trim()) {
            const err: any = new Error('Selected floor does not match the inventory floor for this unit.');
            err.statusCode = 400;
            throw err;
        }
    }
}

async function ensurePropertyDevelopmentBookingEligibility(projectId: string | null, companyId: string): Promise<void> {
    if (!projectId) return;

    const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id, company_id, business_model')
        .eq('id', projectId)
        .maybeSingle();

    if (projectError) throw projectError;
    if (!project) {
        const err: any = new Error('Project not found for this booking.');
        err.statusCode = 404;
        throw err;
    }
    if (project.company_id !== companyId) {
        const err: any = new Error('This project does not belong to the current company.');
        err.statusCode = 403;
        throw err;
    }
    if (project.business_model !== 'property_development') {
        const err: any = new Error('Booking receipts are only allowed for property development projects.');
        err.statusCode = 403;
        throw err;
    }

    const { data: companySettings, error: companySettingsError } = await supabaseAdmin
        .from('company_settings')
        .select('enabled_business_models')
        .eq('company_id', companyId)
        .maybeSingle();

    if (companySettingsError) throw companySettingsError;
    const enabledModels = Array.isArray(companySettings?.enabled_business_models)
        ? companySettings.enabled_business_models.map((value: unknown) => String(value).trim().toLowerCase())
        : [];

    if (!enabledModels.includes('property_development')) {
        const err: any = new Error('Property development is not enabled for this company.');
        err.statusCode = 403;
        throw err;
    }
}

async function confirmBookingUnitAssignment(documentId: string, projectUnitId: string | null): Promise<void> {
    if (!projectUnitId) return;

    const { error } = await supabaseAdmin.rpc('confirm_booking_receipt_unit', {
        p_document_id: documentId,
        p_project_unit_id: projectUnitId,
    });

    if (error) {
        const err: any = new Error(error.message || 'Unable to confirm booking unit assignment.');
        err.statusCode = 409;
        throw err;
    }
}

async function cancelBookingUnitAssignment(documentId: string): Promise<void> {
    const { error } = await supabaseAdmin.rpc('cancel_booking_receipt_unit', {
        p_document_id: documentId,
    });

    if (error) {
        const err: any = new Error(error.message || 'Unable to cancel booking unit assignment.');
        err.statusCode = 409;
        throw err;
    }
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
    const agreementValue = toNullableNumber(billing.agreementValue) ?? (areaSqft !== null && ratePerSqft !== null ? Math.round(areaSqft * ratePerSqft * 100) / 100 : null);
    const balanceDue = toNullableNumber(billing.balanceDue);
    const dueDate = typeof billing.dueDate === 'string' && billing.dueDate.trim() ? billing.dueDate.trim() : null;
    const paymentMode = typeof billing.paymentMode === 'string' && billing.paymentMode.trim() ? billing.paymentMode.trim() : null;
    const grandTotal = agreementValue ?? 0;

    if (billing.projectId) {
        await ensurePropertyDevelopmentBookingEligibility(billing.projectId, companyId);
    }

    await ensureBookingInventoryConsistency(billing, companyId);

    const { data: previousDetails } = await supabaseAdmin
        .from('booking_receipt_details')
        .select('project_unit_id, booking_status')
        .eq('document_id', billing.id)
        .maybeSingle();

    const normalizedBookingStatus = normalizeBookingStatus(billing.bookingStatus ?? 'Draft') ?? 'Draft';
    const previousStatus = normalizeBookingStatus(previousDetails?.booking_status);
    const previousUnitId = typeof previousDetails?.project_unit_id === 'string' ? previousDetails.project_unit_id : null;
    const previousWasActive = previousStatus === 'Confirmed' || previousStatus === 'Completed';
    const nextIsActive = normalizedBookingStatus === 'Confirmed' || normalizedBookingStatus === 'Completed';

    if (previousWasActive && (!nextIsActive || previousUnitId !== (billing.projectUnitId || null))) {
        await cancelBookingUnitAssignment(billing.id);
    }

    const documentPayload = {
        id: billing.id,
        company_id: companyId,
        customer_id: customerId,
        project_id: billing.projectId || null,
        project_name: billing.projectName || billing.projectId ? (billing.projectName || null) : null,
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
                    project_unit_id: billing.projectUnitId || null,
                    booking_status: normalizedBookingStatus,
                    prior_unit_status: null,
                    flat_no: billing.flatNo || null,
                    floor: billing.floor || null,
                    block_tower: billing.blockTower || null,
                    rate_per_sqft: ratePerSqft,
                    buyer_pan_aadhar: billing.buyerPanAadhar || null,
                    agreement_value: agreementValue,
                    balance_due: balanceDue,
                    payment_mode: paymentMode,
                    due_date: dueDate,
                },
                { onConflict: 'document_id' },
            );
        if (error) throw new Error(`booking_receipt_details upsert failed: ${error.message}`);
    }

    const detailsPayload: Record<string, unknown> = {
        document_id: documentId,
        booking_id: billing.bookingId || null,
        project_unit_id: billing.projectUnitId || null,
        booking_status: normalizedBookingStatus,
        prior_unit_status: null,
        flat_no: billing.flatNo || null,
        floor: billing.floor || null,
        block_tower: billing.blockTower || null,
        rate_per_sqft: ratePerSqft,
        buyer_pan_aadhar: billing.buyerPanAadhar || null,
        agreement_value: agreementValue,
        balance_due: balanceDue,
        payment_mode: paymentMode,
        due_date: dueDate,
    };

    {
        let { error } = await supabaseAdmin
            .from('booking_receipt_details')
            .upsert(detailsPayload, { onConflict: 'document_id' });

        if (error && /agreement_value|balance_due|payment_mode|due_date/i.test(error.message)) {
            const legacyPayload = { ...detailsPayload };
            delete legacyPayload.agreement_value;
            delete legacyPayload.balance_due;
            delete legacyPayload.payment_mode;
            delete legacyPayload.due_date;
            ({ error } = await supabaseAdmin
                .from('booking_receipt_details')
                .upsert(legacyPayload, { onConflict: 'document_id' }));
        }

        if (error) throw new Error(`booking_receipt_details upsert failed: ${error.message}`);
    }

    const unchangedActiveAssignment = previousWasActive
        && previousUnitId === (billing.projectUnitId || null)
        && nextIsActive;

    if (nextIsActive && !unchangedActiveAssignment) {
        await confirmBookingUnitAssignment(documentId, billing.projectUnitId ?? null);
    }

    if (normalizedBookingStatus === 'Cancelled') {
        await cancelBookingUnitAssignment(documentId);
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
    await cancelBookingUnitAssignment(id);

    const { error } = await supabaseAdmin
        .from('documents')
        .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: userId })
        .eq('id', id)
        .eq('document_type', 'BookingReceipt')
        .eq('is_deleted', false);
    if (error) throw error;

}
