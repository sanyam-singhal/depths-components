'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { formatNumber, formatPercent } from '@/components/depths/lib/chartUtils';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export interface BaseChartProps {
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export interface TimeSeriesPoint { t: number; v: number; }
export interface TimeSeries { key: string; points: TimeSeriesPoint[]; }

export interface KPI { label: string; value: number; unit?: string; delta?: number; }

export interface KPIStatProps extends BaseChartProps {
  readonly kpi: Readonly<KPI>;
  readonly sparkline?: Readonly<TimeSeries>;
  readonly valueFormatter?: (n: number) => string;
  readonly onCopyValue?: (text: string) => void;
}

export function KPIStat(props: KPIStatProps): React.JSX.Element {
  const {
    kpi,
    sparkline,
    className,
    valueFormatter,
    onCopyValue,
    ...a11y // keep aria-* passthroughs from BaseChartProps without extra work
  } = props;

  const vfmt = valueFormatter ?? formatNumber;

  // Prefer currency formatting when unit looks like a currency code (e.g. "USD").
  const valueText = React.useMemo(() => {
    if (kpi.unit && /^[A-Z]{3}$/.test(kpi.unit)) {
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: kpi.unit,
          maximumFractionDigits: 0,
        }).format(kpi.value);
      } catch {
        // Fallback to "number + unit" if Intl rejects the code
        return `${vfmt(kpi.value)} ${kpi.unit}`;
      }
    }
    return kpi.unit ? `${vfmt(kpi.value)} ${kpi.unit}` : vfmt(kpi.value);
  }, [kpi.unit, kpi.value, vfmt]);

  // Memoize transformed series
  const chartData = React.useMemo(
    () => (sparkline ? sparkline.points.map(({ t, v }) => ({ t, v })) : []),
    [sparkline]
  );

  // Client-only render for Recharts to avoid SSR hydration mismatches
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  // Color tokens: accent for positive, destructive for negative, muted when 0/undefined
  const deltaClass =
    typeof kpi.delta === 'number'
      ? kpi.delta > 0
        ? 'text-accent'
        : kpi.delta < 0
        ? 'text-destructive'
        : 'text-muted-foreground'
      : 'text-muted-foreground';

  // Copy value interaction (click or keyboard)
  const handleCopy = React.useCallback(() => {
    const text = `${kpi.label}: ${valueText}`;
    void (async () => {
      try {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      } finally {
        onCopyValue?.(text);
      }
    })();
  }, [kpi.label, valueText, onCopyValue]);

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCopy();
    }
  };

  return (
    <Card
      {...a11y}
      role="button"
      tabIndex={0}
      title="Click or press Enter/Space to copy"
      onClick={handleCopy}
      onKeyDown={onKeyDown}
      className={[
        // container queries enable sparkline to scale with card width
        '@container',
        'group rounded-lg border border-border bg-card text-card-foreground shadow-sm',
        'transition hover:shadow-md hover:ring-1 hover:ring-accent/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'p-4 @md:p-5',
        className ?? '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4 @md:gap-5">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="truncate text-sm font-medium text-muted-foreground">{kpi.label}</div>
          <div className="text-3xl font-semibold tracking-tight @md:text-4xl">{valueText}</div>
          {typeof kpi.delta === 'number' && (
            <div className={['text-sm font-medium', deltaClass].join(' ')}>
              {formatPercent(kpi.delta)}
            </div>
          )}
        </div>

        {/* Sparkline: scale with container; hide safely until mounted to avoid SSR hydration issues */}
        {sparkline && (
          <div
            className={[
              'ms-auto shrink-0 rounded-md bg-transparent',
              // Scale by container width (not viewport)
              'h-14 w-24 @md:h-16 @md:w-32 @lg:h-20 @lg:w-40',
            ].join(' ')}
          >
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="t" hide />
                  <YAxis hide />
                  {/* Minimal tooltip (or remove to keep DOM slimmer) */}
                  <Tooltip
                    formatter={(v) => [v as number, '']}
                    labelFormatter={() => ''}
                    isAnimationActive={false}
                    cursor={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke="var(--color-chart-1, #10b981)"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
