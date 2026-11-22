import type { FastifyInstance } from 'fastify';
import { getErrorText, isTransientNetworkError } from '../auth.js';
import {
    authorizeCompany,
    COMPANY_MANAGEMENT_ROLES,
    QUOTATION_ROLES,
} from '../authz.js';
import {
    applySuccessfulPayment,
    cancelSubscription,
    confirmPaymentFromWebhook,
    createRazorpayOrder,
    getSubscriptionSummary,
    verifyRazorpaySignature,
    verifyRazorpayWebhookSignature,
    type BillingCycle,
} from '../subscription.js';
import { isNonEmptyString } from '../validation.js';

export function registerSubscriptionRoutes(app: FastifyInstance) {
    app.get('/api/subscription', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: QUOTATION_ROLES });
        if (!membership) return;

        try {
            const summary = await getSubscriptionSummary(membership.companyId);
            return reply.send(summary);
        } catch (err: any) {
            app.log.error(err, 'Failed to load subscription');
            return reply.status(500).send({ error: 'Failed to load subscription.' });
        }
    });

    app.post('/api/subscription/checkout', async (request, reply) => {
        const body = request.body as { billingCycle?: BillingCycle };
        if (body?.billingCycle !== 'monthly' && body?.billingCycle !== 'yearly') {
            return reply.status(400).send({ error: 'billingCycle must be "monthly" or "yearly".' });
        }

        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        try {
            const order = await createRazorpayOrder(membership.companyId, body.billingCycle);
            return reply.send({
                ...order,
                keyId: process.env.RAZORPAY_KEY_ID,
                billingCycle: body.billingCycle,
            });
        } catch (err: any) {
            app.log.error(err, 'Failed to create checkout order');
            const message = getErrorText(err);
            if (
                /Razorpay checkout is temporarily unavailable|ECONNRESET|fetch failed|TLS|network|timeout|timed out|socket disconnected/i.test(message) ||
                isTransientNetworkError(err)
            ) {
                return reply.status(503).send({ error: 'Payment gateway is temporarily unavailable. Please try again in a moment.' });
            }
            return reply.status(500).send({ error: 'Failed to start checkout.' });
        }
    });

    app.post('/api/subscription/verify', async (request, reply) => {
        const body = request.body as {
            billingCycle?: BillingCycle;
            razorpayOrderId?: string;
            razorpayPaymentId?: string;
            razorpaySignature?: string;
        };
        if (
            (body?.billingCycle !== 'monthly' && body?.billingCycle !== 'yearly') ||
            !isNonEmptyString(body?.razorpayOrderId) ||
            !isNonEmptyString(body?.razorpayPaymentId) ||
            !isNonEmptyString(body?.razorpaySignature)
        ) {
            return reply.status(400).send({ error: 'Missing or invalid payment details.' });
        }

        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        try {
            const valid = verifyRazorpaySignature(body.razorpayOrderId!, body.razorpayPaymentId!, body.razorpaySignature!);
            if (!valid) {
                return reply.status(400).send({ error: 'Payment verification failed.' });
            }

            await applySuccessfulPayment(membership.companyId, body.billingCycle!, body.razorpayOrderId!, body.razorpayPaymentId!);
            return reply.send({ ok: true });
        } catch (err: any) {
            app.log.error(err, 'Failed to verify payment');
            return reply.status(500).send({ error: 'Failed to verify payment.' });
        }
    });

    app.post('/api/subscription/cancel', async (request, reply) => {
        const membership = await authorizeCompany(request, reply, { allowedRoles: COMPANY_MANAGEMENT_ROLES });
        if (!membership) return;

        try {
            await cancelSubscription(membership.companyId);
            return reply.send({ ok: true });
        } catch (err: any) {
            app.log.error(err, 'Failed to cancel subscription');
            return reply.status(500).send({ error: 'Failed to cancel subscription.' });
        }
    });

    // Razorpay webhook — server-to-server, no JWT, trust only the signature
    app.post('/api/webhooks/razorpay', async (request, reply) => {
        const signature = request.headers['x-razorpay-signature'] as string | undefined;
        const rawBody = (request as any).rawBody as Buffer | undefined;

        if (!signature || !rawBody) {
            return reply.status(400).send({ error: 'Missing signature or body.' });
        }

        let validSignature: boolean;
        try {
            validSignature = verifyRazorpayWebhookSignature(rawBody, signature);
        } catch (err: any) {
            app.log.error(err, 'Razorpay webhook not configured');
            return reply.status(500).send({ error: 'Webhook not configured.' });
        }
        if (!validSignature) {
            app.log.warn('Rejected Razorpay webhook: invalid signature');
            return reply.status(400).send({ error: 'Invalid signature.' });
        }

        try {
            const event = request.body as any;
            if (event?.event === 'payment.captured') {
                const payment = event?.payload?.payment?.entity;
                if (payment?.order_id && payment?.id) {
                    await confirmPaymentFromWebhook(payment.order_id, payment.id);
                }
            }
            return reply.send({ received: true });
        } catch (err: any) {
            app.log.error(err, 'Failed to process Razorpay webhook');
            return reply.status(500).send({ error: 'Webhook processing failed.' });
        }
    });
}
