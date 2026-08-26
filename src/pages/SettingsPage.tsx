import { Field, SectionCard, Select, TextArea, TextInput } from '@/components/ui/Form';
import { useCompany } from '@/context/CompanyContext';
import { useToast } from '@/context/ToastContext';
import { INDIAN_STATES, VALIDITY_OPTIONS } from '@/lib/constants';
import type { CompanySettings } from '@/lib/models';
import { validateCompanySettings } from '@/lib/utils';
import { Building2, ImageIcon, Loader2, Plus, Save, Sliders, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';

type Tab = 'company' | 'defaults';

// ── Image compression helper ──────────────────────────────────────────────────
// Draws the image onto a canvas, resizes it to maxDim, and returns a base64
// data URL. Logo uses JPEG (smaller), signature uses PNG (preserves transparency).
function compressImage(file: File, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not decode image.'));
      img.onload = () => {
        let { width, height } = img;

        // Scale down while keeping aspect ratio
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height / width) * maxDim);
            width = maxDim;
          } else {
            width = Math.round((width / height) * maxDim);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;

        // Fill white background so transparent PNGs become white in JPEG mode
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Signatures stay PNG to keep transparency; logos become JPEG
        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(mime, quality));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Rough byte count from a base64 data URL
function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? '';
  return Math.round((base64.length * 3) / 4);
}

function formatBytes(n: number): string {
  return n < 1024 ? `${n} B` : `${Math.round(n / 1024)} KB`;
}

// ── ImageUploadField ──────────────────────────────────────────────────────────

interface ImageUploadFieldProps {
  label: string;
  hint: string;
  /** base64 data URL currently saved in settings, or undefined */
  currentUrl: string | undefined;
  /** logo → max 400 px / JPEG 0.82 · signature → max 600 px / PNG 0.92 */
  type: 'logo' | 'signature';
  onProcessed: (dataUrl: string) => void;
  onRemoved: () => void;
}

function ImageUploadField({ label, hint, currentUrl, type, onProcessed, onRemoved }: ImageUploadFieldProps) {
  const { push } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  const hasImage = !!currentUrl;
  const sizeLabel = hasImage ? formatBytes(dataUrlBytes(currentUrl!)) : null;

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      push('error', 'Please select a PNG, JPEG, or WebP image.');
      return;
    }

    setProcessing(true);
    try {
      const maxDim = type === 'logo' ? 400 : 600;
      const quality = type === 'logo' ? 0.82 : 0.92;
      const dataUrl = await compressImage(file, maxDim, quality);
      const kb = Math.round(dataUrlBytes(dataUrl) / 1024);
      onProcessed(dataUrl);
      push('success', `${label} compressed to ${kb} KB. Click "Save Settings" to store it.`);
    } catch (err) {
      push('error', err instanceof Error ? err.message : 'Could not process image.');
    } finally {
      setProcessing(false);
      // Reset input so the same file can be picked again
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <p className="text-sm font-medium text-slate-700 mb-1.5">{label}</p>

      {/* Preview thumbnail */}
      {hasImage && (
        <div className="mb-3 relative inline-block">
          <img
            src={currentUrl}
            alt={label}
            className="h-16 max-w-[200px] object-contain rounded border border-slate-200 bg-slate-50 p-1.5"
          />
          {sizeLabel && (
            <span className="absolute bottom-1 right-1 bg-black/50 text-white text-[9px] px-1 rounded leading-4">
              {sizeLabel}
            </span>
          )}
          <button
            type="button"
            onClick={() => { onRemoved(); if (inputRef.current) inputRef.current.value = ''; }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow"
            title="Remove image"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Pick button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={processing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#0B2857] border border-[#0B2857]/30 hover:bg-[#0B2857]/5 rounded-lg disabled:opacity-60"
        >
          {processing
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Compressing…</>
            : <><Upload className="w-4 h-4" /> {hasImage ? 'Replace image' : 'Choose image'}</>
          }
        </button>
        {!hasImage && (
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <ImageIcon className="w-3.5 h-3.5" /> {hint}
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
      />
    </div>
  );
}

// ── Main SettingsPage ─────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { push } = useToast();
  const { company, updateSettings, loading } = useCompany();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [tab, setTab] = useState<Tab>('company');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (company) setSettings({ ...company.settings });
  }, [company]);

  const validateSettings = validateCompanySettings;

  if (loading || !settings) {
    return <div className="py-20 text-center text-slate-500">Loading settings…</div>;
  }

  const update = (patch: Partial<CompanySettings>) => {
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev));
    setErrors({});
  };

  const handleSave = async () => {
    if (!settings) return;
    const nextErrors = validateSettings(settings);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      push('error', 'Please fix the highlighted errors before saving.');
      return;
    }
    setSaving(true);
    const ok = await updateSettings(settings);
    setSaving(false);
    if (ok) push('success', 'Settings saved.');
    else push('error', 'Could not save settings. Please try again.');
  };

  const tabs: { key: Tab; label: string; icon: typeof Building2 }[] = [
    { key: 'company', label: 'Company Profile', icon: Building2 },
    { key: 'defaults', label: 'Quotation Defaults', icon: Sliders },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B234A]">Settings</h1>
          <p className="text-sm text-slate-500">Configure company profile and defaults.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#0B2857] hover:bg-[#071C3F] rounded-lg disabled:opacity-70"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 border-b border-slate-200">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.key
                ? 'border-[#0B2857] text-[#0B2857]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Company Profile tab ── */}
      {tab === 'company' && (
        <div className="space-y-6">

          {/* Basic info */}
          <SectionCard
            title="Company Profile"
            description="Appears on all quotations and flat billing receipts."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Company Name" error={errors.companyName}>
                <TextInput value={settings.companyName} onChange={(e) => update({ companyName: e.target.value })} />
              </Field>
              <Field label="Tagline">
                <TextInput value={settings.tagline} onChange={(e) => update({ tagline: e.target.value })} />
              </Field>
              <Field label="Contact Person">
                <TextInput value={settings.contactPerson} onChange={(e) => update({ contactPerson: e.target.value })} />
              </Field>
              <Field label="Mobile" error={errors.mobile}>
                <TextInput value={settings.mobile} onChange={(e) => update({ mobile: e.target.value })} />
              </Field>
              <Field label="Email" error={errors.email}>
                <TextInput type="email" value={settings.email} onChange={(e) => update({ email: e.target.value })} />
              </Field>
              <Field label="Website" error={errors.website}>
                <TextInput value={settings.website} onChange={(e) => update({ website: e.target.value })} />
              </Field>
              <Field label="GSTIN (optional)" error={errors.gstin}>
                <TextInput
                  maxLength={15}
                  value={settings.gstin}
                  onChange={(e) => update({ gstin: e.target.value.toUpperCase() })}
                  placeholder="e.g. 36ABCDE1234F2Z5"
                />
              </Field>
              <Field label="PAN (optional)" error={errors.pan}>
                <TextInput
                  maxLength={10}
                  value={settings.pan ?? ''}
                  onChange={(e) => update({ pan: e.target.value.toUpperCase() })}
                  placeholder="e.g. ABCDE1234F"
                />
              </Field>
              <Field label="Address" className="md:col-span-3">
                <TextArea rows={2} value={settings.address} onChange={(e) => update({ address: e.target.value })} />
              </Field>
              <Field label="City / Town">
                <TextInput value={settings.city} onChange={(e) => update({ city: e.target.value })} />
              </Field>
              <Field label="State">
                <Select value={settings.state} onChange={(e) => update({ state: e.target.value })}>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
              <Field label="PIN Code" error={errors.pincode}>
                <TextInput value={settings.pincode} onChange={(e) => update({ pincode: e.target.value })} maxLength={6} />
              </Field>
            </div>
          </SectionCard>

          {/* Branding */}
          <SectionCard
            title="Branding"
            description="Images are compressed and saved directly in the database. They appear in PDF headers and signature blocks."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUploadField
                label="Company Logo"
                hint="PNG or JPEG — resized to 400 px wide"
                currentUrl={settings.logoUrl}
                type="logo"
                onProcessed={(url) => update({ logoUrl: url })}
                onRemoved={() => update({ logoUrl: undefined })}
              />
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Theme Colors</p>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.primaryColor ?? '#0B2857'}
                        onChange={(e) => update({ primaryColor: e.target.value })}
                        className="w-9 h-9 p-0.5 border border-slate-200 rounded cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-medium text-slate-600">Primary</p>
                        <p className="text-xs text-slate-400">{settings.primaryColor ?? '#0B2857'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.secondaryColor ?? '#F4B72B'}
                        onChange={(e) => update({ secondaryColor: e.target.value })}
                        className="w-9 h-9 p-0.5 border border-slate-200 rounded cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-medium text-slate-600">Accent</p>
                        <p className="text-xs text-slate-400">{settings.secondaryColor ?? '#F4B72B'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Authorized Signatory */}
          <SectionCard
            title="Authorized Signatory"
            description="Name, designation, and signature shown on the PDF signature block."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <Field label="Authorized Person Name">
                <TextInput
                  value={settings.authorizedPersonName}
                  onChange={(e) => update({ authorizedPersonName: e.target.value })}
                />
              </Field>
              <Field label="Designation">
                <TextInput
                  value={settings.designation}
                  onChange={(e) => update({ designation: e.target.value })}
                />
              </Field>
            </div>
            <ImageUploadField
              label="Signature Image"
              hint="PNG with transparent background — resized to 600 px wide"
              currentUrl={settings.signatureImage}
              type="signature"
              onProcessed={(url) => update({ signatureImage: url })}
              onRemoved={() => update({ signatureImage: undefined })}
            />
          </SectionCard>

          {/* Bank Details */}
          <SectionCard
            title="Bank Details"
            description="Optional. Shown on quotation PDFs when enabled below."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Bank Name">
                <TextInput value={settings.bankName} onChange={(e) => update({ bankName: e.target.value })} />
              </Field>
              <Field label="Account Name">
                <TextInput value={settings.accountName} onChange={(e) => update({ accountName: e.target.value })} />
              </Field>
              <Field label="Account Number" error={errors.accountNumber}>
                <TextInput value={settings.accountNumber} onChange={(e) => update({ accountNumber: e.target.value })} />
              </Field>
              <Field label="IFSC" error={errors.ifsc}>
                <TextInput value={settings.ifsc} onChange={(e) => update({ ifsc: e.target.value.toUpperCase() })} maxLength={11} />
              </Field>
              <Field label="Branch">
                <TextInput value={settings.branch} onChange={(e) => update({ branch: e.target.value })} />
              </Field>
              <Field label="UPI ID" error={errors.upiId}>
                <TextInput value={settings.upiId} onChange={(e) => update({ upiId: e.target.value })} />
              </Field>
            </div>
            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showBankOnPdf}
                onChange={(e) => update({ showBankOnPdf: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-[#0B2857]"
              />
              <span className="text-sm text-slate-700">Show bank details on quotation PDFs</span>
            </label>
          </SectionCard>
        </div>
      )}

      {/* ── Quotation Defaults tab ── */}
      {tab === 'defaults' && (
        <div className="space-y-6">
          <SectionCard title="Quotation Defaults" description="Default values applied when creating a new quotation.">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Quotation Prefix">
                <TextInput value={settings.prefix} onChange={(e) => update({ prefix: e.target.value })} />
              </Field>
              <Field label="Booking / Receipt Prefix">
                <TextInput
                  value={settings.bookingPrefix ?? ''}
                  onChange={(e) => update({ bookingPrefix: e.target.value })}
                />
              </Field>
              <Field label="Default Validity" error={errors.defaultValidity}>
                <Select value={settings.defaultValidity} onChange={(e) => update({ defaultValidity: e.target.value })}>
                  {VALIDITY_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                </Select>
              </Field>
              <Field label="Default State" error={errors.defaultState}>
                <Select value={settings.defaultState} onChange={(e) => update({ defaultState: e.target.value })}>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
              <Field label="Default Tax Name">
                <TextInput value={settings.defaultTaxName} onChange={(e) => update({ defaultTaxName: e.target.value })} />
              </Field>
              <Field label="Default Tax Rate (%)" error={errors.defaultTaxRate}>
                <TextInput
                  type="number"
                  value={settings.defaultTaxRate}
                  onChange={(e) => update({ defaultTaxRate: Number(e.target.value) })}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="Default Terms & Conditions"
            description="Loaded automatically when creating a new quotation."
            actions={
              <button
                onClick={() =>
                  update({
                    defaultTerms: [
                      ...settings.defaultTerms,
                      { id: uuid(), text: '', displayOrder: settings.defaultTerms.length },
                    ],
                  })
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-[#0B2857] rounded-lg"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            }
          >
            <div className="space-y-2">
              {settings.defaultTerms.map((term, idx) => (
                <div key={term.id} className="flex items-start gap-2 border border-slate-200 rounded-lg p-2">
                  <span className="text-sm text-slate-400 mt-1 shrink-0">{idx + 1}.</span>
                  <TextArea
                    rows={1}
                    value={term.text}
                    onChange={(e) =>
                      update({
                        defaultTerms: settings.defaultTerms.map((t) =>
                          t.id === term.id ? { ...t, text: e.target.value } : t,
                        ),
                      })
                    }
                    className="flex-1"
                  />
                  <button
                    onClick={() =>
                      update({ defaultTerms: settings.defaultTerms.filter((t) => t.id !== term.id) })
                    }
                    className="p-2 text-red-500 hover:bg-red-50 rounded shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
