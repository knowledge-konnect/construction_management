import type { FastifyInstance } from 'fastify';
import {
    authorizeCompany,
    authorizeOwnedResource,
    QUOTATION_ROLES,
} from '../authz.js';
import {
    createCustomerForCompany,
    deleteCustomerRow,
    getCustomerRow,
    listCustomersForCompany,
    updateCustomerRow,
} from '../customers.js';
import { isNonEmptyString, validateCustomerPayload } from '../validation.js';

export function registerCustomerRoutes(app: FastifyInstance) {
    app.get('/api/customers', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
        if (!membership) return;

        try {
            const customers = await listCustomersForCompany(membership.companyId);
            return reply.send({ customers });
        } catch (err: any) {
            app.log.error(err, 'Failed to list customers');
            return reply.status(500).send({ error: 'Failed to load customers.' });
        }
    });

    app.get('/api/customers/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        let customer: any = null;

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                customer = await getCustomerRow(id);
                return customer?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        return reply.send({ customer });
    });

    app.post('/api/customers', async (request, reply) => {
        const body = request.body as any;
        const validationError = validateCustomerPayload(body);
        if (validationError) {
            return reply.status(400).send({ error: validationError });
        }

        const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
        if (!membership) return;

        try {
            const customer = await createCustomerForCompany(membership.companyId, body);
            return reply.status(201).send({ customer });
        } catch (err: any) {
            app.log.error(err, 'Failed to create customer');
            const statusCode = typeof err?.statusCode === 'number'
                ? err.statusCode
                : err?.code === '23505'
                    ? 409
                    : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404 || statusCode === 409) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to create customer.' });
        }
    });

    app.put('/api/customers/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = request.body as any;

        if (body?.name !== undefined && !isNonEmptyString(body.name)) {
            return reply.status(400).send({ error: 'Customer name cannot be empty.' });
        }
        if (body?.email !== undefined) {
            const validationError = validateCustomerPayload({ name: body.name ?? 'placeholder', email: body.email });
            if (validationError && validationError !== 'Customer name is required.') {
                return reply.status(400).send({ error: validationError });
            }
        }

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const existing = await getCustomerRow(id);
                return existing?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        try {
            const customer = await updateCustomerRow(id, body);
            return reply.send({ customer });
        } catch (err: any) {
            app.log.error(err, 'Failed to update customer');
            const statusCode = typeof err?.statusCode === 'number'
                ? err.statusCode
                : err?.code === '23505'
                    ? 409
                    : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404 || statusCode === 409) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to update customer.' });
        }
    });

    app.delete('/api/customers/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const existing = await getCustomerRow(id);
                return existing?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        try {
            await deleteCustomerRow(id, membership.userId);
            return reply.send({ ok: true });
        } catch (err: any) {
            app.log.error(err, 'Failed to delete customer');
            return reply.status(500).send({ error: 'Failed to delete customer.' });
        }
    });
}
