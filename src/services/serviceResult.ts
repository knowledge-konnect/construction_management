import type { ApiResult } from '@/services/apiClient';

export type ServiceResult<T> =
    | { ok: true; data: T; status?: number }
    | { ok: false; error: string; status?: number };

export function toServiceResult<T>(result: ApiResult<T>): ServiceResult<T> {
    if (result.data !== undefined) {
        return { ok: true, data: result.data, status: result.status };
    }
    return {
        ok: false,
        error: result.error ?? 'Something went wrong. Please try again.',
        status: result.status,
    };
}
