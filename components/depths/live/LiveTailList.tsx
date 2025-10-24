'use client';
import * as React from 'react';
import type { BaseChartProps } from '@/components/depths/lib/types';
import { Button } from '@/components/ui/button';
import { makeRingStore } from '@/components/depths/lib/ringBuffer';

export type LogSeverity = 'trace'|'debug'|'info'|'warn'|'error'|'fatal'|string;
export interface LogRow { ts: number; severity: LogSeverity; service: string; body: string; [k: string]: unknown; }

export interface LiveTailListProps extends BaseChartProps {
  sseUrl: string;
  bufferSize?: number;
  initialPaused?: boolean;
  severityFilter?: LogSeverity[];
  searchQuery?: string;
  height?: number|string;
  onCopy?: (row: LogRow)=>void;
}

export function LiveTailList({
  sseUrl,
  bufferSize = 50,            // keep your original default
  initialPaused = true,
  severityFilter,
  searchQuery,
  height = 420,
  className,
  onCopy
}: LiveTailListProps) {
  // External store for snapshot & subscription
  const storeRef = React.useRef(makeRingStore<LogRow>(bufferSize));
  React.useEffect(() => { storeRef.current.setCapacity(bufferSize); }, [bufferSize]);

  // Pause / resume
  const [paused, setPaused] = React.useState<boolean>(initialPaused);
  const esRef = React.useRef<EventSource | null>(null);

  // SSE lifecycle: open only when not paused; always clean up
  React.useEffect(() => {
    if (paused) {
      esRef.current?.close(); // MDN: EventSource.close()
      esRef.current = null;
      return;
    }
    const es = new EventSource(sseUrl);
    esRef.current = es;
    const onMsg = (ev: MessageEvent<string>) => {
      try {
        const data = JSON.parse(ev.data) as LogRow;
        storeRef.current.push(data);
      } catch { /* ignore malformed */ }
    };
    es.addEventListener('message', onMsg as EventListener);
    return () => {
      es.removeEventListener('message', onMsg as EventListener);
      es.close();
      esRef.current = null;
    };
  }, [sseUrl, bufferSize, paused]);

  // Stable snapshot (referentially stable between changes)
  const snapshot = React.useSyncExternalStore(
    storeRef.current.subscribe,
    storeRef.current.getSnapshot,
    storeRef.current.getSnapshot
  );

  // Filter per render (cheap; snapshot already newest-first)
  const filtered = React.useMemo(() => {
    let cur = snapshot;
    if (severityFilter && severityFilter.length > 0) {
      cur = cur.filter(r => severityFilter.includes(r.severity));
    }
    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      cur = cur.filter(r =>
        r.body.toLowerCase().includes(q) || r.service.toLowerCase().includes(q)
      );
    }
    return cur;
  }, [snapshot, severityFilter, searchQuery]);

  return (
    <div
      className={['rounded-md border bg-white dark:bg-neutral-900', className || ''].join(' ')}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <div className="flex items-center justify-between p-2 border-b">
        <div className="text-sm text-neutral-600">Live logs</div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-neutral-500">{filtered.length}</div>
          <Button size="sm" variant="outline" onClick={() => setPaused(p => !p)}>
            {paused ? 'Resume' : 'Pause'}
          </Button>
        </div>
      </div>

      <div className="h-[calc(100%-40px)] overflow-auto font-mono text-xs">
        <ul className="divide-y">
          {filtered.map((r, i) => {
            const t = new Date(r.ts).toLocaleTimeString();
            const color =
              r.severity === 'error' || r.severity === 'fatal'
                ? 'text-red-600'
                : r.severity === 'warn'
                ? 'text-amber-600'
                : 'text-neutral-600';
            return (
              <li key={String(r.ts) + r.service + String(i)} className="px-2 py-1 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                <div className="flex items-start gap-2">
                  <span className="text-neutral-400 w-16 shrink-0">{t}</span>
                  <span className={['w-14 shrink-0 uppercase', color].join(' ')}>{String(r.severity)}</span>
                  <span className="w-32 shrink-0 truncate text-neutral-700 dark:text-neutral-300">{r.service}</span>
                  <span className="flex-1 whitespace-pre-wrap break-words">{r.body}</span>
                  <button type="button" className="text-xs text-neutral-500 hover:text-neutral-800" onClick={() => onCopy?.(r)}>
                    Copy
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
