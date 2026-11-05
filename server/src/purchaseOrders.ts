import { supabaseAdmin } from './auth.js';

export type PurchaseOrderStatus = 'draft' | 'approved' | 'cancelled' | 'closed';

export interface PurchaseOrderLineRecord {
    id: string;
    purchaseOrderId: string;
    description: string;
    quantity: number;
    unit: string | null;
    rate: number;
    lineAmount: number;
    createdAt: string;
    updatedAt: string;
}

export interface PurchaseOrderRecord {
    id: string;
    companyId: string;
    projectId: string;
    supplierPartyId: string;
    supplierName: string | null;
    poNumber: string;
    orderDate: string;
    expectedDeliveryDate: string | null;
    status: PurchaseOrderStatus;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    lineItems: PurchaseOrderLineRecord[];
}

const PURCHASE_ORDER_STATUS_VALUES: PurchaseOrderStatus[] = ['draft', 'approved', 'cancelled', 'closed'];

function roundMoney(value: number): number {
    return Number(Number(value ?? 0).toFixed(2));
}

function normalizeStatus(value: unknown): PurchaseOrderStatus {
    return PURCHASE_ORDER_STATUS_VALUES.includes(value as PurchaseOrderStatus)
        ? (value as PurchaseOrderStatus)
        : 'draft';
}

function normalizeLineAmount(quantity: unknown, rate: unknown): number {
    return roundMoney(Number(quantity ?? 0) * Number(rate ?? 0));
}

function mapLineRow(row: any): PurchaseOrderLineRecord {
    return {
        id: row.id,
        purchaseOrderId: row.purchase_order_id,
        description: row.description ?? '',
        quantity: Number(row.quantity ?? 0),
        unit: row.unit ?? null,
        rate: Number(row.rate ?? 0),
        lineAmount: Number(row.line_amount ?? 0),
        createdAt: row.created_at ?? '',
        updatedAt: row.updated_at ?? '',
    };
}

function mapPurchaseOrderRow(row: any, lines: PurchaseOrderLineRecord[] = []): PurchaseOrderRecord {
    return {
        id: row.id,
        companyId: row.company_id,
        projectId: row.project_id,
        supplierPartyId: row.supplier_party_id,
        supplierName: row.supplier_name ?? row.supplier_party_name ?? null,
        poNumber: row.po_number ?? '',
        orderDate: row.order_date ?? '',
        expectedDeliveryDate: row.expected_delivery_date ?? null,
        status: normalizeStatus(row.status),
        subtotal: Number(row.subtotal ?? 0),
        taxAmount: Number(row.tax_amount ?? 0),
        totalAmount: Number(row.total_amount ?? 0),
        notes: row.notes ?? null,
        createdAt: row.created_at ?? '',
        updatedAt: row.updated_at ?? '',
        lineItems: lines,
    };
}

async function validateProjectInCompany(projectId: string, companyId: string) {
    const { data, error } = await supabaseAdmin
        .from('projects')
        .select('id, company_id')
        .eq('id', projectId)
        .eq('company_id', companyId)
        .maybeSingle();

    if (error) throw error;
    if (!data) {
        const err: any = new Error('Project not found for this company.');
        err.statusCode = 404;
        throw err;
    }
    return data;
}

async function validateSupplierPartyForCompany(companyId: string, supplierPartyId: string | null | undefined) {
    if (!supplierPartyId) {
        const err: any = new Error('Supplier is required.');
        err.statusCode = 400;
        throw err;
    }

    const { data, error } = await supabaseAdmin
        .from('parties')
        .select('id, company_id, name, is_supplier, is_active, is_deleted')
        .eq('id', supplierPartyId)
        .maybeSingle();

    if (error) throw error;
    if (!data) {
        const err: any = new Error('Supplier contact not found.');
        err.statusCode = 404;
        throw err;
    }
    if (data.company_id !== companyId) {
        const err: any = new Error('Supplier contact belongs to a different company.');
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

function sanitizeLines(lines: unknown): Array<{ description: string; quantity: number; unit: string | null; rate: number }> {
    const source = Array.isArray(lines) ? lines : [];
    return source.map((entry) => {
        const item = entry as Record<string, unknown>;
        const description = String(item?.description ?? '').trim();
        const quantity = Number(item?.quantity ?? 0);
        const unit = item?.unit === undefined || item?.unit === null ? null : String(item.unit).trim() || null;
        const rate = Number(item?.rate ?? 0);

        if (!description) {
            const err: any = new Error('Each purchase order line requires a description.');
            err.statusCode = 400;
            throw err;
        }
        if (!Number.isFinite(quantity) || quantity < 0) {
            const err: any = new Error('Each purchase order line quantity must be zero or greater.');
            err.statusCode = 400;
            throw err;
        }
        if (!Number.isFinite(rate) || rate < 0) {
            const err: any = new Error('Each purchase order line rate must be zero or greater.');
            err.statusCode = 400;
            throw err;
        }

        return {
            description,
            quantity,
            unit,
            rate,
        };
    });
}

export async function listPurchaseOrdersForProject(projectId: string, companyId: string): Promise<PurchaseOrderRecord[]> {
    await validateProjectInCompany(projectId, companyId);

    const { data: orders, error } = await supabaseAdmin
        .from('purchase_orders')
        .select('*, parties:supplier_party_id(id, name)')
        .eq('project_id', projectId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    if (!orders || orders.length === 0) return [];

    const orderIds = orders.map((row) => row.id);
    const { data: linesData, error: linesError } = await supabaseAdmin
        .from('purchase_order_lines')
        .select('*')
        .in('purchase_order_id', orderIds)
        .order('created_at', { ascending: true });

    if (linesError) throw linesError;

    const linesByOrder = new Map<string, PurchaseOrderLineRecord[]>();
    for (const row of linesData ?? []) {
        const normalized = mapLineRow(row);
        const current = linesByOrder.get(row.purchase_order_id) ?? [];
        current.push(normalized);
        linesByOrder.set(row.purchase_order_id, current);
    }

    return (orders ?? []).map((row) => {
        const supplierName = Array.isArray(row.parties)
            ? row.parties[0]?.name ?? null
            : row.parties?.name ?? null;
        return mapPurchaseOrderRow({ ...row, supplier_name: supplierName }, linesByOrder.get(row.id) ?? []);
    });
}

export async function getPurchaseOrderById(id: string, companyId?: string) {
    const query = supabaseAdmin
        .from('purchase_orders')
        .select('*, parties:supplier_party_id(id, name)')
        .eq('id', id)
        .maybeSingle();

    const { data, error } = await query;
    if (error) throw error;
    if (!data) return null;

    if (companyId && data.company_id !== companyId) {
        const err: any = new Error('This purchase order belongs to a different company.');
        err.statusCode = 403;
        throw err;
    }

    const { data: linesData, error: linesError } = await supabaseAdmin
        .from('purchase_order_lines')
        .select('*')
        .eq('purchase_order_id', id)
        .order('created_at', { ascending: true });

    if (linesError) throw linesError;
    const supplierName = Array.isArray(data.parties)
        ? data.parties[0]?.name ?? null
        : data.parties?.name ?? null;

    return mapPurchaseOrderRow({ ...data, supplier_name: supplierName }, (linesData ?? []).map(mapLineRow));
}

export async function createPurchaseOrderForProject(projectId: string, companyId: string, payload: any) {
    const project = await validateProjectInCompany(projectId, companyId);
    const supplier = await validateSupplierPartyForCompany(companyId, payload?.supplierPartyId ?? payload?.supplier_party_id ?? null);
    const lines = sanitizeLines(payload?.lines ?? payload?.lineItems ?? payload?.items ?? []);

    if (lines.length === 0) {
        const err: any = new Error('At least one line item is required for a purchase order.');
        err.statusCode = 400;
        throw err;
    }

    const poNumber = String(payload?.poNumber ?? payload?.po_number ?? '').trim() || `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const orderDate = payload?.orderDate ?? payload?.order_date ?? new Date().toISOString().slice(0, 10);
    const expectedDeliveryDate = payload?.expectedDeliveryDate ?? payload?.expected_delivery_date ?? null;
    const notes = payload?.notes ?? null;
    const status = normalizeStatus(payload?.status ?? 'draft');
    const taxAmount = roundMoney(Number(payload?.taxAmount ?? payload?.tax_amount ?? 0));
    const subtotal = roundMoney(lines.reduce((sum, line) => sum + normalizeLineAmount(line.quantity, line.rate), 0));
    const totalAmount = roundMoney(subtotal + taxAmount);

    const { data: poData, error: poError } = await supabaseAdmin
        .from('purchase_orders')
        .insert({
            company_id: companyId,
            project_id: project.id,
            supplier_party_id: supplier.id,
            po_number: poNumber,
            order_date: orderDate,
            expected_delivery_date: expectedDeliveryDate,
            status,
            subtotal,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            notes,
        })
        .select('*')
        .single();

    if (poError) throw poError;

    const lineRows = lines.map((line) => ({
        purchase_order_id: poData.id,
        description: line.description,
        quantity: Number(line.quantity ?? 0),
        unit: line.unit ?? null,
        rate: Number(line.rate ?? 0),
        line_amount: normalizeLineAmount(line.quantity, line.rate),
    }));

    const { data: lineData, error: lineError } = await supabaseAdmin
        .from('purchase_order_lines')
        .insert(lineRows)
        .select('*');

    if (lineError) throw lineError;

    return mapPurchaseOrderRow({
        ...poData,
        supplier_name: supplier.name,
    }, (lineData ?? []).map(mapLineRow));
}

export async function updatePurchaseOrderForProject(id: string, companyId: string, payload: any) {
    const existing = await getPurchaseOrderById(id, companyId);
    if (!existing) {
        const err: any = new Error('Purchase order not found.');
        err.statusCode = 404;
        throw err;
    }

    if (existing.status !== 'draft') {
        const err: any = new Error('Only draft purchase orders can be updated.');
        err.statusCode = 400;
        throw err;
    }

    const supplierPartyId = payload?.supplierPartyId ?? payload?.supplier_party_id ?? existing.supplierPartyId;
    const supplier = await validateSupplierPartyForCompany(companyId, supplierPartyId);
    const lines = sanitizeLines(payload?.lines ?? payload?.lineItems ?? payload?.items ?? existing.lineItems);

    const orderDate = payload?.orderDate ?? payload?.order_date ?? existing.orderDate;
    const expectedDeliveryDate = payload?.expectedDeliveryDate ?? payload?.expected_delivery_date ?? existing.expectedDeliveryDate;
    const notes = payload?.notes !== undefined ? (payload.notes ?? null) : existing.notes;
    const nextStatus = payload?.status !== undefined ? normalizeStatus(payload.status) : existing.status;
    const taxAmount = roundMoney(Number(payload?.taxAmount ?? payload?.tax_amount ?? existing.taxAmount ?? 0));
    const subtotal = roundMoney(lines.reduce((sum, line) => sum + normalizeLineAmount(line.quantity, line.rate), 0));
    const totalAmount = roundMoney(subtotal + taxAmount);

    const { data: updatedOrder, error: updateError } = await supabaseAdmin
        .from('purchase_orders')
        .update({
            supplier_party_id: supplier.id,
            po_number: String(payload?.poNumber ?? payload?.po_number ?? existing.poNumber ?? '').trim() || existing.poNumber,
            order_date: orderDate,
            expected_delivery_date: expectedDeliveryDate,
            status: nextStatus,
            subtotal,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            notes,
        })
        .eq('id', id)
        .select('*')
        .single();

    if (updateError) throw updateError;

    const { error: deleteError } = await supabaseAdmin
        .from('purchase_order_lines')
        .delete()
        .eq('purchase_order_id', id);

    if (deleteError) throw deleteError;

    const lineRows = lines.map((line) => ({
        purchase_order_id: id,
        description: line.description,
        quantity: Number(line.quantity ?? 0),
        unit: line.unit ?? null,
        rate: Number(line.rate ?? 0),
        line_amount: normalizeLineAmount(line.quantity, line.rate),
    }));

    const { data: updatedLines, error: linesError } = await supabaseAdmin
        .from('purchase_order_lines')
        .insert(lineRows)
        .select('*');

    if (linesError) throw linesError;

    return mapPurchaseOrderRow({
        ...updatedOrder,
        supplier_name: supplier.name,
    }, (updatedLines ?? []).map(mapLineRow));
}

export async function updatePurchaseOrderStatus(id: string, companyId: string, status: unknown) {
    const normalizedStatus = normalizeStatus(status);
    const existing = await getPurchaseOrderById(id, companyId);
    if (!existing) {
        const err: any = new Error('Purchase order not found.');
        err.statusCode = 404;
        throw err;
    }

    const { data, error } = await supabaseAdmin
        .from('purchase_orders')
        .update({ status: normalizedStatus })
        .eq('id', id)
        .select('*')
        .single();

    if (error) throw error;
    return { ...existing, status: normalizedStatus, updatedAt: data.updated_at ?? existing.updatedAt };
}

export async function cancelPurchaseOrder(id: string, companyId: string) {
    const existing = await getPurchaseOrderById(id, companyId);
    if (!existing) {
        const err: any = new Error('Purchase order not found.');
        err.statusCode = 404;
        throw err;
    }

    const { data, error } = await supabaseAdmin
        .from('purchase_orders')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select('*')
        .single();

    if (error) throw error;
    return { ...existing, status: 'cancelled', updatedAt: data.updated_at ?? existing.updatedAt };
}
