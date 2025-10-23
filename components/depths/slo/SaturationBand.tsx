'use client';
import * as React from 'react';
import type { BaseChartProps, BandSeries } from '@/components/depths/lib/types';
import { toBandComposed, getColorPalette, formatNumber } from '@/components/depths/lib/chartUtils';
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend } from 'recharts';

export interface SaturationBandProps extends BaseChartProps { series: BandSeries[]; resource: 'cpu'|'mem'|'qps'; thresholds?: Array<{ label: string; value: number }>; height?: number|string; mode?: 'minmax'|'p50p95'|'p95p99'; }
export function SaturationBand({ series, thresholds=[], className, height=320, mode='minmax' }: SaturationBandProps) {
  const data = React.useMemo(()=>toBandComposed(series, mode),[series, mode]);
  const color = getColorPalette(1)[0];
  const vfmt = formatNumber;
  return (
    <div className={['rounded-md border bg-white dark:bg-neutral-900 p-2', className||''].join(' ')}>
      <div className="w-full" style={{height: typeof height==='number'?`${height}px`:height}}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="t" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip formatter={(v)=>vfmt(Number(v))} />
            <Legend />
            <Area type="monotone" dataKey="lower" stroke="transparent" fill="transparent" stackId="band" />
            <Area type="monotone" dataKey="band" stroke="transparent" fill={color} fillOpacity={0.2} stackId="band" />
            <Line type="monotone" dataKey="mean" stroke={color} dot={false} strokeWidth={2} />
            {thresholds.map((t,i)=>(<ReferenceLine key={t.label+String(i)} y={t.value} stroke="rgba(0,0,0,0.2)" label={t.label} />))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
