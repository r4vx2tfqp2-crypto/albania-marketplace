-- Security audit fix: order total/item prices were fully client-computed
-- (client/src/pages/Checkout.jsx builds `total` and each items[].price from
-- client-held cart state) and inserted verbatim with nothing server-side
-- checking them against the real product prices. A tampered request could
-- submit any total/price. This trigger recomputes both from the
-- authoritative `products`/`shops` rows on every insert, ignoring whatever
-- the client sent.
--
-- SECURITY DEFINER is used deliberately (and narrowly) so the price lookup
-- doesn't depend on the inserting user's own RLS visibility into `shops`
-- (e.g. a shop pending approval can still be checked out from); it does not
-- return any data to the caller beyond the corrected total/items already
-- being inserted, and takes no dynamic/caller-controlled SQL.
CREATE OR REPLACE FUNCTION public.recompute_order_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  corrected_items jsonb := '[]'::jsonb;
  real_price numeric;
  item_qty numeric;
  computed_subtotal numeric := 0;
  fee integer;
BEGIN
  IF NEW.items IS NOT NULL THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      SELECT price INTO real_price FROM public.products WHERE id = (item->>'id')::uuid;
      IF real_price IS NULL THEN
        RAISE EXCEPTION 'Unknown product in order: %', item->>'id';
      END IF;
      item_qty := GREATEST(COALESCE((item->>'qty')::numeric, 1), 1);
      corrected_items := corrected_items || jsonb_build_array(
        jsonb_set(jsonb_set(item, '{price}', to_jsonb(real_price)), '{qty}', to_jsonb(item_qty))
      );
      computed_subtotal := computed_subtotal + real_price * item_qty;
    END LOOP;
    NEW.items := corrected_items;
  END IF;

  SELECT COALESCE(delivery_fee, 300) INTO fee FROM public.shops WHERE id = NEW.shop_id;
  IF fee IS NULL THEN
    fee := 300;
  END IF;

  NEW.total := computed_subtotal + fee;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recompute_order_total_trigger ON public.orders;
CREATE TRIGGER recompute_order_total_trigger
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.recompute_order_total();
