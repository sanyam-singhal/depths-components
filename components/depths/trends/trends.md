# Trends Components Documentation

## Overview
The Trends Components segment focuses on visualizing time-series data, correlations, and flows to reveal patterns, fluctuations, and relationships over time or across dimensions in analytics dashboards. These components build upon the foundational ones by introducing more advanced charting capabilities using Recharts, enabling users to track metrics like revenue trends, error rates, or resource flows. They fit into the overall vision by providing composable, type-safe visualizations that integrate seamlessly with ShadCN styling for a consistent UI. As "Lego blocks," they can be combined (e.g., a line series overlay on a band line) to create dynamic, interactive dashboards in React 19 + Tailwind v4 + TypeScript 5, demoed in Next.js v15.5. Emphasis is on accessibility (ARIA props, screen-reader captions), responsiveness (container queries), and minimal dependencies—only ShadCN for UI primitives and Recharts for charting. This segment supports trend analysis in broader product offerings, like monitoring systems or business intelligence tools, ensuring strict type safety and adherence to latest web standards.

## Component: AreaSeries
### Description and Props
The `AreaSeries` component renders stacked or overlaid area charts for multiple time-series datasets, ideal for showing cumulative trends like sales over time. It supports stacking modes (none, stacked, percent), interactive legends for toggling series, tooltips, and a brush for zooming. This helps in visualizing volume-based trends in dashboards.

Props (from `AreaSeriesProps` interface, extending `BaseChartProps`):
- `title`: Optional string for card header.
- `description`: Optional subtext.
- `series`: Required array of `TimeSeries` for data.
- `stack`: Optional `StackMode` ('none' | 'stacked' | 'percent'; default: 'none').
- `legend`: Optional `LegendPlacement` ('header' | 'chart' | 'none'; default: 'header').
- `brush`: Optional boolean for range selector (default: true).
- `xLabel`: Optional x-axis label.
- `yLabel`: Optional y-axis label.
- `xTickFormatter`: Optional function for x-tick labels.
- `yTickFormatter`: Optional function for y-tick labels.
- `valueFormatter`: Optional function for tooltip values (defaults to localized number).
- `height`: Optional height (default: auto).
- `className`: Optional Tailwind classes.
- `isLoading`: Optional for skeleton.
- `error`: Optional for error display.
- `aria-label`: Optional ARIA label.
- `aria-describedby`: Optional ARIA description.

### Data Input Types
- `TimeSeries`: `{ key: string; points: TimeSeriesPoint[]; }` where `TimeSeriesPoint` is `{ t: number; v: number; }` – `key` is series name, `t` is time/index, `v` is value.

### Styling Keys from globals.css
- `--color-chart-1` to `--color-chart-5`: Series fill/stroke colors (cycled for multi-series).
- `--color-border`: Grid lines, cursor, axis.
- `--color-muted-foreground`: Labels, ticks.
- `--color-accent`: Brush fill opacity.
- `--color-card`, `--color-shadow-sm`: Card container.
- Container queries (`@container`) for responsive layout.
- Opacity transitions for hover dimming.

### Standalone Usage Example
```tsx
import { AreaSeries } from '@/components/depths/trends/AreaSeries';

const dummySeries = [
  { key: 'orders', points: Array.from({ length: 64 }, (_, i) => ({ t: i, v: Math.max(0, 120 + 40 * Math.sin(i / 4) + i * 0.6) })) },
  { key: 'revenue', points: Array.from({ length: 64 }, (_, i) => ({ t: i, v: Math.max(0, 300 + 70 * Math.cos(i / 5) + i * 1.2) })) },
  { key: 'refunds', points: Array.from({ length: 64 }, (_, i) => ({ t: i, v: Math.max(0, 15 + 8 * Math.sin(i / 3 + 2)) })) },
];

function AreaSeriesExample() {
  return (
    <AreaSeries
      title="Sales Trends"
      description="Stacked areas for cumulative metrics."
      series={dummySeries}
      stack="stacked"
      legend="header"
      brush={true}
      xLabel="Time"
      yLabel="Value"
      height={320}
    />
  );
}
```
This renders a stacked area chart with interactive legend and brush.

## Component: LineSeries
### Description and Props
The `LineSeries` component displays multiple line charts for time-series data, suitable for tracking metrics like uptime or error rates. It includes options for percent mode, line interpolation, hover dots, tooltips, and brushing, making it versatile for trend monitoring.

Props (from `LineSeriesProps` interface, extending `BaseChartProps`):
- `title`: Optional header.
- `description`: Optional subtext.
- `series`: Required array of `TimeSeries`.
- `legend`: Optional `LegendPlacement` (default: 'header').
- `brush`: Optional boolean (default: true).
- `xLabel`: Optional x-label.
- `yLabel`: Optional y-label.
- `xTickFormatter`: Optional x-tick formatter.
- `yTickFormatter`: Optional y-tick formatter.
- `valueFormatter`: Optional tooltip formatter.
- `height`: Optional height.
- `yAxisMode`: Optional `YAxisMode` ('absolute' | 'percent'; default: 'absolute').
- `lineType`: Optional `LineType` ('linear' | 'monotone'; default: 'monotone').
- `hoverDots`: Optional boolean for dots on hover (default: true).
- `className`, `isLoading`, `error`, `aria-label`, `aria-describedby`: As above.

### Data Input Types
- `TimeSeries`: Same as AreaSeries – `{ key: string; points: TimeSeriesPoint[]; }` with `TimeSeriesPoint` as `{ t: number; v: number; }`.

### Styling Keys from globals.css
- `--color-chart-1` to `--color-chart-5`: Line strokes.
- `--color-border`: Grid, cursor.
- `--color-muted-foreground`: Axis labels.
- `--color-card`: Container background.
- Opacity for dimming on legend interaction.
- Container queries for responsiveness.

### Standalone Usage Example
```tsx
import { LineSeries } from '@/components/depths/trends/LineSeries';

const dummySeries = [
  { key: 'uptime', points: Array.from({ length: 72 }, (_, i) => ({ t: i, v: 98 + 1.2 * Math.sin(i / 6) })) },
  { key: 'errorRate', points: Array.from({ length: 72 }, (_, i) => ({ t: i, v: 1 + 0.7 * Math.abs(Math.sin(i / 5 + 1)) })) },
];

function LineSeriesExample() {
  return (
    <LineSeries
      title="System Metrics"
      description="Line trends in percent mode."
      series={dummySeries}
      yAxisMode="percent"
      legend="header"
      brush={true}
      xLabel="Time"
      yLabel="%"
      height={320}
      hoverDots={true}
    />
  );
}
```
This shows lines for uptime and error rate in percent, with hover dots.

## Component: BandLine
### Description and Props
The `BandLine` component visualizes a single band series (e.g., confidence intervals) with an optional mean line, useful for showing variability in metrics like latency. It supports different band modes (min-max, p50-p95, p95-p99), tooltips, and brushing.

Props (from `BandLineProps` interface, extending `BaseChartProps`):
- `title`: Optional header.
- `description`: Optional subtext.
- `series`: Required array of `BandSeries` (typically one).
- `mode`: Optional `BandMode` ('minmax' | 'p50p95' | 'p95p99'; default: 'minmax').
- `showMean`: Optional boolean to display mean line (default: false).
- `xLabel`, `yLabel`, `xTickFormatter`, `yTickFormatter`, `valueFormatter`, `height`, `brush`, `lineType`: As in LineSeries.
- `className`, `isLoading`, `error`, `aria-label`, `aria-describedby`: As above.

### Data Input Types
- `BandSeries`: `{ key: string; points: BandPoint[]; }` where `BandPoint` is `{ t: number; mean?: number; min?: number; max?: number; p50?: number; p95?: number; p99?: number; }` – Flexible for different percentiles.

### Styling Keys from globals.css
- `--color-chart-1`: Band fill and mean line.
- `--color-border`: Grid, axis.
- `--color-muted-foreground`: Labels.
- Fill opacity (0.24) for band transparency.
- Container queries for layout.

### Standalone Usage Example
```tsx
import { BandLine } from '@/components/depths/trends/BandLine';

const dummyBand = {
  key: 'latency',
  points: Array.from({ length: 72 }, (_, i) => {
    const base = 120 + 40 * Math.sin(i / 6) + (i % 17);
    return { t: i, p50: base, p95: base + 70 + 15 * Math.cos(i / 8), mean: base + 30 };
  }),
};

function BandLineExample() {
  return (
    <BandLine
      title="Latency Band"
      description="p50-p95 band with mean."
      series={[dummyBand]}
      mode="p50p95"
      showMean={true}
      brush={true}
      xLabel="Time"
      yLabel="ms"
      height={320}
    />
  );
}
```
This renders a band for latency variability with a mean line.

## Component: ScatterPlot
### Description and Props
The `ScatterPlot` component creates scatter plots for correlating two variables across series, great for spotting patterns like outliers. It features legends, tooltips, brushing, and customizable dot sizes.

Props (from `ScatterPlotProps` interface, extending `BaseChartProps`):
- `title`: Optional header.
- `description`: Optional subtext.
- `series`: Required array of `ScatterSeries`.
- `legend`: Optional `LegendPlacement` (default: 'header').
- `brush`: Optional boolean (default: true).
- `xLabel`, `yLabel`, `xTickFormatter`, `yTickFormatter`, `valueFormatter`, `height`: As above.
- `dotSize`: Optional number for dot radius (default: 4).
- `className`, `isLoading`, `error`, `aria-label`, `aria-describedby`: As above.

### Data Input Types
- `ScatterSeries`: `{ key: string; points: ScatterPoint[]; }` where `ScatterPoint` is `{ x: number; y: number; }`.

### Styling Keys from globals.css
- `--color-chart-1` to `--color-chart-5`: Dot fills.
- `--color-border`: Grid, cursor.
- `--color-muted-foreground`: Axis.
- Opacity for series dimming.
- Container queries.

### Standalone Usage Example
```tsx
import { ScatterPlot } from '@/components/depths/trends/ScatterPlot';

const dummyScatter = [
  { key: 'Group A', points: Array.from({ length: 32 }, () => ({ x: Math.random() * 100, y: Math.random() * 100 })) },
  { key: 'Group B', points: Array.from({ length: 32 }, () => ({ x: Math.random() * 100, y: Math.random() * 100 + 20 })) },
];

function ScatterPlotExample() {
  return (
    <ScatterPlot
      title="Correlation Scatter"
      description="Points across groups."
      series={dummyScatter}
      legend="header"
      brush={true}
      xLabel="X Var"
      yLabel="Y Var"
      height={320}
      dotSize={5}
    />
  );
}
```
This plots scattered points for two groups.

## Component: SankeyDiagram
### Description and Props
The `SankeyDiagram` component visualizes flows between nodes (e.g., resource allocation), with proportional link widths, custom node rendering, and tooltips. It's useful for hierarchical or process flows in analytics.

Props (from `SankeyDiagramProps` interface, extending `BaseChartProps`):
- `title`: Optional header.
- `description`: Optional subtext.
- `data`: Required `SankeyData`.
- `height`: Optional height.
- `nodeWidth`: Optional node width (default: 24).
- `nodePadding`: Optional padding (default: 18).
- `startMargin`: Optional left margin.
- `endMargin`: Optional right margin.
- `className`, `isLoading`, `error`, `aria-label`, `aria-describedby`: As above.

### Data Input Types
- `SankeyData`: `{ nodes: SankeyNode[]; links: SankeyLink[]; }` where `SankeyNode` is `{ name: string; }`, `SankeyLink` is `{ source: number; target: number; value: number; }` – Indices refer to nodes array.

### Styling Keys from globals.css
- `--color-chart-1` to `--color-chart-5`: Node fills (cycled by depth).
- `--color-border`: Link strokes, node borders.
- `--color-muted-foreground`: Labels.
- `--color-card`: Container.
- Container queries; overflow-x for wide diagrams.

### Standalone Usage Example
```tsx
import { SankeyDiagram } from '@/components/depths/trends/SankeyDiagram';

const dummySankey = {
  nodes: [
    { name: 'Source A' }, { name: 'Source B' },
    { name: 'Intermediate X' }, { name: 'Intermediate Y' },
    { name: 'Sink P' }, { name: 'Sink Q' }, { name: 'Sink R' },
  ],
  links: [
    { source: 0, target: 2, value: 30 }, { source: 0, target: 3, value: 20 },
    { source: 1, target: 2, value: 25 }, { source: 1, target: 3, value: 15 },
    { source: 2, target: 4, value: 40 }, { source: 2, target: 5, value: 10 },
    { source: 3, target: 5, value: 20 }, { source: 3, target: 6, value: 15 },
  ],
};

function SankeyDiagramExample() {
  return (
    <SankeyDiagram
      title="Flow Diagram"
      description="Resource flows."
      data={dummySankey}
      height={320}
      nodeWidth={20}
      nodePadding={50}
    />
  );
}
```
This shows a Sankey with flows from sources to sinks.