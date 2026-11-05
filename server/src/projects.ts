import { supabaseAdmin } from './auth.js';
import {
    DEFAULT_ENABLED_BUSINESS_MODELS,
    isSupportedBusinessModel,
    normalizeBusinessModel,
    normalizeBusinessModels,
} from './businessModels.js';
import { validateProjectPayload } from './validation.js';

export type ProjectStatus = 'planned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
export type ProjectExpenseStatus = 'unpaid' | 'partially_paid' | 'paid' | 'void';
export type ProjectExpenseType = 'direct' | 'supplier_bill';
export type ProjectExpenseVisibility = 'internal' | 'published';
export type ProjectReceiptPaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other';
export type ProjectReceiptVisibility = 'internal' | 'published';
export type ProjectStageStatus = 'pending' | 'in_progress' | 'completed' | 'on_hold';
export type ProjectProgressVisibility = 'draft' | 'published';
export type ProjectAttachmentVisibility = 'internal' | 'published';
export type ProjectClientAccessStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export const PROJECT_STATUS_VALUES: ProjectStatus[] = ['planned', 'in_progress', 'on_hold', 'completed', 'cancelled'];
export const PROJECT_EXPENSE_STATUS_VALUES: ProjectExpenseStatus[] = ['unpaid', 'partially_paid', 'paid', 'void'];
export const PROJECT_EXPENSE_TYPE_VALUES: ProjectExpenseType[] = ['direct', 'supplier_bill'];
export const PROJECT_EXPENSE_VISIBILITY_VALUES: ProjectExpenseVisibility[] = ['internal', 'published'];
export const PROJECT_RECEIPT_PAYMENT_METHODS: ProjectReceiptPaymentMethod[] = ['cash', 'upi', 'bank_transfer', 'cheque', 'other'];
export const PROJECT_RECEIPT_VISIBILITY_VALUES: ProjectReceiptVisibility[] = ['internal', 'published'];
export const PROJECT_STAGE_STATUS_VALUES: ProjectStageStatus[] = ['pending', 'in_progress', 'completed', 'on_hold'];
export const PROJECT_PROGRESS_VISIBILITY_VALUES: ProjectProgressVisibility[] = ['draft', 'published'];
export const PROJECT_ATTACHMENT_VISIBILITY_VALUES: ProjectAttachmentVisibility[] = ['internal', 'published'];
export const PROJECT_CLIENT_ACCESS_STATUS_VALUES: ProjectClientAccessStatus[] = ['pending', 'accepted', 'revoked', 'expired'];

export function normalizeProjectStatus(value: unknown): ProjectStatus {
    return PROJECT_STATUS_VALUES.includes(value as ProjectStatus) ? (value as ProjectStatus) : 'planned';
}

export function normalizeProjectExpenseStatus(value: unknown): ProjectExpenseStatus {
    return PROJECT_EXPENSE_STATUS_VALUES.includes(value as ProjectExpenseStatus)
        ? (value as ProjectExpenseStatus)
        : 'unpaid';
}

export function normalizeProjectExpenseType(value: unknown): ProjectExpenseType {
    return PROJECT_EXPENSE_TYPE_VALUES.includes(value as ProjectExpenseType)
        ? (value as ProjectExpenseType)
        : 'direct';
}

function inferProjectExpenseType(payload: any): ProjectExpenseType {
    if (payload?.expenseType !== undefined || payload?.expense_type !== undefined) {
        return normalizeProjectExpenseType(payload?.expenseType ?? payload?.expense_type);
    }

    const hasSupplierFields = Boolean(
        payload?.supplierId
        || payload?.supplier_id
        || payload?.supplierPartyId
        || payload?.supplier_party_id
        || String(payload?.supplierName ?? '').trim()
        || String(payload?.supplierBillNumber ?? '').trim()
        || payload?.dueDate
        || payload?.due_date
    );

    return hasSupplierFields ? 'supplier_bill' : 'direct';
}

export function normalizeProjectExpenseVisibility(value: unknown): ProjectExpenseVisibility {
    return PROJECT_EXPENSE_VISIBILITY_VALUES.includes(value as ProjectExpenseVisibility)
        ? (value as ProjectExpenseVisibility)
        : 'internal';
}

export function normalizeProjectReceiptPaymentMethod(value: unknown): ProjectReceiptPaymentMethod {
    return PROJECT_RECEIPT_PAYMENT_METHODS.includes(value as ProjectReceiptPaymentMethod)
        ? (value as ProjectReceiptPaymentMethod)
        : 'cash';
}

export function normalizeProjectReceiptVisibility(value: unknown): ProjectReceiptVisibility {
    return PROJECT_RECEIPT_VISIBILITY_VALUES.includes(value as ProjectReceiptVisibility)
        ? (value as ProjectReceiptVisibility)
        : 'internal';
}

export function normalizeProjectStageStatus(value: unknown): ProjectStageStatus {
    return PROJECT_STAGE_STATUS_VALUES.includes(value as ProjectStageStatus)
        ? (value as ProjectStageStatus)
        : 'pending';
}

export function normalizeProjectProgressVisibility(value: unknown): ProjectProgressVisibility {
    return PROJECT_PROGRESS_VISIBILITY_VALUES.includes(value as ProjectProgressVisibility)
        ? (value as ProjectProgressVisibility)
        : 'draft';
}

export function normalizeProjectAttachmentVisibility(value: unknown): ProjectAttachmentVisibility {
    return PROJECT_ATTACHMENT_VISIBILITY_VALUES.includes(value as ProjectAttachmentVisibility)
        ? (value as ProjectAttachmentVisibility)
        : 'internal';
}

export function normalizeProjectClientAccessStatus(value: unknown): ProjectClientAccessStatus {
    return PROJECT_CLIENT_ACCESS_STATUS_VALUES.includes(value as ProjectClientAccessStatus)
        ? (value as ProjectClientAccessStatus)
        : 'pending';
}

async function ensureExternalUserAccount(email: string, role: 'client' | 'investor') {
    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    if (!normalizedEmail) {
        const error: any = new Error(`${role === 'client' ? 'Client' : 'Investor'} email is required.`);
        error.statusCode = 400;
        throw error;
    }

    const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email, role')
        .eq('email', normalizedEmail)
        .maybeSingle();

    if (userError) throw userError;
    if (!user) {
        const error: any = new Error(`No user account exists for ${normalizedEmail}. Invite or create the ${role} account first before granting project access.`);
        error.statusCode = 409;
        throw error;
    }

    if (user.role !== role) {
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ role, updated_at: new Date().toISOString() })
            .eq('id', user.id);

        if (updateError) throw updateError;
    }

    return user;
}

export function buildProjectPayloadFromQuotation(
    quotation: any,
    companyId: string,
    customerId: string | null,
    projectNumber: string = 'PRJ-001',
) {
    const name = String(
        quotation?.project?.name ?? quotation?.project_name ?? quotation?.name ?? 'Project',
    ).trim() || 'Project';

    return {
        company_id: companyId,
        customer_id: customerId,
        source_document_id: quotation?.id ?? quotation?.source_document_id ?? null,
        project_type_id: quotation?.project_type_id ?? null,
        project_type_snapshot: quotation?.project_type ?? quotation?.project?.projectType ?? null,
        project_number: projectNumber,
        name,
        description: quotation?.notes ?? quotation?.project?.description ?? null,
        site_address: quotation?.project?.address ?? quotation?.project_location ?? null,
        contract_amount: Number(quotation?.grand_total ?? quotation?.contract_amount ?? quotation?.subtotal ?? 0),
        start_date: quotation?.quotation_date ?? quotation?.start_date ?? null,
        expected_end_date: quotation?.valid_until ?? quotation?.expected_end_date ?? null,
        actual_end_date: null,
        status: 'planned',
    };
}

export function canConvertQuotationToProject(
    existingProjectRow: any | null,
    quotationStatus?: string,
): { allowed: boolean; reason?: string } {
    const normalizedStatus = String(quotationStatus ?? '').trim();
    if (normalizedStatus && !['ACCEPTED', 'Accepted'].includes(normalizedStatus)) {
        return { allowed: false, reason: 'Only accepted quotations can be converted into projects.' };
    }

    if (!existingProjectRow) return { allowed: true };
    if (existingProjectRow.source_document_id) {
        return { allowed: false, reason: 'This quotation has already been converted to a project.' };
    }
    return { allowed: true };
}

type ProjectStageDraftInput = {
    name: string;
    sequenceNumber: number;
    plannedStartDate?: string | null;
    plannedEndDate?: string | null;
};

function normalizeProjectStageDrafts(stageDrafts: unknown): ProjectStageDraftInput[] {
    if (!Array.isArray(stageDrafts)) return [];

    const normalized: ProjectStageDraftInput[] = [];
    for (let index = 0; index < stageDrafts.length; index += 1) {
        const row = stageDrafts[index] as any;
        const name = String(row?.name ?? '').trim();
        if (!name) continue;

        const rawSequence = Number(row?.sequenceNumber ?? index + 1);
        const sequenceNumber = Number.isFinite(rawSequence) && rawSequence > 0
            ? Math.floor(rawSequence)
            : index + 1;

        normalized.push({
            name,
            sequenceNumber,
            plannedStartDate: row?.plannedStartDate ?? null,
            plannedEndDate: row?.plannedEndDate ?? null,
        });
    }

    return normalized
        .sort((a, b) => a.sequenceNumber - b.sequenceNumber || a.name.localeCompare(b.name))
        .map((row, index) => ({
            ...row,
            sequenceNumber: index + 1,
        }));
}

async function getCompanyEnabledBusinessModels(companyId: string): Promise<string[]> {
    const { data, error } = await supabaseAdmin
        .from('company_settings')
        .select('enabled_business_models')
        .eq('company_id', companyId)
        .maybeSingle();

    if (error) throw error;
    return normalizeBusinessModels(data?.enabled_business_models ?? DEFAULT_ENABLED_BUSINESS_MODELS);
}

async function assertBusinessModelEnabled(companyId: string, businessModel: unknown) {
    const normalizedBusinessModel = normalizeBusinessModel(businessModel);
    if (!normalizedBusinessModel) return;

    const enabledBusinessModels = await getCompanyEnabledBusinessModels(companyId);
    if (!enabledBusinessModels.includes(normalizedBusinessModel)) {
        const error = new Error(`Business model "${normalizedBusinessModel}" is not enabled for this company.`) as Error & { statusCode?: number };
        error.statusCode = 403;
        throw error;
    }
}

async function validateLandownerPartyForCompany(companyId: string, landownerPartyId: string | null | undefined) {
    if (!landownerPartyId) return null;

    const { data, error } = await supabaseAdmin
        .from('parties')
        .select('id, company_id, is_active, is_deleted, name')
        .eq('id', landownerPartyId)
        .maybeSingle();

    if (error) throw error;
    if (!data) {
        const err: any = new Error('Selected landowner party could not be found.');
        err.statusCode = 404;
        throw err;
    }
    if (data.company_id !== companyId) {
        const err: any = new Error('Selected landowner party belongs to a different company.');
        err.statusCode = 403;
        throw err;
    }
    if (!data.is_active || data.is_deleted) {
        const err: any = new Error('Selected landowner party is not active for this company.');
        err.statusCode = 400;
        throw err;
    }

    return data;
}

async function createProjectAndSeedStagesTransactional(companyId: string, payload: any, userId: string) {
    const stageDrafts = normalizeProjectStageDrafts(payload?.stage_drafts ?? payload?.stages);
    const normalizedBusinessModel = payload?.business_model ?? payload?.businessModel ?? null;
    const landownerPartyId = payload?.landowner_party_id ?? payload?.landownerPartyId ?? null;
    const normalizedBusinessModelValue = isSupportedBusinessModel(normalizedBusinessModel) ? normalizedBusinessModel : null;

    if (normalizedBusinessModelValue === 'property_development' && landownerPartyId) {
        await validateLandownerPartyForCompany(companyId, landownerPartyId);
    }

    const rpcPayload = {
        p_company_id: companyId,
        p_created_by: userId,
        p_customer_id: payload?.customer_id ?? null,
        p_source_document_id: payload?.source_document_id ?? null,
        p_project_type_id: payload?.project_type_id ?? null,
        p_project_type_snapshot: payload?.project_type_snapshot ?? null,
        p_business_model: normalizedBusinessModelValue,
        p_projected_sales_value: payload?.projected_sales_value ?? payload?.projectedSalesValue ?? null,
        p_land_cost: payload?.land_cost ?? payload?.landCost ?? null,
        p_development_arrangement: payload?.development_arrangement ?? payload?.developmentArrangement ?? null,
        p_total_project_flats: payload?.total_project_flats ?? payload?.totalProjectFlats ?? null,
        p_landowner_party_id: landownerPartyId,
        p_jda_agreement_reference: payload?.jda_agreement_reference ?? payload?.jdaAgreementReference ?? null,
        p_jda_agreement_document_url: payload?.jda_agreement_document_url ?? payload?.jdaAgreementDocumentUrl ?? null,
        p_jda_agreement_date: payload?.jda_agreement_date ?? payload?.jdaAgreementDate ?? null,
        p_builder_share_units: payload?.builder_share_units ?? payload?.builderShareUnits ?? null,
        p_landowner_share_units: payload?.landowner_share_units ?? payload?.landownerShareUnits ?? null,
        p_project_number: payload?.project_number,
        p_name: payload?.name,
        p_description: payload?.description ?? null,
        p_site_address: payload?.site_address ?? null,
        p_contract_amount: Number(payload?.contract_amount ?? 0),
        p_budget_amount: payload?.budget_amount === undefined || payload?.budget_amount === null ? null : Number(payload.budget_amount ?? 0),
        p_start_date: payload?.start_date ?? null,
        p_expected_end_date: payload?.expected_end_date ?? null,
        p_actual_end_date: payload?.actual_end_date ?? null,
        p_status: normalizeProjectStatus(payload?.status ?? 'planned'),
        p_stage_drafts: stageDrafts.length > 0 ? stageDrafts : null,
    };

    const { data: projectId, error: rpcError } = await supabaseAdmin.rpc('create_project_with_stages_with_business_model', rpcPayload);
    if (rpcError) throw rpcError;

    const createdProjectId = String(projectId ?? '').trim();
    if (!createdProjectId) {
        throw new Error('Project creation did not return an id.');
    }

    const project = await getProjectRowById(createdProjectId);
    if (!project) {
        throw new Error('Project was created but could not be loaded.');
    }

    return project;
}

export async function generateProjectNumber(companyId: string): Promise<string> {
    const { data, error } = await supabaseAdmin
        .from('projects')
        .select('project_number')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) throw error;

    let highest = 0;
    for (const row of data ?? []) {
        const match = String(row?.project_number ?? '').match(/(\d+)$/);
        if (match) {
            highest = Math.max(highest, Number(match[1]));
        }
    }

    return `PRJ-${String(highest + 1).padStart(3, '0')}`;
}

export async function listProjectAttachmentsForProject(projectId: string, companyId: string) {
    const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('company_id', companyId)
        .maybeSingle();

    if (projectError) throw projectError;
    if (!project) return [];

    const { data, error } = await supabaseAdmin
        .from('project_attachments')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
}

export async function createProjectAttachmentForProject(projectId: string, companyId: string, payload: any, userId: string) {
    const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id, company_id')
        .eq('id', projectId)
        .eq('company_id', companyId)
        .maybeSingle();

    if (projectError) throw projectError;
    if (!project) {
        const error: any = new Error('Project not found for this company.');
        error.statusCode = 404;
        throw error;
    }

    const documentName = String(payload?.originalFilename ?? payload?.fileName ?? '').trim() || 'Project document';
    const storagePath = String(payload?.storagePath ?? '').trim();
    if (!storagePath) {
        const error: any = new Error('A document URL or storage path is required.');
        error.statusCode = 400;
        throw error;
    }

    if (payload?.progressUpdateId) {
        const { data: progressRow, error: progressError } = await supabaseAdmin
            .from('project_progress_updates')
            .select('id, project_id')
            .eq('id', payload.progressUpdateId)
            .maybeSingle();
        if (progressError) throw progressError;
        if (!progressRow || progressRow.project_id !== projectId) {
            const error: any = new Error('Progress update does not belong to this project.');
            error.statusCode = 400;
            throw error;
        }
    }

    if (payload?.expenseId) {
        const { data: expenseRow, error: expenseError } = await supabaseAdmin
            .from('project_expenses')
            .select('id, project_id')
            .eq('id', payload.expenseId)
            .maybeSingle();
        if (expenseError) throw expenseError;
        if (!expenseRow || expenseRow.project_id !== projectId) {
            const error: any = new Error('Expense does not belong to this project.');
            error.statusCode = 400;
            throw error;
        }
    }

    const attachmentPayload = {
        project_id: projectId,
        progress_update_id: payload?.progressUpdateId ?? null,
        expense_id: payload?.expenseId ?? null,
        storage_path: storagePath,
        original_filename: documentName,
        mime_type: payload?.mimeType ?? null,
        file_size_bytes: payload?.fileSizeBytes !== undefined && payload?.fileSizeBytes !== null ? Number(payload.fileSizeBytes) : null,
        visibility_status: normalizeProjectAttachmentVisibility(payload?.visibilityStatus ?? 'internal'),
        uploaded_by: userId,
    };

    const { data, error } = await supabaseAdmin
        .from('project_attachments')
        .insert(attachmentPayload)
        .select('*')
        .single();

    if (error) throw error;
    return data;
}

export async function deleteProjectAttachmentRow(id: string, companyId: string) {
    const { data, error } = await supabaseAdmin
        .from('project_attachments')
        .select('*, projects!project_id(id, company_id)')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    if (!data) {
        const error: any = new Error('Document not found.');
        error.statusCode = 404;
        throw error;
    }

    const projectCompanyId = Array.isArray(data.projects) ? data.projects[0]?.company_id ?? null : data.projects?.company_id ?? null;
    if (projectCompanyId !== companyId) {
        const error: any = new Error('This document belongs to a different company.');
        error.statusCode = 403;
        throw error;
    }

    const { error: deleteError } = await supabaseAdmin
        .from('project_attachments')
        .delete()
        .eq('id', id);

    if (deleteError) throw deleteError;
}

export async function listProjectClientAccessForProject(projectId: string, companyId: string) {
    const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('company_id', companyId)
        .maybeSingle();

    if (projectError) throw projectError;
    if (!project) return [];

    const { data, error } = await supabaseAdmin
        .from('project_client_access')
        .select('*')
        .eq('project_id', projectId)
        .order('invited_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
}

export async function createProjectClientAccessForProject(projectId: string, companyId: string, payload: any, userId: string) {
    const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id, company_id')
        .eq('id', projectId)
        .eq('company_id', companyId)
        .maybeSingle();

    if (projectError) throw projectError;
    if (!project) {
        const error: any = new Error('Project not found for this company.');
        error.statusCode = 404;
        throw error;
    }

    const email = String(payload?.email ?? '').trim().toLowerCase();
    if (!email) {
        const error: any = new Error('Client email is required.');
        error.statusCode = 400;
        throw error;
    }

    const existingUser = await ensureExternalUserAccount(email, 'client');

    const { data: existingAccess, error: lookupError } = await supabaseAdmin
        .from('project_client_access')
        .select('*')
        .eq('project_id', projectId)
        .eq('email', email)
        .maybeSingle();

    if (lookupError) throw lookupError;
    if (existingAccess) {
        if (existingAccess.invitation_status === 'revoked' || existingAccess.invitation_status === 'expired') {
            const { data: updated, error: updateError } = await supabaseAdmin
                .from('project_client_access')
                .update({
                    user_id: existingUser.id,
                    invitation_status: 'accepted',
                    accepted_at: new Date().toISOString(),
                    revoked_at: null,
                    invitation_token_hash: null,
                    invitation_expires_at: null,
                    invited_by: userId,
                    invited_at: existingAccess.invited_at ?? new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existingAccess.id)
                .select('*')
                .single();

            if (updateError) throw updateError;
            return updated;
        }

        const error: any = new Error('This client already has access to this project.');
        error.statusCode = 409;
        throw error;
    }

    const accessPayload = {
        project_id: projectId,
        email,
        user_id: existingUser.id,
        invitation_token_hash: payload?.invitationTokenHash ?? null,
        invitation_expires_at: payload?.invitationExpiresAt ?? null,
        invitation_status: 'accepted',
        invited_by: userId,
        accepted_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
        .from('project_client_access')
        .insert(accessPayload)
        .select('*')
        .single();

    if (error) throw error;
    return data;
}

export async function revokeProjectClientAccessRow(id: string, companyId: string) {
    const { data, error } = await supabaseAdmin
        .from('project_client_access')
        .select('*, projects!project_id(id, company_id)')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    if (!data) {
        const error: any = new Error('Client access record not found.');
        error.statusCode = 404;
        throw error;
    }

    const projectCompanyId = Array.isArray(data.projects) ? data.projects[0]?.company_id ?? null : data.projects?.company_id ?? null;
    if (projectCompanyId !== companyId) {
        const error: any = new Error('This client access belongs to a different company.');
        error.statusCode = 403;
        throw error;
    }

    const { error: updateError } = await supabaseAdmin
        .from('project_client_access')
        .update({
            invitation_status: 'revoked',
            revoked_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (updateError) throw updateError;
}

export async function listProjectsForCompany(companyId: string) {
    const { data, error } = await supabaseAdmin
        .from('projects')
        .select('*, customers(*)')
        .eq('company_id', companyId)
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
}

export async function getProjectRowById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('projects')
        .select('*, customers(*)')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function createProjectForCompany(companyId: string, payload: any, userId: string) {
    const businessModelValue = payload?.business_model ?? payload?.businessModel ?? null;
    if (businessModelValue === null || businessModelValue === undefined || (typeof businessModelValue === 'string' && businessModelValue.trim() === '')) {
        const error = new Error('Business model is required for new project creation. Select one of: contract_construction, property_development, civil_works_contract, material_supply.') as Error & { statusCode?: number };
        error.statusCode = 400;
        throw error;
    }

    if (!isSupportedBusinessModel(businessModelValue)) {
        const error = new Error('Business model must be one of: contract_construction, property_development, civil_works_contract, material_supply.') as Error & { statusCode?: number };
        error.statusCode = 400;
        throw error;
    }

    await assertBusinessModelEnabled(companyId, businessModelValue);

    const normalizedBusinessModel = businessModelValue;
    const cleanPayload = {
        ...payload,
        company_id: companyId,
        created_by: userId,
        customer_id: payload?.customer_id ?? null,
        source_document_id: payload?.source_document_id ?? null,
        project_type_id: payload?.project_type_id ?? null,
        project_type_snapshot: payload?.project_type_snapshot ?? null,
        business_model: isSupportedBusinessModel(normalizedBusinessModel) ? normalizedBusinessModel : null,
        development_arrangement: payload?.development_arrangement ?? payload?.developmentArrangement ?? null,
        total_project_flats: payload?.total_project_flats ?? payload?.totalProjectFlats ?? null,
        landowner_party_id: payload?.landowner_party_id ?? payload?.landownerPartyId ?? null,
        jda_agreement_reference: payload?.jda_agreement_reference ?? payload?.jdaAgreementReference ?? null,
        jda_agreement_document_url: payload?.jda_agreement_document_url ?? payload?.jdaAgreementDocumentUrl ?? null,
        jda_agreement_date: payload?.jda_agreement_date ?? payload?.jdaAgreementDate ?? null,
        builder_share_units: payload?.builder_share_units ?? payload?.builderShareUnits ?? null,
        landowner_share_units: payload?.landowner_share_units ?? payload?.landownerShareUnits ?? null,
        projected_sales_value: payload?.projected_sales_value ?? payload?.projectedSalesValue ?? null,
        land_cost: payload?.land_cost ?? payload?.landCost ?? null,
        status: normalizeProjectStatus(payload?.status ?? 'planned'),
        contract_amount: Number(payload?.contract_amount ?? 0),
        budget_amount: payload?.budget_amount === undefined || payload?.budget_amount === null ? null : Number(payload.budget_amount ?? 0),
    };

    return createProjectAndSeedStagesTransactional(companyId, cleanPayload, userId);
}

export async function updateProjectRow(id: string, payload: any) {
    const currentProject = await getProjectRowById(id);
    const nextProjectPayload = {
        ...currentProject,
        ...payload,
        business_model: payload.business_model ?? payload.businessModel ?? currentProject?.business_model ?? null,
        development_arrangement: payload.development_arrangement ?? payload.developmentArrangement ?? currentProject?.development_arrangement ?? null,
        total_project_flats: payload.total_project_flats ?? payload.totalProjectFlats ?? currentProject?.total_project_flats ?? null,
        landowner_party_id: payload.landowner_party_id ?? payload.landownerPartyId ?? currentProject?.landowner_party_id ?? null,
        jda_agreement_reference: payload.jda_agreement_reference ?? payload.jdaAgreementReference ?? currentProject?.jda_agreement_reference ?? null,
        jda_agreement_document_url: payload.jda_agreement_document_url ?? payload.jdaAgreementDocumentUrl ?? currentProject?.jda_agreement_document_url ?? null,
        jda_agreement_date: payload.jda_agreement_date ?? payload.jdaAgreementDate ?? currentProject?.jda_agreement_date ?? null,
        builder_share_units: payload.builder_share_units ?? payload.builderShareUnits ?? currentProject?.builder_share_units ?? null,
        landowner_share_units: payload.landowner_share_units ?? payload.landownerShareUnits ?? currentProject?.landowner_share_units ?? null,
        projected_sales_value: payload.projected_sales_value ?? payload.projectedSalesValue ?? currentProject?.projected_sales_value ?? null,
        land_cost: payload.land_cost ?? payload.landCost ?? currentProject?.land_cost ?? null,
    };

    const validationError = validateProjectPayload(nextProjectPayload);
    if (validationError) {
        const error = new Error(validationError) as Error & { statusCode?: number };
        error.statusCode = 400;
        throw error;
    }

    if (currentProject?.company_id && nextProjectPayload.business_model === 'property_development' && nextProjectPayload.landowner_party_id) {
        await validateLandownerPartyForCompany(currentProject.company_id, nextProjectPayload.landowner_party_id);
    }

    if (currentProject?.id) {
        const { data: existingProjectUnits, error: existingProjectUnitsError } = await supabaseAdmin
            .from('project_units')
            .select('id, share_type, status')
            .eq('project_id', currentProject.id);

        if (existingProjectUnitsError) throw existingProjectUnitsError;

        const builderExisting = (existingProjectUnits ?? []).filter((row) => row.share_type === 'builder').length;
        const landownerExisting = (existingProjectUnits ?? []).filter((row) => row.share_type === 'landowner').length;
        const nextBuilderShareUnits = Number(nextProjectPayload.builder_share_units ?? currentProject.builder_share_units ?? 0);
        const nextLandownerShareUnits = Number(nextProjectPayload.landowner_share_units ?? currentProject.landowner_share_units ?? 0);

        if (nextProjectPayload.business_model !== 'property_development' && (existingProjectUnits ?? []).length > 0) {
            const error: any = new Error('Existing project units must be removed before switching away from property development.');
            error.statusCode = 400;
            throw error;
        }

        if (nextBuilderShareUnits < builderExisting || nextLandownerShareUnits < landownerExisting) {
            const error: any = new Error('Project share totals cannot be reduced below the number of existing registered units.');
            error.statusCode = 400;
            throw error;
        }
    }

    const updates: Record<string, unknown> = {};

    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.description !== undefined) updates.description = payload.description ?? null;
    if (payload.site_address !== undefined) updates.site_address = payload.site_address ?? null;
    if (payload.contract_amount !== undefined) updates.contract_amount = Number(payload.contract_amount ?? 0);
    if (payload.budget_amount !== undefined) updates.budget_amount = payload.budget_amount === null || payload.budget_amount === undefined ? null : Number(payload.budget_amount ?? 0);
    if (payload.start_date !== undefined) updates.start_date = payload.start_date ?? null;
    if (payload.expected_end_date !== undefined) updates.expected_end_date = payload.expected_end_date ?? null;
    if (payload.actual_end_date !== undefined) updates.actual_end_date = payload.actual_end_date ?? null;
    if (payload.customer_id !== undefined) updates.customer_id = payload.customer_id ?? null;
    if (payload.source_document_id !== undefined) updates.source_document_id = payload.source_document_id ?? null;
    if (payload.project_type_id !== undefined) updates.project_type_id = payload.project_type_id ?? null;
    if (payload.project_type_snapshot !== undefined) updates.project_type_snapshot = payload.project_type_snapshot ?? null;
    if (payload.business_model !== undefined || payload.businessModel !== undefined) {
        const businessModelValue = payload.business_model ?? payload.businessModel ?? null;
        if (businessModelValue !== null && businessModelValue !== undefined) {
            const trimmedBusinessModel = typeof businessModelValue === 'string' ? businessModelValue.trim() : businessModelValue;
            if (trimmedBusinessModel === '' || !isSupportedBusinessModel(trimmedBusinessModel)) {
                const error = new Error('Business model must be one of: contract_construction, property_development, civil_works_contract, material_supply.') as Error & { statusCode?: number };
                error.statusCode = 400;
                throw error;
            }
        }

        const normalizedBusinessModel = normalizeBusinessModel(businessModelValue);
        if (currentProject?.company_id) {
            await assertBusinessModelEnabled(currentProject.company_id, businessModelValue);
        }
        updates.business_model = normalizedBusinessModel ?? null;
    }
    if (payload.development_arrangement !== undefined || payload.developmentArrangement !== undefined) {
        updates.development_arrangement = payload.development_arrangement ?? payload.developmentArrangement ?? null;
    }
    if (payload.total_project_flats !== undefined || payload.totalProjectFlats !== undefined) {
        updates.total_project_flats = payload.total_project_flats ?? payload.totalProjectFlats ?? null;
    }
    if (payload.landowner_party_id !== undefined || payload.landownerPartyId !== undefined) {
        updates.landowner_party_id = payload.landowner_party_id ?? payload.landownerPartyId ?? null;
    }
    if (payload.jda_agreement_reference !== undefined || payload.jdaAgreementReference !== undefined) {
        updates.jda_agreement_reference = payload.jda_agreement_reference ?? payload.jdaAgreementReference ?? null;
    }
    if (payload.jda_agreement_document_url !== undefined || payload.jdaAgreementDocumentUrl !== undefined) {
        updates.jda_agreement_document_url = payload.jda_agreement_document_url ?? payload.jdaAgreementDocumentUrl ?? null;
    }
    if (payload.jda_agreement_date !== undefined || payload.jdaAgreementDate !== undefined) {
        updates.jda_agreement_date = payload.jda_agreement_date ?? payload.jdaAgreementDate ?? null;
    }
    if (payload.builder_share_units !== undefined || payload.builderShareUnits !== undefined) {
        updates.builder_share_units = payload.builder_share_units ?? payload.builderShareUnits ?? null;
    }
    if (payload.landowner_share_units !== undefined || payload.landownerShareUnits !== undefined) {
        updates.landowner_share_units = payload.landowner_share_units ?? payload.landownerShareUnits ?? null;
    }
    if (payload.projected_sales_value !== undefined || payload.projectedSalesValue !== undefined) {
        updates.projected_sales_value = payload.projected_sales_value ?? payload.projectedSalesValue ?? null;
    }
    if (payload.land_cost !== undefined || payload.landCost !== undefined) {
        updates.land_cost = payload.land_cost ?? payload.landCost ?? null;
    }
    if (payload.status !== undefined) updates.status = normalizeProjectStatus(payload.status);

    const { data, error } = await supabaseAdmin
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select('*, customers(*)')
        .single();

    if (error) throw error;
    return data;
}

export async function getProjectCompanyId(projectId: string): Promise<string | null> {
    const { data, error } = await supabaseAdmin
        .from('projects')
        .select('company_id')
        .eq('id', projectId)
        .maybeSingle();

    if (error) throw error;
    return data?.company_id ?? null;
}

export async function listProjectExpensesForCompany(companyId: string, projectId?: string | null) {
    let projectIds: string[] = [];

    if (projectId) {
        const { data, error } = await supabaseAdmin
            .from('projects')
            .select('id')
            .eq('id', projectId)
            .eq('company_id', companyId)
            .maybeSingle();

        if (error) throw error;
        if (!data) return [];
        projectIds = [data.id];
    } else {
        const { data, error } = await supabaseAdmin
            .from('projects')
            .select('id')
            .eq('company_id', companyId);

        if (error) throw error;
        projectIds = (data ?? []).map((row) => row.id);
        if (projectIds.length === 0) return [];
    }

    const { data, error } = await supabaseAdmin
        .from('project_expenses')
        .select('*, projects!project_id(id, project_number, name, company_id)')
        .in('project_id', projectIds)
        .order('bill_date', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row) => ({
        ...row,
        project: Array.isArray(row.projects) ? row.projects[0] ?? null : row.projects ?? null,
    }));
}

export async function getProjectExpenseRowById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('project_expenses')
        .select('*, projects!project_id(id, project_number, name, company_id)')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
        ...data,
        project: Array.isArray(data.projects) ? data.projects[0] ?? null : data.projects ?? null,
    };
}

async function validateExpenseCategoryForCompany(companyId: string, categoryId: string | null | undefined) {
    if (!categoryId) return null;

    const { data, error } = await supabaseAdmin
        .from('expense_categories')
        .select('id, company_id, is_active')
        .eq('id', categoryId)
        .maybeSingle();

    if (error) throw error;
    if (!data) {
        const err: any = new Error('Selected expense category could not be found.');
        err.statusCode = 404;
        throw err;
    }
    if (data.is_active === false) {
        const err: any = new Error('Selected expense category is inactive.');
        err.statusCode = 400;
        throw err;
    }
    if (data.company_id && data.company_id !== companyId) {
        const err: any = new Error('Selected expense category belongs to a different company.');
        err.statusCode = 403;
        throw err;
    }

    return data;
}

async function validateSupplierForCompany(companyId: string, supplierId: string | null | undefined) {
    if (!supplierId) return null;

    const { data, error } = await supabaseAdmin
        .from('suppliers')
        .select('id, company_id, name')
        .eq('id', supplierId)
        .maybeSingle();

    if (error) throw error;
    if (!data) {
        const err: any = new Error('Selected supplier could not be found.');
        err.statusCode = 404;
        throw err;
    }
    if (data.company_id !== companyId) {
        const err: any = new Error('Selected supplier belongs to a different company.');
        err.statusCode = 403;
        throw err;
    }

    return data;
}

async function validateSupplierPartyForCompany(companyId: string, supplierPartyId: string | null | undefined) {
    if (!supplierPartyId) return null;

    const { data, error } = await supabaseAdmin
        .from('parties')
        .select('id, company_id, name, is_supplier, is_active, is_deleted')
        .eq('id', supplierPartyId)
        .maybeSingle();

    if (error) throw error;
    if (!data) {
        const err: any = new Error('Selected supplier contact could not be found.');
        err.statusCode = 404;
        throw err;
    }
    if (data.company_id !== companyId) {
        const err: any = new Error('Selected supplier contact belongs to a different company.');
        err.statusCode = 403;
        throw err;
    }
    if (!data.is_supplier || !data.is_active || data.is_deleted) {
        const err: any = new Error('Selected contact is not an active supplier for this company.');
        err.statusCode = 400;
        throw err;
    }

    return data;
}

async function validatePaymentMethodForCompany(companyId: string, paymentMethodId: string | null | undefined, paymentMethod: unknown) {
    const normalized = normalizeProjectReceiptPaymentMethod(paymentMethod ?? 'cash');

    if (paymentMethodId) {
        const { data, error } = await supabaseAdmin
            .from('payment_methods')
            .select('id, company_id, is_active, code')
            .eq('id', paymentMethodId)
            .maybeSingle();

        if (error) throw error;
        if (!data) {
            const err: any = new Error('Selected payment method could not be found.');
            err.statusCode = 404;
            throw err;
        }
        if (!data.is_active) {
            const err: any = new Error('Selected payment method is inactive.');
            err.statusCode = 400;
            throw err;
        }
        if (data.company_id && data.company_id !== companyId) {
            const err: any = new Error('Selected payment method belongs to a different company.');
            err.statusCode = 403;
            throw err;
        }
        if (data.code && String(data.code).trim() && normalized !== String(data.code).trim()) {
            const err: any = new Error('Selected payment method does not match the payment type.');
            err.statusCode = 400;
            throw err;
        }
    }

    return normalized;
}

async function getProjectExpenseOutstandingAmount(expenseId: string): Promise<number> {
    const expense = await getProjectExpenseRowById(expenseId);
    if (!expense) {
        const err: any = new Error('Supplier bill not found.');
        err.statusCode = 404;
        throw err;
    }

    const { data: payments, error } = await supabaseAdmin
        .from('project_expense_payments')
        .select('amount, voided_at')
        .eq('project_expense_id', expenseId);

    if (error) throw error;

    const paid = (payments ?? [])
        .filter((row: any) => !row.voided_at)
        .reduce((sum: number, row: any) => sum + Number(row.amount ?? 0), 0);

    return Math.max(0, Number(expense.bill_amount ?? 0) - paid);
}

export async function createProjectExpenseForProject(projectId: string, companyId: string, payload: any, userId: string) {
    const project = await supabaseAdmin
        .from('projects')
        .select('id, company_id')
        .eq('id', projectId)
        .eq('company_id', companyId)
        .maybeSingle();

    if (project.error) throw project.error;
    if (!project.data) {
        const error: any = new Error('Project not found for this company.');
        error.statusCode = 404;
        throw error;
    }

    const categoryId = payload?.categoryId ?? payload?.category_id ?? null;
    const supplierId = payload?.supplierId ?? payload?.supplier_id ?? null;
    const supplierPartyId = payload?.supplierPartyId ?? payload?.supplier_party_id ?? null;
    const supplierParty = supplierPartyId ? await validateSupplierPartyForCompany(companyId, supplierPartyId) : null;
    const supplier = supplierParty ? null : await validateSupplierForCompany(companyId, supplierId);
    await validateExpenseCategoryForCompany(companyId, categoryId);

    const expensePayload = {
        project_id: projectId,
        company_id: companyId,
        expense_type: inferProjectExpenseType(payload),
        category_id: categoryId,
        category: String(payload?.category ?? '').trim() || 'General',
        description: String(payload?.description ?? '').trim() || 'Supplier expense',
        supplier_id: supplierId,
        party_id: supplierPartyId ?? null,
        supplier_name: String(payload?.supplierName ?? supplierParty?.name ?? supplier?.name ?? '').trim() || null,
        supplier_bill_number: payload?.supplierBillNumber ?? null,
        bill_date: payload?.billDate ?? null,
        due_date: payload?.dueDate ?? null,
        bill_amount: Number(payload?.billAmount ?? 0),
        status: normalizeProjectExpenseStatus(payload?.status ?? 'unpaid'),
        visibility_status: normalizeProjectExpenseVisibility(payload?.visibilityStatus ?? 'internal'),
        created_by: userId,
    };

    const { data, error } = await supabaseAdmin
        .from('project_expenses')
        .insert(expensePayload)
        .select('*, projects!project_id(id, project_number, name, company_id)')
        .single();

    if (error) throw error;
    return {
        ...data,
        project: Array.isArray(data.projects) ? data.projects[0] ?? null : data.projects ?? null,
    };
}

export async function updateProjectExpenseRow(id: string, companyId: string, payload: any) {
    const existing = await getProjectExpenseRowById(id);
    if (!existing) {
        const error: any = new Error('Expense not found.');
        error.statusCode = 404;
        throw error;
    }
    if (existing.project?.company_id !== companyId) {
        const error: any = new Error('This expense belongs to a different company.');
        error.statusCode = 403;
        throw error;
    }

    const updates: Record<string, unknown> = {};
    if (payload.category !== undefined) updates.category = String(payload.category ?? '').trim() || 'General';
    if (payload.categoryId !== undefined || payload.category_id !== undefined) {
        const nextCategoryId = payload.categoryId ?? payload.category_id ?? null;
        await validateExpenseCategoryForCompany(companyId, nextCategoryId);
        updates.category_id = nextCategoryId;
    }
    if (payload.description !== undefined) updates.description = String(payload.description ?? '').trim() || 'Supplier expense';
    if (payload.expenseType !== undefined || payload.expense_type !== undefined) {
        updates.expense_type = normalizeProjectExpenseType(payload.expenseType ?? payload.expense_type);
    }
    if (payload.supplierPartyId !== undefined || payload.supplier_party_id !== undefined) {
        const nextSupplierPartyId = payload.supplierPartyId ?? payload.supplier_party_id ?? null;
        const nextSupplierParty = await validateSupplierPartyForCompany(companyId, nextSupplierPartyId);
        updates.party_id = nextSupplierPartyId;
        if (payload.supplierName === undefined && nextSupplierParty) updates.supplier_name = nextSupplierParty.name ?? null;
    }
    if (payload.supplierId !== undefined || payload.supplier_id !== undefined) {
        const nextSupplierId = payload.supplierId ?? payload.supplier_id ?? null;
        const nextSupplier = await validateSupplierForCompany(companyId, nextSupplierId);
        updates.supplier_id = nextSupplierId;
        if (payload.supplierName === undefined && nextSupplier) updates.supplier_name = nextSupplier.name ?? null;
    }
    if (payload.supplierName !== undefined) updates.supplier_name = payload.supplierName ?? null;
    if (payload.supplierBillNumber !== undefined) updates.supplier_bill_number = payload.supplierBillNumber ?? null;
    if (payload.billDate !== undefined) updates.bill_date = payload.billDate ?? null;
    if (payload.dueDate !== undefined) updates.due_date = payload.dueDate ?? null;
    if (payload.billAmount !== undefined) updates.bill_amount = Number(payload.billAmount ?? 0);
    if (payload.status !== undefined) updates.status = normalizeProjectExpenseStatus(payload.status);
    if (payload.visibilityStatus !== undefined) updates.visibility_status = normalizeProjectExpenseVisibility(payload.visibilityStatus);
    if (payload.projectId !== undefined && payload.projectId) {
        const { data: project } = await supabaseAdmin
            .from('projects')
            .select('id, company_id')
            .eq('id', payload.projectId)
            .eq('company_id', companyId)
            .maybeSingle();
        if (!project) {
            const error: any = new Error('Selected project is not valid for this company.');
            error.statusCode = 400;
            throw error;
        }
        updates.project_id = payload.projectId;
    }

    const { data, error } = await supabaseAdmin
        .from('project_expenses')
        .update(updates)
        .eq('id', id)
        .select('*, projects!project_id(id, project_number, name, company_id)')
        .single();

    if (error) throw error;
    return {
        ...data,
        project: Array.isArray(data.projects) ? data.projects[0] ?? null : data.projects ?? null,
    };
}

export async function voidProjectExpenseRow(id: string, companyId: string) {
    const existing = await getProjectExpenseRowById(id);
    if (!existing) {
        const error: any = new Error('Expense not found.');
        error.statusCode = 404;
        throw error;
    }
    if (existing.project?.company_id !== companyId) {
        const error: any = new Error('This expense belongs to a different company.');
        error.statusCode = 403;
        throw error;
    }
    if (existing.status === 'void' || existing.voided_at) {
        return;
    }

    const { error } = await supabaseAdmin
        .from('project_expenses')
        .update({
            status: 'void',
            voided_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) throw error;
}

export async function listProjectReceiptsForProject(projectId: string, companyId: string) {
    const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('company_id', companyId)
        .maybeSingle();

    if (projectError) throw projectError;
    if (!project) return [];

    const { data, error } = await supabaseAdmin
        .from('project_receipts')
        .select('*')
        .eq('project_id', projectId)
        .order('received_date', { ascending: false });

    if (error) throw error;
    return data ?? [];
}

export async function getProjectReceiptRowById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('project_receipts')
        .select('*, projects!project_id(id, company_id)')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return {
        ...data,
        project: Array.isArray(data.projects) ? data.projects[0] ?? null : data.projects ?? null,
    };
}

export async function createProjectReceiptForProject(projectId: string, companyId: string, payload: any, userId: string) {
    const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id, company_id')
        .eq('id', projectId)
        .eq('company_id', companyId)
        .maybeSingle();

    if (projectError) throw projectError;
    if (!project) {
        const error: any = new Error('Project not found for this company.');
        error.statusCode = 404;
        throw error;
    }

    const receiptPayload = {
        project_id: projectId,
        receipt_number: String(payload?.receiptNumber ?? '').trim() || `RCPT-${Date.now()}`,
        amount: Number(payload?.amount ?? 0),
        received_date: payload?.receivedDate ?? null,
        payment_method_id: payload?.paymentMethodId ?? payload?.payment_method_id ?? null,
        payment_method: normalizeProjectReceiptPaymentMethod(payload?.paymentMethod ?? 'cash'),
        reference_number: payload?.referenceNumber ?? null,
        notes: payload?.notes ?? null,
        visibility_status: normalizeProjectReceiptVisibility(payload?.visibilityStatus ?? 'internal'),
        created_by: userId,
    };

    const { data, error } = await supabaseAdmin
        .from('project_receipts')
        .insert(receiptPayload)
        .select('*')
        .single();

    if (error) throw error;
    return data;
}

export async function updateProjectReceiptRow(id: string, companyId: string, payload: any) {
    const existing = await getProjectReceiptRowById(id);
    if (!existing) {
        const error: any = new Error('Receipt not found.');
        error.statusCode = 404;
        throw error;
    }
    if (existing.project?.company_id !== companyId) {
        const error: any = new Error('This receipt belongs to a different company.');
        error.statusCode = 403;
        throw error;
    }

    const updates: Record<string, unknown> = {};
    if (payload.receiptNumber !== undefined) updates.receipt_number = String(payload.receiptNumber ?? '').trim() || `RCPT-${Date.now()}`;
    if (payload.amount !== undefined) updates.amount = Number(payload.amount ?? 0);
    if (payload.receivedDate !== undefined) updates.received_date = payload.receivedDate ?? null;
    if (payload.paymentMethodId !== undefined || payload.payment_method_id !== undefined) updates.payment_method_id = payload.paymentMethodId ?? payload.payment_method_id ?? null;
    if (payload.paymentMethod !== undefined) updates.payment_method = normalizeProjectReceiptPaymentMethod(payload.paymentMethod);
    if (payload.referenceNumber !== undefined) updates.reference_number = payload.referenceNumber ?? null;
    if (payload.notes !== undefined) updates.notes = payload.notes ?? null;
    if (payload.visibilityStatus !== undefined) updates.visibility_status = normalizeProjectReceiptVisibility(payload.visibilityStatus);
    if (payload.projectId !== undefined && payload.projectId) {
        const { data: project } = await supabaseAdmin
            .from('projects')
            .select('id, company_id')
            .eq('id', payload.projectId)
            .eq('company_id', companyId)
            .maybeSingle();
        if (!project) {
            const error: any = new Error('Selected project is not valid for this company.');
            error.statusCode = 400;
            throw error;
        }
        updates.project_id = payload.projectId;
    }

    const { data, error } = await supabaseAdmin
        .from('project_receipts')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

    if (error) throw error;
    return data;
}

export async function voidProjectReceiptRow(id: string, companyId: string) {
    const existing = await getProjectReceiptRowById(id);
    if (!existing) {
        const error: any = new Error('Receipt not found.');
        error.statusCode = 404;
        throw error;
    }
    if (existing.project?.company_id !== companyId) {
        const error: any = new Error('This receipt belongs to a different company.');
        error.statusCode = 403;
        throw error;
    }

    const { error } = await supabaseAdmin
        .from('project_receipts')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function createProjectFromQuotation(companyId: string, quotationId: string, userId: string) {
    const { data: quotation, error: quotationError } = await supabaseAdmin
        .from('documents')
        .select('*')
        .eq('id', quotationId)
        .eq('company_id', companyId)
        .eq('is_deleted', false)
        .maybeSingle();

    if (quotationError) throw quotationError;
    if (!quotation) {
        const error: any = new Error('Quotation not found.');
        error.statusCode = 404;
        throw error;
    }

    if (quotation.document_type !== 'Quotation') {
        const error: any = new Error('Only quotations can be converted into projects.');
        error.statusCode = 400;
        throw error;
    }

    const { data: existingProject, error: existingProjectError } = await supabaseAdmin
        .from('projects')
        .select('id, source_document_id')
        .eq('company_id', companyId)
        .eq('source_document_id', quotationId)
        .maybeSingle();

    if (existingProjectError) throw existingProjectError;

    const conversionCheck = canConvertQuotationToProject(existingProject, quotation.status);
    if (!conversionCheck.allowed) {
        const error: any = new Error(conversionCheck.reason ?? 'Only accepted quotations can be converted into projects.');
        error.statusCode = quotation.status !== 'ACCEPTED' ? 400 : 409;
        throw error;
    }

    const projectNumber = await generateProjectNumber(companyId);
    const projectPayload = buildProjectPayloadFromQuotation(
        quotation,
        companyId,
        quotation.customer_id ?? null,
        projectNumber,
    );

    return createProjectForCompany(companyId, projectPayload, userId);
}

export type ProjectUnitShareType = 'builder' | 'landowner';
export type ProjectUnitStatus = 'available' | 'allocated' | 'booked';

function normalizeProjectUnitShareType(value: unknown): ProjectUnitShareType | null {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (normalized === 'builder') return 'builder';
    if (normalized === 'landowner') return 'landowner';
    return null;
}

function normalizeProjectUnitStatus(value: unknown): ProjectUnitStatus {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (normalized === 'allocated') return 'allocated';
    if (normalized === 'booked') return 'booked';
    return 'available';
}

function validateProjectUnitStatusForShareType(shareType: ProjectUnitShareType | null, status: ProjectUnitStatus) {
    if (shareType === 'landowner' && status === 'available') {
        const error: any = new Error('Landowner units must be allocated or booked; available is not allowed.');
        error.statusCode = 400;
        throw error;
    }

    if (status === 'booked') {
        const error: any = new Error('Manual booking is not allowed here. Booking status is reserved for the booking workflow.');
        error.statusCode = 400;
        throw error;
    }
}

function buildProjectUnitSummary(units: Array<{ share_type?: string | null; status?: string | null }>, project?: any) {
    const total = units.length;
    const builder = units.filter((row) => row.share_type === 'builder').length;
    const landowner = units.filter((row) => row.share_type === 'landowner').length;
    const available = units.filter((row) => row.status === 'available').length;
    const allocated = units.filter((row) => row.status === 'allocated').length;
    const booked = units.filter((row) => row.status === 'booked').length;
    const registered = total;

    const totalProjectFlats = Number(project?.total_project_flats ?? 0);
    const builderTarget = Number(project?.builder_share_units ?? 0);
    const landownerTarget = Number(project?.landowner_share_units ?? 0);
    const completionBase = totalProjectFlats > 0 ? totalProjectFlats : Math.max(builderTarget + landownerTarget, total);
    const completionPercent = completionBase > 0 ? Math.min(100, Math.round((total / completionBase) * 100)) : 0;

    return {
        total,
        builder,
        landowner,
        registered,
        available,
        allocated,
        booked,
        completionPercent,
        isComplete: totalProjectFlats > 0
            ? total === totalProjectFlats && builder === builderTarget && landowner === landownerTarget
            : total > 0,
    };
}

function assertProjectUnitCountsWithinProject(project: any, rows: Array<{ share_type?: string | null; status?: string | null; id?: string; flat_no?: string | null }>) {
    if (!project || project.business_model !== 'property_development') {
        const error: any = new Error('Inventory is only supported for property development projects.');
        error.statusCode = 400;
        throw error;
    }

    if (rows.some((row) => row.share_type === 'landowner' && row.status === 'available')) {
        const error: any = new Error('Landowner units must be allocated or booked; available is not allowed.');
        error.statusCode = 400;
        throw error;
    }

    if (project.development_arrangement === 'self') {
        if (rows.some((row) => row.share_type === 'landowner')) {
            const error: any = new Error('Self development inventory must use builder share type only.');
            error.statusCode = 400;
            throw error;
        }
        return;
    }

    const totalProjectFlats = Number(project.total_project_flats ?? 0);
    const builderShareUnits = Number(project.builder_share_units ?? 0);
    const landownerShareUnits = Number(project.landowner_share_units ?? 0);

    if (!project.development_arrangement || project.development_arrangement !== 'joint_development') {
        return;
    }

    if (!Number.isFinite(totalProjectFlats) || totalProjectFlats <= 0) {
        const error: any = new Error('Joint development projects require total_project_flats before inventory can be created.');
        error.statusCode = 400;
        throw error;
    }

    const builderCount = rows.filter((row) => row.share_type === 'builder').length;
    const landownerCount = rows.filter((row) => row.share_type === 'landowner').length;
    const totalCount = rows.length;

    if (totalCount > totalProjectFlats) {
        const error: any = new Error('Inventory cannot exceed the agreed total project flats.');
        error.statusCode = 400;
        throw error;
    }
    if (builderCount > builderShareUnits || landownerCount > landownerShareUnits) {
        const error: any = new Error('Inventory exceeds the agreed builder or landowner allocation counts.');
        error.statusCode = 400;
        throw error;
    }
    if (builderCount + landownerCount !== totalCount) {
        const error: any = new Error('Inventory count does not match the registered builder and landowner allocations.');
        error.statusCode = 400;
        throw error;
    }
    if (builderCount === builderShareUnits && landownerCount === landownerShareUnits && totalCount !== totalProjectFlats) {
        const error: any = new Error('Inventory is complete only when both share counts exactly match the project allocation totals.');
        error.statusCode = 400;
        throw error;
    }
    if (totalCount === totalProjectFlats && (builderCount !== builderShareUnits || landownerCount !== landownerShareUnits)) {
        const error: any = new Error('Inventory is incomplete or inconsistent with the project allocation counts.');
        error.statusCode = 400;
        throw error;
    }
}

export async function listProjectUnitsForProject(projectId: string, companyId: string) {
    const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id, company_id, business_model, development_arrangement, total_project_flats, builder_share_units, landowner_share_units')
        .eq('id', projectId)
        .eq('company_id', companyId)
        .maybeSingle();

    if (projectError) throw projectError;
    if (!project) {
        return { units: [], summary: buildProjectUnitSummary([]) };
    }

    if (project.business_model !== 'property_development') {
        const error: any = new Error('Inventory is only supported for property development projects.');
        error.statusCode = 400;
        throw error;
    }

    const { data, error } = await supabaseAdmin
        .from('project_units')
        .select('*')
        .eq('project_id', projectId)
        .eq('company_id', companyId)
        .order('block_tower', { ascending: true })
        .order('floor', { ascending: true })
        .order('flat_no', { ascending: true });

    if (error) throw error;
    const units = data ?? [];
    assertProjectUnitCountsWithinProject(project, units);

    return {
        units,
        summary: buildProjectUnitSummary(units, project),
    };
}

export async function getProjectUnitRowById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('project_units')
        .select('*, projects!project_id(id, company_id, business_model, development_arrangement, total_project_flats, builder_share_units, landowner_share_units)')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return {
        ...data,
        project: Array.isArray(data.projects) ? data.projects[0] ?? null : data.projects ?? null,
    };
}

export async function createProjectUnitForProject(projectId: string, companyId: string, payload: any) {
    const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id, company_id, business_model, development_arrangement, total_project_flats, builder_share_units, landowner_share_units')
        .eq('id', projectId)
        .eq('company_id', companyId)
        .maybeSingle();

    if (projectError) throw projectError;
    if (!project) {
        const error: any = new Error('Project not found for this company.');
        error.statusCode = 404;
        throw error;
    }

    if (project.business_model !== 'property_development') {
        const error: any = new Error('Project flat inventory is only supported for property development projects.');
        error.statusCode = 400;
        throw error;
    }

    const flatNo = String(payload?.flatNo ?? payload?.flat_no ?? '').trim();
    if (!flatNo) {
        const error: any = new Error('Flat number is required.');
        error.statusCode = 400;
        throw error;
    }

    const shareType = normalizeProjectUnitShareType(payload?.shareType ?? payload?.share_type);
    if (!shareType) {
        const error: any = new Error('Share type must be builder or landowner.');
        error.statusCode = 400;
        throw error;
    }

    if (project.development_arrangement === 'self' && shareType !== 'builder') {
        const error: any = new Error('Self development inventory must be assigned to builder share type only.');
        error.statusCode = 400;
        throw error;
    }

    const requestedStatus = normalizeProjectUnitStatus(payload?.status ?? 'available');
    validateProjectUnitStatusForShareType(shareType, requestedStatus);

    const { data: existingUnits, error: existingUnitsError } = await supabaseAdmin
        .from('project_units')
        .select('id, flat_no, share_type, status')
        .eq('project_id', projectId)
        .eq('company_id', companyId)
        .order('flat_no', { ascending: true });

    if (existingUnitsError) throw existingUnitsError;

    const duplicate = (existingUnits ?? []).some((row) => String(row.flat_no ?? '').trim().toLowerCase() === flatNo.toLowerCase());
    if (duplicate) {
        const error: any = new Error('This flat number already exists for this project.');
        error.statusCode = 409;
        throw error;
    }

    const nextUnits = [
        ...(existingUnits ?? []).map((row) => ({
            id: row.id,
            share_type: row.share_type,
            status: row.status,
            flat_no: row.flat_no,
        })),
        {
            id: 'new',
            share_type: shareType,
            status: normalizeProjectUnitStatus(payload?.status ?? 'available'),
            flat_no: flatNo,
        },
    ];
    assertProjectUnitCountsWithinProject(project, nextUnits);

    const projectUnitPayload = {
        company_id: companyId,
        project_id: projectId,
        flat_no: flatNo,
        floor: payload?.floor == null || payload?.floor === '' ? null : Number(payload?.floor),
        block_tower: payload?.blockTower ?? payload?.block_tower ?? null,
        share_type: shareType,
        status: requestedStatus,
    };

    const { data, error } = await supabaseAdmin
        .from('project_units')
        .insert(projectUnitPayload)
        .select('*')
        .single();

    if (error) throw error;
    return data;
}

export async function updateProjectUnitRow(id: string, companyId: string, payload: any) {
    const existing = await getProjectUnitRowById(id);
    if (!existing) {
        const error: any = new Error('Project unit not found.');
        error.statusCode = 404;
        throw error;
    }
    if (existing.project?.company_id !== companyId) {
        const error: any = new Error('This project unit belongs to a different company.');
        error.statusCode = 403;
        throw error;
    }

    const project = existing.project;
    const { data: projectUnits, error: projectUnitsError } = await supabaseAdmin
        .from('project_units')
        .select('id, flat_no, share_type, status')
        .eq('project_id', existing.project_id)
        .eq('company_id', companyId)
        .neq('id', id)
        .order('flat_no', { ascending: true });

    if (projectUnitsError) throw projectUnitsError;

    const nextFlatNo = payload.flatNo ?? payload.flat_no ?? existing.flat_no ?? '';
    const normalizedFlatNo = String(nextFlatNo).trim();
    if (!normalizedFlatNo) {
        const error: any = new Error('Flat number is required.');
        error.statusCode = 400;
        throw error;
    }

    const duplicate = (projectUnits ?? []).some((row) => String(row.flat_no ?? '').trim().toLowerCase() === normalizedFlatNo.toLowerCase());
    if (duplicate) {
        const error: any = new Error('This flat number already exists for this project.');
        error.statusCode = 409;
        throw error;
    }

    const nextShareType = normalizeProjectUnitShareType(payload.shareType ?? payload.share_type ?? existing.share_type);
    if (!nextShareType) {
        const error: any = new Error('Share type must be builder or landowner.');
        error.statusCode = 400;
        throw error;
    }
    if (project?.business_model !== 'property_development') {
        const error: any = new Error('Project flat inventory is only supported for property development projects.');
        error.statusCode = 400;
        throw error;
    }
    if (project?.development_arrangement === 'self' && nextShareType !== 'builder') {
        const error: any = new Error('Self development inventory must be assigned to builder share type only.');
        error.statusCode = 400;
        throw error;
    }

    const nextStatus = normalizeProjectUnitStatus(payload.status ?? existing.status);
    validateProjectUnitStatusForShareType(nextShareType, nextStatus);

    const candidateUnits = [
        ...(projectUnits ?? []).map((row) => ({
            id: row.id,
            share_type: row.share_type,
            status: row.status,
            flat_no: row.flat_no,
        })),
        {
            id: 'updated',
            share_type: nextShareType,
            status: nextStatus,
            flat_no: normalizedFlatNo,
        },
    ];
    assertProjectUnitCountsWithinProject(project, candidateUnits);

    const updates: Record<string, unknown> = {};
    if (payload.flatNo !== undefined || payload.flat_no !== undefined) updates.flat_no = normalizedFlatNo;
    if (payload.floor !== undefined || payload.floor === null) updates.floor = payload.floor == null || payload.floor === '' ? null : Number(payload.floor);
    if (payload.blockTower !== undefined || payload.block_tower !== undefined) updates.block_tower = payload.blockTower ?? payload.block_tower ?? null;
    if (payload.shareType !== undefined || payload.share_type !== undefined) updates.share_type = nextShareType;
    if (payload.status !== undefined) updates.status = nextStatus;

    const { data, error } = await supabaseAdmin
        .from('project_units')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

    if (error) throw error;
    return data;
}

export async function deleteProjectUnitRow(id: string, companyId: string) {
    const existing = await getProjectUnitRowById(id);
    if (!existing) {
        const error: any = new Error('Project unit not found.');
        error.statusCode = 404;
        throw error;
    }
    if (existing.project?.company_id !== companyId) {
        const error: any = new Error('This project unit belongs to a different company.');
        error.statusCode = 403;
        throw error;
    }
    if (existing.project?.business_model !== 'property_development') {
        const error: any = new Error('Project flat inventory is only supported for property development projects.');
        error.statusCode = 400;
        throw error;
    }

    if (existing.status !== 'available') {
        const error: any = new Error('This unit cannot be deleted because it has a historical or allocation state and is protected from removal.');
        error.statusCode = 400;
        throw error;
    }

    const { error } = await supabaseAdmin.from('project_units').delete().eq('id', id);
    if (error) throw error;
    return true;
}

export async function listProjectStagesForProject(projectId: string, companyId: string) {
    const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('company_id', companyId)
        .maybeSingle();

    if (projectError) throw projectError;
    if (!project) return [];

    const { data, error } = await supabaseAdmin
        .from('project_stages')
        .select('*')
        .eq('project_id', projectId)
        .order('sequence_number', { ascending: true });

    if (error) throw error;
    return data ?? [];
}

export async function getProjectStageRowById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('project_stages')
        .select('*, projects!project_id(id, company_id)')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return {
        ...data,
        project: Array.isArray(data.projects) ? data.projects[0] ?? null : data.projects ?? null,
    };
}

export async function createProjectStageForProject(projectId: string, companyId: string, payload: any, userId: string) {
    const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id, company_id')
        .eq('id', projectId)
        .eq('company_id', companyId)
        .maybeSingle();

    if (projectError) throw projectError;
    if (!project) {
        const error: any = new Error('Project not found for this company.');
        error.statusCode = 404;
        throw error;
    }

    const { data: existingStages, error: existingStagesError } = await supabaseAdmin
        .from('project_stages')
        .select('sequence_number')
        .eq('project_id', projectId)
        .order('sequence_number', { ascending: false })
        .limit(1);

    if (existingStagesError) throw existingStagesError;

    const nextSequence = existingStages && existingStages.length > 0 ? Number(existingStages[0].sequence_number ?? 1) + 1 : 1;

    const stagePayload = {
        project_id: projectId,
        name: String(payload?.name ?? '').trim() || 'New stage',
        sequence_number: Number(payload?.sequenceNumber ?? nextSequence),
        planned_start_date: payload?.plannedStartDate ?? null,
        planned_end_date: payload?.plannedEndDate ?? null,
        actual_start_date: payload?.actualStartDate ?? null,
        actual_end_date: payload?.actualEndDate ?? null,
        completion_percentage: Number(payload?.completionPercentage ?? 0),
        status: normalizeProjectStageStatus(payload?.status ?? 'pending'),
        created_by: userId,
    };

    const { data, error } = await supabaseAdmin
        .from('project_stages')
        .insert(stagePayload)
        .select('*')
        .single();

    if (error) throw error;
    return data;
}

export async function updateProjectStageRow(id: string, companyId: string, payload: any) {
    const existing = await getProjectStageRowById(id);
    if (!existing) {
        const error: any = new Error('Stage not found.');
        error.statusCode = 404;
        throw error;
    }
    if (existing.project?.company_id !== companyId) {
        const error: any = new Error('This stage belongs to a different company.');
        error.statusCode = 403;
        throw error;
    }

    const updates: Record<string, unknown> = {};
    if (payload.name !== undefined) updates.name = String(payload.name ?? '').trim() || 'New stage';
    if (payload.sequenceNumber !== undefined) updates.sequence_number = Number(payload.sequenceNumber ?? 1);
    if (payload.plannedStartDate !== undefined) updates.planned_start_date = payload.plannedStartDate ?? null;
    if (payload.plannedEndDate !== undefined) updates.planned_end_date = payload.plannedEndDate ?? null;
    if (payload.actualStartDate !== undefined) updates.actual_start_date = payload.actualStartDate ?? null;
    if (payload.actualEndDate !== undefined) updates.actual_end_date = payload.actualEndDate ?? null;
    if (payload.completionPercentage !== undefined) updates.completion_percentage = Number(payload.completionPercentage ?? 0);
    if (payload.status !== undefined) updates.status = normalizeProjectStageStatus(payload.status);

    const { data, error } = await supabaseAdmin
        .from('project_stages')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

    if (error) throw error;
    return data;
}

export async function deleteProjectStageRow(id: string, companyId: string) {
    const existing = await getProjectStageRowById(id);
    if (!existing) {
        const error: any = new Error('Stage not found.');
        error.statusCode = 404;
        throw error;
    }
    if (existing.project?.company_id !== companyId) {
        const error: any = new Error('This stage belongs to a different company.');
        error.statusCode = 403;
        throw error;
    }

    const { error } = await supabaseAdmin.from('project_stages').delete().eq('id', id);
    if (error) throw error;
}

export async function listProjectProgressUpdatesForProject(projectId: string, companyId: string) {
    const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('company_id', companyId)
        .maybeSingle();

    if (projectError) throw projectError;
    if (!project) return [];

    const { data, error } = await supabaseAdmin
        .from('project_progress_updates')
        .select('*, project_stages(name)')
        .eq('project_id', projectId)
        .order('update_date', { ascending: false });

    if (error) throw error;
    return data ?? [];
}

export async function getProjectProgressUpdateRowById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('project_progress_updates')
        .select('*, project_stages(name), projects!project_id(id, company_id)')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return {
        ...data,
        stage: Array.isArray(data.project_stages) ? data.project_stages[0] ?? null : data.project_stages ?? null,
        project: Array.isArray(data.projects) ? data.projects[0] ?? null : data.projects ?? null,
    };
}

export async function createProjectProgressUpdateForProject(projectId: string, companyId: string, payload: any, userId: string) {
    const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id, company_id')
        .eq('id', projectId)
        .eq('company_id', companyId)
        .maybeSingle();

    if (projectError) throw projectError;
    if (!project) {
        const error: any = new Error('Project not found for this company.');
        error.statusCode = 404;
        throw error;
    }

    if (payload?.stageId) {
        const { data: stage, error: stageError } = await supabaseAdmin
            .from('project_stages')
            .select('id, project_id')
            .eq('id', payload.stageId)
            .eq('project_id', projectId)
            .maybeSingle();

        if (stageError) throw stageError;
        if (!stage) {
            const error: any = new Error('Selected stage is not valid for this project.');
            error.statusCode = 400;
            throw error;
        }
    }

    const updatePayload = {
        project_id: projectId,
        stage_id: payload?.stageId ?? null,
        title: String(payload?.title ?? '').trim() || 'Site update',
        description: payload?.description ?? null,
        progress_percentage: payload?.progressPercentage !== undefined ? Number(payload.progressPercentage ?? 0) : null,
        update_date: payload?.updateDate ?? new Date().toISOString().slice(0, 10),
        visibility_status: normalizeProjectProgressVisibility(payload?.visibilityStatus ?? 'draft'),
        created_by: userId,
    };

    const { data, error } = await supabaseAdmin
        .from('project_progress_updates')
        .insert(updatePayload)
        .select('*, project_stages(name)')
        .single();

    if (error) throw error;
    return data;
}

export async function updateProjectProgressUpdateRow(id: string, companyId: string, payload: any) {
    const existing = await getProjectProgressUpdateRowById(id);
    if (!existing) {
        const error: any = new Error('Progress update not found.');
        error.statusCode = 404;
        throw error;
    }
    if (existing.project?.company_id !== companyId) {
        const error: any = new Error('This update belongs to a different company.');
        error.statusCode = 403;
        throw error;
    }

    const updates: Record<string, unknown> = {};
    if (payload.title !== undefined) updates.title = String(payload.title ?? '').trim() || 'Site update';
    if (payload.description !== undefined) updates.description = payload.description ?? null;
    if (payload.progressPercentage !== undefined) updates.progress_percentage = payload.progressPercentage !== null ? Number(payload.progressPercentage ?? 0) : null;
    if (payload.updateDate !== undefined) updates.update_date = payload.updateDate ?? new Date().toISOString().slice(0, 10);
    if (payload.visibilityStatus !== undefined) updates.visibility_status = normalizeProjectProgressVisibility(payload.visibilityStatus);
    if (payload.stageId !== undefined) {
        const stageId = payload.stageId ?? null;
        if (stageId) {
            const { data: stage, error: stageError } = await supabaseAdmin
                .from('project_stages')
                .select('id, project_id')
                .eq('id', stageId)
                .eq('project_id', existing.project_id)
                .maybeSingle();
            if (stageError) throw stageError;
            if (!stage) {
                const error: any = new Error('Selected stage is not valid for this project.');
                error.statusCode = 400;
                throw error;
            }
        }
        updates.stage_id = stageId;
    }

    const { data, error } = await supabaseAdmin
        .from('project_progress_updates')
        .update(updates)
        .eq('id', id)
        .select('*, project_stages(name)')
        .single();

    if (error) throw error;
    return data;
}

export async function deleteProjectProgressUpdateRow(id: string, companyId: string) {
    const existing = await getProjectProgressUpdateRowById(id);
    if (!existing) {
        const error: any = new Error('Progress update not found.');
        error.statusCode = 404;
        throw error;
    }
    if (existing.project?.company_id !== companyId) {
        const error: any = new Error('This update belongs to a different company.');
        error.statusCode = 403;
        throw error;
    }

    const { error } = await supabaseAdmin.from('project_progress_updates').delete().eq('id', id);
    if (error) throw error;
}

async function recomputeExpenseStatus(expenseId: string): Promise<void> {
    const { data: expense, error: expenseError } = await supabaseAdmin
        .from('project_expenses')
        .select('id, bill_amount, status, voided_at')
        .eq('id', expenseId)
        .maybeSingle();
    if (expenseError) throw expenseError;
    if (!expense) return;
    if (expense.voided_at || expense.status === 'void') {
        const { error: preserveError } = await supabaseAdmin
            .from('project_expenses')
            .update({ status: 'void', updated_at: new Date().toISOString() })
            .eq('id', expenseId);
        if (preserveError) throw preserveError;
        return;
    }

    const { data: payments, error: paymentError } = await supabaseAdmin
        .from('project_expense_payments')
        .select('amount, voided_at')
        .eq('project_expense_id', expenseId);
    if (paymentError) throw paymentError;

    const paid = (payments ?? [])
        .filter((row: any) => !row.voided_at)
        .reduce((sum: number, row: any) => sum + Number(row.amount ?? 0), 0);
    const billAmount = Number(expense.bill_amount ?? 0);

    const nextStatus: ProjectExpenseStatus =
        paid <= 0 ? 'unpaid' : paid + 0.0001 >= billAmount ? 'paid' : 'partially_paid';

    const { error: updateError } = await supabaseAdmin
        .from('project_expenses')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', expenseId);
    if (updateError) throw updateError;
}

export async function listProjectExpensePaymentsForExpense(expenseId: string, companyId: string) {
    const expense = await getProjectExpenseRowById(expenseId);
    if (!expense) return [];
    if (expense.project?.company_id !== companyId) return [];

    const { data, error } = await supabaseAdmin
        .from('project_expense_payments')
        .select('*')
        .eq('project_expense_id', expenseId)
        .order('payment_date', { ascending: false });
    if (error) throw error;
    return data ?? [];
}

export async function getProjectExpensePaymentRowById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('project_expense_payments')
        .select('*, project_expenses!project_expense_id(id, project_id, projects!project_id(id, company_id))')
        .eq('id', id)
        .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const expense = Array.isArray(data.project_expenses) ? data.project_expenses[0] ?? null : data.project_expenses ?? null;
    const project = Array.isArray(expense?.projects) ? expense.projects[0] ?? null : expense?.projects ?? null;
    return { ...data, expense, project };
}

export async function createProjectExpensePaymentForExpense(expenseId: string, companyId: string, payload: any, userId: string) {
    const expense = await getProjectExpenseRowById(expenseId);
    if (!expense) {
        const error: any = new Error('Supplier bill not found.');
        error.statusCode = 404;
        throw error;
    }
    if (expense.project?.company_id !== companyId) {
        const error: any = new Error('This supplier bill belongs to a different company.');
        error.statusCode = 403;
        throw error;
    }
    if (expense.status === 'void' || expense.voided_at) {
        const error: any = new Error('Payments cannot be recorded for a void supplier bill.');
        error.statusCode = 400;
        throw error;
    }

    const amount = Number(payload?.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
        const error: any = new Error('Payment amount must be greater than zero.');
        error.statusCode = 400;
        throw error;
    }

    const outstanding = await getProjectExpenseOutstandingAmount(expenseId);
    if (amount > outstanding + 0.0001) {
        const error: any = new Error('Payment amount exceeds the outstanding bill balance.');
        error.statusCode = 400;
        throw error;
    }

    const paymentMethodId = payload?.paymentMethodId ?? payload?.payment_method_id ?? null;
    const paymentMethod = await validatePaymentMethodForCompany(companyId, paymentMethodId, payload?.paymentMethod ?? 'cash');

    const { data, error } = await supabaseAdmin
        .from('project_expense_payments')
        .insert({
            project_expense_id: expenseId,
            company_id: companyId,
            amount,
            payment_date: payload?.paymentDate ?? null,
            payment_method_id: paymentMethodId,
            payment_method: paymentMethod,
            reference_number: payload?.referenceNumber ?? null,
            notes: payload?.notes ?? null,
            created_by: userId,
        })
        .select('*')
        .single();
    if (error) throw error;

    await recomputeExpenseStatus(expenseId);
    return data;
}

export async function updateProjectExpensePaymentRow(id: string, companyId: string, payload: any) {
    const existing = await getProjectExpensePaymentRowById(id);
    if (!existing) {
        const error: any = new Error('Supplier payment not found.');
        error.statusCode = 404;
        throw error;
    }
    if (existing.project?.company_id !== companyId) {
        const error: any = new Error('This supplier payment belongs to a different company.');
        error.statusCode = 403;
        throw error;
    }

    const updates: Record<string, unknown> = {};
    if (payload.amount !== undefined) {
        const amount = Number(payload.amount ?? 0);
        if (!Number.isFinite(amount) || amount <= 0) {
            const error: any = new Error('Payment amount must be greater than zero.');
            error.statusCode = 400;
            throw error;
        }

        const otherPayments = await supabaseAdmin
            .from('project_expense_payments')
            .select('amount, voided_at')
            .eq('project_expense_id', existing.project_expense_id)
            .neq('id', id);

        if (otherPayments.error) throw otherPayments.error;

        const otherPaid = (otherPayments.data ?? [])
            .filter((row: any) => !row.voided_at)
            .reduce((sum: number, row: any) => sum + Number(row.amount ?? 0), 0);
        const billAmount = Number((await getProjectExpenseRowById(existing.project_expense_id))?.bill_amount ?? 0);
        const maxAllowed = Math.max(0, billAmount - otherPaid);

        if (amount > maxAllowed + 0.0001) {
            const error: any = new Error('Updated payment exceeds the outstanding bill balance.');
            error.statusCode = 400;
            throw error;
        }
        updates.amount = amount;
    }
    if (payload.paymentDate !== undefined) updates.payment_date = payload.paymentDate ?? null;
    if (payload.paymentMethodId !== undefined || payload.payment_method_id !== undefined) {
        updates.payment_method_id = payload.paymentMethodId ?? payload.payment_method_id ?? null;
    }
    if (payload.paymentMethod !== undefined) {
        const paymentMethodId = updates.payment_method_id ?? existing.payment_method_id ?? null;
        updates.payment_method = await validatePaymentMethodForCompany(companyId, paymentMethodId, payload.paymentMethod);
    }
    if (payload.referenceNumber !== undefined) updates.reference_number = payload.referenceNumber ?? null;
    if (payload.notes !== undefined) updates.notes = payload.notes ?? null;

    const { data, error } = await supabaseAdmin
        .from('project_expense_payments')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
    if (error) throw error;

    await recomputeExpenseStatus(existing.project_expense_id);
    return data;
}

export async function voidProjectExpensePaymentRow(id: string, companyId: string) {
    const existing = await getProjectExpensePaymentRowById(id);
    if (!existing) {
        const error: any = new Error('Supplier payment not found.');
        error.statusCode = 404;
        throw error;
    }
    if (existing.project?.company_id !== companyId) {
        const error: any = new Error('This supplier payment belongs to a different company.');
        error.statusCode = 403;
        throw error;
    }
    if (existing.voided_at) {
        return;
    }

    const { error } = await supabaseAdmin
        .from('project_expense_payments')
        .update({
            voided_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    if (error) throw error;

    await recomputeExpenseStatus(existing.project_expense_id);
}

export async function listProjectInvestorsForProject(projectId: string, companyId: string) {
    const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('company_id', companyId)
        .maybeSingle();
    if (projectError) throw projectError;
    if (!project) return [];

    const { data, error } = await supabaseAdmin
        .from('project_investors')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
}

export async function getProjectInvestorRowById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('project_investors')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    let project: any = null;
    if (data.project_id) {
        const { data: projectRow, error: projectError } = await supabaseAdmin
            .from('projects')
            .select('id, company_id')
            .eq('id', data.project_id)
            .maybeSingle();
        if (projectError) throw projectError;
        project = projectRow ?? null;
    }

    return { ...data, project };
}

export async function getProjectInvestorCompanyIdById(id: string): Promise<string | null> {
    const { data, error } = await supabaseAdmin
        .from('project_investors')
        .select('company_id')
        .eq('id', id)
        .maybeSingle();
    if (error) throw error;
    return data?.company_id ?? null;
}

async function ensureInvestorMasterForCompany(companyId: string, payload: { name: string; email: string | null; phone: string | null }) {
    const normalizedName = String(payload.name ?? '').trim() || 'Investor';
    const normalizedEmail = payload.email ? String(payload.email).trim().toLowerCase() : null;
    const normalizedPhone = payload.phone ? String(payload.phone).trim() : null;

    let query = supabaseAdmin
        .from('investors')
        .select('id, company_id, name, email, phone')
        .eq('company_id', companyId);

    if (normalizedEmail) {
        query = query.eq('email', normalizedEmail);
    } else if (normalizedPhone) {
        query = query.eq('phone', normalizedPhone).eq('name', normalizedName);
    } else {
        query = query.eq('name', normalizedName);
    }

    const { data: existingRows, error: existingError } = await query.limit(1);
    if (existingError) throw existingError;
    const existing = existingRows?.[0] ?? null;
    if (existing?.id) return existing.id as string;

    const { data: created, error: createError } = await supabaseAdmin
        .from('investors')
        .insert({
            company_id: companyId,
            name: normalizedName,
            email: normalizedEmail,
            phone: normalizedPhone,
        })
        .select('id')
        .single();

    if (createError) throw createError;
    return String(created.id);
}

export async function createProjectInvestorForProject(projectId: string, companyId: string, payload: any, userId: string) {
    const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id, company_id')
        .eq('id', projectId)
        .eq('company_id', companyId)
        .maybeSingle();
    if (projectError) throw projectError;
    if (!project) {
        const error: any = new Error('Project not found for this company.');
        error.statusCode = 404;
        throw error;
    }

    const partyId = payload?.partyId ?? payload?.party_id ?? null;
    if (partyId) {
        const { data: party, error: partyError } = await supabaseAdmin
            .from('parties')
            .select('id, company_id, is_investor, is_active, is_deleted')
            .eq('id', partyId)
            .eq('company_id', companyId)
            .maybeSingle();

        if (partyError) throw partyError;
        if (!party) {
            const error: any = new Error('Selected investor contact was not found for this company.');
            error.statusCode = 404;
            throw error;
        }
        if (party.is_deleted || !party.is_active || !party.is_investor) {
            const error: any = new Error('Selected investor contact must be an active investor contact for this company.');
            error.statusCode = 400;
            throw error;
        }

        const { data: existingPartyInvestor, error: existingPartyInvestorError } = await supabaseAdmin
            .from('project_investors')
            .select('id, is_active')
            .eq('project_id', projectId)
            .eq('company_id', companyId)
            .eq('party_id', partyId)
            .maybeSingle();

        if (existingPartyInvestorError) throw existingPartyInvestorError;
        if (existingPartyInvestor && existingPartyInvestor.is_active) {
            const error: any = new Error('This investor contact is already attached to this project.');
            error.statusCode = 409;
            throw error;
        }
    }

    const name = String(payload?.name ?? '').trim();
    const email = payload?.email ? String(payload.email).trim().toLowerCase() : null;
    const phone = payload?.phone ? String(payload.phone).trim() : null;
    const normalizedUserId = payload?.userId ?? null;
    const isPartyLinkedInvestor = Boolean(partyId);

    // Project-finance investor linking (party-based) must not require an app account.
    // Access-oriented flows can still provide userId/email and rely on account checks.
    if (email && !isPartyLinkedInvestor) {
        const existingUser = await ensureExternalUserAccount(email, 'investor');
        const { data: existingInvestor, error: investorLookupError } = await supabaseAdmin
            .from('project_investors')
            .select('*')
            .eq('project_id', projectId)
            .eq('company_id', companyId)
            .or(`email.eq.${email},user_id.eq.${existingUser.id}`)
            .maybeSingle();

        if (investorLookupError) throw investorLookupError;
        if (existingInvestor) {
            if (existingInvestor.is_active) {
                const error: any = new Error('This investor already has access to this project.');
                error.statusCode = 409;
                throw error;
            }

            const { data: updated, error: reactivateError } = await supabaseAdmin
                .from('project_investors')
                .update({
                    user_id: existingUser.id,
                    name,
                    email,
                    phone,
                    investment_percentage: payload?.investmentPercentage !== undefined ? Number(payload.investmentPercentage ?? 0) : existingInvestor.investment_percentage,
                    can_view_financials: Boolean(payload?.canViewFinancials ?? existingInvestor.can_view_financials),
                    can_approve_payments: Boolean(payload?.canApprovePayments ?? existingInvestor.can_approve_payments),
                    can_view_client_receipts: Boolean(payload?.canViewClientReceipts ?? existingInvestor.can_view_client_receipts),
                    is_active: true,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existingInvestor.id)
                .select('*')
                .single();

            if (reactivateError) throw reactivateError;
            return updated;
        }
    }

    const investorMasterId = await ensureInvestorMasterForCompany(companyId, {
        name,
        email,
        phone,
    });

    const { data, error } = await supabaseAdmin
        .from('project_investors')
        .insert({
            project_id: projectId,
            company_id: companyId,
            investor_id: investorMasterId,
            user_id: normalizedUserId,
            party_id: partyId || null,
            name,
            email,
            phone,
            investment_percentage: payload?.investmentPercentage !== undefined ? Number(payload.investmentPercentage ?? 0) : null,
            can_view_financials: Boolean(payload?.canViewFinancials),
            can_approve_payments: Boolean(payload?.canApprovePayments),
            can_view_client_receipts: Boolean(payload?.canViewClientReceipts),
            is_active: payload?.isActive !== undefined ? Boolean(payload.isActive) : true,
            created_by: userId,
        })
        .select('*')
        .single();
    if (error) throw error;
    return data;
}

export async function updateProjectInvestorRow(id: string, companyId: string, payload: any) {
    const existing = await getProjectInvestorRowById(id);
    if (!existing) {
        const error: any = new Error('Investor not found.');
        error.statusCode = 404;
        throw error;
    }
    if (existing.project?.company_id !== companyId) {
        const error: any = new Error('This investor belongs to a different company.');
        error.statusCode = 403;
        throw error;
    }

    const updates: Record<string, unknown> = {};
    const nextPartyId = payload?.partyId ?? payload?.party_id;
    if (payload.name !== undefined) updates.name = String(payload.name ?? '').trim();
    if (payload.email !== undefined) updates.email = payload.email ?? null;
    if (payload.phone !== undefined) updates.phone = payload.phone ?? null;
    if (payload.userId !== undefined) updates.user_id = payload.userId ?? null;
    if (nextPartyId !== undefined) {
        const normalizedPartyId = nextPartyId ? String(nextPartyId) : null;
        if (normalizedPartyId) {
            const { data: party, error: partyError } = await supabaseAdmin
                .from('parties')
                .select('id, company_id, is_investor, is_active, is_deleted')
                .eq('id', normalizedPartyId)
                .eq('company_id', companyId)
                .maybeSingle();

            if (partyError) throw partyError;
            if (!party) {
                const error: any = new Error('Selected investor contact was not found for this company.');
                error.statusCode = 404;
                throw error;
            }
            if (party.is_deleted || !party.is_active || !party.is_investor) {
                const error: any = new Error('Selected investor contact must be an active investor contact for this company.');
                error.statusCode = 400;
                throw error;
            }

            const { data: existingPartyInvestor, error: existingPartyInvestorError } = await supabaseAdmin
                .from('project_investors')
                .select('id')
                .eq('project_id', existing.project_id)
                .eq('company_id', companyId)
                .eq('party_id', normalizedPartyId)
                .neq('id', id)
                .maybeSingle();

            if (existingPartyInvestorError) throw existingPartyInvestorError;
            if (existingPartyInvestor) {
                const error: any = new Error('This investor contact is already attached to this project.');
                error.statusCode = 409;
                throw error;
            }
        }
        updates.party_id = normalizedPartyId;
    }
    if (payload.investmentPercentage !== undefined) updates.investment_percentage = payload.investmentPercentage !== null ? Number(payload.investmentPercentage ?? 0) : null;
    if (payload.canViewFinancials !== undefined) updates.can_view_financials = Boolean(payload.canViewFinancials);
    if (payload.canApprovePayments !== undefined) updates.can_approve_payments = Boolean(payload.canApprovePayments);
    if (payload.canViewClientReceipts !== undefined) updates.can_view_client_receipts = Boolean(payload.canViewClientReceipts);
    if (payload.isActive !== undefined) updates.is_active = Boolean(payload.isActive);

    const { data, error } = await supabaseAdmin
        .from('project_investors')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
    if (error) throw error;
    return data;
}

export async function deleteProjectInvestorRow(id: string, companyId: string) {
    const ownerCompanyId = await getProjectInvestorCompanyIdById(id);
    if (!ownerCompanyId) {
        const error: any = new Error('Investor not found.');
        error.statusCode = 404;
        throw error;
    }
    if (ownerCompanyId !== companyId) {
        const error: any = new Error('This investor belongs to a different company.');
        error.statusCode = 403;
        throw error;
    }

    const { error } = await supabaseAdmin
        .from('project_investors')
        .update({
            is_active: false,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('company_id', companyId);
    if (error) throw error;
}

export async function listInvestorContributionsForInvestor(investorId: string, companyId: string) {
    const investor = await getProjectInvestorRowById(investorId);
    if (!investor) return [];
    if (investor.project?.company_id !== companyId) return [];
    if (investor.is_active === false) return [];

    const { data, error } = await supabaseAdmin
        .from('project_investor_contributions')
        .select('*')
        .eq('project_investor_id', investorId)
        .order('contribution_date', { ascending: false });
    if (error) throw error;
    return data ?? [];
}

export async function getInvestorContributionRowById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('project_investor_contributions')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const investor = await getProjectInvestorRowById(String(data.project_investor_id));
    const project = investor?.project ?? null;
    return { ...data, investor, project };
}

export async function createInvestorContributionForInvestor(investorId: string, companyId: string, payload: any, userId: string) {
    const normalizedInvestorId = typeof investorId === 'string' ? investorId.trim() : '';
    if (!normalizedInvestorId) {
        const error: any = new Error('Investor is required.');
        error.statusCode = 400;
        throw error;
    }

    const investor = await getProjectInvestorRowById(normalizedInvestorId);
    if (!investor) {
        const error: any = new Error('Investor not found.');
        error.statusCode = 404;
        throw error;
    }
    if (investor.project?.company_id !== companyId) {
        const error: any = new Error('This investor belongs to a different company.');
        error.statusCode = 403;
        throw error;
    }

    const amount = Number(payload?.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
        const error: any = new Error('Contribution amount must be greater than zero.');
        error.statusCode = 400;
        throw error;
    }

    const contributionDate =
        typeof payload?.contributionDate === 'string' ? payload.contributionDate.trim() : payload?.contributionDate;

    try {
        const { data, error } = await supabaseAdmin
            .from('project_investor_contributions')
            .insert({
                project_investor_id: normalizedInvestorId,
                project_id: investor.project_id,
                company_id: investor.company_id,
                amount,
                ...(contributionDate ? { contribution_date: contributionDate } : {}),
                reference_number: payload?.referenceNumber ?? null,
                notes: payload?.notes ?? null,
                created_by: userId,
            })
            .select('*')
            .single();
        if (error) throw error;
        return data;
    } catch (error: any) {
        const message = String(error?.message ?? '');
        if (error?.code === '23503' || /foreign key|violates/i.test(message)) {
            const fkError: any = new Error('Selected investor is not valid for this project/company.');
            fkError.statusCode = 400;
            throw fkError;
        }
        throw error;
    }
}

export async function updateInvestorContributionRow(id: string, companyId: string, payload: any) {
    const existing = await getInvestorContributionRowById(id);
    if (!existing) {
        const error: any = new Error('Contribution not found.');
        error.statusCode = 404;
        throw error;
    }
    if (existing.project?.company_id !== companyId) {
        const error: any = new Error('This contribution belongs to a different company.');
        error.statusCode = 403;
        throw error;
    }

    const updates: Record<string, unknown> = {};
    if (payload.amount !== undefined) {
        const amount = Number(payload.amount ?? 0);
        if (!Number.isFinite(amount) || amount <= 0) {
            const error: any = new Error('Contribution amount must be greater than zero.');
            error.statusCode = 400;
            throw error;
        }
        updates.amount = amount;
    }
    if (payload.contributionDate !== undefined) updates.contribution_date = payload.contributionDate ?? null;
    if (payload.referenceNumber !== undefined) updates.reference_number = payload.referenceNumber ?? null;
    if (payload.notes !== undefined) updates.notes = payload.notes ?? null;

    const { data, error } = await supabaseAdmin
        .from('project_investor_contributions')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
    if (error) throw error;
    return data;
}

export async function deleteInvestorContributionRow(id: string, companyId: string) {
    const existing = await getInvestorContributionRowById(id);
    if (!existing) {
        const error: any = new Error('Contribution not found.');
        error.statusCode = 404;
        throw error;
    }
    if (existing.project?.company_id !== companyId) {
        const error: any = new Error('This contribution belongs to a different company.');
        error.statusCode = 403;
        throw error;
    }

    const { error } = await supabaseAdmin
        .from('project_investor_contributions')
        .delete()
        .eq('id', id);
    if (error) throw error;
}
