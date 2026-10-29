import { X } from 'lucide-react';
import { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode, useEffect, useId } from 'react';

export function AppButton({
    children,
    variant = 'primary',
    className = '',
    type,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
    const variants: Record<string, string> = {
        primary: 'bg-[#1D4ED8] text-white hover:bg-[#1E40AF] shadow-sm',
        secondary: 'bg-white text-[#17243A] border border-[#E6E8EC] hover:bg-slate-50',
        ghost: 'bg-transparent text-[#17243A] hover:bg-slate-100',
        danger: 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100',
    };

    return (
        <button
            {...props}
            type={type ?? 'button'}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
}

export function PageHeader({
    title,
    description,
    actions,
    eyebrow,
    compact = true,
}: {
    title: string;
    description?: ReactNode;
    actions?: ReactNode;
    eyebrow?: string;
    /** Tighter spacing for pages that control their own vertical rhythm. */
    compact?: boolean;
}) {
    const marginClass = compact ? 'mb-4' : 'mb-6';

    return (
        <header className={`${marginClass} flex flex-col gap-3 md:flex-row md:items-end md:justify-between`}>
            <div className="min-w-0">
                {eyebrow && (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#667085]">{eyebrow}</p>
                )}
                <h1 className="text-2xl font-bold tracking-[-0.02em] text-[#17243A] sm:text-[2rem]">{title}</h1>
                {description && <div className="mt-1.5 text-sm text-[#667085]">{description}</div>}
            </div>

            {actions && (
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    {actions}
                </div>
            )}
        </header>
    );
}

export function PremiumCard({
    children,
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            {...props}
            className={`rounded-2xl border border-[#E6E8EC] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.03)] ${className}`}
        >
            {children}
        </div>
    );
}

function StatCardBody({
    label,
    value,
    sub,
    icon,
    iconTone,
    compact,
    className = '',
}: {
    label: string;
    value: ReactNode | null;
    sub?: ReactNode;
    icon?: ReactNode;
    iconTone?: string;
    compact?: boolean;
    className?: string;
}) {
    return (
        <div className={`relative overflow-hidden rounded-2xl border border-[#DFE5F0] bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.05)] ${className}`}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1D4ED8]/80 via-[#2563EB]/50 to-[#0F766E]/70" />
            <div className="flex items-start justify-between gap-3">
                <p className={`min-w-0 pr-1 font-semibold uppercase tracking-[0.16em] text-[#667085] ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
                    {label}
                </p>
                {icon && (
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/60 ${iconTone ?? 'bg-[#EAF1FF] text-[#1D4ED8]'}`}>
                        {icon}
                    </span>
                )}
            </div>
            <div className={compact ? 'mt-2 min-h-[1.75rem]' : 'mt-3 min-h-[2rem]'}>
                {value === null ? (
                    <SkeletonRow className={compact ? 'h-6 w-24' : 'h-7 w-32'} />
                ) : (
                    <p className={`break-words font-semibold leading-tight tabular-nums text-[#17243A] ${compact ? 'text-lg' : 'text-2xl'}`}>
                        {value}
                    </p>
                )}
            </div>
            {sub && (
                <p className={`mt-1.5 text-[#667085] ${compact ? 'text-[11px]' : 'text-xs'}`}>
                    {sub}
                </p>
            )}
        </div>
    );
}

export function StatCard({
    label,
    value,
    sub,
    icon,
    iconTone,
    compact,
    className = '',
}: {
    label: string;
    value: ReactNode | null;
    sub?: ReactNode;
    icon?: ReactNode;
    iconTone?: string;
    compact?: boolean;
    className?: string;
}) {
    return (
        <StatCardBody
            label={label}
            value={value}
            sub={sub}
            icon={icon}
            iconTone={iconTone}
            compact={compact}
            className={className}
        />
    );
}

export function StatCardButton({
    label,
    value,
    sub,
    icon,
    iconTone,
    onClick,
    className = '',
}: {
    label: string;
    value: ReactNode | null;
    sub?: ReactNode;
    icon?: ReactNode;
    iconTone?: string;
    onClick: () => void;
    className?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group block w-full min-w-0 rounded-2xl text-left transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/40 focus-visible:ring-offset-2 ${className}`}
        >
            <StatCardBody
                label={label}
                value={value}
                sub={sub}
                icon={icon}
                iconTone={iconTone}
                className="transition-all duration-200 group-hover:border-[#C7D2E5] group-hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
            />
        </button>
    );
}

export function StatusPill({
    label,
    tone = 'neutral',
}: {
    label: string;
    tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}) {
    const tones: Record<string, string> = {
        neutral: 'bg-slate-100 text-slate-700',
        success: 'bg-[#0F766E]/10 text-[#0F766E]',
        warning: 'bg-amber-50 text-amber-700',
        danger: 'bg-red-50 text-red-700',
        info: 'bg-blue-50 text-[#1D4ED8]',
    };

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
            {label}
        </span>
    );
}

export function DataTable({
    headers,
    rows,
    className = '',
}: {
    headers: string[];
    rows: ReactNode[];
    className?: string;
}) {
    return (
        <div className={`overflow-hidden rounded-2xl border border-[#E6E8EC] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.03)] ${className}`}>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#E6E8EC] text-left text-sm">
                    <thead className="bg-[#1D4ED8] text-[11px] uppercase tracking-[0.12em] text-white">
                        <tr>
                            {headers.map((header) => (
                                <th key={header} className="px-4 py-3.5 font-semibold text-left text-white">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6E8EC] bg-white">{rows}</tbody>
                </table>
            </div>
        </div>
    );
}

export function TablePagination({
    page,
    pageSize,
    total,
    onPageChange,
}: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
}) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);

    return (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E6E8EC] bg-white px-3 py-2.5 shadow-sm">
            <p className="text-xs text-[#667085]">
                Showing {start}-{end} of {total}
            </p>
            <div className="flex items-center gap-2">
                <AppButton variant="secondary" className="px-2.5 py-1.5 text-xs shadow-none" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                    Previous
                </AppButton>
                <span className="text-xs font-medium text-[#344054]">
                    Page {page} of {totalPages}
                </span>
                <AppButton variant="secondary" className="px-2.5 py-1.5 text-xs shadow-none" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                    Next
                </AppButton>
            </div>
        </div>
    );
}

export function EmptyState({
    icon,
    title,
    description,
    action,
}: {
    icon: ReactNode;
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-dashed border-[#D8DEE8] bg-slate-50/80 p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#1D4ED8] shadow-sm">
                {icon}
            </div>
            <p className="text-base font-semibold text-[#17243A]">{title}</p>
            <p className="mt-2 text-sm text-[#667085]">{description}</p>
            {action && <div className="mt-5 flex justify-center">{action}</div>}
        </div>
    );
}

const modalSizes = {
    md: 'sm:max-w-md',
    lg: 'sm:max-w-xl',
    xl: 'sm:max-w-2xl',
} as const;

/**
 * Shared dialog shell. Centered card on >=sm screens, bottom sheet on phones.
 * The panel never exceeds the viewport height; the body scrolls instead of clipping.
 * Mount it conditionally (`{open && <Modal ...>}`).
 */
export function Modal({
    title,
    eyebrow,
    onClose,
    size = 'xl',
    children,
}: {
    title: string;
    eyebrow?: string;
    onClose: () => void;
    size?: keyof typeof modalSizes;
    children: ReactNode;
}) {
    const titleId = useId();

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#17243A]/50 p-3 sm:p-4" onClick={onClose}>
            <div className="flex min-h-full items-center justify-center">
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    onClick={(event) => event.stopPropagation()}
                    className={`flex w-full flex-col rounded-2xl border border-[#E6E8EC] bg-white shadow-xl ${modalSizes[size]}`}
                >
                    <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#E6E8EC] px-5 py-4 sm:px-6">
                        <div className="min-w-0">
                            {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#667085]">{eyebrow}</p>}
                            <h2 id={titleId} className={`${eyebrow ? 'mt-1.5' : ''} text-lg font-semibold text-[#17243A] sm:text-xl`}>{title}</h2>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label={`Close ${title.toLowerCase()} dialog`}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E6E8EC] text-[#667085] transition-colors hover:bg-slate-50 hover:text-[#17243A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/40"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="px-5 py-4 sm:px-6">{children}</div>
                </div>
            </div>
        </div>
    );
}

export function SkeletonRow({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

export function TabList({
    tabs,
    active,
    onChange,
}: {
    tabs: { id: string; label: string }[];
    active: string;
    onChange: (id: string) => void;
}) {
    return (
        <div className="relative">
            <div className="overflow-x-auto pb-1 sm:overflow-visible sm:pb-0" tabIndex={0} aria-label="Scroll project sections horizontally">
                <div className="inline-flex min-w-max gap-2 rounded-xl border border-[#DCE7FF] bg-[#EEF4FF] p-1" role="tablist" aria-label="Project sections">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={active === tab.id}
                            aria-controls={`${tab.id}-panel`}
                            onClick={() => onChange(tab.id)}
                            className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/40 focus-visible:ring-offset-2 ${active === tab.id
                                ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white shadow-sm'
                                : 'border-transparent bg-[#F8FAFF] text-[#3B4A66] hover:border-[#DCE7FF] hover:bg-[#EAF1FF] hover:text-[#17243A]'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#EEF4FF] via-[#EEF4FF]/90 to-transparent sm:hidden" />
        </div>
    );
}
