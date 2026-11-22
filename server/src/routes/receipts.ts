import type { FastifyInstance } from 'fastify';
import {
    authorizeCompany,
    authorizeOwnedResource,
    getPrimaryMembership,
    QUOTATION_ROLES,
    requireAuth,
} from '../authz.js';
import {
    createReceiptAllocationForInvoice,
    createReceiptForCompany,
    deleteReceiptRow,
    getReceiptRowById,
    listPaymentAllocationsForReceipt,
    listReceiptsForCompany,
    updateReceiptRow,
} from '../receipts.js';

export function registerReceiptRoutes(app: FastifyInstance) {
    app.get('/api/receipts', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
        if (!membership) return;

        const { projectId, customerId } = request.query as { projectId?: string; customerId?: string };
        try {
            const receipts = await listReceiptsForCompany(membership.companyId, {
                projectId: projectId && projectId !== 'null' ? projectId : null,
                customerId: customerId && customerId !== 'null' ? customerId : null,
            });
            return reply.send({ receipts });
        } catch (err: any) {
            app.log.error(err, 'Failed to list receipts');
            return reply.status(500).send({ error: 'Failed to load receipts.' });
        }
    });

    app.get('/api/receipts/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const receipt = await getReceiptRowById(id);
                return receipt?.companyId ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        const receipt = await getReceiptRowById(id);
        if (!receipt) {
            return reply.status(404).send({ error: 'Receipt not found.' });
        }

        const allocations = await listPaymentAllocationsForReceipt(id, membership.companyId);
        return reply.send({ receipt: { ...receipt, allocations } });
    });

    app.post('/api/receipts', async (request, reply) => {
        const userId = requireAuth(request, reply);
        if (!userId) return;

        const body = request.body as { receipt?: any; companyId?: string };
        if (!body?.receipt) {
            return reply.status(400).send({ error: 'Receipt payload is required.' });
        }

        const membership = await getPrimaryMembership(userId);
        if (!membership) {
            return reply.status(400).send({ error: 'No company found for this user. Create a company before saving a receipt.' });
        }

        const requestedCompanyId = body.companyId && body.companyId !== 'local-company' ? body.companyId : null;
        if (requestedCompanyId && requestedCompanyId !== membership.companyId) {
            return reply.status(403).send({ error: 'Forbidden.' });
        }
        if (!QUOTATION_ROLES.includes(membership.role)) {
            return reply.status(403).send({ error: 'Forbidden.' });
        }

        try {
            const receipt = await createReceiptForCompany(
                membership.companyId,
                { ...body.receipt, company_id: membership.companyId },
                userId,
            );
            return reply.status(201).send({ receipt });
        } catch (err: any) {
            app.log.error(err, 'Failed to create receipt');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 403) return reply.status(403).send({ error: err.message || 'Forbidden.' });
            if (statusCode === 404) return reply.status(404).send({ error: err.message || 'Resource not found.' });
            if (statusCode === 409) return reply.status(409).send({ error: err.message });
            const isProduction = process.env.NODE_ENV === 'production';
            return reply.status(500).send({
                error: isProduction ? 'Failed to save receipt.' : (err.message || 'Failed to save receipt.'),
            });
        }
    });

    app.put('/api/receipts/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = request.body as any;

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const receipt = await getReceiptRowById(id);
                return receipt?.companyId ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        try {
            const receipt = await updateReceiptRow(id, membership.companyId, body ?? {});
            return reply.send({ receipt });
        } catch (err: any) {
            app.log.error(err, 'Failed to update receipt');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404 || statusCode === 409) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to update receipt.' });
        }
    });

    app.delete('/api/receipts/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const receipt = await getReceiptRowById(id);
                return receipt?.companyId ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        try {
            await deleteReceiptRow(id, membership.companyId);
            return reply.send({ ok: true });
        } catch (err: any) {
            app.log.error(err, 'Failed to delete receipt');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to delete receipt.' });
        }
    });

    app.get('/api/receipts/:id/allocations', async (request, reply) => {
        const { id } = request.params as { id: string };

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const receipt = await getReceiptRowById(id);
                return receipt?.companyId ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        try {
            const allocations = await listPaymentAllocationsForReceipt(id, membership.companyId);
            return reply.send({ allocations });
        } catch (err: any) {
            app.log.error(err, 'Failed to list receipt allocations');
            return reply.status(500).send({ error: 'Failed to load receipt allocations.' });
        }
    });

    app.post('/api/receipts/:id/allocations', async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = request.body as {
            invoiceId?: string;
            invoice_id?: string;
            amount?: number | string;
            invoiceAmount?: number | string;
        };
        const invoiceId = body?.invoiceId ?? body?.invoice_id;
        const amount = body?.amount ?? body?.invoiceAmount ?? 0;

        if (!invoiceId) {
            return reply.status(400).send({ error: 'Invoice is required.' });
        }

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const receipt = await getReceiptRowById(id);
                return receipt?.companyId ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        try {
            const result = await createReceiptAllocationForInvoice(id, invoiceId, membership.companyId, amount);
            return reply.status(201).send(result);
        } catch (err: any) {
            app.log.error(err, 'Failed to allocate receipt');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
                return reply.status(statusCode).send({ error: err.message });
            }
            return reply.status(500).send({ error: 'Failed to allocate receipt.' });
        }
    });
}
