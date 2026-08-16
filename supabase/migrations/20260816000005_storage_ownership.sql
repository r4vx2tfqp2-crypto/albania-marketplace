-- storage.objects policies for the product-images bucket only checked
-- `auth.role() = 'authenticated'` on INSERT/DELETE -- any logged-in user
-- (not just the product/shop's own owner) could overwrite or delete any
-- other seller's product photos or shop logo, since `upsert: true` is used
-- by both upload call sites (AddProduct.jsx uploadImages, AddShop.jsx
-- uploadLogo).
--
-- Upload paths follow two conventions, neither of which includes the
-- uploader's own id, so ownership has to be resolved by looking up the
-- product/shop id embedded in the path:
--   {productId}/{index}.{ext}   -- product photos (AddProduct.jsx)
--   logos/{shopId}.{ext}        -- shop logos       (AddShop.jsx)
CREATE OR REPLACE FUNCTION public.owns_product_image(object_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  first_segment text := (storage.foldername(object_name))[1];
  candidate_id uuid;
BEGIN
  IF first_segment = 'logos' THEN
    BEGIN
      candidate_id := split_part(regexp_replace(object_name, '^logos/', ''), '.', 1)::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      RETURN false;
    END;
    RETURN EXISTS (SELECT 1 FROM public.shops WHERE id = candidate_id AND user_id = auth.uid());
  ELSE
    BEGIN
      candidate_id := first_segment::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      RETURN false;
    END;
    RETURN EXISTS (SELECT 1 FROM public.products WHERE id = candidate_id AND user_id = auth.uid());
  END IF;
END;
$$;

DROP POLICY IF EXISTS "Sellers can upload product images" ON storage.objects;
CREATE POLICY "Sellers can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
  AND public.owns_product_image(name)
);

-- Needed because both upload call sites use upsert: true, which is an
-- UPDATE (not INSERT) on the object when the path already exists.
DROP POLICY IF EXISTS "Sellers can update product images" ON storage.objects;
CREATE POLICY "Sellers can update product images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated' AND public.owns_product_image(name))
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated' AND public.owns_product_image(name));

DROP POLICY IF EXISTS "Sellers can delete product images" ON storage.objects;
CREATE POLICY "Sellers can delete product images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
  AND public.owns_product_image(name)
);
