import crypto from 'node:crypto';
import { supabaseAdmin } from './auth.js';

export const FREE_MONTHLY_QUOTATION_LIMIT = 3;
export const PAID_MONTHLY_PRICE_PAISE = 34900; // ₹349.00
export const PAID_YEARLY_PRICE_PAISE = 349900; // ₹3,499.00

export type Plan = 'free' | 'paid';
export type BillingCycle = 'monthly' | 'yearly';

export interface CompanySubscription {
    companyId: string;
    plan: Plan;
    billingCycle: BillingCycle | null;
    status: 'active' | 'cancelled' | 'expired';
    currentPeriodEnd: string | null;
}

function isPeriodExpired(sub: { current_period_end: string | null }): boolean {
    if (!sub.current_period_end) return false;
    return new Date(sub.current_period_end).getTime() < Date.now();
}

function mapSubscriptionRow(row: any): CompanySubscription {
    return {
        companyId: row.company_id,
        plan: row.plan,
        billingCycle: row.billing_cycle,
        status: row.status,
        currentPeriodEnd: row.current_period_end,
    };
}

/**
 * Returns the company's subscription, lazily creating a default 'free' row
 * if one doesn't exist yet (e.g. companies created before this feature
 * shipped). A paid subscription whose current_period_end has passed is
 * treated as expired (and persisted as such) rather than silently still
 * granting unlimited quotations — expiry is enforced here, not just at
 * checkout time.
 */
export async function getCompanySubscription(companyId: string): Promise<CompanySubscription> {
    const { data, error } = await supabaseAdmin
        .from('company_subscriptions')
        .select('company_id, plan, billing_cycle, status, current_period_end')
        .eq('company_id', companyId)
        .maybeSingle();

    if (error) throw error;

    if (!data) {
        const { data: created, error: insertError } = await supabaseAdmin
            .from('company_subscriptions')
            .insert({ company_id: companyId, plan: 'free', status: 'active' })
            .select('company_id, plan, billing_cycle, status, current_period_end')
            .single();

        // A concurrent request may have created it first (unique PK) — that's
        // fine, just re-read rather than treating it as a real failure.
        if (insertError) {
            const { data: existing, error: reReadError } = await supabaseAdmin
                .from('company_subscriptions')
                .select('company_id, plan, billing_cycle, status, current_period_end')
                .eq('company_id', companyId)
                .maybeSingle();
            if (reReadError) throw reReadError;
            if (existing) return mapSubscriptionRow(existing);
            throw insertError;
        }

        return mapSubscriptionRow(created);
    }

    if (data.plan === 'paid' && data.status === 'active' && isPeriodExpired(data)) {
        await supabaseAdmin
            .from('company_subscriptions')
            .update({ plan: 'free', status: 'expired' })
            .eq('company_id', companyId);
        return { companyId, plan: 'free', billingCycle: data.billing_cycle, status: 'expired', currentPeriodEnd: data.current_period_end };
    }

    return mapSubscriptionRow(data);
}

function currentUsagePeriod(): { year: number; month: number } {
    const now = new Date();
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

/** Read-only usage count for the current calendar month — does not mutate anything. */
export async function getCurrentMonthUsage(companyId: string): Promise<number> {
    const { year, month } = currentUsagePeriod();
    const { data, error } = await supabaseAdmin
        .from('company_quotation_usage')
        .select('quotation_count')
        .eq('company_id', companyId)
        .eq('usage_year', year)
        .eq('usage_month', month)
        .maybeSingle();

    if (error) throw error;
    return data?.quotation_count ?? 0;
}

export class QuotationLimitReachedError extends Error {
    statusCode = 403;
    code = 'QUOTATION_LIMIT_REACHED';
    constructor() {
        super('You\u2019ve reached your 3 quotation limit for this month. Upgrade to BuilderDocs for unlimited quotations.');
    }
}

/**
 * Atomically reserves one "new quotation" slot for the current calendar
 * month, IF the company's plan allows it. This is the actual enforcement
 * point — call it once, immediately before creating a new quotation (never
 * on edits to an existing one). Uses the same compare-and-swap retry
 * pattern as document_sequences.ts: two concurrent requests racing at
 * count=2 can only ever have ONE of them successfully claim slot #3 — the
 * loser is correctly rejected rather than both succeeding and exceeding
 * the limit. Paid (and non-expired) companies skip the check entirely.
 *
 * Throws QuotationLimitReachedError (403) if the free plan's monthly limit
 * has already been reached. Never decremented on delete — a deleted
 * quotation still occupied a slot the month it was created.
 */
export async function reserveQuotationSlot(companyId: string): Promise<void> {
    const subscription = await getCompanySubscription(companyId);
    if (subscription.plan === 'paid' && subscription.status === 'active') {
        return; // unlimited
    }

    const { year, month } = currentUsagePeriod();

    for (let attempt = 0; attempt < 8; attempt++) {
        const { data: existing, error: selectError } = await supabaseAdmin
            .from('company_quotation_usage')
            .select('company_id, quotation_count')
            .eq('company_id', companyId)
            .eq('usage_year', year)
            .eq('usage_month', month)
            .maybeSingle();

        if (selectError) throw selectError;

        if (!existing) {
            // First quotation this month for this company — try to create
            // the row already at count=1.
            const { error: insertError } = await supabaseAdmin
                .from('company_quotation_usage')
                .insert({ company_id: companyId, usage_year: year, usage_month: month, quotation_count: 1 });

            if (!insertError) return;
            // Concurrent request created the row first — fall through and retry via the update branch.
            continue;
        }

        if (existing.quotation_count >= FREE_MONTHLY_QUOTATION_LIMIT) {
            throw new QuotationLimitReachedError();
        }

        const { data: updated, error: updateError } = await supabaseAdmin
            .from('company_quotation_usage')
            .update({ quotation_count: existing.quotation_count + 1 })
            .eq('company_id', companyId)
            .eq('usage_year', year)
            .eq('usage_month', month)
            .eq('quotation_count', existing.quotation_count) // compare-and-swap guard
            .select('company_id')
            .maybeSingle();

        if (updateError) throw updateError;
        if (updated) return; // slot successfully reserved
        // Someone else updated between our SELECT and UPDATE — retry.
    }

    throw new Error('Could not reserve a quotation slot after several attempts (high contention).');
}

/**
 * Best-effort compensating rollback: if a quotation slot was reserved via
 * reserveQuotationSlot() but the quotation itself then failed to actually
 * get created (an unrelated DB error), give the slot back rather than
 * charging the company's monthly limit for a request that never produced a
 * document. Never throws — a failure here shouldn't mask the original error.
 */
export async function releaseQuotationSlot(companyId: string): Promise<void> {
    try {
        const { year, month } = currentUsagePeriod();
        const { data: existing } = await supabaseAdmin
            .from('company_quotation_usage')
            .select('quotation_count')
            .eq('company_id', companyId)
            .eq('usage_year', year)
            .eq('usage_month', month)
            .maybeSingle();
        if (existing && existing.quotation_count > 0) {
            await supabaseAdmin
                .from('company_quotation_usage')
                .update({ quotation_count: existing.quotation_count - 1 })
                .eq('company_id', companyId)
                .eq('usage_year', year)
                .eq('usage_month', month);
        }
    } catch {
        // best-effort only
    }
}

/** Convenience combined read for GET /api/subscription — plan + this month's usage in one call. */
export async function getSubscriptionSummary(companyId: string) {
    const subscription = await getCompanySubscription(companyId);
    const used = await getCurrentMonthUsage(companyId);
    const unlimited = subscription.plan === 'paid' && subscription.status === 'active';
    return {
        plan: subscription.plan,
        billingCycle: subscription.billingCycle,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        limit: unlimited ? null : FREE_MONTHLY_QUOTATION_LIMIT,
        used,
        remaining: unlimited ? null : Math.max(0, FREE_MONTHLY_QUOTATION_LIMIT - used),
    };
}

// ─── Razorpay ────────────────────────────────────────────────────────────────
// Plain REST calls (Basic Auth with key_id:key_secret) — no SDK dependency
// needed. key_secret is read from a backend-only env var and NEVER sent to
// the frontend; key_id is not a secret (Razorpay's own Checkout.js requires
// it client-side to open the payment sheet).

function razorpayAuthHeader(): string {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
        throw new Error('Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing).');
    }
    return 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
}

export function priceForCycle(billingCycle: BillingCycle): number {
    return billingCycle === 'yearly' ? PAID_YEARLY_PRICE_PAISE : PAID_MONTHLY_PRICE_PAISE;
}

/**
 * Creates a Razorpay order for a company's plan purchase and records a
 * pending row in subscription_payments (status='created') so the later
 * verification step has something authoritative to check against — the
 * frontend can never just claim "payment succeeded" on its own.
 */
export async function createRazorpayOrder(companyId: string, billingCycle: BillingCycle): Promise<{ orderId: string; amount: number; currency: string }> {
    const amount = priceForCycle(billingCycle);

    const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: razorpayAuthHeader() },
        body: JSON.stringify({
            amount,
            currency: 'INR',
            notes: { companyId, billingCycle },
        }),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Razorpay order creation failed (${res.status}): ${body}`);
    }
    const order = (await res.json()) as { id: string; amount: number; currency: string };

    const { error } = await supabaseAdmin.from('subscription_payments').insert({
        company_id: companyId,
        billing_cycle: billingCycle,
        amount_paise: amount,
        razorpay_order_id: order.id,
        status: 'created',
    });
    if (error) throw error;

    return { orderId: order.id, amount: order.amount, currency: order.currency };
}

/**
 * Verifies a Razorpay Checkout payment signature server-side — this is the
 * ONLY thing that determines whether a payment is treated as real.
 * expected_signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret);
 * this is Razorpay's documented verification formula.
 */
export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error('Razorpay is not configured (RAZORPAY_KEY_SECRET missing).');
    const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    // Constant-time comparison to avoid a timing side-channel.
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Called ONLY after verifyRazorpaySignature() has returned true. Marks the
 * matching subscription_payments row 'paid' and activates the company's
 * subscription for the billing cycle purchased — this is the single place
 * a company's plan actually changes from 'free' to 'paid'.
 */
export async function applySuccessfulPayment(
    companyId: string,
    billingCycle: BillingCycle,
    razorpayOrderId: string,
    razorpayPaymentId: string,
): Promise<void> {
    const { error: paymentError } = await supabaseAdmin
        .from('subscription_payments')
        .update({ status: 'paid', razorpay_payment_id: razorpayPaymentId })
        .eq('razorpay_order_id', razorpayOrderId)
        .eq('company_id', companyId);
    if (paymentError) throw paymentError;

    const periodMs = billingCycle === 'yearly' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const currentPeriodEnd = new Date(Date.now() + periodMs).toISOString();

    const { error } = await supabaseAdmin.from('company_subscriptions').upsert(
        {
            company_id: companyId,
            plan: 'paid',
            billing_cycle: billingCycle,
            status: 'active',
            current_period_end: currentPeriodEnd,
        },
        { onConflict: 'company_id' },
    );
    if (error) throw error;
}

/**
 * Verifies a Razorpay WEBHOOK payload signature — different formula from
 * Checkout's (HMAC over the raw request body, not "order_id|payment_id"),
 * and signed with the separate webhook secret configured in the Razorpay
 * dashboard, not the API key secret.
 */
export function verifyRazorpayWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error('Razorpay webhook is not configured (RAZORPAY_WEBHOOK_SECRET missing).');
    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * The webhook's counterpart to applySuccessfulPayment(): looks up which
 * company/billing-cycle a given order belongs to from our own
 * subscription_payments record (never trusts anything about the company
 * from the webhook payload itself), and is idempotent — safe to call
 * whether the browser's Checkout callback already applied this same
 * payment, the webhook arrives first, or Razorpay retries the webhook
 * delivery.
 */
export async function confirmPaymentFromWebhook(razorpayOrderId: string, razorpayPaymentId: string): Promise<void> {
    const { data: payment, error } = await supabaseAdmin
        .from('subscription_payments')
        .select('company_id, billing_cycle, status')
        .eq('razorpay_order_id', razorpayOrderId)
        .maybeSingle();
    if (error) throw error;

    // An order we have no record of creating — ignore rather than throw, so
    // an unrelated/test webhook event can't cause Razorpay retry-storms.
    if (!payment) return;
    // Already applied (the Checkout callback got there first) — no-op.
    if (payment.status === 'paid') return;

    await applySuccessfulPayment(payment.company_id, payment.billing_cycle as BillingCycle, razorpayOrderId, razorpayPaymentId);
}

/**
 * Immediately downgrades a company to the free plan. There's no recurring
 * mandate here (each purchase is a one-off Razorpay order, not an
 * auto-renewing subscription), so "cancel" simply means "stop being on the
 * paid plan now" rather than "stop a future auto-charge".
 */
export async function cancelSubscription(companyId: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from('company_subscriptions')
        .update({ plan: 'free', status: 'cancelled' })
        .eq('company_id', companyId);
    if (error) throw error;
}
