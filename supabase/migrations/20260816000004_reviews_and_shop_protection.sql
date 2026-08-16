-- Found during a full re-audit (2026-08-16), not part of the original two
-- audit passes.

-- ============================================================
-- reviews: missing DELETE policy
-- ============================================================
-- reviews had SELECT (public) and INSERT (own buyer_id) policies but no
-- DELETE policy at all, which fails closed -- meaning the "Fshi" (delete)
-- button already shipped in Reviews.jsx has never actually been able to
-- delete a review; the request silently affects 0 rows.
CREATE POLICY "Users can delete own reviews"
ON public.reviews
FOR DELETE
USING (auth.uid() = buyer_id);

-- ============================================================
-- reviews -> products/shops rating aggregate
-- ============================================================
-- Reviews.jsx wrote the recomputed average directly to products/shops as
-- the REVIEWING user, e.g.:
--   supabase.from("products").update({ rating, review_count }).eq("id", productId)
-- Since "Users can update own products"/"own shops" are scoped to
-- auth.uid() = user_id, that update silently fails (0 rows) for every
-- review except the rare case where someone reviews their own listing --
-- meaning displayed ratings have effectively never reflected real reviews.
-- It was also racy: computed from `[...localReviews, newReview]` client
-- state rather than a fresh read, so concurrent submissions could drift.
-- Replace both with a trigger that recomputes the true aggregate directly
-- from `reviews` (the source of truth) whenever a review is added/removed,
-- writing it via SECURITY DEFINER so it isn't subject to the reviewer's own
-- (correctly restrictive) RLS on products/shops.
CREATE OR REPLACE FUNCTION public.recompute_review_aggregate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_product uuid := COALESCE(NEW.product_id, OLD.product_id);
  target_shop uuid := COALESCE(NEW.shop_id, OLD.shop_id);
  avg_rating numeric;
  cnt integer;
BEGIN
  IF target_product IS NOT NULL THEN
    SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0), COUNT(*)
      INTO avg_rating, cnt
      FROM public.reviews WHERE product_id = target_product;
    UPDATE public.products SET rating = avg_rating, review_count = cnt WHERE id = target_product;
  END IF;

  IF target_shop IS NOT NULL THEN
    SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0), COUNT(*)
      INTO avg_rating, cnt
      FROM public.reviews WHERE shop_id = target_shop;
    UPDATE public.shops SET rating = avg_rating, review_count = cnt WHERE id = target_shop;
  END IF;

  RETURN NULL; -- AFTER trigger, return value ignored
END;
$$;

DROP TRIGGER IF EXISTS reviews_recompute_aggregate_insert ON public.reviews;
CREATE TRIGGER reviews_recompute_aggregate_insert
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.recompute_review_aggregate();

DROP TRIGGER IF EXISTS reviews_recompute_aggregate_delete ON public.reviews;
CREATE TRIGGER reviews_recompute_aggregate_delete
AFTER DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.recompute_review_aggregate();

-- ============================================================
-- shops: privileged columns self-escalation
-- ============================================================
-- "Users can insert own shops" / "Users can update own shops" are correctly
-- scoped to auth.uid() = user_id, but neither has a WITH CHECK restricting
-- WHICH columns an owner can set on their own row. No legitimate app code
-- path ever sets status/verified/subscription_* as the shop owner --
-- AddShop.jsx only ever inserts verified: false and omits status/
-- subscription_* entirely (relying on their column defaults), and
-- status/verified/subscription_* are only ever changed by AdminPanel.jsx /
-- AdminSubscriptions.jsx. That means a shop owner issuing a direct API
-- request (not through the app UI) could self-approve their shop, grant
-- themselves the "verified" trust badge, or activate an unlimited paid
-- subscription plan for free. Lock those columns to admin-only, same
-- pattern as makina-24.com's protect_profile_privileged_columns trigger.
CREATE OR REPLACE FUNCTION public.protect_shop_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (auth.jwt() ->> 'email') = 'julsina76@gmail.com' THEN
    RETURN NEW; -- admin: no restriction
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.verified := false;
    NEW.subscription_active := true;
    NEW.subscription_plan := 'free';
    NEW.subscription_expires_at := NULL;
  ELSE
    NEW.status := OLD.status;
    NEW.verified := OLD.verified;
    NEW.subscription_active := OLD.subscription_active;
    NEW.subscription_plan := OLD.subscription_plan;
    NEW.subscription_expires_at := OLD.subscription_expires_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_shop_privileged_columns_trigger ON public.shops;
CREATE TRIGGER protect_shop_privileged_columns_trigger
BEFORE INSERT OR UPDATE ON public.shops
FOR EACH ROW EXECUTE FUNCTION public.protect_shop_privileged_columns();
