import type { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../auth.js';
import {
    authorizeOwnedResource,
    getPrimaryMembership,
    QUOTATION_ROLES,
    requireAuth,
} from '../authz.js';
import {
    createCustomerForCompany,
    getCustomerRow,
    updateCustomerRow,
} from '../customers.js';
import { buildSavePayload, toSaveError, type SaveQuotationRpcResult } from '../quotationPayload.js';
import {
    releaseQuotationSlot,
    reserveQuotationSlot,
} from '../subscription.js';
import { peekNextDocumentNumber } from '../sequence.js';
import { validateQuotationPayload } from '../validation.js';
import {
    getQuotationRowById,
    getQuotationRowsForCompany,
    mapStatusToDb,
} from '../routeHelpers.js';

// saveQuotationToDatabase is complex enough to live in this file rather than routeHelpers
async function saveQuotationToDatabase(quotation: any, companyId: string, expectedVersion?: number) {
    const { data: existingDoc, error: existingDocError } = await supabaseAdmin
        .from('documents')
        .select('id, company_id, document_number, customer_id, party_id, is_deleted')
        .eq('id', quotation.id)
        .maybeSingle();

    if (existingDocError) throw existingDocError;

    if (existingDoc && existingDoc.company_id !== companyId) {
        const err: any = new Error('This document belongs to a different company.');
        err.statusCode = 403;
        throw err;
    }

    if (existingDoc?.is_deleted) {
        const err: any = new Error('This quotation has been deleted and can no longer be modified.');
        err.statusCode = 409;
        throw err;
    }

    const isNewQuotation = !existingDoc;
    const selectedPartyId = (quotation.customerPartyId ?? quotation.customer_party_id ?? existingDoc?.party_id ?? null) as string | null;
    const normalizedPartyId = selectedPartyId ? String(selectedPartyId).trim() || null : null;

    if (isNewQuotation) {
        await reserveQuotationSlot(companyId);
    }

    try {
        let customerId: string | null = existingDoc?.customer_id ?? null;
        const customerName = String(quotation.customer?.name ?? '').trim();
        if (customerName) {
            const customerFields = {
                name: customerName,
                email: quotation.customer?.email ?? null,
                mobile: quotation.customer?.mobile ?? null,
                address: quotation.customer?.address ?? null,
                city: quotation.customer?.city ?? null,
                state: quotation.customer?.state ?? null,
                pincode: quotation.customer?.pincode ?? null,
            };

            if (normalizedPartyId) {
                const { data: party, error: partyError } = await supabaseAdmin
                    .from('parties')
                    .select('id, company_id, is_customer, is_active, is_deleted')
                    .eq('id', normalizedPartyId)
                    .maybeSingle();

                if (partyError) throw partyError;
                if (!party) {
                    const err: any = new Error('Selected customer contact could not be found.');
                    err.statusCode = 404;
                    throw err;
                }
                if (party.company_id !== companyId || !party.is_customer || !party.is_active || party.is_deleted) {
                    const err: any = new Error('Selected customer contact is not a valid active customer for this company.');
                    err.statusCode = 403;
                    throw err;
                }

                const { data: existingCustomer, error: existingCustomerError } = await supabaseAdmin
                    .from('customers')
                    .select('id, company_id, party_id')
                    .eq('company_id', companyId)
                    .eq('party_id', normalizedPartyId)
                    .eq('is_deleted', false)
                    .maybeSingle();

                if (existingCustomerError) throw existingCustomerError;
                if (existingCustomer) {
                    customerId = existingCustomer.id;
                    await updateCustomerRow(existingCustomer.id, { ...customerFields, party_id: normalizedPartyId });
                } else {
                    const created = await createCustomerForCompany(companyId, { ...customerFields, party_id: normalizedPartyId });
                    customerId = created.id;
                }
            } else if (customerId) {
                const linkedCustomer = await getCustomerRow(customerId);
                if (linkedCustomer && linkedCustomer.company_id === companyId) {
                    await updateCustomerRow(customerId, customerFields);
                } else {
                    const created = await createCustomerForCompany(companyId, customerFields);
                    customerId = created.id;
                }
            } else {
                const created = await createCustomerForCompany(companyId, customerFields);
                customerId = created.id;
            }
        }

        const savePayload = buildSavePayload(quotation, mapStatusToDb(quotation.status), customerId, normalizedPartyId);
        const { data: saved, error: saveError } = await supabaseAdmin.rpc('save_quotation', {
            p_company_id: companyId,
            p_payload: savePayload,
            p_expected_version: isNewQuotation ? null : (expectedVersion ?? null),
        });
        if (saveError) throw toSaveError(saveError);

        const result = saved as SaveQuotationRpcResult;
        return { ok: true, id: result.id, documentNumber: result.document_number, version: result.version, grandTotal: result.grand_total };
    } catch (err) {
        if (isNewQuotation) {
            await releaseQuotationSlot(companyId);
        }
        throw err;
    }
}

export function registerQuotationRoutes(app: FastifyInstance) {
    app.post('/api/quotations', async (request, reply) => {
        const userId = requireAuth(request, reply);
        if (!userId) return;

        const body = request.body as { quotation?: any; companyId?: string; expectedVersion?: number };
        if (!body?.quotation) {
            return reply.status(400).send({ error: 'Quotation payload is required.' });
        }

        const validationError = validateQuotationPayload(body.quotation);
        if (validationError) {
            return reply.status(400).send({ error: validationError });
        }

        const requestedCompanyId = body.companyId && body.companyId !== 'local-company' ? body.companyId : null;

        try {
            const membership = await getPrimaryMembership(userId);

            if (!membership) {
                return reply.status(400).send({ error: 'No company found for this user. Create a company before saving a quotation.' });
            }

            if (requestedCompanyId && requestedCompanyId !== membership.companyId) {
                return reply.status(403).send({ error: 'Forbidden.' });
            }

            if (!QUOTATION_ROLES.includes(membership.role)) {
                return reply.status(403).send({ error: 'Forbidden.' });
            }

            const result = await saveQuotationToDatabase(body.quotation, membership.companyId, body.expectedVersion);
            return reply.send(result);
        } catch (err: any) {
            app.log.error(err, 'Failed to save quotation');
            if (err?.code === 'QUOTATION_LIMIT_REACHED') {
                return reply.status(403).send({ error: err.message, code: err.code });
            }
            const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
            if (statusCode === 403) return reply.status(403).send({ error: 'Forbidden.' });
            if (statusCode === 409) return reply.status(409).send({ error: err.message, code: err.code });
            if (statusCode === 400) return reply.status(400).send({ error: err.message });
            return reply.status(500).send({ error: 'Failed to save quotation.' });
        }
    });

    app.get('/api/quotations', async (request, reply) => {
        const userId = requireAuth(request, reply);
        if (!userId) return;

        try {
            const membership = await getPrimaryMembership(userId);
            if (!membership) {
                return reply.send({ quotations: [] });
            }

            const quotations = await getQuotationRowsForCompany(membership.companyId);
            return reply.send({ quotations });
        } catch (err: any) {
            app.log.error(err, 'Failed to list quotations');
            return reply.status(500).send({ error: 'Failed to load quotations.' });
        }
    });

    app.get('/api/quotations/next-sequence', async (request, reply) => {
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

            const preview = await peekNextDocumentNumber(membership.companyId, 'Quotation');
            const match = preview.match(/(\d+)$/);
            return reply.send({ nextSequence: match ? Number(match[1]) : 1 });
        } catch (err: any) {
            app.log.error(err, 'Failed to get quotation sequence');
            return reply.status(500).send({ error: 'Failed to get quotation sequence.' });
        }
    });

    app.get('/api/quotations/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        let quotation: any = null;

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                quotation = await getQuotationRowById(id);
                return quotation?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        return reply.send({ quotation });
    });

    app.delete('/api/quotations/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        const membership = await authorizeOwnedResource(
            request,
            reply,
            async () => {
                const { data, error } = await supabaseAdmin
                    .from('documents')
                    .select('id, company_id')
                    .eq('id', id)
                    .eq('is_deleted', false)
                    .maybeSingle();
                if (error) throw error;
                return data?.company_id ?? null;
            },
            { allowedRoles: QUOTATION_ROLES },
        );
        if (!membership) return;

        try {
            const { error } = await supabaseAdmin
                .from('documents')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                    deleted_by: membership.userId,
                })
                .eq('id', id);
            if (error) throw error;

            return reply.send({ ok: true });
        } catch (err: any) {
            app.log.error(err, 'Failed to delete quotation');
            return reply.status(500).send({ error: 'Failed to delete quotation.' });
        }
    });
}
