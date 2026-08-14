import { useBuilder } from '@/context/BuilderContext';
import { useCompany } from '@/context/CompanyContext';
import { SectionCard, TextArea } from '@/components/ui/Form';
import { Plus, Trash2, ChevronUp, ChevronDown, Upload } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import type { Term, Quotation } from '@/lib/models';
import { useToast } from '@/context/ToastContext';

export default function TermsStep() {
  const { quotation, setQuotation } = useBuilder();
  const { company } = useCompany();
  const { push } = useToast();
  if (!quotation) return null;

  const addTerm = () => setQuotation((prev) => ({ ...prev, terms: [...prev.terms, { id: uuid(), text: '', displayOrder: prev.terms.length }] }));
  const updateTerm = (id: string, patch: Partial<Term>) => setQuotation((prev) => ({ ...prev, terms: prev.terms.map((t) => t.id === id ? { ...t, ...patch } : t) }));
  const deleteTerm = (id: string) => setQuotation((prev) => ({ ...prev, terms: prev.terms.filter((t) => t.id !== id) }));
  const moveTerm = (id: string, dir: -1 | 1) => setQuotation((prev) => {
    const arr = [...prev.terms];
    const idx = arr.findIndex((t) => t.id === id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= arr.length) return prev;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    return { ...prev, terms: arr };
  });

  const loadDefaults = () => {
    const defaultTerms = company?.settings.defaultTerms ?? [];
    setQuotation((prev) => ({ ...prev, terms: defaultTerms.map((t) => ({ ...t, id: uuid() })) }));
    push('success', 'Default terms loaded.');
  };

  const update = (patch: Partial<Quotation>) => setQuotation((prev) => ({ ...prev, ...patch }));

  return (
    <div className="space-y-6">
      <SectionCard title="Terms & Conditions" description="Editable quotation terms."
        actions={<button onClick={loadDefaults} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#0B2857] border border-[#0B2857] hover:bg-[#0B2857]/5 rounded-lg"><Upload className="w-4 h-4" /> Load Defaults</button>}>
        <div className="flex justify-end mb-3">
          <button onClick={addTerm} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#0B2857] hover:bg-[#071C3F] rounded-lg"><Plus className="w-4 h-4" /> Add Term</button>
        </div>
        {quotation.terms.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-lg">No terms added yet. Load defaults or add your own.</div>
        ) : (
          <div className="space-y-3">
            {quotation.terms.map((term, idx) => (
              <div key={term.id} className="flex items-start gap-2 border border-slate-200 rounded-lg p-3">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveTerm(term.id, -1)} disabled={idx === 0} className="p-0.5 text-slate-400 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                  <button onClick={() => moveTerm(term.id, 1)} disabled={idx === quotation.terms.length - 1} className="p-0.5 text-slate-400 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                </div>
                <span className="text-sm font-bold text-slate-400 mt-1">{idx + 1}.</span>
                <TextArea rows={2} value={term.text} onChange={(e) => updateTerm(term.id, { text: e.target.value })} placeholder="Enter the term text…" className="flex-1" />
                <button onClick={() => deleteTerm(term.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Customer Notes" description="These notes will appear on the PDF.">
        <TextArea rows={3} value={quotation.customerNotes} onChange={(e) => update({ customerNotes: e.target.value })} placeholder="Notes visible to the customer on the quotation PDF…" />
      </SectionCard>

      <SectionCard title="Internal Notes" description="Private notes — never included in the PDF.">
        <TextArea rows={3} value={quotation.internalNotes} onChange={(e) => update({ internalNotes: e.target.value })} placeholder="Internal notes for your reference only…" />
      </SectionCard>
    </div>
  );
}
