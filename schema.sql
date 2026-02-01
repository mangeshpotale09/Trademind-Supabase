
-- ==========================================
-- TRADE MIND AI: CORE DATABASE SCHEMA
-- RUN THIS IN SUPABASE SQL EDITOR ONLY
-- ==========================================

-- 1. Setup Profiles
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
  selected_plan text,
  amount_paid numeric default 0,
  expiry_date timestamp with time zone
);

-- 2. Setup Trades
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

-- 3. Security (RLS)
alter table public.profiles enable row level security;
alter table public.trades enable row level security;

-- Drop existing policies to prevent duplication errors
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can view own trades" on public.trades;
drop policy if exists "Users can manage own trades" on public.trades;

-- Define Policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users can view own trades" on public.trades for select using (auth.uid() = user_id);
create policy "Users can manage own trades" on public.trades for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4. Storage Setup Instructions (Manual)
-- Ensure 'trade-attachments' and 'payment-proofs' buckets exist in Supabase Storage with Public access enabled.

-- 5. Admin Bootstrap
-- Replace with your email to grant yourself root access
update public.profiles 
set role = 'ADMIN', is_paid = true, status = 'APPROVED' 
where lower(email) = 'mangeshpotale09@gmail.com';
