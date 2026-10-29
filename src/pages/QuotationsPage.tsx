<<<<<<< HEAD
import QuotationTable from '@/components/QuotationTable';
import { AppButton, PageHeader } from '@/components/ui/DesignSystem';
import { useCompany } from '@/context/CompanyContext';
import type { Quotation } from '@/lib/models';
import { listDocuments } from '@/services/document.service';
import { getSubscription, type SubscriptionSummary } from '@/services/subscription.service';
import { Plus, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
=======
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuotationTable from '@/components/QuotationTable';
import { useCompany } from '@/context/CompanyContext';
import { listDocuments } from '@/services/document.service';
import { getSubscription, type SubscriptionSummary } from '@/services/subscription.service';
import { Plus, Zap } from 'lucide-react';
import type { Quotation } from '@/lib/models';
>>>>>>> origin/main

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
<<<<<<< HEAD
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
=======
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B234A]">Quotations</h1>
          <p className="text-sm text-slate-500">Manage and download your construction quotations.</p>
        </div>
        <button
          onClick={() => navigate('/quotations/new')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#0B2857] hover:bg-[#071C3F] rounded-lg"
        >
          <Plus className="w-4 h-4" /> New Quotation
        </button>
      </div>
>>>>>>> origin/main

      {sub?.plan === 'free' && (
        limitReached ? (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <span>You've reached your 3 quotation limit for this month. Upgrade to BuilderDocs for unlimited quotations.</span>
<<<<<<< HEAD
            <button onClick={() => navigate('/billing')} className="inline-flex items-center gap-1 font-semibold text-[#1D4ED8] hover:text-[#1E40AF] shrink-0">
=======
            <button onClick={() => navigate('/billing')} className="inline-flex items-center gap-1 font-semibold text-[#0B2857] hover:text-[#071C3F] shrink-0">
>>>>>>> origin/main
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
