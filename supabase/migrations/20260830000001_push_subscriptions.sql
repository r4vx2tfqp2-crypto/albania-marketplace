-- Web Push subscriptions, one row per browser/device a user has enabled
-- notifications on (a person can have several -- phone + laptop, etc).
-- Written directly by the client (the subscribe/unsubscribe actions are
-- the user managing their own notification settings, same trust level as
-- them editing their own profile), read only by the send-push edge
-- function via the service-role key to actually deliver a push.
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON public.push_subscriptions (user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- A user can see/add/remove only their own subscriptions -- no policy
-- grants reading anyone else's, and there's deliberately no SELECT
-- policy for anon at all (nothing here is meant to be publicly listable).
CREATE POLICY "Users manage their own push subscriptions"
ON public.push_subscriptions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
