/**
 * Customer service — talks to the Fastify backend (/api/customers/*).
 *
 * Previously this queried Supabase's `customers` table directly from the
 * browser with the anon key. It now goes through the authorized backend, the
 * same as documents and company settings — the backend derives/verifies
 * company_id from the authenticated user's company_users membership rather
 * than trusting a client-supplied companyId.
 */
import { apiDelete, apiGet, apiPost, apiPut } from '@/services/apiClient';
import type { ServiceResult } from '@/services/serviceResult';
import { toServiceResult } from '@/services/serviceResult';

export interface CustomerRecord {
    id: string;
    companyId: string;
    partyId?: string | null;
    name: string;
    email: string;
    mobile: string;
    address: string;
    city?: string;
    state?: string;
    pincode?: string;
    createdAt: string;
    updatedAt: string;
}

function normalizeCustomer(row: any): CustomerRecord {
    return {
        id: row.id,
        companyId: row.company_id,
        partyId: row.party_id ?? null,
        name: row.name,
        email: row.email,
        mobile: row.mobile,
        address: row.address,
        city: row.city ?? '',
        state: row.state ?? '',
        pincode: row.pincode ?? '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

// companyId is accepted for backward-compatible call signatures / UI context
// only — the backend always derives and verifies the actual company from the
// authenticated user's company_users membership, never from this parameter.
export async function listCustomers(_companyId?: string): Promise<CustomerRecord[]> {
    const { data, error } = await apiGet<{ customers: any[] }>('/api/customers');
    if (error || !data) {
        console.warn('Failed to load customers', error);
        return [];
    }
    return (data.customers ?? []).map(normalizeCustomer);
}

export async function getCustomer(id: string): Promise<CustomerRecord | null> {
    const { data, error } = await apiGet<{ customer: any }>(`/api/customers/${id}`);
    if (error || !data?.customer) {
        console.warn('Failed to load customer', error);
        return null;
    }
    return normalizeCustomer(data.customer);
}

export async function createCustomer(
    _companyId: string,
    customer: Omit<CustomerRecord, 'id' | 'companyId' | 'createdAt' | 'updatedAt'> & { partyId?: string | null },
): Promise<CustomerRecord | null> {
    const result = await createCustomerResult(_companyId, customer);
    return result.ok ? result.data : null;
}

export async function createCustomerResult(
    _companyId: string,
    customer: Omit<CustomerRecord, 'id' | 'companyId' | 'createdAt' | 'updatedAt'> & { partyId?: string | null },
): Promise<ServiceResult<CustomerRecord>> {
    const base = toServiceResult(await apiPost<{ customer: any }>('/api/customers', {
        party_id: customer.partyId ?? null,
        name: customer.name,
        email: customer.email,
        mobile: customer.mobile,
        address: customer.address,
        city: customer.city ?? null,
        state: customer.state ?? null,
        pincode: customer.pincode ?? null,
    }));
    if (!base.ok || !base.data?.customer) {
        console.warn('Failed to create customer', base.ok ? undefined : base.error);
        return {
            ok: false,
            error: base.ok ? 'Could not create this customer right now. Please try again.' : base.error,
            status: base.status,
        };
    }
    return { ok: true, data: normalizeCustomer(base.data.customer), status: base.status };
}

export async function updateCustomer(id: string, updates: Partial<CustomerRecord>): Promise<CustomerRecord | null> {
    const result = await updateCustomerResult(id, updates);
    return result.ok ? result.data : null;
}

export async function updateCustomerResult(id: string, updates: Partial<CustomerRecord>): Promise<ServiceResult<CustomerRecord>> {
    const payload: any = {};
    if (updates.partyId !== undefined) payload.party_id = updates.partyId ?? null;
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.mobile !== undefined) payload.mobile = updates.mobile;
    if (updates.address !== undefined) payload.address = updates.address;
    if (updates.city !== undefined) payload.city = updates.city;
    if (updates.state !== undefined) payload.state = updates.state;
    if (updates.pincode !== undefined) payload.pincode = updates.pincode;

    const base = toServiceResult(await apiPut<{ customer: any }>(`/api/customers/${id}`, payload));
    if (!base.ok || !base.data?.customer) {
        console.warn('Failed to update customer', base.ok ? undefined : base.error);
        return {
            ok: false,
            error: base.ok ? 'Could not update this customer right now. Please try again.' : base.error,
            status: base.status,
        };
    }
    return { ok: true, data: normalizeCustomer(base.data.customer), status: base.status };
}

export async function deleteCustomer(id: string): Promise<boolean> {
    const result = await deleteCustomerResult(id);
    return result.ok;
}

export async function deleteCustomerResult(id: string): Promise<ServiceResult<true>> {
    const base = toServiceResult(await apiDelete<{ ok: boolean }>(`/api/customers/${id}`));
    if (!base.ok) {
        console.warn('Failed to delete customer', base.error);
        return { ok: false, error: base.error, status: base.status };
    }
    return { ok: true, data: true, status: base.status };
}
