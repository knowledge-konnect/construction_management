import type { FastifyInstance } from 'fastify';
import {
    authorizeCompany,
    COMPANY_MANAGEMENT_ROLES,
    COMPANY_READ_ROLES,
} from '../authz.js';
import { createOrLinkTeamMember, listTeamMembers, updateTeamMember } from '../team.js';
import { validateAddTeamMemberPayload } from '../validation.js';

export function registerTeamRoutes(app: FastifyInstance) {
    app.get('/api/company/:companyId/users', async (request, reply) => {
        const { companyId } = request.params as { companyId: string };

        const membership = await authorizeCompany(request, reply, {
            requestedCompanyId: companyId,
            allowedRoles: COMPANY_READ_ROLES,
        });
        if (!membership) return;

        try {
            const members = await listTeamMembers(membership.companyId);
            return reply.send({ members });
        } catch (err: any) {
            app.log.error(err, 'Failed to list team members');
            return reply.status(500).send({ error: 'Failed to load team members.' });
        }
    });

    app.post('/api/company/:companyId/users', async (request, reply) => {
        const { companyId } = request.params as { companyId: string };
        const body = request.body as { email?: string; fullName?: string; password?: string; role?: 'admin' | 'staff' };

        const validationError = validateAddTeamMemberPayload(body);
        if (validationError) {
            return reply.status(400).send({ error: validationError });
        }

        const membership = await authorizeCompany(request, reply, {
            requestedCompanyId: companyId,
            allowedRoles: COMPANY_MANAGEMENT_ROLES,
        });
        if (!membership) return;

        try {
            const result = await createOrLinkTeamMember(
                membership.companyId,
                body.email!.trim().toLowerCase(),
                body.role!,
                body.password,
                body.fullName?.trim() || null,
            );
            return reply.status(201).send({ member: result });
        } catch (err: any) {
            app.log.error(err, 'Failed to add team member');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400) return reply.status(400).send({ error: err.message });
            if (statusCode === 409) return reply.status(409).send({ error: err.message });
            return reply.status(500).send({ error: 'Failed to add team member.' });
        }
    });

    app.put('/api/company/:companyId/users/:userId', async (request, reply) => {
        const { companyId, userId: targetUserId } = request.params as { companyId: string; userId: string };
        const body = request.body as { role?: 'admin' | 'staff'; isActive?: boolean };

        if (body.role !== undefined && body.role !== 'admin' && body.role !== 'staff') {
            return reply.status(400).send({ error: 'Role must be admin or staff.' });
        }

        const membership = await authorizeCompany(request, reply, {
            requestedCompanyId: companyId,
            allowedRoles: COMPANY_MANAGEMENT_ROLES,
        });
        if (!membership) return;

        if (targetUserId === membership.userId) {
            return reply.status(400).send({ error: 'You cannot change your own membership here.' });
        }

        try {
            await updateTeamMember(membership.companyId, targetUserId, { role: body.role, isActive: body.isActive });
            return reply.send({ ok: true });
        } catch (err: any) {
            app.log.error(err, 'Failed to update team member');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 404) return reply.status(404).send({ error: err.message });
            if (statusCode === 400) return reply.status(400).send({ error: err.message });
            return reply.status(500).send({ error: 'Failed to update team member.' });
        }
    });
}
