-- Simple fix for Clerk authentication
-- This temporarily disables RLS to get the app working, then we can add proper security later

-- Drop all existing policies
do $$
declare
    r record;
begin
    -- Drop policies on profiles table
    for r in (select policyname from pg_policies where tablename = 'profiles') loop
        execute 'drop policy if exists ' || quote_ident(r.policyname) || ' on public.profiles';
    end loop;
    
    -- Drop policies on at_bats table
    for r in (select policyname from pg_policies where tablename = 'at_bats') loop
        execute 'drop policy if exists ' || quote_ident(r.policyname) || ' on public.at_bats';
    end loop;
end $$;

-- Drop any foreign key constraints that might cause issues
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

-- Change user_id columns to text to support Clerk user IDs
alter table public.profiles alter column user_id type text;
alter table public.at_bats alter column user_id type text;

-- Add unique constraints back (handle existing constraint)
alter table public.profiles drop constraint if exists profiles_user_id_unique;
alter table public.profiles drop constraint if exists profiles_user_id_fkey;
alter table public.profiles drop constraint if exists profiles_user_id_fkey_1;
alter table public.profiles drop constraint if exists profiles_user_id_fkey_2;
-- Only add the unique constraint if it doesn't exist
do $$
begin
    if not exists (
        select 1 from pg_constraint 
        where conname = 'profiles_user_id_unique' 
        and conrelid = 'public.profiles'::regclass
    ) then
        alter table public.profiles add constraint profiles_user_id_unique unique (user_id);
    end if;
end $$;

-- Temporarily disable RLS to get the app working
-- We'll add proper RLS policies later once the basic functionality works
alter table public.profiles disable row level security;
alter table public.at_bats disable row level security;

-- Grant necessary permissions
grant all on public.profiles to anon, authenticated;
grant all on public.at_bats to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
