import { SectionCard, Select, TextInput } from '@/components/ui/Form';
import { useBuilder } from '@/context/BuilderContext';
import { DISCOUNT_TYPES } from '@/lib/constants';
import type { AdditionalCharge, Discount, Tax } from '@/lib/models';
import { calcCommercial, formatINR } from '@/lib/utils';
import { listMasterData, type MasterItem } from '@/services/masterData.service';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';

export default function CommercialStep() {
  const { quotation, setQuotation } = useBuilder();
  const [taxRates, setTaxRates] = useState<MasterItem[]>([]);

  const addCharge = () => setQuotation((prev) => ({ ...prev, additionalCharges: [...prev.additionalCharges, { id: uuid(), description: '', amount: 0 }] }));
  const updateCharge = (id: string, patch: Partial<AdditionalCharge>) => setQuotation((prev) => ({ ...prev, additionalCharges: prev.additionalCharges.map((c) => c.id === id ? { ...c, ...patch } : c) }));
  const deleteCharge = (id: string) => setQuotation((prev) => ({ ...prev, additionalCharges: prev.additionalCharges.filter((c) => c.id !== id) }));
  const updateDiscount = (patch: Partial<Discount>) => setQuotation((prev) => ({ ...prev, discount: { ...prev.discount, ...patch } }));
  const updateTax = (patch: Partial<Tax>) => setQuotation((prev) => ({ ...prev, tax: { ...prev.tax, ...patch } }));

  useEffect(() => {
    let active = true;
    listMasterData('taxRates')
      .then((rows) => {
        if (!active) return;
        setTaxRates(rows);
      })
      .catch(() => {
        if (!active) return;
        setTaxRates([]);
      });
    return () => { active = false; };
  }, []);

  if (!quotation) return null;
  const q = quotation;
  const commercial = calcCommercial(q);

  const onTaxRateChange = (value: string) => {
    if (!value) {
      setQuotation((prev) => ({ ...prev, taxRateId: null }));
      return;
    }
    const selected = taxRates.find((row) => row.id === value);
    if (!selected) return;
    setQuotation((prev) => ({
      ...prev,
      taxRateId: selected.id,
      tax: {
        ...prev.tax,
        applicable: true,
        name: selected.name,
        rate: Number(selected.ratePercentage ?? 0),
      },
    }));
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Additional Charges" description="Transportation, site setup, equipment, etc."
        actions={<button onClick={addCharge} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg"><Plus className="w-4 h-4" /> Add</button>}>
        {q.additionalCharges.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No additional charges.</p>
        ) : (
          <div className="space-y-2">
            {q.additionalCharges.map((charge) => (
              <div key={charge.id} className="flex flex-col sm:flex-row sm:items-center gap-2">
                <TextInput value={charge.description} onChange={(e) => updateCharge(charge.id, { description: e.target.value })} placeholder="Description" className="flex-1" />
                <div className="flex items-center gap-2">
                  <TextInput type="number" value={charge.amount} onChange={(e) => updateCharge(charge.id, { amount: Number(e.target.value) })} className="w-full sm:w-40 text-right" />
                  <button onClick={() => deleteCharge(charge.id)} className="p-2 text-red-500 hover:bg-red-50 rounded flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Discount">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Discount Type</label>
            <Select value={q.discount.type} onChange={(e) => updateDiscount({ type: e.target.value as Discount['type'] })}>
              {DISCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          {q.discount.type !== 'None' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{q.discount.type === 'Percentage' ? 'Percentage (%)' : 'Amount (₹)'}</label>
              <TextInput type="number" value={q.discount.value} onChange={(e) => updateDiscount({ value: Number(e.target.value) })} />
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Tax">
        <label className="flex items-center gap-2 mb-4">
          <input type="checkbox" checked={q.tax.applicable} onChange={(e) => updateTax({ applicable: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-[#1D4ED8] focus:ring-[#1D4ED8]" />
          <span className="text-sm font-medium text-slate-700">Tax Applicable</span>
        </label>
        {q.tax.applicable && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {taxRates.length > 0 && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Tax Rate</label>
                <Select value={q.taxRateId ?? ''} onChange={(e) => onTaxRateChange(e.target.value)}>
                  <option value="">Custom tax</option>
                  {taxRates.map((rate) => (
                    <option key={rate.id} value={rate.id}>{rate.name} ({Number(rate.ratePercentage ?? 0).toFixed(2)}%)</option>
                  ))}
                </Select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tax Name</label>
              <TextInput value={q.tax.name} onChange={(e) => updateTax({ name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tax Rate (%)</label>
              <TextInput type="number" value={q.tax.rate} onChange={(e) => updateTax({ rate: Number(e.target.value) })} />
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Summary">
        <div className="space-y-2 max-w-md ml-auto">
          <Row label="BOQ / Base Cost" value={formatINR(commercial.boqSubtotal)} />
          {commercial.additionalCharges > 0 && <Row label="Additional Charges" value={formatINR(commercial.additionalCharges)} />}
          {commercial.discountAmount > 0 && <Row label="Discount" value={`- ${formatINR(commercial.discountAmount)}`} />}
          <Row label="Taxable Amount" value={formatINR(commercial.taxableAmount)} />
          {commercial.taxAmount > 0 && <Row label={q.tax.name || 'Tax'} value={formatINR(commercial.taxAmount)} />}
          <div className="flex justify-between items-center px-4 py-3 bg-[#1D4ED8] text-white rounded-lg">
            <span className="text-sm font-semibold">Grand Total</span>
            <span className="text-lg font-bold text-[#F4B72B]">{formatINR(commercial.grandTotal)}</span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between items-center px-4 py-2 border border-slate-100 rounded-lg bg-slate-50"><span className="text-sm text-slate-600">{label}</span><span className="text-sm font-semibold text-[#1D4ED8]">{value}</span></div>;
}
