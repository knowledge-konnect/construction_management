<<<<<<< HEAD
import { AppButton, PageHeader, PremiumCard } from '@/components/ui/DesignSystem';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { useToast } from '@/context/ToastContext';
import { createEmptyQuotation } from '@/lib/defaults';
import type { Quotation } from '@/lib/models';
import { templateRepo } from '@/lib/storage';
import { calcValidUntil } from '@/lib/utils';
import { nextSequence, saveDocument } from '@/services/document.service';
import { ArrowRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
=======
import { useNavigate } from 'react-router-dom';
import { templateRepo } from '@/lib/storage';
import { useCompany } from '@/context/CompanyContext';
import { useAuth } from '@/context/AuthContext';
import { saveDocument, nextSequence } from '@/services/document.service';
import { useToast } from '@/context/ToastContext';
import { v4 as uuid } from 'uuid';
import type { Quotation } from '@/lib/models';
import { createEmptyQuotation } from '@/lib/defaults';
import { calcValidUntil } from '@/lib/utils';
import { FileText, ArrowRight } from 'lucide-react';
>>>>>>> origin/main

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { company } = useCompany();
  const { user } = useAuth();
  const templates = templateRepo.list();

  const createFromTemplate = async (templateId: string) => {
    if (!company || !user) return;
    const t = templateRepo.get(templateId);
    if (!t) return;
    const settings = company.settings;
    const seq = await nextSequence(company.companyId);
    const year = new Date().getFullYear();
    const q: Quotation = {
      ...createEmptyQuotation(),
      id: uuid(),
      quotationNumber: `${settings.prefix}/${year}/${String(seq).padStart(3, '0')}`,
      validity: settings.defaultValidity,
      validUntil: calcValidUntil(new Date().toISOString().slice(0, 10), settings.defaultValidity),
      project: { ...createEmptyQuotation().project, projectType: t.projectType },
      boqSections: t.boqSections.map((s) => ({ ...s, id: uuid(), items: s.items.map((i) => ({ ...i, id: uuid() })) })),
      specifications: t.specifications.map((s) => ({ ...s, id: uuid() })),
      inclusions: [...t.defaultInclusions],
      exclusions: [...t.defaultExclusions],
      terms: settings.defaultTerms.map((term) => ({ ...term, id: uuid() })),
    };
    await saveDocument(q, company.companyId, user.id);
    push('success', 'Quotation created from template.');
    navigate(`/quotations/${q.id}/edit`);
  };

  return (
<<<<<<< HEAD
    <div className="space-y-6">
      <PageHeader
        title="BOQ Templates"
        description="Start a new quotation from a pre-built structure and reuse consistent specification libraries."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((t) => (
          <PremiumCard key={t.id} className="flex flex-col p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#EAF1FF] text-[#1D4ED8]">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-[#17243A]">{t.name}</h3>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-[#667085]">{t.projectType}</p>
            <p className="mt-2 flex-1 text-sm leading-6 text-[#475467]">{t.description}</p>
            <div className="mt-4 text-xs text-[#667085]">{t.boqSections.length} sections · {t.boqSections.reduce((s, sec) => s + sec.items.length, 0)} items · {t.specifications.length} specs</div>
            <AppButton onClick={() => createFromTemplate(t.id)} className="mt-4 w-full justify-center">
              Use Template <ArrowRight className="h-4 w-4" />
            </AppButton>
          </PremiumCard>
=======
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B234A]">BOQ Templates</h1>
        <p className="text-sm text-slate-500">Start a new quotation from a pre-built structure.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t) => (
          <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
            <div className="w-10 h-10 rounded-lg bg-[#0B2857]/10 flex items-center justify-center mb-3"><FileText className="w-5 h-5 text-[#0B2857]" /></div>
            <h3 className="font-semibold text-[#0B234A]">{t.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-2">{t.projectType}</p>
            <p className="text-sm text-slate-600 mb-3 flex-1">{t.description}</p>
            <div className="text-xs text-slate-400 mb-4">{t.boqSections.length} sections · {t.boqSections.reduce((s, sec) => s + sec.items.length, 0)} items · {t.specifications.length} specs</div>
            <button onClick={() => createFromTemplate(t.id)} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-[#0B2857] hover:bg-[#071C3F] rounded-lg w-full">
              Use Template <ArrowRight className="w-4 h-4" />
            </button>
          </div>
>>>>>>> origin/main
        ))}
      </div>
    </div>
  );
}
