
-- ==========================================
-- TRADE MIND DATABASE MIGRATION SCRIPT
-- ==========================================

-- 1. PROFILES TABLE & COLUMNS
DO $$ 
BEGIN 
    -- Add amount_paid if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='amount_paid') THEN
        ALTER TABLE public.profiles ADD COLUMN amount_paid numeric DEFAULT 0;
    END IF;

    -- Add expiry_date if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='expiry_date') THEN
        ALTER TABLE public.profiles ADD COLUMN expiry_date timestamp with time zone;
    END IF;

    -- Add mobile if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='mobile') THEN
        ALTER TABLE public.profiles ADD COLUMN mobile text;
    END IF;
END $$;

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

-- 2. TRADES TABLE DEFINITION
CREATE TABLE IF NOT EXISTS public.trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  symbol text NOT NULL,
  type text NOT NULL,
  side text NOT NULL,
  entry_price numeric NOT NULL,
  exit_price numeric,
  quantity numeric NOT NULL,
  entry_date timestamp with time zone NOT NULL,
  exit_date timestamp with time zone,
  fees numeric DEFAULT 0,
  status text NOT NULL,
  tags text[] DEFAULT '{}',
  notes text,
  option_details jsonb,
  ai_review jsonb,
  attachments jsonb DEFAULT '[]',
  emotions text[] DEFAULT '{}',
  mistakes text[] DEFAULT '{}',
  strategies text[] DEFAULT '{}'
);

-- 3. ROW LEVEL SECURITY (RLS) SETUP
-- Nuke existing policies to prevent recursion or conflicts
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('profiles', 'trades')) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Profile Policies
CREATE POLICY "profile_owner_access" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "admin_global_profiles" ON public.profiles FOR ALL USING ((auth.jwt() ->> 'email') = 'mangeshpotale09@gmail.com');

-- Trade Policies
CREATE POLICY "trade_owner_access" ON public.trades FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin_global_trades" ON public.trades FOR ALL USING ((auth.jwt() ->> 'email') = 'mangeshpotale09@gmail.com');

-- 4. ADMIN BOOTSTRAP
UPDATE public.profiles 
SET role = 'ADMIN', is_paid = true, status = 'APPROVED' 
WHERE lower(email) = 'mangeshpotale09@gmail.com';

-- Refresh the postgrest schema cache
NOTIFY pgrst, 'reload schema';
