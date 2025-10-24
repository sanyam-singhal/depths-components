// components/depths/lib/ringBuffer.ts
// Ring buffer + external store for useSyncExternalStore, with a CACHED snapshot.

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
      // overwrite oldest
      this.buf[this.start] = x;
      this.start = (this.start + 1) % this.capacity;
    }
  }
  // newest-first to match the UI
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
    const cur = this.toArrayNewestFirst().reverse(); // oldest-first
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

// --- External store (rAF-batched) ---
// IMPORTANT: getSnapshot must return the SAME reference until data actually changes.
type Listener = () => void;

export class RingStore<T> {
  private rbuf: RingBuffer<T>;
  private listeners = new Set<Listener>();
  private raf: number | null = null;
  private snapshot: T[] = []; // CACHED snapshot reference

  constructor(capacity: number) {
    this.rbuf = new RingBuffer<T>(capacity);
    // snapshot is already an empty array; leave as-is until the first change.
  }

  // Producer API (mutate + schedule a batched recompute)
  push(x: T) { this.rbuf.push(x); this.schedule(); }
  setCapacity(n: number) { this.rbuf.setCapacity(n); this.schedule(); }
  clear() { this.rbuf.clear(); this.schedule(); }

  // useSyncExternalStore API — MUST be referentially stable until a change.
  getSnapshot = (): T[] => this.snapshot;

  subscribe = (l: Listener) => {
    this.listeners.add(l);
    return () => { this.listeners.delete(l); };
  };

  // Batch recomputation of the cached snapshot + notify listeners once per frame.
  private schedule() {
    if (typeof window === 'undefined') {
      // SSR / non-DOM: recompute and notify synchronously.
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
    // Replace the cached snapshot ONLY here, not during render.
    this.snapshot = this.rbuf.toArrayNewestFirst();
    this.listeners.forEach(fn => fn());
  }
}

export function makeRingStore<T>(capacity: number) {
  return new RingStore<T>(capacity);
}
