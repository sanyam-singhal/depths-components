'use client';
import * as React from 'react';
import type { BaseChartProps, DonutSlice } from '@/components/depths/lib/types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { getColorPalette, formatNumber, formatPercent } from '@/components/depths/lib/chartUtils';

export interface DonutChartProps extends BaseChartProps { slices: DonutSlice[]; asPercent?: boolean; combineUnderPct?: number; height?: number|string; innerRadius?: number|string; outerRadius?: number|string; centerLabel?: string; }
export function DonutChart({ slices, asPercent=false, combineUnderPct=0, className, height=320, innerRadius='60%', outerRadius='80%', centerLabel }: DonutChartProps) {
  const total = React.useMemo(()=>slices.reduce((s,x)=>s+x.value,0), [slices]);
  const merged = React.useMemo(()=>{
    if(!asPercent || combineUnderPct<=0 || total<=0) return slices;
    const pct = (v:number)=> (v/total)*100;
    const majors = slices.filter(s=>pct(s.value)>=combineUnderPct);
    const minors = slices.filter(s=>pct(s.value)<combineUnderPct);
    if(minors.length===0) return slices;
    const otherVal = minors.reduce((s,x)=>s+x.value,0);
    return [...majors, { label: 'Other', value: otherVal }];
  }, [slices, asPercent, combineUnderPct, total]);
  const colors = getColorPalette(merged.length);
  const vfmt = asPercent ? (v:number)=>formatPercent((v/Math.max(total,1))*100) : formatNumber;
  const midText = centerLabel ?? (asPercent ? formatPercent(100) : formatNumber(total));
  return (
    <div className={['rounded-md border bg-white dark:bg-neutral-900 p-2', className||''].join(' ')}>
      <div className="relative w-full" style={{height: typeof height==='number'?`${height}px`:height}}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={merged} dataKey="value" nameKey="label" innerRadius={innerRadius} outerRadius={outerRadius}>
              {merged.map((_,i)=>(<Cell key={String(i)} fill={colors[i]} />))}
            </Pie>
            <Tooltip formatter={(v)=>vfmt(Number(v))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-sm font-medium">{midText}</div>
        </div>
      </div>
    </div>
  );
}
