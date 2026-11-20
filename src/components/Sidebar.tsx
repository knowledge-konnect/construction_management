import BrandLogo from '@/components/BrandLogo';
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
    ReceiptText,
    Settings,
    UserRound,
    Users,
    Wallet,
    X,
} from 'lucide-react';
import { type FocusEvent, type MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

type NavItem = {
    to: string;
    label: string;
    icon: typeof LayoutDashboard;
    /** Extra route prefixes that should also highlight this item. */
    match?: string[];
    /** If set, only these roles see the item. Server-side checks still apply. */
    roles?: string[];
};

type NavGroup = { title: string; items: NavItem[] };

// Adjust to the role values your backend really returns.
const ADMIN_ROLES = ['owner', 'admin'];

const navGroups: NavGroup[] = [
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
            { to: '/invoices', label: 'Finance', icon: Wallet, match: ['/invoices', '/billing'] },
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
            { to: '/team', label: 'Team', icon: Users, roles: ADMIN_ROLES },
            { to: '/access-management', label: 'Access Management', icon: KeyRound, roles: ADMIN_ROLES },
            { to: '/settings', label: 'Settings', icon: Settings, roles: ADMIN_ROLES },
        ],
    },
];

/*
 * OPTIONAL later step (fewer items, no scrolling at all):
 * merge the contact pages into one tabbed "Contacts" page and use:
 *   { to: '/contacts', label: 'Contacts', icon: Contact,
 *     match: ['/contacts', '/customers', '/suppliers', '/investors', '/parties'] }
 * and merge Team / Access Management / Settings into one tabbed "Settings" item.
 */

const GROUPS_KEY = 'builderdocs-sidebar-closed-groups';
const DEFAULT_CLOSED_GROUPS = ['Management'];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function isRouteMatch(target: string, pathname: string) {
    return pathname === target || pathname.startsWith(`${target}/`);
}

function readClosedGroups(): string[] {
    try {
        const raw = window.localStorage.getItem(GROUPS_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        return Array.isArray(parsed) ? parsed : DEFAULT_CLOSED_GROUPS;
    } catch {
        return DEFAULT_CLOSED_GROUPS;
    }
}

// --ring is a 30% blue, which disappears on navy, so the sidebar uses a white ring instead.
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80';
const iconButton = `inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-200 transition-colors hover:bg-white/10 hover:text-white ${focusRing}`;

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

type SidebarProps = {
    collapsed: boolean;
    isDrawer: boolean;
    companyName: string;
    companyLogo?: string;
    role?: string;
    /** Counts keyed by route, e.g. { '/projects': 3 }. Missing or 0 = no badge. */
    badges?: Record<string, number>;
    onToggleCollapse: () => void;
    onClose: () => void;
    /** Shows a Log out button in the footer when provided. */
    onLogout?: () => void;
};

export default function Sidebar({
    collapsed,
    isDrawer,
    companyName,
    companyLogo,
    role,
    badges = {},
    onToggleCollapse,
    onClose,
    onLogout,
}: SidebarProps) {
    const location = useLocation();
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    const [closedGroups, setClosedGroups] = useState<string[]>(() =>
        typeof window === 'undefined' ? DEFAULT_CLOSED_GROUPS : readClosedGroups(),
    );
    const [tip, setTip] = useState<{ label: string; top: number } | null>(null);

    // Role filtering: hide restricted items, then hide groups that end up empty.
    const visibleGroups = useMemo(
        () =>
            navGroups
                .map((group) => ({
                    ...group,
                    items: group.items.filter((item) => !item.roles || (role ? item.roles.includes(role.toLowerCase()) : false)),
                }))
                .filter((group) => group.items.length > 0),
        [role],
    );

    // Remember which groups are closed.
    useEffect(() => {
        try {
            window.localStorage.setItem(GROUPS_KEY, JSON.stringify(closedGroups));
        } catch {
            /* storage unavailable; groups still work, just not remembered */
        }
    }, [closedGroups]);

    // Always open the group that holds the current page.
    useEffect(() => {
        const activeGroup = visibleGroups.find((group) =>
            group.items.some((item) => (item.match ?? [item.to]).some((p) => isRouteMatch(p, location.pathname))),
        );
        if (activeGroup) {
            setClosedGroups((prev) => (prev.includes(activeGroup.title) ? prev.filter((t) => t !== activeGroup.title) : prev));
        }
    }, [location.pathname, visibleGroups]);

    // Drawer: move focus into it when it opens.
    useEffect(() => {
        if (isDrawer) closeButtonRef.current?.focus();
    }, [isDrawer]);

    // Clear any tooltip when the rail expands.
    useEffect(() => {
        if (!collapsed) setTip(null);
    }, [collapsed]);

    const toggleGroup = (title: string) =>
        setClosedGroups((prev) => (prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]));

    // Custom tooltip for the collapsed rail. Fixed-positioned so the nav's overflow can't clip it.
    const showTip = (event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>, label: string) => {
        if (!collapsed) return;
        const rect = event.currentTarget.getBoundingClientRect();
        setTip({ label, top: rect.top + rect.height / 2 });
    };
    const hideTip = () => setTip(null);

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
        <div className="flex h-full min-h-0 w-full flex-col bg-[var(--navy)] text-white">
            {/* Company row: same height as the top bar so the two borders line up */}
            <div className={`flex h-[65px] shrink-0 items-center gap-2 border-b border-white/10 ${collapsed ? 'justify-center px-2' : 'px-3'}`}>
                {collapsed ? (
                    <button
                        type="button"
                        onClick={onToggleCollapse}
                        onMouseEnter={(e) => showTip(e, companyName)}
                        onMouseLeave={hideTip}
                        onFocus={(e) => showTip(e, 'Expand sidebar')}
                        onBlur={hideTip}
                        aria-label="Expand sidebar"
                        className={`rounded-lg transition-opacity hover:opacity-80 ${focusRing}`}
                    >
                        {logoTile}
                    </button>
                ) : (
                    <>
                        {logoTile}
                        <p title={companyName} className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-tight text-white">
                            {companyName}
                        </p>
                        {isDrawer ? (
                            <button ref={closeButtonRef} type="button" onClick={onClose} className={iconButton} aria-label="Close navigation menu">
                                <X className="h-[18px] w-[18px]" />
                            </button>
                        ) : (
                            <button type="button" onClick={onToggleCollapse} className={iconButton} aria-label="Collapse sidebar">
                                <ChevronLeft className="h-[18px] w-[18px]" />
                            </button>
                        )}
                    </>
                )}
            </div>

            <nav aria-label="Primary" className="no-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-3 pt-3">
                {visibleGroups.map((group, groupIndex) => {
                    // On the icon rail there are no labels to click, so every group stays open.
                    const open = collapsed || !closedGroups.includes(group.title);
                    const groupId = `nav-group-${group.title.toLowerCase().replace(/\s+/g, '-')}`;

                    return (
                        <div key={group.title} className="mb-2 last:mb-0">
                            {collapsed ? (
                                groupIndex > 0 && <div className="mx-2 mb-2 border-t border-white/10" aria-hidden />
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => toggleGroup(group.title)}
                                    aria-expanded={open}
                                    aria-controls={groupId}
                                    className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-semibold tracking-wide text-slate-400 transition-colors hover:text-white ${focusRing}`}
                                >
                                    {group.title}
                                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} aria-hidden />
                                </button>
                            )}

                            {open && (
                                <div id={groupId} className="mt-0.5 space-y-0.5">
                                    {group.items.map((item) => {
                                        const Icon = item.icon;
                                        const active = (item.match ?? [item.to]).some((p) => isRouteMatch(p, location.pathname));
                                        const count = badges[item.to] ?? 0;

                                        return (
                                            <NavLink
                                                key={item.to}
                                                to={item.to}
                                                onClick={onClose}
                                                onMouseEnter={(e) => showTip(e, item.label)}
                                                onMouseLeave={hideTip}
                                                onFocus={(e) => showTip(e, item.label)}
                                                onBlur={hideTip}
                                                aria-label={collapsed ? (count ? `${item.label}, ${count} need attention` : item.label) : undefined}
                                                aria-current={active ? 'page' : undefined}
                                                className={`group relative flex h-9 items-center gap-3 rounded-xl text-sm font-medium transition-colors duration-150 ${focusRing} ${collapsed ? 'justify-center px-0' : 'px-2.5'
                                                    } ${active
                                                        ? 'bg-[var(--primary-soft)] font-semibold text-[var(--primary)]'
                                                        : 'text-slate-300 hover:bg-white/[0.07] hover:text-white'
                                                    }`}
                                            >
                                                <Icon
                                                    className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-[var(--primary)]' : 'text-slate-300 group-hover:text-white'}`}
                                                    aria-hidden
                                                />
                                                {!collapsed && <span className="truncate">{item.label}</span>}

                                                {count > 0 &&
                                                    (collapsed ? (
                                                        <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-red-400" aria-hidden />
                                                    ) : (
                                                        <span
                                                            className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold leading-none ${active
                                                                    ? 'bg-[var(--danger-soft)] text-[var(--danger-fg)]'
                                                                    : 'bg-[var(--danger)] text-white'
                                                                }`}
                                                        >
                                                            {count > 99 ? '99+' : count}
                                                        </span>
                                                    ))}
                                            </NavLink>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Footer: Log out keeps the sidebar finished at the bottom. The account menu in the top bar has it too. */}
            {onLogout && (
                <div className="shrink-0 border-t border-white/10 p-2">
                    <button
                        type="button"
                        onClick={onLogout}
                        onMouseEnter={(e) => showTip(e, 'Log out')}
                        onMouseLeave={hideTip}
                        onFocus={(e) => showTip(e, 'Log out')}
                        onBlur={hideTip}
                        aria-label={collapsed ? 'Log out' : undefined}
                        className={`flex h-9 w-full items-center gap-3 rounded-xl text-sm font-medium text-slate-300 transition-colors duration-150 hover:bg-white/[0.07] hover:text-white ${focusRing} ${collapsed ? 'justify-center px-0' : 'px-2.5'
                            }`}
                    >
                        <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden />
                        {!collapsed && <span>Log out</span>}
                    </button>
                </div>
            )}

            {/* Collapsed-rail tooltip */}
            {collapsed && tip && (
                <div
                    role="tooltip"
                    style={{ top: tip.top }}
                    className="pointer-events-none fixed left-[80px] z-[60] -translate-y-1/2 whitespace-nowrap rounded-md bg-[var(--navy-strong)] px-2.5 py-1.5 text-xs font-medium text-white shadow-lg ring-1 ring-white/10"
                >
                    {tip.label}
                </div>
            )}
        </div>
    );
}
