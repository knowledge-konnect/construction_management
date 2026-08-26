import { useMemo } from 'react';
import { useBuilder } from '@/context/BuilderContext';
import { Field, TextInput, Select, TextArea, SectionCard } from '@/components/ui/Form';
import { VALIDITY_OPTIONS, PROJECT_TYPES, AREA_UNITS, FLOOR_OPTIONS, INDIAN_STATES } from '@/lib/constants';
import { calcValidUntil, isValidMobile, isValidEmail, isValidPincode } from '@/lib/utils';
import { quotationRepo } from '@/lib/storage';
import { UserCheck } from 'lucide-react';
import type { Quotation } from '@/lib/models';

export default function ProjectStep() {
  const { quotation, setQuotation, isExisting } = useBuilder();

  // Look up an existing customer by mobile number so repeat customers don't need
  // to be re-typed. Only offered while creating a new quotation, and only once
  // the customer's own name/address fields are still empty (avoids clobbering
  // details the user already typed for a genuinely different person).
  // This hook must run on every render (before the early-return below) to
  // satisfy the Rules of Hooks, so it defensively handles a null quotation.
  const matchedCustomer = useMemo(() => {
    if (!quotation || isExisting || !isValidMobile(quotation.customer.mobile) || quotation.customer.name) return null;
    const match = quotationRepo
      .list()
      .find((other) => other.id !== quotation.id && other.customer.mobile === quotation.customer.mobile && other.customer.name);
    return match ? match.customer : null;
  }, [quotation?.id, quotation?.customer.mobile, quotation?.customer.name, isExisting]);

  if (!quotation) return null;
  const q = quotation;

  const update = (patch: Partial<Quotation>) => setQuotation((prev) => ({ ...prev, ...patch }));
  const updateCustomer = (patch: Partial<Quotation['customer']>) => setQuotation((prev) => ({ ...prev, customer: { ...prev.customer, ...patch } }));
  const updateProject = (patch: Partial<Quotation['project']>) => setQuotation((prev) => ({ ...prev, project: { ...prev.project, ...patch } }));

  const useMatchedCustomer = () => {
    if (!matchedCustomer) return;
    updateCustomer({ ...matchedCustomer, mobile: q.customer.mobile });
  };

  const onValidityChange = (validity: string) => update({ validity, validUntil: calcValidUntil(q.quotationDate, validity) });
  const onDateChange = (date: string) => update({ quotationDate: date, validUntil: calcValidUntil(date, q.validity) });

  return (
    <div className="space-y-6">
      <SectionCard title="Quotation Information">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Quotation Number" required>
            <TextInput value={q.quotationNumber} onChange={(e) => update({ quotationNumber: e.target.value })} />
          </Field>
          <Field label="Quotation Date" required>
            <TextInput type="date" value={q.quotationDate} onChange={(e) => onDateChange(e.target.value)} />
          </Field>
          <Field label="Validity">
            <Select value={q.validity} onChange={(e) => onValidityChange(e.target.value)}>
              {VALIDITY_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Valid Until">
            <TextInput type="date" value={q.validUntil} onChange={(e) => update({ validUntil: e.target.value })} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Customer Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Customer Name" required error={!q.customer.name ? 'Required' : ''}>
            <TextInput value={q.customer.name} onChange={(e) => updateCustomer({ name: e.target.value })} placeholder="e.g. Ramesh Kumar" />
          </Field>
          <Field label="Mobile Number" required error={q.customer.mobile && !isValidMobile(q.customer.mobile) ? 'Enter valid 10-digit number' : ''}>
            <TextInput value={q.customer.mobile} onChange={(e) => updateCustomer({ mobile: e.target.value })} maxLength={10} placeholder="10-digit number" />
            {matchedCustomer && (
              <button
                type="button"
                onClick={useMatchedCustomer}
                className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-[#0B2857] bg-[#0B2857]/5 hover:bg-[#0B2857]/10 px-2 py-1 rounded-md"
              >
                <UserCheck className="w-3.5 h-3.5" /> Existing customer found: {matchedCustomer.name} — use their details
              </button>
            )}
          </Field>
          <Field label="Email" error={!isValidEmail(q.customer.email) ? 'Invalid email' : ''}>
            <TextInput type="email" value={q.customer.email} onChange={(e) => updateCustomer({ email: e.target.value })} />
          </Field>
          <Field label="Address" className="md:col-span-3">
            <TextArea rows={2} value={q.customer.address} onChange={(e) => updateCustomer({ address: e.target.value })} />
          </Field>
          <Field label="City / Town">
            <TextInput value={q.customer.city} onChange={(e) => updateCustomer({ city: e.target.value })} />
          </Field>
          <Field label="State">
            <Select value={q.customer.state} onChange={(e) => updateCustomer({ state: e.target.value })}>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="PIN Code" error={q.customer.pincode && !isValidPincode(q.customer.pincode) ? '6 digits' : ''}>
            <TextInput value={q.customer.pincode} onChange={(e) => updateCustomer({ pincode: e.target.value })} maxLength={6} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Project Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Project Name" required error={!q.project.name ? 'Required' : ''}>
            <TextInput value={q.project.name} onChange={(e) => updateProject({ name: e.target.value })} placeholder="e.g. G+1 House at Visakhapatnam" />
          </Field>
          <Field label="Project Type">
            <Select value={q.project.projectType} onChange={(e) => updateProject({ projectType: e.target.value })}>
              {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Floors">
            <Select value={q.project.floors} onChange={(e) => updateProject({ floors: e.target.value })}>
              {FLOOR_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </Select>
          </Field>
          {q.project.floors === 'Custom' && (
            <Field label="Custom Floors">
              <TextInput value={q.project.floors} onChange={(e) => updateProject({ floors: e.target.value })} placeholder="e.g. G+3 with Basement" />
            </Field>
          )}
          <Field label="Built-up Area">
            <div className="flex flex-col sm:flex-row gap-2">
              <TextInput type="number" value={q.project.builtupArea} onChange={(e) => updateProject({ builtupArea: e.target.value })} />
              <Select className="sm:w-28" value={q.project.builtupAreaUnit} onChange={(e) => updateProject({ builtupAreaUnit: e.target.value })}>
                {AREA_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </Select>
            </div>
          </Field>
          <Field label="Project Address" className="md:col-span-2">
            <TextArea rows={2} value={q.project.address} onChange={(e) => updateProject({ address: e.target.value })} />
          </Field>
          <Field label="City / Town">
            <TextInput value={q.project.city} onChange={(e) => updateProject({ city: e.target.value })} />
          </Field>
          <Field label="State">
            <Select value={q.project.state} onChange={(e) => updateProject({ state: e.target.value })}>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}
