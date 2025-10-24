// components/depths/foundations/ControlBar.tsx
'use client';
import * as React from 'react';
import type { ControlPanelState } from '@/components/depths/lib/types';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useActionState, startTransition } from 'react';

export interface ControlBarProps {
  value: ControlPanelState;
  onChange: (next: ControlPanelState) => void;
  ranges?: string[];
  windows?: string[];
  groups?: string[];
}

async function reducer(prev: ControlPanelState, formData: FormData): Promise<ControlPanelState> {
  const rawGroup = formData.get('groupBy'); // "" when clearing
  return {
    range: String(formData.get('range') ?? prev.range),
    window: String(formData.get('window') ?? prev.window),
    // coerce "" or null to undefined so state actually clears
    groupBy: rawGroup === null || rawGroup === '' ? undefined : String(rawGroup),
    topK: Number(formData.get('topK') ?? prev.topK ?? 10),
    showLegend: String(formData.get('showLegend') ?? (prev.showLegend ? 'on' : '')) === 'on',
  };
}

export function ControlBar({
  value,
  onChange,
  ranges = ['1h','6h','24h','7d','30d'],
  windows = ['1m','5m','15m','1h'],
  groups = [],
}: ControlBarProps) {
  const [state, dispatch] = useActionState(reducer, value);
  React.useEffect(() => { onChange(state); }, [state, onChange]);

  // IMPORTANT: detect provided keys so undefined can clear the field
  const commit = React.useCallback((partial: Partial<ControlPanelState>) => {
    const fd = new FormData();

    const hasGroupBy = Object.prototype.hasOwnProperty.call(partial, 'groupBy');
    const nextGroup   = hasGroupBy ? partial.groupBy : state.groupBy;

    fd.set('range',  partial.range  ?? state.range);
    fd.set('window', partial.window ?? state.window);
    fd.set('groupBy', nextGroup ?? ''); // when clearing, write "" into FormData
    fd.set('topK', String(partial.topK ?? state.topK ?? 10));
    fd.set('showLegend', (partial.showLegend ?? state.showLegend) ? 'on' : '');

    startTransition(() => dispatch(fd)); // keep the action inside a transition
  }, [dispatch, state]);

  return (
    <form className="flex flex-wrap items-center gap-3 p-3 rounded-md border bg-white dark:bg-neutral-900">
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600">Range</span>
        <Select defaultValue={value.range} onValueChange={(v)=>commit({ range: v })}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Range" /></SelectTrigger>
          <SelectContent>{ranges.map(r=> (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600">Window</span>
        <Select defaultValue={value.window} onValueChange={(v)=>commit({ window: v })}>
          <SelectTrigger className="w-28"><SelectValue placeholder="Window" /></SelectTrigger>
          <SelectContent>{windows.map(w=> (<SelectItem key={w} value={w}>{w}</SelectItem>))}</SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600">Group</span>
        <Select
          defaultValue={value.groupBy ?? 'none'}
          onValueChange={(v) => commit({ groupBy: v === 'none' ? undefined : v })}
        >
          <SelectTrigger className="w-40"><SelectValue placeholder="Dimension" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {groups.map(g => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-neutral-600">Top K</span>
        <input
          type="range" min={1} max={50} defaultValue={value.topK ?? 10} className="w-40"
          onChange={(e)=>commit({ topK: Number(e.currentTarget.value) })}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600">Legend</span>
        <Switch defaultChecked={value.showLegend} onCheckedChange={(checked)=>commit({ showLegend: checked })} />
      </div>
    </form>
  );
}
