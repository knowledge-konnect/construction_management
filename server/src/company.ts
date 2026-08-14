import { supabaseAdmin } from './auth.js';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CompanyRow {
    id: string;
    owner_id: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    gst_number: string | null;
    pan_number: string | null;
    logo_url: string | null;
    primary_color: string | null;
    secondary_color: string | null;
}

export interface CompanySettingsRow {
    id: string;
    company_id: string;
    authorized_person: string | null;
    designation: string | null;
    signature_url: string | null;
    bank_name: string | null;
    account_name: string | null;
    account_number: string | null;
    ifsc: string | null;
    branch: string | null;
    upi_id: string | null;
    quotation_prefix: string | null;
    booking_prefix: string | null;
    default_validity_days: number | null;
    default_terms: string | null;
}

// ─── Queries ───────────────────────────────────────────────────────────────────

export async function getCompanyByUserId(userId: string) {
    const { data, error } = await supabaseAdmin
        .from('companies')
        .select('*, company_settings!company_settings_company_id_fkey(*)')
        .eq('owner_id', userId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function getCompanyById(companyId: string) {
    const { data, error } = await supabaseAdmin
        .from('companies')
        .select('*, company_settings!company_settings_company_id_fkey(*)')
        .eq('id', companyId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function createCompany(userId: string, payload: Omit<CompanyRow, 'id' | 'owner_id'>) {
    const { data, error } = await supabaseAdmin
        .from('companies')
        .insert({ ...payload, owner_id: userId })
        .select('id, owner_id')
        .single();

    if (error) throw error;
    return data;
}

export async function createCompanySettings(companyId: string, payload: Omit<CompanySettingsRow, 'id' | 'company_id'>) {
    const { error } = await supabaseAdmin
        .from('company_settings')
        .insert({ ...payload, company_id: companyId });

    if (error) throw error;
}

export async function updateCompany(companyId: string, payload: Partial<Omit<CompanyRow, 'id' | 'owner_id'>>) {
    const { error } = await supabaseAdmin
        .from('companies')
        .update(payload)
        .eq('id', companyId);

    if (error) throw error;
}

export async function upsertCompanySettings(companyId: string, payload: Omit<CompanySettingsRow, 'id' | 'company_id'>) {
    const { error } = await supabaseAdmin
        .from('company_settings')
        .upsert({ ...payload, company_id: companyId }, { onConflict: 'company_id' });

    if (error) throw error;
}
