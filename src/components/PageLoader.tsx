import { SkeletonLoader } from '@/components/loading/Loaders';

/** Route-level loading fallback: a quiet skeleton instead of a blank screen. */
export default function PageLoader() {
  return (
    <div className="min-h-screen bg-[var(--bg)] p-6 lg:p-10" role="status" aria-live="polite">
      <div className="mx-auto max-w-5xl">
        <SkeletonLoader variant="page" />
      </div>
    </div>
  );
}
