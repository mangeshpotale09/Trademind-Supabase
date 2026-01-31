
-- ==========================================
-- TRADE MIND DATABASE MIGRATION SCRIPT v3
-- ==========================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_id text UNIQUE,
  email text UNIQUE,
  name text,
  mobile text,
  is_paid boolean DEFAULT false,
  role text DEFAULT 'USER',
  status text DEFAULT 'PENDING',
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  own_referral_code text UNIQUE,
  payment_screenshot text,
  selected_plan text,
  amount_paid numeric DEFAULT 0,
  expiry_date timestamp with time zone
);

-- 2. TRADES TABLE
CREATE TABLE IF NOT EXISTS public.trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  symbol text NOT NULL,
  type text NOT NULL,
  side text NOT NULL,
  entry_price numeric NOT NULL,
  exit_price numeric,
  quantity numeric NOT NULL,
  entry_date timestamp with time zone NOT NULL DEFAULT now(),
  exit_date timestamp with time zone,
  fees numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'OPEN',
  tags jsonb DEFAULT '[]',
  notes text,
  option_details jsonb,
  ai_review jsonb,
  attachments jsonb DEFAULT '[]',
  emotions jsonb DEFAULT '[]',
  mistakes jsonb DEFAULT '[]',
  strategies jsonb DEFAULT '[]'
);

-- 3. AUTOMATIC PROFILE PROVISIONING
-- This trigger ensures every auth user has a public profile record immediately
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, display_id, own_referral_code)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', 'Trader'),
    'TM-' || upper(substring(new.id::text from 1 for 6)),
    'REF-' || upper(substring(new.id::text from 1 for 6))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. RLS & PERMISSIONS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.trades TO authenticated;

-- Profile Policies
DROP POLICY IF EXISTS "profiles_owner" ON public.profiles;
CREATE POLICY "profiles_owner" ON public.profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_admin" ON public.profiles;
CREATE POLICY "profiles_admin" ON public.profiles FOR ALL USING (
  (auth.jwt() ->> 'email') = 'mangeshpotale09@gmail.com'
);

-- Trade Policies (Explicit Breakdown for Upsert Reliability)
DROP POLICY IF EXISTS "trades_owner_insert" ON public.trades;
CREATE POLICY "trades_owner_insert" ON public.trades FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "trades_owner_select" ON public.trades;
CREATE POLICY "trades_owner_select" ON public.trades FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "trades_owner_update" ON public.trades;
CREATE POLICY "trades_owner_update" ON public.trades FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "trades_owner_delete" ON public.trades;
CREATE POLICY "trades_owner_delete" ON public.trades FOR DELETE USING (auth.uid() = user_id);

-- Admin Bypass
DROP POLICY IF EXISTS "trades_admin_all" ON public.trades;
CREATE POLICY "trades_admin_all" ON public.trades FOR ALL USING (
  (auth.jwt() ->> 'email') = 'mangeshpotale09@gmail.com'
);

-- 5. INITIALIZE ADMIN ROLE
UPDATE public.profiles 
SET role = 'ADMIN', is_paid = true, status = 'APPROVED' 
WHERE lower(email) = 'mangeshpotale09@gmail.com';
