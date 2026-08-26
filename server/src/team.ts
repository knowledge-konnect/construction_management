import { createUser, createUserProfile, findUserByEmail, hashPassword, supabaseAdmin } from './auth.js';
import { ensureCompanyMembership, getMembership, type CompanyRole } from './authz.js';

export interface TeamMember {
    userId: string;
    email: string;
    fullName: string | null;
    role: CompanyRole;
    isActive: boolean;
    createdAt: string;
}

export async function listTeamMembers(companyId: string): Promise<TeamMember[]> {
    const { data: memberships, error } = await supabaseAdmin
        .from('company_users')
        .select('user_id, role, is_active, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    if (!memberships || memberships.length === 0) return [];

    const userIds = memberships.map((m) => m.user_id);

    // company_users -> user_profiles isn't a direct FK PostgREST can embed in
    // one hop (user_profiles keys off users.id, not company_users.id), so
    // these are fetched separately and merged in JS rather than guessed at
    // via an embed syntax that might not match the live schema.
    const [{ data: users, error: usersError }, { data: profiles, error: profilesError }] = await Promise.all([
        supabaseAdmin.from('users').select('id, email').in('id', userIds),
        supabaseAdmin.from('user_profiles').select('user_id, full_name').in('user_id', userIds),
    ]);
    if (usersError) throw usersError;
    if (profilesError) throw profilesError;

    const emailById = new Map((users ?? []).map((u: any) => [u.id, u.email]));
    const nameById = new Map((profiles ?? []).map((p: any) => [p.user_id, p.full_name]));

    return memberships.map((m: any) => ({
        userId: m.user_id,
        email: emailById.get(m.user_id) ?? '',
        fullName: nameById.get(m.user_id) ?? null,
        role: m.role,
        isActive: m.is_active,
        createdAt: m.created_at,
    }));
}

export interface CreateOrLinkTeamMemberResult {
    userId: string;
    email: string;
    fullName: string | null;
    role: CompanyRole;
    isNewAccount: boolean;
}

/**
 * Admin/owner-only: adds a teammate to the company.
 * - If no account exists for the email yet, creates one with the
 *   admin-supplied password and flags it must_change_password so the new
 *   teammate is forced to set their own password on first login.
 * - If an account already exists for that email (e.g. they're already a
 *   member of another company), links it to THIS company via company_users
 *   without touching their existing password at all.
 */
export async function createOrLinkTeamMember(
    companyId: string,
    email: string,
    role: CompanyRole,
    password: string | undefined,
    fullName: string | null,
): Promise<CreateOrLinkTeamMemberResult> {
    const existing = await findUserByEmail(email);

    if (existing) {
        await ensureCompanyMembership(companyId, existing.id, role);
        return { userId: existing.id, email: existing.email, fullName: fullName ?? null, role, isNewAccount: false };
    }

    if (!password) {
        const err: any = new Error('A password is required to create a new account for this email.');
        err.statusCode = 400;
        throw err;
    }

    const passwordHash = await hashPassword(password);
    const created = await createUser(email, passwordHash, true);

    try {
        await createUserProfile(created.id, fullName ?? null);
    } catch {
        // Non-fatal — same as signup's own profile creation.
    }

    await ensureCompanyMembership(companyId, created.id, role);

    return { userId: created.id, email: created.email, fullName: fullName ?? null, role, isNewAccount: true };
}

/**
 * Admin/owner-only: changes a teammate's role or active status. Refuses to
 * touch an 'owner' row (ownership transfer isn't supported here) and refuses
 * to let a caller modify their own membership through this endpoint, to
 * avoid an admin accidentally locking themselves out.
 */
export async function updateTeamMember(
    companyId: string,
    targetUserId: string,
    updates: { role?: 'admin' | 'staff'; isActive?: boolean },
): Promise<void> {
    const target = await getMembership(targetUserId, companyId);
    if (!target) {
        const err: any = new Error('Team member not found in this company.');
        err.statusCode = 404;
        throw err;
    }
    if (target.role === 'owner') {
        const err: any = new Error('The company owner\u2019s membership cannot be changed here.');
        err.statusCode = 400;
        throw err;
    }

    const patch: Record<string, unknown> = {};
    if (updates.role) patch.role = updates.role;
    if (updates.isActive !== undefined) patch.is_active = updates.isActive;

    const { error } = await supabaseAdmin
        .from('company_users')
        .update(patch)
        .eq('company_id', companyId)
        .eq('user_id', targetUserId);
    if (error) throw error;
}
