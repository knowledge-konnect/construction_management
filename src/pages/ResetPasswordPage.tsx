import Logo from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function ResetPasswordPage() {
  const { confirmPasswordReset } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      push('error', 'This reset link is missing its token. Request a new one from the sign-in page.');
      return;
    }
    if (password.length < 8) {
      push('error', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      push('error', 'Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    const result = await confirmPasswordReset(token, password);
    setIsSubmitting(false);
    if (result.ok) {
      setDone(true);
      push('success', 'Password updated. Please sign in with your new password.');
    } else {
      push('error', result.error || 'Could not reset password. The link may have expired.');
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
          </div>
          <h2 className="text-2xl font-bold text-[#0B234A] mb-2">Reset Password</h2>
          <p className="text-sm text-slate-500 mb-7">Choose a new password for your account.</p>

          {done ? (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3 text-sm font-semibold text-white bg-[#0B2857] hover:bg-[#071C3F] rounded-lg transition-all duration-200 ease-out shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              Go to Sign In
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!token && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  This link is missing its reset token. Request a new one from the sign-in page.
                </p>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2857]/30 focus:border-[#0B2857]"
                    placeholder="Enter new password"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2857]/30 focus:border-[#0B2857]"
                    placeholder="Re-enter new password"
                    minLength={8}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !token}
                className="w-full py-3 text-sm font-semibold text-white bg-[#0B2857] hover:bg-[#071C3F] rounded-lg transition-all duration-200 ease-out shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-70"
              >
                {isSubmitting ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="mt-4 text-sm text-slate-500 text-center">
            <button type="button" onClick={() => navigate('/login')} className="text-[#0B2857] hover:text-[#071C3F]">
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
