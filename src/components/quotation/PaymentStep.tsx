import { useBuilder } from '@/context/BuilderContext';
import { SectionCard, TextInput } from '@/components/ui/Form';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import type { PaymentStage } from '@/lib/models';
import { PAYMENT_STAGE_SUGGESTIONS } from '@/lib/constants';
import { calcCommercial, calcPaymentAmount, calcPaymentPercentTotal, formatINR, formatNumber } from '@/lib/utils';

export default function PaymentStep() {
  const { quotation, setQuotation } = useBuilder();
  if (!quotation) return null;
  const q = quotation;
  const commercial = calcCommercial(q);

  const addStage = (name?: string) => setQuotation((prev) => ({ ...prev, paymentSchedule: [...prev.paymentSchedule, { id: uuid(), name: name || '', percentage: 0, notes: '', displayOrder: prev.paymentSchedule.length }] }));
  const updateStage = (id: string, patch: Partial<PaymentStage>) => setQuotation((prev) => ({ ...prev, paymentSchedule: prev.paymentSchedule.map((s) => s.id === id ? { ...s, ...patch } : s) }));
  const deleteStage = (id: string) => setQuotation((prev) => ({ ...prev, paymentSchedule: prev.paymentSchedule.filter((s) => s.id !== id) }));
  const moveStage = (id: string, dir: -1 | 1) => setQuotation((prev) => {
    const arr = [...prev.paymentSchedule];
    const idx = arr.findIndex((s) => s.id === id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= arr.length) return prev;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    return { ...prev, paymentSchedule: arr };
  });

  const pctTotal = calcPaymentPercentTotal(q.paymentSchedule);
  const pctComplete = Math.abs(pctTotal - 100) < 0.01;
  const totalAmount = q.paymentSchedule.reduce((s, st) => s + calcPaymentAmount(st, commercial.grandTotal), 0);

  return (
    <div className="space-y-6">
      <SectionCard title="Payment Schedule" description="Percentage-based payment milestones.">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <select onChange={(e) => { if (e.target.value) { addStage(e.target.value); e.target.value = ''; } }} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white" defaultValue="">
            <option value="">Add suggested stage…</option>
            {PAYMENT_STAGE_SUGGESTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => addStage()} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#0B2857] hover:bg-[#071C3F] rounded-lg"><Plus className="w-4 h-4" /> Add Stage</button>
        </div>

        {q.paymentSchedule.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-lg">No payment stages added yet.</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">#</th>
                    <th className="px-3 py-2 text-left font-medium">Stage</th>
                    <th className="px-3 py-2 text-right font-medium w-28">Percentage (%)</th>
                    <th className="px-3 py-2 text-right font-medium w-36">Payable Amount</th>
                    <th className="px-3 py-2 text-left font-medium">Notes</th>
                    <th className="px-3 py-2 text-center font-medium w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {q.paymentSchedule.map((stage, idx) => (
                    <tr key={stage.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                      <td className="px-3 py-2"><input value={stage.name} onChange={(e) => updateStage(stage.id, { name: e.target.value })} placeholder="Stage name" className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0B2857]/30" /></td>
                      <td className="px-3 py-2"><input type="number" value={stage.percentage} onChange={(e) => updateStage(stage.id, { percentage: Number(e.target.value) })} className="w-full px-2 py-1 text-sm text-right border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0B2857]/30" /></td>
                      <td className="px-3 py-2 text-right font-medium text-[#0B2857]">{formatINR(calcPaymentAmount(stage, commercial.grandTotal))}</td>
                      <td className="px-3 py-2"><input value={stage.notes} onChange={(e) => updateStage(stage.id, { notes: e.target.value })} placeholder="Optional" className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0B2857]/30" /></td>
                      <td className="px-3 py-2"><div className="flex items-center justify-center gap-0.5">
                        <button onClick={() => moveStage(stage.id, -1)} disabled={idx === 0} className="p-1 text-slate-400 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                        <button onClick={() => moveStage(stage.id, 1)} disabled={idx === q.paymentSchedule.length - 1} className="p-1 text-slate-400 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                        <button onClick={() => deleteStage(stage.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td colSpan={2} className="px-3 py-2 text-right text-sm font-semibold text-slate-600">Total:</td>
                    <td className="px-3 py-2 text-right text-sm font-bold text-[#0B2857]">{formatNumber(pctTotal)}%</td>
                    <td className="px-3 py-2 text-right text-sm font-bold text-[#0B2857]">{formatINR(totalAmount)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {q.paymentSchedule.map((stage, idx) => (
                <div key={stage.id} className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs text-slate-500">#{idx + 1}</span>
                    <div className="flex gap-1">
                      <button onClick={() => moveStage(stage.id, -1)} disabled={idx === 0} className="p-1 text-slate-400 disabled:opacity-30" aria-label="Move up"><ChevronUp className="w-4 h-4" /></button>
                      <button onClick={() => moveStage(stage.id, 1)} disabled={idx === q.paymentSchedule.length - 1} className="p-1 text-slate-400 disabled:opacity-30" aria-label="Move down"><ChevronDown className="w-4 h-4" /></button>
                      <button onClick={() => deleteStage(stage.id)} className="p-1 text-red-400" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <input
                    value={stage.name}
                    onChange={(e) => updateStage(stage.id, { name: e.target.value })}
                    placeholder="Stage name"
                    aria-label={`Stage name, row ${idx + 1}`}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded mb-2"
                  />
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="text-xs text-slate-500">Percentage (%)</label>
                      <input type="number" value={stage.percentage} onChange={(e) => updateStage(stage.id, { percentage: Number(e.target.value) })} aria-label={`Percentage, row ${idx + 1}`} className="w-full px-2 py-1 text-sm border border-slate-200 rounded" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Notes</label>
                      <input value={stage.notes} onChange={(e) => updateStage(stage.id, { notes: e.target.value })} placeholder="Optional" aria-label={`Notes, row ${idx + 1}`} className="w-full px-2 py-1 text-sm border border-slate-200 rounded" />
                    </div>
                  </div>
                  <div className="flex justify-end"><span className="text-sm font-semibold text-[#0B2857]">{formatINR(calcPaymentAmount(stage, commercial.grandTotal))}</span></div>
                </div>
              ))}
              <div className="flex justify-between px-3 py-2 bg-slate-50 text-sm font-semibold">
                <span>Total: {formatNumber(pctTotal)}%</span><span className="text-[#0B2857]">{formatINR(totalAmount)}</span>
              </div>
            </div>
          </>
        )}

        {q.paymentSchedule.length > 0 && (
          <div className={`mt-3 px-4 py-2 rounded-lg text-sm ${pctComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {pctComplete ? 'Total: 100% — Payment schedule is complete.' : `Total: ${formatNumber(pctTotal)}% — Remaining: ${formatNumber(100 - pctTotal)}%. A complete schedule is recommended before generating the PDF.`}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
