// components/depths/distribution/Demo.tsx
'use client';

import * as React from 'react';
import type { HistogramData, HeatmapData } from '@/components/depths/lib/types';
import { Histogram } from '@/components/depths/distribution/Histogram';
import { Heatmap } from '@/components/depths/distribution/Heatmap';

// ---------------- deterministic dummy data ----------------

// Histogram: 0–100 in 10-point bins, roughly normal around ~60
const HIST_BINS = Array.from({ length: 11 }, (_, i) => i * 10);
const HIST_COUNTS = (() => {
  const mu = 60, sigma = 18;
  const centers = Array.from({ length: 10 }, (_, i) => i * 10 + 5);
  const raw = centers.map(c => Math.exp(-0.5 * ((c - mu) / sigma) ** 2));
  const scale = 1200 / raw.reduce((a, b) => a + b, 0); // ~1200 total
  return raw.map(x => Math.max(1, Math.round(x * scale)));
})();
const histData: HistogramData = { bins: HIST_BINS, counts: HIST_COUNTS };

// Heatmap: 7 days × 24 hours with diurnal + weekday effects
const xLabels = Array.from({ length: 24 }, (_, h) => h.toString().padStart(2, '0'));
const yLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const z: number[][] = yLabels.map((d, di) =>
  xLabels.map((_, hi) => {
    const dayShift = di === 5 || di === 6 ? -0.15 : 0; // lower weekend baseline
    const base = 40 + 25 * Math.sin((hi - 8) / 3) + 18 * Math.sin((hi - 18) / 4);
    const jitter = ((di * 7 + hi) % 5) - 2;
    return Math.max(0, Math.round((base * (1 + dayShift)) + jitter));
  })
);
const heatmapData: HeatmapData = { xLabels, yLabels, z };

// ---------------- Demos ----------------

export function HistogramDemo(): React.JSX.Element {

  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Frequency histogram (0–100). Toggle log scale (safe domain) or cumulative counts.
      </p>

      {/* Recharts needs a concrete parent height */}
      <Histogram
        title="Histogram"
        description="Count of values by 10-point bins."
        data={histData}
        height={320}
        xLabel="Value"
      />
    </div>
  );
}

export function HeatmapDemo(): React.JSX.Element {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        7×24 traffic heatmap with a perceptual OKLCH scale. Use <code>log</code> to reveal heavy tails.
      </p>


      <Heatmap
        title="Heatmap"
        description="7×24 traffic with a perceptual OKLCH scale and quantitative legend."
        data={heatmapData}
        legend
        xLabel="Hour of day"
        yLabel="Weekday"
        axisEmphasis
        fitMode="fit"
        squareCells
      />
    </div>
  );
}

// ---------------- Public registry + resolver ----------------

export const DISTRIBUTION_DEMOS = {
  histogram: HistogramDemo,
  heatmap: HeatmapDemo,
} as const;

export type DistributionId = keyof typeof DISTRIBUTION_DEMOS;

export function renderDistributionDemo(id: string): React.ReactNode {
  const C = (DISTRIBUTION_DEMOS as Record<string, React.ComponentType | undefined>)[id];
  return C ? <C /> : null;
}
