/**
 * Auth service — talks to the Fastify backend (/api/login, /api/signup, /api/me,
 * /api/refresh, /api/logout, /api/password-reset/*).
 *
 * The backend issues a short-lived (15 min) access token (JWT) plus a
 * longer-lived, revocable refresh token. Both are stored in localStorage and
 * the access token is sent as a Bearer token on subsequent requests.
 * apiClient.ts transparently uses refreshAccessToken() below to renew an
 * expired access token without interrupting the user.
 */

// Use VITE_API_URL for custom backend hosts, otherwise use relative paths in hosted builds.
const API_BASE = import.meta.env.VITE_API_URL ?? '';
const TOKEN_KEY = 'sopan.auth.token';
const REFRESH_TOKEN_KEY = 'sopan.auth.refreshToken';

export interface AuthUser {
    id: string;
    email: string | null;
    userName: string;
}

export interface AuthResult {
    ok: boolean;
    user?: AuthUser;
    error?: string;
}

// ─── Token helpers ─────────────────────────────────────────────────────────────

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Decodes the (unverified) JWT payload purely to read the `sub` claim for
 * scoping client-side data (e.g. localStorage draft keys — see
 * src/lib/storage.ts). This is NOT used for any authorization decision —
 * every real permission check happens server-side against the verified
 * token — so signature verification isn't needed here.
 */
export function getCurrentUserIdFromToken(): string | null {
    const token = getToken();
    if (!token) return null;
    try {
        const payload = token.split('.')[1];
        if (!payload) return null;
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
        const json = JSON.parse(atob(normalized));
        return typeof json?.sub === 'string' ? json.sub : null;
    } catch {
        return null;
    }
}

function saveTokens(token: string, refreshToken?: string | null) {
    localStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function buildAuthUser(raw: { id: string; email: string; fullName?: string | null }): AuthUser {
    return {
        id: raw.id,
        email: raw.email ?? null,
        userName: raw.fullName ?? raw.email?.split('@')[0] ?? 'User',
    };
}

// ─── API helpers ───────────────────────────────────────────────────────────────
// Deliberately self-contained (not built on apiClient.ts) — apiClient's
// refresh-and-retry logic calls back into refreshAccessToken() below, so
// this file must not depend on apiClient to avoid a circular refresh loop.

async function apiPost<T>(path: string, body: unknown): Promise<{ data?: T; error?: string }> {
    try {
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) return { error: json?.error ?? `Request failed (${res.status})` };
        return { data: json as T };
    } catch (err) {
        return { error: 'Unable to reach the server. Please check your connection.' };
    }
}

async function apiGet<T>(path: string, token: string): Promise<{ data?: T; error?: string }> {
    try {
        const res = await fetch(`${API_BASE}${path}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) return { error: json?.error ?? `Request failed (${res.status})` };
        return { data: json as T };
    } catch (err) {
        return { error: 'Unable to reach the server. Please check your connection.' };
    }
}

// ─── Refresh ────────────────────────────────────────────────────────────────────

// De-dupes concurrent 401s (e.g. several requests firing at once) into a
// single /api/refresh call instead of a stampede of parallel refreshes,
// each of which would rotate (and invalidate) the previous one's token.
let inFlightRefresh: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
    if (inFlightRefresh) return inFlightRefresh;

    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    inFlightRefresh = (async () => {
        const { data, error } = await apiPost<{ token: string; refreshToken: string }>('/api/refresh', { refreshToken });
        if (error || !data?.token) {
            clearTokens();
            return null;
        }
        saveTokens(data.token, data.refreshToken);
        return data.token;
    })();

    try {
        return await inFlightRefresh;
    } finally {
        inFlightRefresh = null;
    }
}

// ─── Public API ────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await apiPost<{ token: string; refreshToken?: string; user: { id: string; email: string; fullName?: string | null } }>(
        '/api/login',
        { email, password },
    );
    if (error || !data) return { ok: false, error: error ?? 'Login failed.' };
    saveTokens(data.token, data.refreshToken);
    return { ok: true, user: buildAuthUser(data.user) };
}

export async function register(email: string, password: string, fullName?: string): Promise<AuthResult> {
    const { data, error } = await apiPost<{ token: string; refreshToken?: string; user: { id: string; email: string; fullName?: string | null } }>(
        '/api/signup',
        { email, password, fullName },
    );
    if (error || !data) return { ok: false, error: error ?? 'Registration failed.' };
    saveTokens(data.token, data.refreshToken);
    return { ok: true, user: buildAuthUser(data.user) };
}

export async function logout(): Promise<AuthResult> {
    const refreshToken = getRefreshToken();
    clearTokens();
    if (refreshToken) {
        // Best-effort revoke — the tokens are already cleared locally either way.
        apiPost('/api/logout', { refreshToken }).catch(() => undefined);
    }
    return { ok: true };
}

/** Step 1 of password reset: request a reset token (delivered by email in production). */
export async function resetPassword(email: string): Promise<AuthResult> {
    const { data, error } = await apiPost<{ ok: boolean }>('/api/password-reset/request', { email });
    if (error || !data) return { ok: false, error: error ?? 'Could not request a password reset.' };
    return { ok: true };
}

/** Step 2 of password reset: exchange the token (from the email link) for a new password. */
export async function confirmPasswordReset(token: string, newPassword: string): Promise<AuthResult> {
    const { data, error } = await apiPost<{ ok: boolean }>('/api/password-reset/confirm', { token, newPassword });
    if (error || !data) return { ok: false, error: error ?? 'Could not reset password.' };
    return { ok: true };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
    const token = getToken();
    if (!token) return null;

    let { data, error } = await apiGet<{ user: { id: string; email: string; fullName?: string | null } }>('/api/me', token);

    if (error && !data) {
        // Access token may simply have expired — try a silent refresh before giving up.
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            ({ data, error } = await apiGet<{ user: { id: string; email: string; fullName?: string | null } }>('/api/me', refreshed));
        }
    }

    if (error || !data) {
        clearTokens();
        return null;
    }
    return buildAuthUser(data.user);
}
