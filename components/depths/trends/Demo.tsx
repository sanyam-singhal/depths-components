// components/depths/trends/Demo.tsx
'use client';

import * as React from 'react';
import { AreaSeries } from '@/components/depths/trends/AreaSeries';
import { LineSeries } from '@/components/depths/trends/LineSeries';
import { BandLine } from '@/components/depths/trends/BandLine';
import { ScatterPlot } from '@/components/depths/trends/ScatterPlot';

export interface TimeSeriesPoint { t: number; v: number; }
export interface TimeSeries { key: string; points: TimeSeriesPoint[]; }
export interface BandPoint { t: number; mean?: number; min?: number; max?: number; p50?: number; p95?: number; p99?: number; }
export interface BandSeries { key: string; points: BandPoint[]; }
export type ScatterPoint = Readonly<{ x: number; y: number }>;
export type ScatterSeries = Readonly<{ key: string; points: ReadonlyArray<ScatterPoint> }>;

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


// ---------- Demos ----------
export function AreaSeriesDemo() {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Stacked area series with labeled axes, header legend (click to toggle, hover to focus),
        a custom tooltip, and a tidy brush for quick zoom.
      </p>
      <AreaSeries
        title="Area Series"
        description="Orders, revenue, and refunds over time."
        series={areaSeries}
        stack="stacked"
        legend="header"
        brush
        xLabel="Index"
        yLabel="Value"
        xTickFormatter={(t) => String(t)}
        valueFormatter={(v) => new Intl.NumberFormat().format(v)}
        height={320}
      />
    </div>
  );
}

export function LineSeriesDemo() {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Multi-line time series displayed as percentages (e.g. uptime & error rate) with a header legend
        (click to toggle, hover to focus), custom tooltip, and brush for quick zoom.
      </p>
      <LineSeries
        title="Line Series"
        description="Uptime and error rate over time."
        series={linePctSeries}
        yAxisMode="percent"
        legend="header"
        brush
        xLabel="Index"
        yLabel="Rate"
        xTickFormatter={(t) => String(t)}
        height={320}
      />
    </div>
  );
}


export function BandLineDemo() {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        P50–P95 latency band with a mean overlay; hover for the exact range and mean. Toggle series
        from the header legend when multiple bands are provided.
      </p>
      <BandLine
        title="Latency Band"
        description="Typical (p50) to high tail (p95) latency with mean overlay."
        series={[latencyBand]}
        mode="p50p95"
        showMean
        brush
        xLabel="Index"
        yLabel="Latency (ms)"
        xTickFormatter={(t) => String(t)}
        height={320}
      />
    </div>
  );
}

// Add this to Demo.tsx after BandLineDemo

const scatterSeries: ScatterSeries[] = [
  { key: 'groupA', points: Array.from({ length: 32 }, (_, i) => ({ x: i, y: 20 + 15 * Math.sin(i / 3) + Math.random() * 10 })) },
  { key: 'groupB', points: Array.from({ length: 32 }, (_, i) => ({ x: i, y: 40 + 20 * Math.cos(i / 4) + Math.random() * 8 })) },
];

export function ScatterPlotDemo() {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Multi-group scatter plot with colored dots, header legend (click to toggle, hover to focus),
        and custom tooltip showing x,y coordinates.
      </p>
      <ScatterPlot
        title="Scatter Plot"
        description="Two groups of correlated points over index."
        series={scatterSeries}
        legend="header"
        xLabel="Index"
        yLabel="Value"
        xTickFormatter={(x) => String(x)}
        yTickFormatter={(y) => String(y)}
        valueFormatter={(v) => v.toFixed(1)}
        height={320}
        dotSize={5}
      />
    </div>
  );
}

// Update TRENDS_DEMOS
export const TRENDS_DEMOS = {
  'area-series': AreaSeriesDemo,
  'line-series': LineSeriesDemo,
  'band-line': BandLineDemo,
  'scatter-plot': ScatterPlotDemo,
} as const;

export type TrendsId = keyof typeof TRENDS_DEMOS;

export function renderTrendsDemo(id: string): React.ReactNode {
  const C = (TRENDS_DEMOS as Record<string, React.ComponentType | undefined>)[id];
  return C ? <C /> : null;
}
