-- "Users can insert own products" only checked auth.uid() = user_id, not
-- that shop_id actually belongs to that same user. AddProduct.jsx's shop
-- dropdown only ever lists the caller's own shops, but nothing server-side
-- stopped a crafted request from inserting a product with the caller's own
-- user_id but an arbitrary shop_id, attributing a rogue listing to another
-- seller's storefront.
DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
CREATE POLICY "Users can insert own products"
ON public.products
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (shop_id IS NULL OR shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid()))
);
