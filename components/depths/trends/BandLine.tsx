'use client';
import * as React from 'react';
import type { BaseChartProps, BandSeries } from '@/components/depths/lib/types';
import { toBandComposed, getColorPalette, formatNumber } from '@/components/depths/lib/chartUtils';
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
export interface BandLineProps extends BaseChartProps { series: BandSeries[]; mode?: 'minmax'|'p50p95'|'p95p99'; showMean?: boolean; colors?: string[]; height?: number|string; }
export function BandLine({ series, mode='p50p95', showMean=true, colors, className, height=320 }: BandLineProps) {
  const data = React.useMemo(()=>toBandComposed(series, mode),[series, mode]);
  const palette = colors ?? getColorPalette(1);
  const vfmt = formatNumber;
  return (
    <div className={['rounded-md border bg-white dark:bg-neutral-900 p-2', className||''].join(' ')}>
      <div className="w-full" style={{height: typeof height==='number'?`${height}px`:height}}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="t" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip formatter={(value)=>vfmt(Number(value))} />
            <Legend />
            <Area type="monotone" dataKey="lower" stroke="transparent" fill="transparent" stackId="band" />
            <Area type="monotone" dataKey="band" stroke="transparent" fill={palette[0]} fillOpacity={0.2} stackId="band" />
            {showMean && <Line type="monotone" dataKey="mean" stroke={palette[0]} dot={false} strokeWidth={2} />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}