import { AppButton } from '@/components/ui/DesignSystem';
import { Field, SectionCard } from '@/components/ui/Form';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { useToast } from '@/context/ToastContext';
import { DEFAULT_SETTINGS } from '@/lib/defaults';
import type { FlatBilling, FlatPaymentRow } from '@/lib/flatBilling';
import { calcFlatTotal, defaultFlatBilling } from '@/lib/flatBilling';
import type { CompanySettings } from '@/lib/models';
import { formatINR } from '@/lib/utils';
import { getFlatBilling, nextFlatBillingSequence, saveFlatBilling } from '@/services/flatBilling.service';
import { ArrowLeft, Building2, Download, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuid } from 'uuid';

// â”€â”€ Dropdown option lists â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FLOOR_OPTIONS = [
  'Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor',
  '5th Floor', '6th Floor', '7th Floor', '8th Floor', '9th Floor', '10th Floor',
  '11th Floor', '12th Floor', '13th Floor', '14th Floor', '15th Floor',
  'Basement -1', 'Basement -2',
];

const PAYMENT_STAGE_OPTIONS = [
  'Booking Advance',
  'Agreement Registration',
  'Construction Phase 1',
  'Construction Phase 2',
  'Construction Phase 3',
  'Tile & Flooring Work',
  'Finishing Work',
  'Possession',
  'Final Settlement',
];

const STATUS_OPTIONS = ['Pending', 'Partially Paid', 'Paid'];

// â”€â”€ Small UI helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TextInput({ value, onChange, placeholder, type = 'text', className = '', maxLength }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string; maxLength?: number;
}) {
  const handleChange = (nextValue: string) => {
    if (type === 'tel') {
      onChange(nextValue.replace(/\D/g, '').slice(0, maxLength ?? 10));
      return;
    }
    onChange(nextValue);
  };

  return (
    <input
      type={type}
      value={value}
      maxLength={maxLength ?? (type === 'tel' ? 10 : undefined)}
      inputMode={type === 'tel' ? 'numeric' : undefined}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/30 focus:border-[#1D4ED8] ${className}`}
    />
  );
}

function Select({ value, onChange, options, placeholder, className = '' }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/30 focus:border-[#1D4ED8] ${className}`}
    >
      <option value="">{placeholder || '-- Select --'}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}

// â”€â”€ Validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface ValidationErrors {
  receiptNumber?: string;
  buyerName?: string;
  buyerPhone?: string;
  flatNo?: string;
  areaSqft?: string;
  ratePerSqft?: string;
  date?: string;
  payments?: string;
}

type BillingDraft = Omit<FlatBilling, 'id' | 'createdAt' | 'updatedAt'>;

function validate(b: BillingDraft): ValidationErrors {
  const e: ValidationErrors = {};
  if (!b.receiptNumber.trim()) e.receiptNumber = 'Receipt number is required';
  if (!b.buyerName.trim()) e.buyerName = 'Buyer name is required';
  if (!b.buyerPhone.trim()) e.buyerPhone = 'Phone is required';
  else if (!/^[6-9]\d{9}$/.test(b.buyerPhone.replace(/\s+/g, '')))
    e.buyerPhone = 'Enter a valid 10-digit mobile number';
  if (!b.flatNo.trim()) e.flatNo = 'Flat number is required';

  const area = parseFloat(b.areaSqft);
  if (!b.areaSqft.trim()) e.areaSqft = 'Area is required';
  else if (isNaN(area) || area <= 0) e.areaSqft = 'Area must be greater than 0';

  const rate = parseFloat(b.ratePerSqft);
  if (!b.ratePerSqft.trim()) e.ratePerSqft = 'Rate is required';
  else if (isNaN(rate) || rate <= 0) e.ratePerSqft = 'Rate must be greater than 0';

  if (!b.date) e.date = 'Date is required';

  // Validate payment rows: at least one row must have a stage selected,
  // and any row with a stage must have a positive amount.
  const rowsWithStage = b.payments.filter((p) => p.stage.trim());
  if (rowsWithStage.length === 0) {
    e.payments = 'Select at least one payment stage';
  } else {
    const bad = rowsWithStage.find((p) => !p.amount || p.amount <= 0);
    if (bad) e.payments = 'Each payment stage must have an amount greater than 0';
  }

  return e;
}

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function FlatBillingEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const { user } = useAuth();
  const { company } = useCompany();
  const isExisting = !!id;

  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [billing, setBilling] = useState<BillingDraft>(() => ({
    receiptNumber: '',
    ...defaultFlatBilling(),
  }));
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!company || !user) return;
    const activeSettings = company.settings ?? DEFAULT_SETTINGS;
    setSettings(activeSettings);

    (async () => {
      if (!id) {
        const seq = await nextFlatBillingSequence(company.companyId);
        const s = activeSettings;
        // Use bookingPrefix if set, else fallback to prefix. Strip any trailing /RCP or -RCP
        // to avoid double "RCP" in the generated number (e.g. "DOC/RCP-RCP-00001").
        const rawPrefix = (s.bookingPrefix || s.prefix || 'DOC').replace(/[-/]RCP$/i, '').replace(/\//g, '-');
        setBilling((prev) => ({
          ...prev,
          receiptNumber: `${rawPrefix}-RCP-${String(seq).padStart(5, '0')}`,
          bookingId: `${rawPrefix}-${String(seq).padStart(3, '0')}`,
        }));
        return;
      }
      const rec = await getFlatBilling(id, company.companyId);
      if (rec) {
        const { id: _id, createdAt: _ca, updatedAt: _ua, ...rest } = rec;
        setBilling(rest);
      }
    })();
  }, [id, company, user]);

  const update = (patch: Partial<BillingDraft>) => setBilling((prev) => ({ ...prev, ...patch }));

  const updatePayment = (rowId: string, patch: Partial<FlatPaymentRow>) => {
    setBilling((prev) => ({
      ...prev,
      payments: prev.payments.map((p) => (p.id === rowId ? { ...p, ...patch } : p)),
    }));
  };

  const addPaymentRow = () => {
    setBilling((prev) => ({
      ...prev,
      payments: [...prev.payments, { id: uuid(), stage: '', amount: 0, dueDate: '', status: 'Pending' }],
    }));
  };

  const removePaymentRow = (rowId: string) => {
    setBilling((prev) => ({ ...prev, payments: prev.payments.filter((p) => p.id !== rowId) }));
  };

  const updateTerm = (idx: number, val: string) => {
    const terms = [...billing.terms];
    terms[idx] = val;
    update({ terms });
  };

  const addTerm = () => update({ terms: [...billing.terms, ''] });
  const removeTerm = (idx: number) => update({ terms: billing.terms.filter((_, i) => i !== idx) });

  const runValidation = (): boolean => {
    const e = validate(billing);
    setErrors(e);
    if (Object.keys(e).length > 0) {
      push('error', 'Please fix the highlighted fields before saving.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!runValidation()) return;
    if (!user || !company) return;
    setIsSaving(true);
    const now = new Date().toISOString();
    const rec: FlatBilling = { id: id || uuid(), ...billing, createdAt: now, updatedAt: now };
    const result = await saveFlatBilling(rec, company.companyId, user.id);
    setIsSaving(false);
    if (!result.ok) {
      push('error', 'Could not save the receipt. It has been cached locally â€” please retry.');
      return;
    }
    push('success', 'Booking receipt saved.');
    navigate('/flat-billing');
  };

  const handleDownload = () => {
    if (!runValidation() || !settings) return;
    const now = new Date().toISOString();
    const rec: FlatBilling = { id: id || uuid(), ...billing, createdAt: now, updatedAt: now };
    import('@/lib/flatBillingPdf')
      .then(({ generateFlatBillingPDFImpl }) => generateFlatBillingPDFImpl(rec, settings))
      .catch(() => push('error', 'Failed to generate PDF. Please try again.'));
  };

  const flatTotal = calcFlatTotal(billing);
  const scheduledAmount = billing.payments.reduce((s, p) => s + (p.amount || 0), 0);
  const outstandingBalance = flatTotal - scheduledAmount;

  if (!settings) {
    return <div className="py-20 text-center text-slate-500">Loading company settingsâ€¦</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B234A]">
            {isExisting ? 'Edit Booking Receipt' : 'Create Booking Receipt'}
          </h1>
          <p className="text-sm text-slate-500">Capture the booking agreement and planned installment schedule.</p>
        </div>
        <div className="flex items-center gap-2">
          <AppButton variant="secondary" onClick={() => navigate(-1)} className="!px-3 !py-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </AppButton>
          <AppButton variant="secondary" onClick={handleDownload}>
            <Download className="w-4 h-4" /> Download PDF
          </AppButton>
          <AppButton onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4" /> {isSaving ? 'Savingâ€¦' : 'Save'}
          </AppButton>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        This booking form records the booking agreement and planned installment schedule. Actual money received is tracked separately in the existing Payments Received workflow.
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="mb-2 text-lg font-semibold text-[#17243A]">Company Details</h2>
          <div className="bg-gradient-to-br from-[#17243A] to-[#101C2F] rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-[#F4B72B]" />
              <h2 className="text-lg font-bold">{settings.companyName || 'Construction Documents'}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-[#F4B72B] text-xs font-medium uppercase tracking-wide mb-0.5">Office Address</p>
                <p className="text-white/90">
                  {[settings.address, settings.city, [settings.state, settings.pincode].filter(Boolean).join(' - ')].filter(Boolean).join(', ') || 'â€”'}
                </p>
              </div>
              <div>
                <p className="text-[#F4B72B] text-xs font-medium uppercase tracking-wide mb-0.5">Contact</p>
                <p className="text-white/90">{settings.mobile || 'â€”'}</p>
                <p className="text-white/70 text-xs">{settings.email}</p>
              </div>
              <div>
                <p className="text-[#F4B72B] text-xs font-medium uppercase tracking-wide mb-0.5">GST / Registration</p>
                <p className="text-white/90">{settings.gstin || 'â€”'}</p>
                <p className="text-white/70 text-xs">{settings.website}</p>
              </div>
            </div>
            <p className="text-white/50 text-xs mt-3">
              These details come from Settings and appear on every receipt. To change them, edit the Settings page.
            </p>
          </div>
        </div>

        {/* Receipt Details */}
        <SectionCard title="Receipt Details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Receipt Number" error={errors.receiptNumber}>
              <TextInput value={billing.receiptNumber} onChange={(v) => update({ receiptNumber: v })} placeholder="e.g. DOC-RCP-00001" />
            </Field>
            <Field label="Booking ID">
              <TextInput value={billing.bookingId} onChange={(v) => update({ bookingId: v })} placeholder="e.g. SC-001" />
            </Field>
            <Field label="Date" error={errors.date}>
              <TextInput type="date" value={billing.date} onChange={(v) => update({ date: v })} />
            </Field>
          </div>
        </SectionCard>

        {/* Buyer Details */}
        <SectionCard title="Buyer Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name" error={errors.buyerName}>
              <TextInput value={billing.buyerName} onChange={(v) => update({ buyerName: v })} placeholder="e.g. Mr. Ramesh Sharma" />
            </Field>
            <Field label="Phone" error={errors.buyerPhone}>
              <TextInput type="tel" maxLength={10} value={billing.buyerPhone} onChange={(v) => update({ buyerPhone: v })} placeholder="e.g. 98765 43210" />
            </Field>
            <Field label="Address">
              <TextInput value={billing.buyerAddress} onChange={(v) => update({ buyerAddress: v })} placeholder="e.g. 12, MG Road, Pune" />
            </Field>
            <Field label="PAN / Aadhar No.">
              <TextInput value={billing.buyerPanAadhar} onChange={(v) => update({ buyerPanAadhar: v })} placeholder="e.g. ABCDE1234F" />
            </Field>
          </div>
        </SectionCard>

        {/* Flat Details */}
        <SectionCard title="Flat Details">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Flat No." error={errors.flatNo}>
              <TextInput value={billing.flatNo} onChange={(v) => update({ flatNo: v })} placeholder="e.g. 204" />
            </Field>
            <Field label="Floor">
              <Select value={billing.floor} onChange={(v) => update({ floor: v })} options={FLOOR_OPTIONS} placeholder="-- Select Floor --" />
            </Field>
            <Field label="Block / Tower">
              <TextInput value={billing.blockTower} onChange={(v) => update({ blockTower: v })} placeholder="e.g. Tower A" />
            </Field>
            <Field label="Area (Sq. Ft.)" error={errors.areaSqft}>
              <TextInput type="number" value={billing.areaSqft} onChange={(v) => update({ areaSqft: v })} placeholder="e.g. 950" />
            </Field>
            <Field label="Rate per Sq. Ft. (Rs.)" error={errors.ratePerSqft}>
              <TextInput type="number" value={billing.ratePerSqft} onChange={(v) => update({ ratePerSqft: v })} placeholder="e.g. 5000" />
            </Field>
            <Field label="Booking Cost">
              <div className="px-3 py-2 text-sm border rounded-lg bg-[#1D4ED8]/5 text-[#1D4ED8] font-bold">
                {flatTotal > 0 ? formatINR(flatTotal) : 'â€”'}
              </div>
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Total Booking Cost">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Agreed booking value</p>
            <p className="mt-2 text-2xl font-bold text-[#0B234A]">{flatTotal > 0 ? formatINR(flatTotal) : 'â€”'}</p>
          </div>
        </SectionCard>

        {/* Payment Schedule */}
        <SectionCard
          title="Payment Schedule"
          description="Planned installment schedule only. These rows do not represent actual money already received."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1D4ED8] text-white">
                  <th className="px-3 py-2 text-left font-medium">Payment Stage</th>
                  <th className="px-3 py-2 text-right font-medium">Amount (Rs.)</th>
                  <th className="px-3 py-2 text-center font-medium">Due Date</th>
                  <th className="px-3 py-2 text-center font-medium">Status</th>
                  <th className="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {billing.payments.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="px-2 py-1.5">
                      <Select
                        value={row.stage}
                        onChange={(v) => updatePayment(row.id, { stage: v })}
                        options={PAYMENT_STAGE_OPTIONS}
                        placeholder="-- Select Stage --"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        value={row.amount || ''}
                        onChange={(e) => updatePayment(row.id, { amount: Math.max(0, parseFloat(e.target.value) || 0) })}
                        placeholder="0"
                        className="w-full px-3 py-2 text-sm border rounded-lg text-right bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/30 focus:border-[#1D4ED8]"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <TextInput type="date" value={row.dueDate} onChange={(v) => updatePayment(row.id, { dueDate: v })} />
                    </td>
                    <td className="px-2 py-1.5">
                      <Select
                        value={row.status}
                        onChange={(v) => updatePayment(row.id, { status: v })}
                        options={STATUS_OPTIONS}
                        placeholder="-- Status --"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <button onClick={() => removePaymentRow(row.id)} className="p-1 text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {flatTotal > 0 && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500">Planned Installments:</span>
                <span className="font-semibold text-green-600">{formatINR(scheduledAmount)}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500">Outstanding Balance:</span>
                <span className={`font-semibold ${outstandingBalance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {formatINR(Math.max(outstandingBalance, 0))}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500">Booking Amount:</span>
                <span className="font-semibold text-[#1D4ED8]">{formatINR(flatTotal)}</span>
              </div>
            </div>
          )}

          {errors.payments && (
            <p className="mt-2 text-xs text-red-600">{errors.payments}</p>
          )}

          <button onClick={addPaymentRow} className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#1D4ED8] hover:underline">
            <Plus className="w-4 h-4" /> Add Row
          </button>
        </SectionCard>

        {/* Terms & Conditions */}
        <SectionCard title="Terms & Conditions">
          <div className="space-y-2">
            {billing.terms.map((term, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm text-slate-400 w-5 shrink-0">{i + 1}.</span>
                <input
                  type="text"
                  value={term}
                  onChange={(e) => updateTerm(i, e.target.value)}
                  placeholder="Enter term..."
                  className="flex-1 px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/30 focus:border-[#1D4ED8]"
                />
                <button onClick={() => removeTerm(i)} className="p-1 text-red-400 hover:text-red-600 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button onClick={addTerm} className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#1D4ED8] hover:underline">
            <Plus className="w-4 h-4" /> Add Term
          </button>
        </SectionCard>
      </div>
    </div>
  );
}

