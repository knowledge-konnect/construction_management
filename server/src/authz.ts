import { supabaseAdmin, verifyJwt } from './auth.js';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type CompanyRole = 'owner' | 'admin' | 'staff';

export interface CompanyMembership {
    companyId: string;
    userId: string;
    role: CompanyRole;
}

// Role groups used by route handlers (see the authorizeCompany/authorizeOwnedResource docs below).
export const COMPANY_MANAGEMENT_ROLES: CompanyRole[] = ['owner', 'admin'];
export const COMPANY_READ_ROLES: CompanyRole[] = ['owner', 'admin', 'staff'];
export const QUOTATION_ROLES: CompanyRole[] = ['owner', 'admin', 'staff'];

function normalizeRole(role: unknown): CompanyRole {
    return role === 'owner' || role === 'admin' || role === 'staff' ? role : 'staff';
}

// ─── JWT extraction ─────────────────────────────────────────────────────────────

/**
 * Reads and verifies the Bearer JWT on the request, returning the authenticated
 * user_id (the token's `sub` claim). Sends 401 and returns null if the token is
 * missing/invalid — callers must return immediately when this returns null.
 */
export function requireAuth(request: any, reply: any): string | null {
    const authHeader = request.headers.authorization as string | undefined;
    if (!authHeader?.startsWith('Bearer ')) {
        reply.status(401).send({ error: 'Missing or malformed authorization header.' });
        return null;
    }
    const token = authHeader.slice(7);
    const payload = verifyJwt(token) as { sub?: string } | null;
    if (!payload?.sub) {
        reply.status(401).send({ error: 'Invalid or expired token.' });
        return null;
    }
    return payload.sub;
}

// ─── company_users lookups ─────────────────────────────────────────────────────

/**
 * Looks up whether `userId` is an active member of `companyId` via company_users.
 *
 * Legacy fallback: if no company_users row exists yet for this pair, but the
 * user is the direct owner on `companies.owner_id`, they are treated as an
 * implicit 'owner'. This covers companies/users created before company_users
 * existed, without requiring a data migration or schema change.
 */
export async function getMembership(userId: string, companyId: string): Promise<CompanyMembership | null> {
    const { data, error } = await supabaseAdmin
        .from('company_users')
        .select('company_id, user_id, role, is_active')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .maybeSingle();

    if (error) throw error;

    if (data) {
        if (!data.is_active) return null;
        return { companyId: data.company_id, userId: data.user_id, role: normalizeRole(data.role) };
    }

    // Legacy fallback — no company_users row yet.
    const { data: company, error: companyError } = await supabaseAdmin
        .from('companies')
        .select('id, owner_id')
        .eq('id', companyId)
        .maybeSingle();

    if (companyError) throw companyError;
    if (company && company.owner_id === userId) {
        return { companyId: company.id, userId, role: 'owner' };
    }

    return null;
}

/**
 * Finds the company a user belongs to when the caller has NOT supplied an
 * explicit companyId (e.g. GET /api/company, GET /api/quotations). A user
 * may legitimately belong to more than one company (multiple company_users
 * rows) — this deterministically picks their OLDEST active membership
 * (ordered by created_at) as the "primary" one, rather than an arbitrary
 * row order, so the same user always lands on the same company across
 * requests. Falls back to direct `companies.owner_id` ownership for legacy
 * rows with no company_users entry.
 *
 * Returns null if the user has no company yet — callers must treat this as a
 * normal "no company" state, not an authorization failure.
 */
export async function getPrimaryMembership(userId: string): Promise<CompanyMembership | null> {
    const { data, error } = await supabaseAdmin
        .from('company_users')
        .select('company_id, user_id, role, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    if (data) {
        return { companyId: data.company_id, userId: data.user_id, role: normalizeRole(data.role) };
    }

    // Legacy fallback — user may own a company created before company_users existed.
    const { data: company, error: companyError } = await supabaseAdmin
        .from('companies')
        .select('id, owner_id')
        .eq('owner_id', userId)
        .maybeSingle();

    if (companyError) throw companyError;
    if (company) {
        return { companyId: company.id, userId, role: 'owner' };
    }

    return null;
}

/**
 * Ensures the given user_id is recorded as an active member of a company.
 * Used right after a company is created so future authorization checks can
 * rely on company_users instead of the legacy-fallback path. Non-fatal by
 * design — the legacy fallback in getMembership/getPrimaryMembership covers
 * the case where this insert doesn't happen for any reason.
 */
export async function ensureCompanyMembership(
    companyId: string,
    userId: string,
    role: CompanyRole,
): Promise<void> {
    const { error } = await supabaseAdmin
        .from('company_users')
        .upsert(
            { company_id: companyId, user_id: userId, role, is_active: true },
            { onConflict: 'company_id,user_id' },
        );

    if (error) throw error;
}

// ─── Route-level authorization helper ──────────────────────────────────────────

export interface AuthorizeOptions {
    /**
     * The companyId the request is asking to act on (from a path param, query
     * string, or request body). Treated ONLY as a requested context — it is
     * always verified against company_users before being trusted. Omit this
     * for endpoints that don't take an explicit companyId; the caller's
     * primary membership is used instead.
     */
    requestedCompanyId?: string | null;
    /** Roles allowed to perform this action. Defaults to any active member. */
    allowedRoles?: CompanyRole[];
}

/**
 * Reusable company-level authorization middleware/helper.
 *
 * 1. Reads user_id from the verified JWT (401 if missing/invalid).
 * 2. Resolves the target company: the verified `requestedCompanyId` if one was
 *    supplied, otherwise the caller's own primary company membership.
 * 3. Confirms the user is an ACTIVE company_users member of that company
 *    (403 if not — a client-supplied companyId is NEVER trusted directly).
 * 4. Optionally enforces a role allow-list (403 if the member's role isn't in it).
 *
 * On success returns { userId, companyId, role }. On failure it has already
 * written the error response — callers must `return` immediately when this
 * resolves to null.
 */
export async function authorizeCompany(
    request: any,
    reply: any,
    opts: AuthorizeOptions = {},
): Promise<CompanyMembership | null> {
    const userId = requireAuth(request, reply);
    if (!userId) return null;

    let membership: CompanyMembership | null;
    try {
        membership = opts.requestedCompanyId
            ? await getMembership(userId, opts.requestedCompanyId)
            : await getPrimaryMembership(userId);
    } catch (err) {
        reply.status(500).send({ error: 'Failed to verify company access.' });
        return null;
    }

    if (!membership) {
        reply.status(403).send({ error: 'Forbidden.' });
        return null;
    }

    if (opts.allowedRoles && !opts.allowedRoles.includes(membership.role)) {
        reply.status(403).send({ error: 'Forbidden.' });
        return null;
    }

    return membership;
}

/**
 * For resources identified only by their own id (e.g. GET/PUT/DELETE
 * /api/quotations/:id): loads the row's company_id first via `loadCompanyId`,
 * then verifies the authenticated user is an active member of THAT company.
 * Returns 404 if the row doesn't exist, 403 if the user isn't a member of the
 * owning company, otherwise { membership, companyId }.
 */
export async function authorizeOwnedResource(
    request: any,
    reply: any,
    loadCompanyId: () => Promise<string | null>,
    opts: { allowedRoles?: CompanyRole[] } = {},
): Promise<CompanyMembership | null> {
    const userId = requireAuth(request, reply);
    if (!userId) return null;

    let companyId: string | null;
    try {
        companyId = await loadCompanyId();
    } catch (err) {
        reply.status(500).send({ error: 'Failed to load resource.' });
        return null;
    }

    if (!companyId) {
        reply.status(404).send({ error: 'Not found.' });
        return null;
    }

    let membership: CompanyMembership | null;
    try {
        membership = await getMembership(userId, companyId);
    } catch (err) {
        reply.status(500).send({ error: 'Failed to verify company access.' });
        return null;
    }

    if (!membership) {
        reply.status(403).send({ error: 'Forbidden.' });
        return null;
    }

    if (opts.allowedRoles && !opts.allowedRoles.includes(membership.role)) {
        reply.status(403).send({ error: 'Forbidden.' });
        return null;
    }

    return membership;
}
