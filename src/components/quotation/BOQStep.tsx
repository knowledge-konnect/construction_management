import ConfirmDialog from '@/components/ConfirmDialog';
import { SectionCard } from '@/components/ui/Form';
import { useBuilder } from '@/context/BuilderContext';
import { useToast } from '@/context/ToastContext';
import { BOQ_UNITS, DEFAULT_BOQ_SECTIONS } from '@/lib/constants';
import type { BOQItem, BOQSection } from '@/lib/models';
import { calcBOQSubtotal, calcItemAmount, calcSectionSubtotal, formatINR } from '@/lib/utils';
import { ChevronDown, ChevronUp, Copy, FileText, Plus, Trash2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';

// Lowercase, trim, and collapse punctuation/extra spaces — e.g. "Electrical-Works " and
// "electrical works" both normalize to "electrical works". Used for both the exact-match
// block and the near-match nudge below.
const normalizeTitle = (title: string) => title.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');

// Cheap, dependency-free "looks like the same section" check: one normalized title
// contains the other (e.g. "Masonry" vs "Masonry Work"), or they share the same first
// significant word (e.g. "Electrical Works" vs "Electrical Works - Phase 2"). This is
// intentionally loose — it's used to ask, not to block — so false positives just mean
// an extra confirm click, not a refused add.
const STOPWORDS = new Set(['the', 'and', 'of', 'for', 'work', 'works']);
function isSimilarTitle(a: string, b: string): boolean {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (!na || !nb || na === nb) return false; // exact match is handled separately
  if (na.includes(nb) || nb.includes(na)) return true;
  const firstWord = (s: string) => s.split(' ').find((w) => w && !STOPWORDS.has(w));
  const wa = firstWord(na);
  const wb = firstWord(nb);
  return !!wa && !!wb && wa === wb;
}

export default function BOQStep() {
  const { quotation, setQuotation } = useBuilder();
  const { push } = useToast();
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);
  // A proposed new section whose title looks similar (not identical) to an existing
  // one — set while we wait for the person to confirm they really want both.
  const [pendingSection, setPendingSection] = useState<{ title: string; similarTo: string } | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const focusItem = useCallback((id: string) => {
    setTimeout(() => {
      const el = inputRefs.current[id];
      if (el) { el.focus(); el.select(); }
    }, 50);
  }, []);

  if (!quotation) return null;
  const sections = quotation.boqSections;

  const insertSection = (title: string) => {
    const newId = uuid();
    setQuotation((prev) => ({
      ...prev,
      boqSections: [...prev.boqSections, { id: newId, title, displayOrder: prev.boqSections.length, items: [] }],
    }));
  };

  const addSection = (title?: string) => {
    const trimmed = (title || 'New Section').trim();
    // The #1 cause of a quotation showing the same section twice (two separate totals,
    // both counted in the grand total) is this title already being in use — most often
    // from picking the same preset from the dropdown a second time. Block this outright;
    // nobody intentionally wants two sections both literally named "Masonry".
    if (sections.some((s) => s.title.trim().toLowerCase() === trimmed.toLowerCase())) {
      push('error', `A section named "${trimmed}" already exists. Rename it, or edit the existing one instead of adding a duplicate.`);
      return;
    }
    // A near-match ("Masonry" vs "Masonry Work", or re-using a preset with a suffix
    // added) is often legitimate — a phased or deliberately split section — so ask
    // rather than block.
    const similar = sections.find((s) => isSimilarTitle(s.title, trimmed));
    if (similar) {
      setPendingSection({ title: trimmed, similarTo: similar.title });
      return;
    }
    insertSection(trimmed);
  };

  const updateSection = (id: string, patch: Partial<BOQSection>) => {
    setQuotation((prev) => ({ ...prev, boqSections: prev.boqSections.map((s) => s.id === id ? { ...s, ...patch } : s) }));
  };

  const deleteSection = (id: string) => {
    setQuotation((prev) => ({ ...prev, boqSections: prev.boqSections.filter((s) => s.id !== id) }));
    setDeleteSectionId(null);
    push('success', 'BOQ section deleted successfully.');
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
        ? {
          ...s, items: s.items.map((i) => {
            if (i.id !== itemId) return i;
            const updated = { ...i, ...patch };
            updated.amount = calcItemAmount(updated);
            return updated;
          })
        }
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
        actions={<span className="text-sm font-semibold text-[var(--primary)]">Subtotal: {formatINR(calcBOQSubtotal(sections))}</span>}
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button onClick={() => addSection()} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg">
            <Plus className="w-4 h-4" /> Add Section
          </button>
          <select onChange={(e) => { if (e.target.value) { addSection(e.target.value); e.target.value = ''; } }} className="px-3 py-1.5 text-sm border border-[var(--border-strong)] rounded-lg bg-white" defaultValue="" aria-label="Add section from preset">
            <option value="">Add from preset…</option>
            {DEFAULT_BOQ_SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {sections.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-[var(--border)] rounded-lg">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-[var(--text-secondary)] font-medium">No sections yet</p>
            <p className="text-sm text-slate-400 mb-4">Add a section manually or pick from common presets above.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {DEFAULT_BOQ_SECTIONS.slice(0, 5).map((s) => (
                <button key={s} onClick={() => addSection(s)} className="px-3 py-1.5 text-xs font-medium text-[var(--primary)] border border-[var(--primary)] hover:bg-[#1D4ED8]/5 rounded-lg">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {sections.map((section, sIdx) => (
          <div key={section.id} className="mb-6 border border-[var(--border)] rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-[var(--surface-soft)] border-b border-[var(--border)]">
              <input
                value={section.title}
                onChange={(e) => updateSection(section.id, { title: e.target.value })}
                aria-label="Section title"
                className="flex-1 bg-transparent text-sm font-semibold text-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] rounded px-1"
              />
              <span className="text-sm text-[var(--text-muted)] font-medium">{formatINR(calcSectionSubtotal(section))}</span>
              <div className="flex items-center gap-0.5">
                <button onClick={() => moveSection(section.id, -1)} disabled={sIdx === 0} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--border)] rounded disabled:opacity-30" aria-label="Move section up"><ChevronUp className="w-4 h-4" /></button>
                <button onClick={() => moveSection(section.id, 1)} disabled={sIdx === sections.length - 1} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--border)] rounded disabled:opacity-30" aria-label="Move section down"><ChevronDown className="w-4 h-4" /></button>
                <button onClick={() => duplicateSection(section.id)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--border)] rounded" aria-label="Duplicate section"><Copy className="w-4 h-4" /></button>
                <button onClick={() => setDeleteSectionId(section.id)} className="p-1.5 text-[var(--danger)] hover:text-[var(--danger-fg)] hover:bg-[var(--danger-soft)] rounded" aria-label="Delete section"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            {section.items.length > 0 && (
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--primary)] text-white text-xs">
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
                      <tr key={item.id} className="border-t border-[var(--border)]">
                        <td className="px-2 py-1.5 text-[var(--text-muted)]">{iIdx + 1}</td>
                        <td className="px-2 py-1.5">
                          <input
                            ref={(el) => { inputRefs.current[item.id] = el; }}
                            value={item.description}
                            onChange={(e) => updateItem(section.id, item.id, { description: e.target.value })}
                            aria-label={`Description, row ${iIdx + 1}`}
                            className="w-full px-1.5 py-1 text-xs border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(section.id, item.id, { quantity: Number(e.target.value) })}
                            aria-label={`Quantity, row ${iIdx + 1}`}
                            className="w-full px-1.5 py-1 text-xs text-right border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <select
                            value={item.unit}
                            onChange={(e) => updateItem(section.id, item.id, { unit: e.target.value })}
                            aria-label={`Unit, row ${iIdx + 1}`}
                            className="w-full px-1.5 py-1 text-xs border border-[var(--border)] rounded bg-white focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
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
                            className="w-full px-1.5 py-1 text-xs text-right border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right font-medium text-[var(--primary)]">{formatINR(calcItemAmount(item))}</td>
                        <td className="px-2 py-1.5">
                          <div className="flex items-center justify-center gap-0.5">
                            <button onClick={() => moveItem(section.id, item.id, -1)} disabled={iIdx === 0} tabIndex={-1} className="p-1 text-slate-400 hover:text-[var(--text-secondary)] disabled:opacity-30" aria-label={`Move row ${iIdx + 1} up`}><ChevronUp className="w-3.5 h-3.5" /></button>
                            <button onClick={() => moveItem(section.id, item.id, 1)} disabled={iIdx === section.items.length - 1} tabIndex={-1} className="p-1 text-slate-400 hover:text-[var(--text-secondary)] disabled:opacity-30" aria-label={`Move row ${iIdx + 1} down`}><ChevronDown className="w-3.5 h-3.5" /></button>
                            <button onClick={() => duplicateItem(section.id, item.id)} tabIndex={-1} className="p-1 text-slate-400 hover:text-[var(--text-secondary)]" aria-label={`Duplicate row ${iIdx + 1}`}><Copy className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteItem(section.id, item.id)} tabIndex={-1} className="p-1 text-red-400 hover:text-[var(--danger-fg)]" aria-label={`Delete row ${iIdx + 1}`}><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[var(--border)] bg-[var(--surface-soft)]">
                      <td colSpan={5} className="px-2 py-2 text-right text-xs font-semibold text-[var(--text-secondary)]">Section Subtotal:</td>
                      <td className="px-2 py-2 text-right text-sm font-bold text-[var(--primary)]">{formatINR(calcSectionSubtotal(section))}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Mobile cards */}
            {section.items.length > 0 && (
              <div className="md:hidden divide-y divide-[var(--border)]">
                {section.items.map((item, iIdx) => (
                  <div key={item.id} className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs text-[var(--text-muted)]">#{iIdx + 1}</span>
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
                      className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded mb-2"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-[var(--text-muted)]">Qty</label>
                        <input type="number" value={item.quantity} onChange={(e) => updateItem(section.id, item.id, { quantity: Number(e.target.value) })} aria-label={`Quantity, row ${iIdx + 1}`} className="w-full px-2 py-1 text-sm border border-[var(--border)] rounded" />
                      </div>
                      <div>
                        <label className="text-xs text-[var(--text-muted)]">Unit</label>
                        <select value={item.unit} onChange={(e) => updateItem(section.id, item.id, { unit: e.target.value })} aria-label={`Unit, row ${iIdx + 1}`} className="w-full px-1 py-1 text-sm border border-[var(--border)] rounded bg-white">{BOQ_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select>
                      </div>
                      <div>
                        <label className="text-xs text-[var(--text-muted)]">Rate</label>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateItem(section.id, item.id, { rate: Number(e.target.value) })}
                          onKeyDown={(e) => handleItemKeyDown(e, section.id, true)}
                          aria-label={`Rate, row ${iIdx + 1}`}
                          className="w-full px-2 py-1 text-sm border border-[var(--border)] rounded"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-2"><span className="text-sm font-semibold text-[var(--primary)]">{formatINR(calcItemAmount(item))}</span></div>
                  </div>
                ))}
                <div className="flex justify-between px-3 py-2 bg-[var(--surface-soft)] text-sm font-semibold">
                  <span>Section Subtotal:</span><span className="text-[var(--primary)]">{formatINR(calcSectionSubtotal(section))}</span>
                </div>
              </div>
            )}

            {section.items.length === 0 && <div className="px-4 py-6 text-center text-sm text-slate-400">No items in this section yet.</div>}

            <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--surface-soft)]">
              <button onClick={() => addItem(section.id, true)} className="inline-flex items-center gap-1.5 text-sm text-[var(--primary)] font-medium hover:underline">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
          </div>
        ))}

        {sections.length > 0 && (
          <div className="flex justify-between items-center px-4 py-3 bg-[var(--primary)] text-white rounded-lg mt-2">
            <span className="text-sm font-semibold">BOQ Grand Total</span>
            <span className="text-lg font-bold text-[var(--primary)]">{formatINR(calcBOQSubtotal(sections))}</span>
          </div>
        )}
      </SectionCard>

      <ConfirmDialog open={!!deleteSectionId} title="Delete BOQ section?" message="This will permanently remove this section and all items inside it." danger confirmLabel="Delete section" onConfirm={() => deleteSectionId && deleteSection(deleteSectionId)} onCancel={() => setDeleteSectionId(null)} />
      <ConfirmDialog
        open={!!pendingSection}
        title="Similar section already exists"
        message={pendingSection && `This looks similar to the existing section "${pendingSection.similarTo}". Add "${pendingSection.title}" as a separate section anyway?`}
        confirmLabel="Add anyway"
        onConfirm={() => { if (pendingSection) insertSection(pendingSection.title); setPendingSection(null); }}
        onCancel={() => setPendingSection(null)}
      />
    </div>
  );
}
