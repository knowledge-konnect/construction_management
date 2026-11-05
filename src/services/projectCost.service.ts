import { apiDelete, apiGet, apiPost, apiPut, apiRequest } from '@/services/apiClient';
import type { ServiceResult } from '@/services/serviceResult';
import { toServiceResult } from '@/services/serviceResult';

export type ProjectExpenseStatus = 'unpaid' | 'partially_paid' | 'paid' | 'void';
export type ProjectExpenseType = 'direct' | 'supplier_bill';
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
    supplierPartyId?: string | null;
    supplierName?: string | null;
    supplierBillNumber?: string | null;
    billDate?: string | null;
    dueDate?: string | null;
    billAmount: number;
    expenseType: ProjectExpenseType;
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

export type PurchaseOrderStatus = 'draft' | 'approved' | 'cancelled' | 'closed';

export interface PurchaseOrderLineRecord {
    id: string;
    purchaseOrderId: string;
    description: string;
    quantity: number;
    unit: string | null;
    rate: number;
    lineAmount: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface PurchaseOrderRecord {
    id: string;
    companyId: string;
    projectId: string;
    supplierPartyId: string;
    supplierName?: string | null;
    poNumber: string;
    orderDate?: string;
    expectedDeliveryDate?: string | null;
    status: PurchaseOrderStatus;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    notes?: string | null;
    createdAt?: string;
    updatedAt?: string;
    lineItems: PurchaseOrderLineRecord[];
}

export type MaterialReceiptStatus = 'draft' | 'accepted' | 'rejected';

export interface MaterialReceiptLineRecord {
    id: string;
    materialReceiptId: string;
    purchaseOrderLineId: string;
    purchaseOrderLineDescription: string;
    orderedQuantity: number;
    previouslyReceivedQuantity: number;
    quantityReceived: number;
    acceptedQuantity: number;
    rejectedQuantity: number;
    remainingQuantity: number;
    notes?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface MaterialReceiptRecord {
    id: string;
    companyId: string;
    projectId: string;
    purchaseOrderId: string;
    supplierPartyId: string;
    receiptNumber: string;
    receiptDate?: string | null;
    deliveryReferenceNumber?: string | null;
    notes?: string | null;
    status: MaterialReceiptStatus;
    createdAt?: string;
    updatedAt?: string;
    lineItems: MaterialReceiptLineRecord[];
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
    partyId?: string | null;
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

function normalizeExpenseType(value: unknown): ProjectExpenseType {
    return value === 'supplier_bill' || value === 'direct' ? (value as ProjectExpenseType) : 'direct';
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
    const hasSupplierFields = Boolean(
        row?.supplier_name
        || row?.supplier_bill_number
        || row?.due_date
        || row?.supplier_id
        || row?.party_id
    );
    const project = row?.project ?? row?.projects ?? null;
    return {
        id: row.id,
        projectId: row.project_id,
        projectName: project?.name ?? '',
        projectNumber: project?.project_number ?? '',
        categoryId: row.category_id ?? null,
        category: row.category ?? 'General',
        description: row.description ?? 'Supplier expense',
        supplierPartyId: row.party_id ?? null,
        supplierName: row.supplier_name ?? null,
        supplierBillNumber: row.supplier_bill_number ?? null,
        billDate: row.bill_date ?? null,
        dueDate: row.due_date ?? null,
        billAmount: Number(row.bill_amount ?? 0),
        expenseType: normalizeExpenseType(row.expense_type ?? (hasSupplierFields ? 'supplier_bill' : 'direct')),
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
        partyId: row.party_id ?? null,
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

export async function createProjectExpenseResult(input: {
    projectId: string;
    expenseType?: ProjectExpenseType;
    categoryId?: string | null;
    category?: string;
    description?: string;
    supplierPartyId?: string | null;
    supplierName?: string | null;
    supplierBillNumber?: string | null;
    billDate?: string | null;
    dueDate?: string | null;
    billAmount: number;
    status?: ProjectExpenseStatus;
    visibilityStatus?: ProjectExpenseVisibility;
}): Promise<ServiceResult<ProjectExpenseRecord>> {
    const base = toServiceResult(await apiPost<{ expense?: any }>('/api/project-expenses', {
        expense: {
            projectId: input.projectId,
            expenseType: input.expenseType ?? 'direct',
            categoryId: input.categoryId ?? null,
            category: input.category ?? 'General',
            description: input.description ?? 'Supplier expense',
            supplierPartyId: input.supplierPartyId ?? null,
            supplierName: input.supplierName ?? null,
            supplierBillNumber: input.supplierBillNumber ?? null,
            billDate: input.billDate ?? null,
            dueDate: input.dueDate ?? null,
            billAmount: Number(input.billAmount ?? 0),
            status: input.status ?? 'unpaid',
            visibilityStatus: input.visibilityStatus ?? 'internal',
        },
    }));

    if (!base.ok || !base.data?.expense) {
        console.warn('Failed to create project expense', base.ok ? undefined : base.error);
        return {
            ok: false,
            error: base.ok ? 'We could not create this expense right now. Please try again.' : base.error,
            status: base.status,
        };
    }

    return { ok: true, data: mapExpenseRow(base.data.expense), status: base.status };
}

export async function createProjectExpense(input: {
    projectId: string;
    expenseType?: ProjectExpenseType;
    categoryId?: string | null;
    category?: string;
    description?: string;
    supplierPartyId?: string | null;
    supplierName?: string | null;
    supplierBillNumber?: string | null;
    billDate?: string | null;
    dueDate?: string | null;
    billAmount: number;
    status?: ProjectExpenseStatus;
    visibilityStatus?: ProjectExpenseVisibility;
}): Promise<ProjectExpenseRecord | null> {
    const result = await createProjectExpenseResult(input);
    return result.ok ? result.data : null;
}

export async function updateProjectExpenseResult(id: string, input: Partial<ProjectExpenseRecord> & { projectId?: string }): Promise<ServiceResult<ProjectExpenseRecord>> {
    const base = toServiceResult(await apiPut<{ expense?: any }>(`/api/project-expenses/${id}`, {
        expense: {
            projectId: input.projectId,
            expenseType: input.expenseType,
            categoryId: input.categoryId,
            category: input.category,
            description: input.description,
            supplierPartyId: input.supplierPartyId,
            supplierName: input.supplierName,
            supplierBillNumber: input.supplierBillNumber,
            billDate: input.billDate,
            dueDate: input.dueDate,
            billAmount: input.billAmount,
            status: input.status,
            visibilityStatus: input.visibilityStatus,
        },
    }));

    if (!base.ok || !base.data?.expense) {
        console.warn('Failed to update project expense', base.ok ? undefined : base.error);
        return {
            ok: false,
            error: base.ok ? 'We could not update this expense right now. Please try again.' : base.error,
            status: base.status,
        };
    }

    return { ok: true, data: mapExpenseRow(base.data.expense), status: base.status };
}

export async function updateProjectExpense(id: string, input: Partial<ProjectExpenseRecord> & { projectId?: string }): Promise<ProjectExpenseRecord | null> {
    const result = await updateProjectExpenseResult(id, input);
    return result.ok ? result.data : null;
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

export async function listPurchaseOrdersForProject(projectId: string): Promise<PurchaseOrderRecord[]> {
    const { data, error } = await apiGet<{ purchaseOrders?: any[] }>(`/api/project-purchase-orders?projectId=${encodeURIComponent(projectId)}`);
    if (error || !data?.purchaseOrders) {
        console.warn('Failed to load purchase orders', error);
        return [];
    }

    const mapPurchaseOrderRow = (row: any): PurchaseOrderRecord => ({
        id: row.id,
        companyId: row.company_id,
        projectId: row.project_id,
        supplierPartyId: row.supplier_party_id,
        supplierName: row.supplier_name ?? null,
        poNumber: row.po_number ?? '',
        orderDate: row.order_date ?? undefined,
        expectedDeliveryDate: row.expected_delivery_date ?? null,
        status: row.status ?? 'draft',
        subtotal: Number(row.subtotal ?? 0),
        taxAmount: Number(row.tax_amount ?? 0),
        totalAmount: Number(row.total_amount ?? 0),
        notes: row.notes ?? null,
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined,
        lineItems: Array.isArray(row.line_items ?? row.lineItems) ? (row.line_items ?? row.lineItems).map((line: any) => ({
            id: line.id,
            purchaseOrderId: line.purchase_order_id ?? row.id,
            description: line.description ?? '',
            quantity: Number(line.quantity ?? 0),
            unit: line.unit ?? null,
            rate: Number(line.rate ?? 0),
            lineAmount: Number(line.line_amount ?? line.lineAmount ?? 0),
            createdAt: line.created_at ?? undefined,
            updatedAt: line.updated_at ?? undefined,
        })) : [],
    });

    return (data.purchaseOrders ?? []).map(mapPurchaseOrderRow);
}

export async function getPurchaseOrder(id: string): Promise<PurchaseOrderRecord | null> {
    const { data, error } = await apiGet<{ purchaseOrder?: any }>(`/api/project-purchase-orders/${id}`);
    if (error || !data?.purchaseOrder) {
        console.warn('Failed to load purchase order', error);
        return null;
    }

    const row = data.purchaseOrder;
    return {
        id: row.id,
        companyId: row.company_id,
        projectId: row.project_id,
        supplierPartyId: row.supplier_party_id,
        supplierName: row.supplier_name ?? null,
        poNumber: row.po_number ?? '',
        orderDate: row.order_date ?? undefined,
        expectedDeliveryDate: row.expected_delivery_date ?? null,
        status: row.status ?? 'draft',
        subtotal: Number(row.subtotal ?? 0),
        taxAmount: Number(row.tax_amount ?? 0),
        totalAmount: Number(row.total_amount ?? 0),
        notes: row.notes ?? null,
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined,
        lineItems: Array.isArray(row.line_items ?? row.lineItems) ? (row.line_items ?? row.lineItems).map((line: any) => ({
            id: line.id,
            purchaseOrderId: line.purchase_order_id ?? row.id,
            description: line.description ?? '',
            quantity: Number(line.quantity ?? 0),
            unit: line.unit ?? null,
            rate: Number(line.rate ?? 0),
            lineAmount: Number(line.line_amount ?? line.lineAmount ?? 0),
            createdAt: line.created_at ?? undefined,
            updatedAt: line.updated_at ?? undefined,
        })) : [],
    };
}

export async function createPurchaseOrder(input: {
    projectId: string;
    supplierPartyId: string;
    poNumber?: string;
    orderDate?: string;
    expectedDeliveryDate?: string | null;
    status?: PurchaseOrderStatus;
    taxAmount?: number;
    notes?: string | null;
    lines: Array<{
        description: string;
        quantity: number;
        unit?: string | null;
        rate: number;
    }>;
}): Promise<PurchaseOrderRecord | null> {
    const { data, error } = await apiPost<{ purchaseOrder?: any }>('/api/project-purchase-orders', {
        purchaseOrder: {
            projectId: input.projectId,
            supplierPartyId: input.supplierPartyId,
            poNumber: input.poNumber,
            orderDate: input.orderDate,
            expectedDeliveryDate: input.expectedDeliveryDate ?? null,
            status: input.status ?? 'draft',
            taxAmount: Number(input.taxAmount ?? 0),
            notes: input.notes ?? null,
            lines: input.lines.map((line) => ({
                description: line.description,
                quantity: Number(line.quantity ?? 0),
                unit: line.unit ?? null,
                rate: Number(line.rate ?? 0),
            })),
        },
    });

    if (error || !data?.purchaseOrder) {
        console.warn('Failed to create purchase order', error);
        return null;
    }

    const row = data.purchaseOrder;
    return {
        id: row.id,
        companyId: row.company_id,
        projectId: row.project_id,
        supplierPartyId: row.supplier_party_id,
        supplierName: row.supplier_name ?? null,
        poNumber: row.po_number ?? '',
        orderDate: row.order_date ?? undefined,
        expectedDeliveryDate: row.expected_delivery_date ?? null,
        status: row.status ?? 'draft',
        subtotal: Number(row.subtotal ?? 0),
        taxAmount: Number(row.tax_amount ?? 0),
        totalAmount: Number(row.total_amount ?? 0),
        notes: row.notes ?? null,
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined,
        lineItems: Array.isArray(row.line_items ?? row.lineItems) ? (row.line_items ?? row.lineItems).map((line: any) => ({
            id: line.id,
            purchaseOrderId: line.purchase_order_id ?? row.id,
            description: line.description ?? '',
            quantity: Number(line.quantity ?? 0),
            unit: line.unit ?? null,
            rate: Number(line.rate ?? 0),
            lineAmount: Number(line.line_amount ?? line.lineAmount ?? 0),
            createdAt: line.created_at ?? undefined,
            updatedAt: line.updated_at ?? undefined,
        })) : [],
    };
}

export async function updatePurchaseOrder(id: string, updates: {
    supplierPartyId?: string;
    poNumber?: string;
    orderDate?: string;
    expectedDeliveryDate?: string | null;
    status?: PurchaseOrderStatus;
    taxAmount?: number;
    notes?: string | null;
    lines?: Array<{
        description: string;
        quantity: number;
        unit?: string | null;
        rate: number;
    }>;
}): Promise<PurchaseOrderRecord | null> {
    const { data, error } = await apiPut<{ purchaseOrder?: any }>(`/api/project-purchase-orders/${id}`, {
        purchaseOrder: {
            supplierPartyId: updates.supplierPartyId,
            poNumber: updates.poNumber,
            orderDate: updates.orderDate,
            expectedDeliveryDate: updates.expectedDeliveryDate,
            status: updates.status,
            taxAmount: updates.taxAmount,
            notes: updates.notes,
            lines: updates.lines?.map((line) => ({
                description: line.description,
                quantity: Number(line.quantity ?? 0),
                unit: line.unit ?? null,
                rate: Number(line.rate ?? 0),
            })),
        },
    });

    if (error || !data?.purchaseOrder) {
        console.warn('Failed to update purchase order', error);
        return null;
    }

    const row = data.purchaseOrder;
    return {
        id: row.id,
        companyId: row.company_id,
        projectId: row.project_id,
        supplierPartyId: row.supplier_party_id,
        supplierName: row.supplier_name ?? null,
        poNumber: row.po_number ?? '',
        orderDate: row.order_date ?? undefined,
        expectedDeliveryDate: row.expected_delivery_date ?? null,
        status: row.status ?? 'draft',
        subtotal: Number(row.subtotal ?? 0),
        taxAmount: Number(row.tax_amount ?? 0),
        totalAmount: Number(row.total_amount ?? 0),
        notes: row.notes ?? null,
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined,
        lineItems: Array.isArray(row.line_items ?? row.lineItems) ? (row.line_items ?? row.lineItems).map((line: any) => ({
            id: line.id,
            purchaseOrderId: line.purchase_order_id ?? row.id,
            description: line.description ?? '',
            quantity: Number(line.quantity ?? 0),
            unit: line.unit ?? null,
            rate: Number(line.rate ?? 0),
            lineAmount: Number(line.line_amount ?? line.lineAmount ?? 0),
            createdAt: line.created_at ?? undefined,
            updatedAt: line.updated_at ?? undefined,
        })) : [],
    };
}

export async function updatePurchaseOrderStatus(id: string, status: PurchaseOrderStatus): Promise<PurchaseOrderRecord | null> {
    const { data, error } = await apiRequest<{ purchaseOrder?: any }>(`/api/project-purchase-orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    });

    if (error || !data?.purchaseOrder) {
        console.warn('Failed to update purchase order status', error);
        return null;
    }

    const row = data.purchaseOrder;
    return {
        id: row.id,
        companyId: row.company_id,
        projectId: row.project_id,
        supplierPartyId: row.supplier_party_id,
        supplierName: row.supplier_name ?? null,
        poNumber: row.po_number ?? '',
        orderDate: row.order_date ?? undefined,
        expectedDeliveryDate: row.expected_delivery_date ?? null,
        status: row.status ?? 'draft',
        subtotal: Number(row.subtotal ?? 0),
        taxAmount: Number(row.tax_amount ?? 0),
        totalAmount: Number(row.total_amount ?? 0),
        notes: row.notes ?? null,
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined,
        lineItems: Array.isArray(row.line_items ?? row.lineItems) ? (row.line_items ?? row.lineItems).map((line: any) => ({
            id: line.id,
            purchaseOrderId: line.purchase_order_id ?? row.id,
            description: line.description ?? '',
            quantity: Number(line.quantity ?? 0),
            unit: line.unit ?? null,
            rate: Number(line.rate ?? 0),
            lineAmount: Number(line.line_amount ?? line.lineAmount ?? 0),
            createdAt: line.created_at ?? undefined,
            updatedAt: line.updated_at ?? undefined,
        })) : [],
    };
}

export async function cancelPurchaseOrder(id: string): Promise<PurchaseOrderRecord | null> {
    const { data, error } = await apiPost<{ purchaseOrder?: any }>(`/api/project-purchase-orders/${id}/cancel`, {});
    if (error || !data?.purchaseOrder) {
        console.warn('Failed to cancel purchase order', error);
        return null;
    }

    const row = data.purchaseOrder;
    return {
        id: row.id,
        companyId: row.company_id,
        projectId: row.project_id,
        supplierPartyId: row.supplier_party_id,
        supplierName: row.supplier_name ?? null,
        poNumber: row.po_number ?? '',
        orderDate: row.order_date ?? undefined,
        expectedDeliveryDate: row.expected_delivery_date ?? null,
        status: row.status ?? 'cancelled',
        subtotal: Number(row.subtotal ?? 0),
        taxAmount: Number(row.tax_amount ?? 0),
        totalAmount: Number(row.total_amount ?? 0),
        notes: row.notes ?? null,
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined,
        lineItems: Array.isArray(row.line_items ?? row.lineItems) ? (row.line_items ?? row.lineItems).map((line: any) => ({
            id: line.id,
            purchaseOrderId: line.purchase_order_id ?? row.id,
            description: line.description ?? '',
            quantity: Number(line.quantity ?? 0),
            unit: line.unit ?? null,
            rate: Number(line.rate ?? 0),
            lineAmount: Number(line.line_amount ?? line.lineAmount ?? 0),
            createdAt: line.created_at ?? undefined,
            updatedAt: line.updated_at ?? undefined,
        })) : [],
    };
}

export async function listMaterialReceipts(projectId: string): Promise<MaterialReceiptRecord[]> {
    const { data, error } = await apiGet<{ materialReceipts?: any[] }>(`/api/project-material-receipts?projectId=${encodeURIComponent(projectId)}`);
    if (error || !data?.materialReceipts) {
        console.warn('Failed to load material receipts', error);
        return [];
    }

    return (data.materialReceipts ?? []).map((row: any) => ({
        id: row.id,
        companyId: row.company_id,
        projectId: row.project_id,
        purchaseOrderId: row.purchase_order_id,
        supplierPartyId: row.supplier_party_id,
        receiptNumber: row.receipt_number ?? '',
        receiptDate: row.receipt_date ?? null,
        deliveryReferenceNumber: row.delivery_reference_number ?? null,
        notes: row.notes ?? null,
        status: row.status ?? 'draft',
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined,
        lineItems: Array.isArray(row.line_items ?? row.lineItems) ? (row.line_items ?? row.lineItems).map((line: any) => ({
            id: line.id,
            materialReceiptId: line.material_receipt_id ?? row.id,
            purchaseOrderLineId: line.purchase_order_line_id,
            purchaseOrderLineDescription: line.purchase_order_line_description ?? line.description ?? '',
            orderedQuantity: Number(line.ordered_quantity ?? 0),
            previouslyReceivedQuantity: Number(line.previously_received_quantity ?? 0),
            quantityReceived: Number(line.quantity_received ?? 0),
            acceptedQuantity: Number(line.accepted_quantity ?? 0),
            rejectedQuantity: Number(line.rejected_quantity ?? 0),
            remainingQuantity: Number(line.remaining_quantity ?? 0),
            notes: line.notes ?? null,
            createdAt: line.created_at ?? undefined,
            updatedAt: line.updated_at ?? undefined,
        })) : [],
    }));
}

export async function createMaterialReceipt(input: {
    projectId: string;
    purchaseOrderId: string;
    receiptNumber?: string;
    receiptDate?: string | null;
    deliveryReferenceNumber?: string | null;
    notes?: string | null;
    status?: MaterialReceiptStatus;
    lines: Array<{
        purchaseOrderLineId: string;
        acceptedQuantity: number;
        rejectedQuantity?: number;
        notes?: string | null;
    }>;
}): Promise<MaterialReceiptRecord | null> {
    const { data, error } = await apiPost<{ materialReceipt?: any }>('/api/project-material-receipts', {
        materialReceipt: {
            projectId: input.projectId,
            purchaseOrderId: input.purchaseOrderId,
            receiptNumber: input.receiptNumber,
            receiptDate: input.receiptDate ?? null,
            deliveryReferenceNumber: input.deliveryReferenceNumber ?? null,
            notes: input.notes ?? null,
            status: input.status ?? 'accepted',
            lines: input.lines.map((line) => ({
                purchaseOrderLineId: line.purchaseOrderLineId,
                acceptedQuantity: Number(line.acceptedQuantity ?? 0),
                rejectedQuantity: Number(line.rejectedQuantity ?? 0),
                notes: line.notes ?? null,
            })),
        },
    });

    if (error || !data?.materialReceipt) {
        console.warn('Failed to create material receipt', error);
        return null;
    }

    const row = data.materialReceipt;
    return {
        id: row.id,
        companyId: row.company_id,
        projectId: row.project_id,
        purchaseOrderId: row.purchase_order_id,
        supplierPartyId: row.supplier_party_id,
        receiptNumber: row.receipt_number ?? '',
        receiptDate: row.receipt_date ?? null,
        deliveryReferenceNumber: row.delivery_reference_number ?? null,
        notes: row.notes ?? null,
        status: row.status ?? 'draft',
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined,
        lineItems: Array.isArray(row.line_items ?? row.lineItems) ? (row.line_items ?? row.lineItems).map((line: any) => ({
            id: line.id,
            materialReceiptId: line.material_receipt_id ?? row.id,
            purchaseOrderLineId: line.purchase_order_line_id,
            purchaseOrderLineDescription: line.purchase_order_line_description ?? line.description ?? '',
            orderedQuantity: Number(line.ordered_quantity ?? 0),
            previouslyReceivedQuantity: Number(line.previously_received_quantity ?? 0),
            quantityReceived: Number(line.quantity_received ?? 0),
            acceptedQuantity: Number(line.accepted_quantity ?? 0),
            rejectedQuantity: Number(line.rejected_quantity ?? 0),
            remainingQuantity: Number(line.remaining_quantity ?? 0),
            notes: line.notes ?? null,
            createdAt: line.created_at ?? undefined,
            updatedAt: line.updated_at ?? undefined,
        })) : [],
    };
}

export async function deleteMaterialReceipt(id: string): Promise<boolean> {
    const { error } = await apiDelete<{ ok: boolean }>(`/api/project-material-receipts/${id}`);
    if (error) {
        console.warn('Failed to delete material receipt', error);
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

export async function createProjectExpensePaymentResult(input: {
    projectExpenseId: string;
    amount: number;
    paymentDate?: string | null;
    paymentMethodId?: string | null;
    paymentMethod?: ProjectReceiptPaymentMethod;
    referenceNumber?: string | null;
    notes?: string | null;
}): Promise<ServiceResult<ProjectExpensePaymentRecord>> {
    const base = toServiceResult(await apiPost<{ payment?: any }>('/api/project-expense-payments', {
        payment: {
            projectExpenseId: input.projectExpenseId,
            amount: Number(input.amount ?? 0),
            paymentDate: input.paymentDate ?? null,
            paymentMethodId: input.paymentMethodId ?? null,
            paymentMethod: input.paymentMethod ?? 'cash',
            referenceNumber: input.referenceNumber ?? null,
            notes: input.notes ?? null,
        },
    }));

    if (!base.ok || !base.data?.payment) {
        console.warn('Failed to create project expense payment', base.ok ? undefined : base.error);
        return {
            ok: false,
            error: base.ok ? 'We could not record this supplier payment right now. Please try again.' : base.error,
            status: base.status,
        };
    }

    return { ok: true, data: mapExpensePaymentRow(base.data.payment), status: base.status };
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
    const result = await createProjectExpensePaymentResult(input);
    return result.ok ? result.data : null;
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
    const result = await createProjectInvestorResult(input);
    return result.ok ? result.data : null;
}

export async function createProjectInvestorResult(input: Omit<ProjectInvestorRecord, 'id' | 'companyId'>): Promise<ServiceResult<ProjectInvestorRecord>> {
    const base = toServiceResult(await apiPost<{ investor?: any }>('/api/project-investors', { investor: input }));
    if (!base.ok || !base.data?.investor) {
        console.warn('Failed to create project investor', base.ok ? undefined : base.error);
        return {
            ok: false,
            error: base.ok ? 'Could not grant investor access right now. Please try again.' : base.error,
            status: base.status,
        };
    }
    return { ok: true, data: mapInvestorRow(base.data.investor), status: base.status };
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
    const result = await deleteProjectInvestorResult(id);
    return result.ok;
}

export async function deleteProjectInvestorResult(id: string): Promise<ServiceResult<true>> {
    const base = toServiceResult(await apiDelete<{ ok: boolean }>(`/api/project-investors/${id}`));
    if (!base.ok) {
        console.warn('Failed to delete project investor', base.error);
        return { ok: false, error: base.error, status: base.status };
    }
    return { ok: true, data: true, status: base.status };
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
    const result = await createProjectClientAccessResult(input);
    return result.ok ? result.data : null;
}

export async function createProjectClientAccessResult(input: {
    projectId: string;
    email: string;
    invitationStatus?: 'pending' | 'accepted' | 'revoked' | 'expired';
    invitationExpiresAt?: string | null;
}): Promise<ServiceResult<ProjectClientAccessRecord>> {
    const base = toServiceResult(await apiPost<{ access?: any }>('/api/project-client-access', {
        access: input,
    }));
    if (!base.ok || !base.data?.access) {
        console.warn('Failed to create project client access', base.ok ? undefined : base.error);
        return {
            ok: false,
            error: base.ok ? 'Could not grant customer access right now. Please try again.' : base.error,
            status: base.status,
        };
    }
    return { ok: true, data: mapClientAccessRow(base.data.access), status: base.status };
}

export async function revokeProjectClientAccess(id: string): Promise<boolean> {
    const result = await revokeProjectClientAccessResult(id);
    return result.ok;
}

export async function revokeProjectClientAccessResult(id: string): Promise<ServiceResult<true>> {
    const base = toServiceResult(await apiDelete<{ ok: boolean }>(`/api/project-client-access/${id}`));
    if (!base.ok) {
        console.warn('Failed to revoke project client access', base.error);
        return { ok: false, error: base.error, status: base.status };
    }
    return { ok: true, data: true, status: base.status };
}
