import {
    BUSINESS_MODEL_VALUES,
    isSupportedBusinessModel,
    normalizeBusinessModel,
    normalizeBusinessModels,
} from './businessModels.js';

export function isNonEmptyString(v: unknown): v is string {
    return typeof v === 'string' && v.trim().length > 0;
}

export function isValidEmail(v: unknown): boolean {
    if (v === null || v === undefined || v === '') return true; // optional field
    return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function isValidMobile(v: unknown): boolean {
    if (v === null || v === undefined || v === '') return true;
    if (typeof v !== 'string') return false;
    const digits = v.replace(/\D/g, '');
    return /^\d{10}$/.test(digits);
}

export function isValidGSTIN(v: unknown): boolean {
    if (v === null || v === undefined || v === '') return true;
    if (typeof v !== 'string') return false;
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v.replace(/\s+/g, '').toUpperCase());
}

function isFiniteNumber(v: unknown): boolean {
    return typeof v === 'number' && Number.isFinite(v);
}

function isValidPercentage(v: unknown): boolean {
    return isFiniteNumber(v) && (v as number) >= 0 && (v as number) <= 100;
}

function normalizeDevelopmentArrangement(v: unknown): 'self' | 'joint_development' | null {
    if (typeof v !== 'string') return null;
    const normalized = v.trim().toLowerCase();
    if (normalized === 'joint-development') return 'joint_development';
    if (normalized === 'self' || normalized === 'joint_development') return normalized as 'self' | 'joint_development';
    return null;
}

function isValidDateString(v: unknown): boolean {
    if (v === null || v === undefined || v === '') return true;
    if (typeof v !== 'string') return false;
    return !Number.isNaN(new Date(v).getTime());
}

/** Returns an error message, or null if the payload is valid. */
export function validateCustomerPayload(body: any): string | null {
    if (!isNonEmptyString(body?.name)) return 'Customer name is required.';
    if (!isNonEmptyString(body?.mobile)) return 'Mobile number is required.';
    if (!isValidEmail(body?.email)) return 'Invalid email address.';
    if (!isValidMobile(body?.mobile)) return 'Mobile number must be 10 digits.';
    if (!isValidGSTIN(body?.gstin)) return 'Invalid GSTIN format.';
    return null;
}

export function validateSupplierPayload(body: any): string | null {
    if (!isNonEmptyString(body?.name)) return 'Supplier name is required.';
    if (!isNonEmptyString(body?.mobile)) return 'Mobile number is required.';
    if (!isValidMobile(body?.mobile)) return 'Mobile number must be 10 digits.';
    if (!isValidGSTIN(body?.gstin)) return 'Invalid GSTIN format.';
    return null;
}

export function validatePartyPayload(body: any): string | null {
    if (!isNonEmptyString(body?.name)) return 'Party name is required.';
    if (body?.email !== undefined && body?.email !== null && body?.email !== '' && !isValidEmail(body.email)) return 'Invalid email address.';
    if (body?.mobile !== undefined && body?.mobile !== null && body?.mobile !== '' && !isValidMobile(body.mobile)) return 'Mobile number must be 10 digits.';
    if (body?.gstin !== undefined && body?.gstin !== null && body?.gstin !== '' && !isValidGSTIN(body.gstin)) return 'Invalid GSTIN format.';

    const normalizedRole = String(body?.party_type ?? body?.partyType ?? '').trim().toLowerCase();
    const roleSet = new Set<string>();
    if (normalizedRole) roleSet.add(normalizedRole);
    if (body?.is_customer) roleSet.add('customer');
    if (body?.is_supplier) roleSet.add('supplier');
    if (body?.is_investor) roleSet.add('investor');

    const validRoles = new Set(['customer', 'supplier', 'investor', 'general']);
    if (normalizedRole && !validRoles.has(normalizedRole)) {
        return 'Select a valid primary party role.';
    }
    if (roleSet.size > 1) {
        return 'Select only one primary party role.';
    }
    return null;
}

/** Returns an error message, or null if the payload is valid. */
export function validateCompanyPayload(body: any): string | null {
    if (!isNonEmptyString(body?.name)) return 'Company name is required.';
    if (!isValidEmail(body?.email)) return 'Invalid email address.';

    const requestedEnabledModels = Array.isArray(body?.enabled_business_models)
        ? body.enabled_business_models
        : Array.isArray(body?.enabledBusinessModels)
            ? body.enabledBusinessModels
            : null;
    if (requestedEnabledModels) {
        const invalidEnabledModels = requestedEnabledModels.filter((value: unknown) => normalizeBusinessModel(value) === null);
        if (invalidEnabledModels.length > 0) {
            return `Enabled business models must be a subset of: ${BUSINESS_MODEL_VALUES.join(', ')}.`;
        }
        if (normalizeBusinessModels(requestedEnabledModels).length === 0) {
            return 'At least one enabled business model is required.';
        }
    }

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
    if (billing.projectId !== undefined && billing.projectId !== null && billing.projectId !== '' && typeof billing.projectId !== 'string') {
        return 'Invalid project selection.';
    }
    if (billing.projectName !== undefined && billing.projectName !== null && billing.projectName !== '' && typeof billing.projectName !== 'string') {
        return 'Invalid project name.';
    }

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

export function validateProjectPayload(body: any): string | null {
    if (!body || typeof body !== 'object') return 'Project payload is required.';
    if (!isNonEmptyString(body.name)) return 'Project name is required.';

    const businessModelValue = body.business_model ?? body.businessModel ?? null;
    const normalizedBusinessModel = typeof businessModelValue === 'string' ? businessModelValue.trim().toLowerCase() : businessModelValue;
    if (businessModelValue !== null && businessModelValue !== undefined && businessModelValue !== '' && !isSupportedBusinessModel(businessModelValue)) {
        return `Business model must be one of: ${BUSINESS_MODEL_VALUES.join(', ')}.`;
    }

    const hasDevelopmentSpecificFields = [
        body.development_arrangement ?? body.developmentArrangement,
        body.landowner_party_id ?? body.landownerPartyId,
        body.jda_agreement_reference ?? body.jdaAgreementReference,
        body.jda_agreement_document_url ?? body.jdaAgreementDocumentUrl,
        body.jda_agreement_date ?? body.jdaAgreementDate,
        body.total_project_flats ?? body.totalProjectFlats,
        body.builder_share_units ?? body.builderShareUnits,
        body.landowner_share_units ?? body.landownerShareUnits,
    ].some((value) => value !== undefined && value !== null && value !== '');

    if (hasDevelopmentSpecificFields && normalizedBusinessModel !== 'property_development') {
        return 'Development arrangement and JDA fields are permitted only when business_model = property_development.';
    }

    const developmentArrangementValue = body.development_arrangement ?? body.developmentArrangement ?? null;
    const normalizedDevelopmentArrangement = normalizeDevelopmentArrangement(developmentArrangementValue);
    if (developmentArrangementValue !== null && developmentArrangementValue !== undefined && developmentArrangementValue !== '' && normalizedDevelopmentArrangement === null) {
        return 'Development arrangement must be self or joint_development.';
    }

    if (normalizedBusinessModel === 'property_development' && normalizedDevelopmentArrangement === null) {
        return 'Property development projects require an explicit development arrangement: self or joint_development.';
    }

    const contractValue = body.contract_amount ?? body.contractAmount;
    if (contractValue !== undefined && contractValue !== null && contractValue !== '' && (!isFiniteNumber(Number(contractValue)) || Number(contractValue) < 0)) {
        return 'Contract amount must be a valid non-negative number.';
    }
    const budgetValue = body.budget_amount ?? body.budgetAmount;
    if (budgetValue !== undefined && budgetValue !== null && budgetValue !== '' && (!isFiniteNumber(Number(budgetValue)) || Number(budgetValue) < 0)) {
        return 'Project budget must be a valid non-negative number.';
    }
    const projectedSalesValue = body.projected_sales_value ?? body.projectedSalesValue;
    if (projectedSalesValue !== undefined && projectedSalesValue !== null && projectedSalesValue !== '' && (!isFiniteNumber(Number(projectedSalesValue)) || Number(projectedSalesValue) < 0)) {
        return 'Projected sales value must be a valid non-negative number.';
    }
    const landCostValue = body.land_cost ?? body.landCost;
    if (landCostValue !== undefined && landCostValue !== null && landCostValue !== '' && (!isFiniteNumber(Number(landCostValue)) || Number(landCostValue) < 0)) {
        return 'Land cost must be a valid non-negative number.';
    }

    const totalProjectFlats = body.total_project_flats ?? body.totalProjectFlats;
    if (totalProjectFlats !== undefined && totalProjectFlats !== null && totalProjectFlats !== '' && (!Number.isInteger(Number(totalProjectFlats)) || Number(totalProjectFlats) <= 0)) {
        return 'Total project flats must be a whole number greater than zero.';
    }

    const builderShareUnits = body.builder_share_units ?? body.builderShareUnits;
    if (builderShareUnits !== undefined && builderShareUnits !== null && builderShareUnits !== '' && (!Number.isInteger(Number(builderShareUnits)) || Number(builderShareUnits) < 0)) {
        return 'Builder share flats must be a non-negative whole number.';
    }
    const landownerShareUnits = body.landowner_share_units ?? body.landownerShareUnits;
    if (landownerShareUnits !== undefined && landownerShareUnits !== null && landownerShareUnits !== '' && (!Number.isInteger(Number(landownerShareUnits)) || Number(landownerShareUnits) < 0)) {
        return 'Landowner share flats must be a non-negative whole number.';
    }

    if (normalizedDevelopmentArrangement === 'self') {
        const selfDevelopmentRejectedFields = [
            body.landowner_party_id ?? body.landownerPartyId,
            body.jda_agreement_reference ?? body.jdaAgreementReference,
            body.jda_agreement_document_url ?? body.jdaAgreementDocumentUrl,
            body.jda_agreement_date ?? body.jdaAgreementDate,
            body.total_project_flats ?? body.totalProjectFlats,
            body.builder_share_units ?? body.builderShareUnits,
            body.landowner_share_units ?? body.landownerShareUnits,
        ];

        if (selfDevelopmentRejectedFields.some((value) => value !== undefined && value !== null && value !== '')) {
            return 'Self development must not include landowner, JDA or flat-sharing fields.';
        }
    }

    if (normalizedDevelopmentArrangement === 'joint_development') {
        const numericTotal = totalProjectFlats === undefined || totalProjectFlats === null || totalProjectFlats === '' ? null : Number(totalProjectFlats);
        const numericBuilder = builderShareUnits === undefined || builderShareUnits === null || builderShareUnits === '' ? null : Number(builderShareUnits);
        const numericLandowner = landownerShareUnits === undefined || landownerShareUnits === null || landownerShareUnits === ''
            ? null
            : Number(landownerShareUnits);

        if (body.landowner_party_id === undefined || body.landowner_party_id === null || body.landowner_party_id === '') {
            return 'Joint development requires landowner_party_id.';
        }
        if (numericTotal === null) {
            return 'Joint development requires total project flats.';
        }
        if (numericBuilder === null || numericLandowner === null) {
            return 'Joint development requires builder_share_units and landowner_share_units.';
        }
        if (numericTotal <= 0 || !Number.isInteger(numericTotal)) {
            return 'Total project flats must be a whole number greater than zero.';
        }
        if (!Number.isInteger(numericBuilder) || numericBuilder < 0) {
            return 'Builder share flats must be a non-negative whole number.';
        }
        if (!Number.isInteger(numericLandowner) || numericLandowner < 0) {
            return 'Landowner share flats must be a non-negative whole number.';
        }
        if (numericBuilder + numericLandowner !== numericTotal) {
            return 'Builder and landowner share flats must add up to the total project flats.';
        }
    }

    if (body.landowner_party_id !== undefined && body.landowner_party_id !== null && body.landowner_party_id !== '' && typeof body.landowner_party_id !== 'string') {
        return 'Landowner party id must be a valid UUID string.';
    }
    if (body.jda_agreement_reference !== undefined && body.jda_agreement_reference !== null && typeof body.jda_agreement_reference !== 'string') {
        return 'Joint development agreement reference must be a text value.';
    }
    if (body.jda_agreement_document_url !== undefined && body.jda_agreement_document_url !== null && typeof body.jda_agreement_document_url !== 'string') {
        return 'Joint development agreement document URL must be a text value.';
    }
    if (body.jda_agreement_date !== undefined && body.jda_agreement_date !== null && !isValidDateString(body.jda_agreement_date)) {
        return 'Invalid joint development agreement date.';
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
