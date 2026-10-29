import QuotationTable from '@/components/QuotationTable';
import { AppButton, PageHeader } from '@/components/ui/DesignSystem';
import { useCompany } from '@/context/CompanyContext';
import type { Quotation } from '@/lib/models';
import { listDocuments } from '@/services/document.service';
import { getSubscription, type SubscriptionSummary } from '@/services/subscription.service';
import { Plus, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function QuotationsPage() {
  const navigate = useNavigate();
  const { company } = useCompany();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<SubscriptionSummary | null>(null);

  const refresh = async () => {
    if (!company) return;
    setLoading(true);
    const docs = await listDocuments(company.companyId);
    setQuotations(docs);
    setLoading(false);
    setSub(await getSubscription());
  };

  useEffect(() => { void refresh(); }, [company]);

  const limitReached = sub?.plan === 'free' && sub.remaining === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotations"
        actions={
          <AppButton onClick={() => navigate('/quotations/new')}>
            <Plus className="h-4 w-4" />
            New Quotation
          </AppButton>
        }
      />

      {sub?.plan === 'free' && (
        limitReached ? (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <span>You've reached your 3 quotation limit for this month. Upgrade to BuilderDocs for unlimited quotations.</span>
            <button onClick={() => navigate('/billing')} className="inline-flex items-center gap-1 font-semibold text-[#1D4ED8] hover:text-[#1E40AF] shrink-0">
              <Zap className="w-3.5 h-3.5" /> Upgrade
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-400 mb-6">{sub.used} of {sub.limit} quotations used this month.</p>
        )
      )}

      {loading ? (
        <p className="text-sm text-slate-400 py-16 text-center">Loading quotations…</p>
      ) : (
        <QuotationTable quotations={quotations} onRefresh={refresh} />
      )}
    </div>
  );
}
