// In-memory TTL cache for server functions. Mitigates upstream rate limits
// (balldontlie 429s, stats.nba.com throttling) within a single Worker isolate.

type Entry<T> = { value: T; expires: number };
const store = new Map<string, Entry<unknown>>();

export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expires > now) return hit.value;
  const value = await loader();
  store.set(key, { value, expires: now + ttlMs });
  // Soft cap to avoid unbounded growth
  if (store.size > 500) {
    const oldest = [...store.entries()].sort((a, b) => a[1].expires - b[1].expires)[0]?.[0];
    if (oldest) store.delete(oldest);
  }
  return value;
}
