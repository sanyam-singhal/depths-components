'use client';

import * as React from 'react';

export type BaseChartProps = Readonly<{
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
  'aria-label'?: string;
  'aria-describedby'?: string;
}>;

export type HeatmapData = Readonly<{
  xLabels: ReadonlyArray<string>;
  yLabels: ReadonlyArray<string>;
  z: ReadonlyArray<ReadonlyArray<number>>;
}>;

export type HeatmapProps = Readonly<
  BaseChartProps & {
    title?: string;
    description?: string;
    data: HeatmapData;
    colorScale?: 'linear' | 'log';
    domain?: Readonly<{ min?: number; max?: number }>;
    xLabel?: string;
    yLabel?: string;
    valueFormatter?: (v: number) => string;
    legend?: boolean;
    fitMode?: 'fit' | 'scroll';
    axisEmphasis?: boolean;
    gap?: number;
    squareCells?: boolean;
    height?: number | string;
    onCellClick?: (row: number, col: number, value: number) => void;
    onCellFocus?: (row: number, col: number, value: number) => void;
  }
>;

/* ───────────────────────────────── helpers ───────────────────────────────── */

const fmtDefault = (v: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(v);

function clamp01(n: number) {
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
}

function computeDomain(
  z: ReadonlyArray<ReadonlyArray<number>>,
  dom?: Readonly<{ min?: number; max?: number }>,
): [number, number] {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const row of z) {
    for (const v of row) {
      if (Number.isFinite(v)) {
        min = Math.min(min, v);
        max = Math.max(max, v);
      }
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    min = 0; max = 1;
  }
  if (dom?.min != null) min = Number(dom.min);
  if (dom?.max != null) max = Number(dom.max);
  if (max <= min) max = min + 1;
  return [min, max];
}

type ScaleMeta =
  | { kind: 'linear'; min: number; max: number }
  | { kind: 'log'; min: number; max: number; minPos: number; maxPos: number };

function buildScaleMeta(
  kind: 'linear' | 'log',
  values: number[],
  [dMin, dMax]: [number, number],
): ScaleMeta {
  if (kind === 'linear') return { kind: 'linear', min: dMin, max: dMax };
  const positives = values.filter((v) => v > 0);
  const minPos = positives.length ? Math.min(...positives) : Math.max(1e-6, dMax / 1e6);
  const maxPosCandidate = positives.length ? Math.max(...positives) : minPos * 10;
  const maxPos = Math.max(maxPosCandidate, minPos * 10);
  return { kind: 'log', min: dMin, max: dMax, minPos, maxPos };
}

function normalizeValue(v: number, m: ScaleMeta): number {
  if (m.kind === 'linear') return clamp01((v - m.min) / (m.max - m.min));
  const vv = Math.max(v, m.minPos);
  const p = (Math.log(vv) - Math.log(m.minPos)) / (Math.log(m.maxPos) - Math.log(m.minPos));
  return clamp01(p);
}

/** Perceptual, themeable ramp — OKLCH + color-mix(). */
function mixOKLCH(t: number, from = 'var(--color-chart-3)', to = 'var(--color-chart-1)') {
  const p = Math.round(clamp01(t) * 100);
  return `color-mix(in oklch, ${to} ${p}%, ${from} ${100 - p}%)`;
}

function quantile(sorted: number[], q: number): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const i = (n - 1) * q;
  const lo = Math.floor(i), hi = Math.ceil(i);
  if (lo === hi) return sorted[lo];
  const t = i - lo;
  return sorted[lo] * (1 - t) + sorted[hi] * t;
}

function buildLegendTicks(values: number[], meta: ScaleMeta) {
  const ticks: { value: number; posPct: number }[] = [];
  if (meta.kind === 'linear') {
    const s = [...values].sort((a, b) => a - b);
    for (const q of [0, 0.25, 0.5, 0.75, 1]) {
      const v = quantile(s, q);
      const p = (v - meta.min) / (meta.max - meta.min);
      ticks.push({ value: v, posPct: clamp01(p) * 100 });
    }
  } else {
    const steps = 4;
    const r = Math.pow(meta.maxPos / meta.minPos, 1 / steps);
    for (let k = 0; k <= steps; k++) {
      const v = meta.minPos * Math.pow(r, k);
      const p = (Math.log(v) - Math.log(meta.minPos)) / (Math.log(meta.maxPos) - Math.log(meta.minPos));
      ticks.push({ value: v, posPct: clamp01(p) * 100 });
    }
  }
  return ticks;
}

/* ───────────────────────────────── component ─────────────────────────────── */

type CellPos = { r: number; c: number; v: number };

export function Heatmap({
  title,
  description,
  data,
  colorScale = 'linear',
  domain,
  xLabel,
  yLabel,
  valueFormatter = fmtDefault,
  legend = true,
  fitMode = 'fit',
  axisEmphasis = true,
  gap = 2,
  squareCells = true,
  height,
  className,
  isLoading,
  error,
  onCellClick,
  onCellFocus,
  ...a11y
}: HeatmapProps): React.JSX.Element {
  const rows = data.yLabels.length;
  const cols = data.xLabels.length;

  // flatten values for domain/legend
  const values = React.useMemo<number[]>(() => {
    const out: number[] = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push(data.z[r]?.[c] ?? 0);
    return out;
  }, [data.z, rows, cols]);

  const [dMin, dMax] = React.useMemo(() => computeDomain(data.z, domain), [data.z, domain]);
  const scaleMeta = React.useMemo(() => buildScaleMeta(colorScale, values, [dMin, dMax]), [colorScale, values, dMin, dMax]);
  const ticks = React.useMemo(() => buildLegendTicks(values, scaleMeta), [values, scaleMeta]);

  // interaction state
  const [tab, setTab] = React.useState<CellPos | null>(null);
  const [active, setActive] = React.useState<CellPos | null>(null);
  const [hoverRow, setHoverRow] = React.useState<number | null>(null);
  const [hoverCol, setHoverCol] = React.useState<number | null>(null);
  const [anchor, setAnchor] = React.useState<{ x: number; y: number } | null>(null);

  const gridRef = React.useRef<HTMLDivElement | null>(null);
  const frameRef = React.useRef<HTMLDivElement | null>(null);
  const stickyRef = React.useRef<HTMLDivElement | null>(null);
  const [cellPx, setCellPx] = React.useState<number>(16);
  const [stickyHeight, setStickyHeight] = React.useState<number>(0);

  // Responsive sizing: compute cell size to fit/fill width
  React.useEffect(() => {
    const frame = frameRef.current;
    const sticky = stickyRef.current;
    if (!frame || !sticky) return;

    const obs = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setStickyHeight(sticky.getBoundingClientRect().height);

      if (cols === 0) return;

      const inner = Math.max(0, w - 32); // full px-2 left/right
      const desired = (inner - (cols - 1) * gap) / cols;

      let px: number;
      if (fitMode === 'fit') {
        px = Math.floor(Math.max(12, desired)); // no max clamp to fill width
      } else {
        px = Math.floor(Math.max(10, Math.min(20, desired))); // clamped for scroll
      }
      setCellPx(px);
    });
    obs.observe(frame);
    obs.observe(sticky);
    return () => obs.disconnect();
  }, [cols, gap, fitMode]);

  // default tabbable cell
  React.useEffect(() => {
    if (rows > 0 && cols > 0) setTab({ r: 0, c: 0, v: data.z[0]?.[0] ?? 0 });
  }, [rows, cols, data.z]);

  function focusCell(r: number, c: number) {
    const el = gridRef.current?.querySelector<HTMLElement>(`[data-rc="${r}-${c}"]`);
    el?.focus();
  }

  function onCellKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, r: number, c: number, v: number) {
    const key = e.key;
    if (
      key === 'ArrowRight' || key === 'ArrowLeft' ||
      key === 'ArrowDown' || key === 'ArrowUp' ||
      key === 'Home' || key === 'End'
    ) {
      e.preventDefault();
    }
    if (key === 'ArrowRight') {
      const nc = Math.min(cols - 1, c + 1);
      focusCell(r, nc); setTab({ r, c: nc, v: data.z[r]?.[nc] ?? 0 });
    }
    if (key === 'ArrowLeft') {
      const nc = Math.max(0, c - 1);
      focusCell(r, nc); setTab({ r, c: nc, v: data.z[r]?.[nc] ?? 0 });
    }
    if (key === 'ArrowDown') {
      const nr = Math.min(rows - 1, r + 1);
      focusCell(nr, c); setTab({ r: nr, c, v: data.z[nr]?.[c] ?? 0 });
    }
    if (key === 'ArrowUp') {
      const nr = Math.max(0, r - 1);
      focusCell(nr, c); setTab({ r: nr, c, v: data.z[nr]?.[c] ?? 0 });
    }
    if (key === 'Home') {
      focusCell(r, 0); setTab({ r, c: 0, v: data.z[r]?.[0] ?? 0 });
    }
    if (key === 'End') {
      const nc = cols - 1;
      focusCell(r, nc); setTab({ r, c: nc, v: data.z[r]?.[nc] ?? 0 });
    }
    if (key === 'Enter' || key === ' ') onCellClick?.(r, c, v);
    if (key === 'Escape') setActive(null);
  }

  function placeAnchorFromEvent(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = (frameRef.current as HTMLElement).getBoundingClientRect();
    setAnchor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }
  function placeAnchorFromElement(el: HTMLElement) {
    const wr = (frameRef.current as HTMLElement).getBoundingClientRect();
    const cr = el.getBoundingClientRect();
    setAnchor({ x: cr.left - wr.left + cr.width / 2, y: cr.top - wr.top + cr.height / 2 });
  }

  /* skeleton / error (unchanged) */
  if (error) {
    return (
      <div
        {...a11y}
        className={['rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive', className ?? ''].join(' ')}
      >
        {error.message ?? 'Something went wrong.'}
      </div>
    );
  }
  if (isLoading) {
    return (
      <div {...a11y} className={['space-y-3', className ?? ''].join(' ')}>
        {title && <div className="text-lg font-semibold">{title}</div>}
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-[320px] animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  /* layout numbers shared by grid + ticks so they never drift */
  const gridCols = `repeat(${cols}, ${cellPx}px)`;
  const gridGap = `${gap}px`;

  /* content height so Y scroll is allowed (if needed) */
  const contentH = rows * cellPx + (rows - 1) * gap + 16 + stickyHeight; // + p-2 + sticky
  const frameHeight = height
    ? (typeof height === 'number' ? `${height}px` : height)
    : (squareCells ? `${contentH}px` : 'auto');

  /* UI */
  return (
    <section
      {...a11y}
      className={[
        '@container',
        'rounded-lg border border-border bg-card shadow-sm p-3 @md:p-4 text-card-foreground',
        className ?? '',
      ].join(' ')}
      aria-roledescription="Heatmap"
    >
      {(title || description) && (
        <header className="mb-2">
          {title && <div className="text-lg font-semibold">{title}</div>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </header>
      )}

      <div className="flex items-stretch">
        {/* Y-axis gutter */}
        <div className="mr-2 flex shrink-0 select-none flex-col relative" style={{ width: 'max-content' }}>
          {yLabel && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2 text-[12px] font-medium text-foreground/80 rotate-[-90deg]">
              {yLabel}
            </div>
          )}
          <div className="flex flex-col pt-2" aria-hidden>
            {data.yLabels.map((y, i) => {
              const emph = axisEmphasis && hoverRow != null;
              const cls = emph ? (hoverRow === i ? 'text-foreground' : 'text-foreground/60') : 'text-foreground/80';
              return (
                <div
                  key={`y-${i}`}
                  className={['flex items-center justify-end pr-1 tabular-nums text-[clamp(11px,1.6cqi,13px)] leading-4', cls].join(' ')}
                  style={{ height: `${cellPx}px`, marginBottom: i < rows - 1 ? `${gap}px` : 0 }}
                >
                  {y}
                </div>
              );
            })}
          </div>
          <div className="h-6" />
        </div>

        {/* Scroll frame */}
        <div
          ref={frameRef}
          className="relative min-w-0 flex-1 overflow-auto rounded-md border border-border bg-card/50"
          style={{ height: frameHeight }}
        >
          <div className="relative" ref={gridRef}>
            {/* Cells grid */}
            <div
              role="grid"
              aria-rowcount={rows}
              aria-colcount={cols}
              className="p-2"
              style={{ display: 'grid', gridTemplateColumns: gridCols, gap: gridGap, width: 'fit-content' }}
            >
              {data.yLabels.map((_, r) =>
                Array.from({ length: cols }).map((__, c) => {
                  const v = data.z[r]?.[c] ?? 0;
                  const t = normalizeValue(v, scaleMeta);
                  const bg = mixOKLCH(t);
                  const isTab = tab?.r === r && tab?.c === c;
                  const id = `hm-cell-${r}-${c}`;
                  return (
                    <button
                      key={id}
                      id={id}
                      data-rc={`${r}-${c}`}
                      role="gridcell"
                      aria-label={`${data.yLabels[r]}, ${data.xLabels[c]}, value ${valueFormatter(v)}`}
                      aria-selected={active?.r === r && active?.c === c ? 'true' : 'false'}
                      tabIndex={isTab ? 0 : -1}
                      onMouseEnter={(e) => {
                        setActive({ r, c, v });
                        setHoverRow(r); setHoverCol(c);
                        placeAnchorFromEvent(e);
                      }}
                      onMouseMove={placeAnchorFromEvent}
                      onMouseLeave={() => {
                        setActive((cur) => (cur && cur.r === r && cur.c === c ? null : cur));
                        setHoverRow(null); setHoverCol(null);
                      }}
                      onFocus={(e) => {
                        setTab({ r, c, v });
                        setActive({ r, c, v });
                        setHoverRow(r); setHoverCol(c);
                        placeAnchorFromElement(e.currentTarget);
                        onCellFocus?.(r, c, v);
                      }}
                      onBlur={() => {
                        setActive((cur) => (cur && cur.r === r && cur.c === c ? null : cur));
                        setHoverRow(null); setHoverCol(null);
                      }}
                      onKeyDown={(ev) => onCellKeyDown(ev, r, c, v)}
                      onClick={() => onCellClick?.(r, c, v)}
                      className={[
                        'relative rounded-[3px] outline-none transition-[box-shadow]',
                        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      ].join(' ')}
                      style={{ width: `${cellPx}px`, height: `${cellPx}px`, background: bg }}
                      title={`${data.yLabels[r]} • ${data.xLabels[c]} • ${valueFormatter(v)}`}
                    />
                  );
                }),
              )}
            </div>

            {/* Sticky bottom x-ticks */}
            <div
              ref={stickyRef}
              className="sticky bottom-0 z-10 border-t border-border bg-card/95 px-2 pb-2 pt-1 backdrop-blur"
              aria-hidden
            >
              <div
                style={{ display: 'grid', gridTemplateColumns: gridCols, gap: gridGap, width: 'fit-content' }}
                className="text-foreground/80"
              >
                {data.xLabels.map((x, i) => {
                  const emph = axisEmphasis && hoverCol != null;
                  const cls = emph ? (hoverCol === i ? 'text-foreground' : 'text-foreground/60') : '';
                  return (
                    <div key={`x-${i}`} className={['text-center tabular-nums text-[clamp(11px,1.6cqi,13px)] leading-4', cls].join(' ')}>
                      {x}
                    </div>
                  );
                })}
              </div>
              {xLabel && <div className="mt-1 text-center text-[12px] text-foreground/80">{xLabel}</div>}
            </div>

            {/* Polished tooltip */}
            {active && anchor && (
              <div
                role="tooltip"
                className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-3 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-sm"
                style={{ left: anchor.x, top: anchor.y }}
              >
                <div className="mb-1 font-medium tabular-nums">
                  {data.yLabels[active.r]} • {data.xLabels[active.c]}
                </div>
                <div className="tabular-nums">{valueFormatter(active.v)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend (bottom only) */}
      {legend && (
        <div className="mt-3 flex items-center gap-3">
          <div className="text-xs text-muted-foreground">{xLabel ? xLabel : 'Scale'}</div>
          <div className="relative flex-1">
            <div
              aria-hidden
              className="h-2 w-full rounded-full border border-border"
              style={{
                background: `linear-gradient(to right, ${Array.from({ length: 12 }, (_, i) => {
                  const t = i / 11;
                  return `${mixOKLCH(t)} ${Math.round(t * 100)}%`;
                }).join(', ')})`,
              }}
            />
            <div className="relative mt-2">
              <div className="relative h-3">
                {ticks.map((t, i) => (
                  <span
                    key={i}
                    className="absolute top-0 h-3 w-px bg-border"
                    style={{ left: `${t.posPct}%`, transform: 'translateX(-0.5px)' }}
                    aria-hidden
                  />
                ))}
              </div>
              <div className="relative mt-1 flex justify-between text-[11px] leading-4 text-foreground/80 tabular-nums">
                {ticks.map((t, i) => (
                  <span
                    key={i}
                    style={{
                      transform:
                        i === 0 ? 'translateX(0%)' :
                        i === ticks.length - 1 ? 'translateX(0%)' : 'translateX(-50%)',
                    }}
                  >
                    {valueFormatter(t.value)}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <span className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">
            {colorScale}
          </span>
        </div>
      )}
    </section>
  );
}