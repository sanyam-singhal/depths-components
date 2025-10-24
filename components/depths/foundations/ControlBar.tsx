// components/depths/foundations/ControlBar.tsx
'use client';

import * as React from 'react';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

/**
 * Minimal API:
 *   - title?: string
 *   - controls: readonly ControlSpec[]
 *
 * Self-managed internal state. No external value/onChange required.
 * No imports from types.ts — all types defined here.
 */

/** Option shape used by selects. */
type SelectOption<V extends string | number> = Readonly<{
  label: string;
  value: V;
}>;

/** Union of select option arrays: string or number values. */
type SelectOptions =
  | ReadonlyArray<SelectOption<string>>
  | ReadonlyArray<SelectOption<number>>;

/** Select control dictionary. */
type SelectSpec = Readonly<{
  type: 'select';
  key: string;              // unique key for state
  label?: string;
  options: SelectOptions;   // values define if the control is numeric or stringly
  defaultValue?: string | number;
}>;

/** Slider control dictionary. */
type SliderSpec = Readonly<{
  type: 'slider';
  key: string;              // unique key for state
  label?: string;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  showValueBadge?: boolean; // default: true
}>;

export type ControlSpec = SelectSpec | SliderSpec;

export type ControlBarProps = Readonly<{
  title?: string;
  controls: ReadonlyArray<ControlSpec>;
}>;

/** Type guards for runtime narrowing (no `any`). */
function isSelect(c: ControlSpec): c is SelectSpec {
  return c.type === 'select';
}
function isSlider(c: ControlSpec): c is SliderSpec {
  return c.type === 'slider';
}
function isNumberOptions(
  options: SelectOptions,
): options is ReadonlyArray<SelectOption<number>> {
  return options.length > 0 && typeof options[0].value === 'number';
}

/** Build initial internal state from controls. */
function buildInitialState(controls: ReadonlyArray<ControlSpec>): Record<string, string | number> {
  const acc: Record<string, string | number> = {};
  for (const c of controls) {
    if (isSelect(c)) {
      if (typeof c.defaultValue !== 'undefined') {
        acc[c.key] = c.defaultValue;
      } else if (c.options.length > 0) {
        acc[c.key] = c.options[0].value as string | number;
      }
    } else {
      // slider
      acc[c.key] = typeof c.defaultValue === 'number' ? c.defaultValue : c.min;
    }
  }
  return acc;
}

export function ControlBar(props: ControlBarProps): React.JSX.Element {
  const { title, controls } = props;

  // Self-managed state: key -> string|number
  const [state, setState] = React.useState<Record<string, string | number>>(
    () => buildInitialState(controls),
  );

  // If the control definitions change (labels/options/min/max), refresh defaults.
  React.useEffect(() => {
    setState(buildInitialState(controls));
  }, [controls]);

  return (
    <section
      className={[
        '@container',
        'rounded-lg border border-border bg-card p-3 @md:p-4 shadow-sm',
      ].join(' ')}
    >
      {title ? (
        <header className="mb-2 text-lg font-semibold text-foreground">
          {title}
        </header>
      ) : null}

      <div
        className={[
          'grid gap-3 @md:gap-4',
          // Tailwind v4 arbitrary grid template; container-friendly responsive packing.
          // https://tailwindcss.com/docs/grid-template-columns
          'grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]',
        ].join(' ')}
      >
        {controls.map((c) => {
          if (isSelect(c)) {
            const isNumeric = isNumberOptions(c.options);
            const current = state[c.key];
            const display = String(current ?? '');

            return (
              <div key={c.key} className="flex min-w-0 flex-col gap-1">
                {c.label ? (
                  <label className="text-sm font-medium text-muted-foreground">
                    {c.label}
                  </label>
                ) : null}
                <Select
                  value={display}
                  // shadcn/Radix Select emits strings; parse to number iff options are numeric.
                  // https://ui.shadcn.com/docs/components/slider (Radix usage) / Select emits strings
                  onValueChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      [c.key]: isNumeric ? Number(v) : v,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={c.label ?? c.key} />
                  </SelectTrigger>
                  <SelectContent>
                    {c.options.map((opt) => (
                      <SelectItem key={String(opt.value)} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          if (isSlider(c)) {
            const showBadge = c.showValueBadge ?? true;
            const raw = state[c.key];
            const sval = typeof raw === 'number' ? raw : Number(raw);

            return (
              <div key={c.key} className="flex min-w-0 flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    {c.label ?? c.key}
                  </label>
                  {showBadge && (
                    <span className="rounded bg-muted px-2 py-0.5 text-xs tabular-nums text-foreground/80">
                      {sval}
                    </span>
                  )}
                </div>
                <Slider
                  min={c.min}
                  max={c.max}
                  step={c.step ?? 1}
                  value={[sval]}
                  // Radix/Slider uses number[] for controlled values:
                  // https://www.radix-ui.com/primitives/docs/components/slider
                  onValueChange={(arr) =>
                    setState((prev) => ({
                      ...prev,
                      [c.key]: typeof arr[0] === 'number' ? arr[0] : sval,
                    }))
                  }
                  className="w-full"
                />
              </div>
            );
          }

          // Exhaustiveness — ensures future control kinds must render here
          return null as never;
        })}
      </div>
    </section>
  );
}
