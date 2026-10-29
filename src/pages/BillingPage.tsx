import ConfirmDialog from '@/components/ConfirmDialog';
import { AppButton, PageHeader, PremiumCard } from '@/components/ui/DesignSystem';
import { useCompany } from '@/context/CompanyContext';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/lib/utils';
import {
    cancelSubscription,
    getSubscription,
    startCheckout,
    type SubscriptionSummary,
} from '@/services/subscription.service';
import { Check, CreditCard, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

const PAID_FEATURES = [
  'Unlimited quotations',
  'All features included',
  'BOQ, specifications & payment schedules',
  'Professional PDF generation',
  'Customer management',
  'Company branding',
  'Cloud storage',
  'Multiple users',
];

export default function BillingPage() {
  const { company } = useCompany();
  const { push } = useToast();
  const [sub, setSub] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'monthly' | 'yearly' | 'cancel' | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const canManage = company?.callerRole === 'owner' || company?.callerRole === 'admin';

  const refresh = async () => {
    setLoading(true);
    setSub(await getSubscription());
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, [company?.companyId]);

  const handleUpgrade = async (billingCycle: 'monthly' | 'yearly') => {
    if (!canManage) return;
    setBusy(billingCycle);
    const result = await startCheckout(billingCycle, company?.settings.companyName || 'Your company');
    setBusy(null);
    if (result.ok) {
      push('success', 'Payment successful — you’re now on the BuilderDocs plan.');
      void refresh();
    } else if (result.error && result.error !== 'Payment cancelled.') {
      push('error', result.error);
    }
  };

  const handleCancel = async () => {
    if (!canManage) return;
    setConfirmCancel(false);
    setBusy('cancel');
    const result = await cancelSubscription();
    setBusy(null);
    if (result.ok) {
      push('success', 'Subscription cancelled. You\u2019re back on the free plan.');
      void refresh();
    } else {
      push('error', result.error || 'Could not cancel subscription.');
    }
  };

  if (loading) {
    return <div className="rounded-2xl border border-[#E6E8EC] bg-white p-10 text-center text-sm text-[#667085] shadow-[0_6px_18px_rgba(15,23,42,0.03)]">Loading billing details…</div>;
  }

  const isPaid = sub?.plan === 'paid' && sub.status === 'active';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Billing"
        description="Manage your company’s BuilderDocs plan and renewal status."
      />

      <PremiumCard className="p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-[#17243A]">
            {isPaid ? 'BuilderDocs Plan' : 'Free Plan'}
          </h2>
          {isPaid && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] px-2.5 py-1 text-xs font-medium text-[#0F766E]">
              <Zap className="h-3.5 w-3.5" /> Active
            </span>
          )}
        </div>

        {isPaid ? (
          <>
            <p className="text-sm text-slate-500">
              Billed {sub?.billingCycle === 'yearly' ? 'yearly' : 'monthly'}
              {sub?.currentPeriodEnd ? ` \u2014 renews ${formatDate(sub.currentPeriodEnd)}` : ''}. Unlimited quotations.
            </p>
            {canManage && (
              <AppButton variant="ghost" onClick={() => setConfirmCancel(true)} disabled={busy === 'cancel'} className="mt-4 text-red-600 hover:bg-red-50 hover:text-red-700">
                {busy === 'cancel' ? 'Cancelling…' : 'Cancel subscription'}
              </AppButton>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-500">
            {sub ? `${sub.used} of ${sub.limit} quotations used this month.` : 'Up to 3 quotations per month.'}
            {' '}Upgrade for unlimited quotations.
          </p>
        )}
      </PremiumCard>

      {!isPaid && (
        <div className="rounded-2xl border-2 border-[#F4B72B] bg-[#FFF8E8] p-6 shadow-[0_6px_18px_rgba(15,23,42,0.03)]">
          <h2 className="text-base font-semibold text-[#17243A] mb-1">Upgrade to BuilderDocs</h2>
          <p className="text-sm text-[#667085] mb-5">One plan. All features. No complicated tiers.</p>
          <ul className="space-y-2 mb-6">
            {PAID_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {f}
              </li>
            ))}
          </ul>

          {!canManage ? (
            <p className="text-sm text-slate-400">Only a company owner or admin can upgrade billing.</p>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <AppButton onClick={() => handleUpgrade('monthly')} disabled={busy !== null} className="flex-1 justify-center">
                <CreditCard className="h-4 w-4" /> {busy === 'monthly' ? 'Opening…' : '₹499 / month'}
              </AppButton>
              <AppButton variant="secondary" onClick={() => handleUpgrade('yearly')} disabled={busy !== null} className="flex-1 justify-center border-[#F4B72B] bg-[#F4B72B] text-[#17243A] hover:bg-[#e0a520]">
                <CreditCard className="h-4 w-4" /> {busy === 'yearly' ? 'Opening…' : '₹4,999 / year'}
              </AppButton>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel Subscription?"
        message="You'll immediately lose unlimited quotations and drop to the free plan's 3-per-month limit. This takes effect right away, not at the end of your billing period."
        danger
        confirmLabel="Cancel Subscription"
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}
