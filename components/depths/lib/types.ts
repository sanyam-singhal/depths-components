export interface BaseChartProps {
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
  'aria-label'?: string;
  'aria-describedby'?: string;
}
export interface TimeSeriesPoint { t: number; v: number; }
export interface TimeSeries { key: string; points: TimeSeriesPoint[]; }
export interface BandPoint { t: number; mean?: number; min?: number; max?: number; p50?: number; p95?: number; p99?: number; }
export interface BandSeries { key: string; points: BandPoint[]; }
export interface CategoryItem { label: string; value: number; delta?: number; }
export interface DonutSlice { label: string; value: number; }
export interface HistogramData { bins: number[]; counts: number[]; }
export interface HeatmapData { xLabels: string[]; yLabels: string[]; z: number[][]; }
export interface TableColumn { key: string; label: string; width?: number; align?: 'left'|'right'|'center'; }
export type TableRow = Record<string, unknown>;
export interface GraphNode { id: string; group?: string; meta?: Record<string, unknown>; }
export interface GraphEdge { source: string; target: string; weight?: number; label?: string; }
export interface TimelineEvent { t: number; type: string; label?: string; meta?: Record<string, unknown>; }
export interface KPI { label: string; value: number; unit?: string; delta?: number; }
export interface ControlPanelState { range: string; window: string; groupBy?: string; topK?: number; showLegend?: boolean; }