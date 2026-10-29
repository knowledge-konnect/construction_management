import { supabaseAdmin } from './auth.js';

export interface CustomerPayload {
    name: string;
    email?: string | null;
    mobile?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
}

export async function listCustomersForCompany(companyId: string) {
    const { data, error } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('company_id', companyId)
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
}

/** Returns the raw row (including company_id) so the caller can verify ownership before exposing it. */
export async function getCustomerRow(id: string) {
    const { data, error } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function createCustomerForCompany(companyId: string, payload: CustomerPayload) {
    const { data, error } = await supabaseAdmin
        .from('customers')
        .insert({
            company_id: companyId,
            name: payload.name,
            email: payload.email ?? null,
            mobile: payload.mobile ?? null,
            address: payload.address ?? null,
            city: payload.city ?? null,
            state: payload.state ?? null,
            pincode: payload.pincode ?? null,
        })
        .select('*')
        .single();

    if (error) throw error;
    return data;
}

export async function updateCustomerRow(id: string, payload: Partial<CustomerPayload>) {
    const updates: Record<string, unknown> = {};
    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.email !== undefined) updates.email = payload.email;
    if (payload.mobile !== undefined) updates.mobile = payload.mobile;
    if (payload.address !== undefined) updates.address = payload.address;
    if (payload.city !== undefined) updates.city = payload.city;
    if (payload.state !== undefined) updates.state = payload.state;
    if (payload.pincode !== undefined) updates.pincode = payload.pincode;

    const { data, error } = await supabaseAdmin
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

    if (error) throw error;
    return data;
}

export async function deleteCustomerRow(id: string): Promise<void> {
    const { error } = await supabaseAdmin.from('customers').delete().eq('id', id);
    if (error) throw error;
}
