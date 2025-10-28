'use client';

import * as React from 'react';
import { geoPath, geoMercator, type GeoPermissibleObjects } from 'd3-geo';
import type {
  Feature as GJFeature,
  FeatureCollection as GJFeatureCollection,
  GeoJsonProperties,
  Geometry,
  MultiPolygon,
  Polygon,
} from 'geojson';

/* ───────────────────────────── Props ───────────────────────────── */

type BaseChartProps = Readonly<{
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
  'aria-label'?: string;
  'aria-describedby'?: string;
}>;

type WorldMapProps = Readonly<
  BaseChartProps & {
    title?: string;
    description?: string;

    /** Country values keyed by ISO-3166-1 alpha-2 (e.g. "IN"). */
    data: Readonly<Record<string, number>>;

    /** Override numeric domain. */
    domain?: Readonly<{ min?: number; max?: number }>;

    /** Legend + scale controls, Heatmap-style. */
    legend?: boolean;

    /** Default color scale. Toggleable in-UI: 'linear' | 'log'. */
    defaultScale?: 'linear' | 'log';

    /** Format values in tooltip/legend. */
    valueFormatter?: (v: number) => string;

    height?: number | string;

    onCountryClick?: (code: string, name: string, value: number) => void;
    onCountryFocus?: (code: string, name: string, value: number) => void;
  }
>;

/* ─────────────────────────── Helpers ──────────────────────────── */

const fmtDefault = (v: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(v);

function clamp01(n: number): number {
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
}

function computeDomain(
  values: ReadonlyArray<number>,
  dom?: Readonly<{ min?: number; max?: number }>,
): [number, number] {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const v of values) if (Number.isFinite(v)) { min = Math.min(min, v); max = Math.max(max, v); }
  if (!Number.isFinite(min) || !Number.isFinite(max)) { min = 0; max = 1; }
  if (dom?.min != null) min = Number(dom.min);
  if (dom?.max != null) max = Number(dom.max);
  if (max <= min) max = min + 1;
  return [min, max];
}

/** Perceptual, theme-aware ramp with CSS color-mix in OKLCH. */
function mixOKLCH(t: number, from = 'var(--color-chart-3)', to = 'var(--color-chart-1)'): string {
  const p = Math.round(clamp01(t) * 100);
  return `color-mix(in oklch, ${to} ${p}%, ${from} ${100 - p}%)`;
}

/* Heatmap-like scale meta + ticks --------------------------------*/
type ScaleMeta =
  | { kind: 'linear'; min: number; max: number }
  | { kind: 'log'; min: number; max: number; minPos: number; maxPos: number };

function buildScaleMeta(kind: 'linear' | 'log', values: number[], [dMin, dMax]: [number, number]): ScaleMeta {
  if (kind === 'linear') return { kind: 'linear', min: dMin, max: dMax };
  const positives = values.filter((v) => v > 0);
  const minPos = positives.length ? Math.min(...positives) : Math.max(1e-6, dMax / 1e6);
  const maxPosCand = positives.length ? Math.max(...positives) : minPos * 10;
  const maxPos = Math.max(maxPosCand, minPos * 10);
  return { kind: 'log', min: dMin, max: dMax, minPos, maxPos };
}
function normalizeValue(v: number, m: ScaleMeta): number {
  if (m.kind === 'linear') return clamp01((v - m.min) / (m.max - m.min));
  const vv = Math.max(v, m.minPos);
  const p = (Math.log(vv) - Math.log(m.minPos)) / (Math.log(m.maxPos) - Math.log(m.minPos));
  return clamp01(p);
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

/* ───────────────────── GeoJSON typing + guards ─────────────────── */
type WorldGeometry = Polygon | MultiPolygon;
type WorldFeature = GJFeature<WorldGeometry, GeoJsonProperties>;
type WorldCollection = GJFeatureCollection<WorldGeometry, GeoJsonProperties>;

function isWorldFeature(f: unknown): f is WorldFeature {
  if (typeof f !== 'object' || f === null) return false;
  const ff = f as { type?: unknown; geometry?: unknown; properties?: unknown };
  if (ff.type !== 'Feature') return false;
  const g = (ff.geometry ?? null) as Geometry | null;
  const okGeom = g === null || g.type === 'Polygon' || g.type === 'MultiPolygon';
  const okProps = ff.properties === null || typeof ff.properties === 'object';
  return okGeom && okProps;
}
function isWorldCollection(fc: unknown): fc is WorldCollection {
  if (typeof fc !== 'object' || fc === null) return false;
  const obj = fc as { type?: unknown; features?: unknown };
  if (obj.type !== 'FeatureCollection' || !Array.isArray(obj.features)) return false;
  for (const f of obj.features) if (!isWorldFeature(f)) return false;
  return true;
}

function getIso2(props: GeoJsonProperties): string {
  if (!props || typeof props !== 'object') return '';
  const p = props as Record<string, unknown>;
  const cand = p['iso_a2'] ?? p['ISO_A2'] ?? p['ISO3166-1-Alpha-2'] ?? p['wb_a2'];
  return typeof cand === 'string' ? cand.toUpperCase() : '';
}
function getName(props: GeoJsonProperties): string {
  if (!props || typeof props !== 'object') return 'Unknown';
  const p = props as Record<string, unknown>;
  const cand = p['name'] ?? p['NAME'] ?? p['admin'] ?? p['ADMIN'] ?? p['name_long'] ?? p['NAME_LONG'];
  return typeof cand === 'string' ? cand : 'Unknown';
}

/* ───────────────────────── Component ───────────────────────── */

export function WorldMap(props: WorldMapProps): React.JSX.Element {
  const {
    title,
    description,
    data,
    domain,
    legend = true,
    defaultScale = 'linear',
    valueFormatter = fmtDefault,
    height = 500,
    className,
    isLoading,
    error,
    onCountryClick,
    onCountryFocus,
    ...a11y
  } = props;

  // Fetch from /public
  const [geoJson, setGeoJson] = React.useState<WorldCollection | null>(null);
  const [fetchErr, setFetchErr] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch('/world.geo.json', { cache: 'force-cache' });
        if (!res.ok) throw new Error(`Failed to load world.geo.json (HTTP ${res.status})`);
        const j: unknown = await res.json();
        if (!isWorldCollection(j)) throw new Error('world.geo.json is not a valid FeatureCollection of (Multi)Polygons');
        if (!cancel) setGeoJson(j);
      } catch (e) {
        if (!cancel) setFetchErr(e instanceof Error ? e : new Error('Unknown error'));
      }
    })();
    return () => { cancel = true; };
  }, []);

  // Scale state (Heatmap-style)
  const [colorScale, setColorScale] = React.useState<'linear' | 'log'>(defaultScale);

  const allValues = React.useMemo<number[]>(
    () => Object.values(data).map((n) => Number(n) || 0),
    [data],
  );
  const [dMin, dMax] = React.useMemo(() => computeDomain(allValues, domain), [allValues, domain]);
  const scaleMeta = React.useMemo<ScaleMeta>(() => buildScaleMeta(colorScale, allValues, [dMin, dMax]), [colorScale, allValues, dMin, dMax]);
  const ticks = React.useMemo(() => buildLegendTicks(allValues, scaleMeta), [allValues, scaleMeta]);

  const projection = React.useMemo(() => geoMercator().scale(130).translate([400, 300]), []);
  const pathGenerator = React.useMemo(() => geoPath().projection(projection), [projection]);

  // hover/tooltip anchoring
  const frameRef = React.useRef<HTMLDivElement>(null);
  const [hover, setHover] = React.useState<{ code: string; name: string; value: number; anchor: { x: number; y: number } } | null>(null);
  function anchorFromEvent(e: React.MouseEvent) {
    const r = frameRef.current?.getBoundingClientRect();
    const x = e.clientX - (r?.left ?? 0);
    const y = e.clientY - (r?.top ?? 0);
    return { x, y };
  }

  if (error || fetchErr) {
    const err = (error ?? fetchErr)!;
    return (
      <div {...a11y} className={['rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive', className ?? ''].join(' ')}>
        {err.message ?? 'Something went wrong.'}
      </div>
    );
  }
  if (isLoading || !geoJson) {
    return (
      <div className={['space-y-3', className ?? ''].join(' ')} {...a11y}>
        {title && <div className="text-lg font-semibold text-foreground">{title}</div>}
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-[320px] animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  const chartHeight = typeof height === 'number' ? height : undefined;

  return (
    <section {...a11y} className={['@container rounded-lg border border-border bg-card shadow-sm p-3 @md:p-4 text-card-foreground', className ?? ''].join(' ')} aria-roledescription="World map choropleth">
      {(title || description) && (
        <header className="mb-2">
          {title && <div className="text-lg font-semibold">{title}</div>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </header>
      )}

      {/* Controls (Heatmap-style) */}
      <div role="toolbar" aria-label="Map controls" className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Scale</span>
        <button
          type="button"
          onClick={() => setColorScale('linear')}
          aria-pressed={colorScale === 'linear'}
          className={[
            'inline-flex items-center rounded-md border px-2.5 py-1.5 text-xs font-medium',
            colorScale === 'linear' ? 'bg-secondary text-secondary-foreground' : 'bg-card',
            'border-border hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          ].join(' ')}
        >
          Linear
        </button>
        <button
          type="button"
          onClick={() => setColorScale('log')}
          aria-pressed={colorScale === 'log'}
          className={[
            'inline-flex items-center rounded-md border px-2.5 py-1.5 text-xs font-medium',
            colorScale === 'log' ? 'bg-secondary text-secondary-foreground' : 'bg-card',
            'border-border hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          ].join(' ')}
        >
          Log
        </button>
      </div>

      <figure className="w-full">
        <div ref={frameRef} className="relative">
          <svg
            width="100%"
            height={chartHeight}
            viewBox="0 0 800 600"
            preserveAspectRatio="xMidYMid meet"
            className="rounded-md border border-border bg-card/50"
            role="img"
            aria-label="World map heatmap"
          >
            <g>
              {geoJson.features.map((feature, i) => {
                const props = feature.properties;
                const code = getIso2(props);
                const name = getName(props);

                const hasValue = code !== '' && Object.prototype.hasOwnProperty.call(data, code);
                const value = hasValue ? Number(data[code]) : 0;

                // D3 path (safe cast via unknown -> GeoPermissibleObjects).
                const d = pathGenerator(feature as unknown as GeoPermissibleObjects) ?? '';

                // Fill: missing -> transparent; present -> ramp color
                const fill = hasValue ? mixOKLCH(normalizeValue(value, scaleMeta)) : 'transparent';

                // stable unique key
                const k =
                  (typeof (props as Record<string, unknown>).ne_id === 'number'
                    ? String((props as Record<string, unknown>).ne_id)
                    : undefined) ??
                  (props as Record<string, unknown>).iso_n3?.toString() ??
                  (name ? `${name}-${i}` : String(i));

                return (
                  <path
                    key={k}
                    d={d}
                    fill={fill}
                    stroke="var(--color-map)"
                    strokeWidth={0.5}
                    // Important: keep hover even when fill is transparent
                    style={{ pointerEvents: 'all' }} /* SVG pointer-events for transparent fill */
                    className="transition-colors hover:fill-[color-mix(in_oklch,var(--color-accent)20%,currentColor)] focus-visible:fill-[color-mix(in_oklch,var(--color-ring)20%,currentColor)]"
                    tabIndex={0}
                    role="gridcell"
                    aria-label={`${name}, ${valueFormatter(value)}`}
                    onMouseEnter={(e) => setHover({ code, name, value, anchor: anchorFromEvent(e) })}
                    onMouseMove={(e) => setHover((h) => (h ? { ...h, anchor: anchorFromEvent(e) } : h))}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => onCountryClick?.(code, name, value)}
                    onFocus={() => {
                      const [cx, cy] = pathGenerator.centroid(feature as unknown as GeoPermissibleObjects);
                      setHover({ code, name, value, anchor: { x: cx, y: cy } });
                      onCountryFocus?.(code, name, value);
                    }}
                    onBlur={() => setHover(null)}
                  />
                );
              })}
            </g>
          </svg>

          {/* Tooltip (catalog styling) */}
          {hover && (
            <div
              role="tooltip"
              className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-3 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-sm"
              style={{ left: hover.anchor.x, top: hover.anchor.y }}
            >
              <div className="mb-1 font-medium tabular-nums">{hover.name}</div>
              <div className="tabular-nums">{valueFormatter(hover.value)}</div>
            </div>
          )}
        </div>
      </figure>

      {/* Legend — same visual language as Heatmap */}
      {legend && (
        <div className="mt-3 flex items-center gap-3">
          <div className="text-xs text-muted-foreground">Scale</div>
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
                  <span key={i} className="absolute top-0 h-3 w-px bg-border" style={{ left: `${t.posPct}%`, transform: 'translateX(-0.5px)' }} aria-hidden />
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
