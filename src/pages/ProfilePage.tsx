import { AppButton, PageHeader, PremiumCard } from '@/components/ui/DesignSystem';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { getAvatarColor, getInitials, tidyName } from '@/lib/avatar';
import { updateProfile } from '@/services/auth.service';
import { Check, Eye, EyeOff } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';

const roleLabels: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    staff: 'Staff',
    user: 'Staff',
    client: 'Client',
    investor: 'Investor',
};

const MIN_PASSWORD_LENGTH = 8;

// Keep digits only and drop a leading +91 / 91 / 0 so we store the 10-digit number.
function cleanPhone(value: string) {
    let digits = value.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
    return digits;
}

type Feedback = { tone: 'success' | 'error'; text: string } | null;

function FeedbackBanner({ feedback }: { feedback: Feedback }) {
    if (!feedback) return null;
    const success = feedback.tone === 'success';
    return (
        <div
            role={success ? 'status' : 'alert'}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${success
                    ? 'border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success-fg)]'
                    : 'border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger-fg)]'
                }`}
        >
            {success && <Check className="h-4 w-4 shrink-0" aria-hidden />}
            <span>{feedback.text}</span>
        </div>
    );
}

function Field({
    label,
    helper,
    error,
    children,
    htmlFor,
}: {
    label: string;
    helper?: string;
    error?: string | null;
    children: React.ReactNode;
    htmlFor: string;
}) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={htmlFor} className="text-sm font-medium text-[var(--text)]">
                {label}
            </label>
            {children}
            {error ? (
                <p id={`${htmlFor}-error`} className="text-xs text-[var(--danger-fg)]">{error}</p>
            ) : helper ? (
                <p id={`${htmlFor}-help`} className="text-xs text-[var(--text-muted)]">{helper}</p>
            ) : null}
        </div>
    );
}

function PasswordField({
    label,
    value,
    onChange,
    autoComplete,
    helper,
    error,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    autoComplete: string;
    helper?: string;
    error?: string | null;
}) {
    const id = useId();
    const [visible, setVisible] = useState(false);

    return (
        <Field label={label} helper={helper} error={error} htmlFor={id}>
            <div className="relative">
                <input
                    id={id}
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    autoComplete={autoComplete}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${id}-error` : helper ? `${id}-help` : undefined}
                    className="input-shell pr-11"
                />
                <button
                    type="button"
                    onClick={() => setVisible((prev) => !prev)}
                    aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                    {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                </button>
            </div>
        </Field>
    );
}

export default function ProfilePage() {
    const { user, changePassword, refreshUser } = useAuth();
    const { company } = useCompany();

    const savedName = user?.userName ?? '';
    const savedPhone = cleanPhone((user as { phone?: string | null } | null)?.phone ?? '');

    // ----- personal details -----
    const [name, setName] = useState(savedName);
    const [phone, setPhone] = useState(savedPhone);
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileFeedback, setProfileFeedback] = useState<Feedback>(null);
    const [touched, setTouched] = useState(false);

    const cleanedName = tidyName(name);
    const cleanedPhone = cleanPhone(phone);
    const nameError = touched && cleanedName.length < 2 ? 'Enter your name (at least 2 characters).' : null;
    const phoneError = touched && cleanedPhone && !/^[6-9]\d{9}$/.test(cleanedPhone) ? 'Enter a valid 10-digit mobile number.' : null;
    const profileDirty = cleanedName !== savedName || cleanedPhone !== savedPhone;

    const handleProfileSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setTouched(true);
        setProfileFeedback(null);

        if (cleanedName.length < 2) return;
        if (cleanedPhone && !/^[6-9]\d{9}$/.test(cleanedPhone)) return;

        setSavingProfile(true);
        const result = await updateProfile({ fullName: cleanedName, phone: cleanedPhone || null });
        setSavingProfile(false);

        if (!result.ok) {
            setProfileFeedback({ tone: 'error', text: result.error ?? 'Could not save your changes.' });
            return;
        }

        setName(cleanedName);
        setPhone(cleanedPhone);
        setTouched(false);
        await refreshUser();
        setProfileFeedback({ tone: 'success', text: 'Your details have been saved.' });
    };

    // ----- password -----
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null);

    const newTooShort = newPassword.length > 0 && newPassword.length < MIN_PASSWORD_LENGTH;
    const sameAsCurrent = newPassword.length > 0 && newPassword === currentPassword;
    const mismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
    const canSubmitPassword =
        currentPassword.length > 0 &&
        newPassword.length >= MIN_PASSWORD_LENGTH &&
        confirmPassword === newPassword &&
        !sameAsCurrent;

    const handlePasswordSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!canSubmitPassword) return;

        setSavingPassword(true);
        setPasswordFeedback(null);
        const result = await changePassword(currentPassword, newPassword);
        setSavingPassword(false);

        if (!result.ok) {
            // Keep what they typed so they can correct it.
            setPasswordFeedback({ tone: 'error', text: result.error ?? 'Could not update your password.' });
            return;
        }

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordFeedback({ tone: 'success', text: 'Your password has been updated.' });
    };

    const roleKey = (company?.callerRole ?? user?.role ?? '').toLowerCase();
    const roleLabel = roleLabels[roleKey] ?? 'Member';
    const companyName = company?.settings.companyName || 'BuilderDocs';

    return (
        <div className="space-y-5 lg:space-y-7">
            <PageHeader compact title="My profile" description="Manage your personal details and password." />

            <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
                {/* Summary */}
                <PremiumCard className="p-5 lg:sticky lg:top-24 lg:self-start">
                    <div className="flex items-center gap-4 lg:flex-col lg:items-start">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-semibold text-white" style={{ backgroundColor: getAvatarColor(user?.id ?? savedName) }}>
                            {getInitials(savedName)}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-[var(--text)]">{savedName || 'User'}</p>
                        </div>
                    </div>

                    <dl className="mt-5 space-y-3 border-t border-[var(--border)] pt-4 text-sm">
                        <div>
                            <dt className="text-xs text-[var(--text-muted)]">Email</dt>
                            <dd className="mt-0.5 break-all text-[var(--text)]">{user?.email ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-[var(--text-muted)]">Role</dt>
                            <dd className="mt-0.5 text-[var(--text)]">{roleLabel}</dd>
                            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Managed by an owner or admin in Access Management.</p>
                        </div>
                        <div>
                            <dt className="text-xs text-[var(--text-muted)]">Company</dt>
                            <dd className="mt-0.5 text-[var(--text)]">{companyName}</dd>
                        </div>
                    </dl>
                </PremiumCard>

                <div className="space-y-5">
                    {/* Personal details */}
                    <PremiumCard className="p-5">
                        <h2 className="text-base font-semibold text-[var(--text)]">Personal details</h2>
                        <form onSubmit={handleProfileSubmit} noValidate className="mt-4 space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Full name" error={nameError} htmlFor="profile-name">
                                    <input
                                        id="profile-name"
                                        value={name}
                                        onChange={(event) => setName(event.target.value)}
                                        onBlur={() => setTouched(true)}
                                        autoComplete="name"
                                        aria-invalid={nameError ? true : undefined}
                                        aria-describedby={nameError ? 'profile-name-error' : undefined}
                                        className="input-shell"
                                    />
                                </Field>

                                <Field label="Mobile number" helper="10-digit Indian mobile number. Optional." error={phoneError} htmlFor="profile-phone">
                                    <div className="flex">
                                        <span className="inline-flex items-center rounded-l-xl border border-r-0 border-[var(--border-strong)] bg-[var(--surface-soft)] px-3 text-sm text-[var(--text-muted)]">+91</span>
                                        <input
                                            id="profile-phone"
                                            value={phone}
                                            onChange={(event) => setPhone(event.target.value)}
                                            onBlur={() => setTouched(true)}
                                            inputMode="numeric"
                                            autoComplete="tel-national"
                                            aria-invalid={phoneError ? true : undefined}
                                            aria-describedby={phoneError ? 'profile-phone-error' : 'profile-phone-help'}
                                            className="input-shell !rounded-l-none"
                                        />
                                    </div>
                                </Field>

                            </div>

                            <FeedbackBanner feedback={profileFeedback} />

                            <div className="flex items-center justify-end gap-3">
                                {!profileDirty && !savingProfile && <p className="text-xs text-[var(--text-muted)]">Make a change to enable saving.</p>}
                                <AppButton type="submit" disabled={!profileDirty} loading={savingProfile} loadingText="Saving…">
                                    Save changes
                                </AppButton>
                            </div>
                        </form>
                    </PremiumCard>

                    {/* Password */}
                    <PremiumCard className="p-5">
                        <h2 className="text-base font-semibold text-[var(--text)]">Password</h2>
                        <form onSubmit={handlePasswordSubmit} noValidate className="mt-4 space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <PasswordField
                                        label="Current password"
                                        value={currentPassword}
                                        onChange={setCurrentPassword}
                                        autoComplete="current-password"
                                    />
                                </div>
                                <PasswordField
                                    label="New password"
                                    value={newPassword}
                                    onChange={setNewPassword}
                                    autoComplete="new-password"
                                    helper={`At least ${MIN_PASSWORD_LENGTH} characters.`}
                                    error={newTooShort ? `Use at least ${MIN_PASSWORD_LENGTH} characters.` : sameAsCurrent ? 'Choose a password different from your current one.' : null}
                                />
                                <PasswordField
                                    label="Confirm new password"
                                    value={confirmPassword}
                                    onChange={setConfirmPassword}
                                    autoComplete="new-password"
                                    error={mismatch ? 'The passwords don\u2019t match.' : null}
                                />
                            </div>

                            <FeedbackBanner feedback={passwordFeedback} />

                            <div className="flex items-center justify-end gap-3">
                                {!canSubmitPassword && !savingPassword && <p className="text-xs text-[var(--text-muted)]">Fill in all three fields to update.</p>}
                                <AppButton type="submit" disabled={!canSubmitPassword} loading={savingPassword} loadingText="Updating…">
                                    Update password
                                </AppButton>
                            </div>
                        </form>
                    </PremiumCard>
                </div>
            </div>
        </div>
    );
}
