
-- 1. DYNAMIC CLEANUP (The "Nuke" Option for infinite recursion)
-- This block finds every policy on 'profiles' and 'trades' and drops it.
do $$ 
declare
    pol record;
begin
    for pol in (select policyname, tablename from pg_policies where schemaname = 'public' and tablename in ('profiles', 'trades', 'transactions')) loop
        execute format('drop policy if exists %I on %I', pol.policyname, pol.tablename);
    end loop;
end $$;

-- 2. TABLE RE-VERIFICATION
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

-- 3. NEW NON-RECURSIVE POLICIES
alter table public.profiles enable row level security;

-- Policy A: Users can see and edit only their own row (Zero recursion)
create policy "p_user_own_profile" on public.profiles
for all using (auth.uid() = id);

-- Policy B: The specific admin email gets full access (Checked via JWT, Zero recursion)
create policy "p_admin_global_access" on public.profiles
for all using (auth.jwt() ->> 'email' = 'mangeshpotale09@gmail.com');

-- 4. TRADES RLS
alter table public.trades enable row level security;

create policy "p_trades_owner" on public.trades
for all using (auth.uid() = user_id);

create policy "p_trades_admin" on public.trades
for all using (auth.jwt() ->> 'email' = 'mangeshpotale09@gmail.com');

-- 5. TRANSACTIONS RLS
alter table public.transactions enable row level security;

create policy "p_transactions_owner" on public.transactions
for all using (auth.uid() = user_id);

create policy "p_transactions_admin" on public.transactions
for all using (auth.jwt() ->> 'email' = 'mangeshpotale09@gmail.com');

-- 6. STORAGE BUCKETS
insert into storage.buckets (id, name, public) 
values ('trade-attachments', 'trade-attachments', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public) 
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do update set public = true;

-- 7. REFRESH API CACHE
notify pgrst, 'reload schema';

-- 8. FINAL SYNC
update public.profiles 
set role = 'ADMIN', is_paid = true, status = 'APPROVED' 
where lower(email) = 'mangeshpotale09@gmail.com';
