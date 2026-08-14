import Logo from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';
import { Building2, FileText, LayoutDashboard, LogOut, Menu, Settings } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/quotations', label: 'Quotations', icon: FileText },
  { to: '/flat-billing', label: 'Flat Billing', icon: Building2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-white/10">
        <Logo className="h-10 w-auto" />
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item, i) => {
          const Icon = item.icon;
          // Add a subtle divider before Settings
          const showDivider = i > 0 && item.to === '/settings';
          return (
            <div key={item.to}>
              {showDivider && <div className="my-2 border-t border-white/10" />}
              <NavLink to={item.to} onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
                <Icon className="w-5 h-5" /> {item.label}
              </NavLink>
            </div>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-white/10">
        <div className="text-xs text-slate-400 mb-3">
          <div className="font-medium text-slate-300">Construction Documents</div>
          <div>v1.0</div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-[#071C3F]">{sidebar}</aside>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-[#071C3F] shadow-xl">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900" aria-label="Open menu"><Menu className="w-6 h-6" /></button>
              <div className="lg:hidden"><Logo variant="mark" className="h-8 w-8" /></div>
              <div className="hidden lg:flex items-center gap-3">
                <div className="rounded-full border border-[#0B2857]/10 bg-[#0B2857]/5 px-3 py-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0B2857]">Workspace</span>
                </div>
                <span className="text-sm text-slate-500">Signed in as <span className="font-semibold text-slate-700">{user?.userName}</span></span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-emerald-700">Online</span>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100"><LogOut className="w-4 h-4" /><span className="hidden sm:inline">Logout</span></button>
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
