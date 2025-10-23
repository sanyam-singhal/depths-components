'use client';
import * as React from 'react';
import type { BaseChartProps, TimeSeries } from '@/components/depths/lib/types';
import { toRechartsTimeSeries, getColorPalette, formatNumber } from '@/components/depths/lib/chartUtils';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Brush } from 'recharts';
export interface LineSeriesProps extends BaseChartProps { series: TimeSeries[]; colors?: string[]; showLegend?: boolean; valueFormatter?: (v:number)=>string; height?: number|string; yAxisMode?: 'absolute'|'percent'; }
export function LineSeries({ series, colors, showLegend=true, className, valueFormatter, height=320, yAxisMode='absolute' }: LineSeriesProps) {
  const data = React.useMemo(()=>toRechartsTimeSeries(series),[series]);
  const keys = React.useMemo(()=>series.map(s=>s.key),[series]);
  const palette = colors ?? getColorPalette(keys.length);
  const vfmt = valueFormatter ?? (yAxisMode==='percent'? (v:number)=>`${v.toFixed(1)}%` : formatNumber);
  return (
    <div className={['rounded-md border bg-white dark:bg-neutral-900 p-2', className||''].join(' ')}>
      <div className="w-full" style={{height: typeof height==='number'?`${height}px`:height}}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="t" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip formatter={(value)=>vfmt(Number(value))} />
            {showLegend && <Legend />}
            {keys.map((k,i)=>(<Line key={k} type="monotone" dataKey={k} stroke={palette[i]} dot={false} strokeWidth={2} />))}
            <Brush dataKey="t" height={24} stroke="var(--color-chart-1, #4f46e5)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}