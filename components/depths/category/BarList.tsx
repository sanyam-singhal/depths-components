'use client';

import * as React from 'react';

export type BaseChartProps = Readonly<{
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
  'aria-label'?: string;
  'aria-describedby'?: string;
}>;

export type CategoryItem = Readonly<{
  label: string;
  value: number;
  delta?: number;
}>;

export type BarListProps = Readonly<
  BaseChartProps & {
    title?: string;
    description?: string;
    items: ReadonlyArray<CategoryItem>;
    sort?: 'value' | 'delta' | 'label';
    topK?: number;
    valueFormatter?: (v: number) => string;
    deltaFormatter?: (d: number) => string;
    onItemClick?: (item: CategoryItem) => void;
  }
>;

/* ───────────────────────────────── helpers ───────────────────────────────── */

function formatNumber(v: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(v);
}

function formatPercent(value: number, fractionDigits: number = 1): string {
  const v = value * 100;
  return `${(value >= 0 ? '+' : '')}${v.toFixed(fractionDigits)}%`;
}

/* ───────────────────────────────── component ─────────────────────────────── */

export function BarList({
  title,
  description,
  items,
  sort = 'value',
  topK = 20,
  valueFormatter = formatNumber,
  deltaFormatter = formatPercent,
  onItemClick,
  className,
  isLoading,
  error,
  ...a11y
}: BarListProps): React.JSX.Element {
  const sorted = React.useMemo(() => {
    const arr = [...items];
    if (sort === 'delta') arr.sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0));
    else if (sort === 'label') arr.sort((a, b) => a.label.localeCompare(b.label));
    else arr.sort((a, b) => b.value - a.value);
    return arr.slice(0, topK);
  }, [items, sort, topK]);

  const max = React.useMemo(() => sorted.reduce((m, i) => Math.max(m, i.value), 0), [sorted]);

  // simple empty/error/loading states
  if (error) {
    return (
      <div
        {...a11y}
        className={[
          'rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive',
          className ?? '',
        ].join(' ')}
      >
        {String(error.message ?? 'Error loading data')}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        {...a11y}
        className={['rounded-lg border border-border bg-card p-3', className ?? ''].join(' ')}
      >
        <div className="space-y-2">
          {Array.from({ length: Math.min(topK, 8) }).map((_, i) => (
            <div key={i} className="h-6 w-full animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section
      {...a11y}
      className={[
        '@container',
        'rounded-lg border border-border bg-card shadow-sm p-3 @md:p-4',
        className ?? '',
      ].join(' ')}
    >
      {(title || description) && (
        <header className="mb-3">
          {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </header>
      )}

      <ul className="space-y-2">
        {sorted.map((it, idx) => {
          const barWidth = max > 0 ? (it.value / max) * 100 : 0;
          const deltaClass =
            typeof it.delta === 'number'
              ? it.delta > 0
                ? 'text-accent'
                : it.delta < 0
                ? 'text-destructive'
                : 'text-muted-foreground'
              : 'text-muted-foreground';

          return (
            <li
              key={it.label + String(idx)}
              role="button"
              tabIndex={0}
              onClick={() => onItemClick?.(it)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onItemClick?.(it);
                }
              }}
              className={[
                'flex items-center gap-3 rounded-md transition hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'p-1',
              ].join(' ')}
              aria-label={`${it.label}: ${valueFormatter(it.value)}${it.delta != null ? `, delta ${deltaFormatter(it.delta)}` : ''}`}
            >
              <div className="w-32 truncate text-sm text-muted-foreground @md:w-48">{it.label}</div>
              <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full transition-all duration-300 ease-out"
                  style={{
                    width: `${barWidth}%`,
                    background: `color-mix(in oklch, var(--color-chart-${(idx % 5) + 1}) 80%, transparent)`,
                  }}
                />
              </div>
              <div className="w-20 text-right text-sm font-medium tabular-nums text-foreground">
                {valueFormatter(it.value)}
              </div>
              {typeof it.delta === 'number' && (
                <div className={['w-16 text-right text-sm tabular-nums', deltaClass].join(' ')}>
                  {deltaFormatter(it.delta / 100)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}