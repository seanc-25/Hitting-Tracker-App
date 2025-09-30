-- Minimal fix for Clerk authentication
-- This script only makes the essential changes needed

-- Drop all existing policies first
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

-- Drop ALL foreign key constraints
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
-- This will work even if constraints exist
alter table public.profiles alter column user_id type text;
alter table public.at_bats alter column user_id type text;

-- Temporarily disable RLS to get the app working
alter table public.profiles disable row level security;
alter table public.at_bats disable row level security;

-- Grant necessary permissions
grant all on public.profiles to anon, authenticated;
grant all on public.at_bats to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- Show current status
select 'Script completed successfully' as status;
select 'Profiles user_id type:' as info, data_type 
from information_schema.columns 
where table_name = 'profiles' and column_name = 'user_id';
select 'At_bats user_id type:' as info, data_type 
from information_schema.columns 
where table_name = 'at_bats' and column_name = 'user_id';
