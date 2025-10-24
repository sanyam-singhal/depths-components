'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface BaseChartProps {
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export interface TableColumn { key: string; label: string; width?: number; align?: 'left'|'right'|'center'; }
export type TableRow = Record<string, unknown>;

export interface DataTableProps extends BaseChartProps {
  readonly title?: string;
  readonly columns: ReadonlyArray<Readonly<TableColumn>>;
  readonly rows: ReadonlyArray<TableRow>;
  readonly total?: number;
  readonly onExportCSV?: () => void;      // external handler (kept for drop-in)
  readonly searchable?: boolean;
  readonly pageSize?: number;             // new: defaults to 4 for the demo
}

export function DataTable(props: DataTableProps): React.JSX.Element {
  const {
    title,
    columns,
    rows,
    total,
    onExportCSV,
    searchable = true,
    pageSize = 4,
    className,
    isLoading,
    error,
    ...a11y
  } = props;

  // ---- search (debounced rendering, keeps input snappy) ----
  const [query, setQuery] = React.useState('');
  const dq = React.useDeferredValue(query); // defers expensive filter work. :contentReference[oaicite:1]{index=1}

  const filtered = React.useMemo(() => {
    if (!dq) return rows;
    const q = dq.toLowerCase();
    return rows.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(q)));
  }, [rows, dq]);

  // ---- pagination (after filtering) ----
  const [page, setPage] = React.useState(1);
  React.useEffect(() => setPage(1), [dq, rows, pageSize]); // reset on data/query changes

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageRows = React.useMemo(() => filtered.slice(start, start + pageSize), [filtered, start, pageSize]);

  // ---- simple states ----
  if (error) {
    return (
      <div {...a11y} className={['rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive', className ?? ''].join(' ')}>
        {(error as Error).message ?? 'Something went wrong.'}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div {...a11y} className={['space-y-3', className ?? ''].join(' ')}>
        {title && <div className="text-base font-semibold">{title}</div>}
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="h-9 w-full animate-pulse rounded bg-muted" />
          <div className="mt-3 h-56 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  // ---- UI ----
  return (
    <div {...a11y} className={['rounded-lg border border-border bg-card p-3 @md:p-4 shadow-sm w-full space-y-3', className ?? ''].join(' ')}>
      {/* Title + toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {title && <div className="text-lg font-semibold text-foreground">{title}</div>}
        <div className="ms-auto flex w-full items-center gap-2 @md:w-auto">
          {searchable && (
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full @md:w-64"
            />
          )}
          <div className="shrink-0 text-sm text-muted-foreground">
            {`${filtered.length} of ${total ?? rows.length}`}
          </div>
          {onExportCSV && (
            <Button variant="outline" onClick={onExportCSV}>
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-lg border border-border bg-card">
        <table className="min-w-full text-sm">
          {/* Keep a semantic caption (visually hidden) to title the table for AT. */}
          {title && <caption className="sr-only">{title}</caption>}

          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{ width: c.width as number | undefined }}
                  className={[
                    // sticky header on each <th>. :contentReference[oaicite:2]{index=2}
                    'sticky top-0 z-10 bg-muted/60 backdrop-blur supports-[backdrop-filter]:bg-muted/40',
                    'px-3 py-2.5 @md:py-3 text-left font-medium text-foreground/90',
                    c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                  ].join(' ')}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>

            <tbody className="text-card-foreground">
              {pageRows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="border-t border-border odd:bg-muted/[0.35] hover:bg-muted/50"
                >
                  {columns.map((c) => {
                    const v = row[c.key];
                    const align =
                      c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left';
                    const numeric = c.align === 'right';
                    return (
                      <td
                        key={c.key}
                        className={[
                          'px-3 py-2.5 @md:py-3',
                          align,
                          numeric ? 'tabular-nums' : 'truncate', // aligned digits for numeric cols. :contentReference[oaicite:3]{index=3}
                        ].join(' ')}
                        title={typeof v === 'string' ? v : undefined}
                      >
                        {String(v ?? '')}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-6 text-center text-muted-foreground">
                    No results.
                  </td>
                </tr>
              )}
            </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          Page {page} of {pageCount}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Prev
          </Button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page === pageCount}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
