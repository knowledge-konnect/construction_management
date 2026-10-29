import type { ProjectStatus } from '@/lib/models';
import { apiDelete, apiGet, apiPost, apiPut } from '@/services/apiClient';

export interface ProjectRecord {
    id: string;
    companyId: string;
    customerId: string | null;
    sourceDocumentId: string | null;
    projectTypeId: string | null;
    projectTypeSnapshot: string | null;
    projectNumber: string;
    name: string;
    description: string | null;
    siteAddress: string | null;
    contractAmount: number;
    startDate: string | null;
    expectedEndDate: string | null;
    actualEndDate: string | null;
    status: ProjectStatus;
    createdAt: string;
    updatedAt: string;
    customer?: {
        id: string;
        name: string;
        email?: string | null;
        mobile?: string | null;
        address?: string | null;
        city?: string | null;
        state?: string | null;
        pincode?: string | null;
    } | null;
}

function normalizeProjectStatus(value: unknown): ProjectStatus {
    return value === 'in_progress' || value === 'on_hold' || value === 'completed' || value === 'cancelled'
        ? (value as ProjectStatus)
        : 'planned';
}

function mapProjectRow(row: any): ProjectRecord {
    return {
        id: row.id,
        companyId: row.company_id,
        customerId: row.customer_id ?? null,
        sourceDocumentId: row.source_document_id ?? null,
        projectTypeId: row.project_type_id ?? null,
        projectTypeSnapshot: row.project_type_snapshot ?? null,
        projectNumber: row.project_number ?? '',
        name: row.name ?? '',
        description: row.description ?? null,
        siteAddress: row.site_address ?? null,
        contractAmount: Number(row.contract_amount ?? 0),
        startDate: row.start_date ?? null,
        expectedEndDate: row.expected_end_date ?? null,
        actualEndDate: row.actual_end_date ?? null,
        status: normalizeProjectStatus(row.status),
        createdAt: row.created_at ?? '',
        updatedAt: row.updated_at ?? '',
        customer: row.customers
            ? {
                id: row.customers.id,
                name: row.customers.name ?? '',
                email: row.customers.email ?? null,
                mobile: row.customers.mobile ?? null,
                address: row.customers.address ?? null,
                city: row.customers.city ?? null,
                state: row.customers.state ?? null,
                pincode: row.customers.pincode ?? null,
            }
            : null,
    };
}

export async function listProjects(): Promise<ProjectRecord[]> {
    const { data, error } = await apiGet<{ projects: any[] }>('/api/projects');
    if (error || !data) {
        console.warn('Failed to load projects', error);
        return [];
    }
    return (data.projects ?? []).map(mapProjectRow);
}

export async function getProject(id: string): Promise<ProjectRecord | null> {
    const { data, error } = await apiGet<{ project: any }>(`/api/projects/${id}`);
    if (error || !data?.project) {
        console.warn('Failed to load project', error);
        return null;
    }
    return mapProjectRow(data.project);
}

export async function createProject(payload: {
    name: string;
    customerId?: string | null;
    description?: string | null;
    siteAddress?: string | null;
    contractAmount?: number;
    startDate?: string | null;
    expectedEndDate?: string | null;
    status?: ProjectStatus;
    sourceDocumentId?: string | null;
    projectTypeId?: string | null;
    projectTypeSnapshot?: string | null;
}): Promise<ProjectRecord | null> {
    const { data, error } = await apiPost<{ project: any }>('/api/projects', {
        name: payload.name,
        customer_id: payload.customerId ?? null,
        source_document_id: payload.sourceDocumentId ?? null,
        project_type_id: payload.projectTypeId ?? null,
        project_type_snapshot: payload.projectTypeSnapshot ?? null,
        description: payload.description ?? null,
        site_address: payload.siteAddress ?? null,
        contract_amount: Number(payload.contractAmount ?? 0),
        start_date: payload.startDate ?? null,
        expected_end_date: payload.expectedEndDate ?? null,
        status: payload.status ?? 'planned',
    });

    if (error || !data?.project) {
        console.warn('Failed to create project', error);
        return null;
    }
    return mapProjectRow(data.project);
}

export async function updateProject(id: string, updates: Partial<ProjectRecord>): Promise<ProjectRecord | null> {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.customerId !== undefined) payload.customer_id = updates.customerId ?? null;
    if (updates.sourceDocumentId !== undefined) payload.source_document_id = updates.sourceDocumentId ?? null;
    if (updates.projectTypeId !== undefined) payload.project_type_id = updates.projectTypeId ?? null;
    if (updates.projectTypeSnapshot !== undefined) payload.project_type_snapshot = updates.projectTypeSnapshot ?? null;
    if (updates.description !== undefined) payload.description = updates.description ?? null;
    if (updates.siteAddress !== undefined) payload.site_address = updates.siteAddress ?? null;
    if (updates.contractAmount !== undefined) payload.contract_amount = Number(updates.contractAmount ?? 0);
    if (updates.startDate !== undefined) payload.start_date = updates.startDate ?? null;
    if (updates.expectedEndDate !== undefined) payload.expected_end_date = updates.expectedEndDate ?? null;
    if (updates.status !== undefined) payload.status = updates.status;

    const { data, error } = await apiPut<{ project: any }>(`/api/projects/${id}`, payload);
    if (error || !data?.project) {
        console.warn('Failed to update project', error);
        return null;
    }
    return mapProjectRow(data.project);
}

export async function createProjectFromQuotation(quotationId: string): Promise<ProjectRecord | null> {
    const { data, error } = await apiPost<{ project: any }>(`/api/projects/from-quotation/${encodeURIComponent(quotationId)}`, {});
    if (error || !data?.project) {
        console.warn('Failed to create project from quotation', error);
        return null;
    }
    return mapProjectRow(data.project);
}

export async function deleteProject(id: string): Promise<boolean> {
    const { error } = await apiDelete<{ ok: boolean }>(`/api/projects/${id}`);
    if (error) {
        console.warn('Failed to delete project', error);
        return false;
    }
    return true;
}
