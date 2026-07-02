
CREATE TABLE public.cache_entries (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX cache_entries_expires_idx ON public.cache_entries (expires_at);
GRANT ALL ON public.cache_entries TO service_role;
ALTER TABLE public.cache_entries ENABLE ROW LEVEL SECURITY;
-- No policies: only the server (service role, bypasses RLS) reads/writes this
-- internal HTTP response cache. Client roles have no access by design.
