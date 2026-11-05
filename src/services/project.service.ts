import type { BusinessModel, DevelopmentArrangement, ProjectStatus } from '@/lib/models';
import { apiDelete, apiGet, apiPost, apiPut } from '@/services/apiClient';
import type { ServiceResult } from '@/services/serviceResult';
import { toServiceResult } from '@/services/serviceResult';

export interface ProjectRecord {
    id: string;
    companyId: string;
    customerId: string | null;
    sourceDocumentId: string | null;
    projectTypeId: string | null;
    projectTypeSnapshot: string | null;
    businessModel: BusinessModel | null;
    developmentArrangement: DevelopmentArrangement | null;
    totalProjectFlats: number | null;
    landownerPartyId: string | null;
    jdaAgreementReference: string | null;
    jdaAgreementDocumentUrl: string | null;
    jdaAgreementDate: string | null;
    builderShareUnits: number | null;
    landownerShareUnits: number | null;
    projectedSalesValue: number;
    landCost: number;
    projectNumber: string;
    name: string;
    description: string | null;
    siteAddress: string | null;
    contractAmount: number;
    budgetAmount: number | null;
    startDate: string | null;
    expectedEndDate: string | null;
    actualEndDate: string | null;
    status: ProjectStatus;
    createdAt: string;
    updatedAt: string;
    isDeleted?: boolean;
    deletedAt?: string | null;
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

export interface ProjectStageDraftPayload {
    name: string;
    sequenceNumber: number;
    plannedStartDate?: string | null;
    plannedEndDate?: string | null;
}

function normalizeProjectStatus(value: unknown): ProjectStatus {
    return value === 'in_progress' || value === 'on_hold' || value === 'completed' || value === 'cancelled'
        ? (value as ProjectStatus)
        : 'planned';
}

function mapProjectRow(row: any): ProjectRecord {
    const arrangement = typeof row.development_arrangement === 'string' ? row.development_arrangement : row.developmentArrangement;
    return {
        id: row.id,
        companyId: row.company_id,
        customerId: row.customer_id ?? null,
        sourceDocumentId: row.source_document_id ?? null,
        projectTypeId: row.project_type_id ?? null,
        projectTypeSnapshot: row.project_type_snapshot ?? null,
        businessModel: typeof row.business_model === 'string' ? (row.business_model as BusinessModel) : null,
        developmentArrangement: arrangement === 'joint_development' ? 'joint_development' : arrangement === 'self' ? 'self' : null,
        totalProjectFlats: row.total_project_flats == null ? null : Number(row.total_project_flats ?? 0),
        landownerPartyId: row.landowner_party_id ?? row.landownerPartyId ?? null,
        jdaAgreementReference: row.jda_agreement_reference ?? row.jdaAgreementReference ?? null,
        jdaAgreementDocumentUrl: row.jda_agreement_document_url ?? row.jdaAgreementDocumentUrl ?? null,
        jdaAgreementDate: row.jda_agreement_date ?? row.jdaAgreementDate ?? null,
        builderShareUnits: row.builder_share_units == null ? null : Number(row.builder_share_units ?? 0),
        landownerShareUnits: row.landowner_share_units == null ? null : Number(row.landowner_share_units ?? 0),
        projectedSalesValue: Number(row.projected_sales_value ?? 0),
        landCost: Number(row.land_cost ?? 0),
        projectNumber: row.project_number ?? '',
        name: row.name ?? '',
        description: row.description ?? null,
        siteAddress: row.site_address ?? null,
        contractAmount: Number(row.contract_amount ?? 0),
        budgetAmount: row.budget_amount == null ? null : Number(row.budget_amount ?? 0),
        startDate: row.start_date ?? null,
        expectedEndDate: row.expected_end_date ?? null,
        actualEndDate: row.actual_end_date ?? null,
        status: normalizeProjectStatus(row.status),
        createdAt: row.created_at ?? '',
        updatedAt: row.updated_at ?? '',
        isDeleted: Boolean(row.is_deleted ?? false),
        deletedAt: row.deleted_at ?? null,
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
    budgetAmount?: number | null;
    startDate?: string | null;
    expectedEndDate?: string | null;
    status?: ProjectStatus;
    sourceDocumentId?: string | null;
    projectTypeId?: string | null;
    projectTypeSnapshot?: string | null;
    businessModel?: BusinessModel | null;
    developmentArrangement?: DevelopmentArrangement | null;
    totalProjectFlats?: number | null;
    landownerPartyId?: string | null;
    jdaAgreementReference?: string | null;
    jdaAgreementDocumentUrl?: string | null;
    jdaAgreementDate?: string | null;
    builderShareUnits?: number | null;
    landownerShareUnits?: number | null;
    projectedSalesValue?: number;
    landCost?: number;
    stages?: ProjectStageDraftPayload[];
}): Promise<ProjectRecord | null> {
    const result = await createProjectResult(payload);
    return result.ok ? result.data : null;
}

export async function createProjectResult(payload: {
    name: string;
    customerId?: string | null;
    sourceDocumentId?: string | null;
    projectTypeId?: string | null;
    projectTypeSnapshot?: string | null;
    businessModel?: BusinessModel | null;
    developmentArrangement?: DevelopmentArrangement | null;
    totalProjectFlats?: number | null;
    landownerPartyId?: string | null;
    jdaAgreementReference?: string | null;
    jdaAgreementDocumentUrl?: string | null;
    jdaAgreementDate?: string | null;
    builderShareUnits?: number | null;
    landownerShareUnits?: number | null;
    projectedSalesValue?: number;
    landCost?: number;
    description?: string | null;
    siteAddress?: string | null;
    contractAmount?: number;
    budgetAmount?: number | null;
    startDate?: string | null;
    expectedEndDate?: string | null;
    status?: ProjectStatus;
    stages?: Array<{
        name: string;
        sequenceNumber?: number;
        plannedStartDate?: string | null;
        plannedEndDate?: string | null;
    }>;
}): Promise<ServiceResult<ProjectRecord>> {
    const base = toServiceResult(await apiPost<{ project: any }>('/api/projects', {
        name: payload.name,
        customer_id: payload.customerId ?? null,
        source_document_id: payload.sourceDocumentId ?? null,
        project_type_id: payload.projectTypeId ?? null,
        project_type_snapshot: payload.projectTypeSnapshot ?? null,
        business_model: payload.businessModel ?? null,
        development_arrangement: payload.developmentArrangement ?? null,
        total_project_flats: payload.totalProjectFlats == null ? null : Number(payload.totalProjectFlats ?? 0),
        landowner_party_id: payload.landownerPartyId ?? null,
        jda_agreement_reference: payload.jdaAgreementReference ?? null,
        jda_agreement_document_url: payload.jdaAgreementDocumentUrl ?? null,
        jda_agreement_date: payload.jdaAgreementDate ?? null,
        builder_share_units: payload.builderShareUnits == null ? null : Number(payload.builderShareUnits ?? 0),
        landowner_share_units: payload.landownerShareUnits == null ? null : Number(payload.landownerShareUnits ?? 0),
        projected_sales_value: Number(payload.projectedSalesValue ?? 0),
        land_cost: Number(payload.landCost ?? 0),
        description: payload.description ?? null,
        site_address: payload.siteAddress ?? null,
        contract_amount: Number(payload.contractAmount ?? 0),
        budget_amount: payload.budgetAmount == null ? null : Number(payload.budgetAmount ?? 0),
        start_date: payload.startDate ?? null,
        expected_end_date: payload.expectedEndDate ?? null,
        status: payload.status ?? 'planned',
        stages: Array.isArray(payload.stages)
            ? payload.stages.map((stage, index) => ({
                name: stage.name,
                sequenceNumber: Number(stage.sequenceNumber ?? index + 1),
                plannedStartDate: stage.plannedStartDate ?? null,
                plannedEndDate: stage.plannedEndDate ?? null,
            }))
            : undefined,
    }));

    if (!base.ok || !base.data?.project) {
        console.warn('Failed to create project', base.ok ? undefined : base.error);
        return {
            ok: false,
            error: base.ok ? 'Could not create this project right now. Please try again.' : base.error,
            status: base.status,
        };
    }
    return { ok: true, data: mapProjectRow(base.data.project), status: base.status };
}

export async function updateProject(id: string, updates: Partial<ProjectRecord>): Promise<ProjectRecord | null> {
    const result = await updateProjectResult(id, updates);
    return result.ok ? result.data : null;
}

export async function updateProjectResult(id: string, updates: Partial<ProjectRecord>): Promise<ServiceResult<ProjectRecord>> {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.customerId !== undefined) payload.customer_id = updates.customerId ?? null;
    if (updates.sourceDocumentId !== undefined) payload.source_document_id = updates.sourceDocumentId ?? null;
    if (updates.projectTypeId !== undefined) payload.project_type_id = updates.projectTypeId ?? null;
    if (updates.projectTypeSnapshot !== undefined) payload.project_type_snapshot = updates.projectTypeSnapshot ?? null;
    if (updates.businessModel !== undefined) payload.business_model = updates.businessModel ?? null;
    if (updates.developmentArrangement !== undefined) payload.development_arrangement = updates.developmentArrangement ?? null;
    if (updates.totalProjectFlats !== undefined) payload.total_project_flats = updates.totalProjectFlats == null ? null : Number(updates.totalProjectFlats ?? 0);
    if (updates.landownerPartyId !== undefined) payload.landowner_party_id = updates.landownerPartyId ?? null;
    if (updates.jdaAgreementReference !== undefined) payload.jda_agreement_reference = updates.jdaAgreementReference ?? null;
    if (updates.jdaAgreementDocumentUrl !== undefined) payload.jda_agreement_document_url = updates.jdaAgreementDocumentUrl ?? null;
    if (updates.jdaAgreementDate !== undefined) payload.jda_agreement_date = updates.jdaAgreementDate ?? null;
    if (updates.builderShareUnits !== undefined) payload.builder_share_units = updates.builderShareUnits == null ? null : Number(updates.builderShareUnits ?? 0);
    if (updates.landownerShareUnits !== undefined) payload.landowner_share_units = updates.landownerShareUnits == null ? null : Number(updates.landownerShareUnits ?? 0);
    if (updates.projectedSalesValue !== undefined) payload.projected_sales_value = Number(updates.projectedSalesValue ?? 0);
    if (updates.landCost !== undefined) payload.land_cost = Number(updates.landCost ?? 0);
    if (updates.description !== undefined) payload.description = updates.description ?? null;
    if (updates.siteAddress !== undefined) payload.site_address = updates.siteAddress ?? null;
    if (updates.contractAmount !== undefined) payload.contract_amount = Number(updates.contractAmount ?? 0);
    if (updates.budgetAmount !== undefined) payload.budget_amount = updates.budgetAmount == null ? null : Number(updates.budgetAmount ?? 0);
    if (updates.startDate !== undefined) payload.start_date = updates.startDate ?? null;
    if (updates.expectedEndDate !== undefined) payload.expected_end_date = updates.expectedEndDate ?? null;
    if (updates.status !== undefined) payload.status = updates.status;

    const base = toServiceResult(await apiPut<{ project: any }>(`/api/projects/${id}`, payload));
    if (!base.ok || !base.data?.project) {
        console.warn('Failed to update project', base.ok ? undefined : base.error);
        return {
            ok: false,
            error: base.ok ? 'Could not update this project right now. Please try again.' : base.error,
            status: base.status,
        };
    }
    return { ok: true, data: mapProjectRow(base.data.project), status: base.status };
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
    const result = await deleteProjectResult(id);
    return result.ok;
}

export async function deleteProjectResult(id: string): Promise<ServiceResult<true>> {
    const base = toServiceResult(await apiDelete<{ ok: boolean }>(`/api/projects/${id}`));
    if (!base.ok) {
        console.warn('Failed to delete project', base.error);
        return { ok: false, error: base.error, status: base.status };
    }
    return { ok: true, data: true, status: base.status };
}
