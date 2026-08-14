import { useBuilder } from '@/context/BuilderContext';
import { SectionCard } from '@/components/ui/Form';
import { Plus, Copy, Trash2, ChevronUp, ChevronDown, FileText } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import type { BOQSection, BOQItem } from '@/lib/models';
import { BOQ_UNITS, DEFAULT_BOQ_SECTIONS } from '@/lib/constants';
import { calcItemAmount, calcSectionSubtotal, calcBOQSubtotal, formatINR, formatNumber } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useState, useRef, useCallback } from 'react';

export default function BOQStep() {
  const { quotation, setQuotation } = useBuilder();
  const { push } = useToast();
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const focusItem = useCallback((id: string) => {
    setTimeout(() => {
      const el = inputRefs.current[id];
      if (el) { el.focus(); el.select(); }
    }, 50);
  }, []);

  if (!quotation) return null;
  const sections = quotation.boqSections;

  const addSection = (title?: string) => {
    const newId = uuid();
    setQuotation((prev) => ({
      ...prev,
      boqSections: [...prev.boqSections, { id: newId, title: title || 'New Section', displayOrder: prev.boqSections.length, items: [] }],
    }));
  };

  const updateSection = (id: string, patch: Partial<BOQSection>) => {
    setQuotation((prev) => ({ ...prev, boqSections: prev.boqSections.map((s) => s.id === id ? { ...s, ...patch } : s) }));
  };

  const deleteSection = (id: string) => {
    setQuotation((prev) => ({ ...prev, boqSections: prev.boqSections.filter((s) => s.id !== id) }));
    setDeleteSectionId(null);
    push('success', 'Section deleted.');
  };

  const duplicateSection = (id: string) => {
    setQuotation((prev) => {
      const sec = prev.boqSections.find((s) => s.id === id);
      if (!sec) return prev;
      const copy: BOQSection = { ...sec, id: uuid(), title: `${sec.title} (Copy)`, items: sec.items.map((i) => ({ ...i, id: uuid() })) };
      const idx = prev.boqSections.findIndex((s) => s.id === id);
      const newSections = [...prev.boqSections];
      newSections.splice(idx + 1, 0, copy);
      return { ...prev, boqSections: newSections };
    });
  };

  const moveSection = (id: string, dir: -1 | 1) => {
    setQuotation((prev) => {
      const arr = [...prev.boqSections];
      const idx = arr.findIndex((s) => s.id === id);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return prev;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return { ...prev, boqSections: arr };
    });
  };

  const addItem = (sectionId: string, focusNew = false) => {
    const newId = uuid();
    setQuotation((prev) => ({
      ...prev,
      boqSections: prev.boqSections.map((s) => s.id === sectionId
        ? { ...s, items: [...s.items, { id: newId, description: '', quantity: 0, unit: 'Nos', rate: 0, amount: 0, displayOrder: s.items.length }] }
        : s),
    }));
    if (focusNew) focusItem(newId);
  };

  const updateItem = (sectionId: string, itemId: string, patch: Partial<BOQItem>) => {
    setQuotation((prev) => ({
      ...prev,
      boqSections: prev.boqSections.map((s) => s.id === sectionId
        ? { ...s, items: s.items.map((i) => {
            if (i.id !== itemId) return i;
            const updated = { ...i, ...patch };
            updated.amount = calcItemAmount(updated);
            return updated;
          }) }
        : s),
    }));
  };

  const deleteItem = (sectionId: string, itemId: string) => {
    setQuotation((prev) => ({
      ...prev,
      boqSections: prev.boqSections.map((s) => s.id === sectionId ? { ...s, items: s.items.filter((i) => i.id !== itemId) } : s),
    }));
  };

  const duplicateItem = (sectionId: string, itemId: string) => {
    setQuotation((prev) => ({
      ...prev,
      boqSections: prev.boqSections.map((s) => {
        if (s.id !== sectionId) return s;
        const item = s.items.find((i) => i.id === itemId);
        if (!item) return s;
        const copy = { ...item, id: uuid() };
        const idx = s.items.findIndex((i) => i.id === itemId);
        const items = [...s.items];
        items.splice(idx + 1, 0, copy);
        return { ...s, items };
      }),
    }));
  };

  const moveItem = (sectionId: string, itemId: string, dir: -1 | 1) => {
    setQuotation((prev) => ({
      ...prev,
      boqSections: prev.boqSections.map((s) => {
        if (s.id !== sectionId) return s;
        const arr = [...s.items];
        const idx = arr.findIndex((i) => i.id === itemId);
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= arr.length) return s;
        [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
        return { ...s, items: arr };
      }),
    }));
  };

  // Enter on rate input → add new item and focus it
  const handleItemKeyDown = (e: React.KeyboardEvent, sectionId: string, isLastInput: boolean) => {
    if (e.key === 'Enter' && isLastInput) {
      e.preventDefault();
      addItem(sectionId, true);
    }
  };

  return (
    <div className="space-y-4">
      <SectionCard
        title="Bill of Quantities"
        description="Add sections and items. Amount = Quantity × Rate. Press Enter on the rate field to add a new row."
        actions={<span className="text-sm font-semibold text-[#0B2857]">Subtotal: {formatINR(calcBOQSubtotal(sections))}</span>}
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button onClick={() => addSection()} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#0B2857] hover:bg-[#071C3F] rounded-lg">
            <Plus className="w-4 h-4" /> Add Section
          </button>
          <select onChange={(e) => { if (e.target.value) { addSection(e.target.value); e.target.value = ''; } }} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white" defaultValue="" aria-label="Add section from preset">
            <option value="">Add from preset…</option>
            {DEFAULT_BOQ_SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {sections.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-lg">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No sections yet</p>
            <p className="text-sm text-slate-400 mb-4">Add a section manually or pick from common presets above.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {DEFAULT_BOQ_SECTIONS.slice(0, 5).map((s) => (
                <button key={s} onClick={() => addSection(s)} className="px-3 py-1.5 text-xs font-medium text-[#0B2857] border border-[#0B2857] hover:bg-[#0B2857]/5 rounded-lg">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {sections.map((section, sIdx) => (
          <div key={section.id} className="mb-6 border border-slate-200 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
              <input
                value={section.title}
                onChange={(e) => updateSection(section.id, { title: e.target.value })}
                aria-label="Section title"
                className="flex-1 bg-transparent text-sm font-semibold text-[#0B2857] focus:outline-none focus:ring-1 focus:ring-[#0B2857]/30 rounded px-1"
              />
              <span className="text-sm text-slate-500 font-medium">{formatINR(calcSectionSubtotal(section))}</span>
              <div className="flex items-center gap-0.5">
                <button onClick={() => moveSection(section.id, -1)} disabled={sIdx === 0} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded disabled:opacity-30" aria-label="Move section up"><ChevronUp className="w-4 h-4" /></button>
                <button onClick={() => moveSection(section.id, 1)} disabled={sIdx === sections.length - 1} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded disabled:opacity-30" aria-label="Move section down"><ChevronDown className="w-4 h-4" /></button>
                <button onClick={() => duplicateSection(section.id)} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded" aria-label="Duplicate section"><Copy className="w-4 h-4" /></button>
                <button onClick={() => setDeleteSectionId(section.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded" aria-label="Delete section"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            {section.items.length > 0 && (
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#0B2857] text-white text-xs">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium w-8">#</th>
                      <th className="px-2 py-2 text-left font-medium">Description</th>
                      <th className="px-2 py-2 text-right font-medium w-20">Qty</th>
                      <th className="px-2 py-2 text-left font-medium w-24">Unit</th>
                      <th className="px-2 py-2 text-right font-medium w-24">Rate</th>
                      <th className="px-2 py-2 text-right font-medium w-28">Amount</th>
                      <th className="px-2 py-2 text-center font-medium w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.items.map((item, iIdx) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-2 py-1.5 text-slate-500">{iIdx + 1}</td>
                        <td className="px-2 py-1.5">
                          <input
                            ref={(el) => { inputRefs.current[item.id] = el; }}
                            value={item.description}
                            onChange={(e) => updateItem(section.id, item.id, { description: e.target.value })}
                            aria-label={`Description, row ${iIdx + 1}`}
                            className="w-full px-1.5 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0B2857]/30"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(section.id, item.id, { quantity: Number(e.target.value) })}
                            aria-label={`Quantity, row ${iIdx + 1}`}
                            className="w-full px-1.5 py-1 text-xs text-right border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0B2857]/30"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <select
                            value={item.unit}
                            onChange={(e) => updateItem(section.id, item.id, { unit: e.target.value })}
                            aria-label={`Unit, row ${iIdx + 1}`}
                            className="w-full px-1.5 py-1 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2857]/30"
                          >
                            {BOQ_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => updateItem(section.id, item.id, { rate: Number(e.target.value) })}
                            onKeyDown={(e) => handleItemKeyDown(e, section.id, true)}
                            aria-label={`Rate, row ${iIdx + 1}`}
                            className="w-full px-1.5 py-1 text-xs text-right border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0B2857]/30"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right font-medium text-[#0B2857]">{formatINR(calcItemAmount(item))}</td>
                        <td className="px-2 py-1.5">
                          <div className="flex items-center justify-center gap-0.5">
                            <button onClick={() => moveItem(section.id, item.id, -1)} disabled={iIdx === 0} tabIndex={-1} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30" aria-label={`Move row ${iIdx + 1} up`}><ChevronUp className="w-3.5 h-3.5" /></button>
                            <button onClick={() => moveItem(section.id, item.id, 1)} disabled={iIdx === section.items.length - 1} tabIndex={-1} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30" aria-label={`Move row ${iIdx + 1} down`}><ChevronDown className="w-3.5 h-3.5" /></button>
                            <button onClick={() => duplicateItem(section.id, item.id)} tabIndex={-1} className="p-1 text-slate-400 hover:text-slate-700" aria-label={`Duplicate row ${iIdx + 1}`}><Copy className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteItem(section.id, item.id)} tabIndex={-1} className="p-1 text-red-400 hover:text-red-600" aria-label={`Delete row ${iIdx + 1}`}><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50">
                      <td colSpan={5} className="px-2 py-2 text-right text-xs font-semibold text-slate-600">Section Subtotal:</td>
                      <td className="px-2 py-2 text-right text-sm font-bold text-[#0B2857]">{formatINR(calcSectionSubtotal(section))}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Mobile cards */}
            {section.items.length > 0 && (
              <div className="md:hidden divide-y divide-slate-100">
                {section.items.map((item, iIdx) => (
                  <div key={item.id} className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs text-slate-500">#{iIdx + 1}</span>
                      <div className="flex gap-1">
                        <button onClick={() => moveItem(section.id, item.id, -1)} disabled={iIdx === 0} className="p-1 text-slate-400 disabled:opacity-30" aria-label="Move up"><ChevronUp className="w-4 h-4" /></button>
                        <button onClick={() => moveItem(section.id, item.id, 1)} disabled={iIdx === section.items.length - 1} className="p-1 text-slate-400 disabled:opacity-30" aria-label="Move down"><ChevronDown className="w-4 h-4" /></button>
                        <button onClick={() => duplicateItem(section.id, item.id)} className="p-1 text-slate-400" aria-label="Duplicate"><Copy className="w-4 h-4" /></button>
                        <button onClick={() => deleteItem(section.id, item.id)} className="p-1 text-red-400" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <input
                      ref={(el) => { inputRefs.current[item.id] = el; }}
                      value={item.description}
                      onChange={(e) => updateItem(section.id, item.id, { description: e.target.value })}
                      placeholder="Description"
                      aria-label={`Description, row ${iIdx + 1}`}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded mb-2"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-slate-500">Qty</label>
                        <input type="number" value={item.quantity} onChange={(e) => updateItem(section.id, item.id, { quantity: Number(e.target.value) })} aria-label={`Quantity, row ${iIdx + 1}`} className="w-full px-2 py-1 text-sm border border-slate-200 rounded" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Unit</label>
                        <select value={item.unit} onChange={(e) => updateItem(section.id, item.id, { unit: e.target.value })} aria-label={`Unit, row ${iIdx + 1}`} className="w-full px-1 py-1 text-sm border border-slate-200 rounded bg-white">{BOQ_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Rate</label>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateItem(section.id, item.id, { rate: Number(e.target.value) })}
                          onKeyDown={(e) => handleItemKeyDown(e, section.id, true)}
                          aria-label={`Rate, row ${iIdx + 1}`}
                          className="w-full px-2 py-1 text-sm border border-slate-200 rounded"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-2"><span className="text-sm font-semibold text-[#0B2857]">{formatINR(calcItemAmount(item))}</span></div>
                  </div>
                ))}
                <div className="flex justify-between px-3 py-2 bg-slate-50 text-sm font-semibold">
                  <span>Section Subtotal:</span><span className="text-[#0B2857]">{formatINR(calcSectionSubtotal(section))}</span>
                </div>
              </div>
            )}

            {section.items.length === 0 && <div className="px-4 py-6 text-center text-sm text-slate-400">No items in this section yet.</div>}

            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
              <button onClick={() => addItem(section.id, true)} className="inline-flex items-center gap-1.5 text-sm text-[#0B2857] font-medium hover:underline">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
          </div>
        ))}

        {sections.length > 0 && (
          <div className="flex justify-between items-center px-4 py-3 bg-[#0B2857] text-white rounded-lg mt-2">
            <span className="text-sm font-semibold">BOQ Grand Total</span>
            <span className="text-lg font-bold text-[#F4B72B]">{formatINR(calcBOQSubtotal(sections))}</span>
          </div>
        )}
      </SectionCard>

      <ConfirmDialog open={!!deleteSectionId} title="Delete Section?" message="This will remove the section and all its items." danger confirmLabel="Delete" onConfirm={() => deleteSectionId && deleteSection(deleteSectionId)} onCancel={() => setDeleteSectionId(null)} />
    </div>
  );
}
