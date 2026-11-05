export const BUSINESS_MODEL_VALUES = [
    'contract_construction',
    'property_development',
    'civil_works_contract',
    'material_supply',
] as const;

export type BusinessModel = (typeof BUSINESS_MODEL_VALUES)[number];

export const BUSINESS_MODEL_OPTIONS = [
    { value: 'contract_construction', label: 'Contract Construction', description: 'Traditional construction contract project execution.' },
    { value: 'property_development', label: 'Property Development', description: 'Property, land, and site development opportunities.' },
    { value: 'civil_works_contract', label: 'Civil Works Contract', description: 'Civil works and infrastructure contract delivery.' },
    { value: 'material_supply', label: 'Material Supply', description: 'Material supply and trade-led procurement workflows.' },
] as const;

export const DEFAULT_ENABLED_BUSINESS_MODELS: BusinessModel[] = [...BUSINESS_MODEL_VALUES];

export function normalizeBusinessModel(value: unknown): BusinessModel | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase();
    return (BUSINESS_MODEL_VALUES as readonly string[]).includes(normalized)
        ? (normalized as BusinessModel)
        : null;
}

export function normalizeBusinessModels(value: unknown): BusinessModel[] {
    if (!Array.isArray(value)) return [];

    const uniqueValues = new Set<BusinessModel>();
    for (const item of value) {
        const normalized = normalizeBusinessModel(item);
        if (normalized) {
            uniqueValues.add(normalized);
        }
    }
    return Array.from(uniqueValues);
}

export function isSupportedBusinessModel(value: unknown): value is BusinessModel {
    return normalizeBusinessModel(value) !== null;
}

export function isBusinessModelEnabled(enabledModels: unknown, value: unknown): boolean {
    const normalizedValue = normalizeBusinessModel(value);
    if (!normalizedValue) return false;
    return normalizeBusinessModels(enabledModels).includes(normalizedValue);
}

export function calculateProjectedMargin(input: {
    businessModel: unknown;
    developmentArrangement?: unknown;
    contractAmount?: unknown;
    budgetAmount?: unknown;
    projectedSalesValue?: unknown;
    landCost?: unknown;
}): number | null {
    const businessModel = normalizeBusinessModel(input.businessModel);
    if (!businessModel) return null;

    const toFinite = (value: unknown): number => {
        const parsed = Number(value ?? 0);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const hasValue = (value: unknown): boolean =>
        value !== undefined && value !== null && String(value).trim() !== '';

    const contractValue = toFinite(input.contractAmount);
    const budgetValue = toFinite(input.budgetAmount);
    const salesValue = toFinite(input.projectedSalesValue);
    const landValue = toFinite(input.landCost);

    const hasContract = hasValue(input.contractAmount);
    const hasBudget = hasValue(input.budgetAmount);
    const hasSales = hasValue(input.projectedSalesValue);
    const hasLand = hasValue(input.landCost);

    if (businessModel === 'contract_construction' || businessModel === 'civil_works_contract') {
        if (!hasContract || !hasBudget) return null;
        return contractValue - budgetValue;
    }

    if (businessModel === 'property_development') {
        const arrangement = typeof input.developmentArrangement === 'string'
            ? input.developmentArrangement.trim().toLowerCase()
            : '';
        const isJointDevelopment = arrangement === 'joint_development' || arrangement === 'joint-development';

        if (isJointDevelopment) {
            if (!hasSales || !hasBudget) return null;
            return salesValue - budgetValue;
        }

        if (!hasSales || !hasLand || !hasBudget) return null;
        return salesValue - landValue - budgetValue;
    }

    return null;
}
