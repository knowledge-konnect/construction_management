import { supabaseAdmin } from './auth.js';

export interface CustomerPayload {
    name: string;
    party_id?: string | null;
    email?: string | null;
    mobile?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    gstin?: string | null;
    gst_registration_type?: string | null;
    gst_state_code?: string | null;
}

export async function listCustomersForCompany(
    companyId: string,
    options: { search?: string; page?: number; limit?: number; includeDeleted?: boolean } = {},
) {
    let query = supabaseAdmin
        .from('customers')
        .select('*')
        .eq('company_id', companyId);

    if (!options.includeDeleted) {
        query = query.eq('is_deleted', false);
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

/** Returns the raw row (including company_id) so the caller can verify ownership before exposing it. */
export async function getCustomerRow(id: string, includeDeleted = false) {
    let query = supabaseAdmin
        .from('customers')
        .select('*')
        .eq('id', id);

    if (!includeDeleted) {
        query = query.eq('is_deleted', false);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data;
}

export async function createCustomerForCompany(companyId: string, payload: CustomerPayload) {
    const normalizedEmail = payload.email?.trim().toLowerCase() || null;
    const normalizedMobile = payload.mobile ? payload.mobile.replace(/\D/g, '').slice(0, 10) : null;
    const normalizedGstin = payload.gstin ? payload.gstin.replace(/\s+/g, '').toUpperCase() : null;
    const normalizedPartyId = payload.party_id ? String(payload.party_id).trim() || null : null;

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
        if (party.company_id !== companyId) {
            const err: any = new Error('Selected customer contact belongs to a different company.');
            err.statusCode = 403;
            throw err;
        }
        if (!party.is_customer || !party.is_active || party.is_deleted) {
            const err: any = new Error('Selected customer contact is not an active customer.');
            err.statusCode = 400;
            throw err;
        }

        const { data: existingCustomer, error: existingCustomerError } = await supabaseAdmin
            .from('customers')
            .select('*')
            .eq('company_id', companyId)
            .eq('party_id', normalizedPartyId)
            .eq('is_deleted', false)
            .maybeSingle();

        if (existingCustomerError) throw existingCustomerError;
        if (existingCustomer) return existingCustomer;
    }

    const { data: duplicates, error: duplicateError } = await supabaseAdmin
        .from('customers')
        .select('id, email, mobile, gstin')
        .eq('company_id', companyId)
        .eq('is_deleted', false)
        .or(
            normalizedEmail ? `email.eq.${normalizedEmail},mobile.eq.${normalizedMobile ?? ''},gstin.eq.${normalizedGstin ?? ''}` : `mobile.eq.${normalizedMobile ?? ''},gstin.eq.${normalizedGstin ?? ''}`,
        );

    if (duplicateError) throw duplicateError;
    if (duplicates && duplicates.length > 0) {
        const err: any = new Error('A customer with the same email, mobile or GSTIN already exists in this company.');
        err.statusCode = 409;
        throw err;
    }

    const { data, error } = await supabaseAdmin
        .from('customers')
        .insert({
            company_id: companyId,
            party_id: normalizedPartyId,
            name: payload.name,
            email: normalizedEmail,
            mobile: normalizedMobile,
            address: payload.address ?? null,
            city: payload.city ?? null,
            state: payload.state ?? null,
            pincode: payload.pincode ?? null,
            gstin: normalizedGstin,
            gst_registration_type: payload.gst_registration_type ?? null,
            gst_state_code: payload.gst_state_code ?? null,
            is_deleted: false,
        })
        .select('*')
        .single();

    if (error) throw error;
    return data;
}

export async function updateCustomerRow(id: string, payload: Partial<CustomerPayload>) {
    const existingCustomer = await getCustomerRow(id, true);
    if (!existingCustomer) {
        const err: any = new Error('Customer not found.');
        err.statusCode = 404;
        throw err;
    }

    const updates: Record<string, unknown> = {};
    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.party_id !== undefined) {
        const normalizedPartyId = payload.party_id ? String(payload.party_id).trim() || null : null;
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
            if (party.company_id !== existingCustomer.company_id) {
                const err: any = new Error('Selected customer contact belongs to a different company.');
                err.statusCode = 403;
                throw err;
            }
            if (!party.is_customer || !party.is_active || party.is_deleted) {
                const err: any = new Error('Selected customer contact is not an active customer.');
                err.statusCode = 400;
                throw err;
            }
            const { data: samePartyCustomer, error: samePartyError } = await supabaseAdmin
                .from('customers')
                .select('id')
                .eq('party_id', normalizedPartyId)
                .eq('company_id', existingCustomer.company_id)
                .neq('id', id)
                .maybeSingle();

            if (samePartyError) throw samePartyError;
            if (samePartyCustomer) {
                const err: any = new Error('This shared customer contact is already linked to another customer record.');
                err.statusCode = 409;
                throw err;
            }
        }
        updates.party_id = normalizedPartyId;
    }
    if (payload.email !== undefined) updates.email = payload.email?.trim().toLowerCase() || null;
    if (payload.mobile !== undefined) updates.mobile = payload.mobile ? payload.mobile.replace(/\D/g, '').slice(0, 10) : null;
    if (payload.address !== undefined) updates.address = payload.address;
    if (payload.city !== undefined) updates.city = payload.city;
    if (payload.state !== undefined) updates.state = payload.state;
    if (payload.pincode !== undefined) updates.pincode = payload.pincode;
    if (payload.gstin !== undefined) updates.gstin = payload.gstin ? payload.gstin.replace(/\s+/g, '').toUpperCase() : null;
    if (payload.gst_registration_type !== undefined) updates.gst_registration_type = payload.gst_registration_type ?? null;
    if (payload.gst_state_code !== undefined) updates.gst_state_code = payload.gst_state_code ?? null;

    const { data, error } = await supabaseAdmin
        .from('customers')
        .update(updates)
        .eq('id', id)
        .eq('is_deleted', false)
        .select('*')
        .single();

    if (error) throw error;
    return data;
}

export async function deleteCustomerRow(id: string, deletedBy?: string | null): Promise<void> {
    const { error } = await supabaseAdmin
        .from('customers')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: deletedBy ?? null,
        })
        .eq('id', id)
        .eq('is_deleted', false);
    if (error) throw error;
}
