'use client';
import * as React from 'react';
import type { BaseChartProps, HistogramData } from '@/components/depths/lib/types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatNumber } from '@/components/depths/lib/chartUtils';

export interface HistogramProps extends BaseChartProps { data: HistogramData; logScale?: boolean; cumulative?: boolean; height?: number|string; }

type HistogramRow = {
  label: string;
  count: number;
  cumulative: number;
  start: number;
  end?: number;
};

export function Histogram({ data, logScale=false, cumulative=false, className, height=320 }: HistogramProps) {
  const rows = React.useMemo(()=>{
    const out: HistogramRow[] = [];
    let cum = 0;
    for(let i=0;i<data.counts.length;i++){
      const start = data.bins[i];
      const end = data.bins[i+1];
      const count = data.counts[i];
      cum += count;
      out.push({ label: `${start}–${end}`, count, cumulative: cum, start, end });
    }
    return out;
  }, [data]);
  const vKey = cumulative ? 'cumulative' : 'count';
  const vfmt = (n:number)=>formatNumber(n);
  return (
    <div className={['rounded-md border bg-white dark:bg-neutral-900 p-2', className||''].join(' ')}>
      <div className="w-full" style={{height: typeof height==='number'?`${height}px`:height}}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows}>
            <CartesianGrid stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} scale={logScale?'log':'auto'} domain={['auto','auto']} allowDataOverflow />
            <Tooltip formatter={(value)=>vfmt(Number(value))} />
            <Bar dataKey={vKey} fill="var(--color-chart-1, #4f46e5)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
