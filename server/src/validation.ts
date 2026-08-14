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

/**
 * Backend safety net behind the existing frontend BOQ/commercial validation —
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
