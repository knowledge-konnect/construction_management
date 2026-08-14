import Logo from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login, register, resetPassword } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');

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
        navigate('/dashboard');
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
      push('success', 'Password reset email sent.');
    } else {
      push('error', result.error || 'Could not send reset email.');
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-[#071C3F] relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #F4B72B 0, #F4B72B 1px, transparent 1px, transparent 30px)' }} />
        <div className="relative z-10 flex flex-col gap-8">
          <div className="flex flex-col items-start">
            <Logo className="h-16 w-auto" size="lg" />
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F4B72B]">Construction Quotations & Business Documents</p>
          </div>
          <div className="max-w-md space-y-4">
            <h1 className="text-white text-3xl font-bold leading-tight">Build Better.<br />Manage Smarter.</h1>
            <p className="text-slate-300 text-lg leading-7">Create professional construction quotations, booking receipts and branded business documents for your construction company.</p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2"><span className="text-[#F4B72B]">✔</span> Construction Quotations</li>
              <li className="flex items-center gap-2"><span className="text-[#F4B72B]">✔</span> Flat Booking Receipts</li>
              <li className="flex items-center gap-2"><span className="text-[#F4B72B]">✔</span> Professional Branded PDFs</li>
              <li className="flex items-center gap-2"><span className="text-[#F4B72B]">✔</span> Customer & Project Management</li>
              <li className="flex items-center gap-2"><span className="text-[#F4B72B]">✔</span> Secure Cloud Backup</li>
            </ul>
          </div>
        </div>
        <div className="relative z-10 flex items-center justify-between text-sm text-slate-400 border-t border-white/10 pt-4 mt-8">
          <span>BuilderDocs v1.0</span>
          <span>© 2026 BuilderDocs</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-[#F7F9FC]">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex flex-col items-center mb-8">
            <Logo className="h-14 w-auto" size="lg" />
            <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F4B72B]">Construction Quotations & Business Documents</p>
          </div>
          <div className="flex rounded-lg border border-slate-200 p-1 mb-7">
            <button type="button" onClick={() => setMode('login')} className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${mode === 'login' ? 'bg-[#0B2857] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              Sign In
            </button>
            <button type="button" onClick={() => setMode('register')} className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${mode === 'register' ? 'bg-[#0B2857] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              Create Account
            </button>
          </div>
          <h2 className="text-2xl font-bold text-[#0B234A] mb-2">{mode === 'register' ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="text-sm text-slate-500 mb-7">{mode === 'register' ? 'Create a new account to start generating quotations.' : 'Sign in to manage your construction documents.'}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2857]/30 focus:border-[#0B2857]" placeholder="Enter email" required />
              </div>
            </div>
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2857]/30 focus:border-[#0B2857]" placeholder="Enter your full name" />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2857]/30 focus:border-[#0B2857]" placeholder="Enter password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full py-3 text-sm font-semibold text-white bg-[#0B2857] hover:bg-[#071C3F] rounded-lg transition-all duration-200 ease-out shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-70">{isSubmitting ? (mode === 'register' ? 'Creating account…' : 'Signing in…') : (mode === 'register' ? 'Create Account' : 'Sign In')}</button>
          </form>
          <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
            {mode === 'login' ? (
              <button type="button" onClick={handleForgotPassword} disabled={isSubmitting} className="text-[#0B2857] hover:text-[#071C3F]">Forgot password?</button>
            ) : (
              <span className="text-slate-400">Already have an account?</span>
            )}
            <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-[#0B2857] hover:text-[#071C3F]">
              {mode === 'login' ? 'Create account' : 'Back to sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
