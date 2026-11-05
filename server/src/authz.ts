import { supabaseAdmin, verifyJwt } from './auth.js';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'owner' | 'admin' | 'staff' | 'client' | 'investor';
export type CompanyRole = 'owner' | 'admin' | 'staff';

export const EXTERNAL_USER_ROLES: UserRole[] = ['client', 'investor'];

export interface CompanyMembership {
    companyId: string;
    userId: string;
    role: CompanyRole;
}

export function normalizeUserRole(role: unknown): UserRole {
    return role === 'user' || role === 'owner' || role === 'admin' || role === 'staff' || role === 'client' || role === 'investor'
        ? (role as UserRole)
        : 'user';
}

export function isExternalUserRole(role: unknown): boolean {
    const normalized = normalizeUserRole(role);
    return normalized === 'client' || normalized === 'investor';
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
 */
export async function getMembership(userId: string, companyId: string): Promise<CompanyMembership | null> {
    const { data, error } = await supabaseAdmin
        .from('company_users')
        .select('company_id, user_id, role, is_active')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .maybeSingle();

    if (error) throw error;

    if (!data || !data.is_active) return null;
    return { companyId: data.company_id, userId: data.user_id, role: normalizeRole(data.role) };
}

/**
 * Resolves the authenticated user's active company membership from
 * company_users. In the one-user-one-company model this is expected to be
 * exactly one active row.
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
        .limit(2);

    if (error) throw error;
    if (!data || data.length === 0) return null;

    if (data.length > 1) {
        throw new Error('User is linked to multiple active companies.');
    }

    const row = data[0];
    return { companyId: row.company_id, userId: row.user_id, role: normalizeRole(row.role) };
}

export async function resolveMembershipForRequestedCompany(
    userId: string,
    requestedCompanyId?: string | null,
): Promise<CompanyMembership | null> {
    const membership = await getPrimaryMembership(userId);
    if (!membership) return null;
    if (requestedCompanyId && requestedCompanyId !== membership.companyId) return null;
    return membership;
}

export interface ProjectScopedAccess {
    authorizedProjectIds: string[];
    investorFinancialAccess: boolean;
    investorClientReceiptAccess: boolean;
    clientProjectIds: string[];
}

export async function resolveProjectScopedAccess(userId: string): Promise<ProjectScopedAccess | null> {
    const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('id', userId)
        .maybeSingle();

    if (userError) throw userError;
    if (!user?.email) return null;

    const userEmail = String(user.email).trim().toLowerCase();

    const { data: investorRows, error: investorError } = await supabaseAdmin
        .from('project_investors')
        .select('*')
        .eq('is_active', true);
    if (investorError) throw investorError;

    const { data: clientRows, error: clientError } = await supabaseAdmin
        .from('project_client_access')
        .select('*');
    if (clientError) throw clientError;

    const investorProjectIds = new Set<string>();
    let investorFinancialAccess = false;
    let investorClientReceiptAccess = false;

    for (const row of investorRows ?? []) {
        if (!row?.project_id) continue;
        const rowEmail = String(row.email ?? '').trim().toLowerCase();
        const rowUserId = row.user_id;
        const userIdMatched = rowUserId === userId;
        const emailMatched = rowUserId == null && rowEmail.length > 0 && rowEmail === userEmail;
        const conflictingUserId = rowUserId && rowUserId !== userId;
        const conflictingEmail = rowUserId && rowEmail && rowEmail !== userEmail;

        if (conflictingUserId || conflictingEmail) continue;
        if (!userIdMatched && !emailMatched) continue;

        investorProjectIds.add(String(row.project_id));
        if (Boolean(row.can_view_financials)) investorFinancialAccess = true;
        if (Boolean(row.can_view_client_receipts)) investorClientReceiptAccess = true;
    }

    const clientProjectIds = new Set<string>();
    for (const row of clientRows ?? []) {
        if (!row?.project_id) continue;
        const rowEmail = String(row.email ?? '').trim().toLowerCase();
        const rowUserId = row.user_id;
        const userIdMatched = rowUserId === userId;
        const emailMatched = rowUserId == null && rowEmail.length > 0 && rowEmail === userEmail;
        const conflictingUserId = rowUserId && rowUserId !== userId;
        const conflictingEmail = rowUserId && rowEmail && rowEmail !== userEmail;

        if (conflictingUserId || conflictingEmail) continue;
        if (!userIdMatched && !emailMatched) continue;
        if (row.invitation_status !== 'accepted') continue;

        clientProjectIds.add(String(row.project_id));
    }

    const authorizedProjectIds = [...new Set([...investorProjectIds, ...clientProjectIds])];
    if (authorizedProjectIds.length === 0) return null;

    return {
        authorizedProjectIds,
        investorFinancialAccess,
        investorClientReceiptAccess,
        clientProjectIds: [...clientProjectIds],
    };
}

/**
 * Ensures the given user_id is recorded as an active member of a company.
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
 * 2. Resolves the caller's own active company membership from company_users.
 * 3. If `requestedCompanyId` is supplied, confirms it matches that membership
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
        membership = await resolveMembershipForRequestedCompany(userId, opts.requestedCompanyId);
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
 * then verifies the authenticated user belongs to THAT company.
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
        membership = await resolveMembershipForRequestedCompany(userId, companyId);
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
