<<<<<<< HEAD
import ConfirmDialog from '@/components/ConfirmDialog';
import { AppButton, PageHeader, PremiumCard } from '@/components/ui/DesignSystem';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { useToast } from '@/context/ToastContext';
import type { QuestionnaireRecord } from '@/lib/models';
import { questionnaireRepo } from '@/lib/storage';
import { formatDate } from '@/lib/utils';
import { ClipboardList, FileEdit, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
=======
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionnaireRepo } from '@/lib/storage';
import { formatDate } from '@/lib/utils';
import { Plus, ClipboardList, FileEdit, Trash2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { QuestionnaireRecord } from '@/lib/models';
>>>>>>> origin/main

export default function QuestionnairesPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { user } = useAuth();
  const { company } = useCompany();
  const [records, setRecords] = useState<QuestionnaireRecord[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const scope = user && company ? { userId: user.id, companyId: company.companyId } : null;

  const refresh = () => {
    if (!scope) return;
    setRecords(questionnaireRepo.list(scope).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  };

  useEffect(() => { refresh(); }, [scope?.userId, scope?.companyId]);

  const handleDelete = () => {
    if (!deleteId || !scope) return;
    questionnaireRepo.delete(scope, deleteId);
    setDeleteId(null);
    refresh();
    push('success', 'Requirements sheet deleted.');
  };

  return (
<<<<<<< HEAD
    <div className="space-y-6">
      <PageHeader
        title="Flat Sale Requirements"
        description="Capture client material and finish preferences before sending a quotation."
        actions={
          <AppButton onClick={() => navigate('/questionnaire/new')}>
            <Plus className="h-4 w-4" />
            New Requirements
          </AppButton>
        }
      />

      {records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D8DEE8] bg-slate-50/80 p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#1D4ED8]/10">
            <ClipboardList className="h-8 w-8 text-[#1D4ED8]" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-[#17243A]">No requirements sheets yet</h3>
          <p className="mb-4 text-sm text-[#667085]">Create one to capture client preferences for materials and finishes.</p>
          <AppButton onClick={() => navigate('/questionnaire/new')}>
            <Plus className="h-4 w-4" />
            New Requirements
          </AppButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {records.map((rec) => (
            <PremiumCard key={rec.id} className="flex flex-col p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#1D4ED8]/10 text-[#1D4ED8]">
                <ClipboardList className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-[#17243A]">{rec.title || 'Untitled Requirements'}</h3>
              <p className="mt-0.5 text-xs text-[#667085]">
                {rec.customerName || '—'}{rec.projectName ? ` · ${rec.projectName}` : ''}
              </p>
              <p className="mt-2 text-xs text-[#98A2B3]">Updated {formatDate(rec.updatedAt.slice(0, 10))}</p>
              <div className="mt-4 flex items-center gap-2 pt-3">
                <AppButton variant="secondary" onClick={() => navigate(`/questionnaire/${rec.id}/edit`)} className="flex-1 justify-center">
                  <FileEdit className="h-4 w-4" />
                  Edit
                </AppButton>
                <AppButton variant="danger" onClick={() => setDeleteId(rec.id)} className="!px-2.5 !py-2.5" aria-label="Delete requirements sheet">
                  <Trash2 className="h-4 w-4" />
                </AppButton>
              </div>
            </PremiumCard>
=======
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B234A]">Flat Sale Requirements</h1>
          <p className="text-sm text-slate-500">Capture client material and finish preferences before sending a quotation.</p>
        </div>
        <button
          onClick={() => navigate('/questionnaire/new')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#0B2857] hover:bg-[#071C3F] rounded-lg"
        >
          <Plus className="w-4 h-4" /> New Requirements
        </button>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-[#0B2857]/10 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-[#0B2857]" />
          </div>
          <h3 className="text-lg font-semibold text-[#0B234A] mb-1">No requirements sheets yet</h3>
          <p className="text-sm text-slate-500 mb-4">Create one to capture client preferences for materials and finishes.</p>
          <button
            onClick={() => navigate('/questionnaire/new')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#0B2857] hover:bg-[#071C3F] rounded-lg"
          >
            <Plus className="w-4 h-4" /> New Requirements
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((rec) => (
            <div key={rec.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-[#0B2857]/10 flex items-center justify-center mb-3">
                <ClipboardList className="w-5 h-5 text-[#0B2857]" />
              </div>
              <h3 className="font-semibold text-[#0B234A]">{rec.title || 'Untitled Requirements'}</h3>
              <p className="text-xs text-slate-500 mt-0.5 mb-2">
                {rec.customerName || '—'}{rec.projectName ? ` · ${rec.projectName}` : ''}
              </p>
              <p className="text-xs text-slate-400 mb-4">Updated {formatDate(rec.updatedAt.slice(0, 10))}</p>
              <div className="flex items-center gap-2 mt-auto">
                <button
                  onClick={() => navigate(`/questionnaire/${rec.id}/edit`)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-[#0B2857] hover:bg-[#071C3F] rounded-lg flex-1 justify-center"
                >
                  <FileEdit className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => setDeleteId(rec.id)}
                  className="p-2 text-red-500 border border-red-200 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
>>>>>>> origin/main
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Requirements?"
        message="This will permanently delete this requirements sheet. This cannot be undone."
        danger
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
