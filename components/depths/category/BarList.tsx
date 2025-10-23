'use client';
import * as React from 'react';
import type { BaseChartProps, CategoryItem } from '@/components/depths/lib/types';
import { Card } from '@/components/ui/card';

export interface BarListProps extends BaseChartProps { items: CategoryItem[]; sort?: 'value'|'delta'; topK?: number; }
export function BarList({ items, sort='value', topK=20, className }: BarListProps) {
  const sorted = React.useMemo(()=>{
    const arr = [...items];
    if(sort==='delta') arr.sort((a,b)=>Math.abs((b.delta??0)) - Math.abs((a.delta??0)));
    else arr.sort((a,b)=>b.value - a.value);
    return arr.slice(0, topK);
  }, [items, sort, topK]);
  const max = React.useMemo(()=>sorted.reduce((m,i)=>Math.max(m, i.value), 0), [sorted]);
  return (
    <Card className={['p-3 rounded-md border bg-white dark:bg-neutral-900', className||''].join(' ')}>
      <ul className="flex flex-col gap-2">
        {sorted.map((it, idx)=>(
          <li key={it.label+String(idx)} className="flex items-center gap-3">
            <div className="w-48 truncate text-sm text-neutral-700 dark:text-neutral-300">{it.label}</div>
            <div className="flex-1 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div className="h-2 rounded-full" style={{ width: max>0?`${(it.value/max)*100}%`:'0%', background: 'var(--color-chart-1, #4f46e5)' }} />
            </div>
            <div className="w-20 text-right text-sm tabular-nums">{it.value}</div>
            {typeof it.delta==='number' && <div className={['w-16 text-right text-sm tabular-nums', it.delta>=0?'text-green-600':'text-red-600'].join(' ')}>{(it.delta>=0?'+':'')+it.delta.toFixed(1)+'%'}</div>}
          </li>
        ))}
      </ul>
    </Card>
  );
}
