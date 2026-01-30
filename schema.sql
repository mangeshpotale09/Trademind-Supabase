
-- ==========================================
-- TERMINAL RECOVERY SCRIPT (NON-RECURSIVE)
-- ==========================================

-- 1. NUKE ALL EXISTING POLICIES (Cleans up the recursion loop)
do $$ 
declare
    pol record;
begin
    for pol in (select policyname, tablename from pg_policies where schemaname = 'public' and tablename in ('profiles', 'trades', 'transactions')) loop
        execute format('drop policy if exists %I on %I', pol.policyname, pol.tablename);
    end loop;
end $$;

-- 2. ENSURE TABLES EXIST
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_id text unique,
  email text unique,
  name text,
  mobile text,
  is_paid boolean default false,
  role text default 'USER',
  status text default 'PENDING',
  joined_at timestamp with time zone default timezone('utc'::text, now()),
  own_referral_code text unique,
  payment_screenshot text,
  selected_plan text
);

-- 3. ENABLE RLS
alter table public.profiles enable row level security;
alter table public.trades enable row level security;
alter table public.transactions enable row level security;

-- 4. NON-RECURSIVE PROFILES POLICIES
-- Users can only see and edit their own identity
create policy "profile_owner_policy" on public.profiles
for all using (auth.uid() = id) with check (auth.uid() = id);

-- Admin bypass using JWT (Does not query the table, preventing recursion)
create policy "profile_admin_policy" on public.profiles
for all using (
  (auth.jwt() ->> 'email') = 'mangeshpotale09@gmail.com'
);

-- 5. TRADES POLICIES
create policy "trades_owner_policy" on public.trades
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "trades_admin_policy" on public.trades
for all using (
  (auth.jwt() ->> 'email') = 'mangeshpotale09@gmail.com'
);

-- 6. TRANSACTIONS POLICIES
create policy "tx_owner_policy" on public.transactions
for all using (auth.uid() = user_id);

create policy "tx_admin_policy" on public.transactions
for all using (
  (auth.jwt() ->> 'email') = 'mangeshpotale09@gmail.com'
);

-- 7. SETUP STORAGE ACCESS
-- Allow authenticated users to upload to their own folders in buckets
-- Make sure buckets 'trade-attachments' and 'payment-proofs' are created in UI

-- 8. INITIALIZE ADMIN (Run this after first login)
update public.profiles 
set role = 'ADMIN', is_paid = true, status = 'APPROVED' 
where lower(email) = 'mangeshpotale09@gmail.com';

-- Refresh the postgrest schema cache
notify pgrst, 'reload schema';
