'use client';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import type { BaseChartProps, TimeSeries } from '@/components/depths/lib/types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';
export interface SparklineCardProps extends BaseChartProps { series: TimeSeries; label?: string; value?: string; threshold?: number; height?: number|string; }
export function SparklineCard({ series, label, value, className, height=80 }: SparklineCardProps) {
  const data = React.useMemo(()=>series.points.map(p=>({t:p.t, v:p.v})),[series]);
  return (
    <Card className={['p-3 rounded-md border bg-white dark:bg-neutral-900', className||''].join(' ')}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-neutral-500">{label}</div>
        {value && <div className="text-sm font-medium">{value}</div>}
      </div>
      <div className="w-full" style={{height: typeof height==='number'?`${height}px`:height}}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <XAxis dataKey="t" hide />
            <YAxis hide />
            <Area type="monotone" dataKey="v" stroke="var(--color-chart-1,#4f46e5)" fill="var(--color-chart-1,#4f46e5)" fillOpacity={0.15} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}