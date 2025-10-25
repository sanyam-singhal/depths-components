'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/* ───────────────────────────────── helpers ───────────────────────────────── */

export class RingBuffer<T> {
  private buf: T[];
  private start = 0; // index of oldest
  private size = 0;
  constructor(private capacity: number) {
    this.buf = new Array<T>(capacity);
  }
  push(x: T) {
    if (this.size < this.capacity) {
      this.buf[(this.start + this.size) % this.capacity] = x;
      this.size++;
    } else {
      this.buf[this.start] = x;
      this.start = (this.start + 1) % this.capacity;
    }
  }
  toArrayNewestFirst(): T[] {
    const out = new Array<T>(this.size);
    for (let i = 0; i < this.size; i++) {
      const idx = (this.start + this.size - 1 - i) % this.capacity;
      out[i] = this.buf[idx];
    }
    return out;
  }
  setCapacity(n: number) {
    if (n === this.capacity) return;
    const cur = this.toArrayNewestFirst().reverse();
    this.capacity = n;
    this.buf = new Array<T>(n);
    this.start = 0;
    this.size = 0;
    for (const x of cur.slice(0, n)) this.push(x);
  }
  clear() {
    this.start = 0;
    this.size = 0;
  }
}

type Listener = () => void;

export class RingStore<T> {
  private rbuf: RingBuffer<T>;
  private listeners = new Set<Listener>();
  private raf: number | null = null;
  private snapshot: T[] = [];

  constructor(capacity: number) {
    this.rbuf = new RingBuffer<T>(capacity);
  }

  push(x: T) {
    this.rbuf.push(x);
    this.schedule();
  }
  setCapacity(n: number) {
    this.rbuf.setCapacity(n);
    this.schedule();
  }
  clear() {
    this.rbuf.clear();
    this.schedule();
  }

  getSnapshot = (): T[] => this.snapshot;

  subscribe = (l: Listener) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };

  private schedule() {
    if (typeof window === 'undefined') {
      this.flush();
      return;
    }
    if (this.raf != null) return;
    this.raf = window.requestAnimationFrame(() => {
      this.raf = null;
      this.flush();
    });
  }

  private flush() {
    this.snapshot = this.rbuf.toArrayNewestFirst();
    this.listeners.forEach((fn) => fn());
  }
}

export function makeRingStore<T>(capacity: number) {
  return new RingStore<T>(capacity);
}

/* ───────────────────────────────── types ───────────────────────────────── */

export interface BaseChartProps {
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export type LogSeverity = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | string;

export interface LogRow {
  ts: number;
  severity: LogSeverity;
  service: string;
  body: string;
  [k: string]: unknown;
}

export interface LiveTailListProps extends BaseChartProps {
  title?: string;
  description?: string;
  sseUrl: string;
  bufferSize?: number;
  initialPaused?: boolean;
  severityFilter?: readonly LogSeverity[];
  searchQuery?: string;
  height?: number | string;
  onCopy?: (row: LogRow) => void;
}

/* ───────────────────────────────── component ─────────────────────────────── */

export function LiveTailList({
  title,
  description,
  sseUrl,
  bufferSize = 50,
  initialPaused = true,
  severityFilter,
  searchQuery,
  height = 320,
  className,
  isLoading,
  error,
  onCopy,
  ...a11y
}: LiveTailListProps): React.JSX.Element {
  const storeRef = React.useRef(makeRingStore<LogRow>(bufferSize));
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [paused, setPaused] = React.useState<boolean>(initialPaused);
  const [query, setQuery] = React.useState(searchQuery ?? '');
  const deferredQuery = React.useDeferredValue(query);
  const [sseError, setSseError] = React.useState<Error | null>(null);
  const [severityHidden, setSeverityHidden] = React.useState<ReadonlySet<LogSeverity>>(new Set());

  React.useEffect(() => {
    storeRef.current.setCapacity(bufferSize);
  }, [bufferSize]);

  const snapshot = React.useSyncExternalStore(
    storeRef.current.subscribe,
    storeRef.current.getSnapshot,
    storeRef.current.getSnapshot
  );

  // SSE lifecycle (no clear on pause)
  React.useEffect(() => {
    if (paused) {
      setSseError(null);
      return;
    }
    const es = new EventSource(sseUrl);
    es.addEventListener('message', (ev: MessageEvent<string>) => {
      try {
        const data = JSON.parse(ev.data) as LogRow;
        storeRef.current.push(data);
      } catch {
        /* ignore malformed */
      }
    });
    es.addEventListener('error', () => {
      setSseError(new Error('Failed to connect to log stream'));
    });
    return () => {
      es.close();
    };
  }, [sseUrl, paused]);

  const filtered = React.useMemo(() => {
    let cur = snapshot;
    if (severityFilter?.length) {
      cur = cur.filter((r) => severityFilter.includes(r.severity));
    }
    if (severityHidden.size > 0) {
      cur = cur.filter((r) => !severityHidden.has(r.severity));
    }
    if (deferredQuery.trim()) {
      const q = deferredQuery.toLowerCase();
      cur = cur.filter(
        (r) => r.body.toLowerCase().includes(q) || r.service.toLowerCase().includes(q)
      );
    }
    return cur;
  }, [snapshot, severityFilter, deferredQuery, severityHidden]);

  // Error/loading states
  if (error || sseError) {
    return (
      <section
        {...a11y}
        className={['rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive', className].join(' ')}
      >
        {error?.message ?? sseError?.message ?? 'Error loading logs'}
      </section>
    );
  }

  if (isLoading) {
    return (
      <section
        {...a11y}
        className={['rounded-lg border border-border bg-card p-3 @md:p-4 shadow-sm', className].join(' ')}
      >
        {title && <div className="text-lg font-semibold text-foreground">{title}</div>}
        {description && <p className="text-sm text-muted-foreground truncate">{description}</p>}
        <div className="mt-3 h-9 w-full animate-pulse rounded bg-muted" />
        <div className="mt-3 h-[280px] animate-pulse rounded bg-muted" />
      </section>
    );
  }

  const chartHeight = typeof height === 'number' ? `${height}px` : height;
  const severityColors: Record<LogSeverity, string> = {
    error: 'var(--color-destructive)',
    fatal: 'var(--color-destructive)',
    warn: 'color-mix(in oklch, var(--color-destructive) 60%, var(--color-accent))',
    info: 'var(--color-chart-2)',
    debug: 'var(--color-chart-3)',
    trace: 'var(--color-chart-4)',
  };

  return (
    <section
      {...a11y}
      className={['@container rounded-lg border border-border bg-card shadow-sm p-3 @md:p-4', className].join(' ')}
      style={{ height: chartHeight }}
    >
      {(title || description || true) && (
        <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            {title && <div className="text-lg font-semibold text-foreground">{title}</div>}
            {description && <p className="text-sm text-muted-foreground truncate">{description}</p>}
          </div>
          <div role="toolbar" aria-label="Log controls" className="flex w-full flex-wrap items-center gap-2 @md:w-auto">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search logs"
              className="w-full @md:w-64"
            />
            <div className="flex flex-wrap gap-2">
              {['trace', 'debug', 'info', 'warn', 'error', 'fatal'].map((s) => {
                const off = severityHidden.has(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setSeverityHidden((prev) => {
                        const next = new Set(prev);
                        if (off) next.delete(s);
                        else next.add(s);
                        return next;
                      })
                    }
                    aria-pressed={!off}
                    className={[
                      'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium',
                      off ? 'opacity-50' : '',
                      'border-border bg-card hover:shadow-sm',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    ].join(' ')}
                    title={off ? `Show ${s}` : `Hide ${s}`}
                  >
                    <span
                      aria-hidden
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                      style={{ background: severityColors[s] ?? 'var(--color-foreground)' }}
                    />
                    <span className="text-foreground/90 uppercase">{s}</span>
                  </button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaused((p) => !p)}
              className="shrink-0"
            >
              {paused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => storeRef.current.clear()}
              className="shrink-0"
            >
              Clear
            </Button>
          </div>
        </header>
      )}

      <div ref={containerRef} className="md:h-[calc(69%)] h-[calc(50%)] overflow-auto rounded-lg border border-border bg-card overflow-x-auto">
        <table className="min-w-full text-sm font-mono table-fixed">
          {title && <caption className="sr-only">{title}</caption>}
          <colgroup>
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '60%' }} />
            <col style={{ width: '5%' }} />
          </colgroup>
          <thead>
            <tr>
              <th
                className="sticky top-0 z-10 bg-muted/60 px-3 py-2.5 text-left font-medium text-foreground/90 @md:py-3"
              >
                Time
              </th>
              <th
                className="sticky top-0 z-10 bg-muted/60 px-3 py-2.5 text-left font-medium text-foreground/90 @md:py-3"
              >
                Severity
              </th>
              <th
                className="sticky top-0 z-10 bg-muted/60 px-3 py-2.5 text-left font-medium text-foreground/90 @md:py-3"
              >
                Service
              </th>
              <th
                className="sticky top-0 z-10 bg-muted/60 px-3 py-2.5 text-left font-medium text-foreground/90 @md:py-3"
              >
                Message
              </th>
              <th
                className="sticky top-0 z-10 bg-muted/60 px-3 py-2.5 text-right font-medium text-foreground/90 @md:py-3"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="text-card-foreground">
            {filtered.map((row, i) => {
              const t = new Date(row.ts).toLocaleTimeString(undefined, {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
              return (
                <tr
                  key={`${row.ts}-${row.service}-${i}`}
                  className="border-t border-border odd:bg-muted/[0.35] hover:bg-muted/50"
                >
                  <td className="px-3 py-2.5 tabular-nums text-[clamp(11px,1.6cqi,13px)] truncate">
                    {t}
                  </td>
                  <td className="px-3 py-2.5 truncate">
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-xs uppercase"
                      style={{ background: severityColors[row.severity] ?? 'var(--color-muted)' }}
                    >
                      {row.severity}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 truncate">{row.service}</td>
                  <td className="px-3 py-2.5 whitespace-pre-wrap break-all">{row.body}</td>
                  <td className="px-3 py-2.5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCopy?.(row)}
                      title="Copy log"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Copy
                    </Button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  No logs available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <div>{filtered.length} logs displayed</div>
      </footer>
    </section>
  );
}