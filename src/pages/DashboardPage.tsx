import StatusBadge from '@/components/StatusBadge';
import { useCompany } from '@/context/CompanyContext';
import type { FlatBilling } from '@/lib/flatBilling';
import { calcFlatTotal, flatBillingRepo } from '@/lib/flatBilling';
import type { Quotation } from '@/lib/models';
import { formatDate, formatINR } from '@/lib/utils';
import { listDocuments } from '@/services/document.service';
import {
  ArrowRight,
  Building2,
  FileText,
  IndianRupee,
  Plus,
  Receipt,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { company } = useCompany();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [flatBillings, setFlatBillings] = useState<FlatBilling[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setFlatBillings(flatBillingRepo.list().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    if (!company) { setLoading(false); return; }
    listDocuments(company.companyId).then((docs) => {
      setQuotations(docs);
      setLoading(false);
    });
  }, [company]);

  const totalQuotationValue = quotations.reduce((s, q) => s + (q.grandTotal || 0), 0);
  const totalFlatValue = flatBillings.reduce((s, b) => s + calcFlatTotal(b), 0);
  const draftCount = quotations.filter((q) => q.status === 'DRAFT').length;
  const generatedCount = quotations.filter((q) => q.status === 'GENERATED').length;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#0B2857]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0B2857]">
              <Sparkles className="h-3.5 w-3.5" />
              Workspace overview
            </div>
            <h1 className="mt-3 text-2xl font-bold text-[#0B234A]">Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">
              Welcome back{company?.settings?.companyName ? `, ${company.settings.companyName}` : ''}. Here’s a clearer view of your active quotes and receipts.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/quotations/new')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#0B2857]/30 px-3 py-2 text-sm font-medium text-[#0B2857] transition-colors hover:bg-[#0B2857]/5"
            >
              <FileText className="h-4 w-4" /> New Quotation
            </button>
            <button
              onClick={() => navigate('/flat-billing/new')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2857] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#071C3F]"
            >
              <Receipt className="h-4 w-4" /> New Flat Receipt
            </button>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Quotations"
          value={loading ? '…' : String(quotations.length)}
          sub={`${draftCount} draft · ${generatedCount} generated`}
          icon={<FileText className="w-5 h-5 text-[#0B2857]" />}
          color="blue"
        />
        <StatCard
          label="Quotation Value"
          value={loading ? '…' : formatINR(totalQuotationValue)}
          sub="across all quotations"
          icon={<IndianRupee className="w-5 h-5 text-emerald-600" />}
          color="green"
        />
        <StatCard
          label="Flat Receipts"
          value={String(flatBillings.length)}
          sub="booking receipts created"
          icon={<Building2 className="w-5 h-5 text-amber-600" />}
          color="amber"
        />
        <StatCard
          label="Flat Billing Value"
          value={formatINR(totalFlatValue)}
          sub="total flat cost recorded"
          icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
          color="purple"
        />
      </div>

      {/* Two-column recent lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotations */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#0B2857]" />
              <h2 className="text-sm font-semibold text-[#0B234A]">Recent Quotations</h2>
            </div>
            <button
              onClick={() => navigate('/quotations')}
              className="flex items-center gap-1 text-xs font-medium text-[#0B2857] hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {loading ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400">Loading your recent documents…</div>
          ) : quotations.length === 0 ? (
            <EmptySection
              icon={<FileText className="w-8 h-8 text-slate-300" />}
              message="No quotations yet"
              subMessage="Create your first quotation to start tracking customer work and project value."
              action={{ label: 'Create Quotation', onClick: () => navigate('/quotations/new') }}
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {quotations.slice(0, 6).map((q) => (
                <li
                  key={q.id}
                  onClick={() => navigate(`/quotations/${q.id}/edit`)}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B2857]/8">
                      <FileText className="h-4 w-4 text-[#0B2857]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-[#0B2857]">{q.quotationNumber}</p>
                        <StatusBadge status={q.status} />
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {q.customer.name || 'Customer'}
                        {q.project.name ? ` · ${q.project.name}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 shrink-0 text-right">
                    <p className="text-sm font-semibold text-slate-700">{formatINR(q.grandTotal)}</p>
                    <p className="text-xs text-slate-400">{q.updatedAt ? formatDate(q.updatedAt) : ''}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {quotations.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-3">
              <button
                onClick={() => navigate('/quotations/new')}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#0B2857] hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> New Quotation
              </button>
            </div>
          )}
        </section>

        {/* Recent Flat Receipts */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-semibold text-[#0B234A]">Recent Flat Receipts</h2>
            </div>
            <button
              onClick={() => navigate('/flat-billing')}
              className="flex items-center gap-1 text-xs font-medium text-[#0B2857] hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {flatBillings.length === 0 ? (
            <EmptySection
              icon={<Building2 className="w-8 h-8 text-slate-300" />}
              message="No flat receipts yet"
              subMessage="Create a receipt to capture booking details and keep payment tracking simple."
              action={{ label: 'Create Receipt', onClick: () => navigate('/flat-billing/new') }}
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {flatBillings.slice(0, 6).map((b) => (
                <li
                  key={b.id}
                  onClick={() => navigate(`/flat-billing/${b.id}/edit`)}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50">
                      <Building2 className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#0B2857]">{b.receiptNumber}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {b.buyerName || 'Buyer'}
                        {b.flatNo ? ` · Flat ${b.flatNo}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 shrink-0 text-right">
                    <p className="text-sm font-semibold text-slate-700">{formatINR(calcFlatTotal(b))}</p>
                    <p className="text-xs text-slate-400">{b.updatedAt ? formatDate(b.updatedAt) : ''}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {flatBillings.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-3">
              <button
                onClick={() => navigate('/flat-billing/new')}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#0B2857] hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> New Receipt
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
type CardColor = 'blue' | 'green' | 'amber' | 'purple';

const colorMap: Record<CardColor, string> = {
  blue: 'bg-[#0B2857]/8',
  green: 'bg-emerald-50',
  amber: 'bg-amber-50',
  purple: 'bg-purple-50',
};

function StatCard({
  label, value, sub, icon, color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: CardColor;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colorMap[color]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
          <p className="truncate text-xl font-bold text-[#0B234A]">{value}</p>
          <p className="mt-1 truncate text-xs text-slate-400">{sub}</p>
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptySection({
  icon, message, subMessage, action,
}: {
  icon: React.ReactNode;
  message: string;
  subMessage?: string;
  action: { label: string; onClick: () => void };
}) {
  return (
    <div className="px-5 py-10">
      <div className="mx-auto flex max-w-sm flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-8 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">{icon}</div>
        <p className="text-sm font-semibold text-slate-700">{message}</p>
        {subMessage && <p className="mt-1 text-sm text-slate-500">{subMessage}</p>}
        <button
          onClick={action.onClick}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0B2857] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#071C3F]"
        >
          <Plus className="h-3.5 w-3.5" /> {action.label}
        </button>
      </div>
    </div>
  );
}
