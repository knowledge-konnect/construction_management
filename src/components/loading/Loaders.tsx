import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import AnimatedBrandMark from './AnimatedBrandMark';

type AppLoaderProps = {
    message?: string;
    fullscreen?: boolean;
};

// AppLoader is only ever mounted while its caller's own "loading" flag is true (see
// ProtectedRoute, RequireCompany, etc.) — it has no visibility into how long that will
// last. Waiting this long before rendering anything avoids a one-frame flash of the
// loader on fast transitions, without adding any delay to genuinely slow loads (where
// the loader simply appears a little later, which is imperceptible).
const APP_LOADER_SHOW_DELAY_MS = 150;

export function AppLoader({ message = 'Loading BuilderDocs…', fullscreen = true }: AppLoaderProps) {
    const [show, setShow] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setShow(true), APP_LOADER_SHOW_DELAY_MS);
        return () => clearTimeout(t);
    }, []);
    if (!show) return null;

    return (
        <div
            // fullscreen=false is used inside Layout's <main>, which has no height of its
            // own — it only grows to fit its content. A short fixed height here (220px)
            // meant the loader just sat near the top of the page instead of looking
            // centered. min-h-[60vh] gives it enough room to actually center within,
            // consistently, regardless of which page embeds it.
            className={`${fullscreen ? 'min-h-screen' : 'min-h-[60vh]'} flex items-center justify-center bg-[var(--bg)] p-6`}
            role="status"
            aria-live="polite"
        >
            <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-card">
                {/* The mark itself is the loading indicator — it animates (buildings rise,
                    then the document draws in) rather than pairing a static logo with a
                    separate generic spinner. */}
                <div className="mx-auto mb-3 inline-flex items-center justify-center">
                    <AnimatedBrandMark className="h-14 w-14" />
                </div>
                <p className="text-sm font-semibold text-[var(--text)]">BuilderDocs</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{message}</p>
            </div>
        </div>
    );
}

export function ButtonLoader({ label = 'Please wait…' }: { label?: string }) {
    return (
        <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-[var(--primary)] motion-safe:animate-spin" />
            <span>{label}</span>
        </span>
    );
}

type SkeletonLoaderProps = {
    variant?: 'page' | 'card' | 'table';
    rows?: number;
    className?: string;
};

export function SkeletonLoader({ variant = 'card', rows = 4, className = '' }: SkeletonLoaderProps) {
    if (variant === 'page') {
        return (
            <div className={`space-y-4 ${className}`} aria-busy="true" aria-label="Loading content">
                <div className="h-8 w-56 animate-pulse rounded-lg bg-[var(--border)]" />
                <div className="h-4 w-80 max-w-full animate-pulse rounded-lg bg-[var(--border)]" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-24 animate-pulse rounded-2xl border border-[var(--border)] bg-white" />
                    ))}
                </div>
                <div className="h-64 animate-pulse rounded-2xl border border-[var(--border)] bg-white" />
            </div>
        );
    }

    if (variant === 'table') {
        return (
            <div className={`rounded-2xl border border-[var(--border)] bg-white p-4 ${className}`} aria-busy="true" aria-label="Loading table">
                <div className="mb-3 h-4 w-40 animate-pulse rounded bg-[var(--border)]" />
                <div className="space-y-2">
                    {Array.from({ length: rows }).map((_, index) => (
                        <div key={index} className="h-10 animate-pulse rounded-lg bg-[var(--surface-muted)]" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`rounded-2xl border border-[var(--border)] bg-white p-6 ${className}`} aria-busy="true" aria-label="Loading card">
            <div className="h-4 w-40 animate-pulse rounded bg-[var(--border)]" />
            <div className="mt-3 space-y-2">
                {Array.from({ length: rows }).map((_, index) => (
                    <div key={index} className="h-4 animate-pulse rounded bg-[var(--surface-muted)]" />
                ))}
            </div>
        </div>
    );
}

export function InlineLoader({ label = 'Loading…' }: { label?: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)]" role="status" aria-live="polite">
            <Loader2 className="h-3.5 w-3.5 text-[var(--primary)] motion-safe:animate-spin" />
            {label}
        </span>
    );
}

type FileUploadProgressProps = {
    label?: string;
    progress?: number | null;
};

export function FileUploadProgress({ label = 'Uploading file…', progress = null }: FileUploadProgressProps) {
    const normalized = typeof progress === 'number' && Number.isFinite(progress)
        ? Math.max(0, Math.min(100, Math.round(progress)))
        : null;

    return (
        <div className="rounded-xl border border-[var(--info-border)] bg-[var(--surface-soft)] px-3 py-2.5" role="status" aria-live="polite">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-[var(--text)]">{label}</p>
                <span className="text-xs text-[var(--text-secondary)]">{normalized !== null ? `${normalized}%` : 'In progress'}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--border)]">
                <div
                    className={`h-full rounded-full bg-[var(--navy)] ${normalized === null ? 'w-1/3 motion-safe:animate-pulse' : ''}`}
                    style={normalized !== null ? { width: `${normalized}%` } : undefined}
                />
            </div>
        </div>
    );
}

type DocumentGenerationLoaderProps = {
    label?: string;
    progress?: number | null;
};

export function DocumentGenerationLoader({ label = 'Generating PDF…', progress = null }: DocumentGenerationLoaderProps) {
    const normalized = typeof progress === 'number' && Number.isFinite(progress)
        ? Math.max(0, Math.min(100, Math.round(progress)))
        : null;

    return (
        <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--info-border)] bg-[var(--primary-soft)] px-3 py-2 text-sm text-[var(--text)]" role="status" aria-live="polite">
            <Loader2 className="h-4 w-4 text-[var(--primary)] motion-safe:animate-spin" />
            <span>{label}</span>
            {normalized !== null && <span className="text-xs font-semibold text-[var(--primary)]">{normalized}%</span>}
        </div>
    );
}
