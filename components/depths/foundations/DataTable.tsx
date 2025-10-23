'use client';
import * as React from 'react';
import type { BaseChartProps, TableColumn, TableRow } from '@/components/depths/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export interface DataTableProps extends BaseChartProps { columns: TableColumn[]; rows: TableRow[]; total?: number; onExportCSV?: () => void; searchable?: boolean; }
export function DataTable({ columns, rows, total, className, onExportCSV, searchable=true }: DataTableProps) {
  const [query, setQuery] = React.useState('');
  const filtered = React.useMemo(()=>{
    if(!query) return rows;
    const q = query.toLowerCase();
    return rows.filter(r=>Object.values(r).some(v=>String(v).toLowerCase().includes(q)));
  },[rows, query]);
  return (
    <div className={['w-full', className||''].join(' ')}>
      <div className="flex items-center justify-between gap-2 mb-2">
        {searchable && <Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search" className="w-64" />}
        <div className="text-sm text-neutral-500">{total!=null?`${filtered.length} of ${total}`:`${filtered.length}`}</div>
        {onExportCSV && <Button variant="outline" onClick={onExportCSV}>Export CSV</Button>}
      </div>
      <div className="overflow-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-800">
            <tr>{columns.map(c=>(<th key={c.key} className={['px-3 py-2 text-left font-medium', c.align==='right'?'text-right': c.align==='center'?'text-center':'text-left'].join(' ')} style={{width: c.width}}>{c.label}</th>))}</tr>
          </thead>
          <tbody>
            {filtered.map((row, idx)=>(
              <tr key={idx} className="border-t hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                {columns.map(c=>(<td key={c.key} className={['px-3 py-2', c.align==='right'?'text-right': c.align==='center'?'text-center':'text-left'].join(' ')}>{String(row[c.key]??'')}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}