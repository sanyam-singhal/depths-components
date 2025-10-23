'use client';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import type { BaseChartProps } from '@/components/depths/lib/types';
import { formatNumber, formatPercent } from '@/components/depths/lib/chartUtils';

export interface FunnelStep { name: string; count: number; }
export interface FunnelProps extends BaseChartProps { steps: FunnelStep[]; showPercent?: boolean; height?: number|string; onSelectStep?: (index: number)=>void; }
export function Funnel({ steps, showPercent=true, className, height=360, onSelectStep }: FunnelProps) {
  const total = React.useMemo(()=>steps.length>0?steps[0].count:0,[steps]);
  const normalized = React.useMemo(()=>steps.map((s,i)=>({ ...s, pct: total>0?(s.count/total)*100:0, drop: i===0?0: ((steps[i-1].count - s.count) / Math.max(steps[i-1].count,1))*100 })),[steps,total]);
  const [active, setActive] = React.useState<number | null>(null);
  return (
    <Card className={['rounded-md border bg-white dark:bg-neutral-900 p-4', className||''].join(' ')}>
      <div className="w-full" style={{height: typeof height==='number'?`${height}px`:height}}>
        <div className="flex flex-col gap-3 h-full justify-center">
          {normalized.map((s, i)=>{
            const widthPct = s.pct;
            const isActive = active===i;
            return (
              <button key={s.name+String(i)} type="button" onMouseEnter={()=>setActive(i)} onMouseLeave={()=>setActive(null)} onClick={()=>onSelectStep?.(i)} className="w-full text-left">
                <div className="flex items-center gap-3">
                  <div className="w-40 shrink-0 truncate text-sm text-neutral-600">{s.name}</div>
                  <div className="flex-1 bg-neutral-200 dark:bg-neutral-800 rounded-md overflow-hidden">
                    <div className="h-8 rounded-md transition-all" style={{ width: `${widthPct}%`, background: isActive?'color-mix(in oklch, var(--color-chart-1) 85%, white)':'var(--color-chart-1, #4f46e5)' }} />
                  </div>
                  <div className="w-24 text-right text-sm tabular-nums">{formatNumber(s.count)}</div>
                  {showPercent && <div className="w-20 text-right text-sm text-neutral-500 tabular-nums">{formatPercent(s.pct)}</div>}
                  {i>0 && <div className={['w-20 text-right text-sm tabular-nums', s.drop>0?'text-red-600':'text-neutral-500'].join(' ')}>{s.drop>0?`-${s.drop.toFixed(1)}%`:'0.0%'}</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
