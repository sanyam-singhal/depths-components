'use client';
import * as React from 'react';
import type { BaseChartProps, TimelineEvent } from '@/components/depths/lib/types';
import { Card } from '@/components/ui/card';

export interface TimelineProps extends BaseChartProps { events: TimelineEvent[]; height?: number|string; onSelect?: (ev: TimelineEvent)=>void; }
export function Timeline({ events, className, height=360, onSelect }: TimelineProps) {
  const sorted = React.useMemo(()=>[...events].sort((a,b)=>a.t-b.t),[events]);
  return (
    <Card className={['rounded-md border bg-white dark:bg-neutral-900 p-4', className||''].join(' ')}>
      <div className="w-full overflow-auto" style={{height: typeof height==='number'?`${height}px`:height}}>
        <div className="relative pl-6">
          <div className="absolute left-2 top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-800" />
          <ul className="space-y-4">
            {sorted.map((e, idx)=>{
              const d = new Date(e.t);
              const time = d.toLocaleString();
              return (
                <li key={String(e.t)+e.type+String(idx)} className="relative">
                  <div className="absolute -left-0.5 top-1.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-neutral-900" style={{ background: 'var(--color-chart-1, #4f46e5)' }} />
                  <button type="button" onClick={()=>onSelect?.(e)} className="w-full text-left rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800 px-3 py-2 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium">{e.label ?? e.type}</div>
                      <div className="text-xs text-neutral-500">{time}</div>
                    </div>
                    {e.meta && <div className="mt-1 text-xs text-neutral-600 line-clamp-2">{JSON.stringify(e.meta)}</div>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Card>
  );
}
