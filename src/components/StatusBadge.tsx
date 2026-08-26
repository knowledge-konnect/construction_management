import type { QuotationStatus } from '@/lib/models';

const STATUS_STYLES: Record<QuotationStatus, { label: string; className: string; dotClassName: string }> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
    dotClassName: 'bg-amber-500',
  },
  GENERATED: {
    label: 'Generated',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dotClassName: 'bg-emerald-500',
  },
  SENT: {
    label: 'Sent',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
    dotClassName: 'bg-blue-500',
  },
  ACCEPTED: {
    label: 'Accepted',
    className: 'bg-[#F4B72B]/10 text-[#7a5b0e] border border-[#F4B72B]/40',
    dotClassName: 'bg-[#F4B72B]',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-700 border border-red-200',
    dotClassName: 'bg-red-500',
  },
  EXPIRED: {
    label: 'Expired',
    className: 'bg-slate-100 text-slate-600 border border-slate-200',
    dotClassName: 'bg-slate-400',
  },
};

export default function StatusBadge({ status }: { status: QuotationStatus }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${style.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dotClassName}`} />
      {style.label}
    </span>
  );
}
