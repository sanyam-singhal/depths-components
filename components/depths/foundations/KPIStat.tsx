'use client';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import type { BaseChartProps, KPI, TimeSeries } from '@/components/depths/lib/types';
import { formatNumber, formatPercent } from '@/components/depths/lib/chartUtils';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
export interface KPIStatProps extends BaseChartProps { kpi: KPI; sparkline?: TimeSeries; valueFormatter?: (n: number)=>string; }
export function KPIStat({ kpi, sparkline, className, valueFormatter }: KPIStatProps) {
  const vfmt = valueFormatter ?? formatNumber;
  const color = kpi.delta!=null ? (kpi.delta>=0 ? 'text-green-600' : 'text-red-600') : 'text-neutral-600';
  return (
    <Card className={['p-4 rounded-md border bg-white dark:bg-neutral-900', className||''].join(' ')}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-sm text-neutral-500">{kpi.label}</div>
          <div className="text-3xl font-semibold">{kpi.unit?`${vfmt(kpi.value)} ${kpi.unit}`:vfmt(kpi.value)}</div>
          {typeof kpi.delta==='number' && <div className={['text-sm', color].join(' ')}>{formatPercent(kpi.delta)}</div>}
        </div>
        {sparkline && <div className="w-28 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkline.points.map(p=>({t:p.t, v:p.v}))}>
              <XAxis dataKey="t" hide />
              <YAxis hide />
              <Tooltip formatter={(v)=>[v as number,'']} labelFormatter={()=>''} />
              <Line type="monotone" dataKey="v" stroke="var(--color-chart-1, #4f46e5)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>}
      </div>
    </Card>
  );
}