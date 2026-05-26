
-- =========================================================
-- HOUSE OF DARAJA — FULL OPERATIONAL SCHEMA
-- =========================================================

-- Utility: updated_at trigger fn
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =========================================================
-- 1. IDENTITY & ROLES
-- =========================================================

CREATE TYPE public.app_role AS ENUM (
  'super_admin','admin','moderator','support','vendor','tailor','designer','logistics','customer'
);

CREATE TYPE public.account_status AS ENUM ('active','suspended','banned','pending_verification','deleted');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  language TEXT DEFAULT 'en',
  country TEXT,
  city TEXT,
  wallet_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  lee_tokens NUMERIC(14,2) NOT NULL DEFAULT 0,
  account_status public.account_status NOT NULL DEFAULT 'active',
  email_verified BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

-- Security definer role check (no recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin','admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin','admin','moderator','support')
  )
$$;

-- Auto-create profile + first-user-becomes-super-admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_first BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, email, display_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1) || '_' || substr(NEW.id::text,1,6))
  )
  ON CONFLICT (id) DO NOTHING;

  -- Wallet bootstrap
  INSERT INTO public.wallets (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;

  -- First user = super_admin; else customer
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO is_first;
  IF is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin') ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_public_basic" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "user_roles_admin_manage" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 2. REWARDS / WALLETS (created early — referenced by handle_new_user)
-- =========================================================
CREATE TYPE public.wallet_tx_type AS ENUM ('credit','debit','refund','reward','referral','cashback','withdrawal','adjustment','purchase');

CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'KES',
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  lee_tokens NUMERIC(14,2) NOT NULL DEFAULT 0,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  tx_type public.wallet_tx_type NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  token_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  balance_after NUMERIC(14,2),
  reference TEXT,
  description TEXT,
  related_order_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_wallet_tx_user ON public.wallet_transactions(user_id);
CREATE INDEX idx_wallet_tx_wallet ON public.wallet_transactions(wallet_id);

CREATE TABLE public.reward_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  points NUMERIC(14,2) NOT NULL DEFAULT 0,
  tokens NUMERIC(14,2) NOT NULL DEFAULT 0,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  reward_amount NUMERIC(14,2) DEFAULT 0,
  token_amount NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

CREATE TABLE public.loyalty_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  min_points NUMERIC(14,2) NOT NULL,
  perks JSONB DEFAULT '{}'::jsonb,
  badge_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.wallets TO authenticated;
GRANT SELECT, INSERT ON public.wallet_transactions TO authenticated;
GRANT SELECT, INSERT ON public.reward_events TO authenticated;
GRANT SELECT, INSERT ON public.referral_rewards TO authenticated;
GRANT SELECT ON public.loyalty_levels TO anon, authenticated;
GRANT ALL ON public.wallets, public.wallet_transactions, public.reward_events, public.referral_rewards, public.loyalty_levels TO service_role;

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wallets_own" ON public.wallets FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "wallets_admin_write" ON public.wallets FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "wtx_own" ON public.wallet_transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "wtx_admin_write" ON public.wallet_transactions FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "rewards_own" ON public.reward_events FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "rewards_admin_write" ON public.reward_events FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "ref_own" ON public.referral_rewards FOR SELECT TO authenticated USING (referrer_id = auth.uid() OR referred_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "loyalty_read_all" ON public.loyalty_levels FOR SELECT USING (true);
CREATE POLICY "loyalty_admin_write" ON public.loyalty_levels FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_wallets_updated BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Now attach the trigger to auth.users (after wallets exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- 3. MARKETPLACE
-- =========================================================
CREATE TYPE public.product_status AS ENUM ('draft','pending_review','active','rejected','archived','out_of_stock');
CREATE TYPE public.product_type AS ENUM ('physical','digital','customizable','auction','bespoke');

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_translations JSONB DEFAULT '{}'::jsonb,
  description TEXT,
  image_url TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  title_translations JSONB DEFAULT '{}'::jsonb,
  description TEXT,
  description_translations JSONB DEFAULT '{}'::jsonb,
  product_type public.product_type NOT NULL DEFAULT 'physical',
  status public.product_status NOT NULL DEFAULT 'draft',
  base_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  compare_at_price NUMERIC(14,2),
  currency TEXT NOT NULL DEFAULT 'KES',
  tags TEXT[] DEFAULT '{}',
  rating_avg NUMERIC(3,2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  sales_count INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_auction BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_vendor ON public.products(vendor_id);
CREATE INDEX idx_products_category ON public.products(category_id);

CREATE TABLE public.product_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  media_type TEXT NOT NULL DEFAULT 'image',
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT,
  name TEXT NOT NULL,
  options JSONB DEFAULT '{}'::jsonb,
  price NUMERIC(14,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.product_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0,
  reserved INT NOT NULL DEFAULT 0,
  warehouse_location TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT NOT NULL,
  title TEXT,
  body TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE public.saved_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  product_ids UUID[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.categories, public.products, public.product_media, public.product_variants, public.product_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories, public.products, public.product_media, public.product_variants, public.product_inventory, public.product_reviews, public.wishlist_items, public.saved_collections TO authenticated;
GRANT ALL ON public.categories, public.products, public.product_media, public.product_variants, public.product_inventory, public.product_reviews, public.wishlist_items, public.saved_collections TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cat_public_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "cat_admin_write" ON public.categories FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "prod_public_read_active" ON public.products FOR SELECT USING (status = 'active' OR vendor_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "prod_vendor_insert" ON public.products FOR INSERT TO authenticated WITH CHECK (vendor_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "prod_vendor_update" ON public.products FOR UPDATE TO authenticated USING (vendor_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "prod_admin_delete" ON public.products FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "pm_public_read" ON public.product_media FOR SELECT USING (true);
CREATE POLICY "pm_owner_write" ON public.product_media FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND (p.vendor_id = auth.uid() OR public.is_admin(auth.uid())))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND (p.vendor_id = auth.uid() OR public.is_admin(auth.uid())))
);

CREATE POLICY "pv_public_read" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "pv_owner_write" ON public.product_variants FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND (p.vendor_id = auth.uid() OR public.is_admin(auth.uid())))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND (p.vendor_id = auth.uid() OR public.is_admin(auth.uid())))
);

CREATE POLICY "pi_owner_read" ON public.product_inventory FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND (p.vendor_id = auth.uid() OR public.is_admin(auth.uid())))
);
CREATE POLICY "pi_owner_write" ON public.product_inventory FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND (p.vendor_id = auth.uid() OR public.is_admin(auth.uid())))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND (p.vendor_id = auth.uid() OR public.is_admin(auth.uid())))
);

CREATE POLICY "pr_public_read" ON public.product_reviews FOR SELECT USING (NOT is_hidden OR public.is_staff(auth.uid()));
CREATE POLICY "pr_user_write" ON public.product_reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "pr_user_update" ON public.product_reviews FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "pr_user_delete" ON public.product_reviews FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "wish_own" ON public.wishlist_items FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "coll_own_read" ON public.saved_collections FOR SELECT USING (is_public OR user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "coll_own_write" ON public.saved_collections FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_cat_upd BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_prod_upd BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_prv_upd BEFORE UPDATE ON public.product_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_coll_upd BEFORE UPDATE ON public.saved_collections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 4. ORDERS & PAYMENTS
-- =========================================================
CREATE TYPE public.order_status AS ENUM ('pending','confirmed','processing','shipped','delivered','cancelled','refunded','disputed');
CREATE TYPE public.payment_status AS ENUM ('pending','authorized','paid','partially_paid','failed','refunded','partially_refunded','cancelled');
CREATE TYPE public.payment_provider AS ENUM ('mpesa','card','paypal','stripe','wallet','token','bank_transfer','other');

CREATE TABLE public.delivery_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT,
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  postal_code TEXT,
  region TEXT,
  is_default BOOLEAN DEFAULT false,
  latitude NUMERIC(10,6),
  longitude NUMERIC(10,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE DEFAULT ('HD-' || to_char(now(),'YYYYMMDD') || '-' || substr(gen_random_uuid()::text,1,8)),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status public.order_status NOT NULL DEFAULT 'pending',
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  currency TEXT NOT NULL DEFAULT 'KES',
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  shipping_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  delivery_address_id UUID REFERENCES public.delivery_addresses(id),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  placed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_status ON public.orders(status);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  unit_price NUMERIC(14,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  line_total NUMERIC(14,2) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_oi_order ON public.order_items(order_id);
CREATE INDEX idx_oi_vendor ON public.order_items(vendor_id);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider public.payment_provider NOT NULL,
  provider_reference TEXT,
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  status public.payment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  pdf_url TEXT,
  total NUMERIC(14,2) NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.shipping_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  carrier TEXT,
  tracking_number TEXT,
  status TEXT,
  current_location TEXT,
  estimated_delivery TIMESTAMPTZ,
  updates JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_addresses, public.orders, public.order_items, public.payments, public.invoices, public.refunds, public.shipping_tracking TO authenticated;
GRANT ALL ON public.delivery_addresses, public.orders, public.order_items, public.payments, public.invoices, public.refunds, public.shipping_tracking TO service_role;

ALTER TABLE public.delivery_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "da_own" ON public.delivery_addresses FOR ALL TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid())) WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "orders_own_read" ON public.orders FOR SELECT TO authenticated USING (
  customer_id = auth.uid()
  OR public.is_staff(auth.uid())
  OR EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = id AND oi.vendor_id = auth.uid())
);
CREATE POLICY "orders_customer_insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
CREATE POLICY "orders_admin_update" ON public.orders FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()) OR customer_id = auth.uid());
CREATE POLICY "orders_admin_delete" ON public.orders FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "oi_read" ON public.order_items FOR SELECT TO authenticated USING (
  vendor_id = auth.uid()
  OR public.is_staff(auth.uid())
  OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid())
);
CREATE POLICY "oi_write" ON public.order_items FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid()));

CREATE POLICY "pay_read" ON public.payments FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid())
  OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid())
);
CREATE POLICY "pay_admin_write" ON public.payments FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "inv_read" ON public.invoices FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid())
  OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid())
);
CREATE POLICY "inv_admin_write" ON public.invoices FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "ref_read" ON public.refunds FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid())
  OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid())
);
CREATE POLICY "ref_admin_write" ON public.refunds FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "ship_read" ON public.shipping_tracking FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid())
  OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid())
);
CREATE POLICY "ship_admin_write" ON public.shipping_tracking FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER trg_orders_upd BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_da_upd BEFORE UPDATE ON public.delivery_addresses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ref_upd BEFORE UPDATE ON public.refunds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ship_upd BEFORE UPDATE ON public.shipping_tracking FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 5. BESPOKE TAILORING
-- =========================================================
CREATE TYPE public.tailoring_status AS ENUM ('requested','measurements_pending','in_review','approved','in_production','quality_check','ready','delivered','cancelled','revision_requested');

CREATE TABLE public.measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT,
  unit TEXT NOT NULL DEFAULT 'cm',
  chest NUMERIC(6,2), waist NUMERIC(6,2), hips NUMERIC(6,2),
  shoulder NUMERIC(6,2), sleeve_length NUMERIC(6,2), arm_circumference NUMERIC(6,2),
  inseam NUMERIC(6,2), outseam NUMERIC(6,2), thigh NUMERIC(6,2),
  neck NUMERIC(6,2), back_length NUMERIC(6,2), height NUMERIC(6,2), weight NUMERIC(6,2),
  notes TEXT,
  extra JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.fabric_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  origin TEXT,
  composition TEXT,
  color TEXT,
  pattern TEXT,
  price_per_meter NUMERIC(14,2),
  image_url TEXT,
  in_stock BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tailoring_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tailor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  measurements_id UUID REFERENCES public.measurements(id) ON DELETE SET NULL,
  fabric_id UUID REFERENCES public.fabric_catalog(id) ON DELETE SET NULL,
  related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  style_brief TEXT,
  reference_images TEXT[] DEFAULT '{}',
  status public.tailoring_status NOT NULL DEFAULT 'requested',
  quoted_price NUMERIC(14,2),
  agreed_price NUMERIC(14,2),
  currency TEXT DEFAULT 'KES',
  delivery_date DATE,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tailoring_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tailoring_order_id UUID NOT NULL REFERENCES public.tailoring_orders(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  description TEXT NOT NULL,
  reference_images TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tailoring_progress_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tailoring_order_id UUID NOT NULL REFERENCES public.tailoring_orders(id) ON DELETE CASCADE,
  posted_by UUID NOT NULL REFERENCES auth.users(id),
  stage TEXT,
  message TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tailoring_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tailoring_order_id UUID REFERENCES public.tailoring_orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tailor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 30,
  location TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.measurements, public.tailoring_orders, public.tailoring_revisions, public.tailoring_progress_updates, public.tailoring_appointments TO authenticated;
GRANT SELECT ON public.fabric_catalog TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.fabric_catalog TO authenticated;
GRANT ALL ON public.measurements, public.tailoring_orders, public.tailoring_revisions, public.tailoring_progress_updates, public.tailoring_appointments, public.fabric_catalog TO service_role;

ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tailoring_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tailoring_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tailoring_progress_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tailoring_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fabric_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meas_own" ON public.measurements FOR ALL TO authenticated USING (
  user_id = auth.uid()
  OR public.is_staff(auth.uid())
  OR EXISTS (SELECT 1 FROM public.tailoring_orders t WHERE t.measurements_id = id AND t.tailor_id = auth.uid())
) WITH CHECK (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "to_read" ON public.tailoring_orders FOR SELECT TO authenticated USING (
  customer_id = auth.uid() OR tailor_id = auth.uid() OR public.is_staff(auth.uid())
);
CREATE POLICY "to_customer_insert" ON public.tailoring_orders FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
CREATE POLICY "to_update" ON public.tailoring_orders FOR UPDATE TO authenticated USING (
  customer_id = auth.uid() OR tailor_id = auth.uid() OR public.is_staff(auth.uid())
);
CREATE POLICY "to_admin_delete" ON public.tailoring_orders FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "trev_read" ON public.tailoring_revisions FOR SELECT TO authenticated USING (
  requested_by = auth.uid() OR public.is_staff(auth.uid())
  OR EXISTS (SELECT 1 FROM public.tailoring_orders t WHERE t.id = tailoring_order_id AND (t.customer_id = auth.uid() OR t.tailor_id = auth.uid()))
);
CREATE POLICY "trev_insert" ON public.tailoring_revisions FOR INSERT TO authenticated WITH CHECK (
  requested_by = auth.uid()
  AND EXISTS (SELECT 1 FROM public.tailoring_orders t WHERE t.id = tailoring_order_id AND (t.customer_id = auth.uid() OR t.tailor_id = auth.uid() OR public.is_staff(auth.uid())))
);

CREATE POLICY "tpu_read" ON public.tailoring_progress_updates FOR SELECT TO authenticated USING (
  posted_by = auth.uid() OR public.is_staff(auth.uid())
  OR EXISTS (SELECT 1 FROM public.tailoring_orders t WHERE t.id = tailoring_order_id AND (t.customer_id = auth.uid() OR t.tailor_id = auth.uid()))
);
CREATE POLICY "tpu_insert" ON public.tailoring_progress_updates FOR INSERT TO authenticated WITH CHECK (
  posted_by = auth.uid() AND (
    public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.tailoring_orders t WHERE t.id = tailoring_order_id AND t.tailor_id = auth.uid())
  )
);

CREATE POLICY "tap_read" ON public.tailoring_appointments FOR SELECT TO authenticated USING (
  customer_id = auth.uid() OR tailor_id = auth.uid() OR public.is_staff(auth.uid())
);
CREATE POLICY "tap_write" ON public.tailoring_appointments FOR ALL TO authenticated USING (
  customer_id = auth.uid() OR tailor_id = auth.uid() OR public.is_staff(auth.uid())
) WITH CHECK (customer_id = auth.uid() OR tailor_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "fab_read" ON public.fabric_catalog FOR SELECT USING (true);
CREATE POLICY "fab_admin_write" ON public.fabric_catalog FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_meas_upd BEFORE UPDATE ON public.measurements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_to_upd BEFORE UPDATE ON public.tailoring_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_fab_upd BEFORE UPDATE ON public.fabric_catalog FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_tap_upd BEFORE UPDATE ON public.tailoring_appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 6. AUCTIONS
-- =========================================================
CREATE TYPE public.auction_status AS ENUM ('scheduled','live','ended','cancelled','sold','unsold');

CREATE TABLE public.auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  starting_price NUMERIC(14,2) NOT NULL,
  reserve_price NUMERIC(14,2),
  bid_increment NUMERIC(14,2) NOT NULL DEFAULT 100,
  current_bid NUMERIC(14,2),
  current_bidder_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total_bids INT NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status public.auction_status NOT NULL DEFAULT 'scheduled',
  anti_snipe_seconds INT DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  is_winning BOOLEAN DEFAULT false,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bids_auction ON public.bids(auction_id);

CREATE TABLE public.auction_watchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(auction_id, user_id)
);

CREATE TABLE public.auction_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL UNIQUE REFERENCES public.auctions(id) ON DELETE CASCADE,
  winner_id UUID NOT NULL REFERENCES auth.users(id),
  winning_bid NUMERIC(14,2) NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  payment_due_by TIMESTAMPTZ,
  status TEXT DEFAULT 'pending_payment',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.auctions, public.bids TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.auctions, public.bids, public.auction_watchers, public.auction_winners TO authenticated;
GRANT ALL ON public.auctions, public.bids, public.auction_watchers, public.auction_winners TO service_role;

ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auc_public_read" ON public.auctions FOR SELECT USING (true);
CREATE POLICY "auc_vendor_write" ON public.auctions FOR ALL TO authenticated USING (vendor_id = auth.uid() OR public.is_admin(auth.uid())) WITH CHECK (vendor_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "bid_public_read" ON public.bids FOR SELECT USING (true);
CREATE POLICY "bid_user_insert" ON public.bids FOR INSERT TO authenticated WITH CHECK (bidder_id = auth.uid());
CREATE POLICY "bid_admin_update" ON public.bids FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "watch_own" ON public.auction_watchers FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "aw_read" ON public.auction_winners FOR SELECT TO authenticated USING (winner_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "aw_admin_write" ON public.auction_winners FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_auc_upd BEFORE UPDATE ON public.auctions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 7. AI & AUTOMATION
-- =========================================================
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  agent TEXT DEFAULT 'leema',
  context JSONB DEFAULT '{}'::jsonb,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tokens INT,
  model TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_msg_conv ON public.ai_messages(conversation_id);

CREATE TABLE public.ai_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  total_runs INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  score NUMERIC(5,4),
  was_clicked BOOLEAN DEFAULT false,
  was_converted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.ai_workflows(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  level TEXT DEFAULT 'info',
  event TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  duration_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.ai_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations, public.ai_messages, public.ai_recommendations, public.ai_feedback TO authenticated;
GRANT SELECT ON public.ai_workflows, public.ai_logs TO authenticated;
GRANT ALL ON public.ai_conversations, public.ai_messages, public.ai_workflows, public.ai_recommendations, public.ai_logs, public.ai_feedback TO service_role;

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aic_own" ON public.ai_conversations FOR ALL TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid())) WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "aim_own" ON public.ai_messages FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR public.is_admin(auth.uid())))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR public.is_admin(auth.uid())))
);
CREATE POLICY "aiw_admin" ON public.ai_workflows FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "aiw_read_staff" ON public.ai_workflows FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "air_own" ON public.ai_recommendations FOR ALL TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid())) WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "ail_admin" ON public.ai_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "aif_own" ON public.ai_feedback FOR ALL TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid())) WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE TRIGGER trg_aic_upd BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_aiw_upd BEFORE UPDATE ON public.ai_workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 8. LOGISTICS
-- =========================================================
CREATE TYPE public.delivery_status AS ENUM ('pending','assigned','picked_up','in_transit','out_for_delivery','delivered','failed','returned');

CREATE TABLE public.delivery_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  regions TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  api_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.delivery_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.delivery_partners(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  vehicle_type TEXT,
  license_plate TEXT,
  is_available BOOLEAN DEFAULT true,
  current_region TEXT,
  rating_avg NUMERIC(3,2) DEFAULT 0,
  total_deliveries INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.delivery_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.delivery_agents(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES public.delivery_partners(id) ON DELETE SET NULL,
  pickup_address TEXT,
  drop_address TEXT NOT NULL,
  status public.delivery_status NOT NULL DEFAULT 'pending',
  cost NUMERIC(14,2),
  scheduled_pickup TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  proof_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dt_agent ON public.delivery_tasks(agent_id);

CREATE TABLE public.live_delivery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.delivery_tasks(id) ON DELETE CASCADE,
  latitude NUMERIC(10,6) NOT NULL,
  longitude NUMERIC(10,6) NOT NULL,
  speed_kmh NUMERIC(6,2),
  heading NUMERIC(5,2),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ldt_task ON public.live_delivery_tracking(task_id);

CREATE TABLE public.delivery_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,
  base_fee NUMERIC(14,2) NOT NULL,
  per_km_fee NUMERIC(14,2) NOT NULL DEFAULT 0,
  min_distance_km NUMERIC(8,2) DEFAULT 0,
  max_distance_km NUMERIC(8,2),
  weight_multiplier NUMERIC(6,2) DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_partners, public.delivery_agents, public.delivery_tasks, public.live_delivery_tracking, public.delivery_pricing_rules TO authenticated;
GRANT ALL ON public.delivery_partners, public.delivery_agents, public.delivery_tasks, public.live_delivery_tracking, public.delivery_pricing_rules TO service_role;

ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dp_admin_all" ON public.delivery_partners FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "dp_read_staff" ON public.delivery_partners FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'logistics'));

CREATE POLICY "da_admin_all" ON public.delivery_agents FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "da_self_read" ON public.delivery_agents FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "da_self_update" ON public.delivery_agents FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "dt_read" ON public.delivery_tasks FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid())
  OR EXISTS (SELECT 1 FROM public.delivery_agents da WHERE da.id = agent_id AND da.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid())
);
CREATE POLICY "dt_admin_write" ON public.delivery_tasks FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "dt_agent_update" ON public.delivery_tasks FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.delivery_agents da WHERE da.id = agent_id AND da.user_id = auth.uid())
);

CREATE POLICY "ldt_read" ON public.live_delivery_tracking FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.delivery_tasks dt
    JOIN public.delivery_agents da ON da.id = dt.agent_id
    WHERE dt.id = task_id AND da.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.delivery_tasks dt
    JOIN public.orders o ON o.id = dt.order_id
    WHERE dt.id = task_id AND o.customer_id = auth.uid()
  )
);
CREATE POLICY "ldt_agent_insert" ON public.live_delivery_tracking FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.delivery_tasks dt
    JOIN public.delivery_agents da ON da.id = dt.agent_id
    WHERE dt.id = task_id AND da.user_id = auth.uid()
  )
);

CREATE POLICY "dpr_read" ON public.delivery_pricing_rules FOR SELECT USING (true);
CREATE POLICY "dpr_admin_write" ON public.delivery_pricing_rules FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_dp_upd BEFORE UPDATE ON public.delivery_partners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_da_upd2 BEFORE UPDATE ON public.delivery_agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_dt_upd BEFORE UPDATE ON public.delivery_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_dpr_upd BEFORE UPDATE ON public.delivery_pricing_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 9. ADMIN & OPERATIONS
-- =========================================================
CREATE TYPE public.ticket_status AS ENUM ('open','pending','resolved','closed','escalated');
CREATE TYPE public.ticket_priority AS ENUM ('low','normal','high','urgent');

CREATE TABLE public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.moderation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  rollout_percent INT DEFAULT 0,
  config JSONB DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE DEFAULT ('T-' || to_char(now(),'YYMMDD') || '-' || substr(gen_random_uuid()::text,1,6)),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT,
  priority public.ticket_priority DEFAULT 'normal',
  status public.ticket_status NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.system_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  audience TEXT DEFAULT 'all',
  severity TEXT DEFAULT 'info',
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  action TEXT NOT NULL,
  before JSONB,
  after JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.emergency_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  is_engaged BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  engaged_by UUID REFERENCES auth.users(id),
  engaged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.admin_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.moderation_reports TO authenticated;
GRANT SELECT ON public.feature_flags TO authenticated, anon;
GRANT INSERT, UPDATE ON public.feature_flags TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.support_tickets, public.support_messages TO authenticated;
GRANT SELECT ON public.system_announcements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.system_announcements TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT SELECT, UPDATE ON public.emergency_controls TO authenticated;
GRANT ALL ON public.admin_logs, public.moderation_reports, public.feature_flags, public.support_tickets, public.support_messages, public.system_announcements, public.audit_logs, public.emergency_controls TO service_role;

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_controls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "al_admin_read" ON public.admin_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "al_admin_insert" ON public.admin_logs FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "mr_read" ON public.moderation_reports FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "mr_insert" ON public.moderation_reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "mr_staff_update" ON public.moderation_reports FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "ff_read" ON public.feature_flags FOR SELECT USING (true);
CREATE POLICY "ff_admin_write" ON public.feature_flags FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "st_read" ON public.support_tickets FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "st_insert" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "st_update" ON public.support_tickets FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "sm_read" ON public.support_messages FOR SELECT TO authenticated USING (
  sender_id = auth.uid()
  OR public.is_staff(auth.uid())
  OR EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid() AND NOT is_internal)
);
CREATE POLICY "sm_insert" ON public.support_messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid()
  AND (
    EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
    OR public.is_staff(auth.uid())
  )
);

CREATE POLICY "sa_read_active" ON public.system_announcements FOR SELECT USING (is_active OR public.is_staff(auth.uid()));
CREATE POLICY "sa_admin_write" ON public.system_announcements FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "aud_admin_read" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "aud_insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "ec_read" ON public.emergency_controls FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "ec_super_write" ON public.emergency_controls FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

CREATE TRIGGER trg_mr_upd BEFORE UPDATE ON public.moderation_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ff_upd BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_st_upd BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sa_upd BEFORE UPDATE ON public.system_announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ec_upd BEFORE UPDATE ON public.emergency_controls FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 10. ANALYTICS
-- =========================================================
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  url TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ae_event ON public.analytics_events(event_name);
CREATE INDEX idx_ae_created ON public.analytics_events(created_at DESC);

CREATE TABLE public.business_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL,
  metric_key TEXT NOT NULL,
  metric_value NUMERIC(18,4) NOT NULL,
  dimensions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(metric_date, metric_key)
);

CREATE TABLE public.vendor_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_sales NUMERIC(14,2) DEFAULT 0,
  orders_count INT DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  cancellation_rate NUMERIC(5,4) DEFAULT 0,
  on_time_rate NUMERIC(5,4) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.conversion_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  funnel_step TEXT NOT NULL,
  funnel_name TEXT NOT NULL,
  value NUMERIC(14,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.analytics_events, public.user_activity_logs, public.conversion_tracking TO authenticated;
GRANT SELECT ON public.business_metrics, public.vendor_performance TO authenticated;
GRANT ALL ON public.analytics_events, public.business_metrics, public.vendor_performance, public.user_activity_logs, public.conversion_tracking TO service_role;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ae_insert_any" ON public.analytics_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ae_admin_read" ON public.analytics_events FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "bm_admin_read" ON public.business_metrics FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "bm_admin_write" ON public.business_metrics FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "vp_read" ON public.vendor_performance FOR SELECT TO authenticated USING (vendor_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "vp_admin_write" ON public.vendor_performance FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "ual_own_read" ON public.user_activity_logs FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "ual_insert" ON public.user_activity_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "ct_admin_read" ON public.conversion_tracking FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "ct_insert" ON public.conversion_tracking FOR INSERT TO authenticated WITH CHECK (true);

-- =========================================================
-- 11. STORAGE BUCKETS
-- =========================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars','avatars',true),
  ('products','products',true),
  ('tailoring_reference_images','tailoring_reference_images',false),
  ('invoices','invoices',false),
  ('delivery_proofs','delivery_proofs',false),
  ('ai_assets','ai_assets',false),
  ('marketing_assets','marketing_assets',true),
  ('support_attachments','support_attachments',false)
ON CONFLICT (id) DO NOTHING;

-- Public buckets: anyone can read
CREATE POLICY "public_buckets_read" ON storage.objects FOR SELECT USING (
  bucket_id IN ('avatars','products','marketing_assets')
);

-- Avatars: users upload their own (folder = user id)
CREATE POLICY "avatars_self_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "avatars_self_update" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "avatars_self_delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Products: vendors+admin upload (folder = vendor id)
CREATE POLICY "products_owner_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'products' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin(auth.uid()))
);
CREATE POLICY "products_owner_update" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'products' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin(auth.uid()))
);
CREATE POLICY "products_owner_delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'products' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin(auth.uid()))
);

-- Private buckets: owner read (folder = user id) + staff/admin read
CREATE POLICY "private_self_read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id IN ('tailoring_reference_images','invoices','delivery_proofs','ai_assets','support_attachments')
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_staff(auth.uid()))
);
CREATE POLICY "private_self_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id IN ('tailoring_reference_images','invoices','delivery_proofs','ai_assets','support_attachments')
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_staff(auth.uid()))
);
CREATE POLICY "private_self_update" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id IN ('tailoring_reference_images','invoices','delivery_proofs','ai_assets','support_attachments')
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_staff(auth.uid()))
);

-- Marketing assets: admin write
CREATE POLICY "marketing_admin_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'marketing_assets' AND public.is_admin(auth.uid())
);
CREATE POLICY "marketing_admin_update" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'marketing_assets' AND public.is_admin(auth.uid())
);
CREATE POLICY "marketing_admin_delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'marketing_assets' AND public.is_admin(auth.uid())
);

-- =========================================================
-- 12. SEED loyalty levels & feature flags
-- =========================================================
INSERT INTO public.loyalty_levels (name, min_points, perks) VALUES
  ('Bronze', 0, '{"discount":0}'),
  ('Silver', 1000, '{"discount":0.05}'),
  ('Gold', 5000, '{"discount":0.10}'),
  ('Platinum', 20000, '{"discount":0.15}'),
  ('Daraja Elite', 50000, '{"discount":0.20,"early_access":true}')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.feature_flags (key, description, is_enabled) VALUES
  ('marketplace_enabled','Marketplace browsing & checkout',true),
  ('auctions_enabled','Live auctions',true),
  ('bespoke_tailoring_enabled','Bespoke tailoring requests',true),
  ('ai_stylist_enabled','Leema AI Stylist',true),
  ('token_subsidy_enabled','Lee token subsidies',true),
  ('maintenance_mode','Global maintenance mode',false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.emergency_controls (key, description, is_engaged) VALUES
  ('global_kill_switch','Disable all customer-facing writes',false),
  ('disable_payments','Disable all payment processing',false),
  ('disable_signups','Disable new user signups',false)
ON CONFLICT (key) DO NOTHING;
