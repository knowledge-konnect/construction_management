import Logo from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import {
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderKanban,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  ShieldCheck,
  Users,
  X
} from 'lucide-react';
import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

const navGroups = [
  {
    title: 'WORKSPACE',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/projects', label: 'Projects', icon: FolderKanban },
      { to: '/quotations', label: 'Quotations', icon: FileText },
      { to: '/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      { to: '/expenses', label: 'Expenses', icon: IndianRupee },
      { to: '/client-receipts', label: 'Booking Receipts', icon: ReceiptText },
      { to: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { to: '/team', label: 'Team', icon: ShieldCheck },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const routeLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/quotations': 'Quotations',
  '/customers': 'Customers',
  '/expenses': 'Expenses',
  '/client-receipts': 'Booking Receipts',
  '/reports': 'Reports',
  '/team': 'Team',
  '/settings': 'Settings',
  '/billing': 'Billing',
  '/flat-billing': 'Booking Receipts',
  '/templates': 'Templates',
};

function isRouteMatch(target: string, pathname: string) {
  return pathname === target || pathname.startsWith(`${target}/`);
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { company } = useCompany();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchParams.get('search') ?? '');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchValue(searchParams.get('search') ?? '');
  }, [searchParams]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [mobileOpen]);

  // Lock page scroll behind the mobile drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  // Close the account dropdown on outside click or Escape.
  useEffect(() => {
    if (!accountOpen) return;

    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (accountOpen && !accountMenuRef.current?.contains(target)) setAccountOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAccountOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [accountOpen]);

  useEffect(() => {
    setAccountOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  const breadcrumbs = useMemo(() => {
    const path = location.pathname.replace(/\/+$/, '') || '/dashboard';
    const segments = path.split('/').filter(Boolean);
    const items = [{ label: 'BuilderDocs', to: '/dashboard' }];

    if (!segments.length) return items;

    const output: { label: string; to: string }[] = [];
    let current = '';

    segments.forEach((segment, index) => {
      current += `/${segment}`;
      const labeledPath = current === '/dashboard' ? '/dashboard' : current;
      const key = index === segments.length - 1 ? labeledPath : labeledPath;
      const label =
        segment === 'projects' && index === 0
          ? 'Projects'
          : segment === 'quotations' && index === 0
            ? 'Quotations'
            : routeLabels[key] ?? segment.replace(/-/g, ' ');

      output.push({ label: label.charAt(0).toUpperCase() + label.slice(1), to: current });
    });

    return [...items, ...output];
  }, [location.pathname]);

  const normalizedSearchTarget = useMemo(() => {
    if (location.pathname.startsWith('/quotations')) return '/quotations';
    if (location.pathname.startsWith('/customers')) return '/customers';
    if (location.pathname.startsWith('/projects')) return '/projects';
    return '/quotations';
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleGlobalSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = searchValue.trim();
    if (!term) return;

    navigate(`${normalizedSearchTarget}?search=${encodeURIComponent(term)}`);
  };

  const companyName = company?.settings.companyName || 'BuilderDocs';

  const renderSidebar = (sidebarCollapsed: boolean, isDrawer: boolean) => (
    <div className="flex h-full min-h-0 w-full flex-col bg-[#17243A] text-white">
      <div className={`flex gap-2 px-3 py-3 ${sidebarCollapsed ? 'flex-col items-center' : 'items-center'}`}>
        <div className={`relative min-w-0 ${sidebarCollapsed ? '' : 'flex-1'}`}>
          <div
            title={sidebarCollapsed ? companyName : undefined}
            className={`flex w-full items-center gap-2 rounded-xl bg-white/5 p-2.5 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 p-1">
                <Logo variant="mark" size="sm" onDark />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0 self-center leading-tight">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Company</p>
                  <p className="whitespace-normal break-words text-sm font-semibold leading-5 text-white">{companyName}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {isDrawer ? (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label="Close navigation menu"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setDesktopCollapsed((prev) => !prev)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-5 last:mb-0">
            {sidebarCollapsed ? (
              <div className="mx-2 mb-3 border-t border-white/10 first:hidden" aria-hidden="true" />
            ) : (
              <div className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {group.title}
              </div>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isRouteMatch(item.to, location.pathname);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => {
                      const activeNow = isActive || active;
                      return `flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${activeNow
                        ? 'bg-[#1D4ED8] text-white shadow-sm'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        } ${sidebarCollapsed ? 'justify-center px-0' : ''}`;
                    }}
                    title={sidebarCollapsed ? item.label : undefined}
                    aria-label={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-3 py-3">
        <button
          type="button"
          onClick={handleLogout}
          title={sidebarCollapsed ? 'Logout' : undefined}
          aria-label={sidebarCollapsed ? 'Logout' : undefined}
          className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && 'Logout'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F5F7FA] text-[#17243A]">
      <aside className={`fixed inset-y-0 left-0 z-40 hidden h-screen lg:flex ${desktopCollapsed ? 'w-20' : 'w-72'}`}>
        {renderSidebar(desktopCollapsed, false)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="absolute inset-0 bg-[#17243A]/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[85vw] max-w-[320px] shadow-xl">
            {renderSidebar(false, true)}
          </aside>
        </div>
      )}

      <div className={desktopCollapsed ? 'lg:pl-20' : 'lg:pl-72'}>
        <header className="sticky top-0 z-30 border-b border-[#E6E8EC] bg-white/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6E8EC] text-[#17243A] lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </button>

              <div className="flex min-w-0 items-center gap-2 rounded-xl border border-[#E6E8EC] bg-white px-2 py-1.5 lg:hidden">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F8FAFC] p-0.5">
                  <Logo variant="mark" size="sm" />
                </div>
                <p className="max-w-[42vw] truncate text-xs font-semibold text-[#17243A]">{companyName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div ref={accountMenuRef} className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setAccountOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-xl border border-[#E6E8EC] bg-white px-2.5 py-2 text-left transition-colors hover:bg-slate-50"
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                  aria-label="Open account menu"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF1FF] text-xs font-semibold text-[#1D4ED8]">
                    {user?.userName?.slice(0, 2).toUpperCase() || 'US'}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-medium text-[#17243A]">{user?.userName || 'User'}</p>
                    <p className="text-[10px] text-[#5B6475]">Admin</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-[#667085]" />
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-full z-40 mt-2 w-56 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-[#E6E8EC] bg-white shadow-lg" role="menu">
                    <div className="border-b border-[#E6E8EC] px-3 py-2">
                      <p className="truncate text-sm font-medium text-[#17243A]">{user?.userName || 'User'}</p>
                      <p className="truncate text-xs text-[#667085]">{user?.email || 'user@builderdocs.com'}</p>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[#17243A] transition hover:bg-slate-50"
                    >
                      <LogOut className="h-4 w-4 text-[#667085]" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="overflow-x-hidden p-3 sm:p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
