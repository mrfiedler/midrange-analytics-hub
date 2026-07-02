/**
 * Two-tier TTL cache for server functions.
 *
 * L1 - in-memory Map, scoped to a single Worker isolate. Sub-millisecond hit,
 *      but does NOT survive between serverless invocations / instances (which
 *      is exactly the "same query sometimes right, sometimes wrong" bug on
 *      Vercel with cold starts).
 *
 * L2 - Supabase `public.cache_entries` table, shared across every isolate and
 *      every instance. First isolate to fetch upstream writes here; every
 *      subsequent invocation (anywhere) reads from L2 until the TTL expires.
 *
 * Read order:  L1 hit -> L2 hit -> upstream loader -> populate both tiers.
 * Write:       always populate L1; best-effort populate L2 (upsert) without
 *              blocking the response - a Supabase blip must never fail the
 *              user-facing request.
 */

type Entry<T> = { value: T; expires: number };
const memory = new Map<string, Entry<unknown>>();

async function getAdmin() {
  // Dynamic import - supabaseAdmin is a .server.ts module and must not appear
  // in the client module graph via static import from a shared file that
  // .functions.ts imports.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function readL2<T>(key: string, now: number): Promise<T | undefined> {
  try {
    const admin = await getAdmin();
    const { data, error } = await admin
      .from("cache_entries")
      .select("value, expires_at")
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return undefined;
    if (new Date(data.expires_at).getTime() <= now) return undefined;
    return data.value as T;
  } catch {
    return undefined;
  }
}

function writeL2<T>(key: string, value: T, expiresMs: number) {
  // Fire-and-forget - never block the caller on the persistent write.
  void (async () => {
    try {
      const admin = await getAdmin();
      await admin.from("cache_entries").upsert(
        {
          key,
          value: value as never,
          expires_at: new Date(expiresMs).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );
    } catch {
      /* ignore - L1 still serves this isolate until TTL */
    }
  })();
}

export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now();

  const l1 = memory.get(key) as Entry<T> | undefined;
  if (l1 && l1.expires > now) return l1.value;

  const l2 = await readL2<T>(key, now);
  if (l2 !== undefined) {
    memory.set(key, { value: l2, expires: now + ttlMs });
    return l2;
  }

  const value = await loader();
  const expires = now + ttlMs;
  memory.set(key, { value, expires });
  writeL2(key, value, expires);

  if (memory.size > 500) {
    const oldest = [...memory.entries()].sort((a, b) => a[1].expires - b[1].expires)[0]?.[0];
    if (oldest) memory.delete(oldest);
  }
  return value;
}
