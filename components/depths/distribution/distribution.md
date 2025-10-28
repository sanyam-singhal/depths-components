# Distribution Components Segment Documentation

## Overview of the Distribution Components Segment

The Distribution components segment focuses on visualizing how data is spread or distributed across various dimensions, making it easier to identify patterns, densities, and outliers in datasets. These components are essential for analytics dashboards where understanding data distribution is key—such as frequency counts in bins (e.g., histograms for value ranges), intensity across two categorical axes (e.g., heatmaps for time-based patterns), or geographic spreads (e.g., world maps for country-level metrics).

This segment fits into the overall vision of building composable, type-safe analytics "lego blocks" using React 19, Tailwind v4, and TypeScript 5. These components are designed for a Next.js v15.5 demo app, emphasizing strict type safety and adherence to the latest web docs. Styling aligns with ShadCN's aesthetic (minimalist, token-based, light/dark mode compatible), relying solely on ShadCN UI components and Recharts for charting. No additional dependencies are introduced. They promote composability, where components can be nested or combined (e.g., a Histogram inside a dashboard panel). The focus on perceptual color scales (using OKLCH for accessibility) and interactive features (like hover tooltips and scales) ensures intuitive, theme-aware visualizations that integrate seamlessly into broader product offerings like monitoring tools or BI dashboards.

This documentation is standalone: it includes explanations, props, data types, styling references, and usage examples for each component in this segment.

## Component: Histogram

### What the Component Does
The `Histogram` component renders a frequency histogram chart using Recharts, displaying data binned into ranges with bar heights representing counts. It supports interactive features like tooltips, toggleable log scaling (for handling skewed data), and cumulative views (showing running totals). Bars are styled with perceptual colors for better readability. It's ideal for showing distributions like score frequencies or value ranges in analytics.

### Props
- `title?: string`: Optional chart title displayed in the header.
- `description?: string`: Optional descriptive text below the title.
- `data: HistogramData`: The data object containing bins and counts (required; see data input types below).
- `xLabel?: string`: Label for the X-axis (e.g., "Value").
- `yLabel?: string`: Label for the Y-axis (managed internally but customizable).
- `xTickFormatter?: (v: number | string) => string`: Custom formatter for X-axis ticks.
- `yTickFormatter?: (v: number) => string`: Custom formatter for Y-axis ticks.
- `barRadius?: [number, number, number, number]`: Array for bar corner radii (top-left, top-right, bottom-right, bottom-left).
- `height?: number | string`: Fixed height for the chart (default: 320px).
- `valueFormatter?: (v: number) => string`: Custom formatter for tooltip values (defaults to localized number with 0-2 decimal places).
- `className?: string`: Additional Tailwind classes for the container.
- `isLoading?: boolean`: If true, shows a loading state.
- `error?: Error | null`: Displays an error message if provided.
- `'aria-label'?: string`: ARIA label for accessibility.
- `'aria-describedby'?: string`: ARIA description ID for accessibility.

### Data Input Type Structuring
The primary data input is `HistogramData`, defined as:
```typescript
export type HistogramData = Readonly<{
  /** Bin edges. Length N+1 for N bars. */
  bins: ReadonlyArray<number>;
  /** Counts per bin. Length N (must match bins-1). */
  counts: ReadonlyArray<number>;
}>;
```
- `bins`: An array of numbers defining the start/end of each bin (e.g., [0, 10, 20, ...] for bins 0-10, 10-20, etc.).
- `counts`: An array of numbers matching the bin intervals, representing the frequency in each bin.
This structure ensures type-safe, aligned data; mismatches (e.g., unequal lengths) will cause TypeScript errors.

### Styling Keys Used from globals.css
- `--color-chart-1`: Primary bar fill color (e.g., bright emerald in dark mode).
- `--color-border`: Grid lines, axis lines, and tick lines.
- `--color-foreground`: Text and tick fills.
- `--color-muted-foreground`: Axis labels and muted text.
- `--color-accent`: Hover/focus highlights (mixed for opacity).
- `--color-ring`: Focus rings.
The component uses `color-mix(in oklch, ...)` for perceptual blending (e.g., hover brightens bars). All styles are token-based for theme consistency (light/dark via OKLCH).

### End-to-End Standalone Usage Example
From `Demo.tsx`, here's a complete example with dummy data (normal distribution around 60):

```tsx
'use client';

import * as React from 'react';
import { Histogram, type HistogramData } from '@/components/depths/distribution/Histogram';

// Dummy data: 0–100 in 10-point bins, roughly normal around ~60
const HIST_BINS = Array.from({ length: 11 }, (_, i) => i * 10);
const HIST_COUNTS = (() => {
  const mu = 60, sigma = 18;
  const centers = Array.from({ length: 10 }, (_, i) => i * 10 + 5);
  const raw = centers.map(c => Math.exp(-0.5 * ((c - mu) / sigma) ** 2));
  const scale = 1200 / raw.reduce((a, b) => a + b, 0); // ~1200 total
  return raw.map(x => Math.max(1, Math.round(x * scale)));
})();
const histData: HistogramData = { bins: HIST_BINS, counts: HIST_COUNTS };

export function HistogramExample(): React.JSX.Element {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Frequency histogram (0–100). Toggle log scale or cumulative counts.
      </p>
      <Histogram
        title="Histogram"
        description="Count of values by 10-point bins."
        data={histData}
        height={320}
        xLabel="Value"
      />
    </div>
  );
}
```

## Component: Heatmap

### What the Component Does
The `Heatmap` component creates a 2D heatmap using a grid of colored cells, where color intensity represents values in a matrix (e.g., traffic by day and hour). It supports linear/log scaling, interactive hover tooltips, axis emphasis on hover, and a legend with perceptual color ramps. Cells can be square or fitted, and it's scrollable for large datasets. Useful for correlation or density analysis in dashboards.

### Props
- `title?: string`: Optional chart title.
- `description?: string`: Optional description.
- `data: HeatmapData`: The matrix data (required; see below).
- `domain?: Readonly<{ min?: number; max?: number }>`: Override min/max for scaling.
- `xLabel?: string`: X-axis label (e.g., "Hour of day").
- `yLabel?: string`: Y-axis label (e.g., "Weekday").
- `valueFormatter?: (v: number) => string`: Tooltip/legend value formatter (defaults to localized number).
- `legend?: boolean`: Show the color scale legend (default: false).
- `fitMode?: 'fit' | 'scroll'`: 'fit' resizes cells; 'scroll' enables overflow (default: 'fit').
- `axisEmphasis?: boolean`: Dim non-hovered axes for focus (default: false).
- `gap?: number`: Pixel gap between cells (default: 1).
- `squareCells?: boolean`: Force square cells (default: false).
- `height?: number | string`: Chart height (default: auto).
- `onCellClick?: (row: number, col: number, value: number) => void`: Click handler.
- `onCellFocus?: (row: number, col: number, value: number) => void`: Focus handler.
- `className?: string`: Additional classes.
- `isLoading?: boolean`: Loading state.
- `error?: Error | null`: Error display.
- `'aria-label'?: string`: ARIA label.
- `'aria-describedby'?: string`: ARIA description.

### Data Input Type Structuring
The primary data input is `HeatmapData`, defined as:
```typescript
export type HeatmapData = Readonly<{
  xLabels: ReadonlyArray<string>;
  yLabels: ReadonlyArray<string>;
  z: ReadonlyArray<ReadonlyArray<number>>;
}>;
```
- `xLabels`: Array of strings for X-axis categories (e.g., ['00', '01', ..., '23'] for hours).
- `yLabels`: Array of strings for Y-axis categories (e.g., ['Mon', 'Tue', ...] for days).
- `z`: 2D array of numbers where `z[yIndex][xIndex]` is the value for that cell. Rows must match `yLabels.length`, columns match `xLabels.length`. Type safety ensures dimensional alignment.

### Styling Keys Used from globals.css
- `--color-chart-3` to `--color-chart-1`: Color ramp from low (chart-3, e.g., cyan) to high (chart-1, e.g., emerald) using `color-mix(in oklch, ...)`.
- `--color-border`: Borders, grid lines.
- `--color-foreground`: Text and labels.
- `--color-muted-foreground`: Muted labels.
- `--color-popover`: Tooltip background.
- `--color-ring`: Focus rings.
Perceptual scaling via OKLCH ensures accessibility; legends use linear gradients from tokens.

### End-to-End Standalone Usage Example
From `Demo.tsx`, with dummy 7x24 traffic data:

```tsx
'use client';

import * as React from 'react';
import { Heatmap, type HeatmapData } from '@/components/depths/distribution/Heatmap';

// Dummy data: 7 days × 24 hours with diurnal + weekday effects
const xLabels = Array.from({ length: 24 }, (_, h) => h.toString().padStart(2, '0'));
const yLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const z: number[][] = yLabels.map((d, di) =>
  xLabels.map((_, hi) => {
    const dayShift = di === 5 || di === 6 ? -0.15 : 0; // lower weekend baseline
    const base = 40 + 25 * Math.sin((hi - 8) / 3) + 18 * Math.sin((hi - 18) / 4);
    const jitter = ((di * 7 + hi) % 5) - 2;
    return Math.max(0, Math.round((base * (1 + dayShift)) + jitter));
  })
);
const heatmapData: HeatmapData = { xLabels, yLabels, z };

export function HeatmapExample(): React.JSX.Element {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        7×24 traffic heatmap with a perceptual OKLCH scale.
      </p>
      <Heatmap
        title="Heatmap"
        description="7×24 traffic with a perceptual OKLCH scale and quantitative legend."
        data={heatmapData}
        legend
        xLabel="Hour of day"
        yLabel="Weekday"
        axisEmphasis
        fitMode="fit"
        squareCells
      />
    </div>
  );
}
```

## Component: WorldMap

### What the Component Does
The `WorldMap` component displays a choropleth world map using D3-geo, coloring countries based on provided values (e.g., metrics per ISO-2 code). It includes hover tooltips with country names and values, perceptual color scaling (linear/log), and an optional legend. Flags can appear in tooltips for visual appeal. Perfect for geographic analytics like user distribution or global metrics.

### Props
- `title?: string`: Optional title.
- `description?: string`: Optional description.
- `data: Readonly<Record<string, number>>`: Country values by ISO-2 code (required; see below).
- `domain?: Readonly<{ min?: number; max?: number }>`: Override scaling domain.
- `legend?: boolean`: Show color legend.
- `defaultScale?: 'linear' | 'log'`: Initial scaling mode (default: 'linear').
- `valueFormatter?: (v: number) => string`: Tooltip/legend formatter.
- `height?: number | string`: Map height (default: 500px).
- `onCountryClick?: (code: string, name: string, value: number) => void`: Click handler.
- `onCountryFocus?: (code: string, name: string, value: number) => void`: Focus handler.
- `className?: string`: Additional classes.
- `isLoading?: boolean`: Loading state.
- `error?: Error | null`: Error display.
- `'aria-label'?: string`: ARIA label.
- `'aria-describedby'?: string`: ARIA description.

### Data Input Type Structuring
The primary data input is a `Record<string, number>`, where:
- Keys are ISO-3166-1 alpha-2 country codes (e.g., 'US', 'CN').
- Values are numbers representing the metric (e.g., 1000 for 'US').
This is a simple key-value object; TypeScript ensures string keys and numeric values. Missing countries default to zero or transparent fill.

### Styling Keys Used from globals.css
- `--color-chart-3` to `--color-chart-1`: Color ramp for low-to-high values via `color-mix(in oklch, ...)`.
- `--color-border`: Country borders and legend borders.
- `--color-foreground`: Text and labels.
- `--color-muted-foreground`: Muted text.
- `--color-accent`: Hover fills (mixed for opacity).
- `--color-ring`: Focus rings.
- `--color-popover`: Tooltip background.
Uses OKLCH for perceptual gradients; legends mirror Heatmap's style.

### End-to-End Standalone Usage Example
From `Demo.tsx`, with dummy country data:

```tsx
'use client';

import * as React from 'react';
import { WorldMap } from '@/components/depths/distribution/WorldMap';

// Dummy data: ISO2 -> value
const worldData: Record<string, number> = {
  'US': 1000,
  'CN': 800,
  'IN': 600,
  'BR': 400,
  'RU': 300,
  'GB': 200,
  'FR': 150,
  'DE': 120,
  'JP': 100,
  'AU': 80,
};

export function WorldMapExample(): React.JSX.Element {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        World map choropleth with perceptual color ramp, hover tooltips, and flag icons.
      </p>
      <WorldMap
        title="World Map"
        description="Values by country (dummy data)."
        data={worldData}
        height={500}
      />
    </div>
  );
}
```