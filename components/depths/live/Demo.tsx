// components/depths/live/Demo.tsx
'use client';

import * as React from 'react';
import { LiveTailList } from '@/components/depths/live/LiveTailList';
import { LiveTracesFeed } from '@/components/depths/live/LiveTracesFeed';

// ---------- Demos ----------
export function LiveTailListDemo() {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Live logs via Server-Sent Events; filter by severity or search.
      </p>
      <LiveTailList
        title="Live Logs"
        description="Receiving logs from an SSE endpoint"
        sseUrl="/api/live/logs"
        height={420}
        onCopy={(row) => {
          navigator.clipboard.writeText(JSON.stringify(row));
          // Optional: alert or toast, but keep simple
        }}
      />
    </div>
  );
}
export function LiveTracesFeedDemo() {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Live traces with quick filters; click any row to open details.
      </p>
      <LiveTracesFeed
        title="Live Traces"
        description="Receiving traces from an SSE endpoint"
        sseUrl="/api/live/traces"
        height={420}
      />
    </div>
  );
}

// ---------- Registry + resolver ----------
export const LIVE_DEMOS = {
  'live-tail-list': LiveTailListDemo,
  'live-traces-feed': LiveTracesFeedDemo,
} as const;

export type LiveId = keyof typeof LIVE_DEMOS;

export function renderLiveDemo(id: string): React.ReactNode {
  const C = (LIVE_DEMOS as Record<string, React.ComponentType | undefined>)[id];
  return C ? <C /> : null;
}
