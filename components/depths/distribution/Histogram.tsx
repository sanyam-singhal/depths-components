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
  Label,
  Cell,
  type TooltipProps,
} from 'recharts';

/* ────────────────────────────────────────────────────────────────────────────
 * Types & helpers (self-contained)
 * ──────────────────────────────────────────────────────────────────────────── */

export type BaseChartProps = Readonly<{
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
  'aria-label'?: string;
  'aria-describedby'?: string;
}>;

export type HistogramData = Readonly<{
  /** Bin edges. Length N+1 for N bars. */
  bins: ReadonlyArray<number>;
  /** Counts per bin. Length N (must match bins-1). */
  counts: ReadonlyArray<number>;
}>;

export type HistogramProps = Readonly<
  BaseChartProps & {
    title?: string;
    description?: string;

    data: HistogramData;

    /** Axis labels & formatters. */
    xLabel?: string;
    yLabel?: string; // Kept for flexibility, but managed internally
    xTickFormatter?: (v: number | string) => string;
    yTickFormatter?: (v: number) => string;

    /** Bar radius (top-left, top-right, bottom-right, bottom-left). */
    barRadius?: [number, number, number, number];

    /** Fixed chart height (px or CSS length). Default: 320. */
    height?: number | string;

    /** Localized value formatter for tooltip. */
    valueFormatter?: (v: number) => string;
  }
>;

type Row = Readonly<{
  label: string;
  start: number;
  end: number;
  count: number;
  cumulative: number;
}>;

function formatNumber(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
}

function toRows(d: HistogramData): Row[] {
  const { bins, counts } = d;
  const n = Math.min(counts.length, Math.max(0, bins.length - 1));
  const out: Row[] = [];
  let cum = 0;
  for (let i = 0; i < n; i++) {
    const start = Number(bins[i] ?? 0);
    const end = Number(bins[i + 1] ?? start);
    const c = Number(counts[i] ?? 0);
    cum += c;
    out.push({
      label: `${start}\u2013${end}`, // en dash
      start,
      end,
      count: c,
      cumulative: cum,
    });
  }
  return out;
}

function minPositive(values: number[]): number {
  let m = Number.POSITIVE_INFINITY;
  for (const v of values) if (v > 0 && v < m) m = v;
  return Number.isFinite(m) ? m : 1;
}

/** Bars use chart-1, hover uses a slightly brighter mix. */
function barColorHover(): string {
  return 'color-mix(in oklch, var(--color-chart-1) 86%, white)';
}

/* Minimal, token-aware tooltip (shared look with Line/Area). */
function TooltipPanel({
  active,
  payload,
  label,
  valueFormatter = formatNumber,
}: {
  active?: boolean;
  payload?: TooltipProps<number, string>['payload'];
  label?: string | number;
  valueFormatter?: (v: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  // In this histogram we show a single series at a time (count or cumulative)
  const p = payload.find((x) => typeof x?.value === 'number');
  const value = typeof p?.value === 'number' ? p!.value : 0;

  return (
    <div
      className="rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-sm"
      role="tooltip"
      aria-label="Histogram tooltip"
    >
      <div className="mb-1 font-medium tabular-nums">{String(label)}</div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">{String(p?.dataKey ?? 'value')}</span>
        <span className="tabular-nums font-medium">{valueFormatter(value)}</span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Component
 * ──────────────────────────────────────────────────────────────────────────── */

export function Histogram(props: HistogramProps): React.JSX.Element {
  const {
    title,
    description,
    data,
    xLabel,
    yLabel: propYLabel, // Capture prop for potential override
    xTickFormatter,
    yTickFormatter,
    barRadius = [3, 3, 0, 0],
    height = 320,
    className,
    isLoading,
    error,
    valueFormatter = formatNumber,
    ...a11y
  } = props;

  // Internal state for controls (previously passed as props)
  const [logScale, setLogScale] = React.useState(false);
  const [cumulative, setCumulative] = React.useState(false);

  // Internal yLabel management based on cumulative state
  const internalYLabel = cumulative ? 'Cumulative count' : 'Count';
  const effectiveYLabel = propYLabel !== undefined ? propYLabel : internalYLabel;

  // rows for Recharts
  const rows = React.useMemo(() => toRows(data), [data]);
  const vKey = cumulative ? ('cumulative' as const) : ('count' as const);

  // y-axis config (log scale must avoid zero)
  const yMin = React.useMemo(
    () => (logScale ? minPositive(rows.map((r) => r[vKey])) : 0),
    [rows, vKey, logScale],
  );

  // resolve height for <ResponsiveContainer>
  const chartHeight = typeof height === 'number' ? `${height}px` : height;

  // hover highlight (per-bar)
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);

  // basic empty/error/loading states
  if (error) {
    return (
      <div
        {...a11y}
        className={['rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive', className ?? ''].join(' ')}
      >
        {error.message ?? 'Something went wrong.'}
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

  return (
    <section
      {...a11y}
      className={[
        '@container',
        'rounded-lg border border-border bg-card shadow-sm p-3 @md:p-4 text-card-foreground',
        className ?? '',
      ].join(' ')}
      aria-roledescription="Histogram"
    >
      {(title || description) && (
        <header className="mb-2">
          {title && <div className="text-lg font-semibold">{title}</div>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </header>
      )}

      {/* Integrated controls (ShadCN-styled buttons) */}
      <div role="toolbar" aria-label="Histogram controls" className="flex flex-wrap items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setLogScale(false)}
          aria-pressed={!logScale}
          className={[
            'inline-flex items-center rounded-md border px-2.5 py-1.5 text-xs font-medium',
            !logScale ? 'bg-secondary text-secondary-foreground' : 'bg-card',
            'border-border hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          ].join(' ')}
        >
          Linear
        </button>
        <button
          type="button"
          onClick={() => setLogScale(true)}
          aria-pressed={logScale}
          className={[
            'inline-flex items-center rounded-md border px-2.5 py-1.5 text-xs font-medium',
            logScale ? 'bg-secondary text-secondary-foreground' : 'bg-card',
            'border-border hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          ].join(' ')}
        >
          Log
        </button>

        <div className="mx-3 h-4 w-px bg-border" aria-hidden />

        <button
          type="button"
          onClick={() => setCumulative((v) => !v)}
          aria-pressed={cumulative}
          className={[
            'inline-flex items-center rounded-md border px-2.5 py-1.5 text-xs font-medium',
            cumulative ? 'bg-secondary text-secondary-foreground' : 'bg-card',
            'border-border hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          ].join(' ')}
        >
          {cumulative ? 'Cumulative' : 'Per-bin'}
        </button>
      </div>

      <figure className="w-full">
        <div className="w-full" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              margin={{ top: 8, right: 12, left: 12, bottom: 24 }}
            >
              <CartesianGrid stroke="var(--color-border)" vertical={false} />

              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--color-foreground)', opacity: 0.9, fontSize: 12 }}
                tickLine={{ stroke: 'var(--color-border)' }}
                axisLine={{ stroke: 'color-mix(in oklch, var(--color-foreground) 24%, transparent)' }}
                tickFormatter={(v: string) => (xTickFormatter ? xTickFormatter(v) : v)}
              >
                {xLabel ? (
                  <Label
                    value={xLabel}
                    position="insideBottom"
                    offset={-24}
                    className="fill-[var(--color-muted-foreground)] text-base font-semibold"
                  />
                ) : null}
              </XAxis>

              <YAxis
                type="number"
                scale={logScale ? 'log' : 'auto'}
                domain={logScale ? [yMin, 'auto'] : ['auto', 'auto']}
                allowDataOverflow={logScale}
                tick={{ fill: 'var(--color-foreground)', opacity: 0.9, fontSize: 12 }}
                tickLine={{ stroke: 'var(--color-border)' }}
                axisLine={{ stroke: 'color-mix(in oklch, var(--color-foreground) 24%, transparent)' }}
                tickFormatter={(v: number) => (yTickFormatter ? yTickFormatter(v) : formatNumber(v))}
              >
                <Label
                  value={effectiveYLabel}
                  angle={-90}
                  position="insideLeft"
                  offset={10}
                  className="fill-[var(--color-muted-foreground)] text-base font-semibold"
                />
              </YAxis>

              <Tooltip
                cursor={{ fill: 'color-mix(in oklch, var(--color-chart-1) 12%, transparent)' }}
                content={(p: TooltipProps<number, string>) => (
                  <TooltipPanel
                    active={p.active}
                    payload={p.payload}
                    label={p.label}
                    valueFormatter={valueFormatter}
                  />
                )}
              />

              <Bar
                dataKey={vKey}
                radius={barRadius}
                barSize={Math.max(6, Math.floor(18))}
                fill="var(--color-chart-1)"
              >
                {rows.map((_, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={hoverIndex === i ? barColorHover() : 'var(--color-chart-1)'}
                    onMouseEnter={() => setHoverIndex(i)}
                    onMouseLeave={() => setHoverIndex((idx) => (idx === i ? null : idx))}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </figure>
    </section>
  );
}