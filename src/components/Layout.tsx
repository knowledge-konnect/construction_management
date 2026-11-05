import BrandLogo from '@/components/BrandLogo';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import {
  BarChart3,
  Briefcase,
  ChevronDown,
  ChevronLeft,
  Contact,
  Factory,
  FileText,
  FolderKanban,
  IndianRupee,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; match?: string[] };

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/projects', label: 'Projects', icon: FolderKanban },
      { to: '/quotations', label: 'Quotations', icon: FileText },
    ],
  },
  {
    title: 'Finance',
    items: [
      { to: '/invoices', label: 'Finance', icon: IndianRupee, match: ['/invoices', '/receipts'] },
      { to: '/expenses', label: 'Expenses', icon: IndianRupee },
      { to: '/client-receipts', label: 'Booking Receipts', icon: ReceiptText, match: ['/client-receipts', '/flat-billing'] },
      { to: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    title: 'Contacts',
    items: [
      { to: '/customers', label: 'Customers', icon: UserRound },
      { to: '/suppliers', label: 'Suppliers', icon: Factory },
      { to: '/investors', label: 'Investors', icon: Briefcase },
      { to: '/parties', label: 'General Contacts', icon: Contact },
    ],
  },
  {
    title: 'Management',
    items: [
      { to: '/team', label: 'Team', icon: Users },
      { to: '/access-management', label: 'Access Management', icon: KeyRound },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const SIDEBAR_COLLAPSE_KEY = 'builderdocs-sidebar-collapsed';

function isRouteMatch(target: string, pathname: string) {
  return pathname === target || pathname.startsWith(`${target}/`);
}

function getInitials(name?: string) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'US';
  return (parts[0][0] + (parts[1]?.[0] ?? parts[0][1] ?? '')).toUpperCase();
}

function readCollapsed() {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === 'true';
  } catch {
    return false;
  }
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { company } = useCompany();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => (typeof window === 'undefined' ? false : readCollapsed()));
  const [accountOpen, setAccountOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleViewportChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileOpen(false);
    };

    if (mediaQuery.matches && mobileOpen) setMobileOpen(false);

    mediaQuery.addEventListener('change', handleViewportChange);
    return () => mediaQuery.removeEventListener('change', handleViewportChange);
  }, [mobileOpen]);

  useEffect(() => {
    if (!accountOpen) return;

    const handlePointer = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountOpen(false);
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

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(desktopCollapsed));
    } catch {
      /* storage unavailable (private mode); the sidebar still works, it just won't be remembered */
    }
  }, [desktopCollapsed]);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const companyName = company?.settings.companyName || 'BuilderDocs';
  const companyLogo = company?.settings.logoUrl || undefined;
  const userRoleLabel = user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}` : 'Member';
  const initials = getInitials(user?.userName);

  const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/60';
  const iconButton = `inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-200 transition-colors hover:bg-white/10 hover:text-white ${focusRing}`;

  const renderSidebar = (sidebarCollapsed: boolean, isDrawer: boolean) => {
    const logoTile = (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.08] p-1 ring-1 ring-white/10">
        {companyLogo ? (
          <img src={companyLogo} alt={`${companyName} logo`} className="h-full w-full rounded-lg object-cover" />
        ) : (
          <BrandLogo variant="mark" size="sm" onDark className="!h-8 !w-8" />
        )}
      </div>
    );

    return (
      <div className="flex h-full min-h-0 w-full flex-col bg-[#17243A] text-white">
        {/* Company row: same height as the top bar so the two borders line up */}
        <div className={`flex h-[65px] shrink-0 items-center gap-2 border-b border-white/10 ${sidebarCollapsed ? 'justify-center px-2' : 'px-3'}`}>
          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={() => setDesktopCollapsed(false)}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              className={`rounded-lg transition-opacity hover:opacity-80 ${focusRing}`}
            >
              {logoTile}
            </button>
          ) : (
            <>
              {logoTile}
              <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{companyName}</p>
              {isDrawer ? (
                <button type="button" onClick={() => setMobileOpen(false)} className={iconButton} aria-label="Close navigation menu">
                  <X className="h-[18px] w-[18px]" />
                </button>
              ) : (
                <button type="button" onClick={() => setDesktopCollapsed(true)} className={iconButton} aria-label="Collapse sidebar">
                  <ChevronLeft className="h-[18px] w-[18px]" />
                </button>
              )}
            </>
          )}
        </div>

        <nav aria-label="Primary" className="no-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-4 pt-4">
          {navGroups.map((group, groupIndex) => (
            <div key={group.title} className="mb-5 last:mb-0">
              {sidebarCollapsed ? (
                groupIndex > 0 && <div className="mx-2 mb-4 border-t border-white/10" aria-hidden />
              ) : (
                <div className="mb-2 px-2.5 text-[11px] font-semibold text-[#93B4F5]">{group.title}</div>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = (item.match ?? [item.to]).some((p) => isRouteMatch(p, location.pathname));

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      title={sidebarCollapsed ? item.label : undefined}
                      aria-label={sidebarCollapsed ? item.label : undefined}
                      aria-current={active ? 'page' : undefined}
                      className={`group flex h-11 items-center gap-3 rounded-xl px-2.5 text-sm font-medium transition-colors duration-200 ${focusRing} ${active
                        ? 'bg-[#1D4ED8] text-white shadow-[0_6px_14px_rgba(29,78,216,0.35)]'
                        : 'text-slate-300 hover:bg-white/[0.07] hover:text-white'
                        } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                    >
                      <Icon className={`h-[19px] w-[19px] shrink-0 ${active ? 'text-white' : 'text-slate-300 group-hover:text-white'}`} />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Signed-in user. Logout lives in the account menu in the top bar. */}
        <div className="shrink-0 border-t border-white/10 p-3">
          <div
            title={sidebarCollapsed ? user?.userName || 'User' : undefined}
            className={`flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] ${sidebarCollapsed ? 'justify-center p-1.5' : 'p-2.5'}`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF1FF] text-xs font-semibold text-[#17243A] ring-1 ring-[#CFE0FF]">
              {initials}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{user?.userName || 'User'}</p>
                <p className="truncate text-[11px] text-slate-400">{userRoleLabel}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F5F7FC] text-[#17243B]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden h-screen transition-[width] duration-300 ease-out lg:flex ${desktopCollapsed ? 'w-[72px]' : 'w-[260px]'}`}
      >
        {renderSidebar(desktopCollapsed, false)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="absolute inset-0 bg-[#0E1624]/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[85vw] max-w-[320px] shadow-2xl shadow-slate-900/10">
            {renderSidebar(false, true)}
          </aside>
        </div>
      )}

      <div className={desktopCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'}>
        <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#17243B] shadow-sm transition-colors hover:border-[#CBD5E1] hover:bg-slate-50 lg:hidden"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="hidden min-w-0 flex-1 md:block" />

            <div ref={accountMenuRef} className="relative ml-auto">
              <button
                type="button"
                onClick={() => setAccountOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-2.5 py-2 text-left shadow-sm transition-colors hover:bg-slate-50"
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                aria-label="Open account menu"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1FF] text-xs font-semibold text-[#2454D6] ring-1 ring-[#CFE0FF]">
                  {initials}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-[#17243B]">{user?.userName || 'User'}</p>
                  <p className="text-[10px] text-[#64748B]">{companyName}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-[#64748B]" />
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-full z-40 mt-2 w-60 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_18px_38px_rgba(15,23,42,0.11)]" role="menu">
                  <div className="border-b border-[#E2E8F0] px-3 py-3">
                    <p className="truncate text-sm font-semibold text-[#17243B]">{user?.userName || 'User'}</p>
                    <p className="truncate text-xs text-[#64748B]">{user?.email || 'user@builderdocs.com'}</p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[#17243B] transition hover:bg-slate-50"
                  >
                    <LogOut className="h-4 w-4 text-[#64748B]" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

        </header>

        <main className="overflow-x-hidden px-3 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
