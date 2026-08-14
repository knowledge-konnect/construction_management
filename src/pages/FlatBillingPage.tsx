import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { flatBillingRepo } from '@/lib/flatBilling';
import { calcFlatTotal } from '@/lib/flatBilling';
import { formatDate, formatINR } from '@/lib/utils';
import { Plus, FileEdit, Trash2, Download, Building2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useCompany } from '@/context/CompanyContext';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { FlatBilling } from '@/lib/flatBilling';

export default function FlatBillingPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { company } = useCompany();
  const [records, setRecords] = useState<FlatBilling[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const refresh = () =>
    setRecords(
      flatBillingRepo.list().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    );

  useEffect(() => { refresh(); }, []);

  const handleDelete = () => {
    if (!deleteId) return;
    flatBillingRepo.delete(deleteId);
    setDeleteId(null);
    refresh();
    push('success', 'Flat billing receipt deleted.');
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
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B234A]">Flat Billing Receipts</h1>
          <p className="text-sm text-slate-500">
            Create and download Flat Booking Receipts for apartment / flat sales.
          </p>
        </div>
        <button
          onClick={() => navigate('/flat-billing/new')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#0B2857] hover:bg-[#071C3F] rounded-lg"
        >
          <Plus className="w-4 h-4" /> New Receipt
        </button>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl bg-white">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold text-[#0B234A] mb-1">No flat billing receipts yet</h3>
          <p className="text-sm text-slate-500 mb-4">
            Create one to generate a professional Flat Booking Receipt PDF.
          </p>
          <button
            onClick={() => navigate('/flat-billing/new')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#0B2857] hover:bg-[#071C3F] rounded-lg"
          >
            <Plus className="w-4 h-4" /> New Receipt
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((rec) => {
            const total = calcFlatTotal(rec);
            const totalPaid = rec.payments.reduce((s, p) => s + (p.amount || 0), 0);
            const balance = total - totalPaid;
            return (
              <div key={rec.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col hover:shadow-md transition-shadow">
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
                      {rec.flatNo ? ` · Flat ${rec.flatNo}` : ''}
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
                      <p className="text-xs text-slate-400 mb-0.5">Paid</p>
                      <p className="text-xs font-semibold text-green-700">{formatINR(totalPaid)}</p>
                    </div>
                    <div className={`rounded-lg px-2 py-1.5 text-center ${balance > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                      <p className="text-xs text-slate-400 mb-0.5">Balance</p>
                      <p className={`text-xs font-semibold ${balance > 0 ? 'text-amber-700' : 'text-green-700'}`}>{formatINR(Math.max(balance, 0))}</p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-400 mb-4">Date: {formatDate(rec.date)}</p>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-auto">
                  <button
                    onClick={() => navigate(`/flat-billing/${rec.id}/edit`)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#0B2857] border border-[#0B2857]/30 hover:bg-[#0B2857]/5 rounded-lg flex-1 justify-center"
                  >
                    <FileEdit className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => handleDownload(rec)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-[#0B2857] hover:bg-[#071C3F] rounded-lg flex-1 justify-center"
                  >
                    <Download className="w-4 h-4" /> PDF
                  </button>
                  <button
                    onClick={() => setDeleteId(rec.id)}
                    className="p-2 text-red-500 border border-red-200 hover:bg-red-50 rounded-lg"
                    aria-label="Delete receipt"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Receipt?"
        message="This will permanently delete this flat billing receipt. This cannot be undone."
        danger
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
