import type { FastifyInstance } from 'fastify';
import {
    comparePassword,
    createUser,
    createUserProfile,
    findUserByEmail,
    findUserById,
    getErrorText,
    getUserProfile,
    hashPassword,
    isTransientNetworkError,
    signJwt,
    updateLastLogin,
    updateUserPassword,
    updateUserProfile,
} from '../auth.js';
import {
    getPrimaryMembership,
    requireAuth,
} from '../authz.js';
import {
    findActivePasswordReset,
    findActiveRefreshToken,
    issuePasswordResetToken,
    issueRefreshToken,
    markPasswordResetUsed,
    revokeAllRefreshTokensForUser,
    revokeRefreshToken,
} from '../tokens.js';
import { isNonEmptyString, isValidEmail } from '../validation.js';
import { getRequestMeta } from '../routeHelpers.js';

export function registerAuthRoutes(app: FastifyInstance) {
    // ─── POST /api/signup ──────────────────────────────────────────────────────
    app.post('/api/signup', { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } }, async (request, reply) => {
        const body = request.body as { email?: string; password?: string; fullName?: string };

        if (!body.email || !body.password) {
            return reply.status(400).send({ error: 'Email and password are required.' });
        }
        if (!isValidEmail(body.email)) {
            return reply.status(400).send({ error: 'Please enter a valid email address.' });
        }
        if (body.password.length < 8) {
            return reply.status(400).send({ error: 'Password must be at least 8 characters.' });
        }

        try {
            const existing = await findUserByEmail(body.email);
            if (existing) {
                return reply.status(409).send({ error: 'An account with this email already exists.' });
            }

            const passwordHash = await hashPassword(body.password);
            let user: Awaited<ReturnType<typeof createUser>>;
            try {
                user = await createUser(body.email, passwordHash);
            } catch (err: any) {
                app.log.error(err, 'Failed to create user');
                return reply.status(500).send({ error: 'Failed to create account. Please try again.' });
            }

            try {
                await createUserProfile(user.id, body.fullName ?? null);
            } catch (err: any) {
                app.log.warn(err, 'Failed to create user profile for user %s', user.id);
            }

            const token = signJwt({ sub: user.id, email: user.email, role: user.role });

            let refreshToken: string | null = null;
            try {
                refreshToken = await issueRefreshToken(user.id, getRequestMeta(request));
            } catch (err: any) {
                app.log.warn(err, 'Failed to issue refresh token for user %s', user.id);
            }

            return reply.status(201).send({
                token,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: body.fullName ?? null,
                    phone: null,
                    role: user.role,
                    mustChangePassword: false,
                },
            });
        } catch (err: any) {
            app.log.error(err, 'Failed to create account');
            const message = getErrorText(err);
            if (isTransientNetworkError(err) || /fetch failed|ECONNRESET|ECONNREFUSED|ENOTFOUND|TLS|network/i.test(message)) {
                return reply.status(503).send({ error: 'Authentication service is temporarily unavailable. Please try again in a moment.' });
            }
            return reply.status(500).send({ error: 'Failed to create account. Please try again.' });
        }
    });

    // ─── POST /api/login ───────────────────────────────────────────────────────
    app.post('/api/login', { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } }, async (request, reply) => {
        const body = request.body as { email?: string; password?: string };

        if (!body.email || !body.password) {
            return reply.status(400).send({ error: 'Email and password are required.' });
        }

        try {
            const user = await findUserByEmail(body.email);

            if (!user) {
                return reply.status(401).send({ error: 'Invalid email or password.' });
            }

            if (!user.is_active) {
                return reply.status(403).send({ error: 'This account has been deactivated. Please contact support.' });
            }

            const valid = await comparePassword(body.password, user.password_hash);
            if (!valid) {
                return reply.status(401).send({ error: 'Invalid email or password.' });
            }

            updateLastLogin(user.id).catch((err) =>
                app.log.warn(err, 'Failed to update last_login_at for user %s', user.id),
            );

            const profile = await getUserProfile(user.id).catch(() => null);
            const token = signJwt({ sub: user.id, email: user.email, role: user.role });

            let refreshToken: string | null = null;
            try {
                refreshToken = await issueRefreshToken(user.id, getRequestMeta(request));
            } catch (err: any) {
                app.log.warn(err, 'Failed to issue refresh token for user %s', user.id);
            }

            return reply.send({
                token,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: profile?.full_name ?? null,
                    phone: profile?.phone ?? null,
                    role: user.role,
                    mustChangePassword: !!user.must_change_password,
                },
            });
        } catch (err: any) {
            app.log.error(err, 'Login failed due to backend auth service issue');
            const message = getErrorText(err);
            if (isTransientNetworkError(err) || /fetch failed|ECONNRESET|ECONNREFUSED|ENOTFOUND|TLS|network/i.test(message)) {
                return reply.status(503).send({ error: 'Authentication service is temporarily unavailable. Please try again in a moment.' });
            }
            return reply.status(500).send({ error: 'Login failed. Please try again.' });
        }
    });

    // ─── POST /api/refresh ─────────────────────────────────────────────────────
    app.post('/api/refresh', { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } }, async (request, reply) => {
        const body = request.body as { refreshToken?: string };
        if (!isNonEmptyString(body?.refreshToken)) {
            return reply.status(401).send({ error: 'Refresh token is required.' });
        }

        try {
            const existing = await findActiveRefreshToken(body.refreshToken);
            if (!existing) {
                return reply.status(401).send({ error: 'Invalid or expired refresh token.' });
            }

            const user = await findUserById(existing.userId);
            if (!user || !user.is_active) {
                return reply.status(401).send({ error: 'Invalid or expired refresh token.' });
            }

            await revokeRefreshToken(body.refreshToken);
            const newRefreshToken = await issueRefreshToken(user.id, getRequestMeta(request));
            const token = signJwt({ sub: user.id, email: user.email, role: user.role });

            return reply.send({ token, refreshToken: newRefreshToken });
        } catch (err: any) {
            app.log.error(err, 'Failed to refresh token');
            return reply.status(500).send({ error: 'Failed to refresh token.' });
        }
    });

    // ─── POST /api/logout ──────────────────────────────────────────────────────
    app.post('/api/logout', async (request, reply) => {
        const body = request.body as { refreshToken?: string };
        if (isNonEmptyString(body?.refreshToken)) {
            try {
                await revokeRefreshToken(body.refreshToken);
            } catch (err: any) {
                app.log.warn(err, 'Failed to revoke refresh token on logout');
            }
        }
        return reply.send({ ok: true });
    });

    // ─── POST /api/password-reset/request ─────────────────────────────────────
    app.post('/api/password-reset/request', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, async (request, reply) => {
        const body = request.body as { email?: string };
        if (!isNonEmptyString(body?.email)) {
            return reply.status(400).send({ error: 'Email is required.' });
        }

        const genericResponse = { ok: true, message: 'If an account exists for that email, a reset link has been generated.' };

        try {
            const user = await findUserByEmail(body.email);
            if (!user || !user.is_active) {
                return reply.send(genericResponse);
            }

            const token = await issuePasswordResetToken(user.id);
            const devTokenEnabled = process.env.ALLOW_DEV_PASSWORD_RESET_TOKEN === 'true';
            const devToken = devTokenEnabled ? token : undefined;

            return reply.send({ ...genericResponse, ...(devToken ? { devToken } : {}) });
        } catch (err: any) {
            app.log.error(err, 'Failed to process password reset request');
            return reply.send(genericResponse);
        }
    });

    // ─── POST /api/password-reset/confirm ─────────────────────────────────────
    app.post('/api/password-reset/confirm', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, async (request, reply) => {
        const body = request.body as { token?: string; newPassword?: string };
        if (!isNonEmptyString(body?.token) || !isNonEmptyString(body?.newPassword)) {
            return reply.status(400).send({ error: 'Reset token and new password are required.' });
        }
        if (body.newPassword.length < 8) {
            return reply.status(400).send({ error: 'Password must be at least 8 characters.' });
        }

        try {
            const reset = await findActivePasswordReset(body.token);
            if (!reset) {
                return reply.status(400).send({ error: 'Invalid or expired reset token.' });
            }

            const passwordHash = await hashPassword(body.newPassword);
            await updateUserPassword(reset.userId, passwordHash);
            await markPasswordResetUsed(reset.id);
            await revokeAllRefreshTokensForUser(reset.userId);

            return reply.send({ ok: true });
        } catch (err: any) {
            app.log.error(err, 'Failed to confirm password reset');
            return reply.status(500).send({ error: 'Failed to reset password.' });
        }
    });

    // ─── GET /api/me ───────────────────────────────────────────────────────────
    app.get('/api/me', async (request, reply) => {
        const userId = requireAuth(request, reply);
        if (!userId) return;

        const user = await findUserById(userId);
        if (!user) {
            return reply.status(404).send({ error: 'User not found.' });
        }
        if (!user.is_active) {
            return reply.status(403).send({ error: 'This account has been deactivated.' });
        }

        const profile = await getUserProfile(user.id).catch(() => null);

        return reply.send({
            user: {
                id: user.id,
                email: user.email,
                fullName: profile?.full_name ?? null,
                phone: profile?.phone ?? null,
                role: user.role,
                mustChangePassword: !!user.must_change_password,
            },
        });
    });

    // ─── PATCH /api/me ─────────────────────────────────────────────────────────
    app.patch('/api/me', async (request, reply) => {
        const userId = requireAuth(request, reply);
        if (!userId) return;

        const body = (request.body ?? {}) as Record<string, unknown>;

        const rawFullName = body.fullName;
        if (typeof rawFullName !== 'string') {
            return reply.status(400).send({ error: 'fullName is required and must be text.' });
        }
        const fullName = rawFullName.trim();
        if (fullName.length < 2 || fullName.length > 100) {
            return reply.status(400).send({ error: 'fullName must be between 2 and 100 characters.' });
        }

        let phone: string | null;
        const rawPhone = body.phone;
        if (rawPhone === null || rawPhone === undefined) {
            phone = null;
        } else if (typeof rawPhone === 'string') {
            const trimmedPhone = rawPhone.trim();
            if (!trimmedPhone) {
                phone = null;
            } else if (!/^[6-9]\d{9}$/.test(trimmedPhone)) {
                return reply.status(400).send({ error: 'phone must be empty or a valid 10-digit mobile number starting with 6-9.' });
            } else {
                phone = trimmedPhone;
            }
        } else {
            return reply.status(400).send({ error: 'phone must be empty or a valid 10-digit mobile number starting with 6-9.' });
        }

        try {
            const user = await findUserById(userId);
            if (!user) {
                return reply.status(404).send({ error: 'User not found.' });
            }
            if (!user.is_active) {
                return reply.status(403).send({ error: 'This account has been deactivated.' });
            }

            await updateUserProfile(user.id, fullName, phone);

            return reply.send({
                user: {
                    id: user.id,
                    email: user.email,
                    fullName,
                    phone,
                    role: user.role,
                    mustChangePassword: !!user.must_change_password,
                },
            });
        } catch (err: any) {
            app.log.error(err, 'Failed to update profile for user %s', userId);
            return reply.status(500).send({ error: 'Failed to update profile.' });
        }
    });

    // ─── POST /api/change-password ─────────────────────────────────────────────
    app.post('/api/change-password', async (request, reply) => {
        const userId = requireAuth(request, reply);
        if (!userId) return;

        const body = request.body as { currentPassword?: string; newPassword?: string };
        if (!isNonEmptyString(body?.currentPassword) || !isNonEmptyString(body?.newPassword)) {
            return reply.status(400).send({ error: 'Current and new password are required.' });
        }
        if (body.newPassword.length < 8) {
            return reply.status(400).send({ error: 'New password must be at least 8 characters.' });
        }

        try {
            const user = await findUserById(userId);
            if (!user) {
                return reply.status(404).send({ error: 'User not found.' });
            }

            const valid = await comparePassword(body.currentPassword, user.password_hash);
            if (!valid) {
                return reply.status(401).send({ error: 'Current password is incorrect.' });
            }

            const newHash = await hashPassword(body.newPassword);
            await updateUserPassword(userId, newHash, true);

            const token = signJwt({ sub: user.id, email: user.email, role: user.role });
            return reply.send({ ok: true, token });
        } catch (err: any) {
            app.log.error(err, 'Failed to change password');
            return reply.status(500).send({ error: 'Failed to change password.' });
        }
    });
}
