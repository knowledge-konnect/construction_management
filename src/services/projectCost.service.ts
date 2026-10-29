import { apiDelete, apiGet, apiPost, apiPut } from '@/services/apiClient';

export type ProjectExpenseStatus = 'unpaid' | 'partially_paid' | 'paid' | 'void';
export type ProjectExpenseVisibility = 'internal' | 'published';
export type ProjectReceiptPaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other';
export type ProjectReceiptVisibility = 'internal' | 'published';
export type ProjectStageStatus = 'pending' | 'in_progress' | 'completed' | 'on_hold';
export type ProjectProgressVisibility = 'draft' | 'published';

export interface ProjectExpenseRecord {
    id: string;
    projectId: string;
    projectName?: string;
    projectNumber?: string;
    categoryId?: string | null;
    category: string;
    description: string;
    supplierName?: string | null;
    supplierBillNumber?: string | null;
    billDate?: string | null;
    dueDate?: string | null;
    billAmount: number;
    status: ProjectExpenseStatus;
    visibilityStatus: ProjectExpenseVisibility;
    createdAt?: string;
    updatedAt?: string;
    voidedAt?: string | null;
}

export interface ProjectReceiptRecord {
    id: string;
    projectId: string;
    receiptNumber: string;
    amount: number;
    receivedDate?: string | null;
    paymentMethodId?: string | null;
    paymentMethod: ProjectReceiptPaymentMethod;
    referenceNumber?: string | null;
    notes?: string | null;
    visibilityStatus: ProjectReceiptVisibility;
    createdAt?: string;
    updatedAt?: string;
    voidedAt?: string | null;
}

export interface ProjectStageRecord {
    id: string;
    projectId: string;
    name: string;
    sequenceNumber: number;
    plannedStartDate?: string | null;
    plannedEndDate?: string | null;
    actualStartDate?: string | null;
    actualEndDate?: string | null;
    completionPercentage: number;
    status: ProjectStageStatus;
    createdAt?: string;
    updatedAt?: string;
}

export interface ProjectProgressUpdateRecord {
    id: string;
    projectId: string;
    stageId?: string | null;
    stageName?: string | null;
    title: string;
    description?: string | null;
    progressPercentage?: number | null;
    updateDate?: string | null;
    visibilityStatus: ProjectProgressVisibility;
    createdAt?: string;
    updatedAt?: string;
}

export interface ProjectExpensePaymentRecord {
    id: string;
    projectExpenseId: string;
    amount: number;
    paymentDate?: string | null;
    paymentMethodId?: string | null;
    paymentMethod: ProjectReceiptPaymentMethod;
    referenceNumber?: string | null;
    notes?: string | null;
    voidedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface ProjectInvestorRecord {
    id: string;
    projectId: string;
    companyId: string;
    userId?: string | null;
    name: string;
    email?: string | null;
    phone?: string | null;
    investmentPercentage?: number | null;
    canViewFinancials: boolean;
    canApprovePayments: boolean;
    canViewClientReceipts: boolean;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface InvestorContributionRecord {
    id: string;
    investorId: string;
    projectId: string;
    companyId: string;
    amount: number;
    contributionDate?: string | null;
    referenceNumber?: string | null;
    notes?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface ProjectAttachmentRecord {
    id: string;
    projectId: string;
    progressUpdateId?: string | null;
    expenseId?: string | null;
    storagePath: string;
    originalFilename: string;
    mimeType?: string | null;
    fileSizeBytes?: number | null;
    visibilityStatus: 'internal' | 'published';
    createdAt?: string;
}

export interface ProjectClientAccessRecord {
    id: string;
    projectId: string;
    email: string;
    invitationStatus: 'pending' | 'accepted' | 'revoked' | 'expired';
    invitedAt?: string;
    invitationExpiresAt?: string | null;
    revokedAt?: string | null;
}

function normalizeExpenseStatus(value: unknown): ProjectExpenseStatus {
    return value === 'unpaid' || value === 'partially_paid' || value === 'paid' || value === 'void'
        ? (value as ProjectExpenseStatus)
        : 'unpaid';
}

function normalizeExpenseVisibility(value: unknown): ProjectExpenseVisibility {
    return value === 'internal' || value === 'published' ? (value as ProjectExpenseVisibility) : 'internal';
}

function normalizeReceiptPaymentMethod(value: unknown): ProjectReceiptPaymentMethod {
    return value === 'cash' || value === 'upi' || value === 'bank_transfer' || value === 'cheque' || value === 'other'
        ? (value as ProjectReceiptPaymentMethod)
        : 'cash';
}

function normalizeReceiptVisibility(value: unknown): ProjectReceiptVisibility {
    return value === 'internal' || value === 'published' ? (value as ProjectReceiptVisibility) : 'internal';
}

function normalizeStageStatus(value: unknown): ProjectStageStatus {
    return value === 'pending' || value === 'in_progress' || value === 'completed' || value === 'on_hold'
        ? (value as ProjectStageStatus)
        : 'pending';
}

function normalizeProgressVisibility(value: unknown): ProjectProgressVisibility {
    return value === 'draft' || value === 'published' ? (value as ProjectProgressVisibility) : 'draft';
}

function mapExpenseRow(row: any): ProjectExpenseRecord {
    const project = row?.project ?? row?.projects ?? null;
    return {
        id: row.id,
        projectId: row.project_id,
        projectName: project?.name ?? '',
        projectNumber: project?.project_number ?? '',
        categoryId: row.category_id ?? null,
        category: row.category ?? 'General',
        description: row.description ?? 'Supplier expense',
        supplierName: row.supplier_name ?? null,
        supplierBillNumber: row.supplier_bill_number ?? null,
        billDate: row.bill_date ?? null,
        dueDate: row.due_date ?? null,
        billAmount: Number(row.bill_amount ?? 0),
        status: normalizeExpenseStatus(row.status),
        visibilityStatus: normalizeExpenseVisibility(row.visibility_status),
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined,
        voidedAt: row.voided_at ?? null,
    };
}

function mapReceiptRow(row: any): ProjectReceiptRecord {
    return {
        id: row.id,
        projectId: row.project_id,
        receiptNumber: row.receipt_number ?? '',
        amount: Number(row.amount ?? 0),
        receivedDate: row.received_date ?? null,
        paymentMethodId: row.payment_method_id ?? null,
        paymentMethod: normalizeReceiptPaymentMethod(row.payment_method),
        referenceNumber: row.reference_number ?? null,
        notes: row.notes ?? null,
        visibilityStatus: normalizeReceiptVisibility(row.visibility_status),
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined,
        voidedAt: row.voided_at ?? null,
    };
}

function mapExpensePaymentRow(row: any): ProjectExpensePaymentRecord {
    return {
        id: row.id,
        projectExpenseId: row.project_expense_id,
        amount: Number(row.amount ?? 0),
        paymentDate: row.payment_date ?? null,
        paymentMethodId: row.payment_method_id ?? null,
        paymentMethod: normalizeReceiptPaymentMethod(row.payment_method),
        referenceNumber: row.reference_number ?? null,
        notes: row.notes ?? null,
        voidedAt: row.voided_at ?? null,
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined,
    };
}

function mapInvestorRow(row: any): ProjectInvestorRecord {
    return {
        id: row.id,
        projectId: row.project_id,
        companyId: row.company_id,
        userId: row.user_id ?? null,
        name: row.name ?? '',
        email: row.email ?? null,
        phone: row.phone ?? null,
        investmentPercentage: row.investment_percentage !== undefined && row.investment_percentage !== null ? Number(row.investment_percentage) : null,
        canViewFinancials: Boolean(row.can_view_financials),
        canApprovePayments: Boolean(row.can_approve_payments),
        canViewClientReceipts: Boolean(row.can_view_client_receipts),
        isActive: Boolean(row.is_active ?? true),
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined,
    };
}

function mapContributionRow(row: any): InvestorContributionRecord {
    return {
        id: row.id,
        investorId: row.project_investor_id,
        projectId: row.project_id,
        companyId: row.company_id,
        amount: Number(row.amount ?? 0),
        contributionDate: row.contribution_date ?? null,
        referenceNumber: row.reference_number ?? null,
        notes: row.notes ?? null,
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined,
    };
}

function mapAttachmentRow(row: any): ProjectAttachmentRecord {
    return {
        id: row.id,
        projectId: row.project_id,
        progressUpdateId: row.progress_update_id ?? null,
        expenseId: row.expense_id ?? null,
        storagePath: row.storage_path ?? '',
        originalFilename: row.original_filename ?? '',
        mimeType: row.mime_type ?? null,
        fileSizeBytes: row.file_size_bytes !== undefined && row.file_size_bytes !== null ? Number(row.file_size_bytes) : null,
        visibilityStatus: row.visibility_status === 'published' ? 'published' : 'internal',
        createdAt: row.created_at ?? undefined,
    };
}

function mapClientAccessRow(row: any): ProjectClientAccessRecord {
    return {
        id: row.id,
        projectId: row.project_id,
        email: row.email ?? '',
        invitationStatus: row.invitation_status ?? 'pending',
        invitedAt: row.invited_at ?? undefined,
        invitationExpiresAt: row.invitation_expires_at ?? null,
        revokedAt: row.revoked_at ?? null,
    };
}

function mapStageRow(row: any): ProjectStageRecord {
    return {
        id: row.id,
        projectId: row.project_id,
        name: row.name ?? 'Stage',
        sequenceNumber: Number(row.sequence_number ?? 1),
        plannedStartDate: row.planned_start_date ?? null,
        plannedEndDate: row.planned_end_date ?? null,
        actualStartDate: row.actual_start_date ?? null,
        actualEndDate: row.actual_end_date ?? null,
        completionPercentage: Number(row.completion_percentage ?? 0),
        status: normalizeStageStatus(row.status),
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined,
    };
}

function mapProgressUpdateRow(row: any): ProjectProgressUpdateRecord {
    const stage = row?.project_stages ?? row?.stage ?? null;
    return {
        id: row.id,
        projectId: row.project_id,
        stageId: row.stage_id ?? null,
        stageName: stage?.name ?? null,
        title: row.title ?? 'Site update',
        description: row.description ?? null,
        progressPercentage: row.progress_percentage !== null && row.progress_percentage !== undefined ? Number(row.progress_percentage) : null,
        updateDate: row.update_date ?? null,
        visibilityStatus: normalizeProgressVisibility(row.visibility_status),
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined,
    };
}

export async function listProjectExpenses(projectId?: string): Promise<ProjectExpenseRecord[]> {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    const { data, error } = await apiGet<{ expenses?: any[] }>(`/api/project-expenses${query}`);
    if (error || !data?.expenses) {
        console.warn('Failed to load project expenses', error);
        return [];
    }
    return data.expenses.map(mapExpenseRow);
}

export async function createProjectExpense(input: {
    projectId: string;
    categoryId?: string | null;
    category?: string;
    description?: string;
    supplierName?: string | null;
    supplierBillNumber?: string | null;
    billDate?: string | null;
    dueDate?: string | null;
    billAmount: number;
    status?: ProjectExpenseStatus;
    visibilityStatus?: ProjectExpenseVisibility;
}): Promise<ProjectExpenseRecord | null> {
    const { data, error } = await apiPost<{ expense?: any }>('/api/project-expenses', {
        expense: {
            projectId: input.projectId,
            categoryId: input.categoryId ?? null,
            category: input.category ?? 'General',
            description: input.description ?? 'Supplier expense',
            supplierName: input.supplierName ?? null,
            supplierBillNumber: input.supplierBillNumber ?? null,
            billDate: input.billDate ?? null,
            dueDate: input.dueDate ?? null,
            billAmount: Number(input.billAmount ?? 0),
            status: input.status ?? 'unpaid',
            visibilityStatus: input.visibilityStatus ?? 'internal',
        },
    });

    if (error || !data?.expense) {
        console.warn('Failed to create project expense', error);
        return null;
    }
    return mapExpenseRow(data.expense);
}

export async function updateProjectExpense(id: string, input: Partial<ProjectExpenseRecord> & { projectId?: string }): Promise<ProjectExpenseRecord | null> {
    const { data, error } = await apiPut<{ expense?: any }>(`/api/project-expenses/${id}`, {
        expense: {
            projectId: input.projectId,
            categoryId: input.categoryId,
            category: input.category,
            description: input.description,
            supplierName: input.supplierName,
            supplierBillNumber: input.supplierBillNumber,
            billDate: input.billDate,
            dueDate: input.dueDate,
            billAmount: input.billAmount,
            status: input.status,
            visibilityStatus: input.visibilityStatus,
        },
    });

    if (error || !data?.expense) {
        console.warn('Failed to update project expense', error);
        return null;
    }
    return mapExpenseRow(data.expense);
}

export async function deleteProjectExpense(id: string): Promise<boolean> {
    const { error } = await apiDelete<{ ok: boolean }>(`/api/project-expenses/${id}`);
    if (error) {
        console.warn('Failed to delete project expense', error);
        return false;
    }
    return true;
}

export async function listProjectReceipts(projectId: string): Promise<ProjectReceiptRecord[]> {
    const { data, error } = await apiGet<{ receipts?: any[] }>(`/api/project-receipts?projectId=${encodeURIComponent(projectId)}`);
    if (error || !data?.receipts) {
        console.warn('Failed to load project receipts', error);
        return [];
    }
    return data.receipts.map(mapReceiptRow);
}

export async function createProjectReceipt(input: {
    projectId: string;
    receiptNumber?: string;
    amount: number;
    receivedDate?: string | null;
    paymentMethodId?: string | null;
    paymentMethod?: ProjectReceiptPaymentMethod;
    referenceNumber?: string | null;
    notes?: string | null;
    visibilityStatus?: ProjectReceiptVisibility;
}): Promise<ProjectReceiptRecord | null> {
    const { data, error } = await apiPost<{ receipt?: any }>('/api/project-receipts', {
        receipt: {
            projectId: input.projectId,
            receiptNumber: input.receiptNumber,
            amount: Number(input.amount ?? 0),
            receivedDate: input.receivedDate ?? null,
            paymentMethodId: input.paymentMethodId ?? null,
            paymentMethod: input.paymentMethod ?? 'cash',
            referenceNumber: input.referenceNumber ?? null,
            notes: input.notes ?? null,
            visibilityStatus: input.visibilityStatus ?? 'internal',
        },
    });

    if (error || !data?.receipt) {
        console.warn('Failed to create project receipt', error);
        return null;
    }
    return mapReceiptRow(data.receipt);
}

export async function updateProjectReceipt(id: string, input: Partial<ProjectReceiptRecord> & { projectId?: string }): Promise<ProjectReceiptRecord | null> {
    const { data, error } = await apiPut<{ receipt?: any }>(`/api/project-receipts/${id}`, {
        receipt: {
            projectId: input.projectId,
            receiptNumber: input.receiptNumber,
            amount: input.amount,
            receivedDate: input.receivedDate,
            paymentMethodId: input.paymentMethodId,
            paymentMethod: input.paymentMethod,
            referenceNumber: input.referenceNumber,
            notes: input.notes,
            visibilityStatus: input.visibilityStatus,
        },
    });

    if (error || !data?.receipt) {
        console.warn('Failed to update project receipt', error);
        return null;
    }
    return mapReceiptRow(data.receipt);
}

export async function deleteProjectReceipt(id: string): Promise<boolean> {
    const { error } = await apiDelete<{ ok: boolean }>(`/api/project-receipts/${id}`);
    if (error) {
        console.warn('Failed to delete project receipt', error);
        return false;
    }
    return true;
}

export async function listProjectStages(projectId: string): Promise<ProjectStageRecord[]> {
    const { data, error } = await apiGet<{ stages?: any[] }>(`/api/project-stages?projectId=${encodeURIComponent(projectId)}`);
    if (error || !data?.stages) {
        console.warn('Failed to load project stages', error);
        return [];
    }
    return data.stages.map(mapStageRow);
}

export async function createProjectStage(input: {
    projectId: string;
    name?: string;
    sequenceNumber?: number;
    plannedStartDate?: string | null;
    plannedEndDate?: string | null;
    actualStartDate?: string | null;
    actualEndDate?: string | null;
    completionPercentage?: number;
    status?: ProjectStageStatus;
}): Promise<ProjectStageRecord | null> {
    const { data, error } = await apiPost<{ stage?: any }>('/api/project-stages', {
        stage: {
            projectId: input.projectId,
            name: input.name ?? 'New stage',
            sequenceNumber: input.sequenceNumber,
            plannedStartDate: input.plannedStartDate ?? null,
            plannedEndDate: input.plannedEndDate ?? null,
            actualStartDate: input.actualStartDate ?? null,
            actualEndDate: input.actualEndDate ?? null,
            completionPercentage: input.completionPercentage ?? 0,
            status: input.status ?? 'pending',
        },
    });

    if (error || !data?.stage) {
        console.warn('Failed to create project stage', error);
        return null;
    }
    return mapStageRow(data.stage);
}

export async function updateProjectStage(id: string, input: Partial<ProjectStageRecord> & { projectId?: string }): Promise<ProjectStageRecord | null> {
    const { data, error } = await apiPut<{ stage?: any }>(`/api/project-stages/${id}`, {
        stage: {
            projectId: input.projectId,
            name: input.name,
            sequenceNumber: input.sequenceNumber,
            plannedStartDate: input.plannedStartDate,
            plannedEndDate: input.plannedEndDate,
            actualStartDate: input.actualStartDate,
            actualEndDate: input.actualEndDate,
            completionPercentage: input.completionPercentage,
            status: input.status,
        },
    });

    if (error || !data?.stage) {
        console.warn('Failed to update project stage', error);
        return null;
    }
    return mapStageRow(data.stage);
}

export async function deleteProjectStage(id: string): Promise<boolean> {
    const { error } = await apiDelete<{ ok: boolean }>(`/api/project-stages/${id}`);
    if (error) {
        console.warn('Failed to delete project stage', error);
        return false;
    }
    return true;
}

export async function listProjectProgressUpdates(projectId: string): Promise<ProjectProgressUpdateRecord[]> {
    const { data, error } = await apiGet<{ updates?: any[] }>(`/api/project-progress-updates?projectId=${encodeURIComponent(projectId)}`);
    if (error || !data?.updates) {
        console.warn('Failed to load project progress updates', error);
        return [];
    }
    return data.updates.map(mapProgressUpdateRow);
}

export async function createProjectProgressUpdate(input: {
    projectId: string;
    stageId?: string | null;
    title?: string;
    description?: string | null;
    progressPercentage?: number | null;
    updateDate?: string | null;
    visibilityStatus?: ProjectProgressVisibility;
}): Promise<ProjectProgressUpdateRecord | null> {
    const { data, error } = await apiPost<{ update?: any }>('/api/project-progress-updates', {
        update: {
            projectId: input.projectId,
            stageId: input.stageId ?? null,
            title: input.title ?? 'Site update',
            description: input.description ?? null,
            progressPercentage: input.progressPercentage ?? null,
            updateDate: input.updateDate ?? null,
            visibilityStatus: input.visibilityStatus ?? 'draft',
        },
    });

    if (error || !data?.update) {
        console.warn('Failed to create project progress update', error);
        return null;
    }
    return mapProgressUpdateRow(data.update);
}

export async function updateProjectProgressUpdate(id: string, input: Partial<ProjectProgressUpdateRecord> & { projectId?: string }): Promise<ProjectProgressUpdateRecord | null> {
    const { data, error } = await apiPut<{ update?: any }>(`/api/project-progress-updates/${id}`, {
        update: {
            projectId: input.projectId,
            stageId: input.stageId,
            title: input.title,
            description: input.description,
            progressPercentage: input.progressPercentage,
            updateDate: input.updateDate,
            visibilityStatus: input.visibilityStatus,
        },
    });

    if (error || !data?.update) {
        console.warn('Failed to update project progress update', error);
        return null;
    }
    return mapProgressUpdateRow(data.update);
}

export async function deleteProjectProgressUpdate(id: string): Promise<boolean> {
    const { error } = await apiDelete<{ ok: boolean }>(`/api/project-progress-updates/${id}`);
    if (error) {
        console.warn('Failed to delete project progress update', error);
        return false;
    }
    return true;
}

export async function listProjectExpensePayments(projectExpenseId: string): Promise<ProjectExpensePaymentRecord[]> {
    const { data, error } = await apiGet<{ payments?: any[] }>(`/api/project-expense-payments?projectExpenseId=${encodeURIComponent(projectExpenseId)}`);
    if (error || !data?.payments) {
        console.warn('Failed to load project expense payments', error);
        return [];
    }
    return data.payments.map(mapExpensePaymentRow);
}

export async function createProjectExpensePayment(input: {
    projectExpenseId: string;
    amount: number;
    paymentDate?: string | null;
    paymentMethodId?: string | null;
    paymentMethod?: ProjectReceiptPaymentMethod;
    referenceNumber?: string | null;
    notes?: string | null;
}): Promise<ProjectExpensePaymentRecord | null> {
    const { data, error } = await apiPost<{ payment?: any }>('/api/project-expense-payments', {
        payment: {
            projectExpenseId: input.projectExpenseId,
            amount: Number(input.amount ?? 0),
            paymentDate: input.paymentDate ?? null,
            paymentMethodId: input.paymentMethodId ?? null,
            paymentMethod: input.paymentMethod ?? 'cash',
            referenceNumber: input.referenceNumber ?? null,
            notes: input.notes ?? null,
        },
    });

    if (error || !data?.payment) {
        console.warn('Failed to create project expense payment', error);
        return null;
    }
    return mapExpensePaymentRow(data.payment);
}

export async function updateProjectExpensePayment(id: string, input: Partial<ProjectExpensePaymentRecord>): Promise<ProjectExpensePaymentRecord | null> {
    const { data, error } = await apiPut<{ payment?: any }>(`/api/project-expense-payments/${id}`, {
        payment: {
            amount: input.amount,
            paymentDate: input.paymentDate,
            paymentMethodId: input.paymentMethodId,
            paymentMethod: input.paymentMethod,
            referenceNumber: input.referenceNumber,
            notes: input.notes,
        },
    });

    if (error || !data?.payment) {
        console.warn('Failed to update project expense payment', error);
        return null;
    }
    return mapExpensePaymentRow(data.payment);
}

export async function deleteProjectExpensePayment(id: string): Promise<boolean> {
    const { error } = await apiDelete<{ ok: boolean }>(`/api/project-expense-payments/${id}`);
    if (error) {
        console.warn('Failed to delete project expense payment', error);
        return false;
    }
    return true;
}

export async function listProjectInvestors(projectId: string): Promise<ProjectInvestorRecord[]> {
    const { data, error } = await apiGet<{ investors?: any[] }>(`/api/project-investors?projectId=${encodeURIComponent(projectId)}`);
    if (error || !data?.investors) {
        console.warn('Failed to load project investors', error);
        return [];
    }
    return data.investors.map(mapInvestorRow);
}

export async function createProjectInvestor(input: Omit<ProjectInvestorRecord, 'id' | 'companyId'>): Promise<ProjectInvestorRecord | null> {
    const { data, error } = await apiPost<{ investor?: any }>('/api/project-investors', { investor: input });
    if (error || !data?.investor) {
        console.warn('Failed to create project investor', error);
        return null;
    }
    return mapInvestorRow(data.investor);
}

export async function updateProjectInvestor(id: string, updates: Partial<ProjectInvestorRecord>): Promise<ProjectInvestorRecord | null> {
    const { data, error } = await apiPut<{ investor?: any }>(`/api/project-investors/${id}`, { investor: updates });
    if (error || !data?.investor) {
        console.warn('Failed to update project investor', error);
        return null;
    }
    return mapInvestorRow(data.investor);
}

export async function deleteProjectInvestor(id: string): Promise<boolean> {
    const { error } = await apiDelete<{ ok: boolean }>(`/api/project-investors/${id}`);
    if (error) {
        console.warn('Failed to delete project investor', error);
        return false;
    }
    return true;
}

export async function listInvestorContributions(investorId: string): Promise<InvestorContributionRecord[]> {
    const { data, error } = await apiGet<{ contributions?: any[] }>(`/api/investor-contributions?investorId=${encodeURIComponent(investorId)}`);
    if (error || !data?.contributions) {
        console.warn('Failed to load investor contributions', error);
        return [];
    }
    return data.contributions.map(mapContributionRow);
}

export async function createInvestorContribution(input: {
    investorId: string;
    amount: number;
    contributionDate?: string | null;
    referenceNumber?: string | null;
    notes?: string | null;
}): Promise<InvestorContributionRecord | null> {
    const { data, error } = await apiPost<{ contribution?: any }>('/api/investor-contributions', { contribution: input });
    if (error || !data?.contribution) {
        console.warn('Failed to create investor contribution', error);
        return null;
    }
    return mapContributionRow(data.contribution);
}

export async function updateInvestorContribution(id: string, updates: Partial<InvestorContributionRecord>): Promise<InvestorContributionRecord | null> {
    const { data, error } = await apiPut<{ contribution?: any }>(`/api/investor-contributions/${id}`, { contribution: updates });
    if (error || !data?.contribution) {
        console.warn('Failed to update investor contribution', error);
        return null;
    }
    return mapContributionRow(data.contribution);
}

export async function deleteInvestorContribution(id: string): Promise<boolean> {
    const { error } = await apiDelete<{ ok: boolean }>(`/api/investor-contributions/${id}`);
    if (error) {
        console.warn('Failed to delete investor contribution', error);
        return false;
    }
    return true;
}

export async function listProjectAttachments(projectId: string): Promise<ProjectAttachmentRecord[]> {
    const { data, error } = await apiGet<{ attachments?: any[] }>(`/api/project-attachments?projectId=${encodeURIComponent(projectId)}`);
    if (error || !data?.attachments) {
        console.warn('Failed to load project attachments', error);
        return [];
    }
    return data.attachments.map(mapAttachmentRow);
}

export async function createProjectAttachment(input: {
    projectId: string;
    progressUpdateId?: string | null;
    expenseId?: string | null;
    storagePath: string;
    originalFilename?: string;
    mimeType?: string | null;
    fileSizeBytes?: number | null;
    visibilityStatus?: 'internal' | 'published';
}): Promise<ProjectAttachmentRecord | null> {
    const { data, error } = await apiPost<{ attachment?: any }>('/api/project-attachments', {
        attachment: input,
    });
    if (error || !data?.attachment) {
        console.warn('Failed to create project attachment', error);
        return null;
    }
    return mapAttachmentRow(data.attachment);
}

export async function deleteProjectAttachment(id: string): Promise<boolean> {
    const { error } = await apiDelete<{ ok: boolean }>(`/api/project-attachments/${id}`);
    if (error) {
        console.warn('Failed to delete project attachment', error);
        return false;
    }
    return true;
}

export async function listProjectClientAccess(projectId: string): Promise<ProjectClientAccessRecord[]> {
    const { data, error } = await apiGet<{ access?: any[] }>(`/api/project-client-access?projectId=${encodeURIComponent(projectId)}`);
    if (error || !data?.access) {
        console.warn('Failed to load project client access', error);
        return [];
    }
    return data.access.map(mapClientAccessRow);
}

export async function createProjectClientAccess(input: {
    projectId: string;
    email: string;
    invitationStatus?: 'pending' | 'accepted' | 'revoked' | 'expired';
    invitationExpiresAt?: string | null;
}): Promise<ProjectClientAccessRecord | null> {
    const { data, error } = await apiPost<{ access?: any }>('/api/project-client-access', {
        access: input,
    });
    if (error || !data?.access) {
        console.warn('Failed to create project client access', error);
        return null;
    }
    return mapClientAccessRow(data.access);
}

export async function revokeProjectClientAccess(id: string): Promise<boolean> {
    const { error } = await apiDelete<{ ok: boolean }>(`/api/project-client-access/${id}`);
    if (error) {
        console.warn('Failed to revoke project client access', error);
        return false;
    }
    return true;
}
