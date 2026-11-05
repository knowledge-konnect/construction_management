import { ButtonLoader } from '@/components/loading/Loaders';
import { X } from 'lucide-react';
import { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode, useEffect, useId } from 'react';

export function AppButton({
    children,
    variant = 'primary',
    className = '',
    type,
    loading = false,
    loadingText,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'destructive';
    loading?: boolean;
    loadingText?: string;
}) {
    const variants: Record<string, string> = {
        primary: 'bg-[var(--primary)] text-white shadow-sm hover:bg-[var(--primary-hover)]',
        secondary: 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-soft)]',
        outline: 'border border-[var(--primary)]/30 bg-white text-[var(--primary)] hover:bg-[var(--primary-soft)]',
        ghost: 'bg-transparent text-[var(--text)] hover:bg-[var(--surface-soft)]',
        danger: 'bg-[var(--danger)] text-white shadow-sm hover:bg-[#B91C1C]',
        destructive: 'bg-[var(--danger)] text-white shadow-sm hover:bg-[#B91C1C]',
    };

    return (
        <button
            {...props}
            type={type ?? 'button'}
            disabled={props.disabled || loading}
            aria-busy={loading}
            className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(36,84,214,0.3)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
        >
            {loading ? <ButtonLoader label={loadingText} /> : children}
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
    compact?: boolean;
}) {
    const marginClass = compact ? 'mb-4' : 'mb-6';

    return (
        <header className={`${marginClass} flex flex-col gap-3 md:flex-row md:items-end md:justify-between`}>
            <div className="min-w-0">
                {eyebrow && (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">{eyebrow}</p>
                )}
                <h1 className="text-[28px] font-bold tracking-[-0.04em] text-[var(--text)] sm:text-[2rem]">{title}</h1>
                {description && <div className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">{description}</div>}
            </div>

            {actions && <div className="flex flex-wrap items-center gap-2 md:justify-end">{actions}</div>}
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
            className={`surface-card ${className}`}
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
        <div className={`relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft ${className}`}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--primary)]/85 via-[var(--primary)]/45 to-[var(--success)]/80" />
            <div className="flex items-start justify-between gap-3">
                <p className={`min-w-0 pr-1 font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)] ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
                    {label}
                </p>
                {icon && (
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white ${iconTone ?? 'bg-[var(--primary-soft)] text-[var(--primary)]'}`}>
                        {icon}
                    </span>
                )}
            </div>
            <div className={compact ? 'mt-2 min-h-[1.75rem]' : 'mt-3 min-h-[2rem]'}>
                {value === null ? (
                    <SkeletonRow className={compact ? 'h-6 w-24' : 'h-7 w-32'} />
                ) : (
                    <p className={`break-words font-semibold leading-tight tabular-nums text-[var(--text)] ${compact ? 'text-lg' : 'text-2xl'}`}>
                        {value}
                    </p>
                )}
            </div>
            {sub && (
                <p className={`mt-1.5 text-[var(--text-secondary)] ${compact ? 'text-[11px]' : 'text-xs'}`}>
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
            className={`group block w-full min-w-0 rounded-2xl text-left transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(36,84,214,0.3)] focus-visible:ring-offset-2 ${className}`}
        >
            <StatCardBody
                label={label}
                value={value}
                sub={sub}
                icon={icon}
                iconTone={iconTone}
                className="transition-all duration-200 group-hover:border-[var(--primary)]/20 group-hover:shadow-card"
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
        neutral: 'border border-slate-200 bg-slate-100 text-slate-700',
        success: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
        warning: 'border border-amber-200 bg-amber-50 text-amber-700',
        danger: 'border border-red-200 bg-red-50 text-red-700',
        info: 'border border-blue-200 bg-blue-50 text-[var(--primary)]',
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
        <div className={`overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-soft ${className}`}>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--border)] text-left text-sm">
                    <thead className="bg-[var(--surface-soft)] text-[11px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                        <tr>
                            {headers.map((header) => (
                                <th key={header} className="px-4 py-3.5 font-semibold text-left">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">{rows}</tbody>
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
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 shadow-sm">
            <p className="text-xs text-[var(--text-secondary)]">
                Showing {start}-{end} of {total}
            </p>
            <div className="flex items-center gap-2">
                <AppButton variant="secondary" className="px-2.5 py-1.5 text-xs shadow-none" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                    Previous
                </AppButton>
                <span className="text-xs font-medium text-[var(--text-secondary)]">
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
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-8 text-center shadow-soft">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--primary)]/15 bg-[var(--surface)] text-[var(--primary)] shadow-sm">
                {icon}
            </div>
            <p className="text-base font-semibold text-[var(--text)]">{title}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
            {action && <div className="mt-5 flex justify-center">{action}</div>}
        </div>
    );
}

const modalSizes = {
    md: 'sm:max-w-md',
    lg: 'sm:max-w-xl',
    xl: 'sm:max-w-2xl',
    '2xl': 'sm:max-w-4xl',
} as const;

export function Modal({
    title,
    eyebrow,
    onClose,
    size = 'xl',
    compactHeader = false,
    children,
}: {
    title: string;
    eyebrow?: string;
    onClose: () => void;
    size?: keyof typeof modalSizes;
    compactHeader?: boolean;
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--navy)]/50 p-3 sm:p-4" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onClick={(event) => event.stopPropagation()}
                className={`flex max-h-[85vh] w-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-modal ${modalSizes[size]}`}
            >
                <div className={`flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface-soft)] px-5 sm:px-6 ${compactHeader ? 'py-2.5' : 'py-4'}`}>
                    <div className="min-w-0">
                        {eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">{eyebrow}</p>}
                        <h2 id={titleId} className={`${eyebrow ? (compactHeader ? 'mt-1' : 'mt-1.5') : ''} text-lg font-semibold text-[var(--text)] sm:text-xl`}>{title}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={`Close ${title.toLowerCase()} dialog`}
                        className={`inline-flex shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(36,84,214,0.3)] ${compactHeader ? 'h-8 w-8' : 'h-9 w-9'}`}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>
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
                <div className="inline-flex min-w-max gap-2 rounded-xl border border-[var(--primary)]/15 bg-[var(--surface-alt)] p-1" role="tablist" aria-label="Project sections">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={active === tab.id}
                            aria-controls={`${tab.id}-panel`}
                            onClick={() => onChange(tab.id)}
                            className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30 focus-visible:ring-offset-2 ${active === tab.id
                                ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm'
                                : 'border-transparent bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[var(--primary-soft)] hover:text-[var(--text)]'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[var(--surface-alt)] via-[var(--surface-alt)]/90 to-transparent sm:hidden" />
        </div>
    );
}
