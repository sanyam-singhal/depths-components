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
  const [logScale, setLogScale] = React.useState(false);
  const [cumulative, setCumulative] = React.useState(false);

  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Frequency histogram (0–100). Toggle log scale (safe domain) or cumulative counts.
      </p>

      <div role="toolbar" aria-label="Histogram controls" className="flex flex-wrap items-center gap-2">
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

      {/* Recharts needs a concrete parent height */}
      <Histogram
        title="Histogram"
        description="Count of values by 10-point bins."
        data={histData}
        height={320}
        logScale={logScale}
        cumulative={cumulative}
        xLabel="Value"
        yLabel={cumulative ? 'Cumulative count' : 'Count'}
      />
    </div>
  );
}

export function HeatmapDemo(): React.JSX.Element {
  const [scale, setScale] = React.useState<'linear' | 'log'>('linear');

  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        7×24 traffic heatmap with a perceptual OKLCH scale. Use <code>log</code> to reveal heavy tails.
      </p>

      {/* Controls (tiny, dependency-free) */}
      <div role="toolbar" aria-label="Heatmap controls" className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Scale</span>
          <button
            type="button"
            onClick={() => setScale('linear')}
            aria-pressed={scale === 'linear'}
            className={[
              'inline-flex items-center rounded-md border px-2.5 py-1.5 text-xs font-medium',
              scale === 'linear' ? 'bg-secondary text-secondary-foreground' : 'bg-card',
              'border-border hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            ].join(' ')}
          >
            Linear
          </button>
          <button
            type="button"
            onClick={() => setScale('log')}
            aria-pressed={scale === 'log'}
            className={[
              'inline-flex items-center rounded-md border px-2.5 py-1.5 text-xs font-medium',
              scale === 'log' ? 'bg-secondary text-secondary-foreground' : 'bg-card',
              'border-border hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            ].join(' ')}
          >
            Log
          </button>
        </div>

      </div>

      <Heatmap
        title="Heatmap"
        description="7×24 traffic with a perceptual OKLCH scale and quantitative legend."
        data={heatmapData}
        colorScale={scale}
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
