import { supabaseAdmin } from './auth.js';
import { getCompanyById } from './company.js';

export type InvoiceStatus = 'Draft' | 'Issued' | 'Cancelled';
export type InvoiceSupplyType = 'intra_state' | 'inter_state';
export type InvoiceTaxTreatment = 'taxable' | 'zero_rated' | 'exempt' | 'nil_rated' | 'non_gst';

export interface InvoiceItemInput {
    id?: string | null;
    description?: string | null;
    quantity?: number | string | null;
    unit?: string | null;
    rate?: number | string | null;
    tax_percentage?: number | string | null;
    tax_amount?: number | string | null;
    total_amount?: number | string | null;
    display_order?: number | null;
    hsn_sac_code?: string | null;
    tax_treatment?: InvoiceTaxTreatment | string | null;
    cgst_rate?: number | string | null;
    sgst_rate?: number | string | null;
    igst_rate?: number | string | null;
    cgst_amount?: number | string | null;
    sgst_amount?: number | string | null;
    igst_amount?: number | string | null;
}

export interface InvoicePayload {
    company_id?: string | null;
    project_id?: string | null;
    customer_id?: string | null;
    invoice_number?: string | null;
    invoice_date?: string | null;
    due_date?: string | null;
    status?: InvoiceStatus | string | null;
    notes?: string | null;
    is_gst_invoice?: boolean;
    tax_inclusive?: boolean;
    supplier_gstin_snapshot?: string | null;
    supplier_state_code_snapshot?: string | null;
    customer_gstin_snapshot?: string | null;
    customer_state_code_snapshot?: string | null;
    place_of_supply_state_code?: string | null;
    supply_type?: InvoiceSupplyType | string | null;
    reverse_charge?: boolean;
    discount_amount?: number | string | null;
    discount_percentage?: number | string | null;
    items?: InvoiceItemInput[];
}

export interface InvoiceFinancialSummary {
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    grand_total: number;
    cgst_amount: number;
    sgst_amount: number;
    igst_amount: number;
    cgst_rate: number;
    sgst_rate: number;
    igst_rate: number;
    tax_breakup: Record<string, unknown>;
}

export interface InvoiceComputedLine {
    description: string;
    quantity: number;
    unit: string | null;
    rate: number;
    tax_percentage: number;
    tax_amount: number;
    total_amount: number;
    display_order: number;
    hsn_sac_code: string | null;
    tax_treatment: InvoiceTaxTreatment;
    cgst_rate: number;
    sgst_rate: number;
    igst_rate: number;
    cgst_amount: number;
    sgst_amount: number;
    igst_amount: number;
    taxable_amount: number;
}

export interface InvoiceComputationResult {
    financials: InvoiceFinancialSummary;
    lines: InvoiceComputedLine[];
}

const VALID_INVOICE_STATUSES: InvoiceStatus[] = ['Draft', 'Issued', 'Cancelled'];
const VALID_TAX_TREATMENTS: InvoiceTaxTreatment[] = ['taxable', 'zero_rated', 'exempt', 'nil_rated', 'non_gst'];
const VALID_SUPPLY_TYPES: InvoiceSupplyType[] = ['intra_state', 'inter_state'];

function parseNumber(value: unknown, fallback = 0): number {
    if (value === null || value === undefined || value === '') return fallback;
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function roundCurrency(value: number): number {
    return Number(Math.round((value + Number.EPSILON) * 100) / 100);
}

function getItemsSubtotal(items: InvoiceItemInput[] = []): number {
    return items.reduce((sum, item) => {
        const quantity = Math.max(0, parseNumber(item?.quantity, 0));
        const rate = Math.max(0, parseNumber(item?.rate, 0));
        return sum + quantity * rate;
    }, 0);
}

export function resolveInvoiceDiscountInputs(input: {
    existingDiscountAmount?: unknown;
    existingDiscountPercentage?: unknown;
    payloadDiscountAmount?: unknown;
    payloadDiscountPercentage?: unknown;
}) {
    const discountAmount = input.payloadDiscountAmount !== undefined
        ? parseNumber(input.payloadDiscountAmount, 0)
        : parseNumber(input.existingDiscountAmount, 0);
    const discountPercentage = input.payloadDiscountPercentage !== undefined
        ? parseNumber(input.payloadDiscountPercentage, 0)
        : parseNumber(input.existingDiscountPercentage, 0);
    return { discountAmount, discountPercentage };
}

function validateDiscountValues(discountAmount: number, discountPercentage: number, subtotalBeforeDiscount: number): string | null {
    if (discountAmount < 0) return 'Discount amount cannot be negative.';
    if (discountPercentage < 0 || discountPercentage > 100) return 'Discount percentage must be between 0 and 100.';

    if (discountPercentage <= 0 && discountAmount > subtotalBeforeDiscount) {
        return 'Discount amount cannot exceed subtotal.';
    }

    const percentageDiscount = subtotalBeforeDiscount * (discountPercentage / 100);
    if (discountPercentage > 0 && percentageDiscount > subtotalBeforeDiscount) {
        return 'Discount percentage cannot exceed subtotal.';
    }

    return null;
}

export function mergeInvoiceForValidation(existing: any, payload: Partial<InvoicePayload>) {
    return {
        ...existing,
        ...payload,
        customer_id: payload.customer_id !== undefined ? payload.customer_id : existing?.customer_id,
        items: payload.items !== undefined ? payload.items : existing?.items,
    };
}

function financialYear(date: Date = new Date()): number {
    const month = date.getMonth();
    const year = date.getFullYear();
    return month >= 3 ? year : year - 1;
}

function normalizeTaxTreatment(value: unknown): InvoiceTaxTreatment {
    return VALID_TAX_TREATMENTS.includes((value as InvoiceTaxTreatment) ?? '') ? (value as InvoiceTaxTreatment) : 'taxable';
}

export function normalizeInvoiceStatus(value: unknown): InvoiceStatus {
    return VALID_INVOICE_STATUSES.includes(value as InvoiceStatus) ? (value as InvoiceStatus) : 'Draft';
}

export function normalizeInvoiceSupplyType(value: unknown): InvoiceSupplyType | null {
    return VALID_SUPPLY_TYPES.includes(value as InvoiceSupplyType) ? (value as InvoiceSupplyType) : null;
}

export async function getCompanyInvoicePrefix(companyId: string): Promise<string> {
    const company = await getCompanyById(companyId);
    const settings = Array.isArray(company?.company_settings) ? company.company_settings[0] : company?.company_settings;
    return settings?.invoice_prefix || 'INV';
}

export async function peekNextInvoiceNumber(companyId: string): Promise<string> {
    const year = financialYear();

    const { data, error } = await supabaseAdmin
        .from('document_sequences')
        .select('prefix, next_number')
        .eq('company_id', companyId)
        .eq('document_type', 'Invoice')
        .eq('financial_year', year)
        .maybeSingle();

    if (error) throw error;
    if (data) {
        const nextNumber = Number(data.next_number ?? 1);
        return `${data.prefix}/${year}/${String(nextNumber).padStart(3, '0')}`;
    }

    const prefix = await getCompanyInvoicePrefix(companyId);
    return `${prefix}/${year}/001`;
}

export async function allocateInvoiceNumber(companyId: string): Promise<string> {
    const year = financialYear();

    for (let attempt = 0; attempt < 8; attempt += 1) {
        const { data: existing, error: selectError } = await supabaseAdmin
            .from('document_sequences')
            .select('id, prefix, next_number')
            .eq('company_id', companyId)
            .eq('document_type', 'Invoice')
            .eq('financial_year', year)
            .maybeSingle();

        if (selectError) throw selectError;

        if (!existing) {
            const prefix = await getCompanyInvoicePrefix(companyId);
            const { data: inserted, error: insertError } = await supabaseAdmin
                .from('document_sequences')
                .insert({
                    company_id: companyId,
                    document_type: 'Invoice',
                    financial_year: year,
                    prefix,
                    next_number: 2,
                })
                .select('prefix')
                .single();

            if (!insertError && inserted) {
                return `${inserted.prefix}/${year}/001`;
            }
            continue;
        }

        const assigned = Number(existing.next_number ?? 1);
        const { data: updated, error: updateError } = await supabaseAdmin
            .from('document_sequences')
            .update({ next_number: assigned + 1 })
            .eq('id', existing.id)
            .eq('next_number', assigned)
            .select('prefix, next_number')
            .maybeSingle();

        if (updateError) throw updateError;
        if (updated) {
            return `${existing.prefix}/${year}/${String(assigned).padStart(3, '0')}`;
        }
    }

    throw new Error('Could not allocate an invoice number after several attempts.');
}

export function calculateInvoiceFinancials(
    items: InvoiceItemInput[] = [],
    options: {
        discountAmount?: unknown;
        discountPercentage?: unknown;
        taxInclusive?: boolean;
        supplyType?: unknown;
        defaultTaxRate?: unknown;
    } = {},
): InvoiceFinancialSummary {
    return computeInvoiceFinancials(items, options).financials;
}

export function computeInvoiceFinancials(
    items: InvoiceItemInput[] = [],
    options: {
        discountAmount?: unknown;
        discountPercentage?: unknown;
        taxInclusive?: boolean;
        supplyType?: unknown;
        defaultTaxRate?: unknown;
    } = {},
): InvoiceComputationResult {
    const itemRows = Array.isArray(items) ? items : [];
    const supplyType = normalizeInvoiceSupplyType(options.supplyType);
    const isTaxInclusive = Boolean(options.taxInclusive);

    const subtotalBeforeDiscount = getItemsSubtotal(itemRows);

    const discountAmountValue = parseNumber(options.discountAmount, 0);
    const discountPercentageValue = parseNumber(options.discountPercentage, 0);
    let discountAmount = Math.max(0, discountAmountValue);
    if (discountPercentageValue > 0 && subtotalBeforeDiscount > 0) {
        discountAmount = subtotalBeforeDiscount * (discountPercentageValue / 100);
    }

    if (discountAmount > subtotalBeforeDiscount) {
        throw new Error('Discount amount cannot exceed subtotal.');
    }

    const subtotalAfterDiscountGross = Math.max(0, subtotalBeforeDiscount - discountAmount);
    const discountScale = subtotalBeforeDiscount > 0 ? subtotalAfterDiscountGross / subtotalBeforeDiscount : 0;

    const lines: InvoiceComputedLine[] = itemRows.map((item, index) => {
        const quantity = Math.max(0, parseNumber(item?.quantity, 0));
        const rate = Math.max(0, parseNumber(item?.rate, 0));
        const lineGrossBeforeDiscount = quantity * rate;
        const lineGrossAfterDiscount = lineGrossBeforeDiscount * discountScale;

        const taxTreatment = normalizeTaxTreatment(item?.tax_treatment ?? 'taxable');
        const isTaxable = taxTreatment === 'taxable';
        const requestedRate = Math.max(0, parseNumber(item?.tax_percentage ?? options.defaultTaxRate ?? 0, 0));
        const taxRate = isTaxable ? requestedRate : 0;

        let taxableAmountRaw = lineGrossAfterDiscount;
        let taxAmountRaw = 0;

        if (taxRate > 0) {
            if (isTaxInclusive) {
                taxableAmountRaw = lineGrossAfterDiscount / (1 + taxRate / 100);
                taxAmountRaw = lineGrossAfterDiscount - taxableAmountRaw;
            } else {
                taxAmountRaw = taxableAmountRaw * (taxRate / 100);
            }
        }

        const taxableAmount = roundCurrency(Math.max(0, taxableAmountRaw));
        const taxAmount = roundCurrency(Math.max(0, taxAmountRaw));
        const totalAmount = roundCurrency(taxableAmount + taxAmount);

        let cgstRate = 0;
        let sgstRate = 0;
        let igstRate = 0;
        let cgstAmount = 0;
        let sgstAmount = 0;
        let igstAmount = 0;

        if (taxAmount > 0 && supplyType === 'intra_state') {
            cgstRate = roundCurrency(taxRate / 2);
            sgstRate = roundCurrency(taxRate - cgstRate);
            cgstAmount = roundCurrency(taxAmount / 2);
            sgstAmount = roundCurrency(taxAmount - cgstAmount);
        } else if (taxAmount > 0 && supplyType === 'inter_state') {
            igstRate = roundCurrency(taxRate);
            igstAmount = taxAmount;
        }

        return {
            description: String(item?.description ?? '').trim(),
            quantity,
            unit: item?.unit ?? null,
            rate,
            tax_percentage: roundCurrency(taxRate),
            tax_amount: taxAmount,
            total_amount: totalAmount,
            display_order: Number(item?.display_order ?? index),
            hsn_sac_code: item?.hsn_sac_code ?? null,
            tax_treatment: taxTreatment,
            cgst_rate: cgstRate,
            sgst_rate: sgstRate,
            igst_rate: igstRate,
            cgst_amount: cgstAmount,
            sgst_amount: sgstAmount,
            igst_amount: igstAmount,
            taxable_amount: taxableAmount,
        };
    });

    const subtotal = roundCurrency(lines.reduce((sum, row) => sum + row.taxable_amount, 0));
    const taxAmount = roundCurrency(lines.reduce((sum, row) => sum + row.tax_amount, 0));
    const grandTotal = roundCurrency(subtotal + taxAmount);
    const cgstAmount = roundCurrency(lines.reduce((sum, row) => sum + row.cgst_amount, 0));
    const sgstAmount = roundCurrency(lines.reduce((sum, row) => sum + row.sgst_amount, 0));
    const igstAmount = roundCurrency(lines.reduce((sum, row) => sum + row.igst_amount, 0));

    const taxableRows = new Map<number, { taxable: number; tax: number; cgst: number; sgst: number; igst: number }>();
    for (const row of lines) {
        const key = row.tax_percentage;
        const bucket = taxableRows.get(key) ?? { taxable: 0, tax: 0, cgst: 0, sgst: 0, igst: 0 };
        bucket.taxable += row.taxable_amount;
        bucket.tax += row.tax_amount;
        bucket.cgst += row.cgst_amount;
        bucket.sgst += row.sgst_amount;
        bucket.igst += row.igst_amount;
        taxableRows.set(key, bucket);
    }

    const rateBreakup: Array<Record<string, unknown>> = Array.from(taxableRows.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([rate, row]) => ({
            rate,
            taxable_amount: roundCurrency(row.taxable),
            tax_amount: roundCurrency(row.tax),
            cgst_amount: roundCurrency(row.cgst),
            sgst_amount: roundCurrency(row.sgst),
            igst_amount: roundCurrency(row.igst),
        }));

    const taxBreakup = {
        subtotal_before_discount: roundCurrency(subtotalBeforeDiscount),
        discount_amount: roundCurrency(discountAmount),
        subtotal,
        tax_amount: taxAmount,
        grand_total: grandTotal,
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount,
        igst_amount: igstAmount,
        rates: rateBreakup,
    };

    const invoiceTaxRate = taxAmount > 0 ? (taxAmount / Math.max(subtotal, 1)) * 100 : 0;
    return {
        financials: {
            subtotal,
            discount_amount: roundCurrency(discountAmount),
            tax_amount: taxAmount,
            grand_total: grandTotal,
            cgst_amount: cgstAmount,
            sgst_amount: sgstAmount,
            igst_amount: igstAmount,
            cgst_rate: supplyType === 'intra_state' ? Number(Math.min(100, invoiceTaxRate / 2).toFixed(2)) : 0,
            sgst_rate: supplyType === 'intra_state' ? Number(Math.min(100, invoiceTaxRate / 2).toFixed(2)) : 0,
            igst_rate: supplyType === 'inter_state' ? Number(Math.min(100, invoiceTaxRate).toFixed(2)) : 0,
            tax_breakup: taxBreakup,
        },
        lines,
    };
}

export function validateInvoicePayload(payload: any): string | null {
    if (!payload || typeof payload !== 'object') return 'Invoice payload is required.';
    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
        return 'At least one invoice item is required.';
    }
    if (!payload.customer_id) return 'Customer is required.';

    const invoiceDate = payload.invoice_date ? new Date(payload.invoice_date) : null;
    const dueDate = payload.due_date ? new Date(payload.due_date) : null;
    if (invoiceDate && dueDate && dueDate < invoiceDate) {
        return 'Due date cannot be earlier than the invoice date.';
    }

    const discountAmount = parseNumber(payload.discount_amount, 0);
    const discountPercentage = parseNumber(payload.discount_percentage, 0);

    const subtotalBeforeDiscount = getItemsSubtotal(Array.isArray(payload.items) ? payload.items : []);
    const discountValidationError = validateDiscountValues(discountAmount, discountPercentage, subtotalBeforeDiscount);
    if (discountValidationError) return discountValidationError;

    if (payload.supply_type && !VALID_SUPPLY_TYPES.includes(payload.supply_type as InvoiceSupplyType)) {
        return 'Supply type must be intra_state or inter_state.';
    }

    if (payload.invoice_number !== undefined && payload.invoice_number !== null && String(payload.invoice_number).trim() === '') {
        return 'Invoice number cannot be empty.';
    }

    for (const item of payload.items) {
        if (!item || typeof item !== 'object') return 'Invoice item details are invalid.';
        if (!item.description || String(item.description).trim() === '') return 'Every invoice item must have a description.';
        const quantity = parseNumber(item.quantity, 0);
        const rate = parseNumber(item.rate, 0);
        if (quantity <= 0) return 'Invoice item quantity must be greater than zero.';
        if (rate < 0) return 'Invoice item rate cannot be negative.';
        const taxRate = parseNumber(item.tax_percentage ?? 0, 0);
        if (taxRate < 0 || taxRate > 100) return 'Tax percentage must be between 0 and 100.';
        const taxTreatment = normalizeTaxTreatment(item.tax_treatment ?? 'taxable');
        if (taxTreatment !== 'taxable' && taxRate > 0) {
            return `Tax percentage must be 0 for ${taxTreatment} items.`;
        }
    }

    if (payload.is_gst_invoice && payload.customer_id) {
        // The actual customer lookup and company validation happen in the service code,
        // but the payload must still include GST metadata when GST is enabled.
        if (payload.supply_type === 'intra_state' && payload.customer_state_code_snapshot === null && payload.place_of_supply_state_code === null) {
            return 'State details are required for GST invoices.';
        }
    }

    return null;
}

export async function getInvoiceRowById(id: string) {
    const { data: invoice, error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (invoiceError) throw invoiceError;
    if (!invoice) return null;

    const { data: items, error: itemsError } = await supabaseAdmin
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id)
        .order('display_order', { ascending: true });

    if (itemsError) throw itemsError;
    return { ...invoice, items: items ?? [] };
}

export async function listInvoicesForCompany(companyId: string, projectId?: string | null) {
    let query = supabaseAdmin
        .from('invoices')
        .select('*')
        .eq('company_id', companyId);

    if (projectId) {
        query = query.eq('project_id', projectId);
    }

    const { data: invoices, error } = await query.order('invoice_date', { ascending: false }).order('created_at', { ascending: false });
    if (error) throw error;

    if (!invoices || invoices.length === 0) return [];

    const invoiceIds = invoices.map((item) => item.id).filter(Boolean);
    const { data: items, error: itemsError } = await supabaseAdmin
        .from('invoice_items')
        .select('*')
        .in('invoice_id', invoiceIds)
        .order('display_order', { ascending: true });

    if (itemsError) throw itemsError;

    const byInvoice = new Map<string, any[]>();
    for (const row of items ?? []) {
        const invoiceId = String(row.invoice_id ?? '');
        if (!invoiceId) continue;
        const bucket = byInvoice.get(invoiceId) ?? [];
        bucket.push(row);
        byInvoice.set(invoiceId, bucket);
    }

    return invoices.map((invoice) => ({
        ...invoice,
        items: byInvoice.get(String(invoice.id)) ?? [],
    }));
}

export async function assertCustomerExistsForCompany(companyId: string, customerId: string | null) {
    if (!customerId) {
        const err: any = new Error('Customer is required.');
        err.statusCode = 400;
        throw err;
    }

    const { data: customer, error } = await supabaseAdmin
        .from('customers')
        .select('id, company_id, gstin, gst_state_code')
        .eq('id', customerId)
        .eq('company_id', companyId)
        .eq('is_deleted', false)
        .maybeSingle();

    if (error) throw error;
    if (!customer) {
        const err: any = new Error('Customer not found for this company.');
        err.statusCode = 404;
        throw err;
    }

    return customer;
}

export async function assertProjectExistsForCompany(companyId: string, projectId: string | null) {
    if (!projectId) return null;

    const { data: project, error } = await supabaseAdmin
        .from('projects')
        .select('id, company_id')
        .eq('id', projectId)
        .eq('company_id', companyId)
        .maybeSingle();

    if (error) throw error;
    if (!project) {
        const err: any = new Error('Project not found for this company.');
        err.statusCode = 404;
        throw err;
    }

    return project;
}

export async function createInvoiceForCompany(companyId: string, payload: InvoicePayload) {
    const customer = await assertCustomerExistsForCompany(companyId, payload.customer_id ?? null);
    await assertProjectExistsForCompany(companyId, payload.project_id ?? null);

    const items = Array.isArray(payload.items) ? payload.items : [];
    if (items.length === 0) {
        const err: any = new Error('At least one invoice item is required.');
        err.statusCode = 400;
        throw err;
    }

    const requestedNumber = String(payload.invoice_number ?? '').trim();
    const invoiceNumber = requestedNumber || (await allocateInvoiceNumber(companyId));
    const normalizedStatus = normalizeInvoiceStatus(payload.status ?? 'Draft');
    const computed = computeInvoiceFinancials(items, {
        discountAmount: payload.discount_amount,
        discountPercentage: payload.discount_percentage,
        taxInclusive: Boolean(payload.tax_inclusive),
        supplyType: payload.supply_type,
    });
    const financials = computed.financials;
    const resolvedDiscount = resolveInvoiceDiscountInputs({
        payloadDiscountAmount: payload.discount_amount,
        payloadDiscountPercentage: payload.discount_percentage,
    });

    const invoiceInsert = {
        company_id: companyId,
        project_id: payload.project_id ?? null,
        customer_id: payload.customer_id,
        invoice_number: invoiceNumber,
        invoice_date: payload.invoice_date || new Date().toISOString().slice(0, 10),
        due_date: payload.due_date ?? null,
        status: normalizedStatus,
        discount_amount: roundCurrency(resolvedDiscount.discountAmount),
        discount_percentage: roundCurrency(resolvedDiscount.discountPercentage),
        subtotal: financials.subtotal,
        tax_amount: financials.tax_amount,
        grand_total: financials.grand_total,
        notes: payload.notes ?? null,
        is_gst_invoice: Boolean(payload.is_gst_invoice),
        tax_inclusive: Boolean(payload.tax_inclusive),
        supplier_gstin_snapshot: payload.supplier_gstin_snapshot ?? null,
        supplier_state_code_snapshot: payload.supplier_state_code_snapshot ?? null,
        customer_gstin_snapshot: payload.customer_gstin_snapshot ?? (customer?.gstin ?? null),
        customer_state_code_snapshot: payload.customer_state_code_snapshot ?? (customer?.gst_state_code ?? null),
        place_of_supply_state_code: payload.place_of_supply_state_code ?? null,
        supply_type: normalizeInvoiceSupplyType(payload.supply_type),
        reverse_charge: Boolean(payload.reverse_charge),
        cgst_amount: financials.cgst_amount,
        sgst_amount: financials.sgst_amount,
        igst_amount: financials.igst_amount,
        tax_breakup: financials.tax_breakup,
        cgst_rate: financials.cgst_rate,
        sgst_rate: financials.sgst_rate,
        igst_rate: financials.igst_rate,
    };

    const { data: insertedInvoice, error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .insert(invoiceInsert)
        .select('*')
        .single();

    if (invoiceError) {
        if (invoiceError.code === '23505') {
            const err: any = new Error('Invoice number already exists for this company.');
            err.statusCode = 409;
            throw err;
        }
        throw invoiceError;
    }

    const invoiceItems = computed.lines.map((line) => ({
        invoice_id: insertedInvoice.id,
        description: line.description,
        quantity: line.quantity,
        unit: line.unit,
        rate: line.rate,
        tax_percentage: line.tax_percentage,
        tax_amount: line.tax_amount,
        total_amount: line.total_amount,
        display_order: line.display_order,
        hsn_sac_code: line.hsn_sac_code,
        tax_treatment: line.tax_treatment,
        cgst_rate: line.cgst_rate,
        sgst_rate: line.sgst_rate,
        igst_rate: line.igst_rate,
        cgst_amount: line.cgst_amount,
        sgst_amount: line.sgst_amount,
        igst_amount: line.igst_amount,
    }));

    const { error: itemsError } = await supabaseAdmin
        .from('invoice_items')
        .insert(invoiceItems);

    if (itemsError) {
        await supabaseAdmin.from('invoices').delete().eq('id', insertedInvoice.id);
        throw itemsError;
    }

    return getInvoiceRowById(insertedInvoice.id);
}

export async function updateInvoiceRow(id: string, companyId: string, payload: Partial<InvoicePayload>) {
    const existing = await getInvoiceRowById(id);
    if (!existing || existing.company_id !== companyId) {
        const err: any = new Error('Invoice not found for this company.');
        err.statusCode = 404;
        throw err;
    }

    if (existing.status !== 'Draft') {
        const err: any = new Error('Issued or cancelled invoices are read-only and cannot be edited.');
        err.statusCode = 409;
        throw err;
    }

    const validationPayload = mergeInvoiceForValidation(existing, payload);
    const validationError = validateInvoicePayload(validationPayload);
    if (validationError) {
        const err: any = new Error(validationError);
        err.statusCode = 400;
        throw err;
    }

    const updates: Record<string, unknown> = {};
    if (payload.customer_id !== undefined) {
        await assertCustomerExistsForCompany(companyId, payload.customer_id ?? null);
        updates.customer_id = payload.customer_id;
    }
    if (payload.project_id !== undefined) {
        await assertProjectExistsForCompany(companyId, payload.project_id ?? null);
        updates.project_id = payload.project_id ?? null;
    }
    if (payload.invoice_number !== undefined) {
        const invoiceNumber = String(payload.invoice_number ?? '').trim();
        if (!invoiceNumber) {
            const err: any = new Error('Invoice number cannot be empty.');
            err.statusCode = 400;
            throw err;
        }
        if (invoiceNumber !== existing.invoice_number) {
            const { data: conflict, error: lookupError } = await supabaseAdmin
                .from('invoices')
                .select('id')
                .eq('company_id', companyId)
                .eq('invoice_number', invoiceNumber)
                .neq('id', id)
                .maybeSingle();
            if (lookupError) throw lookupError;
            if (conflict) {
                const err: any = new Error('Invoice number already exists for this company.');
                err.statusCode = 409;
                throw err;
            }
        }
        updates.invoice_number = invoiceNumber;
    }
    if (payload.invoice_date !== undefined) updates.invoice_date = payload.invoice_date ?? new Date().toISOString().slice(0, 10);
    if (payload.due_date !== undefined) updates.due_date = payload.due_date ?? null;
    if (payload.notes !== undefined) updates.notes = payload.notes ?? null;
    if (payload.is_gst_invoice !== undefined) updates.is_gst_invoice = Boolean(payload.is_gst_invoice);
    if (payload.tax_inclusive !== undefined) updates.tax_inclusive = Boolean(payload.tax_inclusive);
    if (payload.supplier_gstin_snapshot !== undefined) updates.supplier_gstin_snapshot = payload.supplier_gstin_snapshot ?? null;
    if (payload.supplier_state_code_snapshot !== undefined) updates.supplier_state_code_snapshot = payload.supplier_state_code_snapshot ?? null;
    if (payload.customer_gstin_snapshot !== undefined) updates.customer_gstin_snapshot = payload.customer_gstin_snapshot ?? null;
    if (payload.customer_state_code_snapshot !== undefined) updates.customer_state_code_snapshot = payload.customer_state_code_snapshot ?? null;
    if (payload.place_of_supply_state_code !== undefined) updates.place_of_supply_state_code = payload.place_of_supply_state_code ?? null;
    if (payload.supply_type !== undefined) updates.supply_type = normalizeInvoiceSupplyType(payload.supply_type);
    if (payload.reverse_charge !== undefined) updates.reverse_charge = Boolean(payload.reverse_charge);

    const shouldRecomputeFinancials = payload.items !== undefined
        || payload.discount_amount !== undefined
        || payload.discount_percentage !== undefined
        || payload.tax_inclusive !== undefined
        || payload.supply_type !== undefined;

    if (shouldRecomputeFinancials) {
        const sourceItems = payload.items !== undefined
            ? (Array.isArray(payload.items) ? payload.items : [])
            : (Array.isArray(existing.items) ? existing.items : []);

        if (sourceItems.length === 0) {
            const err: any = new Error('At least one invoice item is required.');
            err.statusCode = 400;
            throw err;
        }

        const resolvedDiscount = resolveInvoiceDiscountInputs({
            existingDiscountAmount: existing.discount_amount,
            existingDiscountPercentage: existing.discount_percentage,
            payloadDiscountAmount: payload.discount_amount,
            payloadDiscountPercentage: payload.discount_percentage,
        });

        const computed = computeInvoiceFinancials(sourceItems, {
            discountAmount: resolvedDiscount.discountAmount,
            discountPercentage: resolvedDiscount.discountPercentage,
            taxInclusive: Boolean(payload.tax_inclusive ?? existing.tax_inclusive),
            supplyType: payload.supply_type ?? existing.supply_type,
        });
        const financials = computed.financials;

        updates.discount_amount = roundCurrency(resolvedDiscount.discountAmount);
        updates.discount_percentage = roundCurrency(resolvedDiscount.discountPercentage);
        updates.subtotal = financials.subtotal;
        updates.tax_amount = financials.tax_amount;
        updates.grand_total = financials.grand_total;
        updates.cgst_amount = financials.cgst_amount;
        updates.sgst_amount = financials.sgst_amount;
        updates.igst_amount = financials.igst_amount;
        updates.tax_breakup = financials.tax_breakup;
        updates.cgst_rate = financials.cgst_rate;
        updates.sgst_rate = financials.sgst_rate;
        updates.igst_rate = financials.igst_rate;

        const { error: deleteItemsError } = await supabaseAdmin
            .from('invoice_items')
            .delete()
            .eq('invoice_id', id);
        if (deleteItemsError) throw deleteItemsError;

        const invoiceItems = computed.lines.map((line) => ({
            invoice_id: id,
            description: line.description,
            quantity: line.quantity,
            unit: line.unit,
            rate: line.rate,
            tax_percentage: line.tax_percentage,
            tax_amount: line.tax_amount,
            total_amount: line.total_amount,
            display_order: line.display_order,
            hsn_sac_code: line.hsn_sac_code,
            tax_treatment: line.tax_treatment,
            cgst_rate: line.cgst_rate,
            sgst_rate: line.sgst_rate,
            igst_rate: line.igst_rate,
            cgst_amount: line.cgst_amount,
            sgst_amount: line.sgst_amount,
            igst_amount: line.igst_amount,
        }));

        const { error: insertItemsError } = await supabaseAdmin
            .from('invoice_items')
            .insert(invoiceItems);
        if (insertItemsError) throw insertItemsError;
    }

    const { data: updated, error } = await supabaseAdmin
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

    if (error) throw error;
    return getInvoiceRowById(updated.id);
}

export async function issueInvoiceRow(id: string, companyId: string) {
    const existing = await getInvoiceRowById(id);
    if (!existing || existing.company_id !== companyId) {
        const err: any = new Error('Invoice not found for this company.');
        err.statusCode = 404;
        throw err;
    }

    if (existing.status !== 'Draft') {
        const err: any = new Error('Only draft invoices can be issued.');
        err.statusCode = 409;
        throw err;
    }

    const { data, error } = await supabaseAdmin
        .from('invoices')
        .update({ status: 'Issued' })
        .eq('id', id)
        .select('*')
        .single();

    if (error) throw error;
    return data;
}

export async function cancelInvoiceRow(id: string, companyId: string) {
    const existing = await getInvoiceRowById(id);
    if (!existing || existing.company_id !== companyId) {
        const err: any = new Error('Invoice not found for this company.');
        err.statusCode = 404;
        throw err;
    }

    if (existing.status === 'Cancelled') {
        return existing;
    }

    if (existing.status !== 'Issued') {
        const err: any = new Error('Only issued invoices can be cancelled.');
        err.statusCode = 409;
        throw err;
    }

    const { data, error } = await supabaseAdmin
        .from('invoices')
        .update({ status: 'Cancelled' })
        .eq('id', id)
        .select('*')
        .single();

    if (error) throw error;
    return data;
}

export async function deleteInvoiceRow(id: string, companyId: string) {
    const existing = await getInvoiceRowById(id);
    if (!existing || existing.company_id !== companyId) {
        const err: any = new Error('Invoice not found for this company.');
        err.statusCode = 404;
        throw err;
    }

    if (existing.status !== 'Draft') {
        const err: any = new Error('Only draft invoices can be deleted. Issued and cancelled invoices are retained for history.');
        err.statusCode = 409;
        throw err;
    }

    const { error: itemDeleteError } = await supabaseAdmin
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);
    if (itemDeleteError) throw itemDeleteError;

    const { error: invoiceDeleteError } = await supabaseAdmin
        .from('invoices')
        .delete()
        .eq('id', id);
    if (invoiceDeleteError) throw invoiceDeleteError;

    return { ok: true };
}
