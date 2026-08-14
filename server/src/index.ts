import cors from '@fastify/cors';
import Fastify from 'fastify';
import {
    comparePassword,
    createUser,
    createUserProfile,
    findUserByEmail,
    findUserById,
    getUserProfile,
    hashPassword,
    signJwt,
    supabaseAdmin,
    updateLastLogin,
    updateUserPassword,
    verifyJwt,
} from './auth.js';
import type { CompanyMembership } from './authz.js';
import {
    authorizeCompany,
    authorizeOwnedResource,
    COMPANY_MANAGEMENT_ROLES,
    COMPANY_READ_ROLES,
    ensureCompanyMembership,
    getMembership,
    getPrimaryMembership,
    QUOTATION_ROLES,
    requireAuth,
} from './authz.js';
import {
    createCompany,
    createCompanySettings,
    getCompanyById,
    getCompanyByUserId,
    updateCompany,
    upsertCompanySettings,
} from './company.js';
import {
    createCustomerForCompany,
    deleteCustomerRow,
    getCustomerRow,
    listCustomersForCompany,
    updateCustomerRow,
} from './customers.js';
import { allocateDocumentNumber, peekNextDocumentNumber } from './sequence.js';
import {
    findActivePasswordReset,
    findActiveRefreshToken,
    issuePasswordResetToken,
    issueRefreshToken,
    markPasswordResetUsed,
    revokeAllRefreshTokensForUser,
    revokeRefreshToken,
} from './tokens.js';
import { isNonEmptyString, validateCompanyPayload, validateCustomerPayload, validateQuotationPayload } from './validation.js';

const app = Fastify({ logger: true, bodyLimit: 5 * 1024 * 1024 }); // 5 MB — accommodates base64-encoded logo + signature images

function parseNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number(value) || 0;
    return 0;
}

function getRequestMeta(request: any): { userAgent: string | null; ip: string | null } {
    return {
        userAgent: (request.headers['user-agent'] as string | undefined) ?? null,
        ip: request.ip ?? null,
    };
}

function mapStatusToDb(status: string): string {
    return status === 'DRAFT' ? 'Draft' : 'Completed';
}

function buildDocumentPayload(quotation: any, companyId: string, documentNumber: string, customerId: string | null) {
    const additionalCharges = (quotation.additionalCharges ?? []).reduce((total: number, item: any) => total + Number(item?.amount ?? 0), 0);
    const taxAmount = quotation.tax?.applicable
        ? Math.round((Number(quotation.subtotal ?? 0) * Number(quotation.tax?.rate ?? 0)) / 100 * 100) / 100
        : 0;

    return {
        id: quotation.id,
        company_id: companyId,
        customer_id: customerId,
        document_type: 'Quotation',
        document_number: documentNumber,
        status: mapStatusToDb(quotation.status),
        quotation_date: quotation.quotationDate || null,
        valid_until: quotation.validUntil || null,
        project_name: quotation.project?.name ?? '',
        project_type: quotation.project?.projectType ?? '',
        project_location: quotation.project?.address ?? '',
        builtup_area: parseNumber(quotation.project?.builtupArea),
        area_unit: quotation.project?.builtupAreaUnit ?? '',
        floors: quotation.project?.floors ?? '',
        subtotal: quotation.subtotal ?? 0,
        additional_charges: additionalCharges,
        discount: quotation.discount?.value ?? 0,
        tax_percentage: quotation.tax?.rate ?? 0,
        tax_amount: taxAmount,
        grand_total: quotation.grandTotal ?? 0,
        notes: quotation.customerNotes ?? '',
        created_at: quotation.createdAt ?? new Date().toISOString(),
        updated_at: quotation.updatedAt ?? new Date().toISOString(),
    };
}

function buildTermsPayload(documentId: string, terms: any[]) {
    return (terms ?? []).map((term: any) => ({
        id: term.id,
        document_id: documentId,
        description: term.text,
        display_order: term.displayOrder,
    }));
}

async function getQuotationRowsForCompany(companyId: string) {
    const { data, error } = await supabaseAdmin
        .from('documents')
        .select(`*, customers(name,mobile,email,address), document_sections(id,section_name,display_order,document_items(*)), document_specifications(*), document_inclusions(*), document_exclusions(*), payment_schedules(*), document_terms(*)`)
        .eq('company_id', companyId)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
}

async function getQuotationRowById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('documents')
        .select(`*, customers(name,mobile,email,address), document_sections(id,section_name,display_order,document_items(*)), document_specifications(*), document_inclusions(*), document_exclusions(*), payment_schedules(*), document_terms(*)`)
        .eq('id', id)
        .eq('is_deleted', false)
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function saveQuotationToDatabase(quotation: any, companyId: string, userId: string) {
    if (!companyId || companyId === 'local-company') {
        const company = await getCompanyByUserId(userId);
        if (company?.id) {
            companyId = company.id;
        } else {
            throw new Error('No company found for this user. Create a company before saving a quotation.');
        }
    }

    // The row may already exist (an autosave/draft update). Load it first to
    // find (a) whether it already belongs to a DIFFERENT company — which
    // would mean this request is trying to hijack another company's document
    // by reusing its id, and must be rejected — (b) its existing
    // document_number, which is preserved rather than re-derived from
    // whatever the client sent, and (c) any customer_id already linked to it.
    const { data: existingDoc, error: existingDocError } = await supabaseAdmin
        .from('documents')
        .select('id, company_id, document_number, customer_id, is_deleted')
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

    const documentNumber = existingDoc
        ? existingDoc.document_number
        : await allocateDocumentNumber(companyId, 'Quotation');

    // Resolve/keep-in-sync a customers-table row backing this quotation's
    // embedded customer info, and link it via documents.customer_id. The
    // quotation's own customer fields (used for PDF/display) are left
    // completely untouched — this only adds a structural link, scoped
    // strictly to `companyId` (never a client-supplied customer id), so a
    // quotation can never end up linked to another company's customer.
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

        if (customerId) {
            const linkedCustomer = await getCustomerRow(customerId);
            if (linkedCustomer && linkedCustomer.company_id === companyId) {
                await updateCustomerRow(customerId, customerFields);
            } else {
                // Linked row is missing or (shouldn't happen) belongs to a
                // different company — re-create under the correct company
                // rather than ever link across a company boundary.
                const created = await createCustomerForCompany(companyId, customerFields);
                customerId = created.id;
            }
        } else {
            const created = await createCustomerForCompany(companyId, customerFields);
            customerId = created.id;
        }
    }

    const documentPayload = buildDocumentPayload(quotation, companyId, documentNumber, customerId);

    const { data: documentData, error: documentError } = await supabaseAdmin
        .from('documents')
        .upsert(documentPayload, { onConflict: 'id' })
        .select('id, document_number')
        .single();

    if (documentError) {
        throw new Error(`documents insert failed: ${documentError.message}`);
    }

    const documentId = documentData?.id ?? quotation.id;

    // Delete existing child rows before re-inserting the current state.
    // Order matters: document_items reference document_sections via
    // section_id, so items must be deleted BEFORE their parent sections —
    // deleting a section while its items still reference it would either
    // fail on a foreign-key constraint or (if no FK exists) leave orphaned
    // item rows pointing at a section_id that no longer exists. Every step
    // checks its error and throws immediately, so a failure here stops the
    // operation rather than silently continuing to delete/insert further
    // tables (which is what could previously leave partial/orphaned data).
    const { data: existingSections, error: existingSectionsError } = await supabaseAdmin
        .from('document_sections')
        .select('id')
        .eq('document_id', documentId);
    if (existingSectionsError) throw existingSectionsError;

    const existingSectionIds = (existingSections ?? []).map((s: any) => s.id);
    if (existingSectionIds.length > 0) {
        const { error } = await supabaseAdmin.from('document_items').delete().in('section_id', existingSectionIds);
        if (error) throw new Error(`document_items delete failed: ${error.message}`);
    }

    {
        const { error } = await supabaseAdmin.from('document_sections').delete().eq('document_id', documentId);
        if (error) throw new Error(`document_sections delete failed: ${error.message}`);
    }
    {
        const { error } = await supabaseAdmin.from('document_terms').delete().eq('document_id', documentId);
        if (error) throw new Error(`document_terms delete failed: ${error.message}`);
    }
    {
        const { error } = await supabaseAdmin.from('document_specifications').delete().eq('document_id', documentId);
        if (error) throw new Error(`document_specifications delete failed: ${error.message}`);
    }
    {
        const { error } = await supabaseAdmin.from('document_inclusions').delete().eq('document_id', documentId);
        if (error) throw new Error(`document_inclusions delete failed: ${error.message}`);
    }
    {
        const { error } = await supabaseAdmin.from('document_exclusions').delete().eq('document_id', documentId);
        if (error) throw new Error(`document_exclusions delete failed: ${error.message}`);
    }
    {
        const { error } = await supabaseAdmin.from('payment_schedules').delete().eq('document_id', documentId);
        if (error) throw new Error(`payment_schedules delete failed: ${error.message}`);
    }

    const sectionRows = (quotation.boqSections ?? []).map((section: any) => ({
        id: section.id,
        document_id: documentId,
        section_name: section.title,
        display_order: section.displayOrder,
    }));

    const itemRows = (quotation.boqSections ?? []).flatMap((section: any) =>
        (section.items ?? []).map((item: any) => ({
            id: item.id,
            section_id: section.id,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            rate: item.rate,
            amount: item.amount,
            display_order: item.displayOrder,
        })),
    );

    const specificationRows = (quotation.specifications ?? []).map((spec: any) => ({
        id: spec.id,
        document_id: documentId,
        specification_type: spec.title,
        description: spec.description,
        display_order: spec.displayOrder,
    }));

    const inclusionRows = (quotation.inclusions ?? []).map((description: string) => ({
        document_id: documentId,
        description,
    }));

    const exclusionRows = (quotation.exclusions ?? []).map((description: string) => ({
        document_id: documentId,
        description,
    }));

    const paymentRows = (quotation.paymentSchedule ?? []).map((stage: any) => ({
        id: stage.id,
        document_id: documentId,
        stage_name: stage.name,
        percentage: stage.percentage,
        amount: stage.amount,
        due_date: stage.dueDate || null,
        status: stage.status ?? null,
        display_order: stage.displayOrder,
    }));

    const termRows = buildTermsPayload(documentId, quotation.terms ?? []);

    // Insert order mirrors delete order's dependency: sections BEFORE items,
    // since items reference section_id.
    if (sectionRows.length > 0) {
        const { error } = await supabaseAdmin.from('document_sections').insert(sectionRows);
        if (error) throw new Error(`document_sections insert failed: ${error.message}`);
    }
    if (itemRows.length > 0) {
        const { error } = await supabaseAdmin.from('document_items').insert(itemRows);
        if (error) throw new Error(`document_items insert failed: ${error.message}`);
    }
    if (specificationRows.length > 0) {
        const { error } = await supabaseAdmin.from('document_specifications').insert(specificationRows);
        if (error) throw new Error(`document_specifications insert failed: ${error.message}`);
    }
    if (inclusionRows.length > 0) {
        const { error } = await supabaseAdmin.from('document_inclusions').insert(inclusionRows);
        if (error) throw new Error(`document_inclusions insert failed: ${error.message}`);
    }
    if (exclusionRows.length > 0) {
        const { error } = await supabaseAdmin.from('document_exclusions').insert(exclusionRows);
        if (error) throw new Error(`document_exclusions insert failed: ${error.message}`);
    }
    if (paymentRows.length > 0) {
        const { error } = await supabaseAdmin.from('payment_schedules').insert(paymentRows);
        if (error) throw new Error(`payment_schedules insert failed: ${error.message}`);
    }
    if (termRows.length > 0) {
        const { error } = await supabaseAdmin.from('document_terms').insert(termRows);
        if (error) throw new Error(`document_terms insert failed: ${error.message}`);
    }

    return { ok: true, id: documentId, documentNumber: documentData?.document_number ?? documentNumber };
}

await app.register(cors, {
    origin: true,
    credentials: true,
});

// ─── Auth helper ───────────────────────────────────────────────────────────────
// requireAuth (JWT verification) and the company-level authorization helpers
// (authorizeCompany, authorizeOwnedResource, getMembership, getPrimaryMembership,
// ensureCompanyMembership) now live in ./authz.ts so they can be reused across
// every company-scoped route below instead of being duplicated per-route.

// ─── POST /api/signup ──────────────────────────────────────────────────────────

app.post('/api/signup', async (request, reply) => {
    const body = request.body as { email?: string; password?: string; fullName?: string };

    if (!body.email || !body.password) {
        return reply.status(400).send({ error: 'Email and password are required.' });
    }

    // Check duplicate
    const existing = await findUserByEmail(body.email);
    if (existing) {
        return reply.status(409).send({ error: 'An account with this email already exists.' });
    }

    // Create user row in public.users
    const passwordHash = await hashPassword(body.password);
    let user: Awaited<ReturnType<typeof createUser>>;
    try {
        user = await createUser(body.email, passwordHash);
    } catch (err: any) {
        app.log.error(err, 'Failed to create user');
        return reply.status(500).send({ error: 'Failed to create account. Please try again.' });
    }

    // Create profile row in public.user_profiles (non-fatal if it fails)
    try {
        await createUserProfile(user.id, body.fullName ?? null);
    } catch (err: any) {
        // Profile creation failed — log but don't block the response.
        // User can update profile later.
        app.log.warn(err, 'Failed to create user profile for user %s', user.id);
    }

    const token = signJwt({ sub: user.id, email: user.email, role: user.role });

    let refreshToken: string | null = null;
    try {
        refreshToken = await issueRefreshToken(user.id, getRequestMeta(request));
    } catch (err: any) {
        // Non-fatal: the access token still works, just without silent renewal
        // until the next successful login/refresh.
        app.log.warn(err, 'Failed to issue refresh token for user %s', user.id);
    }

    return reply.status(201).send({
        token,
        refreshToken,
        user: {
            id: user.id,
            email: user.email,
            fullName: body.fullName ?? null,
            role: user.role,
        },
    });
});

// ─── POST /api/login ───────────────────────────────────────────────────────────

app.post('/api/login', async (request, reply) => {
    const body = request.body as { email?: string; password?: string };

    if (!body.email || !body.password) {
        return reply.status(400).send({ error: 'Email and password are required.' });
    }

    const user = await findUserByEmail(body.email);

    // Use same error message for missing user and wrong password — prevents email enumeration
    if (!user) {
        return reply.status(401).send({ error: 'Invalid email or password.' });
    }

    // Check account is active
    if (!user.is_active) {
        return reply.status(403).send({ error: 'This account has been deactivated. Please contact support.' });
    }

    const valid = await comparePassword(body.password, user.password_hash);
    if (!valid) {
        return reply.status(401).send({ error: 'Invalid email or password.' });
    }

    // Update last_login_at (non-fatal)
    updateLastLogin(user.id).catch((err) =>
        app.log.warn(err, 'Failed to update last_login_at for user %s', user.id)
    );

    // Fetch full_name from user_profiles
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
            role: user.role,
        },
    });
});

// ─── POST /api/refresh ─────────────────────────────────────────────────────────
// Exchanges a still-valid refresh token for a new short-lived access token.
// The refresh token itself is rotated (old one revoked, new one issued) on
// every use, so a leaked-and-reused old token is immediately detectable as
// invalid the next time the legitimate client tries to use it.

app.post('/api/refresh', async (request, reply) => {
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

        // Rotation: revoke the token just used, issue a brand new one.
        await revokeRefreshToken(body.refreshToken);
        const newRefreshToken = await issueRefreshToken(user.id, getRequestMeta(request));
        const token = signJwt({ sub: user.id, email: user.email, role: user.role });

        return reply.send({ token, refreshToken: newRefreshToken });
    } catch (err: any) {
        app.log.error(err, 'Failed to refresh token');
        return reply.status(500).send({ error: 'Failed to refresh token.' });
    }
});

// ─── POST /api/logout ──────────────────────────────────────────────────────────
// Revokes the presented refresh token so it can never be used again. The
// short-lived access token isn't separately revocable (by design — it just
// expires within 15 minutes), but without a valid refresh token it can no
// longer be silently renewed.

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

// ─── Password reset ─────────────────────────────────────────────────────────────

app.post('/api/password-reset/request', async (request, reply) => {
    const body = request.body as { email?: string };
    if (!isNonEmptyString(body?.email)) {
        return reply.status(400).send({ error: 'Email is required.' });
    }

    // Always return the same generic response whether or not the account
    // exists — this prevents the endpoint being used to enumerate emails.
    const genericResponse = { ok: true, message: 'If an account exists for that email, a reset link has been generated.' };

    try {
        const user = await findUserByEmail(body.email);
        if (!user || !user.is_active) {
            return reply.send(genericResponse);
        }

        const token = await issuePasswordResetToken(user.id);

        // NOTE: there is no outbound email provider configured in this
        // project (no SMTP/email-API env vars). Delivering the reset token
        // to the user's inbox requires wiring up a real email service before
        // production — the token is intentionally NEVER written to logs
        // (see requirement 5 / 14).
        //
        // As a development-only convenience so the flow is testable
        // end-to-end without an email provider, the raw token is included in
        // the API response ONLY when explicitly opted into via
        // ALLOW_DEV_PASSWORD_RESET_TOKEN=true in the backend's .env. This is
        // deliberately an explicit opt-in (not "NODE_ENV !== 'production'")
        // so a deployment that simply forgets to set NODE_ENV can never leak
        // a reset token by default — the safe default is "never expose".
        // Remove this block entirely once a real email send is wired up.
        const devTokenEnabled = process.env.ALLOW_DEV_PASSWORD_RESET_TOKEN === 'true';
        const devToken = devTokenEnabled ? token : undefined;

        return reply.send({ ...genericResponse, ...(devToken ? { devToken } : {}) });
    } catch (err: any) {
        app.log.error(err, 'Failed to process password reset request');
        // Still return the generic response — don't leak internal state via errors either.
        return reply.send(genericResponse);
    }
});

app.post('/api/password-reset/confirm', async (request, reply) => {
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
        // Force re-login everywhere — a password reset should invalidate any
        // sessions started before the account owner regained control.
        await revokeAllRefreshTokensForUser(reset.userId);

        return reply.send({ ok: true });
    } catch (err: any) {
        app.log.error(err, 'Failed to confirm password reset');
        return reply.status(500).send({ error: 'Failed to reset password.' });
    }
});

// ─── GET /api/me ───────────────────────────────────────────────────────────────

app.get('/api/me', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ error: 'Missing or malformed authorization header.' });
    }

    const token = authHeader.slice(7);
    const payload = verifyJwt(token) as { sub?: string } | null;
    if (!payload?.sub) {
        return reply.status(401).send({ error: 'Invalid or expired token.' });
    }

    const user = await findUserById(payload.sub);
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
            role: user.role,
        },
    });
});

// ─── GET /api/company ──────────────────────────────────────────────────────────

app.get('/api/company', async (request, reply) => {
    const userId = requireAuth(request, reply);
    if (!userId) return;

    try {
        // No explicit companyId is supplied here — resolve the caller's own
        // company via their company_users membership. No company yet is a
        // normal state (new user), not an authorization failure.
        const membership = await getPrimaryMembership(userId);
        if (!membership) {
            return reply.send({ company: null });
        }

        const data = await getCompanyById(membership.companyId);
        return reply.send({ company: data ?? null });
    } catch (err: any) {
        app.log.error(err, 'Failed to get company');
        return reply.status(500).send({ error: 'Failed to load company.' });
    }
});

// ─── POST /api/company ─────────────────────────────────────────────────────────

app.post('/api/company', async (request, reply) => {
    const userId = requireAuth(request, reply);
    if (!userId) return;

    const body = request.body as any;

    const validationError = validateCompanyPayload(body);
    if (validationError) {
        return reply.status(400).send({ error: validationError });
    }

    try {
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
            quotation_prefix: body.quotation_prefix ?? null,
            booking_prefix: body.booking_prefix ?? null,
            default_validity_days: body.default_validity_days ?? 30,
            default_terms: body.default_terms ?? null,
        });

        // Record the creator as the company's owner in company_users so all
        // future authorization checks (see server/src/authz.ts) can rely on
        // it directly. Non-fatal: getMembership/getPrimaryMembership fall
        // back to companies.owner_id if this row is ever missing.
        try {
            await ensureCompanyMembership(company.id, userId, 'owner');
        } catch (membershipErr: any) {
            app.log.warn(membershipErr, 'Failed to record company_users membership for owner %s', userId);
        }

        const full = await getCompanyById(company.id);
        return reply.status(201).send({ company: full });
    } catch (err: any) {
        app.log.error(err, 'Failed to create company');
        return reply.status(500).send({ error: 'Failed to create company.' });
    }
});

// ─── GET /api/company/:companyId ──────────────────────────────────────────────

app.get('/api/company/:companyId', async (request, reply) => {
    const { companyId } = request.params as { companyId: string };

    // companyId comes from the frontend — treat it only as a requested
    // context and verify it against company_users before trusting it.
    const membership = await authorizeCompany(request, reply, {
        requestedCompanyId: companyId,
        allowedRoles: COMPANY_READ_ROLES, // owner/admin/staff can all view company details
    });
    if (!membership) return;

    try {
        const data = await getCompanyById(membership.companyId);
        return reply.send({ company: data });
    } catch (err: any) {
        app.log.error(err, 'Failed to get company by id');
        return reply.status(500).send({ error: 'Failed to load company.' });
    }
});

// ─── PUT /api/company/:companyId ───────────────────────────────────────────────

app.put('/api/company/:companyId', async (request, reply) => {
    const { companyId } = request.params as { companyId: string };
    const body = request.body as any;

    const validationError = validateCompanyPayload(body);
    if (validationError) {
        return reply.status(400).send({ error: validationError });
    }

    // companyId comes from the frontend — treat it only as a requested
    // context and verify it against company_users before trusting it.
    // Only owner/admin members may update company management data.
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
            quotation_prefix: body.quotation_prefix ?? null,
            booking_prefix: body.booking_prefix ?? null,
            default_validity_days: body.default_validity_days ?? 30,
            default_terms: body.default_terms ?? null,
        });

        const full = await getCompanyById(membership.companyId);
        return reply.send({ company: full });
    } catch (err: any) {
        app.log.error(err, 'Failed to update company');
        return reply.status(500).send({ error: 'Failed to update company.' });
    }
});

// ─── Customers ──────────────────────────────────────────────────────────────
// Previously the frontend queried the `customers` table directly via
// Supabase with the anon key (see src/services/customer.service.ts). These
// routes move that behind the authorized backend so every customer
// operation goes through the same company_users check as everything else.

app.get('/api/customers', async (request, reply) => {
    // No explicit companyId — list the caller's own company's customers.
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

    // Identified only by id — load it first to find its owning company, then verify membership.
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
        await deleteCustomerRow(id);
        return reply.send({ ok: true });
    } catch (err: any) {
        app.log.error(err, 'Failed to delete customer');
        return reply.status(500).send({ error: 'Failed to delete customer.' });
    }
});

// ─── Quotation persistence ─────────────────────────────────────────────────

app.post('/api/quotations', async (request, reply) => {
    const userId = requireAuth(request, reply);
    if (!userId) return;

    const body = request.body as { quotation?: any; companyId?: string };
    if (!body?.quotation) {
        return reply.status(400).send({ error: 'Quotation payload is required.' });
    }

    const validationError = validateQuotationPayload(body.quotation);
    if (validationError) {
        return reply.status(400).send({ error: validationError });
    }

    // body.companyId (and the old body.userId) are frontend-supplied context
    // ONLY — never trusted directly. If a specific companyId was requested it
    // must be verified against company_users; the authenticated user_id from
    // the JWT is always used, never a client-supplied one.
    const requestedCompanyId = body.companyId && body.companyId !== 'local-company' ? body.companyId : null;

    try {
        let membership: CompanyMembership | null;
        if (requestedCompanyId) {
            membership = await getMembership(userId, requestedCompanyId);
            if (!membership) {
                return reply.status(403).send({ error: 'Forbidden.' });
            }
        } else {
            membership = await getPrimaryMembership(userId);
        }

        if (!membership) {
            return reply.status(400).send({ error: 'No company found for this user. Create a company before saving a quotation.' });
        }
        if (!QUOTATION_ROLES.includes(membership.role)) {
            return reply.status(403).send({ error: 'Forbidden.' });
        }

        const result = await saveQuotationToDatabase(body.quotation, membership.companyId, membership.userId);
        return reply.send(result);
    } catch (err: any) {
        app.log.error(err, 'Failed to save quotation');
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        if (statusCode === 403) return reply.status(403).send({ error: 'Forbidden.' });
        if (statusCode === 409) return reply.status(409).send({ error: err.message });
        return reply.status(500).send({ error: 'Failed to save quotation.' });
    }
});

app.get('/api/quotations', async (request, reply) => {
    const userId = requireAuth(request, reply);
    if (!userId) return;

    try {
        // No explicit companyId here — use the caller's own membership.
        // Any active role (owner/admin/staff) may list their company's quotations.
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

app.get('/api/quotations/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    // This resource is identified only by its own id — load the row first to
    // find which company owns it, THEN verify the authenticated user belongs
    // to that company. A client-supplied company is never trusted; here there
    // isn't even one to trust, the id alone determines the owning company.
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

    // This resource is identified only by its own id — load the row first to
    // find which company owns it, THEN verify the authenticated user belongs
    // to that company (and, being a delete, keep it open to any of the
    // existing quotation roles rather than restricting it further). Already
    // soft-deleted rows are excluded here so a repeat delete 404s cleanly
    // instead of re-touching a quotation that's already gone.
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
        // Soft delete: preserve the quotation and all of its BOQ/child data
        // (document_sections, document_items, specifications, inclusions,
        // exclusions, payment_schedules, terms) for history — only flag it
        // as deleted and hide it from normal list/get queries (see
        // getQuotationRowsForCompany / getQuotationRowById above).
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

app.get('/api/quotations/next-sequence', async (request, reply) => {
    const userId = requireAuth(request, reply);
    if (!userId) return;

    // The query-string companyId is frontend-supplied context ONLY — it is
    // never used directly as a filter. It must first be verified against
    // company_users, exactly like every other companyId in this file.
    const queryCompanyId = (request.query as { companyId?: string }).companyId;
    const requestedCompanyId = queryCompanyId && queryCompanyId !== 'local-company' ? queryCompanyId : null;

    try {
        let membership: CompanyMembership | null;
        if (requestedCompanyId) {
            membership = await getMembership(userId, requestedCompanyId);
            if (!membership) {
                return reply.status(403).send({ error: 'Forbidden.' });
            }
        } else {
            membership = await getPrimaryMembership(userId);
        }

        if (!membership) {
            // No company yet — mirrors the previous 'local-company' behaviour
            // of starting numbering at 1 rather than treating this as an error.
            return reply.send({ nextSequence: 1 });
        }

        // Preview only — does not consume/reserve a number. The real,
        // race-free allocation happens in allocateDocumentNumber (sequence.ts)
        // when the document is actually first saved.
        const preview = await peekNextDocumentNumber(membership.companyId, 'Quotation');
        const match = preview.match(/(\d+)$/);
        return reply.send({ nextSequence: match ? Number(match[1]) : 1 });
    } catch (err: any) {
        app.log.error(err, 'Failed to get quotation sequence');
        return reply.status(500).send({ error: 'Failed to get quotation sequence.' });
    }
});

// ─── Server start ──────────────────────────────────────────────────────────────

// Health endpoint for load balancers and Render
app.get('/api/health', async () => ({ ok: true, time: new Date().toISOString(), uptime: process.uptime() }));

// Use the port provided by the hosting environment (Render sets `PORT`).
const PORT = Number(process.env.PORT) || 4000;
app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    app.log.info(`Server listening at ${address}`);
});
