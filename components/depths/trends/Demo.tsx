// components/depths/trends/Demo.tsx
'use client';

import * as React from 'react';
import type { TimeSeries, BandSeries } from '@/components/depths/lib/types';
import { AreaSeries } from '@/components/depths/trends/AreaSeries';
import { LineSeries } from '@/components/depths/trends/LineSeries';
import { BandLine } from '@/components/depths/trends/BandLine';
import { SparklineCard } from '@/components/depths/trends/SparklineCard';

// ---------- deterministic dummy data helpers ----------
const ts = (key: string, n = 48, f: (i: number) => number): TimeSeries => ({
  key,
  points: Array.from({ length: n }, (_, i) => ({ t: i, v: Math.max(0, Math.round(f(i))) })),
});

const percent = (key: string, n = 48, f: (i: number) => number): TimeSeries => ({
  key,
  points: Array.from({ length: n }, (_, i) => ({ t: i, v: Number(f(i).toFixed(1)) })), // keep decimals
});

// ---------- shared series ----------
const areaSeries: TimeSeries[] = [
  ts('orders', 64, i => 120 + 40 * Math.sin(i / 4) + i * 0.6),
  ts('revenue', 64, i => 300 + 70 * Math.cos(i / 5) + i * 1.2),
  ts('refunds', 64, i => 15 + 8 * Math.sin(i / 3 + 2)),
];

const linePctSeries: TimeSeries[] = [
  percent('uptime', 72, i => 98 + 1.2 * Math.sin(i / 6)),
  percent('errorRate', 72, i => 1 + 0.7 * Math.abs(Math.sin(i / 5 + 1))), // 0–2%
];

const latencyBand: BandSeries = {
  key: 'latency',
  points: Array.from({ length: 72 }, (_, i) => {
    const base = 120 + 40 * Math.sin(i / 6) + (i % 17);
    const p50 = base;
    const p95 = base + 70 + 15 * Math.cos(i / 8);
    const mean = p50 + (p95 - p50) * 0.35;
    return { t: i, p50, p95, mean };
  }),
};

// small sparklines for cards
const spark = (key: string) =>
  ts(key, 32, i => 50 + 18 * Math.sin(i / 3 + (key.length % 5)) + i * 0.4);

// ---------- Demos ----------
export function AreaSeriesDemo() {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Stacked area series with grid, tooltip, legend, and brush for quick zoom.
      </p>
      <AreaSeries series={areaSeries} showLegend height={320} />
    </div>
  );
}

export function LineSeriesDemo() {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Multi-line time series rendered in <code>percent</code> mode for metrics like uptime/error rate.
      </p>
      <LineSeries series={linePctSeries} yAxisMode="percent" showLegend height={320} />
    </div>
  );
}

export function BandLineDemo() {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        P50–P95 latency band with mean overlay to visualize spread vs. typical.
      </p>
      <BandLine series={[latencyBand]} mode="p50p95" showMean height={320} />
    </div>
  );
}

export function SparklineCardDemo() {
  const cards = [
    { label: 'CPU', value: '68%', series: spark('cpu') },
    { label: 'Memory', value: '7.2 GB', series: spark('mem') },
    { label: 'Disk IO', value: '120 MB/s', series: spark('disk') },
    { label: 'Requests', value: '530 req/s', series: spark('rps') },
  ];
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Compact KPI tiles with tiny area sparklines—ideal for overviews and grids.
      </p>
      <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @xl:grid-cols-4">
        {cards.map((c) => (
          <SparklineCard key={c.label} label={c.label} value={c.value} series={c.series} />
        ))}
      </div>
    </div>
  );
}

// ---------- Public registry + resolver (mirrors foundations) ----------
export const TRENDS_DEMOS = {
  'area-series': AreaSeriesDemo,
  'line-series': LineSeriesDemo,
  'band-line': BandLineDemo,
  'sparkline-card': SparklineCardDemo,
} as const;

export type TrendsId = keyof typeof TRENDS_DEMOS;

export function renderTrendsDemo(id: string): React.ReactNode {
  const C = (TRENDS_DEMOS as Record<string, React.ComponentType | undefined>)[id];
  return C ? <C /> : null;
}
