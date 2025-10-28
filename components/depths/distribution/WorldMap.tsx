// components/depths/distribution/WorldMap.tsx
'use client';

import * as React from 'react';
import { geoPath, geoMercator } from 'd3-geo';

// ── Base props (same shape used in the other charts)
type BaseChartProps = Readonly<{
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
  'aria-label'?: string;
  'aria-describedby'?: string;
}>;

type WorldMapProps = BaseChartProps & Readonly<{
  title?: string;
  description?: string;
  /** ISO-3166-1 alpha-2 (upper case) → value */
  data: Readonly<Record<string, number>>;
  domain?: Readonly<{ min?: number; max?: number }>;
  valueFormatter?: (v: number) => string;
  height?: number | string;
  onCountryClick?: (code: string, name: string, value: number) => void;
  onCountryFocus?: (code: string, name: string, value: number) => void;
}>;

// ── Helpers
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
  for (const v of values) {
    if (Number.isFinite(v)) {
      min = Math.min(min, v);
      max = Math.max(max, v);
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
type ScaleMeta = { kind: 'linear'; min: number; max: number };
function normalizeValue(v: number, m: ScaleMeta): number {
  return clamp01((v - m.min) / (m.max - m.min));
}
function mixOKLCH(t: number, from = 'var(--color-chart-3)', to = 'var(--color-chart-1)'): string {
  const p = Math.round(clamp01(t) * 100);
  return `color-mix(in oklch, ${to} ${p}%, ${from} ${100 - p}%)`;
}

// ── GeoJSON (strict types, no `any`)
type WorldProps = Readonly<{
  // names
  name?: string;
  NAME?: string;
  admin?: string;
  ADMIN?: string;
  name_long?: string;
  NAME_LONG?: string;

  // codes
  iso_a2?: string;
  ISO_A2?: string;
  'ISO3166-1-Alpha-2'?: string;
  wb_a2?: string;
  iso_n3?: string;
  ne_id?: number;
}>;

type PolygonFeature = Readonly<{
  type: 'Feature';
  properties: WorldProps;
  geometry: { type: 'Polygon'; coordinates: ReadonlyArray<ReadonlyArray<ReadonlyArray<number>>> };
}>;
type MultiPolygonFeature = Readonly<{
  type: 'Feature';
  properties: WorldProps;
  geometry: { type: 'MultiPolygon'; coordinates: ReadonlyArray<ReadonlyArray<ReadonlyArray<ReadonlyArray<number>>>> };
}>;
type GeoJsonFeature = PolygonFeature | MultiPolygonFeature;
type GeoJson = Readonly<{
  type: 'FeatureCollection';
  features: ReadonlyArray<GeoJsonFeature>;
}>;

// pick ISO-2 (uppercase) or undefined; we **do not** use `-99`
function getIso2(p: WorldProps): string | undefined {
  const raw =
    p.iso_a2 ?? p.ISO_A2 ?? (p['ISO3166-1-Alpha-2'] as string | undefined) ?? p.wb_a2;
  const up = raw ? raw.toUpperCase() : undefined;
  return !up || up === '-99' ? undefined : up;
}
function getName(p: WorldProps): string {
  return p.name ?? p.NAME ?? p.admin ?? p.ADMIN ?? p.name_long ?? p.NAME_LONG ?? 'Unknown';
}

// ── Component
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

  // fetch GeoJSON from /public
  const [geoJson, setGeoJson] = React.useState<GeoJson | null>(null);
  const [fetchErr, setFetchErr] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/world.geo.json');
        if (!res.ok) throw new Error(`Failed to load world.geo.json (${res.status})`);
        const json = (await res.json()) as GeoJson;
        if (active) setGeoJson(json);
      } catch (e) {
        if (active) setFetchErr(e as Error);
      }
    })();
    return () => { active = false; };
  }, []);

  const values = React.useMemo<readonly number[]>(() => Object.values(data), [data]);
  const [dMin, dMax] = React.useMemo(() => computeDomain(values, domain), [values, domain]);
  const scaleMeta = React.useMemo<ScaleMeta>(() => ({ kind: 'linear', min: dMin, max: dMax }), [dMin, dMax]);

  const projection = React.useMemo(
    () => geoMercator().scale(130).translate([400, 300]),
    [],
  ); // mercator is fine for global overview. :contentReference[oaicite:1]{index=1}

  const pathGenerator = React.useMemo(() => geoPath().projection(projection), [projection]);

  // hover/tooltip (relative to the frame)
  const frameRef = React.useRef<HTMLDivElement>(null);
  const [hover, setHover] = React.useState<{
    code: string | undefined;
    name: string;
    value: number;
    anchor: { x: number; y: number };
  } | null>(null);

  function placeFromMouse(e: React.MouseEvent) {
    const r = frameRef.current?.getBoundingClientRect();
    const x = e.clientX - (r?.left ?? 0);
    const y = e.clientY - (r?.top ?? 0);
    return { x, y };
  }

  // error/loading
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
                const value = data[code ?? ''] ?? 0;

                // d3-geo accepts GeoJSON Feature/Geometry/FeatureCollection (“GeoPermissibleObjects”).
                // TS-safe by inferring the parameter type from the generator. :contentReference[oaicite:2]{index=2}
                const d = pathGenerator(feature as Parameters<typeof pathGenerator>[0]) ?? '';
                const color = mixOKLCH(normalizeValue(value, scaleMeta));

                // stable unique key (avoid `-99` collisions from some datasets)
                const k =
                  (typeof props.ne_id === 'number' ? String(props.ne_id) : undefined) ??
                  props.iso_n3 ??
                  (name ? `${name}-${i}` : String(i));

                return (
                  <path
                    key={k}
                    d={d}
                    fill={color}
                    stroke="var(--color-border)"
                    strokeWidth={0.5}
                    className="transition-colors hover:fill-[color-mix(in_oklch,var(--color-accent)20%,currentColor)] focus-visible:fill-[color-mix(in_oklch,var(--color-ring)20%,currentColor)]"
                    tabIndex={0}
                    role="gridcell"
                    aria-label={`${name}, ${valueFormatter(value)}`}
                    onMouseEnter={(e) => setHover({ code, name, value, anchor: placeFromMouse(e) })}
                    onMouseMove={(e) => setHover((h) => (h ? { ...h, anchor: placeFromMouse(e) } : h))}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => onCountryClick?.(code ?? '', name, value)}
                    onFocus={() => {
                      // center tooltip on the polygon’s centroid when keyboard focusing
                      const [cx, cy] = pathGenerator.centroid(feature as Parameters<typeof pathGenerator>[0]);
                      setHover({ code, name, value, anchor: { x: cx, y: cy } });
                      onCountryFocus?.(code ?? '', name, value);
                    }}
                    onBlur={() => setHover(null)}
                  />
                );
              })}
            </g>
          </svg>

          {/* Tooltip (catalog styling, same as Heatmap) */}
          {hover && (
            <div
              role="tooltip"
              className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-3 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-sm"
              style={{ left: hover.anchor.x, top: hover.anchor.y }}
            >
              <div className="mb-1 font-medium tabular-nums">
                {hover.name}
              </div>
              <div className="tabular-nums">{valueFormatter(hover.value)}</div>
            </div>
          )}
        </div>
      </figure>
    </section>
  );
}
