// components/depths/trends/BandLine.tsx
'use client';

import * as React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Brush,
  Label,
  type TooltipProps,
} from 'recharts';

/* -----------------------------------------------------------------------------
 * Types & small helpers (self-contained)
 * -------------------------------------------------------------------------- */

export type BandPoint = Readonly<{
  t: number;
  mean?: number;
  min?: number;
  max?: number;
  p50?: number;
  p95?: number;
  p99?: number;
}>;

export type BandSeries = Readonly<{
  key: string; // informational; we collapse to a single band using plain keys
  points: ReadonlyArray<BandPoint>;
}>;

export type BaseChartProps = Readonly<{
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
  'aria-label'?: string;
  'aria-describedby'?: string;
}>;

export type BandMode = 'minmax' | 'p50p95' | 'p95p99';
export type LineType = 'linear' | 'monotone';

export type BandLineProps = Readonly<
  BaseChartProps & {
    title?: string;
    description?: string;
    series: ReadonlyArray<BandSeries>;
    mode?: BandMode;
    showMean?: boolean;

    xLabel?: string;
    yLabel?: string;
    xTickFormatter?: (t: number) => string;
    yTickFormatter?: (v: number) => string;

    valueFormatter?: (v: number) => string;
    height?: number | string;
    brush?: boolean;
    lineType?: LineType;
  }
>;

const nfmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const defaultVfmt = (v: number) => nfmt.format(v);

/** Use CSS tokens from globals; never hardcode hex. */
const bandColor = 'var(--color-chart-1)';

/** Pick lower/upper based on mode, normalize ordering. */
function pickBounds(p: BandPoint, mode: BandMode): { lower: number; upper: number } {
  const lo =
    mode === 'minmax' ? p.min ?? p.mean ?? 0 : mode === 'p50p95' ? p.p50 ?? p.mean ?? 0 : p.p95 ?? p.mean ?? 0;
  const up =
    mode === 'minmax' ? p.max ?? p.mean ?? 0 : mode === 'p50p95' ? p.p95 ?? p.mean ?? 0 : p.p99 ?? p.mean ?? 0;
  const lower = Number.isFinite(lo) ? Number(lo) : 0;
  const upper = Number.isFinite(up) ? Number(up) : lower;
  return upper >= lower ? { lower, upper } : { lower: upper, upper: lower };
}

/** Transform input series → rows with exactly: t, lower, band, mean. */
function toBandRows(series: ReadonlyArray<BandSeries>, mode: BandMode, includeMean: boolean) {
  const m = new Map<number, { t: number; lower: number; band: number; mean?: number }>();
  // We collapse to a single band; if multiple series are ever passed, merge by max spread.
  for (const s of series) {
    for (const p of s.points) {
      const { lower, upper } = pickBounds(p, mode);
      const band = Math.max(upper - lower, 0);
      const row = m.get(p.t) ?? { t: p.t, lower, band };
      // Keep the widest band / lowest lower if multiple series end up here
      row.lower = typeof row.lower === 'number' ? Math.min(row.lower, lower) : lower;
      row.band = Math.max(row.band ?? 0, band);
      if (includeMean) row.mean = typeof p.mean === 'number' ? p.mean : lower + band * 0.5;
      m.set(p.t, row);
    }
  }
  return [...m.values()].sort((a, b) => a.t - b.t);
}

/** Compute explicit [yMin,yMax] from lower and lower+band (+ mean). */
function computeDomain(
  rows: ReadonlyArray<{ lower: number; band: number; mean?: number }>,
): [number, number] {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const r of rows) {
    const lower = r.lower;
    const upper = r.lower + r.band;
    min = Math.min(min, lower, ...(typeof r.mean === 'number' ? [r.mean] : []));
    max = Math.max(max, upper, ...(typeof r.mean === 'number' ? [r.mean] : []));
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  const pad = Math.max(1, (max - min) * 0.06);
  return [Math.floor(min - pad), Math.ceil(max + pad)];
}

/** Tooltip rendering (typed per Recharts’ TooltipProps). */
function BandTooltip({
  active,
  payload,
  label,
  valueFormatter = defaultVfmt,
}: {
  active?: boolean;
  payload?: TooltipProps<number, string>['payload'];
  label?: number | string;
  valueFormatter?: (v: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const lo = payload.find((p) => p.dataKey === 'lower')?.value;
  const bd = payload.find((p) => p.dataKey === 'band')?.value;
  const mn = payload.find((p) => p.dataKey === 'mean')?.value;

  const lower = typeof lo === 'number' ? lo : undefined;
  const upper = typeof lo === 'number' && typeof bd === 'number' ? lo + bd : undefined;
  const mean = typeof mn === 'number' ? mn : undefined;

  return (
    <div
      className="rounded-md border border-border bg-popover text-popover-foreground shadow-sm px-3 py-2 text-xs"
      role="dialog"
      aria-label="Latency band tooltip"
    >
      <div className="mb-1 font-medium tabular-nums">{String(label)}</div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: bandColor }} />
            <span className="text-foreground/80">p50–p95</span>
          </div>
          <div className="tabular-nums">
            {typeof lower === 'number' && typeof upper === 'number'
              ? `${valueFormatter(lower)}–${valueFormatter(upper)}`
              : '—'}
          </div>
        </div>
        {typeof mean === 'number' ? (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>mean</span>
            <span className="tabular-nums">{valueFormatter(mean)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------- */

export function BandLine(props: BandLineProps): React.JSX.Element {
  const {
    title,
    description,
    series,
    mode = 'p50p95',
    showMean = true,
    xLabel,
    yLabel,
    xTickFormatter,
    yTickFormatter,
    valueFormatter = defaultVfmt,
    height = 320,
    brush = true,
    lineType = 'monotone',
    className,
    isLoading,
    error,
    ...a11y
  } = props;

  const rows = React.useMemo(() => toBandRows(series, mode, showMean), [series, mode, showMean]);
  const yDomain = React.useMemo(() => computeDomain(rows), [rows]);

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
      className={['@container', 'rounded-lg border border-border bg-card shadow-sm p-3 @md:p-4', className ?? ''].join(
        ' ',
      )}
    >
      {(title || description) && (
        <header className="mb-2">
          {title && <div className="text-lg font-semibold text-foreground">{title}</div>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </header>
      )}

      <div className="w-full" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={rows}
            margin={{ top: 8, right: 12, left: 40, bottom: brush ? 40 : 24 }}
          >
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
              domain={yDomain}
              tickFormatter={yTickFormatter}
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
                <BandTooltip
                  active={p.active}
                  payload={p.payload}
                  label={p.label}
                  valueFormatter={valueFormatter}
                />
              )}
            />

            {/* Exactly like the old working version:
               baseline (lower) + height (band) share the SAME stackId. */}
            <Area
              type="monotone"
              dataKey="lower"
              stroke="transparent"
              fill="transparent"
              stackId="band"
              aria-label="Lower bound"
            />
            <Area
              type="monotone"
              dataKey="band"
              stroke="transparent"
              fill={bandColor}
              fillOpacity={0.24}
              stackId="band"
              aria-label="Band width (upper-lower)"
            />
            {showMean && (
              <Line
                type={lineType}
                dataKey="mean"
                stroke={bandColor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, stroke: bandColor, fill: bandColor, strokeWidth: 1 }}
                aria-label="Mean"
              />
            )}

            {brush && (
              <Brush dataKey="t" height={12} travellerWidth={10} stroke="var(--color-chart-1)" />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
