import { useBuilder } from '@/context/BuilderContext';
import { SectionCard, TextArea, TextInput } from '@/components/ui/Form';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import type { Specification } from '@/lib/models';
import { INCLUSION_SUGGESTIONS, EXCLUSION_SUGGESTIONS } from '@/lib/constants';

export default function SpecificationsStep() {
  const { quotation, setQuotation } = useBuilder();
  if (!quotation) return null;

  const addSpec = () => setQuotation((prev) => ({ ...prev, specifications: [...prev.specifications, { id: uuid(), title: '', description: '', displayOrder: prev.specifications.length }] }));
  const updateSpec = (id: string, patch: Partial<Specification>) => setQuotation((prev) => ({ ...prev, specifications: prev.specifications.map((s) => s.id === id ? { ...s, ...patch } : s) }));
  const deleteSpec = (id: string) => setQuotation((prev) => ({ ...prev, specifications: prev.specifications.filter((s) => s.id !== id) }));
  const moveSpec = (id: string, dir: -1 | 1) => setQuotation((prev) => {
    const arr = [...prev.specifications];
    const idx = arr.findIndex((s) => s.id === id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= arr.length) return prev;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    return { ...prev, specifications: arr };
  });

  const toggleInclusion = (text: string) => setQuotation((prev) => ({
    ...prev,
    inclusions: prev.inclusions.includes(text) ? prev.inclusions.filter((t) => t !== text) : [...prev.inclusions, text],
  }));
  const toggleExclusion = (text: string) => setQuotation((prev) => ({
    ...prev,
    exclusions: prev.exclusions.includes(text) ? prev.exclusions.filter((t) => t !== text) : [...prev.exclusions, text],
  }));

  return (
    <div className="space-y-6">
      <SectionCard title="Material & Work Specifications" description="Describe the quality and materials included."
        actions={<button onClick={addSpec} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#0B2857] hover:bg-[#071C3F] rounded-lg"><Plus className="w-4 h-4" /> Add</button>}>
        {quotation.specifications.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-lg">No specifications added yet.</div>
        ) : (
          <div className="space-y-3">
            {quotation.specifications.map((spec, idx) => (
              <div key={spec.id} className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveSpec(spec.id, -1)} disabled={idx === 0} className="p-0.5 text-slate-400 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => moveSpec(spec.id, 1)} disabled={idx === quotation.specifications.length - 1} className="p-0.5 text-slate-400 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                  </div>
                  <TextInput value={spec.title} onChange={(e) => updateSpec(spec.id, { title: e.target.value })} placeholder="Title (e.g. Structural System)" className="flex-1" />
                  <button onClick={() => deleteSpec(spec.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
                <TextArea rows={2} value={spec.description} onChange={(e) => updateSpec(spec.id, { description: e.target.value })} placeholder="Description (e.g. RCC framed structure as per approved drawings.)" />
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Inclusions" description="Select what is included in this quotation.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {INCLUSION_SUGGESTIONS.map((s) => (
            <label key={s} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input type="checkbox" checked={quotation.inclusions.includes(s)} onChange={() => toggleInclusion(s)} className="w-4 h-4 rounded border-slate-300 text-[#0B2857] focus:ring-[#0B2857]" />
              <span className="text-sm text-slate-700">{s}</span>
            </label>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Exclusions" description="Select what is excluded from this quotation.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {EXCLUSION_SUGGESTIONS.map((s) => (
            <label key={s} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input type="checkbox" checked={quotation.exclusions.includes(s)} onChange={() => toggleExclusion(s)} className="w-4 h-4 rounded border-slate-300 text-[#0B2857] focus:ring-[#0B2857]" />
              <span className="text-sm text-slate-700">{s}</span>
            </label>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
