'use client';
import * as React from 'react';
import type { BaseChartProps } from '@/components/depths/lib/types';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { formatNumber, formatPercent } from '@/components/depths/lib/chartUtils';

export interface GaugeProps extends BaseChartProps { 
  target: number; 
  current: number; 
  unit?: string;
  mode?: 'needle'|'arc'; 
  height?: number|string; 
  min?: number; 
  max?: number; 
  caption?: string;
  showTarget?: boolean;
}
export function Gauge({ target, current, unit='%', className, caption, height=240, max=100, showTarget=true }: GaugeProps) {
  const pct = React.useMemo(()=>{
    const denom = target>0 ? target : max;
    return Math.max(0, Math.min(100, (current/denom)*100));
  }, [current, target, max]);
  const data = React.useMemo(()=>[{ name: 'value', value: pct }], [pct]);
  const centerLabel = unit==='%' ? formatPercent(pct) : `${formatNumber(current)} ${unit||''}`;
  const autoCaption = unit==='%' ? `Target: ${formatNumber(target)}%` : `Target: ${formatNumber(target)} ${unit||''}`;
  const finalCaption = caption ?? (showTarget ? autoCaption : undefined);
  return (
    <figure className={['w-full rounded-md border bg-white dark:bg-neutral-900 p-2', className || ''].join(' ')}>
      <div className="relative w-full" style={{height: typeof height==='number'?`${height}px`:height}}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="80%" outerRadius="100%" data={data} startAngle={180} endAngle={0}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" background={{ fill: 'rgba(0,0,0,0.08)' }} cornerRadius={8} fill="var(--color-chart-1, #4f46e5)" />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-xl font-semibold">{centerLabel}</div>
        </div>
      </div>
      {finalCaption && (
        <figcaption className="mt-2 text-xs text-neutral-500 text-center">
          {finalCaption}
        </figcaption>
      )}
    </figure>
  );
}
