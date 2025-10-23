'use client';
import * as React from 'react';
import type { BaseChartProps, TimeSeries } from '@/components/depths/lib/types';
import { toRechartsTimeSeries, getColorPalette, formatNumber } from '@/components/depths/lib/chartUtils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Brush } from 'recharts';
export interface AreaSeriesProps extends BaseChartProps { series: TimeSeries[]; colors?: string[]; showLegend?: boolean; valueFormatter?: (v:number)=>string; height?: number|string; }
export function AreaSeries({ series, colors, showLegend=true, className, valueFormatter, height=320 }: AreaSeriesProps) {
  const data = React.useMemo(()=>toRechartsTimeSeries(series),[series]);
  const keys = React.useMemo(()=>series.map(s=>s.key),[series]);
  const palette = colors ?? getColorPalette(keys.length);
  const vfmt = valueFormatter ?? formatNumber;
  return (
    <div className={['rounded-md border bg-white dark:bg-neutral-900 p-2', className||''].join(' ')}>
      <div className="w-full" style={{height: typeof height==='number'?`${height}px`:height}}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="t" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip formatter={(value)=>vfmt(Number(value))} />
            {showLegend && <Legend />}
            {keys.map((k,i)=>(<Area key={k} type="monotone" dataKey={k} stroke={palette[i]} fill={palette[i]} fillOpacity={0.15} />))}
            <Brush dataKey="t" height={24} stroke="var(--color-chart-1, #4f46e5)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}