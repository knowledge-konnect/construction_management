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
                {rec.customerName || 'â€”'}{rec.projectName ? ` Â· ${rec.projectName}` : ''}
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

