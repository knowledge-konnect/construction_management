import Logo from '@/components/Logo';
import { AppButton } from '@/components/ui/DesignSystem';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getSafeRedirectPath } from '@/lib/utils';
import {
  Eye,
  EyeOff,
  FileText,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User
} from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

export default function LoginPage() {
  const { login, register, resetPassword } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>(searchParams.get('mode') === 'register' ? 'register' : 'login');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = mode === 'register'
      ? await register(email, password, fullName.trim() || undefined)
      : await login(email, password);
    setIsSubmitting(false);
    if (result.ok) {
      push('success', mode === 'register' ? 'Account created successfully.' : 'Welcome.');
      if (mode === 'register') {
        setPassword('');
        setFullName('');
        setMode('login');
      } else {
        navigate(getSafeRedirectPath(location, '/dashboard'));
      }
    } else {
      push('error', result.error || (mode === 'register' ? 'Registration failed.' : 'Login failed.'));
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      push('error', 'Enter your email address to reset your password.');
      return;
    }
    setIsSubmitting(true);
    const result = await resetPassword(email);
    setIsSubmitting(false);
    if (result.ok) {
      push('success', result.message || 'If an account exists for that email, reset instructions have been generated.');
    } else {
      push('error', result.error || 'Could not send reset email.');
    }
  };

  const featureCards = [
    { title: 'Quotations', text: 'Prepare estimates and customer-ready document packages.' },
    { title: 'Customers', text: 'Keep customer details, communication, and project context in one place.' },
    { title: 'Finance', text: 'Track expenses and payment records alongside each project.' },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[#F3F6FB]">
      <div className="flex min-h-screen items-center justify-center">
        <div className="grid w-full bg-white lg:min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative hidden overflow-hidden bg-[#17243A] p-8 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(72,99,255,0.28),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(244,183,43,0.18),_transparent_28%)]" />
            <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '34px 34px' }} />

            <div className="relative z-10 flex flex-col gap-8">
              <button onClick={() => navigate('/')} aria-label="Back to home" className="inline-flex w-fit cursor-pointer items-center">
                <Logo size="lg" onDark />
              </button>

              <div className="max-w-md space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#F4B72B]/30 bg-[#F4B72B]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F4B72B]">
                  <Sparkles className="h-3.5 w-3.5" />
                  BuilderDocs workspace
                </div>
                <div>
                  <h1 className="text-4xl font-black leading-tight tracking-[-0.06em] text-white">Build better.<br />Manage smarter.</h1>
                  <p className="mt-4 max-w-md text-base leading-7 text-slate-300">
                    Manage quotations, customers, projects, expenses, and payment records in one place with a streamlined workflow built for construction businesses.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#93B4F5]">Business flow</p>
                <p className="mt-1 text-lg font-semibold text-white">Construction operations, simplified</p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-3">
                {featureCards.map(({ title, text }) => (
                  <div key={title} className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <span className="inline-flex rounded-full border border-[#93B4F5]/20 bg-[#1D4ED8]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#D9E4FF]">
                      {title}
                    </span>
                    <p className="mt-2 text-sm leading-5 text-slate-200">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-5 sm:p-7 lg:min-h-0 lg:p-10">
            <div className="w-full max-w-md">
              <div className="mb-8 flex flex-col items-center lg:hidden">
                <button onClick={() => navigate('/')} aria-label="Back to home" className="cursor-pointer">
                  <Logo size="lg" />
                </button>
                <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F4B72B]">Construction Quotations & Business Documents</p>
              </div>

              <div className="bg-white p-4 sm:p-6">
                <div className="mb-6 flex border border-slate-200 bg-slate-100 p-1">
                  <button type="button" onClick={() => setMode('login')} className={`flex-1 px-3 py-2.5 text-sm font-semibold transition-colors ${mode === 'login' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>
                    Sign In
                  </button>
                  <button type="button" onClick={() => setMode('register')} className={`flex-1 px-3 py-2.5 text-sm font-semibold transition-colors ${mode === 'register' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>
                    Create Account
                  </button>
                </div>

                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1D4ED8]">
                    {mode === 'login' ? <ShieldCheck className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-[-0.04em] text-[#0B234A]">{mode === 'register' ? 'Create Account' : 'Welcome back'}</h2>
                    <p className="text-sm text-slate-500">{mode === 'register' ? 'Set up your workspace to start creating quotes.' : 'Sign in to continue managing your projects.'}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-4 focus:ring-[#1D4ED8]/10" placeholder="Enter your email" required />
                    </div>
                  </div>

                  {mode === 'register' && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-4 focus:ring-[#1D4ED8]/10" placeholder="Enter full name" />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-4 focus:ring-[#1D4ED8]/10" placeholder="Enter your password" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <AppButton type="submit" disabled={isSubmitting} className="w-full justify-center py-3 text-sm">
                    {isSubmitting ? (mode === 'register' ? 'Creating account…' : 'Signing in…') : (mode === 'register' ? 'Create Account' : 'Sign In')}
                  </AppButton>
                </form>

                <div className="mt-5 flex items-center justify-between gap-3 text-sm">
                  {mode === 'login' ? (
                    <button type="button" onClick={handleForgotPassword} disabled={isSubmitting} className="font-medium text-[#1D4ED8] transition-colors hover:text-[#1E40AF]">
                      Forgot password?
                    </button>
                  ) : (
                    <span className="text-slate-400">Already have an account?</span>
                  )}

                  <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="font-medium text-[#1D4ED8] transition-colors hover:text-[#1E40AF]">
                    {mode === 'login' ? 'Create account' : 'Back to sign in'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

