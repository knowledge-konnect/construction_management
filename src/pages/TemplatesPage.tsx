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
            <div className="mt-4 text-xs text-[#667085]">{t.boqSections.length} sections Â· {t.boqSections.reduce((s, sec) => s + sec.items.length, 0)} items Â· {t.specifications.length} specs</div>
            <AppButton onClick={() => createFromTemplate(t.id)} className="mt-4 w-full justify-center">
              Use Template <ArrowRight className="h-4 w-4" />
            </AppButton>
          </PremiumCard>
        ))}
      </div>
    </div>
  );
}

