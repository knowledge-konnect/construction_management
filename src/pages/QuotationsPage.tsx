import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuotationTable from '@/components/QuotationTable';
import { useCompany } from '@/context/CompanyContext';
import { listDocuments } from '@/services/document.service';
import { Plus } from 'lucide-react';
import type { Quotation } from '@/lib/models';

export default function QuotationsPage() {
  const navigate = useNavigate();
  const { company } = useCompany();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!company) return;
    setLoading(true);
    const docs = await listDocuments(company.companyId);
    setQuotations(docs);
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, [company]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
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

      {loading ? (
        <p className="text-sm text-slate-400 py-16 text-center">Loading quotations…</p>
      ) : (
        <QuotationTable quotations={quotations} onRefresh={refresh} />
      )}
    </div>
  );
}
