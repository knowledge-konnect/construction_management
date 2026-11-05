import { AppLoader, FileUploadProgress } from '@/components/loading/Loaders';
import { AppButton, PageHeader } from '@/components/ui/DesignSystem';
import { Field, SectionCard, Select, TextArea, TextInput } from '@/components/ui/Form';
import { useCompany } from '@/context/CompanyContext';
import { useToast } from '@/context/ToastContext';
import { BUSINESS_MODEL_OPTIONS, type BusinessModel } from '@/lib/businessModels';
import { INDIAN_STATES, VALIDITY_OPTIONS } from '@/lib/constants';
import type { CompanySettings } from '@/lib/models';
import { validateCompanySettings } from '@/lib/utils';
import { listProjects } from '@/services/project.service';
import { Building2, Check, ImageIcon, Loader2, Plus, Save, Sliders, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';

type Tab = 'company' | 'business-models' | 'defaults';

// ── Image compression helper ──────────────────────────────────────────────────
// Draws the image onto a canvas, resizes it to maxDim, and returns a base64
// data URL. Logo uses JPEG (smaller), signature uses PNG (preserves transparency).
function compressImage(file: File, maxDim: number, quality: number, outputMime: 'image/jpeg' | 'image/png'): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read the selected file.'));
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Unable to process the selected image.'));
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

        // Fill a white canvas only for JPEG outputs.
        if (outputMime === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL(outputMime, quality));
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

function hexToRgb(hex: string) {
  const value = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return null;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return { r, g, b };
}

function relativeLuminance(r: number, g: number, b: number) {
  const map = [r, g, b].map((v) => {
    const srgb = v / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * map[0] + 0.7152 * map[1] + 0.0722 * map[2];
}

function contrastRatio(hexA: string, hexB: string) {
  const rgbA = hexToRgb(hexA);
  const rgbB = hexToRgb(hexB);
  if (!rgbA || !rgbB) return null;
  const l1 = relativeLuminance(rgbA.r, rgbA.g, rgbA.b);
  const l2 = relativeLuminance(rgbB.r, rgbB.g, rgbB.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function normalizeHexColor(value: string): string | null {
  const compact = value.trim().replace(/^#/, '').toUpperCase();
  if (/^[0-9A-F]{3}$/.test(compact)) {
    return `#${compact.split('').map((c) => `${c}${c}`).join('')}`;
  }
  if (/^[0-9A-F]{6}$/.test(compact)) {
    return `#${compact}`;
  }
  return null;
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
      push('error', 'Please upload a valid image file (PNG, JPEG, or WebP).');
      return;
    }

    setProcessing(true);
    try {
      const maxDim = type === 'logo' ? 400 : 600;
      const quality = type === 'logo' ? 0.82 : 0.92;
      const outputMime = type === 'logo' ? 'image/jpeg' : 'image/png';
      const dataUrl = await compressImage(file, maxDim, quality, outputMime);
      const kb = Math.round(dataUrlBytes(dataUrl) / 1024);
      onProcessed(dataUrl);
      push('success', `${label} is ready (${kb} KB). Please click "Save Settings" to apply it.`);
    } catch (err) {
      push('error', err instanceof Error ? err.message : 'Unable to process image right now. Please try again.');
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
          {type === 'logo' ? (
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-white p-2 shadow-sm">
              <img
                src={currentUrl}
                alt={label}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <img
              src={currentUrl}
              alt={label}
              className="h-16 max-w-[200px] object-contain rounded border border-slate-200 bg-slate-50 p-1.5"
            />
          )}
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#1D4ED8] border border-[#1D4ED8]/30 hover:bg-[#1D4ED8]/5 rounded-lg disabled:opacity-60"
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

      {processing && <div className="mt-2"><FileUploadProgress label={`Uploading ${label.toLowerCase()}…`} /></div>}
    </div>
  );
}

// ── Main SettingsPage ─────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { push } = useToast();
  const { company, updateSettings, loading } = useCompany();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [usedBusinessModels, setUsedBusinessModels] = useState<BusinessModel[]>([]);
  const [tab, setTab] = useState<Tab>('company');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoProcessing, setLogoProcessing] = useState(false);

  useEffect(() => {
    if (company) setSettings({ ...company.settings });
  }, [company]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const rows = await listProjects();
      if (!active) return;
      const models = rows
        .map((project) => project.businessModel)
        .filter((value): value is BusinessModel => Boolean(value));
      setUsedBusinessModels([...new Set(models)]);
    })();
    return () => { active = false; };
  }, [company?.companyId]);

  const validateSettings = validateCompanySettings;

  const primaryColor = settings?.primaryColor ?? '#1D4ED8';
  const accentColor = settings?.secondaryColor ?? '#F4B72B';

  const isLowContrastTheme = useMemo(() => {
    const ratio = contrastRatio(primaryColor, accentColor);
    return ratio !== null && ratio < 2.2;
  }, [primaryColor, accentColor]);

  const canUseEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;

  if (loading || !settings) {
    return <AppLoader fullscreen={false} message="Loading settings…" />;
  }

  const update = (patch: Partial<CompanySettings>) => {
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev));
    setErrors({});
  };

  const handleSave = async () => {
    if (!settings) return;
    const nextErrors = validateSettings(settings);
    const enabledModels = settings.enabledBusinessModels ?? [];
    if (!enabledModels.length) {
      setErrors({ enabledBusinessModels: 'At least one business model must remain enabled.' });
      push('error', 'At least one business model must remain enabled.');
      return;
    }
    const disabledUsedModels = usedBusinessModels.filter((model) => !enabledModels.includes(model));
    if (disabledUsedModels.length > 0) {
      setErrors({ enabledBusinessModels: `Cannot disable models in use: ${disabledUsedModels.join(', ')}.` });
      push('error', `Cannot disable models currently in use: ${disabledUsedModels.join(', ')}.`);
      return;
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      push('error', 'Please fix the highlighted fields and save again.');
      return;
    }
    setSaving(true);
    const ok = await updateSettings(settings);
    setSaving(false);
    if (ok) push('success', 'Settings updated successfully. New values are now applied to future documents.');
    else push('error', 'Unable to save settings now. Please try again.');
  };

  const applyHexColor = (target: 'primary' | 'accent', value: string) => {
    const normalized = normalizeHexColor(value);
    if (!normalized) {
      push('error', 'Please enter a valid hex color like #1D4ED8 or #1D4.');
      return;
    }
    if (target === 'primary') update({ primaryColor: normalized });
    else update({ secondaryColor: normalized });
  };

  const pickColorFromScreen = async (target: 'primary' | 'accent') => {
    if (!canUseEyeDropper) {
      push('error', 'Screen color picker is not supported in this browser.');
      return;
    }
    try {
      const EyeDropperCtor = (window as any).EyeDropper;
      const eyeDropper = new EyeDropperCtor();
      const result = await eyeDropper.open();
      const color = normalizeHexColor(result?.sRGBHex ?? '');
      if (!color) return;
      if (target === 'primary') update({ primaryColor: color });
      else update({ secondaryColor: color });
    } catch {
      // User cancellation is expected, so no toast needed.
    }
  };

  const handleLogoFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      push('error', 'Please upload a valid logo file (PNG, JPEG, or WebP).');
      return;
    }

    setLogoProcessing(true);
    try {
      const dataUrl = await compressImage(file, 400, 0.82, 'image/jpeg');
      const kb = Math.round(dataUrlBytes(dataUrl) / 1024);
      update({ logoUrl: dataUrl });
      push('success', `Logo is ready (${kb} KB). Click "Save Settings" to apply it.`);
    } catch (err) {
      push('error', err instanceof Error ? err.message : 'Unable to process logo right now. Please try again.');
    } finally {
      setLogoProcessing(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const tabs: { key: Tab; label: string; icon: typeof Building2 }[] = [
    { key: 'company', label: 'Company Profile', icon: Building2 },
    { key: 'business-models', label: 'Business Models', icon: Sliders },
    { key: 'defaults', label: 'Quotation Defaults', icon: Sliders },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        actions={
          <AppButton onClick={handleSave} loading={saving} loadingText="Saving settings…">
            <Save className="h-4 w-4" />
            Save Settings
          </AppButton>
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 border-b border-slate-200">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.key
                ? 'border-[#1D4ED8] text-[#1D4ED8]'
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
            description="Appears on all quotations and payment receipts."
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
                <TextInput type="tel" inputMode="numeric" maxLength={10} value={settings.mobile} onChange={(e) => update({ mobile: e.target.value })} />
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
                  placeholder="e.g. 37ABCDE1234F2Z5"
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
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Logo appears in quotation/invoice headers. Signature (in Authorized Signatory) appears in the PDF sign-off block.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50/30 p-4">
                  <p className="text-sm font-semibold text-slate-800 mb-1">Company Logo</p>
                  <p className="text-xs text-slate-600 mb-3">PNG/JPEG recommended. Auto-optimized for PDF header quality.</p>

                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                        {settings.logoUrl ? (
                          <img src={settings.logoUrl} alt="Company logo" className="h-full w-full object-contain" />
                        ) : (
                          <div className="text-xs text-slate-400 text-center leading-4">No logo</div>
                        )}
                      </div>
                      {settings.logoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            update({ logoUrl: undefined });
                            if (logoInputRef.current) logoInputRef.current.value = '';
                          }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow"
                          title="Remove logo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={logoProcessing}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#1D4ED8] border border-[#1D4ED8]/30 hover:bg-[#1D4ED8]/5 rounded-lg disabled:opacity-60"
                      >
                        {logoProcessing
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Compressing…</>
                          : <><Upload className="w-4 h-4" /> {settings.logoUrl ? 'Replace logo' : 'Choose logo'}</>
                        }
                      </button>
                      <p className="text-xs text-slate-500">Best result: square logo with clear foreground.</p>
                    </div>
                  </div>

                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleLogoFile(f);
                    }}
                  />

                  {logoProcessing && <div className="mt-2"><FileUploadProgress label="Uploading company logo…" /></div>}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/30 p-4">
                  <p className="text-sm font-semibold text-slate-800 mb-1">Theme Colors</p>
                  <p className="text-xs text-slate-600 mb-3">
                    Match your website colors: use swatch picker, paste hex code, or pick directly from screen.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-slate-700 mb-1">Primary</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => update({ primaryColor: e.target.value })}
                          className="w-10 h-10 p-0.5 border border-slate-200 rounded cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <TextInput
                            value={primaryColor}
                            onChange={(e) => update({ primaryColor: e.target.value })}
                            onBlur={(e) => applyHexColor('primary', e.target.value)}
                            placeholder="#1D4ED8"
                          />
                        </div>
                        {canUseEyeDropper && (
                          <button
                            type="button"
                            onClick={() => void pickColorFromScreen('primary')}
                            className="h-10 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Pick
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-700 mb-1">Accent</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={accentColor}
                          onChange={(e) => update({ secondaryColor: e.target.value })}
                          className="w-10 h-10 p-0.5 border border-slate-200 rounded cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <TextInput
                            value={accentColor}
                            onChange={(e) => update({ secondaryColor: e.target.value })}
                            onBlur={(e) => applyHexColor('accent', e.target.value)}
                            placeholder="#F4B72B"
                          />
                        </div>
                        {canUseEyeDropper && (
                          <button
                            type="button"
                            onClick={() => void pickColorFromScreen('accent')}
                            className="h-10 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Pick
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => update({ primaryColor: '#1D4ED8', secondaryColor: '#F4B72B' })}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
                    >
                      Reset to Default Colors
                    </button>
                  </div>

                  {isLowContrastTheme && (
                    <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
                      Selected colors are very close. PDF headings may be less readable.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 text-white text-xs font-semibold tracking-wide" style={{ backgroundColor: primaryColor }}>
                  Brand Preview
                </div>
                <div className="p-4 bg-white space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white p-1.5">
                        {settings.logoUrl ? (
                          <img src={settings.logoUrl} alt="Preview logo" className="h-full w-full object-contain" />
                        ) : (
                          <span className="text-[10px] text-slate-400">LOGO</span>
                        )}
                      </div>
                      <div>
                        <p className="text-base font-semibold text-slate-800 leading-5">{settings.companyName || 'Your Company Name'}</p>
                        <p className="text-sm text-slate-600">{settings.tagline || 'Your company tagline appears here.'}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: accentColor }}>
                      Accent Style
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="rounded-lg border border-slate-200 p-2.5">
                      <p className="text-xs text-slate-500 mb-1">Sample heading</p>
                      <p className="text-sm font-semibold" style={{ color: primaryColor }}>Quotation Summary</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-2.5">
                      <p className="text-xs text-slate-500 mb-1">Sample highlight</p>
                      <div className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-white" style={{ backgroundColor: accentColor }}>
                        Approved
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
                className="w-4 h-4 rounded border-slate-300 text-[#1D4ED8]"
              />
              <span className="text-sm text-slate-700">Show bank details on quotation PDFs</span>
            </label>
          </SectionCard>
        </div>
      )}

      {/* ── Quotation Defaults tab ── */}
      {tab === 'business-models' && (
        <div className="space-y-6">
          <SectionCard
            title="Enabled business models"
            description="Choose which project models are available for this company. Models already used by existing projects remain locked until reassigned."
          >
            <div className="space-y-3">
              {BUSINESS_MODEL_OPTIONS.map((option) => {
                const enabled = (settings.enabledBusinessModels ?? []).includes(option.value);
                const isLocked = usedBusinessModels.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${enabled ? 'border-[#DBEAFE] bg-[#F8FAFC]' : 'border-slate-200 bg-white'} ${isLocked ? 'opacity-90' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={isLocked}
                      onChange={() => {
                        const current = settings.enabledBusinessModels ?? [];
                        const next = enabled
                          ? current.filter((value) => value !== option.value)
                          : [...current, option.value];
                        update({ enabledBusinessModels: next });
                      }}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-[#1D4ED8]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-[#17243A]">{option.label}</p>
                        {isLocked && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                            <Check className="h-3 w-3" /> In use
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-[#667085]">{option.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </SectionCard>
        </div>
      )}

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
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-[#1D4ED8] rounded-lg"
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

