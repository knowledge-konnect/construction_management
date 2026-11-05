import { supabaseAdmin } from './auth.js';
import type { PurchaseOrderStatus } from './purchaseOrders.js';

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
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface MaterialReceiptRecord {
    id: string;
    companyId: string;
    projectId: string;
    purchaseOrderId: string;
    supplierPartyId: string;
    receiptNumber: string;
    receiptDate: string;
    deliveryReferenceNumber: string | null;
    notes: string | null;
    status: MaterialReceiptStatus;
    createdAt: string;
    updatedAt: string;
    lineItems: MaterialReceiptLineRecord[];
}

const MATERIAL_RECEIPT_STATUS_VALUES: MaterialReceiptStatus[] = ['draft', 'accepted', 'rejected'];

function roundQty(value: number): number {
    return Number(Number(value ?? 0).toFixed(4));
}

function normalizeMaterialReceiptStatus(value: unknown): MaterialReceiptStatus {
    return MATERIAL_RECEIPT_STATUS_VALUES.includes(value as MaterialReceiptStatus)
        ? (value as MaterialReceiptStatus)
        : 'draft';
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

async function getPurchaseOrderForProject(projectId: string, companyId: string, purchaseOrderId: string) {
    const { data, error } = await supabaseAdmin
        .from('purchase_orders')
        .select('*')
        .eq('id', purchaseOrderId)
        .maybeSingle();

    if (error) throw error;
    if (!data) {
        const err: any = new Error('Purchase order not found.');
        err.statusCode = 404;
        throw err;
    }
    if (data.company_id !== companyId) {
        const err: any = new Error('This purchase order belongs to a different company.');
        err.statusCode = 403;
        throw err;
    }
    if (data.project_id !== projectId) {
        const err: any = new Error('This purchase order does not belong to the selected project.');
        err.statusCode = 400;
        throw err;
    }
    if (data.status === 'cancelled') {
        const err: any = new Error('Cannot create a material receipt against a cancelled purchase order.');
        err.statusCode = 400;
        throw err;
    }

    return data;
}

async function getPurchaseOrderLineForOrder(purchaseOrderId: string, purchaseOrderLineId: string) {
    const { data, error } = await supabaseAdmin
        .from('purchase_order_lines')
        .select('*')
        .eq('id', purchaseOrderLineId)
        .eq('purchase_order_id', purchaseOrderId)
        .maybeSingle();

    if (error) throw error;
    if (!data) {
        const err: any = new Error('Selected purchase order line does not belong to this purchase order.');
        err.statusCode = 400;
        throw err;
    }

    return data;
}

async function getPreviousLineTotalsByPurchaseOrderLine(purchaseOrderLineIds: string[]) {
    if (!purchaseOrderLineIds.length) return new Map<string, { accepted: number; rejected: number; received: number }>();

    const { data, error } = await supabaseAdmin
        .from('material_receipt_lines')
        .select('purchase_order_line_id, accepted_quantity, rejected_quantity, quantity_received')
        .in('purchase_order_line_id', purchaseOrderLineIds);

    if (error) throw error;

    const totals = new Map<string, { accepted: number; rejected: number; received: number }>();
    for (const row of data ?? []) {
        const current = totals.get(row.purchase_order_line_id) ?? { accepted: 0, rejected: 0, received: 0 };
        current.accepted += Number(row.accepted_quantity ?? 0);
        current.rejected += Number(row.rejected_quantity ?? 0);
        current.received += Number(row.quantity_received ?? 0);
        totals.set(row.purchase_order_line_id, current);
    }

    return totals;
}

async function refreshPurchaseOrderReceiptStatus(purchaseOrderId: string) {
    const { data: lines, error: linesError } = await supabaseAdmin
        .from('purchase_order_lines')
        .select('id, quantity')
        .eq('purchase_order_id', purchaseOrderId);

    if (linesError) throw linesError;
    if (!lines || !lines.length) {
        await supabaseAdmin.from('purchase_orders').update({ status: 'approved' }).eq('id', purchaseOrderId);
        return;
    }

    const lineIds = lines.map((line) => line.id);
    const { data: deliveredRows, error: deliveredError } = await supabaseAdmin
        .from('material_receipt_lines')
        .select('purchase_order_line_id, accepted_quantity')
        .in('purchase_order_line_id', lineIds);

    if (deliveredError) throw deliveredError;

    const acceptedTotal = (deliveredRows ?? []).reduce((sum, row) => sum + Number(row.accepted_quantity ?? 0), 0);
    const orderedTotal = lines.reduce((sum, line) => sum + Number(line.quantity ?? 0), 0);

    let nextStatus: PurchaseOrderStatus = 'approved';
    if (orderedTotal > 0 && acceptedTotal >= orderedTotal) {
        nextStatus = 'closed';
    }

    const { error: updateError } = await supabaseAdmin
        .from('purchase_orders')
        .update({ status: nextStatus })
        .eq('id', purchaseOrderId);

    if (updateError) throw updateError;
}

function mapLineRow(row: any): MaterialReceiptLineRecord {
    return {
        id: row.id,
        materialReceiptId: row.material_receipt_id,
        purchaseOrderLineId: row.purchase_order_line_id,
        purchaseOrderLineDescription: row.purchase_order_line_description ?? row.description ?? '',
        orderedQuantity: Number(row.ordered_quantity ?? 0),
        previouslyReceivedQuantity: Number(row.previously_received_quantity ?? 0),
        quantityReceived: Number(row.quantity_received ?? 0),
        acceptedQuantity: Number(row.accepted_quantity ?? 0),
        rejectedQuantity: Number(row.rejected_quantity ?? 0),
        remainingQuantity: Number(row.remaining_quantity ?? 0),
        notes: row.notes ?? null,
        createdAt: row.created_at ?? '',
        updatedAt: row.updated_at ?? '',
    };
}

function mapReceiptRow(row: any, lines: MaterialReceiptLineRecord[] = []): MaterialReceiptRecord {
    return {
        id: row.id,
        companyId: row.company_id,
        projectId: row.project_id,
        purchaseOrderId: row.purchase_order_id,
        supplierPartyId: row.supplier_party_id,
        receiptNumber: row.receipt_number ?? '',
        receiptDate: row.receipt_date ?? '',
        deliveryReferenceNumber: row.delivery_reference_number ?? null,
        notes: row.notes ?? null,
        status: normalizeMaterialReceiptStatus(row.status),
        createdAt: row.created_at ?? '',
        updatedAt: row.updated_at ?? '',
        lineItems: lines,
    };
}

export async function listMaterialReceiptsForProject(projectId: string, companyId: string): Promise<MaterialReceiptRecord[]> {
    await validateProjectInCompany(projectId, companyId);

    const { data: receipts, error } = await supabaseAdmin
        .from('material_receipts')
        .select('*')
        .eq('project_id', projectId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    if (!receipts || !receipts.length) return [];

    const receiptIds = receipts.map((row) => row.id);
    const { data: receiptLines, error: linesError } = await supabaseAdmin
        .from('material_receipt_lines')
        .select('*, purchase_order_lines!purchase_order_line_id(description)')
        .in('material_receipt_id', receiptIds)
        .order('created_at', { ascending: true });

    if (linesError) throw linesError;

    const linesByReceipt = new Map<string, MaterialReceiptLineRecord[]>();
    for (const row of receiptLines ?? []) {
        const current = linesByReceipt.get(row.material_receipt_id) ?? [];
        current.push(mapLineRow({
            ...row,
            purchase_order_line_description: Array.isArray(row.purchase_order_lines)
                ? row.purchase_order_lines[0]?.description ?? ''
                : row.purchase_order_lines?.description ?? '',
        }));
        linesByReceipt.set(row.material_receipt_id, current);
    }

    return (receipts ?? []).map((row) => mapReceiptRow(row, linesByReceipt.get(row.id) ?? []));
}

export async function getMaterialReceiptById(id: string, companyId?: string) {
    const { data, error } = await supabaseAdmin
        .from('material_receipts')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    if (companyId && data.company_id !== companyId) {
        const err: any = new Error('This material receipt belongs to a different company.');
        err.statusCode = 403;
        throw err;
    }

    const { data: receiptLines, error: linesError } = await supabaseAdmin
        .from('material_receipt_lines')
        .select('*, purchase_order_lines!purchase_order_line_id(description)')
        .eq('material_receipt_id', id)
        .order('created_at', { ascending: true });

    if (linesError) throw linesError;

    return mapReceiptRow(data, (receiptLines ?? []).map((row) => mapLineRow({
        ...row,
        purchase_order_line_description: Array.isArray(row.purchase_order_lines)
            ? row.purchase_order_lines[0]?.description ?? ''
            : row.purchase_order_lines?.description ?? '',
    })));
}

function normalizeMaterialReceiptPayload(payload: any) {
    const supplierPartyId = payload?.supplierPartyId ?? payload?.supplier_party_id ?? null;
    const receiptNumber = String(payload?.receiptNumber ?? payload?.receipt_number ?? '').trim();
    const receiptDate = payload?.receiptDate ?? payload?.receipt_date ?? new Date().toISOString().slice(0, 10);
    const deliveryReferenceNumber = payload?.deliveryReferenceNumber ?? payload?.delivery_reference_number ?? null;
    const notes = payload?.notes ?? null;
    const status = normalizeMaterialReceiptStatus(payload?.status ?? 'draft');

    return { supplierPartyId, receiptNumber, receiptDate, deliveryReferenceNumber, notes, status };
}

export async function createMaterialReceiptForProject(projectId: string, companyId: string, payload: any) {
    await validateProjectInCompany(projectId, companyId);
    const purchaseOrder = await getPurchaseOrderForProject(projectId, companyId, payload?.purchaseOrderId ?? payload?.purchase_order_id ?? '');
    const header = normalizeMaterialReceiptPayload(payload);

    if (!header.receiptNumber) {
        const err: any = new Error('Receipt number is required.');
        err.statusCode = 400;
        throw err;
    }

    const rawLines = Array.isArray(payload?.lines) ? payload.lines : Array.isArray(payload?.lineItems) ? payload.lineItems : [];
    if (!rawLines.length) {
        const err: any = new Error('At least one receipt line is required.');
        err.statusCode = 400;
        throw err;
    }

    const lineIds = rawLines.map((line: any) => String(line?.purchaseOrderLineId ?? line?.purchase_order_line_id ?? '')).filter(Boolean);
    if (!lineIds.length) {
        const err: any = new Error('Receipt lines must reference purchase order lines.');
        err.statusCode = 400;
        throw err;
    }

    const uniqueLineIds: string[] = Array.from(new Set(lineIds.map((lineId: string) => String(lineId).trim()).filter(Boolean)));
    const purchaseOrderLines = await Promise.all(uniqueLineIds.map(async (lineId) => getPurchaseOrderLineForOrder(purchaseOrder.id, lineId)));
    const lineMap = new Map<string, any>(purchaseOrderLines.map((line) => [line.id, line]));

    const previousTotals = await getPreviousLineTotalsByPurchaseOrderLine(uniqueLineIds);
    const receiptLines = [] as any[];

    for (const rawLine of rawLines) {
        const purchaseOrderLineId = String(rawLine?.purchaseOrderLineId ?? rawLine?.purchase_order_line_id ?? '').trim();
        const poLine = lineMap.get(purchaseOrderLineId);
        if (!poLine) {
            const err: any = new Error('Selected receipt line does not belong to the selected purchase order.');
            err.statusCode = 400;
            throw err;
        }

        const orderedQuantity = Number(poLine.quantity ?? 0);
        const previousTotalsForLine = previousTotals.get(purchaseOrderLineId) ?? { accepted: 0, rejected: 0, received: 0 };
        const acceptedQuantity = roundQty(Number(rawLine?.acceptedQuantity ?? rawLine?.accepted_quantity ?? rawLine?.quantityAccepted ?? rawLine?.quantity_received ?? 0));
        const rejectedQuantity = roundQty(Number(rawLine?.rejectedQuantity ?? rawLine?.rejected_quantity ?? 0));
        const quantityReceived = roundQty(acceptedQuantity + rejectedQuantity);

        if (acceptedQuantity <= 0 && rejectedQuantity <= 0) {
            const err: any = new Error('Each receipt line must have a positive accepted or rejected quantity.');
            err.statusCode = 400;
            throw err;
        }

        const totalAcceptedAfter = previousTotalsForLine.accepted + acceptedQuantity;
        const totalReceivedAfter = previousTotalsForLine.received + quantityReceived;
        if (totalAcceptedAfter > orderedQuantity) {
            const err: any = new Error('Accepted quantity cannot exceed the ordered quantity for a purchase order line.');
            err.statusCode = 400;
            throw err;
        }
        if (totalReceivedAfter > orderedQuantity) {
            const err: any = new Error('Total received quantity cannot exceed the ordered quantity for a purchase order line.');
            err.statusCode = 400;
            throw err;
        }

        const remainingQuantity = Math.max(0, roundQty(orderedQuantity - totalAcceptedAfter));
        receiptLines.push({
            purchase_order_line_id: purchaseOrderLineId,
            description: poLine.description,
            ordered_quantity: orderedQuantity,
            previously_received_quantity: previousTotalsForLine.received,
            quantity_received: quantityReceived,
            accepted_quantity: acceptedQuantity,
            rejected_quantity: rejectedQuantity,
            remaining_quantity: remainingQuantity,
            notes: rawLine?.notes ?? null,
        });
    }

    const { data: receiptData, error: receiptError } = await supabaseAdmin
        .from('material_receipts')
        .insert({
            company_id: companyId,
            project_id: projectId,
            purchase_order_id: purchaseOrder.id,
            supplier_party_id: purchaseOrder.supplier_party_id,
            receipt_number: header.receiptNumber,
            receipt_date: header.receiptDate,
            delivery_reference_number: header.deliveryReferenceNumber,
            notes: header.notes,
            status: header.status === 'rejected' && !receiptLines.some((line) => Number(line.accepted_quantity ?? 0) > 0) ? 'rejected' : 'accepted',
        })
        .select('*')
        .single();

    if (receiptError) throw receiptError;

    const lineInsertPayload = receiptLines.map((line) => ({
        material_receipt_id: receiptData.id,
        purchase_order_line_id: line.purchase_order_line_id,
        ordered_quantity: line.ordered_quantity,
        previously_received_quantity: line.previously_received_quantity,
        quantity_received: line.quantity_received,
        accepted_quantity: line.accepted_quantity,
        rejected_quantity: line.rejected_quantity,
        remaining_quantity: line.remaining_quantity,
        notes: line.notes,
    }));

    const { data: rowData, error: lineError } = await supabaseAdmin
        .from('material_receipt_lines')
        .insert(lineInsertPayload)
        .select('*, purchase_order_lines!purchase_order_line_id(description)');

    if (lineError) throw lineError;

    await refreshPurchaseOrderReceiptStatus(purchaseOrder.id);

    return mapReceiptRow(receiptData, (rowData ?? []).map((row) => mapLineRow({
        ...row,
        purchase_order_line_description: Array.isArray(row.purchase_order_lines)
            ? row.purchase_order_lines[0]?.description ?? ''
            : row.purchase_order_lines?.description ?? '',
    })));
}

export async function deleteMaterialReceiptForProject(id: string, companyId: string) {
    const receipt = await getMaterialReceiptById(id, companyId);
    if (!receipt) {
        const err: any = new Error('Material receipt not found.');
        err.statusCode = 404;
        throw err;
    }

    const { error } = await supabaseAdmin.from('material_receipts').delete().eq('id', id);
    if (error) throw error;

    await refreshPurchaseOrderReceiptStatus(receipt.purchaseOrderId);
    return true;
}
