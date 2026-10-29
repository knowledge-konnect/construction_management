import { apiGet } from '@/services/apiClient';

export type MasterType = 'projectTypes' | 'units' | 'expenseCategories' | 'paymentMethods' | 'taxRates' | 'stageTemplates';

export interface MasterItem {
    id: string;
    companyId: string | null;
    code: string;
    name: string;
    description?: string | null;
    symbol?: string | null;
    ratePercentage?: number | null;
    effectiveFrom?: string | null;
    effectiveTo?: string | null;
    sequenceNumber?: number | null;
    sortOrder?: number;
    isActive: boolean;
}

function mapItem(row: any): MasterItem {
    return {
        id: row.id,
        companyId: row.company_id ?? null,
        code: row.code ?? row.template_code ?? '',
        name: row.name ?? '',
        description: row.description ?? null,
        symbol: row.symbol ?? null,
        ratePercentage: row.rate_percentage !== undefined ? Number(row.rate_percentage ?? 0) : null,
        effectiveFrom: row.effective_from ?? null,
        effectiveTo: row.effective_to ?? null,
        sequenceNumber: row.sequence_number !== undefined ? Number(row.sequence_number ?? 0) : null,
        sortOrder: Number(row.sort_order ?? 0),
        isActive: Boolean(row.is_active ?? true),
    };
}

export async function listMasterData(type: MasterType): Promise<MasterItem[]> {
    const { data, error } = await apiGet<{ items?: any[] }>(`/api/masters/${type}`);
    if (error || !Array.isArray(data?.items)) {
        console.warn(`Failed to load master data: ${type}`, error);
        return [];
    }
    return data.items.map(mapItem).filter((row) => row.isActive !== false);
}
