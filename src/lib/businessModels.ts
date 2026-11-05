export const BUSINESS_MODEL_OPTIONS = [
    { value: 'contract_construction', label: 'Contract Construction', description: 'Traditional construction contract project execution.' },
    { value: 'property_development', label: 'Property Development', description: 'Property, land, and site development opportunities.' },
    { value: 'civil_works_contract', label: 'Civil Works Contract', description: 'Civil works and infrastructure contract delivery.' },
    { value: 'material_supply', label: 'Material Supply', description: 'Material supply and trade-led procurement workflows.' },
] as const;

export type BusinessModel = (typeof BUSINESS_MODEL_OPTIONS)[number]['value'];

export interface BusinessModelFormConfig {
    contractValueLabel: string;
    budgetLabel: string;
    projectedSalesLabel: string | null;
    landCostLabel: string | null;
    projectedMarginLabel: string;
    showLandCost: boolean;
    showProjectedSalesValue: boolean;
    showProjectedMargin: boolean;
}

export type ProjectMarginInput = {
    businessModel: BusinessModel;
    developmentArrangement: 'self' | 'joint_development';
    contractAmount: string | number;
    budgetAmount: string | number;
    projectedSalesValue: string | number;
    landCost: string | number;
};

export const BUSINESS_MODEL_VALUES = BUSINESS_MODEL_OPTIONS.map((option) => option.value);
export const DEFAULT_ENABLED_BUSINESS_MODELS: BusinessModel[] = [...BUSINESS_MODEL_VALUES];

export const BUSINESS_MODEL_FORM_CONFIG: Record<BusinessModel, BusinessModelFormConfig> = {
    contract_construction: {
        contractValueLabel: 'Contract Amount',
        budgetLabel: 'Estimated Construction Cost',
        projectedSalesLabel: null,
        landCostLabel: null,
        projectedMarginLabel: 'Expected Profit',
        showLandCost: false,
        showProjectedSalesValue: false,
        showProjectedMargin: true,
    },
    property_development: {
        contractValueLabel: 'Contract Amount',
        budgetLabel: 'Estimated Construction Cost',
        projectedSalesLabel: 'Expected Flat Sales Value',
        landCostLabel: 'Land Purchase Cost',
        projectedMarginLabel: 'Expected Profit',
        showLandCost: true,
        showProjectedSalesValue: true,
        showProjectedMargin: true,
    },
    civil_works_contract: {
        contractValueLabel: 'Contract Amount',
        budgetLabel: 'Estimated Construction Cost',
        projectedSalesLabel: null,
        landCostLabel: null,
        projectedMarginLabel: 'Expected Profit',
        showLandCost: false,
        showProjectedSalesValue: false,
        showProjectedMargin: true,
    },
    material_supply: {
        contractValueLabel: 'Supply Order Value',
        budgetLabel: 'Procurement Cost',
        projectedSalesLabel: 'Expected Order Value',
        landCostLabel: null,
        projectedMarginLabel: 'Expected Profit',
        showLandCost: false,
        showProjectedSalesValue: true,
        showProjectedMargin: false,
    },
};

export function calculateProjectedMargin({
    businessModel,
    developmentArrangement,
    contractAmount,
    budgetAmount,
    projectedSalesValue,
    landCost,
}: ProjectMarginInput): number | null {
    const contractValue = Number(contractAmount ?? 0);
    const budgetValue = Number(budgetAmount ?? 0);
    const salesValue = Number(projectedSalesValue ?? 0);
    const landValue = Number(landCost ?? 0);

    const hasContract = String(contractAmount ?? '').trim() !== '';
    const hasBudget = String(budgetAmount ?? '').trim() !== '';
    const hasSales = String(projectedSalesValue ?? '').trim() !== '';
    const hasLand = String(landCost ?? '').trim() !== '';

    if (businessModel === 'contract_construction' || businessModel === 'civil_works_contract') {
        if (!hasContract || !hasBudget) return null;
        return contractValue - budgetValue;
    }

    if (businessModel === 'property_development') {
        if (developmentArrangement === 'joint_development') {
            if (!hasBudget || !hasSales) return null;
            return salesValue - budgetValue;
        }

        if (!hasBudget || !hasSales || !hasLand) return null;
        return salesValue - landValue - budgetValue;
    }

    return null;
}

export function getBusinessModelFormConfig(model: BusinessModel | null | undefined): BusinessModelFormConfig {
    return BUSINESS_MODEL_FORM_CONFIG[model ?? 'contract_construction'];
}

export function normalizeBusinessModel(value: unknown): BusinessModel | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase();
    return BUSINESS_MODEL_VALUES.includes(normalized as BusinessModel)
        ? (normalized as BusinessModel)
        : null;
}

export function normalizeBusinessModels(value: unknown): BusinessModel[] {
    if (!Array.isArray(value)) return [];
    const uniqueValues = new Set<BusinessModel>();
    for (const item of value) {
        const normalized = normalizeBusinessModel(item);
        if (normalized) uniqueValues.add(normalized);
    }
    return Array.from(uniqueValues);
}

export function isSupportedBusinessModel(value: unknown): value is BusinessModel {
    return normalizeBusinessModel(value) !== null;
}
