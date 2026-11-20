import ConfirmDialog from '@/components/ConfirmDialog';
import { DocumentGenerationLoader, SkeletonLoader } from '@/components/loading/Loaders';
import { AppButton, EmptyState, PageHeader, PremiumCard } from '@/components/ui/DesignSystem';
import { useCompany } from '@/context/CompanyContext';
import { useToast } from '@/context/ToastContext';
import type { FlatBilling } from '@/lib/flatBilling';
import { calcFlatTotal } from '@/lib/flatBilling';
import { formatDate, formatINR } from '@/lib/utils';
import { deleteFlatBilling, listFlatBillings } from '@/services/flatBilling.service';
import { listProjects, type ProjectRecord } from '@/services/project.service';
import { Building2, Download, FileEdit, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FlatBillingPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { company } = useCompany();
  const [records, setRecords] = useState<FlatBilling[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  const refresh = async () => {
    if (!company) { setLoading(false); return; }
    setLoading(true);
    const list = await listFlatBillings(company.companyId, selectedProjectId || undefined);
    setRecords(list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, [company, selectedProjectId]);
  useEffect(() => {
    if (!company) return;
    void listProjects().then(setProjects).catch(() => setProjects([]));
  }, [company]);

  const handleDelete = async () => {
    if (!deleteId || deleting) return;
    setDeleting(true);
    const ok = await deleteFlatBilling(deleteId, company?.companyId);
    setDeleteId(null);
    setDeleting(false);
    if (ok) {
      await refresh();
      push('success', 'Booking receipt deleted successfully. This receipt is now removed from your records.');
    } else {
      push('error', 'Could not delete the receipt. Please try again.');
    }
  };

  const handleDownload = async (rec: FlatBilling) => {
    const settings = company?.settings;
    if (!settings) {
      push('error', 'Company settings not found. Please complete company setup first.');
      return;
    }
    if (generatingPdfId) return;
    setGeneratingPdfId(rec.id);
    try {
      const { generateFlatBillingPDFImpl } = await import('@/lib/flatBillingPdf');
      await generateFlatBillingPDFImpl(rec, settings);
      push('success', 'Booking receipt PDF downloaded successfully.');
    } catch {
      push('error', 'Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const visibleRecords = selectedProjectId ? records.filter((rec) => rec.projectId === selectedProjectId) : records;
  const totalBooked = visibleRecords.reduce((sum, rec) => sum + calcFlatTotal(rec), 0);
  const totalPlanned = visibleRecords.reduce((sum, rec) => sum + rec.payments.reduce((inner, p) => inner + (p.amount || 0), 0), 0);

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

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-[var(--text-secondary)]">Project filter</div>
          <select
            value={selectedProjectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] md:max-w-xs"
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Receipts</p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-2xl font-bold tracking-[-0.04em] text-[var(--text)]">{visibleRecords.length}</p>
              <span className="inline-flex items-center rounded-full border border-[var(--info-border)] bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-medium text-[var(--primary)]">Live</span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Planned</p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-2xl font-bold tracking-[-0.04em] text-[var(--text)]">{formatINR(totalPlanned)}</p>
              <span className="inline-flex items-center rounded-full border border-[var(--success-border)] bg-[var(--success-soft)] px-2.5 py-1 text-xs font-medium text-[var(--success-fg)]">Booked</span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Total value</p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-2xl font-bold tracking-[-0.04em] text-[var(--text)]">{formatINR(totalBooked)}</p>
              <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">Summary</span>
            </div>
          </div>
        </div>
      </div>

      {generatingPdfId && <DocumentGenerationLoader label="Generating booking receipt PDF…" />}

      {loading ? (
        <SkeletonLoader variant="table" rows={8} className="rounded-2xl" />
      ) : visibleRecords.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-6 w-6 text-[var(--primary)]" />}
          title={selectedProjectId ? 'No receipts for this project' : 'No booking receipts yet'}
          description={selectedProjectId ? 'This project has no linked booking receipts yet.' : 'Create a booking receipt to generate a professional flat booking PDF for your sale workflow.'}
          action={
            <AppButton onClick={() => navigate('/flat-billing/new')}>
              <Plus className="h-4 w-4" />
              Create Booking Receipt
            </AppButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleRecords.map((rec) => {
            const total = calcFlatTotal(rec);
            const scheduledAmount = rec.payments.reduce((s, p) => s + (p.amount || 0), 0);
            const balance = total - scheduledAmount;
            return (
              <PremiumCard key={rec.id} className="flex flex-col p-5">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] ring-1 ring-inset ring-white">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-[var(--text)]">
                      {rec.buyerName || 'Untitled Receipt'}
                    </h3>
                    <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                      {rec.projectName ? `${rec.projectName} • ` : ''}{rec.receiptNumber}
                      {rec.flatNo ? ` • Flat ${rec.flatNo}` : ''}
                      {rec.blockTower ? ` • ${rec.blockTower}` : ''}
                    </p>
                  </div>
                </div>

                {total > 0 && (
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-2 py-2 text-center">
                      <p className="mb-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">Total</p>
                      <p className="text-xs font-semibold text-[var(--text)]">{formatINR(total)}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--success-border)] bg-[var(--success-soft)] px-2 py-2 text-center">
                      <p className="mb-1 text-xs font-medium uppercase tracking-[0.12em] text-[var(--success-fg)]">Planned</p>
                      <p className="text-xs font-semibold text-[var(--success-fg)]">{formatINR(scheduledAmount)}</p>
                    </div>
                    <div className={`rounded-xl border px-2 py-2 text-center ${balance > 0 ? 'border-[var(--warning-border)] bg-[var(--warning-soft)]' : balance < 0 ? 'border-[var(--danger-border)] bg-[var(--danger-soft)]' : 'border-[var(--success-border)] bg-[var(--success-soft)]'}`}>
                      <p className="mb-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">Balance</p>
                      <p className={`text-xs font-semibold ${balance > 0 ? 'text-[var(--warning-fg)]' : balance < 0 ? 'text-[var(--danger-fg)]' : 'text-[var(--success-fg)]'}`}>{formatINR(balance)}</p>
                    </div>
                  </div>
                )}

                <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-muted)]">
                  Date: <span className="font-medium text-[var(--text)]">{formatDate(rec.date)}</span>
                </div>

                <div className="mt-auto flex items-center gap-2">
                  <AppButton variant="secondary" onClick={() => navigate(`/flat-billing/${rec.id}/edit`)} className="flex-1 justify-center">
                    <FileEdit className="h-4 w-4" /> Edit
                  </AppButton>
                  <AppButton onClick={() => void handleDownload(rec)} className="flex-1 justify-center" loading={generatingPdfId === rec.id} loadingText="Generating…">
                    <Download className="h-4 w-4" /> PDF
                  </AppButton>
                  <button
                    disabled={deleting}
                    onClick={() => setDeleteId(rec.id)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)] hover:text-[var(--danger-fg)] disabled:cursor-not-allowed disabled:opacity-50"
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
        title="Delete booking receipt?"
        message="This will permanently delete this booking receipt. This cannot be undone."
        danger
        confirmLabel={deleting ? 'Deleting…' : 'Delete booking receipt'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

