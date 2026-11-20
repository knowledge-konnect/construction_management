import BrandLogo from '@/components/BrandLogo';
import { AppButton } from '@/components/ui/DesignSystem';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { tidyName } from '@/lib/avatar';
import { getSafeRedirectPath } from '@/lib/utils';
import { AlertCircle, ArrowLeft, Eye, EyeOff, FileText, Lock, Mail, User, Users, WalletCards } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

type Mode = 'login' | 'register';

const highlights = [
  { icon: FileText, title: 'Quotations', text: 'Prepare estimates and customer-ready document packages.' },
  { icon: Users, title: 'Customers', text: 'Keep customer details, communication, and project context in one place.' },
  { icon: WalletCards, title: 'Finance', text: 'Track expenses and payment records alongside each project.' },
];

// Shares the look of the other forms (.input-shell in index.css); the login page keeps a taller 44px field.
const inputClass = 'input-shell min-h-[44px]';

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export default function LoginPage() {
  const { user, loading, login, register, resetPassword } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [mode, setMode] = useState<Mode>(searchParams.get('mode') === 'register' ? 'register' : 'login');

  const trimmedEmail = useMemo(() => email.trim(), [email]);
  const isRegister = mode === 'register';

  // Someone who is already signed in has no reason to be on this page.
  // The app's route guard then sends a user without a company to Company Setup.
  useEffect(() => {
    if (!loading && user) {
      navigate(getSafeRedirectPath(location, '/dashboard'), { replace: true });
    }
  }, [loading, user, location, navigate]);

  const updateMode = (nextMode: Mode) => {
    setMode(nextMode);
    setFormError('');
    setSearchParams(nextMode === 'register' ? { mode: 'register' } : {});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!trimmedEmail || !password) {
      setFormError('Enter your email and password.');
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setFormError('Enter a valid email address.');
      return;
    }

    const cleanName = tidyName(fullName);
    if (isRegister) {
      if (cleanName.length < 2) {
        setFormError('Enter your full name.');
        return;
      }
      if (password.length < MIN_PASSWORD_LENGTH) {
        setFormError(`Use a password with at least ${MIN_PASSWORD_LENGTH} characters.`);
        return;
      }
    }

    setIsSubmitting(true);
    const result = isRegister ? await register(trimmedEmail, password, cleanName) : await login(trimmedEmail, password);
    setIsSubmitting(false);

    if (result.ok) {
      if (isRegister) {
        // register() already signs the user in. A new account has no company yet,
        // so go through the app guard, which sends them to Company Setup.
        push('success', 'Account created. Next, set up your company.');
        navigate('/dashboard', { replace: true });
      } else {
        push('success', 'Signed in successfully.');
        navigate(getSafeRedirectPath(location, '/dashboard'), { replace: true });
      }
    } else {
      setFormError(
        result.error ||
        (isRegister
          ? 'We could not create your account right now. Please try again.'
          : 'We could not sign you in. Check your email and password, then try again.'),
      );
    }
  };

  const handleForgotPassword = async () => {
    setFormError('');
    if (!trimmedEmail) {
      setFormError('Enter your email address first, then choose “Forgot password?”.');
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setFormError('Enter a valid email address.');
      return;
    }
    setIsSubmitting(true);
    const result = await resetPassword(trimmedEmail);
    setIsSubmitting(false);
    if (result.ok) {
      push('success', result.message || 'If an account exists for that email, you’ll receive reset instructions.');
    } else {
      setFormError(result.error || 'We could not start password reset right now. Please try again.');
    }
  };

  const tabClass = (active: boolean) =>
    `flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-white text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
    }`;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        {/* Brand panel (desktop) */}
        <aside className="relative hidden overflow-hidden bg-[var(--navy)] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,132,255,0.32),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_30%)]" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <button onClick={() => navigate('/')} aria-label="Back to home" className="relative z-10 inline-flex w-fit items-center rounded-lg">
            <BrandLogo size="lg" onDark />
          </button>

          <div className="relative z-10 max-w-lg">
            <h1 className="text-4xl font-bold leading-[1.1] tracking-[-0.03em] xl:text-5xl">
              Build better.
              <br />
              Manage smarter.
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-300">
              Manage quotations, customers, projects, expenses, and payment records in one place with a streamlined workflow built for construction businesses.
            </p>

            <ul className="mt-9 space-y-5">
              {highlights.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#93B4F5] ring-1 ring-white/10">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-0.5 text-sm leading-6 text-slate-300">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 text-xs text-slate-400">© {new Date().getFullYear()} BuilderDocs</p>
        </aside>

        {/* Form panel */}
        <main className="flex flex-col px-5 py-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} aria-label="Back to home" className="rounded-lg lg:hidden">
              <BrandLogo size="md" />
            </button>
            <button
              onClick={() => navigate('/')}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </button>
          </div>

          <div className="flex flex-1 items-center justify-center py-8">
            <div className="w-full max-w-[420px]">
              <div role="group" aria-label="Sign in or create account" className="mb-7 flex rounded-xl bg-[var(--surface-muted)] p-1">
                <button type="button" aria-pressed={!isRegister} onClick={() => updateMode('login')} className={tabClass(!isRegister)}>
                  Sign In
                </button>
                <button type="button" aria-pressed={isRegister} onClick={() => updateMode('register')} className={tabClass(isRegister)}>
                  Create Account
                </button>
              </div>

              <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-[var(--text)]">
                {isRegister ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
                {isRegister ? 'Set up your workspace to start creating quotes.' : 'Sign in to continue managing your projects.'}
              </p>

              {formError && (
                <div role="alert" className="mt-5 flex items-start gap-2.5 rounded-xl border border-[var(--danger-border)] bg-[var(--danger-soft)] px-3.5 py-3 text-sm text-[var(--danger-fg)]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{formError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
                {isRegister && (
                  <div>
                    <label htmlFor="auth-full-name" className="mb-1.5 block text-sm font-medium text-[var(--text)]">Full name</label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-subtle)]" />
                      <input
                        id="auth-full-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        autoComplete="name"
                        autoFocus
                        aria-invalid={Boolean(formError) && tidyName(fullName).length < 2}
                        className={`${inputClass} pl-10 pr-3`}
                        placeholder="Your name"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="auth-email" className="mb-1.5 block text-sm font-medium text-[var(--text)]">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-subtle)]" />
                    <input
                      id="auth-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      autoFocus={!isRegister}
                      spellCheck={false}
                      aria-invalid={Boolean(formError) && !trimmedEmail}
                      className={`${inputClass} pl-10 pr-3`}
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="auth-password" className="block text-sm font-medium text-[var(--text)]">Password</label>
                    {!isRegister && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={isSubmitting}
                        className="rounded text-sm font-medium text-[var(--primary)] transition-colors hover:text-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:text-[var(--text-subtle)]"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-subtle)]" />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={isRegister ? 'new-password' : 'current-password'}
                      aria-invalid={Boolean(formError) && !password}
                      aria-describedby={isRegister ? 'auth-password-help' : undefined}
                      className={`${inputClass} pl-10 pr-11`}
                      placeholder={isRegister ? 'Create a password' : 'Enter your password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--text-subtle)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {isRegister && (
                    <p id="auth-password-help" className="mt-1.5 text-xs text-[var(--text-muted)]">
                      At least {MIN_PASSWORD_LENGTH} characters.
                    </p>
                  )}
                </div>

                <AppButton
                  type="submit"
                  loading={isSubmitting}
                  loadingText={isRegister ? 'Creating account…' : 'Signing in…'}
                  className="mt-2 min-h-[46px] w-full"
                >
                  {isRegister ? 'Create account' : 'Sign in'}
                </AppButton>

                {isRegister && (
                  <p className="text-center text-xs text-[var(--text-muted)]">Next, you’ll add your company details.</p>
                )}
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
