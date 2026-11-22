import type { FastifyInstance } from 'fastify';
import {
    authorizeCompany,
    authorizeOwnedResource,
    QUOTATION_ROLES,
} from '../authz.js';
import {
    createSupplierForCompany,
    deleteSupplierRow,
    getSupplierRow,
    listSuppliersForCompany,
    updateSupplierRow,
} from '../suppliers.js';
import { isNonEmptyString, validateSupplierPayload } from '../validation.js';

export function registerSupplierRoutes(app: FastifyInstance) {
    app.get('/api/suppliers', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
        if (!membership) return;

        try {
            const suppliers = await listSuppliersForCompany(membership.companyId);
            return reply.send({ suppliers });
        } catch (err: any) {
            app.log.error(err, 'Failed to list suppliers');
            return reply.status(500).send({ error: 'Failed to load suppliers.' });
        }
    });

    app.get('/api/suppliers/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        let supplier: any = null;

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                supplier = await getSupplierRow(id);
                return supplier?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        return reply.send({ supplier });
    });

    app.post('/api/suppliers', async (request, reply) => {
        const body = request.body as any;
        const validationError = validateSupplierPayload(body);
        if (validationError) {
            return reply.status(400).send({ error: validationError });
        }

        const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
        if (!membership) return;

        try {
            const supplier = await createSupplierForCompany(membership.companyId, body);
            return reply.status(201).send({ supplier });
        } catch (err: any) {
            app.log.error(err, 'Failed to create supplier');
            const statusCode = typeof err?.statusCode === 'number'
                ? err.statusCode
                : err?.code === '23505'
                    ? 409
                    : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404 || statusCode === 409) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to create supplier.' });
        }
    });

    app.put('/api/suppliers/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = request.body as any;

        if (body?.name !== undefined && !isNonEmptyString(body.name)) {
            return reply.status(400).send({ error: 'Supplier name cannot be empty.' });
        }
        const supplierValidationError = validateSupplierPayload({
            name: body?.name ?? 'placeholder',
            mobile: body?.mobile,
            gstin: body?.gstin,
        });
        if (supplierValidationError && supplierValidationError !== 'Supplier name is required.') {
            return reply.status(400).send({ error: supplierValidationError });
        }

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const existing = await getSupplierRow(id);
                return existing?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        try {
            const supplier = await updateSupplierRow(id, body);
            return reply.send({ supplier });
        } catch (err: any) {
            app.log.error(err, 'Failed to update supplier');
            const statusCode = typeof err?.statusCode === 'number'
                ? err.statusCode
                : err?.code === '23505'
                    ? 409
                    : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404 || statusCode === 409) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to update supplier.' });
        }
    });

    app.delete('/api/suppliers/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const existing = await getSupplierRow(id);
                return existing?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        try {
            await deleteSupplierRow(id);
            return reply.send({ ok: true });
        } catch (err: any) {
            app.log.error(err, 'Failed to delete supplier');
            return reply.status(500).send({ error: 'Failed to delete supplier.' });
        }
    });
}
