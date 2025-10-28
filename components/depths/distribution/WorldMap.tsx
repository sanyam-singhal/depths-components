'use client';

import * as React from 'react';
import { geoPath, geoMercator } from 'd3-geo';
import type { GeoPermissibleObjects } from 'd3-geo';
import Image from 'next/image';

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
    /** Country values keyed by ISO-3166-1 alpha-2 code (e.g. "IN"). */
    data: Readonly<Record<string, number>>;
    domain?: Readonly<{ min?: number; max?: number }>;
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

type ScaleMeta = { kind: 'linear'; min: number; max: number };
function normalizeValue(v: number, m: ScaleMeta): number {
  return clamp01((v - m.min) / (m.max - m.min));
}

/** Perceptual, theme-aware ramp using OKLCH + CSS color-mix(). */
function mixOKLCH(t: number, from = 'var(--color-chart-3)', to = 'var(--color-chart-1)'): string {
  const p = Math.round(clamp01(t) * 100);
  return `color-mix(in oklch, ${to} ${p}%, ${from} ${100 - p}%)`;
}

/* ───────────────────── GeoJSON typing + guards ───────────────────
   Use official GeoJSON types so coordinates are mutable arrays
   (compatible with d3-geo’s GeoPermissibleObjects). :contentReference[oaicite:3]{index=3}
-------------------------------------------------------------------*/

type WorldGeometry = Polygon | MultiPolygon;
type WorldFeature = GJFeature<WorldGeometry, GeoJsonProperties>;
type WorldCollection = GJFeatureCollection<WorldGeometry, GeoJsonProperties>;

function isWorldFeature(f: unknown): f is WorldFeature {
  if (typeof f !== 'object' || f === null) return false;
  const ff = f as { type?: unknown; geometry?: unknown; properties?: unknown };
  if (ff.type !== 'Feature') return false;
  const g = (ff.geometry ?? null) as Geometry | null;
  const okGeom =
    g === null ||
    g.type === 'Polygon' ||
    g.type === 'MultiPolygon';
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

/* Robust property accessors without `any` */
function getIso2(props: GeoJsonProperties): string {
  if (!props || typeof props !== 'object') return '';
  const p = props as Record<string, unknown>;
  const cand =
    p['iso_a2'] ??
    p['ISO_A2'] ??
    p['ISO3166-1-Alpha-2'] ??
    p['wb_a2'];
  return typeof cand === 'string' ? cand.toUpperCase() : '';
}

function getName(props: GeoJsonProperties): string {
  if (!props || typeof props !== 'object') return 'Unknown';
  const p = props as Record<string, unknown>;
  const cand =
    p['name'] ??
    p['NAME'] ??
    p['admin'] ??
    p['ADMIN'] ??
    p['name_long'] ??
    p['NAME_LONG'];
  return typeof cand === 'string' ? cand : 'Unknown';
}

/* ───────────────────────── Component ───────────────────────── */

export function WorldMap(props: WorldMapProps): React.JSX.Element {
  const {
    title,
    description,
    data,
    domain,
    valueFormatter = fmtDefault,
    height = 400,
    className,
    isLoading,
    error,
    onCountryClick,
    onCountryFocus,
    ...a11y
  } = props;

  // Load from /public (must be fetched by URL in Next.js). :contentReference[oaicite:4]{index=4}
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

  const values = React.useMemo(() => Object.values(data), [data]);
  const [dMin, dMax] = React.useMemo(() => computeDomain(values, domain), [values, domain]);
  const scaleMeta = React.useMemo<ScaleMeta>(() => ({ kind: 'linear', min: dMin, max: dMax }), [dMin, dMax]);

  const [hovered, setHovered] = React.useState<{ code: string; name: string; value: number; x: number; y: number } | null>(null);

  // D3 projection + path; D3 consumes standard GeoJSON via GeoPermissibleObjects. :contentReference[oaicite:5]{index=5}
  const projection = React.useMemo(() => geoMercator().scale(130).translate([400, 300]), []);
  const pathGenerator = React.useMemo(() => geoPath().projection(projection), [projection]);

  /* error / loading */
  if (error || fetchErr) {
    const err = (error ?? fetchErr)!;
    return (
      <div
        {...a11y}
        className={['rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive', className ?? ''].join(' ')}
      >
        {err.message ?? 'Something went wrong.'}
      </div>
    );
  }
  if (isLoading || !geoJson) {
    return (
      <div className={['space-y-3', className ?? ''].join(' ')} {...a11y}>
        {title && <div className="text-lg font-semibold text-foreground">{title}</div>}
        <div className="animate-pulse rounded-lg bg-muted" style={{ height: typeof height === 'number' ? `${height}px` : height }} />
      </div>
    );
  }

  const chartHeight = typeof height === 'number' ? height : undefined;

  return (
    <section
      {...a11y}
      className={['@container rounded-lg border border-border bg-card shadow-sm p-3 @md:p-4', className ?? ''].join(' ')}
    >
      {(title || description) && (
        <header className="mb-3 min-w-0">
          {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground truncate">{description}</p>}
        </header>
      )}

      <figure className="w-full">
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
            {geoJson.features.map((feature) => {
              const code = getIso2(feature.properties);
              const name = getName(feature.properties);
              const value = data[code] ?? 0;

              // *** LINE THAT CAUSED THE ERROR — fixed ***
              // TS suggests converting to `unknown` first when unions don’t overlap.
              // We validated `feature` above, so this cast is safe and avoids `any`. :contentReference[oaicite:6]{index=6}
              const d = pathGenerator(feature as unknown as GeoPermissibleObjects) ?? '';
              const color = mixOKLCH(normalizeValue(value, scaleMeta));

              return (
                <path
                  key={code || name}
                  d={d}
                  fill={color}
                  stroke="var(--color-border)"
                  strokeWidth={0.5}
                  className="transition-colors hover:fill-[color-mix(in_oklch,var(--color-accent)20%,currentColor)] focus-visible:fill-[color-mix(in_oklch,var(--color-ring)20%,currentColor)]"
                  tabIndex={0}
                  role="gridcell"
                  aria-label={`${name}, ${valueFormatter(value)}`}
                  onMouseEnter={(e: React.MouseEvent<SVGPathElement>) =>
                    setHovered({ code, name, value, x: e.clientX, y: e.clientY })
                  }
                  onMouseMove={(e: React.MouseEvent<SVGPathElement>) =>
                    setHovered((h) => (h ? { ...h, x: e.clientX, y: e.clientY } : h))
                  }
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onCountryClick?.(code, name, value)}
                  onFocus={() => onCountryFocus?.(code, name, value)}
                />
              );
            })}
          </g>
        </svg>
      </figure>

      {hovered && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-20 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-sm"
          style={{ left: `${hovered.x}px`, top: `${hovered.y + 10}px`, transform: 'translateX(-50%)' }}
        >
          <div className="mb-1 flex items-center gap-2 font-medium">
            <Image
              src={`https://flagcdn.com/24x18/${hovered.code.toLowerCase()}.png`}
              alt={`${hovered.name} flag`}
              width={24}
              height={18}
              loading="lazy"
            />
            {hovered.name}
          </div>
          <div className="tabular-nums text-foreground/90">{valueFormatter(hovered.value)}</div>
        </div>
      )}
    </section>
  );
}
