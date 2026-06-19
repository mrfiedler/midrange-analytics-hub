import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const NBA_HEADERS = {
  Host: "stats.nba.com",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.nba.com/",
  Origin: "https://www.nba.com",
  "x-nba-stats-origin": "stats",
  "x-nba-stats-token": "true",
  Connection: "keep-alive",
} as const;

const ProxyInput = z.object({
  endpoint: z.string().min(1).max(80).regex(/^[a-zA-Z0-9_]+$/),
  params: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
});

/**
 * Proxy para stats.nba.com.
 * A NBA bloqueia IPs de datacenter — esta função PODE falhar de forma intermitente.
 * Frontend deve sempre tratar { ok: false } como cenário esperado e cair em fallback.
 */
export const nbaStatsProxy = createServerFn({ method: "POST" })
  .inputValidator((d) => ProxyInput.parse(d))
  .handler(async ({ data }) => {
    try {
      const url = new URL(`https://stats.nba.com/stats/${data.endpoint}`);
      Object.entries(data.params).forEach(([k, v]) =>
        url.searchParams.set(k, String(v)),
      );

      const res = await fetch(url.toString(), {
        headers: NBA_HEADERS,
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        return { ok: false as const, status: res.status, error: `stats.nba.com ${res.status}` };
      }
      const json = await res.json();
      return { ok: true as const, data: json };
    } catch (err) {
      return { ok: false as const, status: 0, error: (err as Error).message };
    }
  });
