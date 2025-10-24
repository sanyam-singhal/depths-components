// components/depths/trends/LineSeries.tsx
'use client';

import * as React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Brush,
  Label,
  type TooltipProps,
} from 'recharts';

/* -----------------------------------------------------------------------------
 * Types & helpers (self-contained; no external deps)
 * -------------------------------------------------------------------------- */

export type TimeSeriesPoint = Readonly<{ t: number; v: number }>;
export type TimeSeries = Readonly<{ key: string; points: ReadonlyArray<TimeSeriesPoint> }>;

export type BaseChartProps = Readonly<{
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
  'aria-label'?: string;
  'aria-describedby'?: string;
}>;

export type LegendPlacement = 'header' | 'chart' | 'none';
export type YAxisMode = 'absolute' | 'percent';
export type LineType = 'linear' | 'monotone';

export type LineSeriesProps = Readonly<
  BaseChartProps & {
    /** Optional title rendered in the card header */
    title?: string;
    /** Optional help/description below the title */
    description?: string;

    /** Multiple series rendered as individual lines. */
    series: ReadonlyArray<TimeSeries>;

    /** Where to place the legend; default: 'header'. */
    legend?: LegendPlacement;

    /** Show the brush (range selector) footer. Default: true. */
    brush?: boolean;

    /** Axis labels & optional formatters. */
    xLabel?: string;
    yLabel?: string;
    xTickFormatter?: (t: number) => string;
    yTickFormatter?: (v: number) => string;

    /** Value formatter for tooltips. Defaults to number or percent based on yAxisMode. */
    valueFormatter?: (v: number) => string;

    /** Fixed height (px or CSS length). */
    height?: number | string;

    /** Y-axis mode: raw numbers ('absolute') or percentages ('percent'). */
    yAxisMode?: YAxisMode;

    /** Line interpolation: 'linear' or 'monotone' (default). */
    lineType?: LineType;

    /** Show small dots at hover only (activeDot) while keeping lines clean. Default: true. */
    hoverDots?: boolean;
  }
>;

/** 0–2 fraction digits localized number. */
function formatNumber(v: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(v);
}

/** Merge aligned points across series for Recharts. */
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

/** Palette from CSS variables (Tailwind v4 theme vars). */
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

/** Minimal, token-aware tooltip. */
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
        {payload
          .filter((p) => typeof p.value === 'number' && p.dataKey)
          .map((p) => {
            const color = p.color ?? 'var(--color-foreground)';
            const value = Number(p.value);
            return (
              <div key={String(p.dataKey)} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ background: color }}
                  />
                  <span className="text-foreground/80">{String(p.dataKey)}</span>
                </div>
                <div className="tabular-nums">
                  {percentMode ? `${value.toFixed(1)}%` : valueFormatter(value)}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------- */

export function LineSeries(props: LineSeriesProps): React.JSX.Element {
  const {
    title,
    description,
    series,
    legend = 'header',
    brush = true,
    xLabel,
    yLabel,
    xTickFormatter,
    yTickFormatter,
    yAxisMode = 'absolute',
    valueFormatter,
    lineType = 'monotone',
    hoverDots = true,
    height = 320,
    className,
    isLoading,
    error,
    ...a11y
  } = props;

  const rows = React.useMemo(() => toRechartsRows(series), [series]);
  const keys = React.useMemo(() => series.map((s) => s.key), [series]);
  const colors = React.useMemo(() => tokenPalette(keys.length), [keys.length]);

  const vf =
    valueFormatter ??
    (yAxisMode === 'percent'
      ? (v: number) => `${v.toFixed(1)}%`
      : (v: number) => formatNumber(v));

  // interactive legend: toggle + focus-dim
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

  // basic error/loading visuals
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
  const percentMode = yAxisMode === 'percent';

  return (
    <section
      {...a11y}
      className={[
        '@container',
        'rounded-lg border border-border bg-card shadow-sm p-3 @md:p-4',
        className ?? '',
      ].join(' ')}
    >
      {(title || description || (legend === 'header' && keys.length > 1)) && (
        <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            {title && <div className="text-lg font-semibold text-foreground">{title}</div>}
            {description && <p className="text-sm text-muted-foreground truncate">{description}</p>}
          </div>

          {legend === 'header' && keys.length > 1 && (
            <div role="toolbar" aria-label="Series legend" className="flex flex-wrap gap-2">
              {keys.map((k, i) => {
                const off = hidden.has(k);
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
                      style={{ background: colors[i] }}
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
            <LineChart
              data={rows}
              margin={{ top: 8, right: 12, left: 12, bottom: brush ? 32 : 16 }}
            >
              {/* Grid & axes are styled via tokens to ensure light/dark coherence. */}
              <CartesianGrid stroke="var(--color-border)" vertical={false} />

              <XAxis
                dataKey="t"
                tickFormatter={xTickFormatter}
                tick={{ fill: 'var(--color-foreground)', opacity: 0.9, fontSize: 12 }}
                tickLine={{ stroke: 'var(--color-border)' }}
                axisLine={{
                  stroke: 'color-mix(in oklch, var(--color-foreground) 24%, transparent)',
                  strokeWidth: 1,
                }}
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
                domain={percentMode ? [0, 100] : ['auto', 'auto']}
                tickFormatter={
                  percentMode ? (v: number) => `${v.toFixed(0)}%` : yTickFormatter
                }
                tick={{ fill: 'var(--color-foreground)', opacity: 0.9, fontSize: 12 }}
                tickLine={{ stroke: 'var(--color-border)' }}
                axisLine={{
                  stroke: 'color-mix(in oklch, var(--color-foreground) 24%, transparent)',
                  strokeWidth: 1,
                }}
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
                    valueFormatter={vf}
                    percentMode={percentMode}
                  />
                )}
              />

              {keys.map((k, i) => {
                if (hidden.has(k)) return null;
                const dim = focusKey && focusKey !== k;
                const color = colors[i];
                return (
                  <Line
                    key={k}
                    type={lineType}
                    dataKey={k}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={
                      hoverDots
                        ? { r: 3, stroke: color, fill: color, strokeWidth: 1 }
                        : false
                    }
                    className={dim ? 'opacity-60' : ''}
                    aria-label={`Series ${k}`}
                  />
                );
              })}

              {brush && (
                <Brush
                  dataKey="t"
                  height={12}
                  travellerWidth={10}
                  stroke="var(--color-chart-1)"
                />
              )}
            </LineChart>
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
