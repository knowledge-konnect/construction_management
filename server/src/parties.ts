import { supabaseAdmin } from './auth.js';

export type PartyEntityType = 'person' | 'business';
export type PartyRoleType = 'customer' | 'supplier' | 'investor' | 'general';

export interface PartyPayload {
    name: string;
    entity_type?: PartyEntityType | null;
    contact_person_name?: string | null;
    party_type?: PartyRoleType | null;
    partyType?: PartyRoleType | null;
    is_customer?: boolean | null;
    is_supplier?: boolean | null;
    is_investor?: boolean | null;
    email?: string | null;
    mobile?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    gstin?: string | null;
    gst_registration_type?: string | null;
    gst_state_code?: string | null;
    notes?: string | null;
    is_active?: boolean | null;
}

function normalizeText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

function normalizeEmail(value: unknown): string | null {
    const cleaned = normalizeText(value).toLowerCase();
    return cleaned || null;
}

function normalizePhone(value: unknown): string | null {
    if (value === null || value === undefined || value === '') return null;
    const digits = String(value).replace(/\D/g, '').slice(0, 10);
    return digits || null;
}

function normalizeGstin(value: unknown): string | null {
    if (value === null || value === undefined || value === '') return null;
    return String(value).replace(/\s+/g, '').toUpperCase() || null;
}

function normalizePartyType(payload: Partial<PartyPayload>): { is_customer: boolean; is_supplier: boolean; is_investor: boolean } {
    const requestedRole = (payload.party_type ?? payload.partyType ?? '').toString().trim().toLowerCase();
    const explicitRoleMap: Record<string, { is_customer: boolean; is_supplier: boolean; is_investor: boolean }> = {
        customer: { is_customer: true, is_supplier: false, is_investor: false },
        supplier: { is_customer: false, is_supplier: true, is_investor: false },
        investor: { is_customer: false, is_supplier: false, is_investor: true },
        general: { is_customer: false, is_supplier: false, is_investor: false },
    };

    const isCustomer = Boolean(payload.is_customer ?? false);
    const isSupplier = Boolean(payload.is_supplier ?? false);
    const isInvestor = Boolean(payload.is_investor ?? false);

    if (requestedRole && requestedRole !== 'general' && explicitRoleMap[requestedRole]) {
        return explicitRoleMap[requestedRole];
    }
    if (requestedRole === 'general' && !isCustomer && !isSupplier && !isInvestor) {
        return explicitRoleMap.general;
    }

    if (isCustomer && !isSupplier && !isInvestor) return { is_customer: true, is_supplier: false, is_investor: false };
    if (isSupplier && !isCustomer && !isInvestor) return { is_customer: false, is_supplier: true, is_investor: false };
    if (isInvestor && !isCustomer && !isSupplier) return { is_customer: false, is_supplier: false, is_investor: true };

    if (isCustomer) return { is_customer: true, is_supplier: false, is_investor: false };
    if (isSupplier) return { is_customer: false, is_supplier: true, is_investor: false };
    if (isInvestor) return { is_customer: false, is_supplier: false, is_investor: true };

    return { is_customer: false, is_supplier: false, is_investor: false };
}

export async function listPartiesForCompany(
    companyId: string,
    options: { search?: string; type?: string; page?: number; limit?: number; includeDeleted?: boolean; activeOnly?: boolean } = {},
) {
    let query = supabaseAdmin
        .from('parties')
        .select('*')
        .eq('company_id', companyId);

    if (!options.includeDeleted) {
        query = query.eq('is_deleted', false);
    }

    if (options.activeOnly) {
        query = query.eq('is_active', true);
    }

    const requestedType = (options.type ?? 'all').toLowerCase();
    if (requestedType === 'customer') query = query.eq('is_customer', true);
    if (requestedType === 'supplier') query = query.eq('is_supplier', true);
    if (requestedType === 'investor') query = query.eq('is_investor', true);
    if (requestedType === 'general') {
        query = query.eq('is_customer', false).eq('is_supplier', false).eq('is_investor', false);
    }

    const search = (options.search ?? '').trim();
    if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,mobile.ilike.%${search}%,gstin.ilike.%${search}%`);
    }

    query = query.order('updated_at', { ascending: false });

    const page = Number(options.page ?? 1);
    const limit = Number(options.limit ?? 0);
    if (limit > 0 && Number.isFinite(page) && page > 0) {
        const start = (page - 1) * limit;
        query = query.range(start, start + limit - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
}

export async function getPartyRow(id: string, includeDeleted = false) {
    let query = supabaseAdmin
        .from('parties')
        .select('*')
        .eq('id', id);

    if (!includeDeleted) {
        query = query.eq('is_deleted', false);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data;
}

export async function createPartyForCompany(companyId: string, payload: PartyPayload) {
    const name = normalizeText(payload.name);
    if (!name) {
        const err: any = new Error('Party name is required.');
        err.statusCode = 400;
        throw err;
    }

    const normalizedEmail = normalizeEmail(payload.email);
    const normalizedMobile = normalizePhone(payload.mobile);
    const normalizedGstin = normalizeGstin(payload.gstin);
    const roleState = normalizePartyType(payload);

    const duplicateChecks: string[] = [];
    if (name) duplicateChecks.push(`name.ilike.%${name}%`);
    if (normalizedEmail) duplicateChecks.push(`email.eq.${normalizedEmail}`);
    if (normalizedMobile) duplicateChecks.push(`mobile.eq.${normalizedMobile}`);
    if (normalizedGstin) duplicateChecks.push(`gstin.eq.${normalizedGstin}`);

    if (duplicateChecks.length > 0) {
        const { data: duplicates, error: duplicateError } = await supabaseAdmin
            .from('parties')
            .select('id')
            .eq('company_id', companyId)
            .eq('is_deleted', false)
            .or(duplicateChecks.join(','));

        if (duplicateError) throw duplicateError;
        if ((duplicates ?? []).length > 0) {
            const err: any = new Error('A party with the same name, email, mobile or GSTIN already exists in this company.');
            err.statusCode = 409;
            throw err;
        }
    }

    const { data, error } = await supabaseAdmin
        .from('parties')
        .insert({
            company_id: companyId,
            name,
            entity_type: payload.entity_type ?? 'person',
            contact_person_name: payload.contact_person_name ?? null,
            is_customer: roleState.is_customer,
            is_supplier: roleState.is_supplier,
            is_investor: roleState.is_investor,
            email: normalizedEmail,
            mobile: normalizedMobile,
            address: payload.address ?? null,
            city: payload.city ?? null,
            state: payload.state ?? null,
            pincode: payload.pincode ?? null,
            gstin: normalizedGstin,
            gst_registration_type: payload.gst_registration_type ?? null,
            gst_state_code: payload.gst_state_code ?? null,
            notes: payload.notes ?? null,
            is_active: payload.is_active ?? true,
            is_deleted: false,
        })
        .select('*')
        .single();

    if (error) throw error;
    return data;
}

export async function updatePartyRow(id: string, payload: Partial<PartyPayload>) {
    const updates: Record<string, unknown> = {};
    if (payload.name !== undefined) updates.name = normalizeText(payload.name);
    if (payload.entity_type !== undefined) updates.entity_type = payload.entity_type ?? 'person';
    if (payload.is_customer !== undefined || payload.is_supplier !== undefined || payload.is_investor !== undefined) {
        const roleState = normalizePartyType(payload);
        updates.is_customer = roleState.is_customer;
        updates.is_supplier = roleState.is_supplier;
        updates.is_investor = roleState.is_investor;
    }
    if (payload.contact_person_name !== undefined) updates.contact_person_name = payload.contact_person_name ?? null;
    if (payload.email !== undefined) updates.email = normalizeEmail(payload.email);
    if (payload.mobile !== undefined) updates.mobile = normalizePhone(payload.mobile);
    if (payload.address !== undefined) updates.address = payload.address ?? null;
    if (payload.city !== undefined) updates.city = payload.city ?? null;
    if (payload.state !== undefined) updates.state = payload.state ?? null;
    if (payload.pincode !== undefined) updates.pincode = payload.pincode ?? null;
    if (payload.gstin !== undefined) updates.gstin = normalizeGstin(payload.gstin);
    if (payload.gst_registration_type !== undefined) updates.gst_registration_type = payload.gst_registration_type ?? null;
    if (payload.gst_state_code !== undefined) updates.gst_state_code = payload.gst_state_code ?? null;
    if (payload.notes !== undefined) updates.notes = payload.notes ?? null;
    if (payload.is_active !== undefined) updates.is_active = Boolean(payload.is_active);

    const { data, error } = await supabaseAdmin
        .from('parties')
        .update(updates)
        .eq('id', id)
        .eq('is_deleted', false)
        .select('*')
        .single();

    if (error) throw error;
    return data;
}

export async function deletePartyRow(id: string, deletedBy?: string | null): Promise<void> {
    const { error } = await supabaseAdmin
        .from('parties')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: deletedBy ?? null,
        })
        .eq('id', id)
        .eq('is_deleted', false);

    if (error) throw error;
}
