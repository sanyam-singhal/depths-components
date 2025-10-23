'use client';
import * as React from 'react';
import type { BaseChartProps, KPI } from '@/components/depths/lib/types';
import { KPIStat } from '@/components/depths/foundations/KPIStat';
export interface StatGridProps extends BaseChartProps { items: KPI[]; columns?: number; }
export function StatGrid({ items, columns=4, className }: StatGridProps) {
  return (
    <div className={['grid gap-4', `grid-cols-1 @md:grid-cols-2 @xl:grid-cols-${columns}` , className||''].join(' ')}>
      {items.map((k, i)=>(
        <KPIStat key={k.label+String(i)} kpi={k} />
      ))}
    </div>
  );
}