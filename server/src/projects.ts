import { supabaseAdmin } from './auth.js';

export type ProjectStatus = 'planned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
export type ProjectExpenseStatus = 'unpaid' | 'partially_paid' | 'paid' | 'void';
export type ProjectExpenseVisibility = 'internal' | 'published';
export type ProjectReceiptPaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other';
export type ProjectReceiptVisibility = 'internal' | 'published';
export type ProjectStageStatus = 'pending' | 'in_progress' | 'completed' | 'on_hold';
export type ProjectProgressVisibility = 'draft' | 'published';
export type ProjectAttachmentVisibility = 'internal' | 'published';
export type ProjectClientAccessStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export const PROJECT_STATUS_VALUES: ProjectStatus[] = ['planned', 'in_progress', 'on_hold', 'completed', 'cancelled'];
export const PROJECT_EXPENSE_STATUS_VALUES: ProjectExpenseStatus[] = ['unpaid', 'partially_paid', 'paid', 'void'];
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

    const accessPayload = {
        project_id: projectId,
        email,
        user_id: payload?.userId ?? null,
        invitation_token_hash: payload?.invitationTokenHash ?? null,
        invitation_expires_at: payload?.invitationExpiresAt ?? null,
        invitation_status: normalizeProjectClientAccessStatus(payload?.invitationStatus ?? 'pending'),
        invited_by: userId,
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
    const cleanPayload = {
        ...payload,
        company_id: companyId,
        created_by: userId,
        customer_id: payload?.customer_id ?? null,
        source_document_id: payload?.source_document_id ?? null,
        project_type_id: payload?.project_type_id ?? null,
        project_type_snapshot: payload?.project_type_snapshot ?? null,
        status: normalizeProjectStatus(payload?.status ?? 'planned'),
        contract_amount: Number(payload?.contract_amount ?? 0),
    };

    const { data, error } = await supabaseAdmin
        .from('projects')
        .insert(cleanPayload)
        .select('*, customers(*)')
        .single();

    if (error) throw error;
    return data;
}

export async function updateProjectRow(id: string, payload: any) {
    const updates: Record<string, unknown> = {};

    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.description !== undefined) updates.description = payload.description ?? null;
    if (payload.site_address !== undefined) updates.site_address = payload.site_address ?? null;
    if (payload.contract_amount !== undefined) updates.contract_amount = Number(payload.contract_amount ?? 0);
    if (payload.start_date !== undefined) updates.start_date = payload.start_date ?? null;
    if (payload.expected_end_date !== undefined) updates.expected_end_date = payload.expected_end_date ?? null;
    if (payload.actual_end_date !== undefined) updates.actual_end_date = payload.actual_end_date ?? null;
    if (payload.customer_id !== undefined) updates.customer_id = payload.customer_id ?? null;
    if (payload.source_document_id !== undefined) updates.source_document_id = payload.source_document_id ?? null;
    if (payload.project_type_id !== undefined) updates.project_type_id = payload.project_type_id ?? null;
    if (payload.project_type_snapshot !== undefined) updates.project_type_snapshot = payload.project_type_snapshot ?? null;
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

    const expensePayload = {
        project_id: projectId,
        category_id: payload?.categoryId ?? payload?.category_id ?? null,
        category: String(payload?.category ?? '').trim() || 'General',
        description: String(payload?.description ?? '').trim() || 'Supplier expense',
        supplier_name: payload?.supplierName ?? null,
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
    if (payload.categoryId !== undefined || payload.category_id !== undefined) updates.category_id = payload.categoryId ?? payload.category_id ?? null;
    if (payload.description !== undefined) updates.description = String(payload.description ?? '').trim() || 'Supplier expense';
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

    const { error } = await supabaseAdmin
        .from('project_expenses')
        .delete()
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

    const { data, error } = await supabaseAdmin
        .from('projects')
        .insert({
            ...projectPayload,
            created_by: userId,
        })
        .select('*, customers(*)')
        .single();

    if (error) throw error;
    return data;
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
        .select('id, bill_amount, status')
        .eq('id', expenseId)
        .maybeSingle();
    if (expenseError) throw expenseError;
    if (!expense) return;
    if (expense.status === 'void') return;

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
        .update({ status: nextStatus })
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

    const amount = Number(payload?.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
        const error: any = new Error('Payment amount must be greater than zero.');
        error.statusCode = 400;
        throw error;
    }

    const { data, error } = await supabaseAdmin
        .from('project_expense_payments')
        .insert({
            project_expense_id: expenseId,
            amount,
            payment_date: payload?.paymentDate ?? null,
            payment_method_id: payload?.paymentMethodId ?? payload?.payment_method_id ?? null,
            payment_method: normalizeProjectReceiptPaymentMethod(payload?.paymentMethod ?? 'cash'),
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
        updates.amount = amount;
    }
    if (payload.paymentDate !== undefined) updates.payment_date = payload.paymentDate ?? null;
    if (payload.paymentMethodId !== undefined || payload.payment_method_id !== undefined) updates.payment_method_id = payload.paymentMethodId ?? payload.payment_method_id ?? null;
    if (payload.paymentMethod !== undefined) updates.payment_method = normalizeProjectReceiptPaymentMethod(payload.paymentMethod);
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

    const { error } = await supabaseAdmin
        .from('project_expense_payments')
        .delete()
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
        .eq('is_active', true)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
}

export async function getProjectInvestorRowById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('project_investors')
        .select('*, projects!project_id(id, company_id)')
        .eq('id', id)
        .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const project = Array.isArray(data.projects) ? data.projects[0] ?? null : data.projects ?? null;
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

    const { data, error } = await supabaseAdmin
        .from('project_investors')
        .insert({
            project_id: projectId,
            company_id: companyId,
            user_id: payload?.userId ?? null,
            name: String(payload?.name ?? '').trim(),
            email: payload?.email ?? null,
            phone: payload?.phone ?? null,
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
    if (payload.name !== undefined) updates.name = String(payload.name ?? '').trim();
    if (payload.email !== undefined) updates.email = payload.email ?? null;
    if (payload.phone !== undefined) updates.phone = payload.phone ?? null;
    if (payload.userId !== undefined) updates.user_id = payload.userId ?? null;
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

    // Remove dependent contributions explicitly before deleting the investor.
    // This keeps delete reliable even if cascade FK is missing in older databases.
    const { error: contributionDeleteError } = await supabaseAdmin
        .from('project_investor_contributions')
        .delete()
        .eq('project_investor_id', id);
    if (contributionDeleteError) throw contributionDeleteError;

    const { error } = await supabaseAdmin
        .from('project_investors')
        .delete()
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
        .select('*, project_investors!project_investor_id(id, project_id, company_id, projects!project_id(id, company_id))')
        .eq('id', id)
        .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const investor = Array.isArray(data.project_investors) ? data.project_investors[0] ?? null : data.project_investors ?? null;
    const project = Array.isArray(investor?.projects) ? investor.projects[0] ?? null : investor?.projects ?? null;
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
