
-- ==========================================
-- TRADE MIND DATABASE MIGRATION SCRIPT
-- ==========================================

-- 1. ENSURE COLUMNS EXIST (Fix for "missing column" error)
-- This section ensures that even if the table already exists, the new columns are added.

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

    -- Add mobile if missing (just in case)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='mobile') THEN
        ALTER TABLE public.profiles ADD COLUMN mobile text;
    END IF;
END $$;

-- 2. RE-INITIALIZE CORE STRUCTURE
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

-- 3. STORAGE BUCKETS SETUP
-- Run these in your Supabase Dashboard under Storage -> New Bucket
-- 1. 'payment-proofs' (Public)
-- 2. 'trade-attachments' (Public)

-- 4. NUKE AND RE-APPLY POLICIES (Fixes RLS Recursion)
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('profiles', 'trades', 'transactions')) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_owner_access" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "admin_global_access" ON public.profiles FOR ALL USING ((auth.jwt() ->> 'email') = 'mangeshpotale09@gmail.com');

-- 5. ADMIN BOOTSTRAP
UPDATE public.profiles 
SET role = 'ADMIN', is_paid = true, status = 'APPROVED' 
WHERE lower(email) = 'mangeshpotale09@gmail.com';

-- Refresh the postgrest schema cache
NOTIFY pgrst, 'reload schema';
