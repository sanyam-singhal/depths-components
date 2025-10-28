# Category Components Documentation

## Overview
The Category Components segment is dedicated to visualizing categorical data, such as breakdowns by groups, proportions, and comparisons, to help users understand distributions and rankings in analytics dashboards. These components are essential for scenarios like displaying top categories by traffic, channel performance across metrics, or regional shares in pie/donut form. They align with the overall vision by extending the composable "Lego blocks" approach in React 19 + Tailwind v4 + TypeScript 5, demoed in Next.js v15.5, to handle non-time-series data with strict type safety and accessibility. Building on foundational stats and trends visualizations, they enable deeper insights into segmented data, using Recharts for charting where needed and ShadCN for UI consistency. Dependencies remain minimal (ShadCN primitives and Recharts), with emphasis on responsive design via container queries, interactive features (e.g., clicks, legends), and adherence to latest web standards for scalable, customizable dashboards in a broader product offering.

## Component: BarList
### Description and Props
The `BarList` component renders a sorted list of categories with proportional bars, values, and optional deltas (changes), ideal for ranking items like top pages by views. It supports sorting, top-K limiting, formatting, and click handlers for interactivity, making it suitable for compact, glanceable category overviews.

Props (from `BarListProps` interface, extending `BaseChartProps`):
- `title`: Optional string for header.
- `description`: Optional subtext.
- `items`: Required array of `CategoryItem` for data.
- `sort`: Optional `'value' | 'delta' | 'label'` (default: 'value').
- `topK`: Optional number to limit items (default: 20).
- `valueFormatter`: Optional function for values (defaults to localized number).
- `deltaFormatter`: Optional function for deltas (defaults to percent with sign).
- `onItemClick`: Optional callback for item clicks.
- `className`: Optional Tailwind classes.
- `isLoading`: Optional for skeleton.
- `error`: Optional for error display.
- `aria-label`: Optional ARIA label.
- `aria-describedby`: Optional ARIA description.

### Data Input Types
- `CategoryItem`: `{ label: string; value: number; delta?: number; }` – Label is category name, value is metric, delta is optional change.

### Styling Keys from globals.css
- `--color-chart-1` to `--color-chart-5`: Bar backgrounds (cycled by index, mixed with transparency).
- `--color-muted`: Bar container background.
- `--color-accent`, `--color-destructive`, `--color-muted-foreground`: Delta colors (positive: accent, negative: destructive, neutral: muted).
- `--color-border`: Borders.
- `--color-ring`: Focus rings.
- Container queries (`@container`, `@md`) for responsive widths.
- Transitions for bar animations and hovers.

### Standalone Usage Example
```tsx
import { BarList } from '@/components/depths/category/BarList';

const dummyItems = [
  { label: 'Search', value: 128430, delta: 3.6 },
  { label: 'Checkout', value: 96210, delta: -1.8 },
  { label: 'Auth', value: 88775, delta: 0.9 },
  { label: 'Reports', value: 66402, delta: 5.1 },
  { label: 'Profile', value: 44990, delta: -2.4 },
  { label: 'Billing', value: 38215, delta: 1.1 },
  { label: 'Files', value: 26304, delta: 0.2 },
  { label: 'Admin', value: 19145, delta: -0.6 },
];

function BarListExample() {
  return (
    <BarList
      title="Top Categories"
      description="By traffic volume"
      items={dummyItems}
      sort="value"
      topK={8}
      onItemClick={(item) => console.log('Clicked:', item.label)}
    />
  );
}
```
This renders a sorted list with bars proportional to values, color-coded deltas, and click logging.

## Component: GroupedBar
### Description and Props
The `GroupedBar` component displays grouped or stacked bar charts for comparing multiple series across categories, such as performance by channel per metric. It includes interactive legends for toggling, tooltips, grid, brushing, and percent mode for normalized views.

Props (from `GroupedBarProps` interface, extending `BaseChartProps`):
- `title`: Optional header.
- `description`: Optional subtext.
- `categories`: Required array of category labels (x-axis).
- `series`: Required array of `GroupedBarSeries` for data.
- `stacked`: Optional boolean for stacking (default: false).
- `asPercent`: Optional boolean for 100% stacking (default: false).
- `legend`: Optional boolean for legend (default: false).
- `brush`: Optional boolean for range selector (default: false).
- `xLabel`: Optional x-axis label.
- `yLabel`: Optional y-axis label.
- `yTickFormatter`: Optional y-tick formatter.
- `valueFormatter`: Optional tooltip formatter (defaults to localized number).
- `height`: Optional height.
- `className`, `isLoading`, `error`, `aria-label`, `aria-describedby`: As above.

### Data Input Types
- `GroupedBarSeries`: `{ key: string; values: number[]; }` – Key is series name, values array matches categories length.

### Styling Keys from globals.css
- `--color-chart-1` to `--color-chart-5`: Bar fills (cycled).
- `--color-border`: Grid, cursor (with opacity).
- `--color-muted-foreground`: Axis labels.
- `--color-accent`: Brush fill.
- `--color-card`: Container.
- Opacity for dimming on legend hover.
- Container queries (`@container`) for responsiveness.

### Standalone Usage Example
```tsx
import { GroupedBar } from '@/components/depths/category/GroupedBar';

const dummyCategories = ['Auth', 'Billing', 'Search', 'Profile', 'Reports'];
const dummySeries = [
  { key: 'Web', values: [3200, 2100, 5900, 1500, 1800] },
  { key: 'iOS', values: [1800, 1200, 3300, 900, 1200] },
  { key: 'Android', values: [2200, 1400, 4100, 1100, 1300] },
];

function GroupedBarExample() {
  return (
    <GroupedBar
      title="Channel Performance"
      description="Across key categories"
      categories={dummyCategories}
      series={dummySeries}
      stacked={false}
      asPercent={false}
      legend={true}
      brush={true}
      xLabel="Categories"
      yLabel="Values"
      height={360}
    />
  );
}
```
This shows grouped bars for channels per category, with legend and brush.

## Component: DonutChart
### Description and Props
The `DonutChart` component renders a donut (ring) chart for proportional data, with options to combine small slices, display as percent, add legends, center labels, and handle slice clicks. It's perfect for showing distributions like regional traffic shares.

Props (from `DonutChartProps` interface, extending `BaseChartProps`):
- `title`: Optional header.
- `description`: Optional subtext.
- `slices`: Required array of `DonutSlice`.
- `asPercent`: Optional boolean for percent view (default: false).
- `combineUnderPct`: Optional number to group small slices (e.g., 5 for <5%).
- `legend`: Optional `'bottom' | 'right' | 'none'` (default: 'none').
- `innerRadius`: Optional inner radius (default: auto).
- `outerRadius`: Optional outer radius (default: auto).
- `centerLabel`: Optional center text.
- `valueFormatter`: Optional slice formatter.
- `onSliceClick`: Optional click callback.
- `height`: Optional height.
- `className`, `isLoading`, `error`, `aria-label`, `aria-describedby`: As above.

### Data Input Types
- `DonutSlice`: `{ label: string; value: number; }` – Label is slice name, value is proportion.

### Styling Keys from globals.css
- `--color-chart-1` to `--color-chart-5`: Slice fills (cycled).
- `--color-popover`: Tooltip background.
- `--color-muted-foreground`: Legend text, center subtext.
- `--color-border`: Borders.
- Transitions for hover opacity.
- Container queries (`@container`) for layout.

### Standalone Usage Example
```tsx
import { DonutChart } from '@/components/depths/category/DonutChart';

const dummySlices = [
  { label: 'US', value: 450 },
  { label: 'EU', value: 280 },
  { label: 'APAC', value: 170 },
  { label: 'LATAM', value: 60 },
  { label: 'MEA', value: 40 },
];

function DonutChartExample() {
  return (
    <DonutChart
      title="Regional Share"
      description="Traffic distribution"
      slices={dummySlices}
      asPercent={true}
      combineUnderPct={5}
      legend="bottom"
      centerLabel="Total Share"
      height={320}
      onSliceClick={(slice) => console.log('Clicked:', slice.label)}
    />
  );
}
```
This renders a donut with combined small slices, percent tooltips, bottom legend, and click logging.