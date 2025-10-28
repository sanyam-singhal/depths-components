// components/depths/foundations/Demo.tsx
'use client';

import * as React from 'react';
import { KPIStat } from '@/components/depths/foundations/KPIStat';
import { StatGrid } from '@/components/depths/foundations/StatGrid';
import { DataTable } from '@/components/depths/foundations/DataTable';
import { ControlBar } from '@/components/depths/foundations/ControlBar';
import { RadialGauge } from '@/components/depths/foundations/RadialGauge';

// ---- shared dummy data (local to demo, no app bloat) ----
const sparkline= {
  key: 'active-sessions',
  points: Array.from({ length: 16 }, (_, i) => ({
    t: i,
    v: 50 + Math.round(15 * Math.sin(i / 2) + i),
  })),
};
const kpis = [
  { label: 'New Users', value: 12540, delta: 0.045 },
  { label: 'DAU', value: 8421, delta: -0.012 },
  { label: 'Revenue', value: 183_250, unit: 'USD', delta: 0.027 },
  { label: 'Churn', value: 0.031, delta: -0.004 },
];

const tableCols = [
  { key: 'service', label: 'Service' },
  { key: 'requests', label: 'Requests', align: 'right' as const },
  { key: 'errors', label: 'Errors', align: 'right' as const },
  { key: 'p95', label: 'p95 (ms)', align: 'right' as const },
];

const tableRows = [
  { service: 'api-gateway', requests: 152_403, errors: 132, p95: 187 },
  { service: 'billing',     requests:  84_902, errors:  21, p95: 224 },
  { service: 'users',       requests:  64_311, errors:  15, p95: 141 },
  { service: 'search',      requests:  58_777, errors:  61, p95: 302 },
  { service: 'recommender', requests:  41_566, errors:   9, p95: 264 },
  { service: 'ingest',      requests:  31_212, errors:  11, p95: 198 },
  { service: 'images',      requests:  28_004, errors:  46, p95: 350 },
  { service: 'mailer',      requests:  17_590, errors:   3, p95: 115 },
];

// tiny CSV helper just for the demo
 function downloadCSV(filename: string, header: string[], rows: Array<Array<string | number>>) {
   const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
   const BOM = '\uFEFF'; // helps Excel open UTF-8 correctly
   const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
   const url = URL.createObjectURL(blob); // create blob URL. :contentReference[oaicite:8]{index=8}
   const a = document.createElement('a');
   a.href = url;
   a.download = filename;
   a.click();
   URL.revokeObjectURL(url); // clean up to avoid leaks. :contentReference[oaicite:9]{index=9}
 }


// ---- KPI Stat ----
export function KPIStatDemo() {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Single KPI with optional sparkline and delta coloring.
      </p>
      <div className="max-w-sm">
        <KPIStat kpi={{ label: 'Active Sessions', value: 3721, delta: 0.061 }} sparkline={sparkline} />
      </div>
    </div>
  );
}

// ---- Stat Grid ----
export function StatGridDemo() {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Responsive grid of KPI cards. Uses Tailwind v4 container queries (<code>@md:</code>), so a container ancestor is provided here.
      </p>
      <StatGrid title= "Title for Stat Grid" items={kpis}/>
    </div>
  );
}

// ---- Data Table ----
export function DataTableDemo() {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Searchable table with optional CSV export.
      </p>
      <DataTable
        title="Service Metrics"
        columns={tableCols}
        rows={tableRows}
        total={tableRows.length}
        pageSize={4}
        onExportCSV={() =>
          downloadCSV(
            'services.csv',
            tableCols.map(c => c.label),
            tableRows.map(r => [r.service, r.requests, r.errors, r.p95])
          )
        }
      />
    </div>
  );
}

// ---- Control Bar ----
// local demo state; ControlBar triggers onChange when its internal action updates
export function ControlBarDemo() {
  const controls = [
    {
      type: 'select',
      key: 'range',
      label: 'Range',
      options: [
        { label: '1h', value: '1h' },
        { label: '6h', value: '6h' },
        { label: '24h', value: '24h' },
        { label: '7d', value: '7d' },
        { label: '30d', value: '30d' },
      ],
      defaultValue: '24h',
    },
    {
      type: 'select',
      key: 'window',
      label: 'Window',
      options: [
        { label: '1m', value: '1m' },
        { label: '5m', value: '5m' },
        { label: '15m', value: '15m' },
        { label: '1h', value: '1h' },
      ],
      defaultValue: '5m',
    },
    {
      type: 'select',
      key: 'groupBy',
      label: 'Group by',
      options: [
        { label: 'service', value: 'service' },
        { label: 'region', value: 'region' },
        { label: 'tier', value: 'tier' },
      ],
      defaultValue: 'service',
    },
    {
      type: 'slider',
      key: 'topK',
      label: 'Top K',
      min: 5,
      max: 50,
      step: 5,
      defaultValue: 10,
    },
  ] as const;

  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Self-contained control bar — only <code>title</code> and <code>controls</code>.
      </p>
      <ControlBar title="Query Controls" controls={controls} />
    </div>
  );
}

// Add this to Demo.tsx after ControlBarDemo

export function RadialGaugeDemo() {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Radial gauge showing progress/value with dynamic color thresholds and center label.
      </p>
      <div className="max-w-sm">
        <RadialGauge
          title="Utilization"
          description="Current system load."
          value={69}
          min={0}
          max={100}
          unit="%"
          height={240}
        />
      </div>
    </div>
  );
}

// Update FOUNDATION_DEMOS
export const FOUNDATION_DEMOS = {
  'kpi-stat': KPIStatDemo,
  'stat-grid': StatGridDemo,
  'data-table': DataTableDemo,
  'control-bar': ControlBarDemo,
  'radial-gauge': RadialGaugeDemo,
} as const;

export type FoundationId = keyof typeof FOUNDATION_DEMOS;

export function renderFoundationsDemo(id: string): React.ReactNode {
  const C = (FOUNDATION_DEMOS as Record<string, React.ComponentType | undefined>)[id];
  return C ? <C /> : null;
}
