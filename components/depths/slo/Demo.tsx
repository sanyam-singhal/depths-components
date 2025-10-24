// components/depths/slo/Demo.tsx
'use client';

import * as React from 'react';
import { ErrorBudgetLine } from '@/components/depths/slo/ErrorBudgetLine';
import { Gauge } from '@/components/depths/slo/Gauge';
import { SaturationBand } from '@/components/depths/slo/SaturationBand';
import type { BandSeries } from '@/components/depths/lib/types';

// ---------- deterministic dummy data ----------

// Error budget remaining over time (0–100)
// Starts at 100 and burns gradually with a few spikes.
const errorBudgetPoints = Array.from({ length: 72 }, (_, i) => {
  const drift = i * -0.6;                     // steady burn
  const spikes = (i % 17 === 0 ? -8 : 0) + (i % 29 === 0 ? -12 : 0);
  const v = Math.max(0, Math.min(100, 100 + drift + spikes));
  return { t: i, remaining: Number(v.toFixed(1)) };
});

// Gauge (SLO attainment): current vs target (both in % terms)
const sloTarget = 99.9;
const sloCurrent = 99.2; // 99.2 / 99.9 ≈ 99.3% toward target

// CPU saturation band: p50–p95 with mean overlay
const cpuBand: BandSeries = {
  key: 'cpu',
  points: Array.from({ length: 72 }, (_, i) => {
    const base = 45 + 10 * Math.sin(i / 6) + (i % 9);
    const p50 = base;                 // typical load
    const p95 = base + 25 + 8 * Math.cos(i / 7); // spikes
    const mean = p50 + (p95 - p50) * 0.35;
    return { t: i, p50, p95, mean };
  }),
};

// ---------- Demos ----------

export function ErrorBudgetLineDemo() {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Error budget remaining across the window; 0% is the hard floor.
      </p>
      <ErrorBudgetLine points={errorBudgetPoints} height={320} />
    </div>
  );
}

export function GaugeDemo() {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        SLO attainment against target; center label reflects percent toward target.
      </p>
      <div className="grid grid-cols-1 gap-4 @md:grid-cols-2">
        <Gauge target={sloTarget} current={sloCurrent} height={240} caption={`Target: ${sloTarget}%`} />
        <Gauge target={50} current={38} unit="ms" height={240} className="@md:justify-self-end" caption="Target: ≤ 50 ms" />
      </div>
    </div>
  );
}

export function SaturationBandDemo() {
  const thresholds = [
    { label: 'Alert (70%)', value: 70 },
    { label: 'Scale (85%)', value: 85 },
    { label: 'Critical (95%)', value: 95 },
  ];
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        CPU saturation with p50–p95 band and mean overlay; reference lines mark thresholds.
      </p>
      <SaturationBand resource="cpu" series={[cpuBand]} mode="p50p95" thresholds={thresholds} height={320} />
    </div>
  );
}

// ---------- Registry + resolver ----------

export const SLO_DEMOS = {
  'error-budget-line': ErrorBudgetLineDemo,
  'gauge': GaugeDemo,
  'saturation-band': SaturationBandDemo,
} as const;

export type SloId = keyof typeof SLO_DEMOS;

export function renderSloDemo(id: string): React.ReactNode {
  const C = (SLO_DEMOS as Record<string, React.ComponentType | undefined>)[id];
  return C ? <C /> : null;
}
