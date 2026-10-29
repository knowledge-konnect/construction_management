import ConfirmDialog from '@/components/ConfirmDialog';
import PdfPreviewModal from '@/components/quotation/PdfPreviewModal';
import StatusBadge from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { useToast } from '@/context/ToastContext';
<<<<<<< HEAD
import { QUOTATION_STATUSES } from '@/lib/constants';
=======
import { PROJECT_TYPES, QUOTATION_STATUSES } from '@/lib/constants';
>>>>>>> origin/main
import type { Quotation, QuotationStatus } from '@/lib/models';
import { downloadQuotationPDF } from '@/lib/pdf';
import { formatDate, formatINR } from '@/lib/utils';
import { deleteDocument, nextSequence, saveDocument } from '@/services/document.service';
<<<<<<< HEAD
import { createProjectFromQuotation } from '@/services/project.service';
=======
>>>>>>> origin/main
import {
  Copy,
  Eye,
  FileDown,
  FileText,
<<<<<<< HEAD
  FolderKanban,
  MessageCircle,
=======
>>>>>>> origin/main
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
<<<<<<< HEAD
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
=======
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
>>>>>>> origin/main
import { v4 as uuid } from 'uuid';

interface Props {
  quotations: Quotation[];
  onRefresh: () => void;
  showCreate?: boolean;
}

export default function QuotationTable({ quotations, onRefresh, showCreate = true }: Props) {
  const navigate = useNavigate();
<<<<<<< HEAD
  const [searchParams, setSearchParams] = useSearchParams();
=======
>>>>>>> origin/main
  const { push } = useToast();
  const { company } = useCompany();
  const { user } = useAuth();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);
<<<<<<< HEAD
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
=======
  const [search, setSearch] = useState('');
>>>>>>> origin/main
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('updated');

<<<<<<< HEAD
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

=======
>>>>>>> origin/main
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

<<<<<<< HEAD
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

=======
>>>>>>> origin/main
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

<<<<<<< HEAD
  const handleCreateProject = async (q: Quotation) => {
    if (!company || !user) return;
    if (q.status !== 'ACCEPTED') {
      push('error', 'Only accepted quotations can be converted into projects.');
      return;
    }

    const project = await createProjectFromQuotation(q.id);
    if (!project) {
      push('error', 'Project could not be created from this quotation.');
      return;
    }

    push('success', `Project ${project.projectNumber} created.`);
    navigate(`/projects/${project.id}`);
  };

=======
>>>>>>> origin/main
  const statusCounts = useMemo(() => {
    return QUOTATION_STATUSES.reduce((acc, status) => {
      acc[status.value] = quotations.filter((q) => q.status === status.value).length;
      return acc;
    }, {} as Record<string, number>);
  }, [quotations]);

<<<<<<< HEAD
  const projectTypeOptions = useMemo(() => {
    const values = Array.from(new Set(quotations.map((q) => q.project.projectType).filter(Boolean)));
    return values.sort((a, b) => a.localeCompare(b));
  }, [quotations]);

=======
>>>>>>> origin/main
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

<<<<<<< HEAD
      <div className="rounded-2xl border border-[#E6E8EC] bg-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative block flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search quotation, customer, project, or mobile…"
              className="w-full rounded-xl border border-[#D0D5DD] bg-white py-2.5 pl-9 pr-3 text-sm text-[#17243A] placeholder-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/25"
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-[#D0D5DD] bg-white px-3 py-2.5 text-sm text-[#17243A] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/25">
              <option value="All">All Status</option>
              {QUOTATION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-xl border border-[#D0D5DD] bg-white px-3 py-2.5 text-sm text-[#17243A] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/25">
              <option value="All">All Types</option>
              {projectTypeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-xl border border-[#D0D5DD] bg-white px-3 py-2.5 text-sm text-[#17243A] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/25">
              <option value="updated">Recently Updated</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="amount-high">Amount: High to Low</option>
              <option value="amount-low">Amount: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D8DEE8] bg-slate-50/80 p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
            <FileText className="h-5 w-5" />
          </div>
=======
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
>>>>>>> origin/main
          {quotations.length === 0 ? (
            <>
              <p className="text-slate-600 font-medium">No quotations yet</p>
              <p className="text-sm text-slate-400 mb-4">Create your first quotation to start tracking customer work and project value.</p>
              {showCreate && (
                <button
                  onClick={() => navigate('/quotations/new')}
<<<<<<< HEAD
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg"
=======
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#0B2857] hover:bg-[#071C3F] rounded-lg"
>>>>>>> origin/main
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
<<<<<<< HEAD
          <div className="hidden overflow-x-auto rounded-2xl border border-[#E6E8EC] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.03)] md:block">
            <table className="min-w-[780px] divide-y divide-[#E6E8EC] text-left text-sm">
              <thead className="bg-[#1D4ED8] text-[11px] uppercase tracking-[0.12em] text-white">
                <tr>
                  <th className="px-4 py-3.5 font-semibold text-left text-white">Quotation No</th>
                  <th className="px-4 py-3.5 font-semibold text-left text-white">Customer</th>
                  <th className="px-4 py-3.5 font-semibold text-left text-white">Project</th>
                  <th className="px-4 py-3.5 font-semibold text-left text-white">Type</th>
                  <th className="px-4 py-3.5 font-semibold text-right text-white">Amount</th>
                  <th className="px-4 py-3.5 font-semibold text-left text-white">Status</th>
                  <th className="px-4 py-3.5 font-semibold text-left text-white">Updated</th>
                  <th className="px-4 py-3.5 font-semibold text-center text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E8EC] bg-white">
                {filtered.map((q) => (
                  <tr key={q.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-3.5 font-medium text-[#1D4ED8]">{q.quotationNumber}</td>
                    <td className="px-4 py-3.5 text-[#344054]">{q.customer.name || '-'}</td>
                    <td className="px-4 py-3.5 text-[#344054]">{q.project.name || '-'}</td>
                    <td className="px-4 py-3.5 text-[#667085]">{q.project.projectType}</td>
                    <td className="px-4 py-3.5 text-right font-semibold text-[#17243A]">{formatINR(q.grandTotal)}</td>
                    <td className="px-4 py-3.5">
=======
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
>>>>>>> origin/main
                      <div className="relative inline-block">
                        <button className="focus:outline-none" title="Click to change status">
                          <StatusBadge status={q.status} />
                        </button>
                        <select
                          value={q.status}
                          onChange={(e) => handleStatusChange(q, e.target.value as QuotationStatus)}
<<<<<<< HEAD
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
=======
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
>>>>>>> origin/main
                          aria-label="Change status"
                        >
                          {QUOTATION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                    </td>
<<<<<<< HEAD
                    <td className="px-4 py-3.5 text-xs text-[#667085]">{formatDate(q.updatedAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => navigate(`/quotations/${q.id}/edit`)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#1D4ED8]" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setPreviewQuotation(q)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#1D4ED8]" aria-label="Preview PDF"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => handleDownload(q)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#1D4ED8]" aria-label="Download PDF"><FileDown className="h-4 w-4" /></button>
                        <button onClick={() => handleWhatsAppShare(q)} className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-600 transition-colors hover:bg-emerald-100" aria-label="Share on WhatsApp"><MessageCircle className="h-4 w-4" /></button>
                        <button onClick={() => handleDuplicate(q)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#1D4ED8]" aria-label="Duplicate"><Copy className="h-4 w-4" /></button>
                        {q.status === 'ACCEPTED' && (
                          <button onClick={() => void handleCreateProject(q)} className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-600 transition-colors hover:bg-emerald-100" aria-label="Create project from quotation"><FolderKanban className="h-4 w-4" /></button>
                        )}
                        <button onClick={() => setDeleteId(q.id)} className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-500 transition-colors hover:bg-red-100" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
=======
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(q.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => navigate(`/quotations/${q.id}/edit`)} className="p-1.5 text-slate-500 hover:text-[#0B2857] hover:bg-slate-100 rounded" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setPreviewQuotation(q)} className="p-1.5 text-slate-500 hover:text-[#0B2857] hover:bg-slate-100 rounded" aria-label="Preview PDF"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleDownload(q)} className="p-1.5 text-slate-500 hover:text-[#0B2857] hover:bg-slate-100 rounded" aria-label="Download PDF"><FileDown className="w-4 h-4" /></button>
                        <button onClick={() => handleDuplicate(q)} className="p-1.5 text-slate-500 hover:text-[#0B2857] hover:bg-slate-100 rounded" aria-label="Duplicate"><Copy className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(q.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
>>>>>>> origin/main
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

<<<<<<< HEAD
          <div className="md:hidden space-y-3">
            {filtered.map((q) => (
              <div key={q.id} className="rounded-2xl border border-[#E6E8EC] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.03)]">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#1D4ED8]">{q.quotationNumber}</p>
                    <p className="mt-1 truncate text-sm text-[#344054]">{q.customer.name || '-'}</p>
=======
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((q) => (
              <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-medium text-[#0B2857] truncate">{q.quotationNumber}</p>
                    <p className="text-sm text-slate-700 truncate">{q.customer.name || '-'}</p>
>>>>>>> origin/main
                  </div>
                  <div className="relative inline-block shrink-0">
                    <button className="focus:outline-none" title="Tap to change status">
                      <StatusBadge status={q.status} />
                    </button>
                    <select
                      value={q.status}
                      onChange={(e) => handleStatusChange(q, e.target.value as QuotationStatus)}
<<<<<<< HEAD
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
=======
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
>>>>>>> origin/main
                      aria-label="Change status"
                    >
                      {QUOTATION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>

<<<<<<< HEAD
                <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-[#667085]">{q.project.name || '-'}</span>
                  <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.08em] text-[#667085]">{q.project.projectType}</span>
                </div>

                <div className="mb-3 flex items-center justify-between">
                  <span className="text-base font-semibold text-[#17243A]">{formatINR(q.grandTotal)}</span>
                  <span className="text-[11px] text-[#667085]">Updated {formatDate(q.updatedAt)}</span>
                </div>

                <div className="flex items-center gap-1 border-t border-[#E6E8EC] pt-3">
                  <button onClick={() => navigate(`/quotations/${q.id}/edit`)} className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-[#1D4ED8]" aria-label="Edit">Edit</button>
                  <button onClick={() => setPreviewQuotation(q)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500" aria-label="Preview PDF"><Eye className="h-4 w-4" /></button>
                  <button onClick={() => handleDownload(q)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500" aria-label="Download PDF"><FileDown className="h-4 w-4" /></button>
                  <button onClick={() => handleWhatsAppShare(q)} className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-600" aria-label="Share on WhatsApp"><MessageCircle className="h-4 w-4" /></button>
                  <button onClick={() => handleDuplicate(q)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500" aria-label="Duplicate"><Copy className="h-4 w-4" /></button>
                  {q.status === 'ACCEPTED' && (
                    <button onClick={() => void handleCreateProject(q)} className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-600" aria-label="Create project"><FolderKanban className="h-4 w-4" /></button>
                  )}
                  <button onClick={() => setDeleteId(q.id)} className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-500" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
=======
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
>>>>>>> origin/main
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
