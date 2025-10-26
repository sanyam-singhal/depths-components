// components/depths/trends/SankeyDiagram.tsx
'use client';

import * as React from 'react';
import {
  ResponsiveContainer,
  Sankey,
  Layer,
} from 'recharts';

/* -----------------------------------------------------------------------------
 * Types & helpers (self-contained; no external deps)
 * -------------------------------------------------------------------------- */

export type SankeyNode = Readonly<{ name: string }>;
export type SankeyLink = Readonly<{ source: number; target: number; value: number }>;
export type SankeyData = Readonly<{ nodes: ReadonlyArray<SankeyNode>; links: ReadonlyArray<SankeyLink> }>;

export type BaseChartProps = Readonly<{
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
  'aria-label'?: string;
  'aria-describedby'?: string;
}>;

export type SankeyDiagramProps = Readonly<
  BaseChartProps & {
    /** Optional title rendered in the card header */
    title?: string;
    /** Optional help/description below the title */
    description?: string;

    /** Sankey data with nodes and links. */
    data: SankeyData;

    /** Fixed height (px or CSS length). */
    height?: number | string;

    /** Node width in px. Default: 24. */
    nodeWidth?: number;

    /** Node padding in px. Default: 18. */
    nodePadding?: number;

    /** Margin on the left of the  diagram*/
    startMargin?: number;

    /** Margin on the right of the  diagram*/
    endMargin?: number;

  }
>;

/** 0–2 fraction digits localized number. */
function formatNumber(v: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(v);
}

/** Palette from CSS variables (Tailwind v4 theme vars). */
function tokenPalette(n: number): string[] {
  const vars = [
    'var(--color-chart-1)',
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-4)',
    'var(--color-chart-5)',
  ];
  return Array.from({ length: n }, (_, i) => vars[i % vars.length]);
}


type CustomNodeProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  payload: { name: string; value: number };
  containerWidth: number;
  colors: string[];
};

/** Custom node renderer for better styling (rect + label with value). */
function CustomNode({ x, y, width, height, index, payload, containerWidth, colors }: CustomNodeProps): React.JSX.Element {
  const color = colors[index % colors.length];
  const isRight = x > containerWidth / 2;
  const textX = isRight ? x - 6 : x + width + 6;
  const anchor = isRight ? 'end' : 'start';
  return (
    <Layer key={`CustomNode${index}`}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        fillOpacity="1"
        rx="2"
        ry="2"
      />
      <text
        textAnchor={anchor}
        x={textX}
        y={y + height / 2}
        fontSize="12"
        fill="var(--color-foreground)"
        opacity={0.9}
      >
        {`${payload.name} (${formatNumber(payload.value)})`}
      </text>
    </Layer>
  );
}

/* -----------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------- */

export function SankeyDiagram(props: SankeyDiagramProps): React.JSX.Element {
  const {
    title,
    description,
    data,
    height = 320,
    nodeWidth = 24,
    nodePadding = 18,
    startMargin = 10,
    endMargin = 100,
    className,
    isLoading,
    error,
    ...a11y
  } = props;

  const colors = React.useMemo(() => tokenPalette(data.nodes.length), [data.nodes.length]);

  // basic error/loading visuals
  if (error) {
    return (
      <div
        {...a11y}
        className={[
          'rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive',
          className ?? '',
        ].join(' ')}
      >
        {(error as Error).message ?? 'Something went wrong.'}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={['space-y-3', className ?? ''].join(' ')} {...a11y}>
        {title && <div className="text-lg font-semibold">{title}</div>}
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="h-9 w-full animate-pulse rounded bg-muted" />
          <div className="mt-3 h-[320px] animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  const chartHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <section
      {...a11y}
      className={[
        '@container',
        'rounded-lg border border-border bg-card shadow-sm p-3 @md:p-4',
        className ?? '',
      ].join(' ')}
    >
      {(title || description) && (
        <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            {title && <div className="text-lg font-semibold text-foreground">{title}</div>}
            {description && <p className="text-sm text-muted-foreground truncate">{description}</p>}
          </div>
        </header>
      )}

      <figure className="w-full">
        <div className="w-full overflow-x-auto" style={{ height: chartHeight }}>
          
          <ResponsiveContainer width="100%" height="100%" minWidth={800}>
            <Sankey
              data={{ nodes: [...data.nodes], links: [...data.links] }}
              nodeWidth={nodeWidth}
              nodePadding={nodePadding}
              margin={{ top: 8, right: endMargin, left: startMargin, bottom: 16 }}
              link={{ stroke: 'var(--color-border)', strokeOpacity: 0.4 }}
              node={(nodeProps) => CustomNode({ ...nodeProps, colors })}
            >
            </Sankey>
          </ResponsiveContainer>
        </div>
      </figure>
    </section>
  );
}