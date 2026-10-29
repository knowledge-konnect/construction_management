export function isNonEmptyString(v: unknown): v is string {
    return typeof v === 'string' && v.trim().length > 0;
}

export function isValidEmail(v: unknown): boolean {
    if (v === null || v === undefined || v === '') return true; // optional field
    return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isFiniteNumber(v: unknown): boolean {
    return typeof v === 'number' && Number.isFinite(v);
}

function isValidPercentage(v: unknown): boolean {
    return isFiniteNumber(v) && (v as number) >= 0 && (v as number) <= 100;
}

function isValidDateString(v: unknown): boolean {
    if (v === null || v === undefined || v === '') return true;
    if (typeof v !== 'string') return false;
    return !Number.isNaN(new Date(v).getTime());
}

/** Returns an error message, or null if the payload is valid. */
export function validateCustomerPayload(body: any): string | null {
    if (!isNonEmptyString(body?.name)) return 'Customer name is required.';
    if (!isValidEmail(body?.email)) return 'Invalid email address.';
    return null;
}

/** Returns an error message, or null if the payload is valid. */
export function validateCompanyPayload(body: any): string | null {
    if (!isNonEmptyString(body?.name)) return 'Company name is required.';
    if (!isValidEmail(body?.email)) return 'Invalid email address.';
    return null;
}

/** Returns an error message, or null if the payload is valid. */
export function validateAddTeamMemberPayload(body: any): string | null {
    if (!isValidEmail(body?.email) || !isNonEmptyString(body?.email)) return 'A valid email address is required.';
    if (body?.role !== 'admin' && body?.role !== 'staff') return 'Role must be admin or staff.';
    if (body?.password !== undefined && (!isNonEmptyString(body.password) || body.password.length < 8)) {
        return 'Password must be at least 8 characters.';
    }
    return null;
}

/** Returns an error message, or null if the payload is valid. */
export function validateFlatBillingPayload(billing: any): string | null {
    if (!billing || typeof billing !== 'object') return 'Receipt payload is required.';
    if (!isNonEmptyString(billing.id)) return 'Receipt id is required.';
    if (!isNonEmptyString(billing.buyerName)) return 'Buyer name is required.';

    if (billing.areaSqft !== undefined && billing.areaSqft !== '' && (!isFiniteNumber(Number(billing.areaSqft)) || Number(billing.areaSqft) < 0)) {
        return 'Invalid area (sq ft).';
    }
    if (billing.ratePerSqft !== undefined && billing.ratePerSqft !== '' && (!isFiniteNumber(Number(billing.ratePerSqft)) || Number(billing.ratePerSqft) < 0)) {
        return 'Invalid rate per sq ft.';
    }
    for (const stage of billing.payments ?? []) {
        if (stage?.amount !== undefined && stage.amount !== '' && (!isFiniteNumber(Number(stage.amount)) || Number(stage.amount) < 0)) {
            return `Invalid amount for payment stage "${stage?.stage ?? ''}".`;
        }
    }
    if (!isValidDateString(billing.date)) return 'Invalid receipt date.';

    return null;
}

/**
 * Backend safety net behind the existing frontend BOQ/commercial validation â€”
 * does not change the calculation logic itself, only rejects payloads with
 * clearly invalid figures before they're persisted.
 * Returns an error message, or null if the payload is valid.
 */
export function validateQuotationPayload(quotation: any): string | null {
    if (!quotation || typeof quotation !== 'object') return 'Quotation payload is required.';
    if (!isNonEmptyString(quotation.id)) return 'Quotation id is required.';

    const sections = Array.isArray(quotation.boqSections) ? quotation.boqSections : [];
    for (const section of sections) {
        const items = Array.isArray(section?.items) ? section.items : [];
        for (const item of items) {
            if (item?.quantity !== undefined && item.quantity !== '' && (!isFiniteNumber(Number(item.quantity)) || Number(item.quantity) < 0)) {
                return `Invalid quantity for item "${item?.description ?? ''}".`;
            }
            if (item?.rate !== undefined && item.rate !== '' && (!isFiniteNumber(Number(item.rate)) || Number(item.rate) < 0)) {
                return `Invalid rate for item "${item?.description ?? ''}".`;
            }
        }
    }

    if (quotation.discount?.value !== undefined && quotation.discount.value !== '' && (!isFiniteNumber(Number(quotation.discount.value)) || Number(quotation.discount.value) < 0)) {
        return 'Invalid discount value.';
    }
    if (quotation.tax?.rate !== undefined && quotation.tax.rate !== '' && !isValidPercentage(Number(quotation.tax.rate))) {
        return 'Tax rate must be between 0 and 100.';
    }
    for (const stage of quotation.paymentSchedule ?? []) {
        if (stage?.percentage !== undefined && stage.percentage !== '' && !isValidPercentage(Number(stage.percentage))) {
            return `Invalid payment percentage for stage "${stage?.name ?? ''}".`;
        }
    }
    if (!isValidDateString(quotation.quotationDate)) return 'Invalid quotation date.';
    if (!isValidDateString(quotation.validUntil)) return 'Invalid valid-until date.';

    return null;
}

export function validateProjectPayload(body: any): string | null {
    if (!body || typeof body !== 'object') return 'Project payload is required.';
    if (!isNonEmptyString(body.name)) return 'Project name is required.';
    if (body.contract_amount !== undefined && body.contract_amount !== '' && (!isFiniteNumber(Number(body.contract_amount)) || Number(body.contract_amount) < 0)) {
        return 'Contract amount must be a valid non-negative number.';
    }
    if (body.status !== undefined && body.status !== null && !['planned', 'in_progress', 'on_hold', 'completed', 'cancelled'].includes(body.status)) {
        return 'Project status is invalid.';
    }
    if (body.start_date !== undefined && body.start_date !== null && !isValidDateString(body.start_date)) {
        return 'Invalid start date.';
    }
    if (body.expected_end_date !== undefined && body.expected_end_date !== null && !isValidDateString(body.expected_end_date)) {
        return 'Invalid expected end date.';
    }
    if (body.actual_end_date !== undefined && body.actual_end_date !== null && !isValidDateString(body.actual_end_date)) {
        return 'Invalid actual end date.';
    }
    return null;
}
