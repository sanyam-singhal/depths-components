'use client';
import * as React from 'react';
import type { BaseChartProps } from '@/components/depths/lib/types';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export interface TraceSpan { trace_id: string; span_id: string; name: string; dur_ms: number; status: 'OK'|'ERROR'|'UNSET'|string; ts: number; service?: string; attributes?: Record<string, unknown>; }
export interface LiveTracesFeedProps extends BaseChartProps { sseUrl: string; bufferSize?: number; initialPaused?: boolean; minDurationMs?: number; statusFilter?: Array<'OK'|'ERROR'|'UNSET'|string>; height?: number|string; }
export function LiveTracesFeed({ sseUrl, bufferSize=300, initialPaused=false, minDurationMs=0, statusFilter, height=420, className }: LiveTracesFeedProps) {
  const [rows, setRows] = React.useState<TraceSpan[]>([]);
  const [paused, setPaused] = React.useState<boolean>(initialPaused);
  const [selected, setSelected] = React.useState<TraceSpan | null>(null);
  const esRef = React.useRef<EventSource | null>(null);
  React.useEffect(()=>{
    const es = new EventSource(sseUrl);
    esRef.current = es;
    const onMsg = (ev: MessageEvent<string>)=>{
      if(paused) return;
      try {
        const data = JSON.parse(ev.data) as TraceSpan;
        setRows(prev=>{
          const next = [data, ...prev];
          if(next.length>bufferSize) next.length = bufferSize;
          return next;
        });
      } catch {}
    };
    es.addEventListener('message', onMsg as EventListener);
    return ()=>{
      es.removeEventListener('message', onMsg as EventListener);
      es.close();
      esRef.current = null;
    };
  }, [sseUrl, bufferSize, paused]);
  const filtered = React.useMemo(()=>{
    let cur = rows;
    if(minDurationMs>0) cur = cur.filter(r=>r.dur_ms>=minDurationMs);
    if(statusFilter && statusFilter.length>0) cur = cur.filter(r=>statusFilter.includes(r.status));
    return cur;
  }, [rows, minDurationMs, statusFilter]);
  return (
    <div className={['rounded-md border bg-white dark:bg-neutral-900', className||''].join(' ')} style={{height: typeof height==='number'?`${height}px`:height}}>
      <div className="flex items-center justify-between p-2 border-b">
        <div className="text-sm text-neutral-600">Live traces</div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-neutral-500">{filtered.length}</div>
          <Button size="sm" variant="outline" onClick={()=>setPaused(p=>!p)}>{paused?'Resume':'Pause'}</Button>
        </div>
      </div>
      <div className="h-[calc(100%-40px)] overflow-auto text-sm">
        <ul className="divide-y">
          {filtered.map((r, i)=>{
            const t = new Date(r.ts).toLocaleTimeString();
            const color = r.status==='ERROR'?'text-red-600': r.status==='OK'?'text-green-600':'text-neutral-600';
            return (
              <li key={r.trace_id+r.span_id+String(i)} className="px-2 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 w-16 shrink-0">{t}</span>
                  <span className={['w-12 shrink-0 uppercase', color].join(' ')}>{String(r.status)}</span>
                  <span className="w-32 shrink-0 truncate text-neutral-700 dark:text-neutral-300">{r.service ?? '-'}</span>
                  <span className="flex-1 truncate">{r.name}</span>
                  <span className="w-20 text-right tabular-nums">{r.dur_ms.toFixed(2)} ms</span>
                  <Sheet>
                    <SheetTrigger asChild><Button size="sm" variant="ghost" onClick={()=>setSelected(r)}>Open</Button></SheetTrigger>
                    <SheetContent side="right">
                      <SheetHeader>
                        <SheetTitle>{r.name}</SheetTitle>
                      </SheetHeader>
                      <div className="mt-4 space-y-2">
                        <div className="text-xs text-neutral-500">Trace</div>
                        <div className="text-sm break-all">{r.trace_id}</div>
                        <div className="text-xs text-neutral-500 mt-2">Span</div>
                        <div className="text-sm break-all">{r.span_id}</div>
                        <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                          <div>Status</div><div className="text-right">{r.status}</div>
                          <div>Service</div><div className="text-right">{r.service ?? '-'}</div>
                          <div>Duration</div><div className="text-right">{r.dur_ms.toFixed(2)} ms</div>
                          <div>Timestamp</div><div className="text-right">{new Date(r.ts).toLocaleString()}</div>
                        </div>
                        {r.attributes && <pre className="mt-3 rounded bg-neutral-100 dark:bg-neutral-800 p-2 text-xs overflow-auto">{JSON.stringify(r.attributes, null, 2)}</pre>}
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
