
-- ==========================================
-- TERMINAL DATABASE RECOVERY & RLS FIX
-- ==========================================

-- 1. CLEANUP: DROP ALL EXISTING POLICIES TO AVOID CONFLICTS
do $$ 
declare
    pol record;
begin
    for pol in (select policyname, tablename from pg_policies where schemaname = 'public' and tablename in ('profiles', 'trades', 'transactions')) loop
        execute format('drop policy if exists %I on %I', pol.policyname, pol.tablename);
    end loop;
end $$;

-- 2. TABLES RE-VERIFICATION
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

create table if not exists public.trades (
  id uuid primary key,
  user_id uuid references auth.users on delete cascade not null,
  symbol text not null,
  type text not null,
  side text not null,
  entry_price numeric not null,
  exit_price numeric,
  quantity numeric not null,
  entry_date timestamp with time zone not null,
  exit_date timestamp with time zone,
  fees numeric default 0,
  status text not null,
  tags text[] default '{}',
  notes text,
  option_details jsonb,
  ai_review jsonb,
  attachments jsonb default '[]',
  emotions text[] default '{}',
  mistakes text[] default '{}',
  strategies text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. ENABLE RLS
alter table public.profiles enable row level security;
alter table public.trades enable row level security;

-- 4. PROFILES POLICIES
create policy "profiles_owner_policy" on public.profiles
for all 
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "profiles_admin_policy" on public.profiles
for all 
using ((auth.jwt() ->> 'email') = 'mangeshpotale09@gmail.com')
with check ((auth.jwt() ->> 'email') = 'mangeshpotale09@gmail.com');

-- 5. TRADES POLICIES (Combined FOR ALL to ensure UPSERT works correctly)
create policy "trades_owner_policy" on public.trades
for all 
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "trades_admin_policy" on public.trades
for all 
using ((auth.jwt() ->> 'email') = 'mangeshpotale09@gmail.com')
with check ((auth.jwt() ->> 'email') = 'mangeshpotale09@gmail.com');

-- 6. SETUP STORAGE BUCKETS (Note: Manual step in Supabase Dashboard)
-- trade-attachments
-- payment-proofs

-- 7. INITIALIZE ADMIN
update public.profiles 
set role = 'ADMIN', is_paid = true, status = 'APPROVED' 
where lower(email) = 'mangeshpotale09@gmail.com';

-- 8. REFRESH SCHEMA CACHE
notify pgrst, 'reload schema';
