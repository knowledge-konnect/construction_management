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
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    loading?: boolean;
    loadingText?: string;
}) {
    const variants: Record<string, string> = {
        primary: 'bg-[var(--primary)] text-white shadow-sm hover:bg-[var(--primary-hover)]',
        secondary: 'border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-soft)]',
        outline: 'border border-[var(--primary)]/30 bg-[var(--surface)] text-[var(--primary)] hover:bg-[var(--primary-soft)]',
        ghost: 'bg-transparent text-[var(--text)] hover:bg-[var(--surface-soft)]',
        danger: 'bg-[var(--danger)] text-white shadow-sm hover:bg-[var(--danger-fg)]',
    };

    return (
        <button
            {...props}
            type={type ?? 'button'}
            disabled={props.disabled || loading}
            aria-busy={loading}
            className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
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
                    <p className="text-sm font-semibold text-[var(--primary)]">{eyebrow}</p>
                )}
                <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text)] sm:text-[28px]">{title}</h1>
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
        <div className={`relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] ${className}`}>
            <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 truncate pr-1 text-xs font-medium text-[var(--text-secondary)]">
                    {label}
                </p>
                {icon && (
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconTone ?? 'bg-[var(--primary-soft)] text-[var(--primary)]'}`}>
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
                <p className="mt-1.5 text-xs text-[var(--text-secondary)]">
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
            className={`group block w-full min-w-0 rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 ${className}`}
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
    // Soft tint + dark text of the same hue. Colours live in index.css (.badge-*).
    return <span className={`badge badge-${tone}`}>{label}</span>;
}

export function EmptyState({
    icon,
    title,
    description,
    action,
}: {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    // Same empty state as DataTable, so lists and cards look the same when there is nothing to show.
    return (
        <div className="data-empty rounded-2xl px-6 py-12 text-center">
            {icon && (
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--primary)] shadow-sm ring-1 ring-[var(--border)]">
                    {icon}
                </div>
            )}
            <p className="text-base font-semibold text-[var(--text)]">{title}</p>
            {description && <p className="mx-auto mt-1.5 max-w-md text-sm text-[var(--text-secondary)]">{description}</p>}
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
                        {eyebrow && <p className="text-xs font-semibold text-[var(--primary)]">{eyebrow}</p>}
                        <h2 id={titleId} className={`${eyebrow ? (compactHeader ? 'mt-1' : 'mt-1.5') : ''} text-lg font-semibold text-[var(--text)] sm:text-xl`}>{title}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={`Close ${title.toLowerCase()} dialog`}
                        className={`inline-flex shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${compactHeader ? 'h-8 w-8' : 'h-9 w-9'}`}
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
    return <div className={`animate-pulse rounded-lg bg-[var(--border)] ${className}`} />;
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
                <div className="inline-flex min-w-max gap-1.5 rounded-xl border border-[var(--primary)]/15 bg-[var(--surface-alt)] p-1" role="tablist" aria-label="Project sections">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={active === tab.id}
                            aria-controls={`${tab.id}-panel`}
                            onClick={() => onChange(tab.id)}
                            className={`shrink-0 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 ${active === tab.id
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
