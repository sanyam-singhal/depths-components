'use client';
import * as React from 'react';
import type { BaseChartProps, HeatmapData } from '@/components/depths/lib/types';

export interface HeatmapProps extends BaseChartProps { data: HeatmapData; colorScale?: 'linear'|'log'; height?: number|string; }
export function Heatmap({ data, colorScale='linear', className, height=360 }: HeatmapProps) {
  const flat = React.useMemo(()=>{
    const vals:number[]=[];
    for(let r=0;r<data.z.length;r++){ for(let c=0;c<data.z[r].length;c++){ vals.push(data.z[r][c]); } }
    return vals;
  }, [data]);
  const min = React.useMemo(()=>Math.min(...flat), [flat]);
  const max = React.useMemo(()=>Math.max(...flat), [flat]);
  function colorFor(v: number){
    const n = max>min ? (v-min)/(max-min) : 0;
    const t = colorScale==='log' ? Math.log1p(n*9)/Math.log(10) : n;
    const hue = 260 - t*220;
    return `oklch(${0.80 - t*0.35} ${0.18} ${hue})`;
  }
  return (
    <div className={['rounded-md border bg-white dark:bg-neutral-900 p-2', className||''].join(' ')}>
      <div className="w-full" style={{height: typeof height==='number'?`${height}px`:height}}>
        <div className="flex">
          <div className="flex flex-col mr-2 text-xs text-neutral-500">{data.yLabels.map((y,i)=>(<div key={y+String(i)} className="h-6 flex items-center justify-end pr-1">{y}</div>))}</div>
          <div className="overflow-auto">
            <div className="grid" style={{gridTemplateColumns: `repeat(${data.xLabels.length}, minmax(1.5rem, 1fr))`}}>
              {data.yLabels.map((y, r)=>(
                Array.from({length: data.xLabels.length}).map((_, c)=>{
                  const v = data.z[r]?.[c] ?? 0;
                  return <div key={`${r}-${c}`} className="w-6 h-6 @md:w-7 @md:h-7 @xl:w-8 @xl:h-8" style={{ background: colorFor(v) }} title={`${y} • ${data.xLabels[c]} • ${v}`} />;
                })
              ))}
            </div>
            <div className="grid mt-1 text-[10px] text-neutral-500" style={{gridTemplateColumns: `repeat(${data.xLabels.length}, minmax(1.5rem, 1fr))`}}>
              {data.xLabels.map((x,i)=>(<div key={x+String(i)} className="text-center truncate">{x}</div>))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
