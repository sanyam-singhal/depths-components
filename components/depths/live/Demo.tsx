// components/depths/live/Demo.tsx
'use client';

import * as React from 'react';
import { LiveTailList } from '@/components/depths/live/LiveTailList';
import { LiveTracesFeed } from '@/components/depths/live/LiveTracesFeed';

// ---------- Demos ----------
export function LiveTailListDemo() {
  const [query, setQuery] = React.useState('');
  const [sev, setSev] = React.useState<string[]>([]);
  const toggle = (s: string) =>
    setSev(list => (list.includes(s) ? list.filter(x => x !== s) : [...list, s]));

  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Live logs via Server-Sent Events; filter by severity or search.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {['trace','debug','info','warn','error'].map(s => (
          <button
            key={s}
            className={['rounded border px-2 py-1 text-xs',
              sev.includes(s) ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-black' : 'bg-background'].join(' ')}
            onClick={()=>toggle(s)}
          >
            {s}
          </button>
        ))}
        <input
          className="ml-auto w-64 rounded border bg-background px-2 py-1 text-sm"
          placeholder="search message or service…"
          value={query}
          onChange={e=>setQuery(e.target.value)}
        />
      </div>
      <LiveTailList
        sseUrl="/api/live/logs"
        severityFilter={sev as string[]}
        searchQuery={query}
        height={420}
      />
    </div>
  );
}

export function LiveTracesFeedDemo() {
  const [minMs, setMinMs] = React.useState(0);
  const [status, setStatus] = React.useState<string[]>([]);

  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Live traces with quick filters; click any row to open details.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs">Min duration</label>
        <input type="range" min={0} max={1200} step={50}
               value={minMs} onChange={e=>setMinMs(Number(e.target.value))}/>
        <div className="text-xs tabular-nums w-16">{minMs} ms</div>
        {['OK','ERROR','UNSET'].map(s => (
          <label key={s} className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={status.includes(s)}
              onChange={(e)=> setStatus(v => e.target.checked ? [...v, s] : v.filter(x=>x!==s))}
            />
            {s}
          </label>
        ))}
      </div>
      <LiveTracesFeed
        sseUrl="/api/live/traces"
        minDurationMs={minMs}
        statusFilter={status as string[]}
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
