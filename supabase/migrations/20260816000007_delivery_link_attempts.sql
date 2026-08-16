-- Backing table for rate-limiting the buyer delivery-confirmation link
-- (supabase/functions/delivery-link-confirm, reached via /confirm-delivery
-- ?order=<uuid>&confirm=... or &preference=...). The order id is an
-- unguessable UUID, but until now that endpoint had no attempt limit at
-- all -- unlike delivery-pin-confirm's delivery_pin_attempts table, which
-- this mirrors. Only the service-role key (used exclusively by that edge
-- function) ever touches this table -- RLS is enabled with no policies, so
-- anon/authenticated get zero access, same as a normal default-deny table.
CREATE TABLE IF NOT EXISTS public.delivery_link_attempts (
  id bigserial PRIMARY KEY,
  ip text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_link_attempts_ip_created_idx
  ON public.delivery_link_attempts (ip, created_at);

ALTER TABLE public.delivery_link_attempts ENABLE ROW LEVEL SECURITY;
