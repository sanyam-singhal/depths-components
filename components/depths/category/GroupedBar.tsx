'use client';
import * as React from 'react';
import type { BaseChartProps } from '@/components/depths/lib/types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { getColorPalette, formatNumber } from '@/components/depths/lib/chartUtils';

export interface GroupedBarProps extends BaseChartProps { categories: string[]; series: Array<{ key: string; values: number[] }>; stacked?: boolean; asPercent?: boolean; height?: number|string; }

type DataRow = { label: string } & { [key: string]: number | string };

export function GroupedBar({ categories, series, stacked=false, asPercent=false, className, height=360 }: GroupedBarProps) {
  const raw = React.useMemo(()=>{
    const rows: DataRow[] = categories.map((c, i)=>{
      const row: DataRow = { label: c };
      for(const s of series) row[s.key] = s.values[i] ?? 0;
      return row;
    });
    return rows;
  }, [categories, series]);

  const data = React.useMemo(()=>{
    if(!asPercent) return raw;
    return raw.map(r=>{
      const total = series.reduce((sum,s)=>sum + (Number(r[s.key])||0), 0);
      const out: DataRow = { label: String(r.label) };
      for(const s of series) out[s.key] = total>0 ? (Number(r[s.key])/total)*100 : 0;
      return out;
    });
  }, [raw, series, asPercent]);

  const keys = React.useMemo(()=>series.map(s=>s.key), [series]);
  const colors = getColorPalette(keys.length);
  const vfmt = asPercent ? (v:number)=>`${v.toFixed(1)}%` : formatNumber;
  return (
    <div className={['rounded-md border bg-white dark:bg-neutral-900 p-2', className||''].join(' ')}>
      <div className="w-full" style={{height: typeof height==='number'?`${height}px`:height}}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip formatter={(value)=>vfmt(Number(value))} />
            <Legend />
            {keys.map((k,i)=>(
              <Bar key={k} dataKey={k} fill={colors[i]} stackId={stacked?'stack':undefined} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
