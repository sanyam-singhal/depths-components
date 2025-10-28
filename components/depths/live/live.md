# Live Components Segment Documentation

## Overview of the Live Components Segment

The Live components segment is dedicated to handling real-time, streaming data visualizations, such as live logs and traces, using Server-Sent Events (SSE) for continuous updates without polling. These components maintain a buffer of the most recent items (via an efficient ring buffer implementation), allowing for smooth, performant rendering of incoming data in a dashboard context. Features like filtering, searching, pausing, and detailed views make them interactive and user-friendly for monitoring applications.

This segment aligns with the overall vision of creating composable, type-safe analytics "lego blocks" in React 19, Tailwind v4, and TypeScript 5 for a Next.js v15.5 demo app. It emphasizes strict type safety (e.g., typed data rows and props), adherence to modern web standards (e.g., SSE for real-time), and minimal dependencies—relying only on ShadCN UI components for inputs, buttons, and sheets, with no charting libraries needed here (unlike Recharts in other segments). Composability is evident in shared utilities like `RingBuffer` and `RingStore` for state management, which could be reused or composed with other components (e.g., embedding a live feed in a larger monitoring panel). The styling matches ShadCN's minimalist, token-based approach, ensuring seamless light/dark mode support and accessibility, making these ideal for observability tools in a broader product ecosystem.

This documentation is standalone: it includes explanations, props, data types, styling references, and usage examples for each component in this segment.

## Component: LiveTailList

### What the Component Does
The `LiveTailList` component displays a real-time scrolling table of logs fetched via SSE, showing the newest entries at the top. It supports pausing/resuming the stream, clearing the buffer, filtering by severity (e.g., info, error), full-text search on log bodies, and copying individual logs to the clipboard. The table is sticky-headered for usability, with color-coded severity badges. It's designed for tailing logs in monitoring dashboards, similar to `tail -f` but interactive and web-based.

### Props
- `title?: string`: Optional title for the component header.
- `description?: string`: Optional descriptive text below the title.
- `sseUrl: string`: URL for the SSE endpoint providing log data (required).
- `bufferSize?: number`: Maximum number of logs to keep in the ring buffer (default: 500).
- `height?: number | string`: Fixed height for the scrollable table (default: auto).
- `onCopy?: (row: LogRow) => void`: Callback when a log row is copied (e.g., for custom handling like toasts).
- `className?: string`: Additional Tailwind classes for the container.
- `isLoading?: boolean`: If true, shows a loading state (overridden by SSE connection status).
- `error?: Error | null`: Displays an error if SSE fails or provided.
- `'aria-label'?: string`: ARIA label for accessibility.
- `'aria-describedby'?: string`: ARIA description ID for accessibility.

### Data Input Type Structuring
The primary data input is streamed via SSE as JSON objects conforming to `LogRow`, defined as:
```typescript
export type LogSeverity = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | string;

export interface LogRow {
  ts: number;  // Timestamp in milliseconds
  severity: LogSeverity;  // Log level
  service: string;  // Source service name
  body: string;  // Main log message
  [k: string]: unknown;  // Arbitrary additional fields
}
```
- This interface ensures type-safe log objects; `ts` enables time formatting, `severity` for filtering/coloring, `service` and `body` for display/search, and the index signature allows extensible metadata without breaking types.
The component uses a `RingStore<LogRow>` internally to manage the buffer, providing `getSnapshot` and `subscribe` for React integration (via `useSyncExternalStore`).

### Styling Keys Used from globals.css
- `--color-border`: Table borders, input borders.
- `--color-muted`: Default severity badge background; muted backgrounds for odd rows.
- `--color-foreground`: Text, headers.
- `--color-muted-foreground`: Muted text like timestamps, footer counts.
- `--color-accent`: Hover backgrounds, button hovers.
- `--color-ring`: Focus rings on inputs/buttons.
Custom severity colors are hardcoded in the component (e.g., red for 'error') but could mix with tokens like `color-mix(in oklch, var(--color-destructive), ...)`. Table uses Tailwind utilities like `sticky`, `truncate`, `whitespace-pre-wrap` for responsive, accessible layout.

### End-to-End Standalone Usage Example
Adapted from `Demo.tsx`, this example uses a placeholder SSE URL (assume an API like `/api/live/logs` streams JSON LogRow objects). For demo purposes, it includes an `onCopy` handler.

```tsx
'use client';

import * as React from 'react';
import { LiveTailList } from '@/components/depths/live/LiveTailList';

export function LiveTailListExample(): React.JSX.Element {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Live logs via Server-Sent Events; filter by severity or search.
      </p>
      <LiveTailList
        title="Live Logs"
        description="Receiving logs from an SSE endpoint"
        sseUrl="/api/live/logs"  // Replace with your actual SSE URL
        height={420}
        onCopy={(row) => {
          navigator.clipboard.writeText(JSON.stringify(row));
          // Optional: Add a toast or console.log for feedback
          console.log('Copied log:', row);
        }}
      />
    </div>
  );
}
```

## Component: LiveTracesFeed

### What the Component Does
The `LiveTracesFeed` component renders a real-time table of trace spans from SSE, with newest at the top. It includes pause/resume, clear, quick filters by status (e.g., OK, ERROR), and a search input. Clicking a row opens a detailed sheet view with trace/span IDs (copyable), attributes as JSON, and formatted timestamps/durations. Suited for distributed tracing in observability dashboards, providing quick insights into system performance and errors.

### Props
- `title?: string`: Optional header title.
- `description?: string`: Optional description.
- `sseUrl: string`: SSE endpoint URL for trace data (required).
- `bufferSize?: number`: Max traces in the buffer (default: 500).
- `height?: number | string`: Table height.
- `className?: string`: Additional classes.
- `isLoading?: boolean`: Loading state.
- `error?: Error | null`: Error display.
- `'aria-label'?: string`: ARIA label.
- `'aria-describedby'?: string`: ARIA description.

### Data Input Type Structuring
Streamed data conforms to `TraceSpan`, defined as:
```typescript
export type TraceStatus = 'OK' | 'ERROR' | 'UNSET' | string;

export interface TraceSpan {
  trace_id: string;  // Unique trace identifier
  span_id: string;   // Span identifier within the trace
  name: string;      // Span name (e.g., operation)
  dur_ms: number;    // Duration in milliseconds
  status: TraceStatus;  // Outcome status
  ts: number;        // Start timestamp in milliseconds
  service?: string;  // Optional source service
  attributes?: Record<string, unknown>;  // Optional key-value metadata
}
```
- This structure supports tracing standards (e.g., OpenTelemetry-inspired); required fields ensure core display, optionals add flexibility. Uses `RingStore<TraceSpan>` for buffering, with type-safe snapshots/subscriptions.

### Styling Keys Used from globals.css
- `--color-border`: Borders on tables, sheets, inputs.
- `--color-muted`: Muted backgrounds, default badges.
- `--color-foreground`: Primary text.
- `--color-muted-foreground`: Secondary text like timestamps.
- `--color-accent`: Hover states, active filters.
- `--color-destructive`: Error status coloring (mixed for badges).
- `--color-ring`: Focus/outlines.
Status badges use token mixes (e.g., green for 'OK' via `color-mix(in oklch, var(--color-chart-1), ...)`). Sheet and table leverage ShadCN for responsive, accessible UI.

### End-to-End Standalone Usage Example
From `Demo.tsx`, using a placeholder SSE URL (e.g., `/api/live/traces` streams JSON TraceSpan objects). No `onCopy` prop, but sheet includes built-in copy buttons.

```tsx
'use client';

import * as React from 'react';
import { LiveTracesFeed } from '@/components/depths/live/LiveTracesFeed';

export function LiveTracesFeedExample(): React.JSX.Element {
  return (
    <div className="space-y-4 @container">
      <p className="text-sm text-muted-foreground">
        Live traces with quick filters; click any row to open details.
      </p>
      <LiveTracesFeed
        title="Live Traces"
        description="Receiving traces from an SSE endpoint"
        sseUrl="/api/live/traces"  // Replace with your actual SSE URL
        height={420}
      />
    </div>
  );
}
```