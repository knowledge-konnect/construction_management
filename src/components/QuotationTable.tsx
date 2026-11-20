import ConfirmDialog from '@/components/ConfirmDialog';
import { DocumentGenerationLoader } from '@/components/loading/Loaders';
import PdfPreviewModal from '@/components/quotation/PdfPreviewModal';
import StatusBadge from '@/components/StatusBadge';
import { AppButton } from '@/components/ui/DesignSystem';
import DataTable, { CellText, RowActionButton, RowActions, type Column } from '@/components/ui/DataTable';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { useToast } from '@/context/ToastContext';
import { QUOTATION_STATUSES } from '@/lib/constants';
import type { Quotation, QuotationStatus } from '@/lib/models';
import { downloadQuotationPDF } from '@/lib/pdf';
import { formatDate, formatINR } from '@/lib/utils';
import { deleteDocument, nextSequence, saveDocument } from '@/services/document.service';
import { createProjectFromQuotation } from '@/services/project.service';
import { Copy, Eye, FileDown, FileText, FolderKanban, MessageCircle, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuid } from 'uuid';

interface Props {
  quotations: Quotation[];
  onRefresh: () => void;
  showCreate?: boolean;
}

export default function QuotationTable({ quotations, onRefresh, showCreate = true }: Props) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { push } = useToast();
  const { company } = useCompany();
  const { user } = useAuth();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('updated');
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [creatingProjectId, setCreatingProjectId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const nextSearch = searchParams.get('search') ?? '';
    setSearch(nextSearch);
  }, [searchParams]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (value.trim()) {
      setSearchParams({ search: value.trim() }, { replace: true });
      return;
    }
    setSearchParams({}, { replace: true });
  };

  const settings = company?.settings;

  const filtered = useMemo(() => {
    let list = [...quotations];
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (q) =>
          q.quotationNumber.toLowerCase().includes(s) ||
          q.customer.name.toLowerCase().includes(s) ||
          q.project.name.toLowerCase().includes(s) ||
          q.customer.mobile.includes(s),
      );
    }
    if (statusFilter !== 'All') list = list.filter((q) => q.status === statusFilter);
    if (typeFilter !== 'All') list = list.filter((q) => q.project.projectType === typeFilter);
    switch (sortBy) {
      case 'updated': list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); break;
      case 'newest': list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
      case 'oldest': list.sort((a, b) => a.createdAt.localeCompare(b.createdAt)); break;
      case 'amount-high': list.sort((a, b) => b.grandTotal - a.grandTotal); break;
      case 'amount-low': list.sort((a, b) => a.grandTotal - b.grandTotal); break;
    }
    return list;
  }, [quotations, search, statusFilter, typeFilter, sortBy]);

  const handleDuplicate = async (q: Quotation) => {
    if (!company || !user) return;
    const seq = await nextSequence(company.companyId);
    const year = new Date().getFullYear();
    const copy: Quotation = {
      ...q,
      id: uuid(),
      quotationNumber: `${settings?.prefix ?? 'QTN'}/${year}/${String(seq).padStart(3, '0')}`,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generatedAt: null,
    };
    const result = await saveDocument(copy, company.companyId, user.id);
    if (!result.ok) {
      push('error', 'We could not duplicate this quotation right now. Please try again.');
      return;
    }
    push('success', 'Quotation duplicated successfully. A new draft copy is ready for editing.');
    onRefresh();
  };

  const handleDownload = async (q: Quotation) => {
    if (!settings) return;
    if (generatingPdfId) return;
    setGeneratingPdfId(q.id);
    try {
      await downloadQuotationPDF(q, settings);
      push('success', 'Quotation PDF downloaded successfully.');
    } catch (e) {
      push('error', 'We could not generate the PDF right now. Please try again.');
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const handleWhatsAppShare = (q: Quotation) => {
    const message = [
      `Quotation: ${q.quotationNumber}`,
      `Customer: ${q.customer.name || '-'}`,
      `Project: ${q.project.name || '-'}`,
      `Amount: ${formatINR(q.grandTotal)}`,
      `Status: ${q.status}`,
    ].join('\n');

    const mobileDigits = (q.customer.mobile || '').replace(/\D/g, '');
    const phone = mobileDigits.length === 10 ? `91${mobileDigits}` : mobileDigits;
    const href = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const handleDelete = async () => {
    if (!deleteId || deleting) return;
    setDeleting(true);
    const ok = await deleteDocument(deleteId, company?.companyId);
    setDeleteId(null);
    setDeleting(false);
    if (!ok) {
      push('error', 'We could not delete this quotation right now. Please try again.');
      return;
    }
    push('success', 'Quotation deleted successfully.');
    onRefresh();
  };

  const handleStatusChange = async (q: Quotation, status: QuotationStatus) => {
    if (!company || !user) return;
    const updated: Quotation = { ...q, status, updatedAt: new Date().toISOString() };
    const result = await saveDocument(updated, company.companyId, user.id);
    if (!result.ok) {
      push('error', 'We could not update quotation status right now. Please try again.');
      return;
    }
    push('success', `Marked as ${QUOTATION_STATUSES.find((s) => s.value === status)?.label ?? status}.`);
    onRefresh();
  };

  const handleCreateProject = async (q: Quotation) => {
    if (!company || !user) return;
    if (creatingProjectId) return;
    if (q.status !== 'ACCEPTED') {
      push('error', 'Only accepted quotations can be converted into projects.');
      return;
    }

    setCreatingProjectId(q.id);
    try {
      const project = await createProjectFromQuotation(q.id);
      if (!project) {
        push('error', 'Project could not be created from this quotation.');
        return;
      }

      push('success', `Project ${project.projectNumber} created.`);
      navigate(`/projects/${project.id}`);
    } finally {
      setCreatingProjectId(null);
    }
  };

  const statusCounts = useMemo(() => {
    return QUOTATION_STATUSES.reduce((acc, status) => {
      acc[status.value] = quotations.filter((q) => q.status === status.value).length;
      return acc;
    }, {} as Record<string, number>);
  }, [quotations]);

  const projectTypeOptions = useMemo(() => {
    const values = Array.from(new Set(quotations.map((q) => q.project.projectType).filter(Boolean)));
    return values.sort((a, b) => a.localeCompare(b));
  }, [quotations]);

  // Rows arrive already ordered by the "sort by" dropdown above, so the column headers are not sortable here.
  const columns: Column<Quotation>[] = [
    {
      key: 'number',
      header: 'Quotation no.',
      cell: (q) => <span className="font-medium text-[var(--primary)]">{q.quotationNumber}</span>,
    },
    { key: 'customer', header: 'Customer', cell: (q) => <CellText>{q.customer.name}</CellText> },
    { key: 'project', header: 'Project', cell: (q) => <CellText>{q.project.name}</CellText> },
    { key: 'type', header: 'Type', cell: (q) => <CellText muted>{q.project.projectType}</CellText> },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (q) => <span className="font-semibold text-[var(--text)]">{formatINR(q.grandTotal)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (q) => (
        <div className="relative inline-block">
          <button type="button" className="focus:outline-none" title="Click to change status" tabIndex={-1}>
            <StatusBadge status={q.status} />
          </button>
          <select
            value={q.status}
            onChange={(e) => handleStatusChange(q, e.target.value as QuotationStatus)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={`Change status for ${q.quotationNumber}`}
          >
            {QUOTATION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      ),
    },
    { key: 'updated', header: 'Updated', cell: (q) => <CellText>{formatDate(q.updatedAt)}</CellText> },
    {
      key: 'actions',
      header: 'Actions',
      kind: 'actions',
      cell: (q) => (
        <RowActions>
          <RowActionButton label="Edit quotation" icon={<Pencil className="h-4 w-4" />} onClick={() => navigate(`/quotations/${q.id}/edit`)} />
          <RowActionButton label="Preview PDF" icon={<Eye className="h-4 w-4" />} onClick={() => setPreviewQuotation(q)} />
          <RowActionButton label="Download PDF" icon={<FileDown className="h-4 w-4" />} disabled={Boolean(generatingPdfId)} onClick={() => void handleDownload(q)} />
          <RowActionButton label="Share on WhatsApp" icon={<MessageCircle className="h-4 w-4" />} onClick={() => handleWhatsAppShare(q)} />
          <RowActionButton label="Duplicate quotation" icon={<Copy className="h-4 w-4" />} onClick={() => handleDuplicate(q)} />
          {q.status === 'ACCEPTED' && (
            <RowActionButton label="Create project" icon={<FolderKanban className="h-4 w-4" />} disabled={Boolean(creatingProjectId)} onClick={() => void handleCreateProject(q)} />
          )}
          <RowActionButton label="Delete quotation" tone="danger" icon={<Trash2 className="h-4 w-4" />} disabled={deleting} onClick={() => setDeleteId(q.id)} />
        </RowActions>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Total', value: quotations.length, dot: '' },
          { label: 'Generated', value: statusCounts.GENERATED ?? 0, dot: 'bg-[var(--info)]' },
          { label: 'Sent', value: statusCounts.SENT ?? 0, dot: 'bg-[var(--warning)]' },
          { label: 'Draft', value: statusCounts.DRAFT ?? 0, dot: 'bg-[var(--text-subtle)]' },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
            <p className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
              {card.dot && <span className={`h-2 w-2 rounded-full ${card.dot}`} aria-hidden="true" />}
              {card.label}
            </p>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums text-[var(--text)]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        {QUOTATION_STATUSES.map((status) => (
          <div key={status.value} className="inline-flex items-center gap-2">
            <StatusBadge status={status.value as QuotationStatus} />
            <span className="text-xs tabular-nums text-[var(--text-muted)]">{statusCounts[status.value] ?? 0}</span>
          </div>
        ))}
      </div>

      {generatingPdfId && (
        <div className="mb-4">
          <DocumentGenerationLoader label="Generating quotation PDF…" />
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative block flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search quotation, customer, project, or mobile…"
              className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface-soft)] py-2.5 pl-9 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-soft)] px-3 py-2.5 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]">
              <option value="All">All Status</option>
              {QUOTATION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-soft)] px-3 py-2.5 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]">
              <option value="All">All Types</option>
              {projectTypeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-soft)] px-3 py-2.5 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]">
              <option value="updated">Recently Updated</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="amount-high">Amount: High to Low</option>
              <option value="amount-low">Amount: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <DataTable
          caption="Quotations"
          columns={columns}
          rows={filtered}
          rowKey={(q) => q.id}
          rowTone={(q) => (q.status === 'ACCEPTED' ? 'success' : undefined)}
          pagination={{ page, pageSize: 10, onPageChange: setPage }}
          empty={{
            icon: <FileText className="h-5 w-5" />,
            title: quotations.length === 0 ? 'No quotations yet' : 'No quotations match your filters',
            description:
              quotations.length === 0
                ? 'Create your first quotation to start tracking customer work and project value.'
                : 'Try a broader search or change the status/type view.',
            action:
              quotations.length === 0 && showCreate ? (
                <AppButton onClick={() => navigate('/quotations/new')}>
                  <Plus className="h-4 w-4" /> Create Quotation
                </AppButton>
              ) : undefined,
          }}
        />
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete quotation?"
        message="This will remove the quotation from your active list and hide it from search and reports."
        danger
        confirmLabel={deleting ? 'Deleting…' : 'Delete quotation'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      {previewQuotation && settings && (
        <PdfPreviewModal
          quotation={previewQuotation}
          settings={settings}
          onClose={() => setPreviewQuotation(null)}
        />
      )}
    </div>
  );
}
