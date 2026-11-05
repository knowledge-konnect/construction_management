import { supabaseAdmin } from './auth.js';

export interface SupplierPayload {
    name: string;
    mobile?: string | null;
    gstin?: string | null;
    gst_registration_type?: string | null;
    gst_state_code?: string | null;
}

export async function listSuppliersForCompany(
    companyId: string,
    options: { search?: string; page?: number; limit?: number } = {},
) {
    let query = supabaseAdmin
        .from('suppliers')
        .select('*')
        .eq('company_id', companyId);

    const search = (options.search ?? '').trim();
    if (search) {
        query = query.or(`name.ilike.%${search}%,mobile.ilike.%${search}%,gstin.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false });

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

export async function getSupplierRow(id: string) {
    const { data, error } = await supabaseAdmin
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function createSupplierForCompany(companyId: string, payload: SupplierPayload) {
    const normalizedName = String(payload.name ?? '').trim();
    const normalizedMobile = payload.mobile ? payload.mobile.replace(/\D/g, '').slice(0, 10) : null;
    const normalizedGstin = payload.gstin ? payload.gstin.replace(/\s+/g, '').toUpperCase() : null;

    if (!normalizedName) {
        const err: any = new Error('Supplier name is required.');
        err.statusCode = 400;
        throw err;
    }

    const { data: duplicates, error: duplicateError } = await supabaseAdmin
        .from('suppliers')
        .select('id, name, mobile, gstin')
        .eq('company_id', companyId)
        .or(
            normalizedMobile || normalizedGstin
                ? `name.ilike.%${normalizedName}%,mobile.eq.${normalizedMobile ?? ''},gstin.eq.${normalizedGstin ?? ''}`
                : `name.ilike.%${normalizedName}%`,
        );

    if (duplicateError) throw duplicateError;
    if (duplicates && duplicates.length > 0) {
        const err: any = new Error('A supplier with the same name, mobile or GSTIN already exists in this company.');
        err.statusCode = 409;
        throw err;
    }

    const { data, error } = await supabaseAdmin
        .from('suppliers')
        .insert({
            company_id: companyId,
            name: normalizedName,
            mobile: normalizedMobile,
            gstin: normalizedGstin,
            gst_registration_type: payload.gst_registration_type ?? null,
            gst_state_code: payload.gst_state_code ?? null,
        })
        .select('*')
        .single();

    if (error) throw error;
    return data;
}

export async function updateSupplierRow(id: string, payload: Partial<SupplierPayload>) {
    const { data: existing, error: existingError } = await supabaseAdmin
        .from('suppliers')
        .select('id, company_id, name, mobile, gstin')
        .eq('id', id)
        .maybeSingle();

    if (existingError) throw existingError;
    if (!existing) {
        const err: any = new Error('Supplier not found.');
        err.statusCode = 404;
        throw err;
    }

    const updates: Record<string, unknown> = {};
    if (payload.name !== undefined) updates.name = String(payload.name ?? '').trim();
    if (payload.mobile !== undefined) updates.mobile = payload.mobile ? payload.mobile.replace(/\D/g, '').slice(0, 10) : null;
    if (payload.gstin !== undefined) updates.gstin = payload.gstin ? payload.gstin.replace(/\s+/g, '').toUpperCase() : null;
    if (payload.gst_registration_type !== undefined) updates.gst_registration_type = payload.gst_registration_type ?? null;
    if (payload.gst_state_code !== undefined) updates.gst_state_code = payload.gst_state_code ?? null;

    if (updates.name !== undefined && !String(updates.name).trim()) {
        const err: any = new Error('Supplier name is required.');
        err.statusCode = 400;
        throw err;
    }

    const nextName = String((updates.name ?? existing.name) ?? '').trim();
    const nextMobile = (updates.mobile ?? existing.mobile ?? null) as string | null;
    const nextGstin = (updates.gstin ?? existing.gstin ?? null) as string | null;

    const duplicateFilters = [`name.ilike.%${nextName}%`];
    if (nextMobile) duplicateFilters.push(`mobile.eq.${nextMobile}`);
    if (nextGstin) duplicateFilters.push(`gstin.eq.${nextGstin}`);

    const { data: duplicates, error: duplicateError } = await supabaseAdmin
        .from('suppliers')
        .select('id')
        .eq('company_id', existing.company_id)
        .neq('id', id)
        .or(duplicateFilters.join(','));

    if (duplicateError) throw duplicateError;
    if (duplicates && duplicates.length > 0) {
        const err: any = new Error('A supplier with the same name, mobile or GSTIN already exists in this company.');
        err.statusCode = 409;
        throw err;
    }

    const { data, error } = await supabaseAdmin
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

    if (error) throw error;
    return data;
}

export async function deleteSupplierRow(id: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from('suppliers')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
