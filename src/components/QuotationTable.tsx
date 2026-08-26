import ConfirmDialog from '@/components/ConfirmDialog';
import PdfPreviewModal from '@/components/quotation/PdfPreviewModal';
import StatusBadge from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { useToast } from '@/context/ToastContext';
import { PROJECT_TYPES, QUOTATION_STATUSES } from '@/lib/constants';
import type { Quotation, QuotationStatus } from '@/lib/models';
import { downloadQuotationPDF } from '@/lib/pdf';
import { formatDate, formatINR } from '@/lib/utils';
import { deleteDocument, nextSequence, saveDocument } from '@/services/document.service';
import {
  Copy,
  Eye,
  FileDown,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';

interface Props {
  quotations: Quotation[];
  onRefresh: () => void;
  showCreate?: boolean;
}

export default function QuotationTable({ quotations, onRefresh, showCreate = true }: Props) {
  const navigate = useNavigate();
  const { push } = useToast();
  const { company } = useCompany();
  const { user } = useAuth();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('updated');

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
    await saveDocument(copy, company.companyId, user.id);
    push('success', 'Quotation duplicated.');
    onRefresh();
  };

  const handleDownload = (q: Quotation) => {
    if (!settings) return;
    downloadQuotationPDF(q, settings)
      .then(() => push('success', 'PDF downloaded.'))
      .catch((e) => push('error', e instanceof Error ? e.message : 'Could not generate PDF.'));
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDocument(deleteId, company?.companyId);
    setDeleteId(null);
    push('success', 'Quotation deleted.');
    onRefresh();
  };

  const handleStatusChange = async (q: Quotation, status: QuotationStatus) => {
    if (!company || !user) return;
    const updated: Quotation = { ...q, status, updatedAt: new Date().toISOString() };
    await saveDocument(updated, company.companyId, user.id);
    push('success', `Marked as ${QUOTATION_STATUSES.find((s) => s.value === status)?.label ?? status}.`);
    onRefresh();
  };

  const statusCounts = useMemo(() => {
    return QUOTATION_STATUSES.reduce((acc, status) => {
      acc[status.value] = quotations.filter((q) => q.status === status.value).length;
      return acc;
    }, {} as Record<string, number>);
  }, [quotations]);

  const statusSummaryStyles: Record<string, string> = {
    DRAFT: 'border-amber-200 bg-amber-50',
    GENERATED: 'border-emerald-200 bg-emerald-50',
    SENT: 'border-blue-200 bg-blue-50',
    ACCEPTED: 'border-[#F4B72B]/30 bg-[#FFF8E6]',
    REJECTED: 'border-red-200 bg-red-50',
    EXPIRED: 'border-slate-200 bg-slate-50',
  };

  const statusDotStyles: Record<string, string> = {
    DRAFT: 'bg-amber-500',
    GENERATED: 'bg-emerald-500',
    SENT: 'bg-blue-500',
    ACCEPTED: 'bg-[#F4B72B]',
    REJECTED: 'bg-red-500',
    EXPIRED: 'bg-slate-400',
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {QUOTATION_STATUSES.map((status) => (
          <div key={status.value} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${statusSummaryStyles[status.value] ?? 'border-slate-200 bg-slate-50'}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${statusDotStyles[status.value] ?? 'bg-slate-400'}`} />
            <span className="text-xs font-medium text-slate-700">{status.label}</span>
            <span className="text-xs text-slate-500">{statusCounts[status.value] ?? 0}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by quotation no, customer, project, mobile…"
            className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2857]/30 focus:border-[#0B2857]"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white">
          <option value="All">All Status</option>
          {QUOTATION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white">
          <option value="All">All Types</option>
          {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white">
          <option value="updated">Recently Updated</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="amount-high">Amount: High to Low</option>
          <option value="amount-low">Amount: Low to High</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          {quotations.length === 0 ? (
            <>
              <p className="text-slate-600 font-medium">No quotations yet</p>
              <p className="text-sm text-slate-400 mb-4">Create your first quotation to start tracking customer work and project value.</p>
              {showCreate && (
                <button
                  onClick={() => navigate('/quotations/new')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#0B2857] hover:bg-[#071C3F] rounded-lg"
                >
                  <Plus className="w-4 h-4" /> Create Quotation
                </button>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400">No quotations match your filters. Try a broader search or change the status/type view.</p>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto bg-white border border-slate-200 rounded-xl">
            <table className="w-full text-sm min-w-[760px]">
              <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Quotation No</th>
                  <th className="px-4 py-3 text-left font-medium">Customer</th>
                  <th className="px-4 py-3 text-left font-medium">Project</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Updated</th>
                  <th className="px-4 py-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr key={q.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-[#0B2857]">{q.quotationNumber}</td>
                    <td className="px-4 py-3 text-slate-700">{q.customer.name || '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{q.project.name || '-'}</td>
                    <td className="px-4 py-3 text-slate-500">{q.project.projectType}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{formatINR(q.grandTotal)}</td>
                    <td className="px-4 py-3">
                      <div className="relative inline-block">
                        <button className="focus:outline-none" title="Click to change status">
                          <StatusBadge status={q.status} />
                        </button>
                        <select
                          value={q.status}
                          onChange={(e) => handleStatusChange(q, e.target.value as QuotationStatus)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          aria-label="Change status"
                        >
                          {QUOTATION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(q.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => navigate(`/quotations/${q.id}/edit`)} className="p-1.5 text-slate-500 hover:text-[#0B2857] hover:bg-slate-100 rounded" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setPreviewQuotation(q)} className="p-1.5 text-slate-500 hover:text-[#0B2857] hover:bg-slate-100 rounded" aria-label="Preview PDF"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleDownload(q)} className="p-1.5 text-slate-500 hover:text-[#0B2857] hover:bg-slate-100 rounded" aria-label="Download PDF"><FileDown className="w-4 h-4" /></button>
                        <button onClick={() => handleDuplicate(q)} className="p-1.5 text-slate-500 hover:text-[#0B2857] hover:bg-slate-100 rounded" aria-label="Duplicate"><Copy className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(q.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((q) => (
              <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-medium text-[#0B2857] truncate">{q.quotationNumber}</p>
                    <p className="text-sm text-slate-700 truncate">{q.customer.name || '-'}</p>
                  </div>
                  <div className="relative inline-block shrink-0">
                    <button className="focus:outline-none" title="Tap to change status">
                      <StatusBadge status={q.status} />
                    </button>
                    <select
                      value={q.status}
                      onChange={(e) => handleStatusChange(q, e.target.value as QuotationStatus)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      aria-label="Change status"
                    >
                      {QUOTATION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-500 truncate">{q.project.name || '-'}</span>
                  <span className="text-slate-400 text-xs shrink-0 ml-2">{q.project.projectType}</span>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-slate-800">{formatINR(q.grandTotal)}</span>
                  <span className="text-xs text-slate-400">Updated {formatDate(q.updatedAt)}</span>
                </div>

                <div className="flex items-center gap-1 pt-2 border-t border-slate-100">
                  <button onClick={() => navigate(`/quotations/${q.id}/edit`)} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-[#0B2857] hover:bg-slate-100 rounded-lg" aria-label="Edit"><Pencil className="w-4 h-4" /> Edit</button>
                  <button onClick={() => setPreviewQuotation(q)} className="p-2 text-slate-500 hover:text-[#0B2857] hover:bg-slate-100 rounded-lg" aria-label="Preview PDF"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => handleDownload(q)} className="p-2 text-slate-500 hover:text-[#0B2857] hover:bg-slate-100 rounded-lg" aria-label="Download PDF"><FileDown className="w-4 h-4" /></button>
                  <button onClick={() => handleDuplicate(q)} className="p-2 text-slate-500 hover:text-[#0B2857] hover:bg-slate-100 rounded-lg" aria-label="Duplicate"><Copy className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteId(q.id)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Quotation?"
        message="This will remove the quotation from your active list and hide it from search and reports."
        danger
        confirmLabel="Delete"
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
