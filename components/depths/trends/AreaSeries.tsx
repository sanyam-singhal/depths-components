// components/depths/trends/AreaSeries.tsx
'use client';

import * as React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Brush,
  Label,
  type TooltipProps,
} from 'recharts';

//
// ────────────────────────────────────────────────────────────────────────────────
// Types & helpers (self-contained; no shared imports required)
// ────────────────────────────────────────────────────────────────────────────────
//

export type TimeSeriesPoint = Readonly<{ t: number; v: number }>;
export type TimeSeries = Readonly<{ key: string; points: ReadonlyArray<TimeSeriesPoint> }>;

export type BaseChartProps = Readonly<{
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
  'aria-label'?: string;
  'aria-describedby'?: string;
}>;

export type StackMode = 'none' | 'stacked' | 'percent';

export type LegendPlacement = 'header' | 'chart' | 'none';

export type AreaSeriesProps = Readonly<
  BaseChartProps & {
    /** Optional title rendered in the card header */
    title?: string;
    /** Optional help/description below the title */
    description?: string;

    /** Series to render (multiple keys become multiple areas). */
    series: ReadonlyArray<TimeSeries>;

    /** Stacking behavior: 'none' (default), 'stacked', or 'percent' (100% stack). */
    stack?: StackMode;

    /** Show legend and where to place it. Default: 'header'. */
    legend?: LegendPlacement;

    /** Show the brush (range selector) footer. Default: true. */
    brush?: boolean;

    /** Axis labels. */
    xLabel?: string;
    yLabel?: string;

    /** Axis tick formatters. */
    xTickFormatter?: (t: number) => string;
    yTickFormatter?: (v: number) => string;

    /** Value formatter used by the tooltip. */
    valueFormatter?: (v: number) => string;

    /** Fixed height (px or CSS length). */
    height?: number | string;
  }
>;

/** number → localized number with 0–2 fraction digits. */
function formatNumber(v: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(v);
}

/** Merge time-aligned series into a flat array for Recharts. */
function toRechartsRows(series: ReadonlyArray<TimeSeries>): Array<Record<string, number>> {
  const byT = new Map<number, Record<string, number>>();
  for (const s of series) {
    for (const p of s.points) {
      const row = byT.get(p.t) ?? { t: p.t };
      row[s.key] = p.v;
      byT.set(p.t, row);
    }
  }
  return [...byT.values()].sort((a, b) => Number(a.t) - Number(b.t));
}

/** Build a palette from your CSS chart tokens; never hardcode hex. */
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
  valueFormatter = formatNumber,
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
      <div className="mb-1 font-medium tabular-nums">{String(label)}</div>
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
            <span className="text-muted-foreground">total</span>
            <span className="tabular-nums font-medium">{valueFormatter(total)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

//
// ────────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────────
//

export function AreaSeries(props: AreaSeriesProps): React.JSX.Element {
  const {
    title,
    description,
    series,
    stack = 'none',
    legend = 'header',
    brush = true,
    xLabel,
    yLabel,
    xTickFormatter,
    yTickFormatter,
    valueFormatter = formatNumber,
    height = 320,
    className,
    isLoading,
    error,
    ...a11y // pass-through aria-*
  } = props;

  const rows = React.useMemo(() => toRechartsRows(series), [series]);
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

  const percentMode = stack === 'percent';

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
        {(error as Error).message ?? 'Something went wrong.'}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={['space-y-3', className ?? ''].join(' ')} {...a11y}>
        {title && <div className="text-lg font-semibold">{title}</div>}
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="h-9 w-full animate-pulse rounded bg-muted" />
          <div className="mt-3 h-[320px] animate-pulse rounded bg-muted" />
        </div>
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
      {/* Header: title, description, and legend as interactive toggles */}
      {(title || description || (legend === 'header' && keys.length > 1)) && (
        <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            {title && <div className="text-lg font-semibold text-foreground">{title}</div>}
            {description && (
              <p className="text-sm text-muted-foreground truncate">{description}</p>
            )}
          </div>

          {legend === 'header' && keys.length > 1 && (
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

      {/* Chart */}
      <figure className="w-full">
        <div className="w-full" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={rows}
              // Allocate space for axis labels & brush.
              margin={{ top: 8, right: 12, left: 12, bottom: brush ? 32 : 16 }}
              stackOffset={stack === 'percent' ? 'expand' : 'none'}
            >
              <CartesianGrid stroke="var(--color-border)" vertical={false} />

              <XAxis
                dataKey="t"
                tickFormatter={xTickFormatter}
                // darker ticks + visible axis line (tokens only)
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
                tickFormatter={percentMode ? (v: number) => `${(v * 100).toFixed(0)}%` : yTickFormatter}
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
                cursor={{ stroke: 'var(--color-border)' }}
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
                  <Area
                    key={k}
                    type="monotone"
                    dataKey={k}
                    stroke={color}
                    fill={color}
                    strokeWidth={1.75}
                    fillOpacity={dim ? 0.12 : 0.22}
                    className={dim ? 'opacity-50' : ''}
                    // a11y label for AT users
                    aria-label={`Series ${k}`}
                  />
                );
              })}

              {brush && (
                <Brush
                  dataKey="t"
                  travellerWidth={10}
                  height={12}
                  stroke="var(--color-chart-1)"
                  className="fill-[color-mix(in_oklch,var(--color-accent)_12%,transparent)]"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {(legend === 'chart' && keys.length > 1) || xLabel || yLabel ? (
          <figcaption className="sr-only">
            {legend !== 'none' ? `Series: ${keys.join(', ')}.` : null}
            {xLabel ? ` X-axis: ${xLabel}.` : null}
            {yLabel ? ` Y-axis: ${yLabel}.` : null}
          </figcaption>
        ) : null}
      </figure>
    </section>
  );
}
