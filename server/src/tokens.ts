import crypto from 'node:crypto';
import { supabaseAdmin } from './auth.js';

// ─── Shared token primitives ────────────────────────────────────────────────────
//
// Both refresh tokens and password-reset tokens are high-entropy opaque
// random strings. The raw value is returned to the caller exactly once and
// never stored — only its SHA-256 hash is persisted (in refresh_tokens /
// password_resets .token_hash). SHA-256 (not bcrypt) is used deliberately:
// these tokens are already 384 bits of randomness (unlike user-chosen
// passwords), so there's no need for a slow, salted KDF — and a plain hash
// lets us look the token up by exact match, which bcrypt's per-call salt
// would not allow.

function generateOpaqueToken(): string {
    return crypto.randomBytes(48).toString('hex');
}

function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

// ─── Refresh tokens (server/src/index.ts: /api/login, /api/signup, /api/refresh, /api/logout) ──

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface RefreshTokenRecord {
    id: string;
    userId: string;
}

/** Issues a new refresh token for a user and stores its hash. Returns the raw token (send to client once). */
export async function issueRefreshToken(
    userId: string,
    meta: { userAgent?: string | null; ip?: string | null } = {},
): Promise<string> {
    const token = generateOpaqueToken();
    const { error } = await supabaseAdmin.from('refresh_tokens').insert({
        user_id: userId,
        token_hash: hashToken(token),
        expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL_MS).toISOString(),
        user_agent: meta.userAgent ?? null,
        ip_address: meta.ip ?? null,
    });
    if (error) throw error;
    return token;
}

/** Looks up a refresh token by its raw value. Returns null if it doesn't exist, is revoked, or has expired. */
export async function findActiveRefreshToken(token: string): Promise<RefreshTokenRecord | null> {
    const { data, error } = await supabaseAdmin
        .from('refresh_tokens')
        .select('id, user_id, expires_at, revoked_at')
        .eq('token_hash', hashToken(token))
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    if (data.revoked_at) return null;
    if (new Date(data.expires_at).getTime() < Date.now()) return null;

    return { id: data.id, userId: data.user_id };
}

/** Revokes a single refresh token by its raw value (used on rotation and on logout). */
export async function revokeRefreshToken(token: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from('refresh_tokens')
        .update({ revoked_at: new Date().toISOString() })
        .eq('token_hash', hashToken(token))
        .is('revoked_at', null);
    if (error) throw error;
}

/** Revokes every active refresh token for a user (used when a password is reset, forcing re-login everywhere). */
export async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from('refresh_tokens')
        .update({ revoked_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('revoked_at', null);
    if (error) throw error;
}

// ─── Password reset tokens (server/src/index.ts: /api/password-reset/*) ────────

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface PasswordResetRecord {
    id: string;
    userId: string;
}

/** Issues a password-reset token for a user and stores its hash. Returns the raw token (send to client once, e.g. via email). */
export async function issuePasswordResetToken(userId: string): Promise<string> {
    const token = generateOpaqueToken();
    const { error } = await supabaseAdmin.from('password_resets').insert({
        user_id: userId,
        token_hash: hashToken(token),
        expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString(),
    });
    if (error) throw error;
    return token;
}

/** Looks up a password-reset token by its raw value. Returns null if it doesn't exist, was already used, or has expired. */
export async function findActivePasswordReset(token: string): Promise<PasswordResetRecord | null> {
    const { data, error } = await supabaseAdmin
        .from('password_resets')
        .select('id, user_id, expires_at, used_at')
        .eq('token_hash', hashToken(token))
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    if (data.used_at) return null;
    if (new Date(data.expires_at).getTime() < Date.now()) return null;

    return { id: data.id, userId: data.user_id };
}

/** Marks a password-reset token as used so it can never be replayed (single-use). */
export async function markPasswordResetUsed(id: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from('password_resets')
        .update({ used_at: new Date().toISOString() })
        .eq('id', id);
    if (error) throw error;
}
