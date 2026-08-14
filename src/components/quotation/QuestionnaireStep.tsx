import { useState } from 'react';
import { useBuilder } from '@/context/BuilderContext';
import { Field, Select, TextArea, SectionCard } from '@/components/ui/Form';
import { ChevronDown } from 'lucide-react';
import type { Questionnaire } from '@/lib/models';
import {
  Q_STRUCTURE_TYPES, Q_FOUNDATION_TYPES,
  Q_CEMENT_BRANDS, Q_STEEL_BRANDS, Q_STEEL_GRADES, Q_CONCRETE_MIXES,
  Q_FLOORING_TYPES, Q_FLOORING_BRANDS, Q_WALL_FINISHES,
  Q_PAINT_BRANDS, Q_PAINT_TYPES,
  Q_DOORS_TYPES, Q_WINDOWS_TYPES,
  Q_WIRING_BRANDS, Q_SWITCHES_BRANDS,
  Q_PLUMBING_PIPES, Q_SANITARY_BRANDS,
} from '@/lib/constants';

function Collapsible({
  title, description, children, defaultOpen = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 pb-5 pt-1 border-t border-slate-100">{children}</div>}
    </div>
  );
}

export default function QuestionnaireStep() {
  const { quotation, setQuotation } = useBuilder();
  if (!quotation) return null;

  const update = (patch: Partial<Questionnaire>) =>
    setQuotation((prev) => ({ ...prev, questionnaire: { ...prev.questionnaire, ...patch } }));

  return (
    <div className="space-y-4">
      <div className="bg-[#0B2857]/5 border border-[#0B2857]/10 rounded-lg p-4">
        <p className="text-sm text-slate-700">
          Capture the client's material and finish preferences. These answers feed the
          Material &amp; Work Specifications section of the PDF. Leave any field blank if
          not applicable.
        </p>
      </div>

      <Collapsible title="Project & Structure" description="Structural system, foundation, and plot details" defaultOpen>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Field label="Structure Type">
            <Select value={quotation.questionnaire.structureType} onChange={(e) => update({ structureType: e.target.value })}>
              <option value="">— Select —</option>
              {Q_STRUCTURE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Foundation Type">
            <Select value={quotation.questionnaire.foundationType} onChange={(e) => update({ foundationType: e.target.value })}>
              <option value="">— Select —</option>
              {Q_FOUNDATION_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Floors Planned">
            <input
              type="text"
              value={quotation.questionnaire.floorsPlanned}
              onChange={(e) => update({ floorsPlanned: e.target.value })}
              placeholder="e.g. G+1"
              className="w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B2857]/30 focus:border-[#0B2857]"
            />
          </Field>
          <Field label="Plot Size">
            <input
              type="text"
              value={quotation.questionnaire.plotSize}
              onChange={(e) => update({ plotSize: e.target.value })}
              placeholder="e.g. 30x40 ft"
              className="w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B2857]/30 focus:border-[#0B2857]"
            />
          </Field>
        </div>
      </Collapsible>

      <Collapsible title="Cement, Concrete & Steel" description="Core construction materials">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Field label="Cement Brand">
            <Select value={quotation.questionnaire.cementBrand} onChange={(e) => update({ cementBrand: e.target.value })}>
              <option value="">— Select —</option>
              {Q_CEMENT_BRANDS.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Concrete Mix Grade">
            <Select value={quotation.questionnaire.concreteMix} onChange={(e) => update({ concreteMix: e.target.value })}>
              <option value="">— Select —</option>
              {Q_CONCRETE_MIXES.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Steel Brand">
            <Select value={quotation.questionnaire.steelBrand} onChange={(e) => update({ steelBrand: e.target.value })}>
              <option value="">— Select —</option>
              {Q_STEEL_BRANDS.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Steel Grade">
            <Select value={quotation.questionnaire.steelGrade} onChange={(e) => update({ steelGrade: e.target.value })}>
              <option value="">— Select —</option>
              {Q_STEEL_GRADES.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
        </div>
      </Collapsible>

      <Collapsible title="Flooring & Wall Finishes" description="Surface finishes and paint">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Field label="Flooring Type">
            <Select value={quotation.questionnaire.flooringType} onChange={(e) => update({ flooringType: e.target.value })}>
              <option value="">— Select —</option>
              {Q_FLOORING_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Flooring Brand">
            <Select value={quotation.questionnaire.flooringBrand} onChange={(e) => update({ flooringBrand: e.target.value })}>
              <option value="">— Select —</option>
              {Q_FLOORING_BRANDS.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Wall Finish">
            <Select value={quotation.questionnaire.wallFinish} onChange={(e) => update({ wallFinish: e.target.value })}>
              <option value="">— Select —</option>
              {Q_WALL_FINISHES.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Paint Brand">
            <Select value={quotation.questionnaire.paintBrand} onChange={(e) => update({ paintBrand: e.target.value })}>
              <option value="">— Select —</option>
              {Q_PAINT_BRANDS.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Paint Type">
            <Select value={quotation.questionnaire.paintType} onChange={(e) => update({ paintType: e.target.value })}>
              <option value="">— Select —</option>
              {Q_PAINT_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
        </div>
      </Collapsible>

      <Collapsible title="Doors & Windows" description="Door and window types">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Field label="Doors Type">
            <Select value={quotation.questionnaire.doorsType} onChange={(e) => update({ doorsType: e.target.value })}>
              <option value="">— Select —</option>
              {Q_DOORS_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Windows Type">
            <Select value={quotation.questionnaire.windowsType} onChange={(e) => update({ windowsType: e.target.value })}>
              <option value="">— Select —</option>
              {Q_WINDOWS_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
        </div>
      </Collapsible>

      <Collapsible title="Electrical, Plumbing & Sanitary" description="Wiring, switches, pipes, and sanitaryware">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Field label="Wiring Brand">
            <Select value={quotation.questionnaire.wiringBrand} onChange={(e) => update({ wiringBrand: e.target.value })}>
              <option value="">— Select —</option>
              {Q_WIRING_BRANDS.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Switches Brand">
            <Select value={quotation.questionnaire.switchesBrand} onChange={(e) => update({ switchesBrand: e.target.value })}>
              <option value="">— Select —</option>
              {Q_SWITCHES_BRANDS.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Plumbing Pipes">
            <Select value={quotation.questionnaire.plumbingPipes} onChange={(e) => update({ plumbingPipes: e.target.value })}>
              <option value="">— Select —</option>
              {Q_PLUMBING_PIPES.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Sanitaryware Brand">
            <Select value={quotation.questionnaire.sanitaryBrand} onChange={(e) => update({ sanitaryBrand: e.target.value })}>
              <option value="">— Select —</option>
              {Q_SANITARY_BRANDS.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
        </div>
      </Collapsible>

      <Collapsible title="Additional Inclusions & Exclusions" description="Free-form notes beyond the standard checklist">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Field label="Extra Inclusions (one per line)">
            <TextArea rows={4} value={quotation.questionnaire.extraInclusions} onChange={(e) => update({ extraInclusions: e.target.value })} placeholder={"e.g. Modular kitchen fittings\nSolar water heater"} />
          </Field>
          <Field label="Extra Exclusions (one per line)">
            <TextArea rows={4} value={quotation.questionnaire.extraExclusions} onChange={(e) => update({ extraExclusions: e.target.value })} placeholder={"e.g. Furniture and appliances\nFalse ceiling in bedrooms"} />
          </Field>
        </div>
      </Collapsible>
    </div>
  );
}
