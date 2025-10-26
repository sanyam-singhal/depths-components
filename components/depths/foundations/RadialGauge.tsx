// components/depths/foundations/RadialGauge.tsx
'use client';

import * as React from 'react';
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  Tooltip,
  type TooltipProps,
} from 'recharts';

/* -----------------------------------------------------------------------------
 * Types & helpers (self-contained; no external deps)
 * -------------------------------------------------------------------------- */

export type BaseChartProps = Readonly<{
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
  'aria-label'?: string;
  'aria-describedby'?: string;
}>;

export type RadialGaugeProps = Readonly<
  BaseChartProps & {
    /** Optional title rendered above the gauge */
    title?: string;
    /** Optional description below the title */
    description?: string;

    /** Gauge value (typically 0–100 or normalized 0–1) */
    value: number;

    /** Minimum value (default: 0) */
    min?: number;

    /** Maximum value (default: 100) */
    max?: number;

    /** Optional unit suffix (e.g., '%', 'ms') */
    unit?: string;

    /** Value formatter for center label and tooltip (defaults to localized number + unit) */
    valueFormatter?: (v: number) => string;

    /** Fixed height (px or CSS length; default: 240) */
    height?: number | string;
  }
>;

/** 0–2 fraction digits localized number + unit. */
function formatNumber(v: number, unit?: string): string {
  const num = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(v);
  return unit ? `${num} ${unit}` : num;
}

/** Simple threshold-based color from tokens. */
function getColor(value: number, min: number, max: number): string {
  const t = (value - min) / (max - min);
  if (t < 0.33) return 'var(--color-chart-3)'; // low: e.g., cyan/muted
  if (t < 0.66) return 'var(--color-chart-2)'; // mid: e.g., teal/warning-ish
  return 'var(--color-chart-1)'; // high: e.g., emerald/success
}

/** Minimal tooltip showing formatted value. */
function TooltipPanel({
  active,
  payload,
  valueFormatter = (v: number) => formatNumber(v),
}: {
  active?: boolean;
  payload?: TooltipProps<number, string>['payload'];
  valueFormatter?: (v: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0];
  if (!p.value) return null;
  return (
    <div
      className={[
        'rounded-md border border-border bg-popover text-popover-foreground',
        'shadow-sm px-3 py-2 text-xs',
      ].join(' ')}
      role="dialog"
      aria-label="Gauge tooltip"
    >
      <div className="tabular-nums">{valueFormatter(p.value)}</div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------- */

export function RadialGauge(props: RadialGaugeProps): React.JSX.Element {
  const {
    title,
    description,
    value,
    min = 0,
    max = 100,
    unit,
    valueFormatter = (v: number) => formatNumber(v, unit),
    height = 240,
    className,
    isLoading,
    error,
    ...a11y
  } = props;

  // Normalize to 0–1 for RadialBar angle
  const color = getColor(value, min, max);

  // Recharts data: single point with actual value for tooltip
  const data = [{ name: 'Value', value }];

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
          <div className="mt-3 h-[240px] animate-pulse rounded bg-muted" />
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
      {(title || description) && (
        <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            {title && <div className="text-lg font-semibold text-foreground">{title}</div>}
            {description && <p className="text-sm text-muted-foreground truncate">{description}</p>}
          </div>
        </header>
      )}

      <figure className="w-full">
        <div className="w-full" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="65%"
              innerRadius="80%"
              outerRadius="100%"
              barSize={24}
              data={data}
              startAngle={180}
              endAngle={0} // Semi-circle fill from left to right
            >
              <PolarAngleAxis
                type="number"
                domain={[min, max]}
                angleAxisId={0}
                tickCount={2} // Only min and max ticks
                tick={{ fill: 'var(--color-foreground)', opacity: 1, fontSize: 16 }}
              />
              <RadialBar
                background={{ fill: 'var(--color-ring)', fillOpacity: 0.3 }}
                dataKey="value"
                cornerRadius={8}
                fill={color}
              />
              <Tooltip
                cursor={false}
                content={(p: TooltipProps<number, string>) => (
                  <TooltipPanel
                    active={p.active}
                    payload={p.payload}
                    valueFormatter={valueFormatter}
                  />
                )}
              />
              
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </figure>
    </section>
  );
}