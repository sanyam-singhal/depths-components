# Foundational Components Documentation

## Overview
The Foundational Components segment forms the core building blocks for creating interactive and data-driven analytics dashboards in our React 19 + Tailwind v4 + TypeScript 5 application, demoed within a Next.js v15.5 environment. These components are designed to be simple, composable "Lego blocks" that handle essential UI patterns like displaying key performance indicators (KPIs), grouping stats, tabular data presentation, user controls for filtering/querying, and visual gauges for progress or metrics.

They fit into the overall vision by providing reusable, strictly typed, and accessible primitives that can be composed into more complex dashboards. For instance, KPI stats can highlight top-line metrics, grids can aggregate them, tables handle detailed breakdowns, control bars enable dynamic user interactions, and gauges offer visual emphasis on thresholds. All components adhere to ShadCN's styling conventions for consistency, use Recharts where charting is needed (e.g., sparklines or gauges), and ensure strict type safety with TypeScript. This segment emphasizes minimal dependencies (only ShadCN and Recharts), accessibility (ARIA props), and responsive design via Tailwind's container queries and grid systems. By starting with these foundations, higher-level segments (e.g., trends, distributions) can build upon them for scalable, customizable analytics UIs.

## Component: KPIStat
### Description and Props
The `KPIStat` component renders a single key performance indicator (KPI) as a card, displaying a label, formatted value (with optional unit and currency handling), an optional delta (percentage change with color-coded sentiment), and an optional sparkline chart for trend visualization. It supports copy-to-clipboard interaction on click/keyboard for accessibility and usability. This is ideal for highlighting individual metrics like revenue or user count in a dashboard.

Props (from `KPIStatProps` interface, extending `BaseChartProps`):
- `kpi`: Required `KPI` object containing the metric data.
- `sparkline`: Optional `TimeSeries` for a mini line chart.
- `valueFormatter`: Optional function to format the KPI value (defaults to localized number formatting).
- `onCopyValue`: Optional callback fired after copying the value to clipboard.
- `className`: Optional string for additional Tailwind classes.
- `isLoading`: Optional boolean to show loading state (not implemented in this version; falls back to full render).
- `error`: Optional Error to display error message (not implemented; falls back to full render).
- `aria-label`: Optional string for ARIA label.
- `aria-describedby`: Optional string for ARIA description.

### Data Input Types
- `KPI`: `{ label: string; value: number; unit?: string; delta?: number; }` – Label is the metric name, value is the numeric data, unit is for suffixes (e.g., 'USD' for currency formatting), delta is for percentage change.
- `TimeSeries`: `{ key: string; points: TimeSeriesPoint[]; }` where `TimeSeriesPoint` is `{ t: number; v: number; }` – `t` is timestamp or index, `v` is value for the sparkline.

### Styling Keys from globals.css
Uses ShadCN-themed Tailwind tokens bridged via CSS variables:
- `--color-card`, `--color-card-foreground`: Card background and text.
- `--color-border`: Borders and dividers.
- `--color-accent`, `--color-destructive`, `--color-muted-foreground`: Delta sentiment colors (positive: accent, negative: destructive, neutral: muted).
- `--color-chart-1`: Sparkline stroke color.
- `--color-ring`: Focus rings for accessibility.
- Container queries (`@container`, `@md`, `@lg`) for responsive sparkline scaling.
- Transitions and shadows for hover/focus states.

### Standalone Usage Example
```tsx
import { KPIStat } from '@/components/depths/foundations/KPIStat';

const dummyKPI = { label: 'Active Sessions', value: 3721, delta: 0.061, unit: 'users' };
const dummySparkline = {
  key: 'active-sessions',
  points: Array.from({ length: 16 }, (_, i) => ({ t: i, v: 50 + Math.round(15 * Math.sin(i / 2) + i) })),
};

function KPIStatExample() {
  return (
    <div className="max-w-sm">
      <KPIStat
        kpi={dummyKPI}
        sparkline={dummySparkline}
        onCopyValue={(text) => console.log(`Copied: ${text}`)}
        aria-label="Active Sessions KPI"
      />
    </div>
  );
}
```
This renders a card with the label, formatted value (e.g., "3721 users"), a +6.1% delta in accent color, and a sparkline. Clicking copies "Active Sessions: 3721 users" to clipboard.

## Component: StatGrid
### Description and Props
The `StatGrid` component displays a responsive grid of `KPIStat` cards, ideal for grouping multiple metrics in a dashboard overview. It handles loading skeletons, errors, and auto-fits columns based on container width for responsiveness.

Props (from `StatGridProps` interface, extending `BaseChartProps`):
- `items`: Required array of `KPI` objects to render as individual stats.
- `title`: Required string for the grid header.
- `className`: Optional string for Tailwind classes.
- `isLoading`: Optional boolean to render skeletons.
- `error`: Optional Error to show error message.
- `aria-label`: Optional ARIA label.
- `aria-describedby`: Optional ARIA description.

### Data Input Types
- `items`: Array of `KPI` – Same as above: `{ label: string; value: number; unit?: string; delta?: number; }`.

### Styling Keys from globals.css
- `--color-card`, `--color-border`, `--color-shadow-sm`: Grid and card styling.
- `--color-destructive`: Error state background/text.
- `--color-muted`: Skeleton backgrounds with `animate-pulse`.
- Grid uses `grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]` for responsive auto-fitting.
- Padding/spacing via `@md` container queries.

### Standalone Usage Example
```tsx
import { StatGrid } from '@/components/depths/foundations/StatGrid';

const dummyKPIs = [
  { label: 'New Users', value: 12540, delta: 0.045 },
  { label: 'DAU', value: 8421, delta: -0.012 },
  { label: 'Revenue', value: 183250, unit: 'USD', delta: 0.027 },
  { label: 'Churn', value: 0.031, delta: -0.004 },
];

function StatGridExample() {
  return <StatGrid title="User Metrics" items={dummyKPIs} isLoading={false} />;
}
```
This renders a titled grid with four KPI cards, auto-fitting to screen width. Set `isLoading={true}` to show animated skeletons.

## Component: DataTable
### Description and Props
The `DataTable` component is a searchable, paginated table for displaying tabular data, with support for alignment, export to CSV, and loading/error states. It's built for detailed data views in analytics, like service metrics.

Props (from `DataTableProps` interface, extending `BaseChartProps`):
- `title`: Optional string for header.
- `columns`: Required array of `TableColumn` for headers and config.
- `rows`: Required array of `TableRow` (objects matching column keys).
- `total`: Optional number for total row count (unused in render).
- `onExportCSV`: Optional callback for CSV export.
- `searchable`: Optional boolean (default: true) to enable search input.
- `pageSize`: Optional number (default: 4) for rows per page.
- `className`: Optional Tailwind classes.
- `isLoading`: Optional for loading skeleton.
- `error`: Optional for error display.
- `aria-label`: Optional ARIA label.
- `aria-describedby`: Optional ARIA description.

### Data Input Types
- `TableColumn`: `{ key: string; label: string; width?: number; align?: 'left'|'right'|'center'; }` – Key maps to row data, label is header text.
- `TableRow`: `Record<string, unknown>` – Object where keys match column keys, values are strings/numbers for display.

### Styling Keys from globals.css
- `--color-border`, `--color-muted`: Borders, backgrounds, and hover states.
- `--color-destructive`: Error text/background.
- `--color-foreground`: Text and headers.
- Sticky headers with `sticky top-0 z-10 bg-muted/60 backdrop-blur`.
- `tabular-nums` for numeric alignment.
- Pagination buttons use `--color-primary`, `--color-secondary`.

### Standalone Usage Example
```tsx
import { DataTable } from '@/components/depths/foundations/DataTable';

const dummyColumns = [
  { key: 'service', label: 'Service' },
  { key: 'requests', label: 'Requests', align: 'right' },
  { key: 'errors', label: 'Errors', align: 'right' },
  { key: 'p95', label: 'p95 (ms)', align: 'right' },
];
const dummyRows = [
  { service: 'api-gateway', requests: 152403, errors: 132, p95: 187 },
  { service: 'billing', requests: 84902, errors: 21, p95: 224 },
  // Add more rows...
];

function DataTableExample() {
  return (
    <DataTable
      title="Service Metrics"
      columns={dummyColumns}
      rows={dummyRows}
      onExportCSV={() => console.log('Export CSV triggered')}
      searchable={true}
      pageSize={4}
    />
  );
}
```
This shows a searchable table with pagination. Search filters rows, and the export button triggers the callback.

## Component: ControlBar
### Description and Props
The `ControlBar` component renders a responsive bar of controls (selects and sliders) for user-driven queries/filters, like time ranges or thresholds. It manages internal state automatically, making it self-contained for dashboard interactions.

Props (from `ControlBarProps`):
- `title`: Optional string for header.
- `controls`: Required array of `ControlSpec` (select or slider configs).

### Data Input Types
- `ControlSpec`: Union of `SelectSpec` or `SliderSpec`.
  - `SelectSpec`: `{ type: 'select'; key: string; label?: string; options: SelectOptions; defaultValue?: string | number; }` where `SelectOptions` is array of `{ label: string; value: string | number; }`.
  - `SliderSpec`: `{ type: 'slider'; key: string; label?: string; min: number; max: number; step?: number; defaultValue?: number; showValueBadge?: boolean; }`.

### Styling Keys from globals.css
- `--color-border`, `--color-card`: Container styling.
- `--color-muted`: Badge backgrounds.
- Grid: `grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]` for responsive layout.
- `--color-foreground`: Text and labels.

### Standalone Usage Example
```tsx
import { ControlBar } from '@/components/depths/foundations/ControlBar';

const dummyControls = [
  { type: 'select', key: 'range', label: 'Range', options: [{ label: '1h', value: '1h' }, { label: '24h', value: '24h' }], defaultValue: '24h' },
  { type: 'slider', key: 'topK', label: 'Top K', min: 5, max: 50, step: 5, defaultValue: 10 },
];

function ControlBarExample() {
  return <ControlBar title="Query Controls" controls={dummyControls} />;
}
```
This renders a bar with a select dropdown and slider, updating internally on change.

## Component: RadialGauge
### Description and Props
The `RadialGauge` component displays a semi-circular gauge for values like utilization, with dynamic color thresholds, a center label, and tooltip. It's great for visual progress indicators in dashboards.

Props (from `RadialGaugeProps` interface, extending `BaseChartProps`):
- `title`: Optional header string.
- `description`: Optional subtext.
- `value`: Required number (0–100 or normalized).
- `min`: Optional minimum (default: 0).
- `max`: Optional maximum (default: 100).
- `unit`: Optional suffix (e.g., '%').
- `valueFormatter`: Optional formatter (defaults to number + unit).
- `height`: Optional height (default: 240px).
- `className`: Optional classes.
- `isLoading`: Optional for skeleton.
- `error`: Optional for error.
- `aria-label`: Optional ARIA.
- `aria-describedby`: Optional ARIA.

### Data Input Types
No complex inputs; just scalar `value` with min/max/domain.

### Styling Keys from globals.css
- `--color-chart-1`, `--color-chart-2`, `--color-chart-3`: Threshold-based fill colors (low/mid/high).
- `--color-border`, `--color-popover`: Tooltip and borders.
- `--color-destructive`: Error state.
- `--color-muted`: Skeletons with `animate-pulse`.
- Container queries (`@container`) for responsiveness.

### Standalone Usage Example
```tsx
import { RadialGauge } from '@/components/depths/foundations/RadialGauge';

function RadialGaugeExample() {
  return (
    <div className="max-w-sm">
      <RadialGauge
        title="Utilization"
        description="Current system load."
        value={69}
        min={0}
        max={100}
        unit="%"
        height={240}
      />
    </div>
  );
}
```
This renders a gauge filling to 69% with color changing based on thresholds (e.g., green for high). Hover shows tooltip.