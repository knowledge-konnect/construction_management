import Logo from '@/components/Logo';
import { AppButton } from '@/components/ui/DesignSystem';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

export default function ChangePasswordPage() {
  const { user, changePassword, logout } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If the account doesn't actually require this, there's nothing to force â€”
  // send them back to their dashboard rather than showing a dead-end page.
  if (user && !user.mustChangePassword) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      push('error', 'New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      push('error', 'Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    const result = await changePassword(currentPassword, newPassword);
    setIsSubmitting(false);
    if (result.ok) {
      push('success', 'Password updated.');
      navigate('/dashboard');
    } else {
      push('error', result.error || 'Could not change password.');
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-[#17243A] relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #F4B72B 0, #F4B72B 1px, transparent 1px, transparent 30px)' }} />
        <div className="relative z-10 flex flex-col gap-8">
          <div className="flex flex-col items-start">
            <Logo className="h-16 w-auto" size="lg" />
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F4B72B]">Construction Quotations & Business Documents</p>
          </div>
        </div>
        <div className="relative z-10 flex items-center justify-between text-sm text-slate-400 border-t border-white/10 pt-4 mt-8">
          <span>BuilderDocs v1.0</span>
          <span>Â© 2026 BuilderDocs</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-[#F7F9FC]">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex flex-col items-center mb-8">
            <Logo className="h-14 w-auto" size="lg" onDark={false} />
          </div>
          <h2 className="text-2xl font-bold text-[#0B234A] mb-2">Set a New Password</h2>
          <p className="text-sm text-slate-500 mb-7">
            Your account was set up by your company admin. Choose a new password to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current (Temporary) Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/30 focus:border-[#1D4ED8]"
                  placeholder="Password your admin gave you"
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
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/30 focus:border-[#1D4ED8]"
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                />
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
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/30 focus:border-[#1D4ED8]"
                  placeholder="Re-enter new password"
                  minLength={8}
                  required
                />
              </div>
            </div>
            <AppButton type="submit" disabled={isSubmitting} className="w-full justify-center py-3 text-sm">
              {isSubmitting ? 'Updatingâ€¦' : 'Set Password & Continue'}
            </AppButton>
          </form>

          <div className="mt-5 text-center">
            <button type="button" onClick={handleSignOut} className="text-sm text-slate-400 hover:text-slate-600">
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

