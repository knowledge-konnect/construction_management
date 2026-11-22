import type { FastifyInstance } from 'fastify';
import {
    authorizeCompany,
    authorizeOwnedResource,
    getPrimaryMembership,
    QUOTATION_ROLES,
    requireAuth,
} from '../authz.js';
import {
    cancelInvoiceRow,
    createInvoiceForCompany,
    deleteInvoiceRow,
    getInvoiceRowById,
    issueInvoiceRow,
    listInvoicesForCompany,
    peekNextInvoiceNumber,
    updateInvoiceRow,
    validateInvoicePayload,
} from '../invoices.js';

export function registerInvoiceRoutes(app: FastifyInstance) {
    app.get('/api/invoices', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
        if (!membership) return;

        const projectId = (request.query as { projectId?: string } | undefined)?.projectId ?? null;
        try {
            const invoices = await listInvoicesForCompany(membership.companyId, projectId);
            return reply.send({ invoices });
        } catch (err: any) {
            app.log.error(err, 'Failed to list invoices');
            return reply.status(500).send({ error: 'Failed to load invoices.' });
        }
    });

    app.get('/api/invoices/next-sequence', async (request, reply) => {
        const userId = requireAuth(request, reply);
        if (!userId) return;

        try {
            const membership = await getPrimaryMembership(userId);
            if (!membership) {
                return reply.send({ nextSequence: 1 });
            }

            const preview = await peekNextInvoiceNumber(membership.companyId);
            const match = preview.match(/(\d+)$/);
            return reply.send({ nextSequence: match ? Number(match[1]) : 1 });
        } catch (err: any) {
            app.log.error(err, 'Failed to get invoice sequence');
            return reply.status(500).send({ error: 'Failed to get invoice sequence.' });
        }
    });

    app.get('/api/invoices/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        let invoice: any = null;

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                invoice = await getInvoiceRowById(id);
                return invoice?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        return reply.send({ invoice });
    });

    app.post('/api/invoices', async (request, reply) => {
        const userId = requireAuth(request, reply);
        if (!userId) return;

        const body = request.body as { invoice?: any; companyId?: string };
        if (!body?.invoice) {
            return reply.status(400).send({ error: 'Invoice payload is required.' });
        }

        const validationError = validateInvoicePayload(body.invoice);
        if (validationError) {
            return reply.status(400).send({ error: validationError });
        }

        const requestedCompanyId = body.companyId && body.companyId !== 'local-company' ? body.companyId : null;

        try {
            const membership = await getPrimaryMembership(userId);
            if (!membership) {
                return reply.status(400).send({ error: 'No company found for this user. Create a company before saving an invoice.' });
            }

            if (requestedCompanyId && requestedCompanyId !== membership.companyId) {
                return reply.status(403).send({ error: 'Forbidden.' });
            }

            if (!QUOTATION_ROLES.includes(membership.role)) {
                return reply.status(403).send({ error: 'Forbidden.' });
            }

            const invoice = await createInvoiceForCompany(membership.companyId, {
                ...body.invoice,
                company_id: membership.companyId,
            });
            return reply.status(201).send({ invoice });
        } catch (err: any) {
            app.log.error(err, 'Failed to create invoice');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 403) return reply.status(403).send({ error: 'Forbidden.' });
            if (statusCode === 409) return reply.status(409).send({ error: err.message });
            return reply.status(500).send({ error: 'Failed to save invoice.' });
        }
    });

    app.put('/api/invoices/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = request.body as any;

        if (!body || typeof body !== 'object') {
            return reply.status(400).send({ error: 'Invoice payload is required.' });
        }

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const existing = await getInvoiceRowById(id);
                return existing?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        try {
            const invoice = await updateInvoiceRow(id, membership.companyId, body);
            return reply.send({ invoice });
        } catch (err: any) {
            app.log.error(err, 'Failed to update invoice');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 400) return reply.status(400).send({ error: err.message });
            if (statusCode === 409) return reply.status(409).send({ error: err.message });
            return reply.status(500).send({ error: 'Failed to update invoice.' });
        }
    });

    app.post('/api/invoices/:id/issue', async (request, reply) => {
        const { id } = request.params as { id: string };

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const existing = await getInvoiceRowById(id);
                return existing?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        try {
            const invoice = await issueInvoiceRow(id, membership.companyId);
            return reply.send({ invoice });
        } catch (err: any) {
            app.log.error(err, 'Failed to issue invoice');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 409) return reply.status(409).send({ error: err.message });
            return reply.status(500).send({ error: 'Failed to issue invoice.' });
        }
    });

    app.post('/api/invoices/:id/cancel', async (request, reply) => {
        const { id } = request.params as { id: string };

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const existing = await getInvoiceRowById(id);
                return existing?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        try {
            const invoice = await cancelInvoiceRow(id, membership.companyId);
            return reply.send({ invoice });
        } catch (err: any) {
            app.log.error(err, 'Failed to cancel invoice');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 409) return reply.status(409).send({ error: err.message });
            return reply.status(500).send({ error: 'Failed to cancel invoice.' });
        }
    });

    app.delete('/api/invoices/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const existing = await getInvoiceRowById(id);
                return existing?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        try {
            const result = await deleteInvoiceRow(id, membership.companyId);
            return reply.send(result);
        } catch (err: any) {
            app.log.error(err, 'Failed to delete invoice');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 409) return reply.status(409).send({ error: err.message });
            return reply.status(500).send({ error: 'Failed to delete invoice.' });
        }
    });

    app.get('/api/invoices/:id/payments', async (request, reply) => {
        const { id } = request.params as { id: string };

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const invoice = await getInvoiceRowById(id);
                return invoice?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        try {
            const { listPaymentAllocationsForInvoice } = await import('../receipts.js');
            const allocations = await listPaymentAllocationsForInvoice(id, membership.companyId);
            return reply.send({ allocations });
        } catch (err: any) {
            app.log.error(err, 'Failed to list invoice allocations');
            return reply.status(500).send({ error: 'Failed to load invoice payments.' });
        }
    });
}
