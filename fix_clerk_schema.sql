-- Run this SQL in your Supabase SQL Editor to fix the Clerk user_id issue
-- This will change the user_id columns from uuid to text to support Clerk Auth
-- AND create proper RLS policies that work with Clerk authentication

-- ========================================
-- STEP 1: Fix Table Schema for Clerk Auth
-- ========================================

-- Fix profiles table
-- Drop ALL existing policies first (including any with different names)
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can delete their own profile" on public.profiles;
drop policy if exists "delete_own_profile" on public.profiles;
drop policy if exists "view_own_profile" on public.profiles;
drop policy if exists "update_own_profile" on public.profiles;
drop policy if exists "insert_own_profile" on public.profiles;

-- Drop any other policies that might exist
do $$
declare
    r record;
begin
    for r in (select policyname from pg_policies where tablename = 'profiles') loop
        execute 'drop policy if exists ' || quote_ident(r.policyname) || ' on public.profiles';
    end loop;
end $$;

-- Change user_id from uuid to text to support Clerk user IDs
alter table public.profiles alter column user_id type text;

-- Remove the foreign key constraint since we're not using Supabase Auth
alter table public.profiles drop constraint if exists profiles_user_id_fkey;

-- Add unique constraint back (without foreign key)
alter table public.profiles add constraint profiles_user_id_unique unique (user_id);

-- Fix at_bats table
-- Drop ALL existing at_bats policies first
drop policy if exists "Users can view their own at_bats" on public.at_bats;
drop policy if exists "Users can insert their own at_bats" on public.at_bats;
drop policy if exists "Users can update their own at_bats" on public.at_bats;
drop policy if exists "Users can delete their own at_bats" on public.at_bats;

-- Drop any other policies that might exist on at_bats
do $$
declare
    r record;
begin
    for r in (select policyname from pg_policies where tablename = 'at_bats') loop
        execute 'drop policy if exists ' || quote_ident(r.policyname) || ' on public.at_bats';
    end loop;
end $$;

-- Remove ALL foreign key constraints dynamically
-- This will find and drop any foreign key constraints that might exist
do $$
declare
    r record;
begin
    -- Drop foreign key constraints on at_bats table
    for r in (
        select conname, conrelid::regclass as table_name
        from pg_constraint 
        where contype = 'f' 
        and conrelid = 'public.at_bats'::regclass
    ) loop
        execute 'alter table ' || r.table_name || ' drop constraint if exists ' || quote_ident(r.conname);
    end loop;
    
    -- Drop foreign key constraints on profiles table
    for r in (
        select conname, conrelid::regclass as table_name
        from pg_constraint 
        where contype = 'f' 
        and conrelid = 'public.profiles'::regclass
    ) loop
        execute 'alter table ' || r.table_name || ' drop constraint if exists ' || quote_ident(r.conname);
    end loop;
end $$;

-- Now change the column types (after dropping all constraints)
alter table public.at_bats alter column user_id type text;

-- ========================================
-- STEP 2: Create Clerk-Compatible RLS Policies
-- ========================================

-- Enable RLS (make sure it's enabled)
alter table public.profiles enable row level security;
alter table public.at_bats enable row level security;

-- Create a function to get the current Clerk user ID from custom headers
-- This function extracts the Clerk user ID from the X-Clerk-User-ID header
-- Note: We create this in the public schema since we don't have permission for auth schema
create or replace function public.clerk_user_id()
returns text
language sql
security definer
stable
as $$
  select current_setting('request.headers.x-clerk-user-id', true);
$$;

-- Alternative function that also checks JWT claims as fallback
create or replace function public.clerk_user_id_from_claims()
returns text
language sql
security definer
stable
as $$
  select coalesce(
    current_setting('request.headers.x-clerk-user-id', true),
    current_setting('request.jwt.claims', true)::json->>'sub',
    current_setting('app.current_user_id', true)
  );
$$;

-- ========================================
-- STEP 3: Create RLS Policies for Profiles
-- ========================================

-- Users can view their own profile
create policy "Clerk users can view own profile"
    on public.profiles for select
    using (user_id = public.clerk_user_id_from_claims());

-- Users can insert their own profile
create policy "Clerk users can insert own profile"
    on public.profiles for insert
    with check (user_id = public.clerk_user_id_from_claims());

-- Users can update their own profile
create policy "Clerk users can update own profile"
    on public.profiles for update
    using (user_id = public.clerk_user_id_from_claims())
    with check (user_id = public.clerk_user_id_from_claims());

-- Users can delete their own profile
create policy "Clerk users can delete own profile"
    on public.profiles for delete
    using (user_id = public.clerk_user_id_from_claims());

-- ========================================
-- STEP 4: Create RLS Policies for At-Bats
-- ========================================

-- Users can view their own at-bats
create policy "Clerk users can view own at_bats"
    on public.at_bats for select
    using (user_id = public.clerk_user_id_from_claims());

-- Users can insert their own at-bats
create policy "Clerk users can insert own at_bats"
    on public.at_bats for insert
    with check (user_id = public.clerk_user_id_from_claims());

-- Users can update their own at-bats
create policy "Clerk users can update own at_bats"
    on public.at_bats for update
    using (user_id = public.clerk_user_id_from_claims())
    with check (user_id = public.clerk_user_id_from_claims());

-- Users can delete their own at-bats
create policy "Clerk users can delete own at_bats"
    on public.at_bats for delete
    using (user_id = public.clerk_user_id_from_claims());

-- ========================================
-- STEP 5: Grant Necessary Permissions
-- ========================================

-- Grant execute on the clerk_user_id functions in public schema
grant execute on function public.clerk_user_id() to anon, authenticated;
grant execute on function public.clerk_user_id_from_claims() to anon, authenticated;

-- ========================================
-- VERIFICATION QUERIES (Optional - run these to test)
-- ========================================

-- Test that RLS is enabled
-- select schemaname, tablename, rowsecurity from pg_tables where tablename in ('profiles', 'at_bats');

-- Test the policies exist
-- select schemaname, tablename, policyname from pg_policies where tablename in ('profiles', 'at_bats');
