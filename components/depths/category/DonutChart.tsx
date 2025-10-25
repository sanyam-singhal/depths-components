'use client';

import * as React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  type TooltipProps,
} from 'recharts';

export type BaseChartProps = Readonly<{
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
  'aria-label'?: string;
  'aria-describedby'?: string;
}>;

export type DonutSlice = Readonly<{
  label: string;
  value: number;
}>;

export type DonutChartProps = Readonly<
  BaseChartProps & {
    title?: string;
    description?: string;
    slices: ReadonlyArray<DonutSlice>;
    asPercent?: boolean;
    combineUnderPct?: number;
    legend?: 'bottom' | 'right' | 'none';
    innerRadius?: number | string;
    outerRadius?: number | string;
    centerLabel?: string;
    valueFormatter?: (v: number) => string;
    onSliceClick?: (slice: DonutSlice) => void;
    height?: number | string;
  }
>;

/* ───────────────────────────────── helpers ───────────────────────────────── */

function formatNumber(v: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(v);
}

function formatPercent(value: number, fractionDigits: number = 1): string {
  const v = value * 100;
  return `${v.toFixed(fractionDigits)}%`;
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
  valueFormatter = formatNumber,
}: {
  active?: boolean;
  payload?: TooltipProps<number, string>['payload'];
  valueFormatter?: (v: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0];
  if (!entry) return null;

  return (
    <div
      className={[
        'rounded-md border border-border bg-popover text-popover-foreground',
        'shadow-sm px-3 py-2 text-xs',
      ].join(' ')}
      role="dialog"
      aria-label="Chart tooltip"
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-2.5 w-2.5 rounded-sm"
          style={{ background: String(entry.fill) }}
        />
        <span className="font-medium">{entry.name}</span>
      </div>
      <div className="mt-1 tabular-nums">{valueFormatter(Number(entry.value))}</div>
    </div>
  );
}

/* ───────────────────────────────── component ─────────────────────────────── */

export function DonutChart(props: DonutChartProps): React.JSX.Element {
  const {
    title,
    description,
    slices,
    asPercent = false,
    combineUnderPct = 0,
    legend = 'bottom',
    innerRadius = '60%',
    outerRadius = '80%',
    centerLabel,
    valueFormatter = formatNumber,
    onSliceClick,
    height = 320,
    className,
    isLoading,
    error,
    ...a11y
  } = props;

  const total = React.useMemo(() => slices.reduce((s, x) => s + x.value, 0), [slices]);

  const data = React.useMemo(() => {
    if (!asPercent || combineUnderPct <= 0 || total <= 0) return slices.map((s) => ({ ...s, total }));
    const pct = (v: number) => (v / total) * 100;
    const majors = slices.filter((s) => pct(s.value) >= combineUnderPct);
    const minors = slices.filter((s) => pct(s.value) < combineUnderPct);
    if (minors.length === 0) return majors.map((s) => ({ ...s, total }));
    const otherVal = minors.reduce((s, x) => s + x.value, 0);
    return [...majors, { label: 'Other', value: otherVal, total }];
  }, [slices, asPercent, combineUnderPct, total]);

  const colors = React.useMemo(() => tokenPalette(data.length), [data.length]);

  const vFmt = asPercent ? (v: number) => formatPercent(v / Math.max(total, 1)) : valueFormatter;
  const centerText = centerLabel ?? (asPercent ? '100%' : valueFormatter(total));

  // Client-only render for Recharts to avoid SSR hydration mismatches
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

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
        <div className="mt-3 h-[320px] animate-pulse rounded-full bg-muted" />
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
      {/* Header: title, description */}
      {(title || description) && (
        <header className="mb-3">
          {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </header>
      )}

      <figure className="relative w-full" style={{ height: chartHeight }}>
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={data.length > 1 ? 2 : 0}
                animationDuration={600}
              >
                {data.map((_, i) => (
                  <Cell
                    key={String(i)}
                    fill={colors[i]}
                    className="transition-opacity focus-visible:opacity-80 hover:opacity-80 cursor-pointer"
                    onClick={() => onSliceClick?.(data[i])}
                  />
                ))}
              </Pie>
              <Tooltip
                content={(p: TooltipProps<number, string>) => (
                  <TooltipPanel
                    active={p.active}
                    payload={p.payload}
                    valueFormatter={vFmt}
                  />
                )}
              />
              {legend !== 'none' && (
                <Legend
                  layout={legend === 'right' ? 'vertical' : 'horizontal'}
                  align={legend === 'right' ? 'right' : 'center'}
                  verticalAlign={legend === 'right' ? 'middle' : 'bottom'}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-lg font-semibold tabular-nums">{centerText}</div>
          {centerLabel && <div className="text-xs text-muted-foreground">{centerLabel}</div>}
        </div>
      </figure>
    </section>
  );
}