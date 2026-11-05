/**
 * Shared party service — manages company-scoped party records used across
 * customers, suppliers and investors.
 */
import { apiDelete, apiGet, apiPost, apiPut } from '@/services/apiClient';
import type { ServiceResult } from '@/services/serviceResult';
import { toServiceResult } from '@/services/serviceResult';

export type PartyEntityType = 'person' | 'business';
export type PartyRoleType = 'customer' | 'supplier' | 'investor' | 'general';
export type PartyTypeFilter = 'all' | PartyRoleType;

export interface PartyRecord {
    id: string;
    companyId: string;
    name: string;
    entityType: PartyEntityType;
    contactPersonName?: string;
    partyType: PartyRoleType;
    isCustomer: boolean;
    isSupplier: boolean;
    isInvestor: boolean;
    email: string;
    mobile: string;
    address: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstin?: string;
    gstRegistrationType?: string;
    gstStateCode?: string;
    notes?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PartyInput {
    name: string;
    entityType?: PartyEntityType;
    contactPersonName?: string | null;
    partyType?: PartyRoleType;
    isCustomer?: boolean;
    isSupplier?: boolean;
    isInvestor?: boolean;
    email?: string | null;
    mobile?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    gstin?: string | null;
    gstRegistrationType?: string | null;
    gstStateCode?: string | null;
    notes?: string | null;
    isActive?: boolean;
}

function normalizeRoleSelection(input: Partial<PartyInput>): { role: PartyRoleType; isCustomer: boolean; isSupplier: boolean; isInvestor: boolean } {
    const explicitRole = input.partyType;
    const hasExplicitFlags = Boolean(input.isCustomer || input.isSupplier || input.isInvestor);
    const normalizedRole = explicitRole && ['customer', 'supplier', 'investor', 'general'].includes(explicitRole)
        ? explicitRole
        : input.isCustomer
            ? 'customer'
            : input.isSupplier
                ? 'supplier'
                : input.isInvestor
                    ? 'investor'
                    : 'general';

    const resolvedRole: PartyRoleType = normalizedRole === 'general' && hasExplicitFlags
        ? input.isCustomer
            ? 'customer'
            : input.isSupplier
                ? 'supplier'
                : 'investor'
        : normalizedRole;

    return {
        role: resolvedRole,
        isCustomer: resolvedRole === 'customer',
        isSupplier: resolvedRole === 'supplier',
        isInvestor: resolvedRole === 'investor',
    };
}

function normalizeParty(row: any): PartyRecord {
    const isCustomer = Boolean(row.is_customer ?? false);
    const isSupplier = Boolean(row.is_supplier ?? false);
    const isInvestor = Boolean(row.is_investor ?? false);
    const partyType: PartyRoleType = isCustomer ? 'customer' : isSupplier ? 'supplier' : isInvestor ? 'investor' : 'general';

    return {
        id: row.id,
        companyId: row.company_id,
        name: row.name,
        entityType: row.entity_type ?? 'person',
        contactPersonName: row.contact_person_name ?? '',
        partyType,
        isCustomer,
        isSupplier,
        isInvestor,
        email: row.email ?? '',
        mobile: row.mobile ?? '',
        address: row.address ?? '',
        city: row.city ?? '',
        state: row.state ?? '',
        pincode: row.pincode ?? '',
        gstin: row.gstin ?? '',
        gstRegistrationType: row.gst_registration_type ?? '',
        gstStateCode: row.gst_state_code ?? '',
        notes: row.notes ?? '',
        isActive: row.is_active ?? true,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function buildPartyPayload(input: PartyInput): Record<string, unknown> {
    const normalizedRole = normalizeRoleSelection(input);

    return {
        name: input.name,
        entity_type: input.entityType ?? 'person',
        contact_person_name: input.contactPersonName ?? null,
        party_type: normalizedRole.role,
        is_customer: normalizedRole.isCustomer,
        is_supplier: normalizedRole.isSupplier,
        is_investor: normalizedRole.isInvestor,
        email: input.email ?? null,
        mobile: input.mobile ?? null,
        address: input.address ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        pincode: input.pincode ?? null,
        gstin: input.gstin ?? null,
        gst_registration_type: input.gstRegistrationType ?? null,
        gst_state_code: input.gstStateCode ?? null,
        notes: input.notes ?? null,
        is_active: input.isActive ?? true,
    };
}

export async function listParties(
    _companyId?: string,
    type: PartyTypeFilter = 'all',
    search = '',
    options: { activeOnly?: boolean } = {},
): Promise<PartyRecord[]> {
    const params = new URLSearchParams();
    if (type && type !== 'all') params.set('type', type);
    if (search.trim()) params.set('search', search.trim());
    if (options.activeOnly) params.set('activeOnly', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';

    const { data, error } = await apiGet<{ parties: any[] }>(`/api/parties${query}`);
    if (error || !data) {
        console.warn('Failed to load parties', error);
        return [];
    }
    return (data.parties ?? []).map(normalizeParty);
}

export async function getParty(id: string): Promise<PartyRecord | null> {
    const { data, error } = await apiGet<{ party: any }>(`/api/parties/${id}`);
    if (error || !data?.party) {
        console.warn('Failed to load party', error);
        return null;
    }
    return normalizeParty(data.party);
}

export async function createParty(party: PartyInput): Promise<PartyRecord | null> {
    const result = await createPartyResult(party);
    return result.ok ? result.data : null;
}

export async function createPartyResult(party: PartyInput): Promise<ServiceResult<PartyRecord>> {
    const payload = buildPartyPayload(party);
    const base = toServiceResult(await apiPost<{ party: any }>('/api/parties', payload));
    if (!base.ok || !base.data?.party) {
        console.warn('Failed to create party', base.ok ? undefined : base.error);
        return { ok: false, error: base.ok ? 'We could not save this contact right now. Please try again.' : base.error, status: base.status };
    }
    return { ok: true, data: normalizeParty(base.data.party), status: base.status };
}

export async function updateParty(id: string, updates: Partial<PartyInput>): Promise<PartyRecord | null> {
    const result = await updatePartyResult(id, updates);
    return result.ok ? result.data : null;
}

export async function updatePartyResult(id: string, updates: Partial<PartyInput>): Promise<ServiceResult<PartyRecord>> {
    const payload: Record<string, unknown> = {};

    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.entityType !== undefined) payload.entity_type = updates.entityType;
    if (updates.contactPersonName !== undefined) payload.contact_person_name = updates.contactPersonName ?? null;
    if (updates.email !== undefined) payload.email = updates.email ?? null;
    if (updates.mobile !== undefined) payload.mobile = updates.mobile ?? null;
    if (updates.address !== undefined) payload.address = updates.address ?? null;
    if (updates.city !== undefined) payload.city = updates.city ?? null;
    if (updates.state !== undefined) payload.state = updates.state ?? null;
    if (updates.pincode !== undefined) payload.pincode = updates.pincode ?? null;
    if (updates.gstin !== undefined) payload.gstin = updates.gstin ?? null;
    if (updates.gstRegistrationType !== undefined) payload.gst_registration_type = updates.gstRegistrationType ?? null;
    if (updates.gstStateCode !== undefined) payload.gst_state_code = updates.gstStateCode ?? null;
    if (updates.notes !== undefined) payload.notes = updates.notes ?? null;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;

    if (
        updates.partyType !== undefined
        || updates.isCustomer !== undefined
        || updates.isSupplier !== undefined
        || updates.isInvestor !== undefined
    ) {
        const normalizedRole = normalizeRoleSelection(updates);
        payload.party_type = normalizedRole.role;
        payload.is_customer = normalizedRole.isCustomer;
        payload.is_supplier = normalizedRole.isSupplier;
        payload.is_investor = normalizedRole.isInvestor;
    }

    const base = toServiceResult(await apiPut<{ party: any }>(`/api/parties/${id}`, payload));
    if (!base.ok || !base.data?.party) {
        console.warn('Failed to update party', base.ok ? undefined : base.error);
        return { ok: false, error: base.ok ? 'We could not update this contact right now. Please try again.' : base.error, status: base.status };
    }
    return { ok: true, data: normalizeParty(base.data.party), status: base.status };
}

export async function deleteParty(id: string): Promise<boolean> {
    const result = await deletePartyResult(id);
    return result.ok;
}

export async function deletePartyResult(id: string): Promise<ServiceResult<true>> {
    const base = toServiceResult(await apiDelete<{ ok: boolean }>(`/api/parties/${id}`));
    if (!base.ok) {
        console.warn('Failed to delete party', base.error);
        return { ok: false, error: base.error, status: base.status };
    }
    return { ok: true, data: true, status: base.status };
}
