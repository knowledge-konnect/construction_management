import type { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../auth.js';
import {
    authorizeCompany,
    COMPANY_MANAGEMENT_ROLES,
    COMPANY_READ_ROLES,
    ensureCompanyMembership,
    getPrimaryMembership,
    QUOTATION_ROLES,
    requireAuth,
} from '../authz.js';
import {
    BUSINESS_MODEL_VALUES,
    DEFAULT_ENABLED_BUSINESS_MODELS,
    normalizeBusinessModel,
    normalizeBusinessModels,
    type BusinessModel,
} from '../businessModels.js';
import {
    createCompany,
    createCompanySettings,
    getCompanyById,
    updateCompany,
    upsertCompanySettings,
} from '../company.js';
import { validateCompanyPayload } from '../validation.js';

export function registerCompanyRoutes(app: FastifyInstance) {
    // ─── GET /api/company ──────────────────────────────────────────────────────
    app.get('/api/company', async (request, reply) => {
        const userId = requireAuth(request, reply);
        if (!userId) return;

        try {
            const membership = await getPrimaryMembership(userId);
            if (!membership) {
                return reply.send({ company: null });
            }

            const data = await getCompanyById(membership.companyId);
            return reply.send({ company: data ? { ...data, callerRole: membership.role } : null });
        } catch (err: any) {
            app.log.error(err, 'Failed to get company');
            return reply.status(500).send({ error: 'Failed to load company.' });
        }
    });

    // ─── POST /api/company ─────────────────────────────────────────────────────
    app.post('/api/company', async (request, reply) => {
        const userId = requireAuth(request, reply);
        if (!userId) return;

        const body = request.body as any;

        const validationError = validateCompanyPayload(body);
        if (validationError) {
            return reply.status(400).send({ error: validationError });
        }

        try {
            const { data: existingMembershipRows, error: membershipLookupError } = await supabaseAdmin
                .from('company_users')
                .select('company_id')
                .eq('user_id', userId)
                .limit(2);
            if (membershipLookupError) throw membershipLookupError;

            if ((existingMembershipRows ?? []).length > 0) {
                return reply.status(409).send({ error: 'This account already belongs to a company.' });
            }

            const company = await createCompany(userId, {
                name: body.name ?? '',
                address: body.address ?? null,
                phone: body.phone ?? null,
                email: body.email ?? null,
                website: body.website ?? null,
                gst_number: body.gst_number ?? null,
                pan_number: body.pan_number ?? null,
                logo_url: body.logo_url ?? null,
                primary_color: body.primary_color ?? null,
                secondary_color: body.secondary_color ?? null,
            });

            try {
                const requestedEnabledModels = Array.isArray(body.enabled_business_models)
                    ? body.enabled_business_models
                    : Array.isArray(body.enabledBusinessModels)
                        ? body.enabledBusinessModels
                        : DEFAULT_ENABLED_BUSINESS_MODELS;
                const invalidEnabledModels = requestedEnabledModels.filter((value: unknown) => normalizeBusinessModel(value) === null);
                if (invalidEnabledModels.length > 0) {
                    return reply.status(400).send({ error: `Enabled business models must be a subset of: ${BUSINESS_MODEL_VALUES.join(', ')}.` });
                }
                const enabledBusinessModels = normalizeBusinessModels(requestedEnabledModels);

                await createCompanySettings(company.id, {
                    authorized_person: body.authorized_person ?? null,
                    designation: body.designation ?? null,
                    signature_url: body.signature_url ?? null,
                    bank_name: body.bank_name ?? null,
                    account_name: body.account_name ?? null,
                    account_number: body.account_number ?? null,
                    ifsc: body.ifsc ?? null,
                    branch: body.branch ?? null,
                    upi_id: body.upi_id ?? null,
                    quotation_prefix: body.quotation_prefix || 'QTN',
                    booking_prefix: body.booking_prefix || 'BR',
                    default_validity_days: body.default_validity_days ?? 30,
                    default_terms: body.default_terms ?? null,
                    default_tax_name: body.default_tax_name ?? 'GST',
                    default_tax_rate: body.default_tax_rate ?? 0,
                    enabled_business_models: enabledBusinessModels.length > 0 ? enabledBusinessModels : DEFAULT_ENABLED_BUSINESS_MODELS,
                    invoice_prefix: body.invoice_prefix || 'INV',
                });

                await ensureCompanyMembership(company.id, userId, 'owner');
            } catch (creationErr: any) {
                const rollback = await supabaseAdmin
                    .from('companies')
                    .delete()
                    .eq('id', company.id);

                if (rollback.error) {
                    app.log.error(rollback.error, 'Failed to rollback partially-created company %s', company.id);
                }

                throw creationErr;
            }

            const full = await getCompanyById(company.id);
            return reply.status(201).send({ company: full });
        } catch (err: any) {
            app.log.error(err, 'Failed to create company');
            return reply.status(500).send({ error: 'Failed to create company.' });
        }
    });

    // ─── GET /api/company/:companyId ──────────────────────────────────────────
    app.get('/api/company/:companyId', async (request, reply) => {
        const { companyId } = request.params as { companyId: string };

        const membership = await authorizeCompany(request, reply, {
            requestedCompanyId: companyId,
            allowedRoles: COMPANY_READ_ROLES,
        });
        if (!membership) return;

        try {
            const data = await getCompanyById(membership.companyId);
            return reply.send({ company: data ? { ...data, callerRole: membership.role } : null });
        } catch (err: any) {
            app.log.error(err, 'Failed to get company by id');
            return reply.status(500).send({ error: 'Failed to load company.' });
        }
    });

    // ─── PUT /api/company/:companyId ───────────────────────────────────────────
    app.put('/api/company/:companyId', async (request, reply) => {
        const { companyId } = request.params as { companyId: string };
        const body = request.body as any;

        const validationError = validateCompanyPayload(body);
        if (validationError) {
            return reply.status(400).send({ error: validationError });
        }

        const membership = await authorizeCompany(request, reply, {
            requestedCompanyId: companyId,
            allowedRoles: COMPANY_MANAGEMENT_ROLES,
        });
        if (!membership) return;

        try {
            await updateCompany(membership.companyId, {
                name: body.name,
                address: body.address,
                phone: body.phone,
                email: body.email,
                website: body.website,
                gst_number: body.gst_number,
                pan_number: body.pan_number,
                logo_url: body.logo_url,
                primary_color: body.primary_color,
                secondary_color: body.secondary_color,
            });

            const requestedEnabledModels = Array.isArray(body.enabled_business_models)
                ? body.enabled_business_models
                : Array.isArray(body.enabledBusinessModels)
                    ? body.enabledBusinessModels
                    : DEFAULT_ENABLED_BUSINESS_MODELS;
            const invalidEnabledModels = requestedEnabledModels.filter((value: unknown) => normalizeBusinessModel(value) === null);
            if (invalidEnabledModels.length > 0) {
                return reply.status(400).send({ error: `Enabled business models must be a subset of: ${BUSINESS_MODEL_VALUES.join(', ')}.` });
            }
            const enabledBusinessModels = normalizeBusinessModels(requestedEnabledModels);

            const { data: usedProjectRows, error: usedProjectError } = await supabaseAdmin
                .from('projects')
                .select('business_model')
                .eq('company_id', membership.companyId)
                .not('business_model', 'is', null);
            if (usedProjectError) throw usedProjectError;

            const usedModels = new Set(
                (usedProjectRows ?? [])
                    .map((row) => normalizeBusinessModel(row.business_model))
                    .filter((model): model is BusinessModel => model !== null),
            );

            const disabledInUse = BUSINESS_MODEL_VALUES.filter(
                (model) => !enabledBusinessModels.includes(model) && usedModels.has(model),
            );
            if (disabledInUse.length > 0) {
                return reply.status(400).send({
                    error: `Cannot disable business models currently assigned to projects: ${disabledInUse.join(', ')}.`,
                });
            }

            await upsertCompanySettings(membership.companyId, {
                authorized_person: body.authorized_person ?? null,
                designation: body.designation ?? null,
                signature_url: body.signature_url ?? null,
                bank_name: body.bank_name ?? null,
                account_name: body.account_name ?? null,
                account_number: body.account_number ?? null,
                ifsc: body.ifsc ?? null,
                branch: body.branch ?? null,
                upi_id: body.upi_id ?? null,
                quotation_prefix: body.quotation_prefix || 'QTN',
                booking_prefix: body.booking_prefix || 'BR',
                default_validity_days: body.default_validity_days ?? 30,
                default_terms: body.default_terms ?? null,
                default_tax_name: body.default_tax_name ?? 'GST',
                default_tax_rate: body.default_tax_rate ?? 0,
                enabled_business_models: enabledBusinessModels.length > 0 ? enabledBusinessModels : DEFAULT_ENABLED_BUSINESS_MODELS,
                invoice_prefix: body.invoice_prefix || 'INV',
            });

            const full = await getCompanyById(membership.companyId);
            return reply.send({ company: full });
        } catch (err: any) {
            app.log.error(err, 'Failed to update company');
            return reply.status(500).send({ error: 'Failed to update company.' });
        }
    });
}
