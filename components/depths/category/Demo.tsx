// components/depths/category/Demo.tsx
'use client';

import * as React from 'react';
import type { CategoryItem, DonutSlice } from '@/components/depths/lib/types'; // Assuming types are in a shared lib, but denormalized per file in practice
import { BarList } from '@/components/depths/category/BarList';
import { GroupedBar } from '@/components/depths/category/GroupedBar';
import { DonutChart } from '@/components/depths/category/DonutChart';

// ---------- deterministic dummy data ----------
const topCategories: CategoryItem[] = [
  { label: 'Search',  value: 128_430, delta:  3.6 },
  { label: 'Checkout',value:  96_210, delta: -1.8 },
  { label: 'Auth',    value:  88_775, delta:  0.9 },
  { label: 'Reports', value:  66_402, delta:  5.1 },
  { label: 'Profile', value:  44_990, delta: -2.4 },
  { label: 'Billing', value:  38_215, delta:  1.1 },
  { label: 'Files',   value:  26_304, delta:  0.2 },
  { label: 'Admin',   value:  19_145, delta: -0.6 },
];

const groupedCategories = ['Auth','Billing','Search','Profile','Reports'];
const groupedSeries = [
  { key: 'Web',     values: [3200, 2100, 5900, 1500, 1800] },
  { key: 'iOS',     values: [1800, 1200, 3300,  900, 1200] },
  { key: 'Android', values: [2200, 1400, 4100, 1100, 1300] },
];

const donutSlices: DonutSlice[] = [
  { label: 'US',    value: 45 },
  { label: 'EU',    value: 28 },
  { label: 'APAC',  value: 17 },
  { label: 'LATAM', value: 6  },
  { label: 'MEA',   value: 4  },
];

// ---------- Demos ----------
export function BarListDemo() {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Interactive sorted category list with proportional bars, deltas, and click handlers.
      </p>
      <BarList
        title="Top Categories"
        description="By traffic volume"
        items={topCategories}
        sort="value"
        topK={8}
        onItemClick={(item) => console.log('Clicked:', item.label)}
      />
    </div>
  );
}

export function GroupedBarDemo() {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Grouped/stacked bars with custom tooltip, interactive legend, grid, and brush selector.
      </p>
      <GroupedBar
        title="Channel Performance"
        description="Across key categories"
        categories={groupedCategories}
        series={groupedSeries}
        height={360}
        brush
        legend
      />
    </div>
  );
}

export function DonutChartDemo() {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Donut with combined small slices, custom tooltip, center total, and slice clicks.
      </p>
      <DonutChart
        title="Regional Share"
        description="Traffic distribution"
        slices={donutSlices}
        asPercent
        combineUnderPct={5}
        legend="bottom"
        centerLabel="Total Share"
        height={320}
        onSliceClick={(slice) => console.log('Clicked:', slice.label)}
      />
    </div>
  );
}

// ---------- Public registry + resolver ----------
export const CATEGORY_DEMOS = {
  'bar-list': BarListDemo,
  'grouped-bar': GroupedBarDemo,
  'donut-chart': DonutChartDemo,
} as const;

export type CategoryId = keyof typeof CATEGORY_DEMOS;

export function renderCategoryDemo(id: string): React.ReactNode {
  const C = (CATEGORY_DEMOS as Record<string, React.ComponentType | undefined>)[id];
  return C ? <C /> : null;
}