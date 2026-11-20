import { AppLoader, DocumentGenerationLoader } from '@/components/loading/Loaders';
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
import { listProjects, type ProjectRecord } from '@/services/project.service';
import { listProjectUnits, type ProjectUnitRecord } from '@/services/projectUnit.service';
import { ArrowLeft, Building2, Download, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuid } from 'uuid';

const PAYMENT_STAGE_OPTIONS = [
  'Booking Advance',
  'Agreement / Registration',
  'Construction Stage',
  'Finishing Stage',
  'Possession',
  'Final Settlement',
  'Additional Payment',
];

const STATUS_OPTIONS = ['Pending', 'Partially Paid', 'Paid'];

function formatFloorLabel(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';

  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return String(value).trim();
  }

  if (numeric === 0) return 'Ground Floor';
  if (numeric === -1) return 'Basement -1';
  if (numeric === -2) return 'Basement -2';

  const suffix = numeric % 100 >= 11 && numeric % 100 <= 13
    ? 'th'
    : ['th', 'st', 'nd', 'rd'][Math.min((numeric % 10), 3)] ?? 'th';

  return `${numeric}${suffix} Floor`;
}

// ── Small UI helpers ───────────────────────────────────────────────────────────
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

// ── Validation ─────────────────────────────────────────────────────────────────
interface ValidationErrors {
  receiptNumber?: string;
  projectId?: string;
  projectUnitId?: string;
  buyerName?: string;
  buyerPhone?: string;
  flatNo?: string;
  floor?: string;
  blockTower?: string;
  areaSqft?: string;
  ratePerSqft?: string;
  date?: string;
  payments?: string;
}

type BillingDraft = Omit<FlatBilling, 'id' | 'createdAt' | 'updatedAt'>;

function validate(b: BillingDraft, projectUnitsList: ProjectUnitRecord[] = []): ValidationErrors {
  const e: ValidationErrors = {};
  const allowedFloorLabels = new Set(
    projectUnitsList
      .filter((unit) => unit.floor !== null && unit.floor !== undefined)
      .map((unit) => formatFloorLabel(unit.floor))
      .filter((label) => Boolean(label)),
  );

  if (!b.receiptNumber.trim()) e.receiptNumber = 'Receipt number is required';
  if (!b.projectId?.trim()) e.projectId = 'Linked project is required';
  if (b.projectId?.trim()) {
    if (!b.projectUnitId?.trim()) {
      e.projectUnitId = 'Please select a valid flat / unit for the linked project';
    } else {
      const matchingUnit = projectUnitsList.find((unit) => unit.id === b.projectUnitId || unit.flatNo.trim().toLowerCase() === b.flatNo.trim().toLowerCase());
      if (!matchingUnit) {
        e.projectUnitId = 'The selected flat does not belong to the chosen project';
      } else {
        if (b.flatNo.trim() && matchingUnit.flatNo.trim().toLowerCase() !== b.flatNo.trim().toLowerCase()) {
          e.flatNo = 'Selected flat is not available for this project';
        }
        if (matchingUnit.blockTower && b.blockTower.trim() && matchingUnit.blockTower.trim().toLowerCase() !== b.blockTower.trim().toLowerCase()) {
          e.blockTower = 'Selected block / tower does not match the chosen flat';
        }
        if (matchingUnit.floor != null && b.floor && formatFloorLabel(matchingUnit.floor) !== b.floor) {
          e.floor = 'Selected floor does not match the chosen flat';
        }
      }
    }
  }
  if (b.floor && allowedFloorLabels.size > 0 && !allowedFloorLabels.has(b.floor)) {
    e.floor = 'Selected floor is not available in this project inventory';
  }
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

  const rowsWithStage = b.payments.filter((p) => p.stage.trim());
  if (rowsWithStage.length === 0) {
    e.payments = 'Select at least one payment stage';
  } else {
    const bad = rowsWithStage.find((p) => !p.amount || p.amount <= 0);
    if (bad) e.payments = 'Each payment stage must have an amount greater than 0';
    const missingStageAmount = rowsWithStage.find((p) => p.stage.trim() && (!p.amount || p.amount <= 0));
    if (missingStageAmount) e.payments = 'Each payment stage must have an amount greater than 0';
  }

  return e;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function FlatBillingEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const { user } = useAuth();
  const { company } = useCompany();
  const isExisting = !!id;

  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [projectUnits, setProjectUnits] = useState<ProjectUnitRecord[]>([]);
  const [isLoadingProjectUnits, setIsLoadingProjectUnits] = useState(false);
  const [billing, setBilling] = useState<BillingDraft>(() => ({
    receiptNumber: '',
    ...defaultFlatBilling(),
  }));
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const enabledBusinessModels = company?.settings?.enabledBusinessModels ?? DEFAULT_SETTINGS.enabledBusinessModels ?? [];
  const isPropertyDevelopmentEnabled = enabledBusinessModels.includes('property_development');
  const eligibleProjects = projects.filter((project) => (
    project.companyId === company?.companyId
    && project.businessModel === 'property_development'
    && (project.totalProjectFlats === null || project.totalProjectFlats > 0)
  ));
  const projectFloorOptions = useMemo(() => {
    const uniqueFloors = Array.from(new Set(
      projectUnits
        .map((unit) => unit.floor)
        .filter((floor): floor is number => floor !== null && floor !== undefined && Number.isFinite(floor)),
    )).sort((a, b) => a - b);

    return uniqueFloors.map((floor) => formatFloorLabel(floor));
  }, [projectUnits]);

  const update = (patch: Partial<BillingDraft>) => setBilling((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    if (billing.projectId && !eligibleProjects.some((project) => project.id === billing.projectId)) {
      update({ projectId: undefined, projectName: '', projectUnitId: '', flatNo: '', blockTower: '', floor: '' });
    }
  }, [billing.projectId, eligibleProjects]);

  useEffect(() => {
    if (!company?.companyId || !billing.projectId) {
      setProjectUnits([]);
      setIsLoadingProjectUnits(false);
      return;
    }

    let active = true;
    setIsLoadingProjectUnits(true);

    void listProjectUnits(billing.projectId)
      .then(({ units }) => {
        if (!active) return;
        setProjectUnits(units);

        if (!billing.flatNo && !billing.projectUnitId) return;
        const matchingUnit = units.find((unit) => unit.id === billing.projectUnitId || unit.flatNo.trim().toLowerCase() === billing.flatNo.trim().toLowerCase());
        if (!matchingUnit) {
          update({ projectUnitId: '', flatNo: '', blockTower: '', floor: '' });
          return;
        }

        update({
          projectUnitId: matchingUnit.id,
          blockTower: matchingUnit.blockTower ?? billing.blockTower ?? '',
          floor: matchingUnit.floor != null ? formatFloorLabel(matchingUnit.floor) : billing.floor || '',
        });
      })
      .catch(() => {
        if (active) setProjectUnits([]);
      })
      .finally(() => {
        if (active) setIsLoadingProjectUnits(false);
      });

    return () => {
      active = false;
    };
  }, [billing.projectId, company?.companyId]);

  useEffect(() => {
    if (!company || !user) return;
    const activeSettings = company.settings ?? DEFAULT_SETTINGS;
    setSettings(activeSettings);

    void listProjects().then(setProjects).catch(() => setProjects([]));

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

  const handleProjectChange = (nextProjectId: string) => {
    const selectedProject = eligibleProjects.find((project) => project.id === nextProjectId) ?? null;
    update({
      projectId: nextProjectId || undefined,
      projectUnitId: '',
      projectName: selectedProject?.name ?? '',
      flatNo: '',
      blockTower: '',
      floor: '',
    });
    setProjectUnits([]);
  };

  const handleUnitSelection = (nextFlatNo: string) => {
    const matchingUnit = projectUnits.find((unit) => unit.flatNo === nextFlatNo);
    update({
      projectUnitId: matchingUnit?.id ?? '',
      flatNo: nextFlatNo,
      blockTower: matchingUnit?.blockTower ?? billing.blockTower ?? '',
      floor: matchingUnit?.floor != null ? formatFloorLabel(matchingUnit.floor) : billing.floor || '',
    });
  };

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

  const updateNote = (value: string) => {
    const terms = [...billing.terms];
    terms[0] = value;
    update({ terms });
  };

  const runValidation = (): boolean => {
    const e = validate(billing, projectUnits);
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
      push('error', result.error || 'Could not save the receipt. It has been cached locally — please retry.');
      return;
    }
    push('success', 'Booking receipt saved successfully.');
    navigate('/flat-billing');
  };

  const handleDownload = async () => {
    if (!runValidation() || !settings) return;
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    const now = new Date().toISOString();
    const rec: FlatBilling = { id: id || uuid(), ...billing, createdAt: now, updatedAt: now };
    try {
      const { generateFlatBillingPDFImpl } = await import('@/lib/flatBillingPdf');
      await generateFlatBillingPDFImpl(rec, settings);
      push('success', 'Booking receipt PDF downloaded successfully.');
    } catch {
      push('error', 'Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const flatTotal = calcFlatTotal(billing);
  const scheduledAmount = billing.payments.reduce((s, p) => s + (p.amount || 0), 0);
  const outstandingBalance = flatTotal - scheduledAmount;

  if (!settings) {
    return <AppLoader fullscreen={false} message="Loading company settings…" />;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.04em] text-[#17243A] sm:text-[2rem]">
            {isExisting ? 'Edit Booking Receipt' : 'Create Booking Receipt'}
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">Capture the booking agreement and planned installment schedule.</p>
        </div>
        <div className="flex items-center gap-2">
          <AppButton variant="secondary" onClick={() => navigate(-1)} className="!px-3 !py-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </AppButton>
          <AppButton variant="secondary" onClick={() => void handleDownload()} loading={isGeneratingPdf} loadingText="Generating PDF…">
            <Download className="w-4 h-4" /> Download PDF
          </AppButton>
          <AppButton onClick={handleSave} loading={isSaving} loadingText="Saving receipt…">
            <Save className="w-4 h-4" /> Save
          </AppButton>
        </div>
      </div>

      {isGeneratingPdf && <DocumentGenerationLoader label="Generating booking receipt PDF…" />}

      <div className="mb-6 rounded-[24px] border border-blue-200 bg-[linear-gradient(135deg,#EFF6FF_0%,#EAF1FF_100%)] px-4 py-3 text-sm text-blue-800 shadow-sm">
        This booking form records the booking agreement and planned installment schedule. Actual money received is tracked separately in the existing Payments Received workflow.
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Booking value</p>
          <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#17243A]">{flatTotal > 0 ? formatINR(flatTotal) : '—'}</p>
        </div>
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Planned</p>
          <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#17243A]">{formatINR(scheduledAmount)}</p>
        </div>
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Outstanding</p>
          <p className={`mt-2 text-2xl font-bold tracking-[-0.04em] ${outstandingBalance > 0 ? 'text-amber-600' : outstandingBalance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {formatINR(outstandingBalance)}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="mb-2 text-lg font-semibold text-[#17243A]">Company Details</h2>
          <div className="rounded-[24px] bg-gradient-to-br from-[#17243A] to-[#101C2F] p-5 text-white shadow-[0_12px_28px_rgba(15,23,42,0.12)]">
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#F4B72B]" />
              <h2 className="text-lg font-bold">{settings.companyName || 'Construction Documents'}</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
              <div>
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#F4B72B]">Office Address</p>
                <p className="text-white/90">
                  {[settings.address, settings.city, [settings.state, settings.pincode].filter(Boolean).join(' - ')].filter(Boolean).join(', ') || '—'}
                </p>
              </div>
              <div>
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#F4B72B]">Contact</p>
                <p className="text-white/90">{settings.mobile || '—'}</p>
                <p className="text-xs text-white/70">{settings.email}</p>
              </div>
              <div>
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#F4B72B]">GST / Registration</p>
                <p className="text-white/90">{settings.gstin || '—'}</p>
                <p className="text-xs text-white/70">{settings.website}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-white/50">
              These details come from Settings and appear on every receipt. To change them, edit the Settings page.
            </p>
          </div>
        </div>

        <SectionCard title="Receipt Details">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Field label="Receipt Number" error={errors.receiptNumber}>
              <TextInput value={billing.receiptNumber} onChange={(v) => update({ receiptNumber: v })} placeholder="e.g. DOC-RCP-00001" />
            </Field>
            <Field label="Booking ID">
              <TextInput value={billing.bookingId} onChange={(v) => update({ bookingId: v })} placeholder="e.g. SC-001" />
            </Field>
            <Field label="Booking Status">
              <Select
                value={billing.bookingStatus ?? 'Draft'}
                onChange={(value) => update({ bookingStatus: value as FlatBilling['bookingStatus'] })}
                options={['Draft', 'Confirmed', 'Cancelled', 'Completed']}
              />
            </Field>
            <Field label="Linked Project" error={errors.projectId}>
              <select
                value={billing.projectId ?? ''}
                disabled={!isPropertyDevelopmentEnabled || eligibleProjects.length === 0}
                onChange={(event) => handleProjectChange(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/15 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">
                  {isPropertyDevelopmentEnabled
                    ? eligibleProjects.length > 0
                      ? 'Select project'
                      : 'No eligible property development projects'
                    : 'Property development is disabled for this company'}
                </option>
                {eligibleProjects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
              {!isPropertyDevelopmentEnabled && (
                <p className="mt-1 text-xs text-amber-600">Booking receipts are available only for property development projects when that business model is enabled.</p>
              )}
              {isPropertyDevelopmentEnabled && eligibleProjects.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">There are no eligible property-development projects with flat inventory for this company yet.</p>
              )}
            </Field>
            <Field label="Flat / Unit" error={errors.projectUnitId ?? errors.flatNo}>
              <select
                value={billing.flatNo}
                disabled={!billing.projectId || isLoadingProjectUnits || projectUnits.length === 0}
                onChange={(event) => handleUnitSelection(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/15 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">
                  {!billing.projectId
                    ? 'Select a project first'
                    : isLoadingProjectUnits
                      ? 'Loading flats…'
                      : projectUnits.length === 0
                        ? 'No units available for this project'
                        : 'Select flat / unit'}
                </option>
                {projectUnits.map((unit) => (
                  <option key={unit.id} value={unit.flatNo}>
                    {unit.flatNo}
                    {unit.blockTower ? ` • ${unit.blockTower}` : ''}
                    {unit.floor != null ? ` • Floor ${unit.floor}` : ''}
                  </option>
                ))}
              </select>
              {billing.projectId && !isLoadingProjectUnits && projectUnits.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">Add flat inventory to this project before creating a booking receipt.</p>
              )}
            </Field>
            <Field label="Date" error={errors.date}>
              <TextInput type="date" value={billing.date} onChange={(v) => update({ date: v })} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Buyer Details">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

        <SectionCard title="Flat Details">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <Field label="Flat No." error={errors.flatNo}>
              <TextInput value={billing.flatNo} onChange={(v) => update({ flatNo: v })} placeholder="e.g. 204" />
            </Field>
            <Field label="Tower / Block" error={errors.blockTower}>
              <TextInput value={billing.blockTower} onChange={(v) => update({ blockTower: v })} placeholder="e.g. Tower A" />
            </Field>
            <Field label="Floor" error={errors.floor}>
              <Select
                value={billing.floor}
                onChange={(v) => update({ floor: v })}
                options={projectFloorOptions}
                placeholder={
                  !billing.projectId
                    ? '-- Select project first --'
                    : isLoadingProjectUnits
                      ? '-- Loading floors --'
                      : projectFloorOptions.length === 0
                        ? '-- No floors in inventory --'
                        : '-- Select Floor --'
                }
                className={!billing.projectId || isLoadingProjectUnits || projectFloorOptions.length === 0 ? 'bg-slate-100 text-slate-500' : ''}
              />
            </Field>
            <Field label="Area (Sq. Ft.)" error={errors.areaSqft}>
              <TextInput type="number" value={billing.areaSqft} onChange={(v) => update({ areaSqft: v })} placeholder="e.g. 950" />
            </Field>
            <Field label="Rate per Sq. Ft. (Rs.)" error={errors.ratePerSqft}>
              <TextInput type="number" value={billing.ratePerSqft} onChange={(v) => update({ ratePerSqft: v })} placeholder="e.g. 5000" />
            </Field>
            <Field label="Agreement Value (Rs.)">
              <TextInput type="number" value={billing.agreementValue || String(flatTotal)} onChange={(v) => update({ agreementValue: v })} placeholder="e.g. 4750000" />
            </Field>
            <Field label="Balance Due (Rs.)">
              <TextInput type="number" value={billing.balanceDue || ''} onChange={(v) => update({ balanceDue: v })} placeholder="e.g. 3750000" />
            </Field>
            <Field label="Payment Mode">
              <Select
                value={billing.paymentMode}
                onChange={(v) => update({ paymentMode: v })}
                options={['Cash', 'Cheque', 'UPI', 'NEFT / RTGS', 'Bank Transfer']}
                placeholder="-- Select Mode --"
              />
            </Field>
            <Field label="Due Date">
              <TextInput type="date" value={billing.dueDate} onChange={(v) => update({ dueDate: v })} />
            </Field>
            <Field label="Booking Cost">
              <div className="rounded-xl border border-[#DBEAFE] bg-[#F8FAFF] px-3 py-2.5 text-sm font-bold text-[#1D4ED8]">
                {flatTotal > 0 ? formatINR(flatTotal) : '—'}
              </div>
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Total Booking Cost">
          <div className="rounded-2xl border border-[#E2E8F0] bg-[linear-gradient(135deg,#F8FAFC_0%,#EEF4FF_100%)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F4B72B]">Agreed booking value</p>
            <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#0B234A]">{flatTotal > 0 ? formatINR(flatTotal) : '—'}</p>
          </div>
        </SectionCard>

        <SectionCard
          title="Payment Schedule"
          description="Planned installment schedule only. These rows do not represent actual money already received."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#17243B] text-white">
                  <th className="px-3 py-2 text-left font-medium">Payment Stage</th>
                  <th className="px-3 py-2 text-right font-medium">Amount (Rs.)</th>
                  <th className="px-3 py-2 text-center font-medium">Due Date</th>
                  <th className="px-3 py-2 text-center font-medium">Status</th>
                  <th className="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {billing.payments.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 bg-white">
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
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-sm text-slate-900 placeholder-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/15"
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
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-slate-500">Planned Installments:</span>
                <span className="font-semibold text-emerald-600">{formatINR(scheduledAmount)}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-slate-500">Outstanding Balance:</span>
                <span className={`font-semibold ${outstandingBalance > 0 ? 'text-amber-600' : outstandingBalance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {formatINR(outstandingBalance)}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-slate-500">Booking Amount:</span>
                <span className="font-semibold text-[#1D4ED8]">{formatINR(flatTotal)}</span>
              </div>
            </div>
          )}

          {errors.payments && (
            <p className="mt-2 text-xs text-red-600">{errors.payments}</p>
          )}

          <button onClick={addPaymentRow} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#1D4ED8] hover:underline">
            <Plus className="w-4 h-4" /> Add Row
          </button>
        </SectionCard>

        <SectionCard title="Notes & Remarks">
          <textarea
            value={billing.terms[0] || ''}
            onChange={(e) => updateNote(e.target.value)}
            rows={4}
            placeholder="Add a note for the customer or internal booking remarks. Example: Booking amount received for the selected flat. Balance due as per payment schedule."
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/15"
          />
        </SectionCard>
      </div>
    </div>
  );
}

