import BOQStep from '@/components/quotation/BOQStep';
import CommercialStep from '@/components/quotation/CommercialStep';
import PaymentStep from '@/components/quotation/PaymentStep';
import PdfPreviewModal from '@/components/quotation/PdfPreviewModal';
import PreviewStep from '@/components/quotation/PreviewStep';
import ProjectStep from '@/components/quotation/ProjectStep';
import QuestionnaireStep from '@/components/quotation/QuestionnaireStep';
import SpecificationsStep from '@/components/quotation/SpecificationsStep';
import StepNav, { type StepDef } from '@/components/quotation/StepNav';
import TermsStep from '@/components/quotation/TermsStep';
import { useAuth } from '@/context/AuthContext';
import { BuilderProvider, useBuilder } from '@/context/BuilderContext';
import { useCompany } from '@/context/CompanyContext';
import { useToast } from '@/context/ToastContext';
import type { Quotation } from '@/lib/models';
import { downloadQuotationPDF } from '@/lib/pdf';
import { formatTime } from '@/lib/utils';
import { saveDocument } from '@/services/document.service';
import { ArrowLeft, ArrowRight, Eye, FileDown, Loader2, Save } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const steps: StepDef[] = [
  { key: 'project', label: 'Project' },
  { key: 'questionnaire', label: 'Requirements' },
  { key: 'boq', label: 'BOQ' },
  { key: 'specs', label: 'Specifications' },
  { key: 'commercial', label: 'Commercial' },
  { key: 'payment', label: 'Payment' },
  { key: 'terms', label: 'Terms' },
  { key: 'preview', label: 'Preview' },
];

function BuilderInner() {
  const [current, setCurrent] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();
  const { push } = useToast();
  const { company } = useCompany();
  const { user } = useAuth();
  const { quotation, saveStatus, lastSaved, saveNow, isExisting } = useBuilder();

  if (!quotation) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  const handleSaveDraft = () => { saveNow(); push('success', 'Draft saved.'); };

  const handlePreviewPDF = () => {
    saveNow();
    setShowPreview(true);
  };

  const handleGeneratePDF = async () => {
    if (!quotation || !company || !user) return;
    saveNow();
    const settings = company.settings;
    try {
      const updated: Quotation = { ...quotation, status: 'GENERATED', generatedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await saveDocument(updated, company.companyId, user.id);
      downloadQuotationPDF(updated, settings);
      push('success', 'PDF generated and quotation marked as generated.');
      navigate('/quotations');
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Could not generate PDF.');
    }
  };

  const renderStep = () => {
    switch (steps[current].key) {
      case 'project': return <ProjectStep />;
      case 'questionnaire': return <QuestionnaireStep />;
      case 'boq': return <BOQStep />;
      case 'specs': return <SpecificationsStep />;
      case 'commercial': return <CommercialStep />;
      case 'payment': return <PaymentStep />;
      case 'terms': return <TermsStep />;
      case 'preview': return <PreviewStep />;
      default: return null;
    }
  };

  return (
    <div>
      <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#0B234A]">Keep the quotation flow moving</p>
            <p className="mt-1 text-sm text-slate-500">Save your draft at any time. Generate the PDF once the project details and commercial values are ready.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-[#0B2857]">
              {quotation.status === 'DRAFT' ? 'Draft' : 'In progress'}
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Needs attention' : 'Ready to save'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#0B234A]">{isExisting ? 'Edit Quotation' : 'New Quotation'}</h1>
          <p className="text-sm text-slate-500">
            {quotation.quotationNumber}
            {lastSaved && (
              <span className="ml-3">
                {saveStatus === 'saving' ? <span className="text-amber-600">Saving…</span>
                  : saveStatus === 'saved' ? <span className="text-emerald-600">Saved</span>
                    : saveStatus === 'error' ? <span className="text-red-600">Save error</span>
                      : <span>Saved at {formatTime(lastSaved)}</span>}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Back to List</button>
          <button onClick={handleSaveDraft} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#0B2857] border border-[#0B2857]/30 bg-white hover:bg-[#0B2857]/5 rounded-lg"><Save className="w-4 h-4" /> Save Draft</button>
          {current === steps.length - 1 && (
            <>
              <button onClick={handlePreviewPDF} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg"><Eye className="w-4 h-4" /> Preview</button>
              <button onClick={handleGeneratePDF} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#071C3F] bg-[#F4B72B] hover:bg-[#e0a822] rounded-lg shadow-sm"><FileDown className="w-4 h-4" /> Generate PDF</button>
            </>
          )}
        </div>
      </div>

      <StepNav steps={steps} current={current} onStepClick={setCurrent}>{renderStep()}</StepNav>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
        <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-40"><ArrowLeft className="w-4 h-4" /> Previous</button>
        {current < steps.length - 1 ? (
          <button onClick={() => setCurrent((c) => Math.min(steps.length - 1, c + 1))} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#0B2857] hover:bg-[#071C3F] rounded-lg">Next <ArrowRight className="w-4 h-4" /></button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={handlePreviewPDF} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg"><Eye className="w-4 h-4" /> Preview</button>
            <button onClick={handleGeneratePDF} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#071C3F] bg-[#F4B72B] hover:bg-[#e0a822] rounded-lg shadow-sm"><FileDown className="w-4 h-4" /> Generate PDF</button>
          </div>
        )}
      </div>

      {showPreview && company && (
        <PdfPreviewModal
          quotation={quotation}
          settings={company.settings}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

export default function QuotationBuilder() {
  return <BuilderProvider><BuilderInner /></BuilderProvider>;
}
