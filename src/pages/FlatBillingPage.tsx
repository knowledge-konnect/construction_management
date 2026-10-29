import ConfirmDialog from '@/components/ConfirmDialog';
import { AppButton, EmptyState, PageHeader, PremiumCard } from '@/components/ui/DesignSystem';
import { useCompany } from '@/context/CompanyContext';
import { useToast } from '@/context/ToastContext';
import type { FlatBilling } from '@/lib/flatBilling';
import { calcFlatTotal } from '@/lib/flatBilling';
import { formatDate, formatINR } from '@/lib/utils';
import { deleteFlatBilling, listFlatBillings } from '@/services/flatBilling.service';
import { Building2, Download, FileEdit, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FlatBillingPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { company } = useCompany();
  const [records, setRecords] = useState<FlatBilling[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const refresh = async () => {
    if (!company) { setLoading(false); return; }
    setLoading(true);
    const list = await listFlatBillings(company.companyId);
    setRecords(list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, [company]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const ok = await deleteFlatBilling(deleteId, company?.companyId);
    setDeleteId(null);
    if (ok) {
      await refresh();
      push('success', 'Booking receipt deleted.');
    } else {
      push('error', 'Could not delete the receipt. Please try again.');
    }
  };

  const handleDownload = (rec: FlatBilling) => {
    const settings = company?.settings;
    if (!settings) {
      push('error', 'Company settings not found. Please complete company setup first.');
      return;
    }
    import('@/lib/flatBillingPdf')
      .then(({ generateFlatBillingPDFImpl }) => generateFlatBillingPDFImpl(rec, settings))
      .then(() => push('success', 'PDF downloaded successfully.'))
      .catch(() => push('error', 'Failed to generate PDF. Please try again.'));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Booking Receipts"
        description="Create booking receipts and planned installment schedules for apartment and flat sales."
        actions={
          <AppButton onClick={() => navigate('/flat-billing/new')}>
            <Plus className="h-4 w-4" />
            Create Booking Receipt
          </AppButton>
        }
      />

      {loading ? (
        <div className="rounded-2xl border border-[#E6E8EC] bg-white p-10 text-center text-sm text-[#667085] shadow-[0_6px_18px_rgba(15,23,42,0.03)]">Loading receiptsâ€¦</div>
      ) : records.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-6 w-6 text-[#F4B72B]" />}
          title="No booking receipts yet"
          description="Create a booking receipt to generate a professional flat booking PDF for your sale workflow."
          action={
            <AppButton onClick={() => navigate('/flat-billing/new')}>
              <Plus className="h-4 w-4" />
              Create Booking Receipt
            </AppButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {records.map((rec) => {
            const total = calcFlatTotal(rec);
            const scheduledAmount = rec.payments.reduce((s, p) => s + (p.amount || 0), 0);
            const balance = total - scheduledAmount;
            return (
              <PremiumCard key={rec.id} className="flex flex-col p-5">
                {/* Card header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[#0B234A] truncate">
                      {rec.buyerName || 'Untitled Receipt'}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">
                      {rec.receiptNumber}
                      {rec.flatNo ? ` Â· Flat ${rec.flatNo}` : ''}
                      {rec.blockTower ? `, ${rec.blockTower}` : ''}
                    </p>
                  </div>
                </div>

                {/* Amounts */}
                {total > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-slate-50 rounded-lg px-2 py-1.5 text-center">
                      <p className="text-xs text-slate-400 mb-0.5">Total</p>
                      <p className="text-xs font-semibold text-slate-700">{formatINR(total)}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg px-2 py-1.5 text-center">
                      <p className="text-xs text-slate-400 mb-0.5">Planned</p>
                      <p className="text-xs font-semibold text-green-700">{formatINR(scheduledAmount)}</p>
                    </div>
                    <div className={`rounded-lg px-2 py-1.5 text-center ${balance > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                      <p className="text-xs text-slate-400 mb-0.5">Balance</p>
                      <p className={`text-xs font-semibold ${balance > 0 ? 'text-amber-700' : 'text-green-700'}`}>{formatINR(Math.max(balance, 0))}</p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-400 mb-4">Date: {formatDate(rec.date)}</p>

                {/* Actions */}
                <div className="mt-auto flex items-center gap-2">
                  <AppButton variant="secondary" onClick={() => navigate(`/flat-billing/${rec.id}/edit`)} className="flex-1 justify-center">
                    <FileEdit className="h-4 w-4" /> Edit
                  </AppButton>
                  <AppButton onClick={() => handleDownload(rec)} className="flex-1 justify-center">
                    <Download className="h-4 w-4" /> PDF
                  </AppButton>
                  <button
                    onClick={() => setDeleteId(rec.id)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                    aria-label="Delete receipt"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </PremiumCard>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Receipt?"
        message="This will permanently delete this booking receipt. This cannot be undone."
        danger
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

