import BrandLogo from '@/components/BrandLogo';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { getAvatarColor, getInitials } from '@/lib/avatar';
import { ChevronDown, LogOut, Menu, Settings, UserRound } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const routeLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/projects/new': 'Create Project',
  '/access-management': 'Access Management',
  '/quotations': 'Quotations',
  '/parties': 'General Contacts',
  '/customers': 'Customers',
  '/suppliers': 'Suppliers',
  '/investors': 'Investors',
  '/expenses': 'Expenses',
  '/client-receipts': 'Booking Receipts',
  '/reports': 'Reports',
  '/team': 'Team',
  '/settings': 'Settings',
  '/billing': 'Billing',
  '/invoices': 'Finance',
  '/profile': 'My profile',
  '/flat-billing': 'Booking Receipts',
  '/templates': 'Templates',
};

// Display names for roles. Adjust to the role values your backend returns.
const roleLabels: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  staff: 'Staff',
  user: 'Staff',
  client: 'Client',
  investor: 'Investor',
};

// Role badge look in the account menu: Owner stands out, Admin is soft blue, others are neutral.
const roleBadgeClasses: Record<string, string> = {
  owner: 'bg-[var(--primary)] text-white',
  admin: 'badge-info',
};

const SIDEBAR_COLLAPSE_KEY = 'builderdocs-sidebar-collapsed';

// Looks like a database id (ObjectId, UUID, long number) rather than a readable route name.
function isIdSegment(segment: string) {
  return /^[0-9a-f-]{16,}$/i.test(segment) || /^\d+$/.test(segment);
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
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerWasOpen = useRef(false);

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

  // Return focus to the hamburger button after the drawer closes.
  useEffect(() => {
    if (drawerWasOpen.current && !mobileOpen) menuButtonRef.current?.focus();
    drawerWasOpen.current = mobileOpen;
  }, [mobileOpen]);

  // Subscribe once; close the drawer when the viewport grows to desktop width.
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleViewportChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileOpen(false);
    };

    mediaQuery.addEventListener('change', handleViewportChange);
    return () => mediaQuery.removeEventListener('change', handleViewportChange);
  }, []);

  useEffect(() => {
    if (!accountOpen) return;

    const handlePointer = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAccountOpen(false);
        accountButtonRef.current?.focus();
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

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(desktopCollapsed));
    } catch {
      /* storage unavailable (private mode); the sidebar still works, it just won't be remembered */
    }
  }, [desktopCollapsed]);

  const breadcrumbs = useMemo(() => {
    const path = location.pathname.replace(/\/+$/, '') || '/dashboard';
    const segments = path.split('/').filter(Boolean);
    const output: { label: string; to: string }[] = [{ label: 'BuilderDocs', to: '/dashboard' }];
    let current = '';

    segments.forEach((segment) => {
      current += `/${segment}`;
      const label = isIdSegment(segment)
        ? 'Details'
        : segment === 'new'
          ? 'Create Project'
          : segment === 'edit'
            ? 'Edit Project'
            : routeLabels[current] ?? segment.replace(/-/g, ' ');

      output.push({ label: label.charAt(0).toUpperCase() + label.slice(1), to: current });
    });

    return output;
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const companyName = company?.settings.companyName || 'BuilderDocs';
  const companyLogo = company?.settings.logoUrl || undefined;
  // Company membership role (owner / admin / staff). Falls back to the auth role while the company loads.
  const memberRole = company?.callerRole ?? undefined;
  const userRoleLabel = roleLabels[(memberRole ?? user?.role ?? '').toLowerCase()] ?? 'Member';
  const roleBadgeClass = roleBadgeClasses[(memberRole ?? user?.role ?? '').toLowerCase()] ?? 'badge-neutral';
  const canManageCompany = memberRole === 'owner' || memberRole === 'admin';
  const initials = getInitials(user?.userName);
  const avatarColor = getAvatarColor(user?.id ?? user?.userName);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F5F7FC] text-[var(--text)]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden h-screen transition-[width] duration-300 ease-out lg:flex ${desktopCollapsed ? 'w-[72px]' : 'w-[260px]'}`}
      >
        <Sidebar
          collapsed={desktopCollapsed}
          isDrawer={false}
          companyName={companyName}
          companyLogo={companyLogo}
          role={memberRole}
          onToggleCollapse={() => setDesktopCollapsed((value) => !value)}
          onClose={() => { }}
          onLogout={handleLogout}
        />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="absolute inset-0 bg-[#0E1624]/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[85vw] max-w-[320px] shadow-2xl shadow-slate-900/10">
            <Sidebar
              collapsed={false}
              isDrawer
              companyName={companyName}
              companyLogo={companyLogo}
              role={memberRole}
              onToggleCollapse={() => { }}
              onClose={() => setMobileOpen(false)}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      )}

      <div className={`transition-[padding] duration-300 ease-out ${desktopCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'}`}>
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-8">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text)] shadow-sm transition-colors hover:border-[#CBD5E1] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] lg:hidden"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-4 w-4" />
            </button>

            <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
              <ol className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                {breadcrumbs.map((item, index) => {
                  const isLast = index === breadcrumbs.length - 1;

                  return isLast ? (
                    <li key={`${item.label}-${item.to}`} className="min-w-0">
                      <span aria-current="page" className="block truncate font-semibold text-[var(--text)]">
                        {item.label}
                      </span>
                    </li>
                  ) : (
                    <li key={`${item.label}-${item.to}`} className="hidden shrink-0 items-center gap-2 sm:flex">
                      <Link to={item.to} className="rounded-md transition-colors hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
                        {item.label}
                      </Link>
                      <span className="text-[var(--text-subtle)]" aria-hidden>
                        /
                      </span>
                    </li>
                  );
                })}
              </ol>
            </nav>

            <div ref={accountMenuRef} className="relative ml-auto">
              <button
                ref={accountButtonRef}
                type="button"
                onClick={() => setAccountOpen((prev) => !prev)}
                className={`flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 text-left transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] sm:pr-3 ${accountOpen ? 'bg-[var(--surface-muted)]' : ''
                  }`}
                aria-expanded={accountOpen}
                aria-controls="account-menu"
                aria-label={`Account menu for ${user?.userName || 'user'}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: avatarColor }}>
                  {initials}
                </div>
                <div className="hidden min-w-0 text-left sm:block">
                  <p className="max-w-[200px] truncate text-sm font-semibold leading-tight text-[var(--text)]">{user?.userName || 'User'}</p>
                  {user?.email && <p className="max-w-[200px] truncate text-xs leading-tight text-[var(--text-muted)]">{user.email}</p>}
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-[var(--text-muted)] transition-transform duration-150 ${accountOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>

              {accountOpen && (
                <div
                  id="account-menu"
                  className="animate-in slide-in-from-top-2 absolute right-0 top-full z-40 mt-2 w-72 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-pop)]"
                >
                  {/* Phones only: the top bar shows just the avatar there, so name and email go here. */}
                  <div className="border-b border-[var(--border)] px-4 py-3 sm:hidden">
                    <p className="truncate text-sm font-semibold text-[var(--text)]">{user?.userName || 'User'}</p>
                    {user?.email && <p className="truncate text-xs text-[var(--text-muted)]">{user.email}</p>}
                  </div>

                  <div className="border-b border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-white p-1">
                        {companyLogo ? (
                          <img src={companyLogo} alt={`${companyName} logo`} className="h-full w-full rounded-lg object-cover" />
                        ) : (
                          <BrandLogo variant="mark" size="sm" className="!h-8 !w-8" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-[var(--text-muted)]">Company</p>
                        <p className="truncate text-sm font-semibold text-[var(--text)]">{companyName}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3">
                      <span className="text-xs text-[var(--text-muted)]">Your role</span>
                      <span className={`badge font-semibold ${roleBadgeClass}`}>{userRoleLabel}</span>
                    </div>
                  </div>

                  <div className="p-1.5">
                    <Link
                      to="/profile"
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[var(--text)] transition-colors hover:bg-[var(--surface-muted)] focus-visible:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]"
                    >
                      <UserRound className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
                      My profile
                    </Link>
                    {canManageCompany && (
                      <Link
                        to="/settings"
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[var(--text)] transition-colors hover:bg-[var(--surface-muted)] focus-visible:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]"
                      >
                        <Settings className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
                        Company settings
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-[var(--border)] p-1.5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-[var(--danger-fg)] transition-colors hover:bg-[var(--danger-soft)] focus-visible:bg-[var(--danger-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]"
                    >
                      <LogOut className="h-4 w-4" aria-hidden />
                      Log out
                    </button>
                  </div>
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
