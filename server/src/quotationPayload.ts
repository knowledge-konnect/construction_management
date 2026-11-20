// Maps a client Quotation (camelCase) to the snake_case payload expected by the
// public.save_quotation() database function (see migrations/0022), and translates the
// function's SQLSTATE errors into HTTP-friendly errors.
//
// Totals are deliberately NOT sent: the database recomputes subtotal, discount, tax and
// grand total from the line items, so a client can never store numbers that disagree
// with the BOQ.

const num = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

const orNull = <T>(v: T | undefined | null | ''): T | null => (v === undefined || v === null || v === '' ? null : v);

export function buildSavePayload(
    q: any,
    dbStatus: string,
    customerId: string | null,
    partyId: string | null,
) {
    const builtup = q.project?.builtupArea;
    const builtupNum = builtup === undefined || builtup === null || String(builtup).trim() === '' ? null : num(builtup);

    return {
        id: q.id,
        customer_id: customerId,
        party_id: partyId,
        status: dbStatus,
        quotation_date: orNull(q.quotationDate),
        valid_until: orNull(q.validUntil),
        project_type_id: orNull(q.projectTypeId ?? q.project_type_id),
        project_name: q.project?.name ?? '',
        project_type: q.project?.projectType ?? '',
        project_location: q.project?.address ?? '',
        area_unit_id: orNull(q.areaUnitId ?? q.area_unit_id),
        builtup_area: builtupNum,
        area_unit: q.project?.builtupAreaUnit ?? '',
        floors: q.project?.floors ?? '',
        tax_rate_id: orNull(q.taxRateId ?? q.tax_rate_id),
        tax_name: orNull(q.tax?.name),
        tax_applicable: !!q.tax?.applicable,
        tax_percentage: num(q.tax?.rate),
        discount_type: q.discount?.type ?? 'None',
        discount_value: num(q.discount?.value),
        additional_charge_items: (q.additionalCharges ?? []).map((c: any) => ({
            id: c.id,
            description: c.description ?? '',
            amount: num(c.amount),
        })),
        notes: q.customerNotes ?? '',
        internal_notes: q.internalNotes ?? '',
        validity: orNull(q.validity),
        questionnaire: q.questionnaire && typeof q.questionnaire === 'object' ? q.questionnaire : null,
        sections: (q.boqSections ?? []).map((s: any, si: number) => ({
            id: s.id,
            section_name: s.title ?? '',
            display_order: Number.isInteger(s.displayOrder) ? s.displayOrder : si,
            items: (s.items ?? []).map((i: any, ii: number) => ({
                id: i.id,
                description: i.description ?? '',
                quantity: num(i.quantity),
                unit: i.unit ?? '',
                unit_id: orNull(i.unitId),
                rate: num(i.rate),
                display_order: Number.isInteger(i.displayOrder) ? i.displayOrder : ii,
                row_type: i.rowType === 'note' || i.rowType === 'item' ? i.rowType : undefined,
            })),
        })),
        specifications: (q.specifications ?? []).map((s: any, i: number) => ({
            id: s.id,
            specification_type: s.title ?? '',
            description: s.description ?? '',
            display_order: Number.isInteger(s.displayOrder) ? s.displayOrder : i,
        })),
        inclusions: (q.inclusions ?? []).map((x: unknown) => String(x ?? '')),
        exclusions: (q.exclusions ?? []).map((x: unknown) => String(x ?? '')),
        payment_schedule: (q.paymentSchedule ?? []).map((p: any, i: number) => ({
            id: p.id,
            stage_name: p.name ?? '',
            percentage: p.percentage === undefined || p.percentage === null || p.percentage === '' ? null : num(p.percentage),
            amount: p.amount === undefined || p.amount === null ? null : num(p.amount),
            due_date: orNull(p.dueDate),
            status: orNull(p.status),
            notes: orNull(p.notes),
            display_order: Number.isInteger(p.displayOrder) ? p.displayOrder : i,
        })),
        terms: (q.terms ?? []).map((t: any, i: number) => ({
            id: t.id,
            description: t.text ?? '',
            display_order: Number.isInteger(t.displayOrder) ? t.displayOrder : i,
        })),
    };
}

export interface SaveQuotationRpcResult {
    id: string;
    document_number: string;
    version: number;
    is_new: boolean;
    subtotal: number;
    additional_charges: number;
    discount_amount: number;
    taxable_amount: number;
    tax_amount: number;
    grand_total: number;
}

// SQLSTATEs raised by save_quotation → HTTP status used by the route's error handler.
export function toSaveError(error: { code?: string; message?: string; details?: string }): Error & { statusCode?: number; code?: string } {
    const err: Error & { statusCode?: number; code?: string } = new Error(error.message || 'Failed to save quotation.');
    switch (error.code) {
        case '42501': err.statusCode = 403; break;                       // another company's document
        case '40001': err.statusCode = 409; err.code = 'VERSION_CONFLICT'; break;
        case 'P0409': err.statusCode = 409; break;                       // deleted quotation
        case '22023': err.statusCode = 400; break;                       // invalid input (discount, >100% payments, ...)
        default:
            err.message = `save_quotation failed: ${error.message ?? 'unknown error'}`;
    }
    return err;
}
