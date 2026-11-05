import BrandLogo from '@/components/BrandLogo';
import { AppLoader, FileUploadProgress } from '@/components/loading/Loaders';
import { AppButton } from '@/components/ui/DesignSystem';
import { Field, SectionCard, Select, TextArea, TextInput } from '@/components/ui/Form';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { useToast } from '@/context/ToastContext';
import { INDIAN_STATES, VALIDITY_OPTIONS } from '@/lib/constants';
import { DEFAULT_SETTINGS } from '@/lib/defaults';
import type { CompanySettings } from '@/lib/models';
import { getSafeRedirectPath, validateCompanySettings } from '@/lib/utils';
import { CheckCircle2, Eye, EyeOff, FileText, Info, Loader2, Save, ShieldCheck, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const DEFAULT_TAX_OPTIONS = [
    { label: 'GST 5%', name: 'GST', rate: 5 },
    { label: 'GST 12%', name: 'GST', rate: 12 },
    { label: 'GST 18%', name: 'GST', rate: 18 },
    { label: 'GST 28%', name: 'GST', rate: 28 },
    { label: 'VAT 5%', name: 'VAT', rate: 5 },
    { label: 'No Tax', name: 'No Tax', rate: 0 },
] as const;

function compressImage(file: File, maxDim: number, quality: number, outputMime: 'image/jpeg' | 'image/png'): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;
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
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Unable to process this image.'));
                    return;
                }
                if (outputMime === 'image/jpeg') {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, width, height);
                }
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL(outputMime, quality));
            };
            img.onerror = () => reject(new Error('Unable to read the selected image.'));
            img.src = String(reader.result);
        };
        reader.onerror = () => reject(new Error('Unable to read the selected image.'));
        reader.readAsDataURL(file);
    });
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    return `${Math.round((bytes / 1024) * 10) / 10} KB`;
}

function dataUrlBytes(dataUrl: string): number {
    const base64 = dataUrl.split(',')[1] ?? '';
    return Math.round((base64.length * 3) / 4);
}

function maskAccountNumber(value: string): string {
    const digits = value.replace(/\s+/g, '');
    if (!digits) return '';
    if (digits.length <= 4) return '*'.repeat(digits.length);
    return `${'*'.repeat(digits.length - 4)}${digits.slice(-4)}`;
}

function UploadArea({
    label,
    hint,
    currentUrl,
    processing,
    onPick,
    onRemove,
    accept,
    variant,
}: {
    label: string;
    hint: string;
    currentUrl?: string;
    processing: boolean;
    onPick: (file: File) => void;
    onRemove: () => void;
    accept: string;
    variant: 'logo' | 'signature';
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const hasImage = Boolean(currentUrl);

    return (
        <div>
            <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-xs text-slate-500">{hint}</p>
                {hasImage ? (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-600 transition hover:bg-red-100"
                    >
                        <X className="h-3.5 w-3.5" /> Remove
                    </button>
                ) : null}
            </div>

            {hasImage ? (
                <div className="relative inline-block rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm">
                    {variant === 'logo' ? (
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-[#E2E8F0] bg-white">
                            <img src={currentUrl} alt={label} className="h-full w-full object-contain" />
                        </div>
                    ) : (
                        <img src={currentUrl} alt={label} className="h-12 max-w-[180px] rounded-md border border-[#E2E8F0] bg-slate-50 object-contain p-1" />
                    )}
                    <span className="absolute bottom-1.5 right-1.5 rounded-full bg-[#17243A]/80 px-1 py-0.5 text-[8px] font-medium text-white">
                        {formatBytes(dataUrlBytes(currentUrl ?? ''))}
                    </span>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={processing}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#A7B6D8] bg-[#F8FAFF] px-3 py-3 text-xs font-medium text-[#1D4ED8] transition hover:border-[#1D4ED8] hover:bg-[#EEF4FF] disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {processing ? 'Processing…' : hasImage ? 'Replace file' : 'Choose file'}
                </button>
            )}

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onPick(file);
                    if (e.target) e.target.value = '';
                }}
            />

            {processing && <div className="mt-1"><FileUploadProgress label={`Uploading ${label.toLowerCase()}…`} /></div>}
        </div>
    );
}

export default function CompanySetupPage() {
    const { user, logout } = useAuth();
    const { company, loading, createCompany } = useCompany();
    const navigate = useNavigate();
    const location = useLocation();
    const { push } = useToast();
    const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [logoProcessing, setLogoProcessing] = useState(false);
    const [signatureProcessing, setSignatureProcessing] = useState(false);
    const [showBankNumber, setShowBankNumber] = useState(false);
    const [bankNumberMasked, setBankNumberMasked] = useState(false);
    const initialSettingsRef = useRef<CompanySettings>(DEFAULT_SETTINGS);

    useEffect(() => {
        if (company && !loading) {
            navigate(getSafeRedirectPath(location, '/dashboard'), { replace: true });
        }
    }, [company, loading, location, navigate]);

    useEffect(() => {
        if (user && !company) {
            const nextSettings = { ...DEFAULT_SETTINGS };
            setSettings(nextSettings);
            initialSettingsRef.current = nextSettings;
        }
    }, [user, company]);

    const hasUnsavedChanges = useMemo(
        () => JSON.stringify(settings) !== JSON.stringify(initialSettingsRef.current),
        [settings],
    );

    useEffect(() => {
        if (!hasUnsavedChanges) return;

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const fieldError = (field: string) => (
        touched[field] || Object.keys(errors).length > 0 ? errors[field] : undefined
    );

    const update = (patch: Partial<CompanySettings>) => {
        setSettings((prev) => ({ ...prev, ...patch }));
        if ('accountNumber' in patch) {
            setBankNumberMasked(false);
            setShowBankNumber(true);
        }
        setErrors({});
    };

    const handleBlur = (field: string) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        setErrors(validateCompanySettings(settings));
    };

    const handleImageFile = async (file: File | null, key: 'logoUrl' | 'signatureImage') => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            push('error', 'Please upload a valid image file (PNG, JPG or WebP).');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            push('error', 'Please keep each image under 2 MB for a faster, cleaner PDF output.');
            return;
        }

        if (key === 'logoUrl') setLogoProcessing(true);
        else setSignatureProcessing(true);

        try {
            const maxDim = key === 'logoUrl' ? 400 : 600;
            const quality = key === 'logoUrl' ? 0.82 : 0.92;
            const outputMime = key === 'logoUrl' ? 'image/jpeg' : 'image/png';
            const dataUrl = await compressImage(file, maxDim, quality, outputMime);
            update({ [key]: dataUrl } as Partial<CompanySettings>);
            push('success', `${key === 'logoUrl' ? 'Logo' : 'Signature'} uploaded successfully.`);
        } catch (error) {
            push('error', error instanceof Error ? error.message : 'Unable to process that image. Please try again.');
        } finally {
            if (key === 'logoUrl') setLogoProcessing(false);
            else setSignatureProcessing(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;

        const nextErrors = validateCompanySettings(settings);
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            setTouched({
                companyName: true,
                mobile: true,
                email: true,
                website: true,
                pincode: true,
                ifsc: true,
                accountNumber: true,
                upiId: true,
                pan: true,
                gstin: true,
                defaultValidity: true,
                defaultState: true,
                defaultTaxRate: true,
            });
            push('error', 'Please fix the highlighted fields and save again.');
            return;
        }

        setSaving(true);
        const created = await createCompany(settings);
        setSaving(false);
        if (created) {
            setBankNumberMasked(true);
            setShowBankNumber(false);
            setErrors({});
            push('success', 'Company profile saved successfully.');
            navigate(getSafeRedirectPath(location, '/dashboard'), { replace: true });
        } else {
            push('error', 'Unable to save company profile now. Please try again.');
        }
    };

    const handleSignOut = async () => {
        await logout();
        navigate('/', { replace: true });
    };

    const taxPresetValue = DEFAULT_TAX_OPTIONS.find(
        (option) => option.name === settings.defaultTaxName && option.rate === settings.defaultTaxRate,
    )?.label ?? 'custom';

    const displayAccountNumber = bankNumberMasked && !showBankNumber ? maskAccountNumber(settings.accountNumber) : settings.accountNumber;
    const prefixExample = (settings.prefix || 'DOC/QTN').trim() || 'DOC/QTN';
    const bookingExample = (settings.bookingPrefix || 'DOC/RCP').trim() || 'DOC/RCP';

    if (loading) {
        return <AppLoader message="Loading company details…" />;
    }

    return (
        <div className="min-h-screen bg-[#F7F9FC]">
            <header className="bg-[#17243A]">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <BrandLogo size="md" onDark />
                    <button onClick={handleSignOut} className="text-sm font-medium text-white/70 transition hover:text-white">
                        Sign out
                    </button>
                </div>
            </header>

            <div className="mx-auto max-w-6xl space-y-3 px-4 py-4 pb-24 sm:px-5 [&_.input-shell]:min-h-[36px] [&_.input-shell]:rounded-lg [&_.input-shell]:px-2.5 [&_.input-shell]:py-1.5 [&_.input-shell]:text-[13px] [&_.surface-card>div:first-child]:px-4 [&_.surface-card>div:first-child]:py-2.5 [&_.surface-card>div:last-child]:p-3 md:[&_.surface-card>div:last-child]:p-4 [&_label]:mb-0.5 [&_label]:text-[11px] [&_label]:tracking-[0.04em]">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-lg font-bold text-[#0B234A]">Company Setup</h1>
                        <p className="text-[11px] text-slate-500">Complete essentials now and add optional branding and banking later.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasUnsavedChanges ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                <Info className="h-3.5 w-3.5" /> Unsaved changes
                            </span>
                        ) : null}
                        <AppButton onClick={handleSave} loading={saving} loadingText="Saving company…">
                            <Save className="h-4 w-4" /> Save Company
                        </AppButton>
                    </div>
                </div>

                <SectionCard title="Essential Company Profile" description="Required for quotations, receipts, and branding.">
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                        <Field label="Company Name" required={true} error={fieldError('companyName')}>
                            <TextInput
                                value={settings.companyName}
                                onBlur={() => handleBlur('companyName')}
                                onChange={(e) => update({ companyName: e.target.value })}
                                placeholder="BuilderDocs Projects Pvt. Ltd."
                            />
                        </Field>

                        <Field label="Phone" error={fieldError('mobile')}>
                            <TextInput
                                type="tel"
                                inputMode="numeric"
                                maxLength={10}
                                value={settings.mobile}
                                onBlur={() => handleBlur('mobile')}
                                onChange={(e) => update({ mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                placeholder="98765 43210"
                            />
                        </Field>

                        <Field label="Email" error={fieldError('email')}>
                            <TextInput
                                type="email"
                                value={settings.email}
                                onBlur={() => handleBlur('email')}
                                onChange={(e) => update({ email: e.target.value })}
                                placeholder="hello@yourcompany.com"
                            />
                        </Field>

                        <Field label="Address" className="md:col-span-2 lg:col-span-1">
                            <TextArea
                                rows={2}
                                className="min-h-[62px]"
                                value={settings.address}
                                onChange={(e) => update({ address: e.target.value })}
                                placeholder="Plot 12, ABC Industrial Estate, ..."
                            />
                        </Field>

                        <Field label="City / Town">
                            <TextInput
                                value={settings.city}
                                onChange={(e) => update({ city: e.target.value })}
                                placeholder="Hyderabad"
                            />
                        </Field>

                        <Field label="State">
                            <Select value={settings.state} onChange={(e) => update({ state: e.target.value })}>
                                {INDIAN_STATES.map((state) => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
                            </Select>
                        </Field>

                        <Field label="PIN Code" error={fieldError('pincode')}>
                            <TextInput
                                maxLength={6}
                                value={settings.pincode}
                                onBlur={() => handleBlur('pincode')}
                                onChange={(e) => update({ pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                placeholder="500001"
                            />
                        </Field>

                        <Field label="Website" error={fieldError('website')}>
                            <TextInput
                                type="url"
                                value={settings.website}
                                onBlur={() => handleBlur('website')}
                                onChange={(e) => update({ website: e.target.value })}
                                placeholder="https://example.com"
                            />
                        </Field>

                        <Field label="GSTIN" error={fieldError('gstin')}>
                            <TextInput
                                maxLength={15}
                                value={settings.gstin}
                                onBlur={() => handleBlur('gstin')}
                                onChange={(e) => update({ gstin: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                                placeholder="37ABCDE1234F2Z5"
                            />
                        </Field>

                        <Field label="PAN" error={fieldError('pan')}>
                            <TextInput
                                maxLength={10}
                                value={settings.pan ?? ''}
                                onBlur={() => handleBlur('pan')}
                                onChange={(e) => update({ pan: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                                placeholder="ABCDE1234F"
                            />
                        </Field>
                    </div>
                </SectionCard>

                <SectionCard title="Branding & Document Preview" description="Keep quotation and receipt branding consistent.">
                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-[0.85fr_1.15fr]">
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-1">
                            <Field label="Company Logo">
                                <UploadArea
                                    label="Logo"
                                    hint="PNG, JPG, or WebP"
                                    currentUrl={settings.logoUrl}
                                    processing={logoProcessing}
                                    onPick={(file) => void handleImageFile(file, 'logoUrl')}
                                    onRemove={() => update({ logoUrl: '' })}
                                    accept="image/png,image/jpeg,image/webp"
                                    variant="logo"
                                />
                            </Field>

                            <Field label="Signature">
                                <UploadArea
                                    label="Signature"
                                    hint="PNG transparent background preferred"
                                    currentUrl={settings.signatureImage}
                                    processing={signatureProcessing}
                                    onPick={(file) => void handleImageFile(file, 'signatureImage')}
                                    onRemove={() => update({ signatureImage: '' })}
                                    accept="image/png,image/jpeg,image/webp"
                                    variant="signature"
                                />
                            </Field>

                            <Field label="Brand Colors" className="md:col-span-2 lg:col-span-3 xl:col-span-2">
                                <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white p-2">
                                    <div className="flex items-center gap-2 rounded-md border border-slate-100 px-2 py-1.5">
                                        <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-500">Primary</span>
                                        <input
                                            type="color"
                                            value={settings.primaryColor}
                                            onChange={(e) => update({ primaryColor: e.target.value })}
                                            className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
                                        />
                                        <span className="text-[11px] text-slate-600">{settings.primaryColor}</span>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-md border border-slate-100 px-2 py-1.5">
                                        <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-500">Accent</span>
                                        <input
                                            type="color"
                                            value={settings.secondaryColor}
                                            onChange={(e) => update({ secondaryColor: e.target.value })}
                                            className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
                                        />
                                        <span className="text-[11px] text-slate-600">{settings.secondaryColor}</span>
                                    </div>
                                </div>
                            </Field>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm xl:min-h-[380px]">
                            <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-[#1D4ED8]" />
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">Document preview</span>
                                </div>
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[8px] font-medium text-emerald-700">Live</span>
                            </div>

                            <div className="overflow-hidden rounded-lg border border-slate-200">
                                <div className="flex items-center justify-between gap-3 px-3 py-3" style={{ background: settings.primaryColor, color: '#fff' }}>
                                    <div className="flex items-center gap-2.5">
                                        {settings.logoUrl ? (
                                            <img src={settings.logoUrl} alt="Preview logo" className="h-10 w-10 rounded-full border border-white/50 bg-white object-contain p-1" />
                                        ) : (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/10 text-[10px] font-bold">Logo</div>
                                        )}
                                        <div>
                                            <div className="text-sm font-bold">{settings.companyName || 'Your Company Name'}</div>
                                            <div className="text-[10px] opacity-80">{settings.city || 'City'} • {settings.state}</div>
                                        </div>
                                    </div>
                                    <div className="text-right text-[10px] font-medium opacity-90">
                                        <div>QTN-001</div>
                                        <div>RCP-001</div>
                                    </div>
                                </div>
                                <div className="space-y-1.5 p-3 text-[11px] text-slate-700">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                        <span className="text-slate-500">Email</span>
                                        <span>{settings.email || 'hello@company.com'}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                        <span className="text-slate-500">Phone</span>
                                        <span>{settings.mobile || '98765 43210'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Brand accent</span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <span className="h-3.5 w-3.5 rounded-full border border-slate-200" style={{ background: settings.secondaryColor }} />
                                            {settings.secondaryColor || '#F4B72B'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </SectionCard>

                <SectionCard title="Banking & Document Defaults" description="Optional banking details and defaults for new documents.">
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                        <Field label="Bank Name">
                            <TextInput value={settings.bankName} onChange={(e) => update({ bankName: e.target.value })} placeholder="HDFC Bank Ltd." />
                        </Field>
                        <Field label="Account Name">
                            <TextInput value={settings.accountName} onChange={(e) => update({ accountName: e.target.value })} placeholder="BuilderDocs Projects Pvt. Ltd." />
                        </Field>
                        <Field label="Account Number" error={fieldError('accountNumber')}>
                            <div className="relative">
                                <TextInput
                                    value={displayAccountNumber}
                                    onBlur={() => handleBlur('accountNumber')}
                                    onChange={(e) => update({ accountNumber: e.target.value.replace(/\D/g, '') })}
                                    placeholder="123456789012"
                                    type={showBankNumber || !bankNumberMasked ? 'text' : 'password'}
                                />
                                {settings.accountNumber ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (bankNumberMasked) {
                                                setShowBankNumber((prev) => !prev);
                                                return;
                                            }
                                            setShowBankNumber((prev) => !prev);
                                        }}
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded text-slate-500 hover:text-slate-700"
                                        aria-label="Toggle account number visibility"
                                    >
                                        {showBankNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                ) : null}
                            </div>
                        </Field>
                        <Field label="IFSC" error={fieldError('ifsc')}>
                            <TextInput
                                value={settings.ifsc}
                                onBlur={() => handleBlur('ifsc')}
                                onChange={(e) => update({ ifsc: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                                maxLength={11}
                                placeholder="HDFC0001234"
                            />
                        </Field>
                        <Field label="Branch">
                            <TextInput value={settings.branch} onChange={(e) => update({ branch: e.target.value })} placeholder="Banjara Hills" />
                        </Field>
                        <Field label="UPI ID" error={fieldError('upiId')}>
                            <TextInput
                                value={settings.upiId}
                                onBlur={() => handleBlur('upiId')}
                                onChange={(e) => update({ upiId: e.target.value })}
                                placeholder="username@upi"
                            />
                        </Field>
                        <Field label="Quotation Prefix">
                            <TextInput value={settings.prefix} onChange={(e) => update({ prefix: e.target.value })} placeholder="DOC/QTN" />
                        </Field>
                        <Field label="Booking Prefix">
                            <TextInput value={settings.bookingPrefix ?? ''} onChange={(e) => update({ bookingPrefix: e.target.value })} placeholder="DOC/RCP" />
                        </Field>
                        <Field label="Default Validity" required={true} error={fieldError('defaultValidity')}>
                            <Select value={settings.defaultValidity} onChange={(e) => update({ defaultValidity: e.target.value })}>
                                {VALIDITY_OPTIONS.map((value) => (
                                    <option key={value} value={value}>{value}</option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Default State" required={true} error={fieldError('defaultState')}>
                            <Select value={settings.defaultState} onChange={(e) => update({ defaultState: e.target.value })}>
                                {INDIAN_STATES.map((state) => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Default Tax" error={fieldError('defaultTaxRate')}>
                            <Select
                                value={taxPresetValue}
                                onChange={(e) => {
                                    const selected = DEFAULT_TAX_OPTIONS.find((option) => option.label === e.target.value);
                                    if (selected) {
                                        update({ defaultTaxName: selected.name, defaultTaxRate: selected.rate });
                                        return;
                                    }
                                    update({ defaultTaxName: settings.defaultTaxName || 'GST', defaultTaxRate: Number(settings.defaultTaxRate) || 0 });
                                }}
                            >
                                {DEFAULT_TAX_OPTIONS.map((option) => (
                                    <option key={option.label} value={option.label}>{option.label}</option>
                                ))}
                                <option value="custom">Custom</option>
                            </Select>
                        </Field>
                        <Field label="Default Tax Rate (%)" error={fieldError('defaultTaxRate')}>
                            <TextInput
                                type="number"
                                min={0}
                                step={0.01}
                                value={Number(settings.defaultTaxRate) || 0}
                                onBlur={() => handleBlur('defaultTaxRate')}
                                onChange={(e) => {
                                    const nextRate = Number(e.target.value);
                                    update({ defaultTaxRate: Number.isFinite(nextRate) ? nextRate : 0 });
                                }}
                            />
                        </Field>
                    </div>
                </SectionCard>

                <div className="flex flex-wrap items-center justify-between rounded-xl border border-[#DCE7FF] bg-[#F4F8FF] px-3 py-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2 text-[#0B234A]">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#1D4ED8]" />
                        Basic company details are saved independently from optional branding, banking, and GST details.
                    </div>
                    <div className="inline-flex items-center gap-2 text-slate-500">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Save is not blocked by missing logo, signature, GSTIN, PAN, or bank details.
                    </div>
                </div>

                <div className="sticky bottom-0 z-20 border-t border-[#D9E3FF] bg-white/95 px-3 py-2 shadow-[0_-8px_24px_rgba(23,36,58,0.08)] backdrop-blur-sm">
                    <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
                        <div className="text-xs text-slate-500">
                            {hasUnsavedChanges ? 'You have unsaved changes.' : 'All changes saved.'}
                        </div>
                        <AppButton onClick={handleSave} loading={saving} loadingText="Saving company…" className="min-w-[150px] py-2 text-sm">
                            <Save className="h-4 w-4" /> Save & Continue
                        </AppButton>
                    </div>
                </div>
            </div>
        </div>
    );
}

