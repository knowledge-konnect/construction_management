import Logo from '@/components/Logo';
import { AppButton } from '@/components/ui/DesignSystem';
import { Field, SectionCard, Select, TextArea, TextInput } from '@/components/ui/Form';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { useToast } from '@/context/ToastContext';
import { INDIAN_STATES, VALIDITY_OPTIONS } from '@/lib/constants';
import { DEFAULT_SETTINGS } from '@/lib/defaults';
import type { CompanySettings } from '@/lib/models';
import { getSafeRedirectPath, validateCompanySettings } from '@/lib/utils';
import { Loader2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function CompanySetupPage() {
    const { user, logout } = useAuth();
    const { company, loading, createCompany } = useCompany();
    const navigate = useNavigate();
    const location = useLocation();
    const { push } = useToast();
    const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
    const [saving, setSaving] = useState(false);

    const handleSignOut = async () => {
        await logout();
        navigate('/login');
    };

    useEffect(() => {
        if (company && !loading) {
            navigate(getSafeRedirectPath(location, '/dashboard'), { replace: true });
        }
    }, [company, loading, location, navigate]);

    useEffect(() => {
        if (user && !company) {
            setSettings(DEFAULT_SETTINGS);
        }
    }, [user, company]);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const update = (patch: Partial<CompanySettings>) => {
        setSettings((prev) => ({ ...prev, ...patch }));
        setErrors({});
    };

    const handleImageFile = async (file: File | null, key: 'logoUrl' | 'signatureImage') => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            update({ [key]: dataUrl } as Partial<CompanySettings>);
        };
        reader.onerror = () => {
            push('error', 'Unable to read the selected image file. Please try another file.');
        };
        reader.readAsDataURL(file);
    };

    const validateSettings = validateCompanySettings;

    const handleSave = async () => {
        if (!user) return;

        const nextErrors = validateSettings(settings);
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            push('error', 'Please fix the highlighted fields and save again.');
            return;
        }

        setSaving(true);
        const created = await createCompany(settings);
        setSaving(false);
        if (created) {
            push('success', 'Company profile saved successfully.');
            navigate(getSafeRedirectPath(location, '/dashboard'), { replace: true });
        } else {
            push('error', 'Unable to save company profile now. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="py-20 text-center text-slate-500">
                <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#1D4ED8]" />
                    <span>Loading company details…</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7F9FC]">
            <header className="bg-[#17243A]">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Logo size="md" />
                    <button onClick={handleSignOut} className="text-sm font-medium text-white/70 hover:text-white">
                        Sign out
                    </button>
                </div>
            </header>
            <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0B234A]">Company Setup</h1>
                        <p className="text-sm text-slate-500">Complete your company profile before using the quotation manager.</p>
                    </div>
                    <AppButton onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Company'}
                    </AppButton>
                </div>

                <SectionCard title="Company Information" description="This information will be used across quotations and receipts.">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Field label="Company Name" error={errors.companyName}><TextInput value={settings.companyName} onChange={(e) => update({ companyName: e.target.value })} required /></Field>
                        <Field label="Company Logo">
                            <input type="file" accept="image/*" onChange={(e) => handleImageFile(e.target.files?.[0] ?? null, 'logoUrl')} />
                            {settings.logoUrl ? (
                                <div className="mt-2 flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-white p-2 shadow-sm">
                                    <img src={settings.logoUrl} alt="Company logo preview" className="h-full w-full object-contain" />
                                </div>
                            ) : null}
                            <div className="text-xs text-slate-500 mt-1">PNG or JPEG image for PDFs.</div>
                        </Field>
                        <Field label="Address"><TextArea rows={2} value={settings.address} onChange={(e) => update({ address: e.target.value })} /></Field>
                        <Field label="Phone" error={errors.mobile}><TextInput type="tel" inputMode="numeric" maxLength={10} value={settings.mobile} onChange={(e) => update({ mobile: e.target.value })} /></Field>
                        <Field label="Email" error={errors.email}><TextInput type="email" value={settings.email} onChange={(e) => update({ email: e.target.value })} /></Field>
                        <Field label="Website" error={errors.website}><TextInput type="url" value={settings.website} onChange={(e) => update({ website: e.target.value })} /></Field>
                        <Field label="City / Town"><TextInput value={settings.city} onChange={(e) => update({ city: e.target.value })} /></Field>
                        <Field label="State"><Select value={settings.state} onChange={(e) => update({ state: e.target.value })}>{INDIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}</Select></Field>
                        <Field label="PIN Code" error={errors.pincode}><TextInput maxLength={6} value={settings.pincode} onChange={(e) => update({ pincode: e.target.value })} /></Field>
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
                        <Field label="Primary Color"><input type="color" value={settings.primaryColor} onChange={(e) => update({ primaryColor: e.target.value })} className="w-20 h-10 p-0 border-0" /></Field>
                        <Field label="Secondary Color"><input type="color" value={settings.secondaryColor} onChange={(e) => update({ secondaryColor: e.target.value })} className="w-20 h-10 p-0 border-0" /></Field>
                        <Field label="Authorized Person"><TextInput value={settings.authorizedPersonName} onChange={(e) => update({ authorizedPersonName: e.target.value })} /></Field>
                        <Field label="Designation"><TextInput value={settings.designation} onChange={(e) => update({ designation: e.target.value })} /></Field>
                        <Field label="Signature"><input type="file" accept="image/*" onChange={(e) => handleImageFile(e.target.files?.[0] ?? null, 'signatureImage')} /><div className="text-xs text-slate-500 mt-1">Optional signature image for PDFs.</div></Field>
                    </div>
                </SectionCard>

                <SectionCard title="Bank & Document Defaults" description="Configure your banking details and document prefixes.">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Field label="Bank Name"><TextInput value={settings.bankName} onChange={(e) => update({ bankName: e.target.value })} /></Field>
                        <Field label="Account Name"><TextInput value={settings.accountName} onChange={(e) => update({ accountName: e.target.value })} /></Field>
                        <Field label="Account Number" error={errors.accountNumber}><TextInput value={settings.accountNumber} onChange={(e) => update({ accountNumber: e.target.value })} /></Field>
                        <Field label="IFSC" error={errors.ifsc}><TextInput value={settings.ifsc} onChange={(e) => update({ ifsc: e.target.value.toUpperCase() })} maxLength={11} /></Field>
                        <Field label="Branch"><TextInput value={settings.branch} onChange={(e) => update({ branch: e.target.value })} /></Field>
                        <Field label="UPI ID" error={errors.upiId}><TextInput value={settings.upiId} onChange={(e) => update({ upiId: e.target.value })} placeholder="username@bank" /></Field>
                        <Field label="Quotation Prefix"><TextInput value={settings.prefix} onChange={(e) => update({ prefix: e.target.value })} /></Field>
                        <Field label="Booking Prefix"><TextInput value={settings.bookingPrefix} onChange={(e) => update({ bookingPrefix: e.target.value })} /></Field>
                        <Field label="Default Validity" error={errors.defaultValidity}><Select value={settings.defaultValidity} onChange={(e) => update({ defaultValidity: e.target.value })}>{VALIDITY_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}</Select></Field>
                        <Field label="Default State" error={errors.defaultState}><Select value={settings.defaultState} onChange={(e) => update({ defaultState: e.target.value })}>{INDIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}</Select></Field>
                        <Field label="Default Tax Name"><TextInput value={settings.defaultTaxName} onChange={(e) => update({ defaultTaxName: e.target.value })} /></Field>
                        <Field label="Default Tax Rate" error={errors.defaultTaxRate}><TextInput type="number" value={settings.defaultTaxRate} onChange={(e) => update({ defaultTaxRate: Number(e.target.value) })} /></Field>
                    </div>
                </SectionCard>
            </div>
        </div>
    );
}

