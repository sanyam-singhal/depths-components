'use client';
import * as React from 'react';
import type { BaseChartProps, GraphNode, GraphEdge } from '@/components/depths/lib/types';

export interface GraphServiceMapProps extends BaseChartProps { nodes: GraphNode[]; edges: GraphEdge[]; height?: number|string; layout?: 'circle'|'grid'; onSelectNode?: (id: string)=>void; }
export function GraphServiceMap({ nodes, edges, className, height=420, layout='circle', onSelectNode }: GraphServiceMapProps) {
  const size = React.useMemo(()=>({ w: 800, h: 500 }),[]);
  const positions = React.useMemo(()=>{
    if(layout==='grid'){
      const cols = Math.ceil(Math.sqrt(nodes.length));
      const rows = Math.ceil(nodes.length/cols);
      const cellW = size.w/(cols+1);
      const cellH = size.h/(rows+1);
      return nodes.map((n, i)=>{
        const r = Math.floor(i/cols);
        const c = i % cols;
        return { id: n.id, x: (c+1)*cellW, y: (r+1)*cellH };
      });
    } else {
      const cx = size.w/2;
      const cy = size.h/2;
      const radius = Math.min(size.w, size.h) * 0.38;
      return nodes.map((n,i)=>{
        const angle = (i/nodes.length) * Math.PI*2;
        return { id: n.id, x: cx + Math.cos(angle)*radius, y: cy + Math.sin(angle)*radius };
      });
    }
  }, [nodes, layout, size]);
  const byId = React.useMemo(()=>Object.fromEntries(positions.map(p=>[p.id,p])),[positions]);
  const [hover, setHover] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);
  return (
    <div className={['rounded-md border bg-white dark:bg-neutral-900 p-2', className||''].join(' ')} style={{height: typeof height==='number'?`${height}px`:height}}>
      <svg viewBox={`0 0 ${size.w} ${size.h}`} className="w-full h-full">
        <g>
          {edges.map((e, i)=>{
            const a = byId[e.source];
            const b = byId[e.target];
            if(!a || !b) return null;
            const isActive = hover===e.source || hover===e.target || selected===e.source || selected===e.target;
            const stroke = isActive ? 'var(--color-chart-1, #4f46e5)' : 'rgba(0,0,0,0.25)';
            const sw = isActive ? 2.5 : 1.2;
            return <line key={e.source+'-'+e.target+String(i)} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeWidth={sw} />;
          })}
        </g>
        <g>
          {positions.map((p,i)=>{
            const isActive = hover===p.id || selected===p.id;
            const r = isActive ? 10 : 8;
            return (
              <g key={p.id+String(i)} transform={`translate(${p.x},${p.y})`}>
                <circle r={r} fill={'var(--color-chart-1, #4f46e5)'} onMouseEnter={()=>setHover(p.id)} onMouseLeave={()=>setHover(null)} onClick={()=>{ setSelected(p.id); onSelectNode?.(p.id); }} />
                <text x={0} y={r+14} textAnchor="middle" className="text-xs fill-neutral-700 dark:fill-neutral-300">{p.id}</text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
