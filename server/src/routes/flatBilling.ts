import type { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../auth.js';
import {
    authorizeCompany,
    authorizeOwnedResource,
    getPrimaryMembership,
    QUOTATION_ROLES,
    requireAuth,
} from '../authz.js';
import {
    getFlatBillingRow,
    listFlatBillingsForCompany,
    saveFlatBillingToDatabase,
    softDeleteFlatBilling,
} from '../flatBilling.js';
import { peekNextDocumentNumber } from '../sequence.js';
import { validateFlatBillingPayload } from '../validation.js';

export function registerFlatBillingRoutes(app: FastifyInstance) {
    app.get('/api/flat-billings', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
        if (!membership) return;

        const projectId = (request.query as { projectId?: string } | undefined)?.projectId ?? null;

        try {
            const flatBillings = await listFlatBillingsForCompany(membership.companyId, projectId || null);
            return reply.send({ flatBillings });
        } catch (err: any) {
            app.log.error(err, 'Failed to list flat billings');
            return reply.status(500).send({ error: 'Failed to load receipts.' });
        }
    });

    app.get('/api/flat-billings/next-sequence', async (request, reply) => {
        const userId = requireAuth(request, reply);
        if (!userId) return;

        const queryCompanyId = (request.query as { companyId?: string }).companyId;
        const requestedCompanyId = queryCompanyId && queryCompanyId !== 'local-company' ? queryCompanyId : null;

        try {
            const membership = await getPrimaryMembership(userId);

            if (!membership) {
                return reply.send({ nextSequence: 1 });
            }

            if (requestedCompanyId && requestedCompanyId !== membership.companyId) {
                return reply.status(403).send({ error: 'Forbidden.' });
            }

            const preview = await peekNextDocumentNumber(membership.companyId, 'BookingReceipt');
            const match = preview.match(/(\d+)$/);
            return reply.send({ nextSequence: match ? Number(match[1]) : 1 });
        } catch (err: any) {
            app.log.error(err, 'Failed to get receipt sequence');
            return reply.status(500).send({ error: 'Failed to get receipt sequence.' });
        }
    });

    app.get('/api/flat-billings/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        let flatBilling: any = null;

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                flatBilling = await getFlatBillingRow(id);
                return flatBilling?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        return reply.send({ flatBilling });
    });

    app.post('/api/flat-billings', async (request, reply) => {
        const userId = requireAuth(request, reply);
        if (!userId) return;

        const body = request.body as { flatBilling?: any; companyId?: string };
        if (!body?.flatBilling) {
            return reply.status(400).send({ error: 'Receipt payload is required.' });
        }

        const validationError = validateFlatBillingPayload(body.flatBilling);
        if (validationError) {
            return reply.status(400).send({ error: validationError });
        }

        const requestedCompanyId = body.companyId && body.companyId !== 'local-company' ? body.companyId : null;

        try {
            const membership = await getPrimaryMembership(userId);

            if (!membership) {
                return reply.status(400).send({ error: 'No company found for this user. Create a company before saving a receipt.' });
            }

            if (requestedCompanyId && requestedCompanyId !== membership.companyId) {
                return reply.status(403).send({ error: 'Forbidden.' });
            }

            if (!QUOTATION_ROLES.includes(membership.role)) {
                return reply.status(403).send({ error: 'Forbidden.' });
            }

            const result = await saveFlatBillingToDatabase(body.flatBilling, membership.companyId);
            return reply.send(result);
        } catch (err: any) {
            app.log.error(err, 'Failed to save flat billing');
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 403) return reply.status(403).send({ error: 'Forbidden.' });
            if (statusCode === 409) return reply.status(409).send({ error: err.message });
            return reply.status(500).send({ error: 'Failed to save receipt.' });
        }
    });

    app.delete('/api/flat-billings/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const { data, error } = await supabaseAdmin
                    .from('documents')
                    .select('id, company_id')
                    .eq('id', id)
                    .eq('document_type', 'BookingReceipt')
                    .eq('is_deleted', false)
                    .maybeSingle();
                if (error) throw error;
                return data?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        try {
            await softDeleteFlatBilling(id, membership.userId);
            return reply.send({ ok: true });
        } catch (err: any) {
            app.log.error(err, 'Failed to delete flat billing');
            return reply.status(500).send({ error: 'Failed to delete receipt.' });
        }
    });
}
