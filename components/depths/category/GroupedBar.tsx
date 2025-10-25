'use client';

import * as React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Brush,
  Label,
  type TooltipProps,
} from 'recharts';

export type BaseChartProps = Readonly<{
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
  'aria-label'?: string;
  'aria-describedby'?: string;
}>;

export type GroupedBarSeries = Readonly<{
  key: string;
  values: ReadonlyArray<number>;
}>;

export type GroupedBarProps = Readonly<
  BaseChartProps & {
    title?: string;
    description?: string;
    categories: ReadonlyArray<string>;
    series: ReadonlyArray<GroupedBarSeries>;
    stacked?: boolean;
    asPercent?: boolean;
    legend?: boolean;
    brush?: boolean;
    xLabel?: string;
    yLabel?: string;
    yTickFormatter?: (v: number) => string;
    valueFormatter?: (v: number) => string;
    height?: number | string;
  }
>;

type DataRow = {
  label: string;
  [key: string]: number | string; // Allow string for 'label', number for series keys
};

function toRechartsRows(categories: ReadonlyArray<string>, series: ReadonlyArray<GroupedBarSeries>): DataRow[] {
  return categories.map((c, i) => {
    const row: DataRow = { label: c };
    for (const s of series) row[s.key] = s.values[i] ?? 0;
    return row;
  });
}

function tokenPalette(n: number): string[] {
  const vars = [
    'var(--color-chart-1)',
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-4)',
    'var(--color-chart-5)',
  ];
  return Array.from({ length: n }, (_, i) => vars[i % vars.length]);
}

/** Lightweight custom tooltip (token-driven). */
function TooltipPanel({
  active,
  payload,
  label,
  valueFormatter = (v: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(v),
  percentMode = false,
}: {
  active?: boolean;
  payload?: TooltipProps<number, string>['payload'];
  label?: number | string;
  valueFormatter?: (v: number) => string;
  percentMode?: boolean;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const items = payload
    .filter((p) => typeof p.value === 'number' && p.dataKey)
    .map((p) => ({
      key: String(p.dataKey),
      color: p.color ?? 'var(--color-foreground)',
      value: Number(p.value),
    }));

  const total = items.reduce((acc, it) => acc + it.value, 0);

  return (
    <div
      className={[
        'rounded-md border border-border bg-popover text-popover-foreground',
        'shadow-sm px-3 py-2 text-xs',
      ].join(' ')}
      role="dialog"
      aria-label="Chart tooltip"
    >
      <div className="mb-1 font-medium">{String(label)}</div>
      <div className="space-y-1">
        {items.map((it) => {
          const pct = total > 0 ? (it.value / total) * 100 : 0;
          return (
            <div key={it.key} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ background: it.color }}
                />
                <span className="text-foreground/80">{it.key}</span>
              </div>
              <div className="tabular-nums">
                {percentMode ? `${pct.toFixed(1)}%` : valueFormatter(it.value)}
              </div>
            </div>
          );
        })}
        {!percentMode && items.length > 1 && (
          <div className="mt-1 flex items-center justify-between border-t border-border pt-1">
            <span className="text-muted-foreground">Total</span>
            <span className="tabular-nums font-medium">{valueFormatter(total)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────────── component ─────────────────────────────── */

export function GroupedBar(props: GroupedBarProps): React.JSX.Element {
  const {
    title,
    description,
    categories,
    series,
    stacked = false,
    asPercent = false,
    legend = true,
    brush = false,
    xLabel,
    yLabel,
    yTickFormatter,
    valueFormatter = (v: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(v),
    height = 320,
    className,
    isLoading,
    error,
    ...a11y
  } = props;

  const raw = React.useMemo(() => toRechartsRows(categories, series), [categories, series]);

  const data = React.useMemo(() => {
    if (!asPercent) return raw;
    return raw.map((r) => {
      const total = series.reduce((sum, s) => sum + (Number(r[s.key]) || 0), 0);
      const out: DataRow = { label: r.label };
      for (const s of series) out[s.key] = total > 0 ? (Number(r[s.key]) / total) * 100 : 0;
      return out;
    });
  }, [raw, series, asPercent]);

  const keys = React.useMemo(() => series.map((s) => s.key), [series]);
  const colors = React.useMemo(() => tokenPalette(keys.length), [keys.length]);

  // legend toggling + focus
  const [hidden, setHidden] = React.useState<ReadonlySet<string>>(new Set());
  const [focusKey, setFocusKey] = React.useState<string | null>(null);

  const toggleKey = React.useCallback((k: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }, []);

  const percentMode = asPercent;
  const yFmt = percentMode ? (v: number) => `${(v).toFixed(0)}%` : yTickFormatter ?? valueFormatter;

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
        <div className="h-9 w-full animate-pulse rounded bg-muted" />
        <div className="mt-3 h-[320px] animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const chartHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <section
      {...a11y}
      className={[
        '@container',
        'rounded-lg border border-border bg-card shadow-sm p-3 @md:p-4',
        className ?? '',
      ].join(' ')}
    >
      {(title || description || (legend && keys.length > 1)) && (
        <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            {title && <div className="text-lg font-semibold text-foreground">{title}</div>}
            {description && <p className="text-sm text-muted-foreground truncate">{description}</p>}
          </div>

          {legend && keys.length > 1 && (
            <div role="toolbar" aria-label="Series legend" className="flex flex-wrap gap-2">
              {keys.map((k, i) => {
                const off = hidden.has(k);
                const color = colors[i];
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => toggleKey(k)}
                    onMouseEnter={() => setFocusKey(k)}
                    onMouseLeave={() => setFocusKey((fk) => (fk === k ? null : fk))}
                    aria-pressed={!off}
                    className={[
                      'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium',
                      off ? 'opacity-50' : '',
                      'border-border bg-card hover:shadow-sm',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    ].join(' ')}
                    title={off ? `Show ${k}` : `Hide ${k}`}
                  >
                    <span
                      aria-hidden
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                      style={{ background: color }}
                    />
                    <span className="text-foreground/90">{k}</span>
                  </button>
                );
              })}
            </div>
          )}
        </header>
      )}

      <figure className="w-full">
        <div className="w-full" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 12, left: 12, bottom: brush ? 32 : 16 }}
              barCategoryGap={stacked ? 0 : '20%'}
            >
              <CartesianGrid stroke="var(--color-border)" vertical={false} />

              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--color-foreground)', opacity: 0.9, fontSize: 12 }}
                tickLine={{ stroke: 'var(--color-border)' }}
                axisLine={{ stroke: 'color-mix(in oklch, var(--color-foreground) 24%, transparent)', strokeWidth: 1 }}
              >
                {xLabel ? (
                  <Label
                    value={xLabel}
                    position="insideBottom"
                    offset={-32}
                    className="fill-[var(--color-muted-foreground)] text-base font-semibold"
                  />
                ) : null}
              </XAxis>

              <YAxis
                tickFormatter={yFmt}
                tick={{ fill: 'var(--color-foreground)', opacity: 0.9, fontSize: 12 }}
                tickLine={{ stroke: 'var(--color-border)' }}
                axisLine={{ stroke: 'color-mix(in oklch, var(--color-foreground) 24%, transparent)', strokeWidth: 1 }}
              >
                {yLabel ? (
                  <Label
                    value={yLabel}
                    angle={-90}
                    position="insideLeft"
                    offset={12}
                    className="fill-[var(--color-muted-foreground)] text-base font-semibold"
                  />
                ) : null}
              </YAxis>

              <Tooltip
                cursor={{ fill: 'var(--color-border)', opacity: 0.1 }}
                content={(p: TooltipProps<number, string>) => (
                  <TooltipPanel
                    active={p.active}
                    payload={p.payload}
                    label={p.label}
                    valueFormatter={valueFormatter}
                    percentMode={percentMode}
                  />
                )}
              />

              {keys.map((k, i) => {
                if (hidden.has(k)) return null;
                const color = colors[i];
                const dim = focusKey && focusKey !== k;

                return (
                  <Bar
                    key={k}
                    dataKey={k}
                    fill={color}
                    stackId={stacked ? 'stack' : undefined}
                    radius={[4, 4, 0, 0]}
                    className={dim ? 'opacity-50' : ''}
                    aria-label={`Group ${k}`}
                  />
                );
              })}

              {brush && (
                <Brush
                  dataKey="label"
                  travellerWidth={10}
                  height={12}
                  stroke="var(--color-chart-1)"
                  className="fill-[color-mix(in oklch, var(--color-accent) 12%, transparent)]"
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {(xLabel || yLabel) && (
          <figcaption className="sr-only">
            {xLabel ? ` X-axis: ${xLabel}.` : null}
            {yLabel ? ` Y-axis: ${yLabel}.` : null}
          </figcaption>
        )}
      </figure>
    </section>
  );
}