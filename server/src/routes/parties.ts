import type { FastifyInstance } from 'fastify';
import {
    authorizeCompany,
    authorizeOwnedResource,
    QUOTATION_ROLES,
} from '../authz.js';
import {
    createPartyForCompany,
    deletePartyRow,
    getPartyRow,
    listPartiesForCompany,
    updatePartyRow,
} from '../parties.js';
import { isNonEmptyString, validatePartyPayload } from '../validation.js';

export function registerPartyRoutes(app: FastifyInstance) {
    app.get('/api/parties', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
        if (!membership) return;

        const { type, search, activeOnly } = request.query as { type?: string; search?: string; activeOnly?: string | boolean };

        try {
            const parties = await listPartiesForCompany(membership.companyId, {
                type: type && type !== 'null' ? type : 'all',
                search,
                activeOnly: activeOnly === true || activeOnly === 'true',
            });
            return reply.send({ parties });
        } catch (err: any) {
            app.log.error(err, 'Failed to list parties');
            return reply.status(500).send({ error: 'Failed to load parties.' });
        }
    });

    app.get('/api/parties/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        let party: any = null;

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                party = await getPartyRow(id);
                return party?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        return reply.send({ party });
    });

    app.post('/api/parties', async (request, reply) => {
        const body = request.body as any;
        const validationError = validatePartyPayload(body);
        if (validationError) {
            return reply.status(400).send({ error: validationError });
        }

        const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
        if (!membership) return;

        try {
            const party = await createPartyForCompany(membership.companyId, {
                ...body,
                is_customer: Boolean(body?.is_customer ?? false),
                is_supplier: Boolean(body?.is_supplier ?? false),
                is_investor: Boolean(body?.is_investor ?? false),
            });
            return reply.status(201).send({ party });
        } catch (err: any) {
            app.log.error(err, 'Failed to create party');
            if (err?.code === '23514' && err?.constraint === 'parties_has_role') {
                return reply.status(400).send({ error: 'General contacts are not enabled yet for this database. Apply migration 0019_generic_party_contact_support.sql and try again.' });
            }
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400) return reply.status(400).send({ error: err.message });
            if (statusCode === 409) return reply.status(409).send({ error: err.message });
            return reply.status(500).send({ error: 'Failed to create party.' });
        }
    });

    app.put('/api/parties/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = request.body as any;

        if (body?.name !== undefined && !isNonEmptyString(body.name)) {
            return reply.status(400).send({ error: 'Party name cannot be empty.' });
        }
        const validationError = validatePartyPayload({
            ...body,
            name: body?.name ?? 'placeholder',
            is_customer: Boolean(body?.is_customer ?? false),
            is_supplier: Boolean(body?.is_supplier ?? false),
            is_investor: Boolean(body?.is_investor ?? false),
        });
        if (validationError && validationError !== 'Party name is required.') {
            return reply.status(400).send({ error: validationError });
        }

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const existing = await getPartyRow(id);
                return existing?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        try {
            const party = await updatePartyRow(id, body);
            return reply.send({ party });
        } catch (err: any) {
            app.log.error(err, 'Failed to update party');
            if (err?.code === '23514' && err?.constraint === 'parties_has_role') {
                return reply.status(400).send({ error: 'General contacts are not enabled yet for this database. Apply migration 0019_generic_party_contact_support.sql and try again.' });
            }
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400) return reply.status(400).send({ error: err.message });
            if (statusCode === 409) return reply.status(409).send({ error: err.message });
            return reply.status(500).send({ error: 'Failed to update party.' });
        }
    });

    app.delete('/api/parties/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const existing = await getPartyRow(id);
                return existing?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        try {
            await deletePartyRow(id, membership.userId);
            return reply.send({ ok: true });
        } catch (err: any) {
            app.log.error(err, 'Failed to delete party');
            return reply.status(500).send({ error: 'Failed to delete party.' });
        }
    });
}
