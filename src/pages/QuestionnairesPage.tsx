import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionnaireRepo } from '@/lib/storage';
import { formatDate } from '@/lib/utils';
import { Plus, ClipboardList, FileEdit, Trash2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { QuestionnaireRecord } from '@/lib/models';

export default function QuestionnairesPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [records, setRecords] = useState<QuestionnaireRecord[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const refresh = () => setRecords(questionnaireRepo.list().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));

  useEffect(() => { refresh(); }, []);

  const handleDelete = () => {
    if (!deleteId) return;
    questionnaireRepo.delete(deleteId);
    setDeleteId(null);
    refresh();
    push('success', 'Requirements sheet deleted.');
  };

  return (
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
