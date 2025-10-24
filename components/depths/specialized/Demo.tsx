// components/depths/specialized/Demo.tsx
'use client';

import * as React from 'react';
import type { GraphNode, GraphEdge, TimelineEvent } from '@/components/depths/lib/types';
import { CompareCards } from '@/components/depths/specialized/CompareCards';
import { Funnel } from '@/components/depths/specialized/Funnel';
import { GraphServiceMap } from '@/components/depths/specialized/GraphServiceMap';
import { Timeline } from '@/components/depths/specialized/Timeline';

// ---------------- deterministic dummy data ----------------

// CompareCards
const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const compareMetrics = [
  { name: 'Revenue',        pre: 182_000, post: 236_500, formatter: fmtCurrency },
  { name: 'Conversion Rate',pre: 2.4,     post: 3.1,     unit: '%' },
  { name: 'Avg Latency',    pre: 180,     post: 132,     unit: 'ms' },
  { name: 'NPS',            pre: 36,      post: 52 },
];

// Funnel
const funnelSteps = [
  { name: 'Visits',         count: 120_000 },
  { name: 'Signups',        count: 22_400 },
  { name: 'Onboarded',      count: 15_050 },
  { name: 'Trial Started',  count: 9_480 },
  { name: 'Converted',      count: 3_960 },
];

// GraphServiceMap
const graphNodes: GraphNode[] = [
  { id: 'web' }, { id: 'api' }, { id: 'auth' }, { id: 'billing' },
  { id: 'queue' }, { id: 'worker' }, { id: 'search' }, { id: 'db' }, { id: 'cdn' },
];

const graphEdges: GraphEdge[] = [
  { source: 'web', target: 'api' },
  { source: 'api', target: 'auth' },
  { source: 'api', target: 'billing' },
  { source: 'api', target: 'search' },
  { source: 'api', target: 'queue' },
  { source: 'worker', target: 'db' },
  { source: 'queue', target: 'worker' },
  { source: 'cdn', target: 'web' },
  { source: 'web', target: 'search' },
  { source: 'api', target: 'db' },
];

// Timeline
const now = Date.now();
const timelineEvents: TimelineEvent[] = [
  { t: now - 1000 * 60 * 60 * 8,  type: 'deploy',     label: 'v1.8.0 rolled out', meta: { by: 'ops-bot', commit: 'b7e91c' } },
  { t: now - 1000 * 60 * 60 * 6,  type: 'incident',   label: 'Elevated 5xx',      meta: { region: 'us-east-1', p95: '1.8s' } },
  { t: now - 1000 * 60 * 60 * 5,  type: 'mitigation', label: 'Rollback auth',     meta: { feature: 'otp-v2' } },
  { t: now - 1000 * 60 * 60 * 3,  type: 'scale-up',   label: 'Queue x2',          meta: { nodes: 8 } },
  { t: now - 1000 * 60 * 60 * 1,  type: 'resolution', label: 'Incident resolved', meta: { duration: '5h' } },
];

// ---------------- Demos ----------------

export function CompareCardsDemo() {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Side-by-side pre/post metrics; invert toggle flips the comparison.
      </p>
      <CompareCards metrics={compareMetrics} notes="Cohort: Q3 vs Q2" twoColumns />
    </div>
  );
}

export function FunnelDemo() {
  const [active, setActive] = React.useState<number | null>(null);
  return (
    <div className="space-y-3 @container">
      <p className="text-sm text-muted-foreground">
        Linear funnel; each step width is % of the first step. Hover to emphasize; click to select.
      </p>
      <Funnel steps={funnelSteps} showPercent height={320} onSelectStep={setActive} />
      <div className="text-xs text-neutral-500">
        {active == null ? 'Select a step to inspect' : `Selected: ${funnelSteps[active].name}`}
      </div>
    </div>
  );
}

export function GraphServiceMapDemo() {
  const [selected, setSelected] = React.useState<string | null>(null);
  const [layout, setLayout] = React.useState<'circle' | 'grid'>('circle');
  return (
    <div className="space-y-3 @container">
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground">Service dependency graph; click a node to select.</p>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs">Layout</label>
          <select
            className="text-xs rounded border bg-background px-2 py-1"
            value={layout}
            onChange={(e) => setLayout(e.target.value as 'circle' | 'grid')}
          >
            <option value="circle">circle</option>
            <option value="grid">grid</option>
          </select>
        </div>
      </div>
      <GraphServiceMap nodes={graphNodes} edges={graphEdges} layout={layout} height={380} onSelectNode={setSelected} />
      <div className="text-xs text-neutral-500">{selected ? `Selected node: ${selected}` : 'No node selected'}</div>
    </div>
  );
}

export function TimelineDemo() {
  const [picked, setPicked] = React.useState<TimelineEvent | null>(null);
  return (
    <div className="space-y-3 @container">
      <p className="text-sm text-muted-foreground">
        Chronological events; click an item to surface its meta.
      </p>
      <Timeline events={timelineEvents} height={320} onSelect={setPicked} />
      {picked && (
        <pre className="rounded-md bg-neutral-50 dark:bg-neutral-900/60 p-3 text-xs overflow-x-auto">
{JSON.stringify(picked, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ---------------- Registry + resolver ----------------

export const SPECIALIZED_DEMOS = {
  'compare-cards': CompareCardsDemo,
  'funnel': FunnelDemo,
  'graph-service-map': GraphServiceMapDemo,
  'timeline': TimelineDemo,
} as const;

export type SpecializedId = keyof typeof SPECIALIZED_DEMOS;

export function renderSpecializedDemo(id: string): React.ReactNode {
  const C = (SPECIALIZED_DEMOS as Record<string, React.ComponentType | undefined>)[id];
  return C ? <C /> : null;
}
