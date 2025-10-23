'use client';
import * as React from 'react';
import type { BaseChartProps } from '@/components/depths/lib/types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { formatPercent } from '@/components/depths/lib/chartUtils';

export interface ErrorBudgetLineProps extends BaseChartProps { points: Array<{ t: number; remaining: number }>; height?: number|string; }
export function ErrorBudgetLine({ points, className, height=320 }: ErrorBudgetLineProps) {
  return (
    <div className={['rounded-md border bg-white dark:bg-neutral-900 p-2', className||''].join(' ')}>
      <div className="w-full" style={{height: typeof height==='number'?`${height}px`:height}}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <CartesianGrid stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="t" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} domain={[0,100]} />
            <Tooltip formatter={(v)=>formatPercent(Number(v))} />
            <ReferenceLine y={0} stroke="rgba(239, 68, 68, 0.6)" />
            <Line type="monotone" dataKey="remaining" stroke="var(--color-chart-1, #4f46e5)" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
