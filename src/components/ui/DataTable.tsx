import { EmptyState } from '@/components/ui/DesignSystem';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode, useEffect, useMemo, useState } from 'react';

/* ==========================================================================
   DataTable: the one table used on every list page.

   - Desktop: a table with a light header, roomy rows, optional sortable columns.
   - Mobile (< md): the same rows as cards. The first column is the card title,
     the actions column sits top-right, every other column becomes "label: value".
   - Loading shows skeleton rows under the real header. Empty shows one standard
     empty state. Pagination sits in the card footer.
   - Styling comes from the .data-table / token classes in index.css.
   ========================================================================== */

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  /** Provide a value to make the column sortable. */
  sortValue?: (row: T) => string | number | null | undefined;
  /** Tailwind width class for the column, e.g. 'w-40'. */
  width?: string;
  /** Marks the row-actions column (kept top-right on mobile, never sortable). */
  kind?: 'actions';
  /** Hide this column in the mobile card. */
  hideOnMobile?: boolean;
};

export type EmptyConfig = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  loadingRows?: number;
  empty?: EmptyConfig;
  onRowClick?: (row: T) => void;
  /** Pass all (filtered) rows. DataTable sorts them first, then slices the current page. */
  pagination?: { page: number; pageSize: number; onPageChange: (page: number) => void };
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
  /** Screen-reader name for the table. */
  caption?: string;
  className?: string;
  /** Render without its own card border/shadow, for use inside a card that already has a header. */
  bare?: boolean;
  /** 'cards' (default) turns rows into cards below md; 'scroll' keeps the table and scrolls sideways. */
  mobileLayout?: 'cards' | 'scroll';
  /** Tighter rows for dashboard widgets. */
  dense?: boolean;
  /** Header colour: 'soft' (default brand tint), 'navy', 'brand' or 'light'. */
  headerTone?: 'soft' | 'navy' | 'brand' | 'light';
  /** Alternate row backgrounds. */
  striped?: boolean;
  /** Tint a row, e.g. overdue bills 'danger', void items 'muted', accepted quotes 'success'. */
  rowTone?: (row: T) => 'success' | 'warning' | 'danger' | 'muted' | undefined;
};

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

const alignClass = { left: 'text-left', right: 'is-num text-right', center: 'text-center' } as const;

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  loadingRows = 6,
  empty,
  onRowClick,
  pagination,
  defaultSort,
  caption,
  className = '',
  bare = false,
  mobileLayout = 'cards',
  dense = false,
  headerTone = 'soft',
  striped = false,
  rowTone,
}: Props<T>) {
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(defaultSort ?? null);

  const sortedRows = useMemo(() => {
    const col = sort ? columns.find((c) => c.key === sort.key) : undefined;
    if (!sort || !col?.sortValue) return rows;
    const get = col.sortValue;
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1; // empty values always last
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return collator.compare(String(av), String(bv)) * dir;
    });
  }, [rows, sort, columns]);

  const total = sortedRows.length;
  const totalPages = pagination ? Math.max(1, Math.ceil(total / pagination.pageSize)) : 1;
  const page = pagination ? Math.min(Math.max(1, pagination.page), totalPages) : 1;

  // If filtering leaves the current page out of range, snap back.
  useEffect(() => {
    if (pagination && pagination.page !== page) pagination.onPageChange(page);
  }, [pagination, page]);

  const visibleRows = pagination ? sortedRows.slice((page - 1) * pagination.pageSize, page * pagination.pageSize) : sortedRows;

  const toggleSort = (key: string) => {
    setSort((prev) => (prev?.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }));
    pagination?.onPageChange(1);
  };

  const rowProps = (row: T) => {
    const tone = rowTone?.(row);
    const toneClass = tone ? `row-${tone}` : '';
    return onRowClick
      ? {
        onClick: () => onRowClick(row),
        onKeyDown: (e: KeyboardEvent<HTMLTableRowElement>) => {
          if (e.key === 'Enter' && e.target === e.currentTarget) onRowClick(row);
        },
        tabIndex: 0,
        className: `cursor-pointer ${toneClass}`.trim(),
      }
      : { className: toneClass };
  };

  if (!loading && rows.length === 0 && empty) {
    return (
      <div className={className}>
        <EmptyState icon={empty.icon} title={empty.title} description={empty.description} action={empty.action} />
      </div>
    );
  }

  const titleCol = columns.find((c) => c.kind !== 'actions');
  const actionsCol = columns.find((c) => c.kind === 'actions');
  const detailCols = columns.filter((c) => c !== titleCol && c !== actionsCol && !c.hideOnMobile);

  return (
    <div className={`${bare ? '' : 'overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]'} ${className}`}>
      {/* Desktop table (and every width when mobileLayout="scroll") */}
      <div className={mobileLayout === 'scroll' ? 'overflow-x-auto' : 'hidden overflow-x-auto md:block'}>
        <table className={`data-table ${headerTone === 'soft' ? '' : `data-table--${headerTone}`} ${striped ? 'data-table--striped' : ''} min-w-full ${dense ? '[&_td]:!py-2.5 [&_th]:!py-2.5' : ''}`} aria-busy={loading}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((col) => {
                const sortable = Boolean(col.sortValue) && col.kind !== 'actions';
                const active = sort?.key === col.key ? sort.direction : null;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={active ? (active === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={`${alignClass[col.align ?? (col.kind === 'actions' ? 'right' : 'left')].replace('is-num ', '')} ${col.width ?? ''}`}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={`-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 font-semibold transition-colors hover:opacity-80`}
                      >
                        {col.header}
                        {active === 'asc' ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : active === 'desc' ? (
                          <ArrowDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: loadingRows }).map((_, i) => (
                <tr key={`sk-${i}`} className="skeleton-row">
                  {columns.map((col) => (
                    <td key={col.key}>
                      <div className="h-4 animate-pulse rounded bg-[var(--border)]" style={{ width: `${55 + ((i + col.key.length) % 4) * 10}%` }} />
                    </td>
                  ))}
                </tr>
              ))
              : visibleRows.map((row) => (
                <tr key={rowKey(row)} {...rowProps(row)}>
                  {columns.map((col) => (
                    <td key={col.key} className={alignClass[col.align ?? (col.kind === 'actions' ? 'right' : 'left')]}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      {mobileLayout === 'cards' && (
        <ul className="divide-y divide-[var(--border)] md:hidden" aria-busy={loading}>
          {loading
            ? Array.from({ length: Math.min(loadingRows, 4) }).map((_, i) => (
              <li key={`skm-${i}`} className="space-y-2 p-4">
                <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--border)]" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-[var(--border)]" />
              </li>
            ))
            : visibleRows.map((row) => (
              <li
                key={rowKey(row)}
                className={`space-y-3 p-4 ${onRowClick ? 'cursor-pointer active:bg-[var(--surface-soft)]' : ''}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                <div className="min-w-0 text-sm font-medium text-[var(--text)]">{titleCol?.cell(row)}</div>
                {detailCols.length > 0 && (
                  <dl className="space-y-1.5 text-sm">
                    {detailCols.map((col) => (
                      <div key={col.key} className="flex items-start justify-between gap-4">
                        <dt className="shrink-0 text-xs font-medium text-[var(--text-muted)]">{col.header}</dt>
                        <dd className="min-w-0 text-right text-[var(--text)]">{col.cell(row)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {actionsCol && <MobileActions>{actionsCol.cell(row)}</MobileActions>}
              </li>
            ))}
        </ul>
      )}

      {/* Footer: pagination */}
      {pagination && !loading && total > 0 && (
        <div className="data-footer flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
          <p className="text-xs text-[var(--text-secondary)]">
            Showing {(page - 1) * pagination.pageSize + 1}–{Math.min(page * pagination.pageSize, total)} of {total}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <PagerButton disabled={page <= 1} onClick={() => pagination.onPageChange(page - 1)}>
                Previous
              </PagerButton>
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Page {page} of {totalPages}
              </span>
              <PagerButton disabled={page >= totalPages} onClick={() => pagination.onPageChange(page + 1)}>
                Next
              </PagerButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Row actions sit in a footer strip on mobile cards (7 icons would not fit beside the title). */
function MobileActions({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <div className="flex flex-wrap items-center justify-end gap-1 border-t border-[var(--border)] pt-3">{children}</div>;
}

function PagerButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="inline-flex h-8 items-center rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-xs font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}

/* ---------- Cell helpers: use these so every table reads the same ---------- */

/** Primary text with an optional muted second line (name + type, mobile + email ...). */
export function CellStack({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="truncate font-medium text-[var(--text)]">{title || '—'}</div>
      {subtitle ? <div className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{subtitle}</div> : null}
    </div>
  );
}

/** Secondary text that shows an em dash instead of an empty cell. */
export function CellText({ children, muted = false }: { children?: ReactNode; muted?: boolean }) {
  const empty = children === undefined || children === null || children === '' || children === false;
  return <span className={muted || empty ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'}>{empty ? '—' : children}</span>;
}

/** The standard row-actions container. Put RowActionButton children inside. */
export function RowActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-1">{children}</div>;
}

export function RowActionButton({
  label,
  icon,
  tone = 'default',
  onClick,
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & { label: string; icon: ReactNode; tone?: 'default' | 'danger' }) {
  return (
    <button
      type="button"
      {...rest}
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation(); // don't trigger the row's own click
        onClick?.(e);
      }}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${tone === 'danger'
          ? 'text-[var(--text-muted)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger-fg)]'
          : 'text-[var(--text-muted)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]'
        }`}
    >
      {icon}
    </button>
  );
}
