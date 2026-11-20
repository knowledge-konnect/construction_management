import type { QuotationStatus } from '@/lib/models';

type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

// Colours come from the shared tokens in index.css (.badge-* classes and --success etc.).
const STATUS_STYLES: Record<QuotationStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  GENERATED: { label: 'Generated', tone: 'info' },
  SENT: { label: 'Sent', tone: 'warning' },
  ACCEPTED: { label: 'Accepted', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
  EXPIRED: { label: 'Expired', tone: 'neutral' },
};

const DOT_COLOR: Record<Tone, string> = {
  neutral: 'bg-[var(--text-subtle)]',
  info: 'bg-[var(--info)]',
  warning: 'bg-[var(--warning)]',
  success: 'bg-[var(--success)]',
  danger: 'bg-[var(--danger)]',
};

export default function StatusBadge({ status }: { status: QuotationStatus }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT;
  return (
    <span className={`badge badge-${style.tone}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_COLOR[style.tone]}`} aria-hidden="true" />
      {style.label}
    </span>
  );
}
