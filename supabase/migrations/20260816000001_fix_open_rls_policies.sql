-- Security audit fix (2026-08-16): several RLS policies were fully public
-- (USING/WITH CHECK true) or named "Admin ..." with no actual admin check,
-- meaning anyone with the public anon key could read/write data they
-- shouldn't. This repo has no prior tracked migrations -- these policies
-- previously only existed live in the Supabase dashboard; verified via
-- `pg_policies` against the linked project before writing this file.
--
-- Admin identity: the app's own client-side admin gate (client/src/App.jsx,
-- AdminRoute) already hardcodes the single admin account by email
-- ('julsina76@gmail.com'). Mirroring that here in RLS is what actually
-- enforces it server-side -- the client-side check alone is cosmetic.

-- ============================================================
-- orders
-- ============================================================

-- "Public update orders" (USING true) let anyone rewrite any order: address/
-- lat-long (reroute deliveries), delivery_pin (hijack courier confirmation),
-- status, total. Replace with buyer/seller/admin-scoped ownership checks.
DROP POLICY IF EXISTS "Public update orders" ON public.orders;

CREATE POLICY "Buyers sellers and admin can update orders"
ON public.orders
FOR UPDATE
USING (
  auth.uid() = buyer_id
  OR shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
  OR (auth.jwt() ->> 'email') = 'julsina76@gmail.com'
)
WITH CHECK (
  auth.uid() = buyer_id
  OR shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
  OR (auth.jwt() ->> 'email') = 'julsina76@gmail.com'
);

-- "Public insert orders" (WITH CHECK true) let anyone insert an order row
-- with an arbitrary buyer_id, impersonating another user, or fabricate fake
-- orders against any shop. The two remaining INSERT policies already cover
-- every legitimate case (logged-in buyer inserting their own order, or a
-- guest checkout explicitly leaving buyer_id NULL).
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;

-- Admin panel reads every order (AdminPanel.jsx "orders" tab) but previously
-- had no ownership match of its own -- it only worked by accident when the
-- open UPDATE/INSERT policies masked the gap. Add an explicit admin read.
CREATE POLICY "Admin can read all orders"
ON public.orders
FOR SELECT
USING ((auth.jwt() ->> 'email') = 'julsina76@gmail.com');

-- Anonymous delivery-status flows (courier PIN confirmation, buyer email-
-- link confirmation) no longer get a table-level bypass -- they now go
-- through dedicated edge functions (delivery-pin-confirm, delivery-link-
-- confirm) that use the service role key and enforce their own checks
-- server-side instead of relying on an RLS policy anyone can hit directly.

-- ============================================================
-- products
-- ============================================================

-- "Users can delete own products" had USING (true) despite its name --
-- restore the actual ownership check.
DROP POLICY IF EXISTS "Users can delete own products" ON public.products;

CREATE POLICY "Users can delete own products"
ON public.products
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================
-- shops
-- ============================================================

-- "Admin can read all shops" / "Admin can update shops" / "Admin can update
-- all shops" were all USING (true) with no admin check at all, exposing
-- unapproved shops' PII and letting anyone self-approve/verify/grant a
-- subscription to any shop. Replace with real admin-email-gated policies
-- (collapsing the two duplicate UPDATE policies into one).
DROP POLICY IF EXISTS "Admin can read all shops" ON public.shops;
DROP POLICY IF EXISTS "Admin can update shops" ON public.shops;
DROP POLICY IF EXISTS "Admin can update all shops" ON public.shops;

CREATE POLICY "Admin can read all shops"
ON public.shops
FOR SELECT
USING ((auth.jwt() ->> 'email') = 'julsina76@gmail.com');

CREATE POLICY "Admin can update all shops"
ON public.shops
FOR UPDATE
USING ((auth.jwt() ->> 'email') = 'julsina76@gmail.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'julsina76@gmail.com');

-- ============================================================
-- reviews
-- ============================================================

-- "Users can insert reviews" had WITH CHECK (true) -- anyone could post a
-- review attributed to any buyer_id/shop_id/product_id with no ownership
-- check at all (review-bombing / fake-review fraud).
DROP POLICY IF EXISTS "Users can insert reviews" ON public.reviews;

CREATE POLICY "Authenticated users can insert own reviews"
ON public.reviews
FOR INSERT
WITH CHECK (auth.uid() = buyer_id);
