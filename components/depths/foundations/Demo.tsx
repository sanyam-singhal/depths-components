// components/depths/foundations/Demo.tsx
'use client';

import * as React from 'react';
import type {
  TimeSeries,
  ControlPanelState,
} from '@/components/depths/lib/types';
import { KPIStat } from '@/components/depths/foundations/KPIStat';
import { StatGrid } from '@/components/depths/foundations/StatGrid';
import { DataTable } from '@/components/depths/foundations/DataTable';
import { ControlBar } from '@/components/depths/foundations/ControlBar';

// ---- shared dummy data (local to demo, no app bloat) ----
const sparkline: TimeSeries = {
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
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
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
      <StatGrid items={kpis} columns={4} />
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
        columns={tableCols}
        rows={tableRows}
        total={tableRows.length}
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
  const [state, setState] = React.useState<ControlPanelState>({
    range: '24h',
    window: '5m',
    groupBy: 'service',
    topK: 10,
    showLegend: true,
  });

  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Interactive controls wired via <code>useActionState</code>; changes are reflected below.
      </p>
      <ControlBar
        value={state}
        // BEFORE: onChange={setState}  // param type wider than expected
        // AFTER: wrap to match (next: ControlPanelState) => void
        onChange={(next) => setState(next)}
        ranges={['1h','6h','24h','7d','30d']}
        windows={['1m','5m','15m','1h']}
        groups={['service','region','tier']}
      />
      <pre className="rounded-md border bg-muted p-3 text-xs">
        {JSON.stringify(state, null, 2)}
      </pre>
    </div>
  );
}

// ---- Public API used by app/page.tsx ----
export const FOUNDATION_DEMOS = {
  'kpi-stat': KPIStatDemo,
  'stat-grid': StatGridDemo,
  'data-table': DataTableDemo,
  'control-bar': ControlBarDemo,
} as const;

export type FoundationId = keyof typeof FOUNDATION_DEMOS;

export function renderFoundationsDemo(id: string): React.ReactNode {
  const C = (FOUNDATION_DEMOS as Record<string, React.ComponentType | undefined>)[id];
  return C ? <C /> : null;
}
