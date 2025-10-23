'use client';
import * as React from 'react';
import type { BaseChartProps } from '@/components/depths/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatNumber, formatPercent } from '@/components/depths/lib/chartUtils';

export interface CompareMetric { name: string; pre: number; post: number; unit?: string; formatter?: (v: number)=>string; }
export interface CompareCardsProps extends BaseChartProps { metrics: CompareMetric[]; notes?: string; twoColumns?: boolean; }
export function CompareCards({ metrics, notes, twoColumns=true, className }: CompareCardsProps) {
  const [invert, setInvert] = React.useState<boolean>(false);
  const renderValue = (v: number, unit?: string, fmt?: (v:number)=>string)=> fmt?fmt(v): unit?`${formatNumber(v)} ${unit}`:formatNumber(v);
  return (
    <Card className={['rounded-md border bg-white dark:bg-neutral-900 p-4', className||''].join(' ')}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-neutral-500">{notes}</div>
        <Button size="sm" variant="outline" onClick={()=>setInvert(v=>!v)}>{invert?'Post vs Pre':'Pre vs Post'}</Button>
      </div>
      <div className={['grid gap-3', twoColumns?'grid-cols-1 @md:grid-cols-2':'grid-cols-1'].join(' ')}>
        {metrics.map((m, i)=>{
          const a = invert? m.post : m.pre;
          const b = invert? m.pre : m.post;
          const delta = b - a;
          const pct = a!==0 ? (delta/a)*100 : 0;
          const sign = delta>0?'+':'';
          return (
            <div key={m.name+String(i)} className="rounded-md border p-3">
              <div className="text-sm text-neutral-600">{m.name}</div>
              <div className="mt-1 grid grid-cols-2 gap-3 items-end">
                <div>
                  <div className="text-xs text-neutral-500">{invert?'Post':'Pre'}</div>
                  <div className="text-lg font-semibold">{renderValue(a, m.unit, m.formatter)}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 text-right">{invert?'Pre':'Post'}</div>
                  <div className="text-lg font-semibold text-right">{renderValue(b, m.unit, m.formatter)}</div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className={['text-sm font-medium', delta>=0?'text-green-600':'text-red-600'].join(' ')}>{sign}{formatNumber(delta)}</div>
                <div className={['text-sm', pct>=0?'text-green-600':'text-red-600'].join(' ')}>{pct>=0?'+':''}{formatPercent(pct)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
