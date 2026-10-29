import { apiGet, apiPost } from '@/services/apiClient';

export type BillingCycle = 'monthly' | 'yearly';

export interface SubscriptionSummary {
  plan: 'free' | 'paid';
  billingCycle: BillingCycle | null;
  status: 'active' | 'cancelled' | 'expired';
  currentPeriodEnd: string | null;
  limit: number | null;
  used: number;
  remaining: number | null;
}

export async function getSubscription(): Promise<SubscriptionSummary | null> {
  const { data, error } = await apiGet<SubscriptionSummary>('/api/subscription');
  if (error || !data) {
    console.warn('Failed to load subscription', error);
    return null;
  }
  return data;
}

interface CheckoutOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  billingCycle: BillingCycle;
}

async function createCheckoutOrder(billingCycle: BillingCycle): Promise<{ order?: CheckoutOrder; error?: string }> {
  const { data, error } = await apiPost<CheckoutOrder>('/api/subscription/checkout', { billingCycle });
  if (error || !data) return { error: error ?? 'Could not start checkout.' };
  return { order: data };
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface StartCheckoutResult {
  ok: boolean;
  error?: string;
}

/**
 * Opens Razorpay Checkout for the given billing cycle. On success, sends the
 * payment details to the backend for signature verification — the backend
 * (never this function, never the browser) is what actually activates the
 * paid plan. Resolves once the flow is fully settled (verified, failed, or
 * dismissed).
 */
export async function startCheckout(billingCycle: BillingCycle, companyName: string): Promise<StartCheckoutResult> {
  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded) return { ok: false, error: 'Could not load the payment provider. Check your connection and try again.' };

  const { order, error: orderError } = await createCheckoutOrder(billingCycle);
  if (!order) return { ok: false, error: orderError };

  return new Promise((resolve) => {
    const razorpay = new (window as any).Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
<<<<<<< HEAD
      name: 'SOPAN',
      description: billingCycle === 'yearly' ? 'SOPAN — Yearly Plan' : 'SOPAN — Monthly Plan',
=======
      name: 'BuilderDocs',
      description: billingCycle === 'yearly' ? 'BuilderDocs — Yearly Plan' : 'BuilderDocs — Monthly Plan',
>>>>>>> origin/main
      prefill: { name: companyName },
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const { data, error } = await apiPost<{ ok: boolean }>('/api/subscription/verify', {
          billingCycle,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        if (error || !data?.ok) {
          resolve({ ok: false, error: error ?? 'Payment verification failed.' });
        } else {
          resolve({ ok: true });
        }
      },
      modal: {
        ondismiss: () => resolve({ ok: false, error: 'Payment cancelled.' }),
      },
      theme: { color: '#0B2857' },
    });
    razorpay.open();
  });
}

export async function cancelSubscription(): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await apiPost<{ ok: boolean }>('/api/subscription/cancel', {});
  if (error || !data?.ok) return { ok: false, error: error ?? 'Could not cancel subscription.' };
  return { ok: true };
}
