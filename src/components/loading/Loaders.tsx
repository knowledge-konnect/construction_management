import BrandLogo from '@/components/BrandLogo';
import { Loader2 } from 'lucide-react';

type AppLoaderProps = {
    message?: string;
    fullscreen?: boolean;
};

export function AppLoader({ message = 'Loading BuilderDocs…', fullscreen = true }: AppLoaderProps) {
    return (
        <div
            className={`${fullscreen ? 'min-h-screen' : 'min-h-[220px]'} flex items-center justify-center bg-[var(--bg)] p-6`}
            role="status"
            aria-live="polite"
        >
            <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-card">
                <div className="mx-auto mb-2 inline-flex items-center justify-center">
                    <BrandLogo variant="mark" size="lg" />
                </div>
                <div className="mx-auto mb-3 inline-flex h-5 w-5 items-center justify-center text-[#1D4ED8]">
                    <Loader2 className="h-4 w-4 motion-safe:animate-spin" />
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
            <Loader2 className="h-4 w-4 text-[#1D4ED8] motion-safe:animate-spin" />
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
                <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
                <div className="h-4 w-80 max-w-full animate-pulse rounded-lg bg-slate-200" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
                    ))}
                </div>
                <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            </div>
        );
    }

    if (variant === 'table') {
        return (
            <div className={`rounded-2xl border border-slate-200 bg-white p-4 ${className}`} aria-busy="true" aria-label="Loading table">
                <div className="mb-3 h-4 w-40 animate-pulse rounded bg-slate-200" />
                <div className="space-y-2">
                    {Array.from({ length: rows }).map((_, index) => (
                        <div key={index} className="h-10 animate-pulse rounded-lg bg-slate-100" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`rounded-2xl border border-slate-200 bg-white p-6 ${className}`} aria-busy="true" aria-label="Loading card">
            <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 space-y-2">
                {Array.from({ length: rows }).map((_, index) => (
                    <div key={index} className="h-4 animate-pulse rounded bg-slate-100" />
                ))}
            </div>
        </div>
    );
}

export function InlineLoader({ label = 'Loading…' }: { label?: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)]" role="status" aria-live="polite">
            <Loader2 className="h-3.5 w-3.5 text-[#1D4ED8] motion-safe:animate-spin" />
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
        <div className="rounded-xl border border-[#DDE8FF] bg-[#F8FAFF] px-3 py-2.5" role="status" aria-live="polite">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-[#17243B]">{label}</p>
                <span className="text-xs text-[#344054]">{normalized !== null ? `${normalized}%` : 'In progress'}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
                <div
                    className={`h-full rounded-full bg-[#17243B] ${normalized === null ? 'w-1/3 motion-safe:animate-pulse' : ''}`}
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
        <div className="inline-flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-sm text-[#17243B]" role="status" aria-live="polite">
            <Loader2 className="h-4 w-4 text-[#1D4ED8] motion-safe:animate-spin" />
            <span>{label}</span>
            {normalized !== null && <span className="text-xs font-semibold text-[#1D4ED8]">{normalized}%</span>}
        </div>
    );
}
