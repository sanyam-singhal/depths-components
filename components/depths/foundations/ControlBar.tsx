'use client';
import * as React from 'react';
import type { ControlPanelState } from '@/components/depths/lib/types';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useActionState } from 'react';
export interface ControlBarProps { value: ControlPanelState; onChange: (next: ControlPanelState)=>void; ranges?: string[]; windows?: string[]; groups?: string[]; }
async function reducer(prev: ControlPanelState, formData: FormData): Promise<ControlPanelState> { return { range: String(formData.get('range')??prev.range), window: String(formData.get('window')??prev.window), groupBy: String(formData.get('groupBy')??prev.groupBy??''), topK: Number(formData.get('topK')??prev.topK??10), showLegend: String(formData.get('showLegend')??(prev.showLegend?'on':''))==='on' }; }
export function ControlBar({ value, onChange, ranges=['1h','6h','24h','7d','30d'], windows=['1m','5m','15m','1h'], groups=[] }: ControlBarProps) {
  const [state, formAction] = useActionState(reducer, value);
  React.useEffect(()=>{ onChange(state); },[state, onChange]);
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3 p-3 rounded-md border bg-white dark:bg-neutral-900">
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600">Range</span>
        <Select name="range" defaultValue={value.range} onValueChange={(v)=>formAction(new FormData(Object.assign(document.createElement('form'),{elements:[]})))}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Range" /></SelectTrigger>
          <SelectContent>{ranges.map(r=>(<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600">Window</span>
        <Select name="window" defaultValue={value.window}>
          <SelectTrigger className="w-28"><SelectValue placeholder="Window" /></SelectTrigger>
          <SelectContent>{windows.map(w=>(<SelectItem key={w} value={w}>{w}</SelectItem>))}</SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600">Group</span>
        <Select name="groupBy" defaultValue={value.groupBy||''}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Dimension" /></SelectTrigger>
          <SelectContent><SelectItem value="">None</SelectItem>{groups.map(g=>(<SelectItem key={g} value={g}>{g}</SelectItem>))}</SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-neutral-600">Top K</span>
        <input type="range" name="topK" min={1} max={50} defaultValue={value.topK??10} className="w-40" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600">Legend</span>
        <Switch name="showLegend" defaultChecked={value.showLegend} />
      </div>
    </form>
  );
}