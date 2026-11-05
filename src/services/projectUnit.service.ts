import { apiDelete, apiGet, apiPost, apiPut } from '@/services/apiClient';

export type ProjectUnitShareType = 'builder' | 'landowner';
export type ProjectUnitStatus = 'available' | 'allocated' | 'booked';

export interface ProjectUnitRecord {
    id: string;
    companyId: string;
    projectId: string;
    flatNo: string;
    floor: number | null;
    blockTower: string | null;
    shareType: ProjectUnitShareType;
    status: ProjectUnitStatus;
    createdAt: string;
    updatedAt: string;
}

export interface ProjectUnitSummary {
    total: number;
    builder: number;
    landowner: number;
    registered: number;
    available: number;
    allocated: number;
    booked: number;
    completionPercent: number;
    isComplete: boolean;
}

function mapProjectUnitRow(row: any): ProjectUnitRecord {
    const shareType = row.share_type === 'landowner' ? 'landowner' : 'builder';
    const status = row.status === 'booked' ? 'booked' : row.status === 'allocated' ? 'allocated' : 'available';
    return {
        id: row.id,
        companyId: row.company_id,
        projectId: row.project_id,
        flatNo: String(row.flat_no ?? ''),
        floor: row.floor == null ? null : Number(row.floor),
        blockTower: row.block_tower ?? null,
        shareType,
        status,
        createdAt: row.created_at ?? '',
        updatedAt: row.updated_at ?? '',
    };
}

export async function listProjectUnits(projectId: string): Promise<{ units: ProjectUnitRecord[]; summary: ProjectUnitSummary }> {
    const { data, error } = await apiGet<{ units?: any[]; summary?: any }>(`/api/projects/${projectId}/units`);
    if (error || !data) {
        return { units: [], summary: { total: 0, builder: 0, landowner: 0, registered: 0, available: 0, allocated: 0, booked: 0, completionPercent: 0, isComplete: false } };
    }

    const units = (data.units ?? []).map(mapProjectUnitRow);
    const summary = data.summary ? {
        total: Number(data.summary.total ?? 0),
        builder: Number(data.summary.builder ?? 0),
        landowner: Number(data.summary.landowner ?? 0),
        registered: Number(data.summary.registered ?? 0),
        available: Number(data.summary.available ?? 0),
        allocated: Number(data.summary.allocated ?? 0),
        booked: Number(data.summary.booked ?? 0),
        completionPercent: Number(data.summary.completionPercent ?? 0),
        isComplete: Boolean(data.summary.isComplete),
    } : { total: 0, builder: 0, landowner: 0, registered: 0, available: 0, allocated: 0, booked: 0, completionPercent: 0, isComplete: false };
    return { units, summary };
}

export async function createProjectUnit(projectId: string, payload: {
    flatNo: string;
    floor?: number | string | null;
    blockTower?: string | null;
    shareType: ProjectUnitShareType;
    status?: ProjectUnitStatus;
}): Promise<ProjectUnitRecord | null> {
    const { data, error } = await apiPost<{ unit?: any }>(`/api/projects/${projectId}/units`, {
        flat_no: payload.flatNo,
        floor: payload.floor == null || payload.floor === '' ? null : Number(payload.floor),
        block_tower: payload.blockTower ?? null,
        share_type: payload.shareType,
        status: payload.status ?? 'available',
    });
    if (error || !data?.unit) return null;
    return mapProjectUnitRow(data.unit);
}

export async function updateProjectUnit(projectId: string, id: string, payload: {
    flatNo?: string;
    floor?: number | string | null;
    blockTower?: string | null;
    shareType?: ProjectUnitShareType;
    status?: ProjectUnitStatus;
}): Promise<ProjectUnitRecord | null> {
    const { data, error } = await apiPut<{ unit?: any }>(`/api/projects/${projectId}/units/${id}`, {
        ...(payload.flatNo !== undefined ? { flat_no: payload.flatNo } : {}),
        ...(payload.floor !== undefined ? { floor: payload.floor == null || payload.floor === '' ? null : Number(payload.floor) } : {}),
        ...(payload.blockTower !== undefined ? { block_tower: payload.blockTower ?? null } : {}),
        ...(payload.shareType !== undefined ? { share_type: payload.shareType } : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
    });
    if (error || !data?.unit) return null;
    return mapProjectUnitRow(data.unit);
}

export async function deleteProjectUnit(projectId: string, id: string): Promise<boolean> {
    const { error } = await apiDelete<{ ok?: boolean }>(`/api/projects/${projectId}/units/${id}`);
    return !error;
}
