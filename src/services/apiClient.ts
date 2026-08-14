import { clearTokens, getToken, refreshAccessToken } from '@/services/auth.service';

// Use VITE_API_URL for custom backend hosts, otherwise use relative paths in hosted builds.
const API_BASE = import.meta.env.VITE_API_URL ?? '';

export interface ApiResult<T> {
    data?: T;
    error?: string;
    status?: number;
}

async function doFetch(path: string, init: RequestInit, token: string | null): Promise<Response> {
    return fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
            ...(init.headers ?? {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
}

/**
 * Authenticated request helper used by document/customer/company services.
 * On a 401 (expired 15-minute access token) it transparently exchanges the
 * refresh token for a new access token via /api/refresh and retries the
 * request ONCE — this is what keeps a user from being unexpectedly logged
 * out while actively working on a quotation. If the refresh itself fails
 * (refresh token expired/revoked), the stored tokens are cleared and the
 * original 401 is surfaced so the app can redirect to login.
 */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
    try {
        const token = getToken();
        let res = await doFetch(path, init, token);

        if (res.status === 401) {
            const refreshedToken = await refreshAccessToken();
            if (refreshedToken) {
                res = await doFetch(path, init, refreshedToken);
            } else {
                clearTokens();
            }
        }

        const json = await res.json().catch(() => null);
        if (!res.ok) return { error: json?.error ?? `Request failed (${res.status})`, status: res.status };
        return { data: json as T, status: res.status };
    } catch (err) {
        return { error: 'Unable to reach the server.' };
    }
}

export async function apiGet<T>(path: string): Promise<ApiResult<T>> {
    return apiRequest<T>(path, { method: 'GET' });
}

export async function apiPost<T>(path: string, body: unknown): Promise<ApiResult<T>> {
    return apiRequest<T>(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

export async function apiPut<T>(path: string, body: unknown): Promise<ApiResult<T>> {
    return apiRequest<T>(path, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

export async function apiDelete<T>(path: string): Promise<ApiResult<T>> {
    return apiRequest<T>(path, { method: 'DELETE' });
}
