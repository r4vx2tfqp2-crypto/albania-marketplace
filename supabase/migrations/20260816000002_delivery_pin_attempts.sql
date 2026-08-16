-- Backing table for rate-limiting the courier delivery-PIN lookup
-- (supabase/functions/delivery-pin-confirm), which replaces the previous
-- unauthenticated, unrestricted `orders` table scan by 4-digit PIN.
-- Only the service-role key (used exclusively by that edge function) ever
-- touches this table -- RLS is enabled with no policies, so anon/
-- authenticated get zero access, same as a normal default-deny table.
CREATE TABLE IF NOT EXISTS public.delivery_pin_attempts (
  id bigserial PRIMARY KEY,
  ip text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_pin_attempts_ip_created_idx
  ON public.delivery_pin_attempts (ip, created_at);

ALTER TABLE public.delivery_pin_attempts ENABLE ROW LEVEL SECURITY;
