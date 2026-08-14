import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { questionnaireRepo } from '@/lib/storage';
import { defaultQuestionnaire } from '@/lib/defaults';
import { useToast } from '@/context/ToastContext';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { Field, Select, TextArea, SectionCard } from '@/components/ui/Form';
import { ChevronDown } from 'lucide-react';
import type { Questionnaire, QuestionnaireRecord } from '@/lib/models';
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

export default function QuestionnaireEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const isExisting = !!id;

  const [title, setTitle] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [q, setQ] = useState<Questionnaire>(() => defaultQuestionnaire());

  useEffect(() => {
    if (!id) return;
    const rec = questionnaireRepo.get(id);
    if (rec) {
      setTitle(rec.title);
      setCustomerName(rec.customerName);
      setProjectName(rec.projectName);
      setQ(rec.questionnaire);
    }
  }, [id]);

  const update = (patch: Partial<Questionnaire>) => setQ((prev) => ({ ...prev, ...patch }));

  const handleSave = () => {
    const now = new Date().toISOString();
    const rec: QuestionnaireRecord = {
      id: id || uuid(),
      title: title || `${customerName || 'Untitled'}${projectName ? ` - ${projectName}` : ''}`,
      customerName,
      projectName,
      questionnaire: q,
      createdAt: now,
      updatedAt: now,
    };
    questionnaireRepo.save(rec);
    push('success', 'Requirements sheet saved.');
    navigate('/questionnaire');
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B234A]">{isExisting ? 'Edit Flat Sale Requirements' : 'New Flat Sale Requirements'}</h1>
          <p className="text-sm text-slate-500">Capture client material and finish preferences.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#0B2857] hover:bg-[#071C3F] rounded-lg"
          >
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>

      <SectionCard title="Requirements Details" description="Identify this requirements sheet for future reference.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Title"><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sharma House Preferences" className="w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B2857]/30 focus:border-[#0B2857]" /></Field>
          <Field label="Customer Name"><input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. Mr. Sharma" className="w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B2857]/30 focus:border-[#0B2857]" /></Field>
          <Field label="Project Name"><input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Sharma Residence" className="w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B2857]/30 focus:border-[#0B2857]" /></Field>
        </div>
      </SectionCard>

      <div className="space-y-4 mt-6">
        <Collapsible title="Project & Structure" description="Structural system, foundation, and plot details" defaultOpen>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Field label="Structure Type"><Select value={q.structureType} onChange={(e) => update({ structureType: e.target.value })}><option value="">— Select —</option>{Q_STRUCTURE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}</Select></Field>
            <Field label="Foundation Type"><Select value={q.foundationType} onChange={(e) => update({ foundationType: e.target.value })}><option value="">— Select —</option>{Q_FOUNDATION_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}</Select></Field>
            <Field label="Floors Planned"><input type="text" value={q.floorsPlanned} onChange={(e) => update({ floorsPlanned: e.target.value })} placeholder="e.g. G+1" className="w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B2857]/30 focus:border-[#0B2857]" /></Field>
            <Field label="Plot Size"><input type="text" value={q.plotSize} onChange={(e) => update({ plotSize: e.target.value })} placeholder="e.g. 30x40 ft" className="w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B2857]/30 focus:border-[#0B2857]" /></Field>
          </div>
        </Collapsible>

        <Collapsible title="Cement, Concrete & Steel" description="Core construction materials">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Field label="Cement Brand"><Select value={q.cementBrand} onChange={(e) => update({ cementBrand: e.target.value })}><option value="">— Select —</option>{Q_CEMENT_BRANDS.map((v) => <option key={v} value={v}>{v}</option>)}</Select></Field>
            <Field label="Concrete Mix Grade"><Select value={q.concreteMix} onChange={(e) => update({ concreteMix: e.target.value })}><option value="">— Select —</option>{Q_CONCRETE_MIXES.map((v) => <option key={v} value={v}>{v}</option>)}</Select></Field>
            <Field label="Steel Brand"><Select value={q.steelBrand} onChange={(e) => update({ steelBrand: e.target.value })}><option value="">— Select —</option>{Q_STEEL_BRANDS.map((v) => <option key={v} value={v}>{v}</option>)}</Select></Field>
            <Field label="Steel Grade"><Select value={q.steelGrade} onChange={(e) => update({ steelGrade: e.target.value })}><option value="">— Select —</option>{Q_STEEL_GRADES.map((v) => <option key={v} value={v}>{v}</option>)}</Select></Field>
          </div>
        </Collapsible>

        <Collapsible title="Flooring & Wall Finishes" description="Surface finishes and paint">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Field label="Flooring Type"><Select value={q.flooringType} onChange={(e) => update({ flooringType: e.target.value })}><option value="">— Select —</option>{Q_FLOORING_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}</Select></Field>
            <Field label="Flooring Brand"><Select value={q.flooringBrand} onChange={(e) => update({ flooringBrand: e.target.value })}><option value="">— Select —</option>{Q_FLOORING_BRANDS.map((v) => <option key={v} value={v}>{v}</option>)}</Select></Field>
            <Field label="Wall Finish"><Select value={q.wallFinish} onChange={(e) => update({ wallFinish: e.target.value })}><option value="">— Select —</option>{Q_WALL_FINISHES.map((v) => <option key={v} value={v}>{v}</option>)}</Select></Field>
            <Field label="Paint Brand"><Select value={q.paintBrand} onChange={(e) => update({ paintBrand: e.target.value })}><option value="">— Select —</option>{Q_PAINT_BRANDS.map((v) => <option key={v} value={v}>{v}</option>)}</Select></Field>
            <Field label="Paint Type"><Select value={q.paintType} onChange={(e) => update({ paintType: e.target.value })}><option value="">— Select —</option>{Q_PAINT_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}</Select></Field>
          </div>
        </Collapsible>

        <Collapsible title="Doors & Windows" description="Door and window types">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Field label="Doors Type"><Select value={q.doorsType} onChange={(e) => update({ doorsType: e.target.value })}><option value="">— Select —</option>{Q_DOORS_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}</Select></Field>
            <Field label="Windows Type"><Select value={q.windowsType} onChange={(e) => update({ windowsType: e.target.value })}><option value="">— Select —</option>{Q_WINDOWS_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}</Select></Field>
          </div>
        </Collapsible>

        <Collapsible title="Electrical, Plumbing & Sanitary" description="Wiring, switches, pipes, and sanitaryware">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Field label="Wiring Brand"><Select value={q.wiringBrand} onChange={(e) => update({ wiringBrand: e.target.value })}><option value="">— Select —</option>{Q_WIRING_BRANDS.map((v) => <option key={v} value={v}>{v}</option>)}</Select></Field>
            <Field label="Switches Brand"><Select value={q.switchesBrand} onChange={(e) => update({ switchesBrand: e.target.value })}><option value="">— Select —</option>{Q_SWITCHES_BRANDS.map((v) => <option key={v} value={v}>{v}</option>)}</Select></Field>
            <Field label="Plumbing Pipes"><Select value={q.plumbingPipes} onChange={(e) => update({ plumbingPipes: e.target.value })}><option value="">— Select —</option>{Q_PLUMBING_PIPES.map((v) => <option key={v} value={v}>{v}</option>)}</Select></Field>
            <Field label="Sanitaryware Brand"><Select value={q.sanitaryBrand} onChange={(e) => update({ sanitaryBrand: e.target.value })}><option value="">— Select —</option>{Q_SANITARY_BRANDS.map((v) => <option key={v} value={v}>{v}</option>)}</Select></Field>
          </div>
        </Collapsible>

        <Collapsible title="Additional Inclusions & Exclusions" description="Free-form notes beyond the standard checklist">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Field label="Extra Inclusions (one per line)"><TextArea rows={4} value={q.extraInclusions} onChange={(e) => update({ extraInclusions: e.target.value })} placeholder={"e.g. Modular kitchen fittings\nSolar water heater"} /></Field>
            <Field label="Extra Exclusions (one per line)"><TextArea rows={4} value={q.extraExclusions} onChange={(e) => update({ extraExclusions: e.target.value })} placeholder={"e.g. Furniture and appliances\nFalse ceiling in bedrooms"} /></Field>
          </div>
        </Collapsible>
      </div>
    </div>
  );
}
