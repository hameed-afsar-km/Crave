interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

export function rateLimit(key: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the sliding window
  entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);

  if (entry.timestamps.length >= MAX_REQUESTS) {
    const oldest = entry.timestamps[0];
    const resetIn = Math.ceil((oldest + WINDOW_MS - now) / 1000);
    return { allowed: false, remaining: 0, resetIn };
  }

  entry.timestamps.push(now);
  return { allowed: true, remaining: MAX_REQUESTS - entry.timestamps.length, resetIn: 0 };
}

// Cleanup stale entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}, 60_000);
