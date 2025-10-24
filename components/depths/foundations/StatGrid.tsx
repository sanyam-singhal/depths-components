// components/depths/foundations/StatGrid.tsx
'use client';

import * as React from 'react';
import { KPIStat } from '@/components/depths/foundations/KPIStat';

export interface BaseChartProps {
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export interface KPI { label: string; value: number; unit?: string; delta?: number; }

export interface StatGridProps extends BaseChartProps {
  readonly items: ReadonlyArray<Readonly<KPI>>;
  readonly title: string;
}

export function StatGrid(props: StatGridProps): React.JSX.Element {
  const { title,items, className, isLoading, error, ...a11y } = props;

  if (error) {
    return (
      <div
        {...a11y}
        role="alert"
        className={[
          'rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive',
          className ?? '',
        ].join(' ')}
      >
        {(error as Error).message ?? 'Something went wrong.'}
      </div>
    );
  }

  // Render lightweight placeholders while loading, sized like cards.
  const renderSkeletons = (count: number) => (
    <div
      className={[
        'rounded-lg border border-border bg-card p-3 @md:p-4 shadow-sm grid gap-3 @md:gap-4',
        // auto-fit: min 16rem columns, fill the available row width
        'grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]',
        className ?? '',
      ].join(' ')}
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card p-4 shadow-sm"
          aria-hidden="true"
        >
          <div className="space-y-3">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-8 w-40 rounded bg-muted animate-pulse" />
            <div className="h-3 w-20 rounded bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    // Show at least 4 placeholders or match incoming item count if larger.
    return renderSkeletons(Math.max(4, items.length || 0));
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3 @md:p-4 shadow-sm items-center justify-between gap-2">
        {title && <div className="text-lg font-semibold pb-4 text-foreground">{title}</div>}
    <div
      {...a11y}
      className={[
        'grid gap-3 @md:gap-4',
        // Tailwind v4 arbitrary value for grid-template-columns
        // https://tailwindcss.com/docs/grid-template-columns
        'grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]',
        className ?? '',
      ].join(' ')}
    >
      {items.map((kpi, idx) => (
        <KPIStat key={`${kpi.label}-${idx}`} kpi={kpi} />
      ))}
    </div>
    </div>
  );
}
