-- Any seller could mark their own product "trending" for free, promoting
-- it straight to the homepage's Trending Now section with zero admin
-- review -- the exact same class of self-escalation that
-- protect_shop_privileged_columns (20260816000004) already closed for
-- shops.status/verified/subscription_*, just never extended to this
-- column. Locks products.trending to admin-only, same pattern.
CREATE OR REPLACE FUNCTION public.protect_products_trending()
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
    NEW.trending := false;
  ELSE
    NEW.trending := OLD.trending;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_products_trending_trigger ON public.products;
CREATE TRIGGER protect_products_trending_trigger
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.protect_products_trending();
