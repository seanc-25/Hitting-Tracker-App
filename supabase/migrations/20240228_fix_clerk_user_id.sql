-- Fix user_id column to work with Clerk Auth instead of Supabase Auth
-- Clerk uses string IDs like "user_33GY09MRIa6l45rXuKSpE2ZlwNv" instead of UUIDs

-- Drop existing policies first
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;

-- Change user_id from uuid to text to support Clerk user IDs
alter table public.profiles alter column user_id type text;

-- Remove the foreign key constraint since we're not using Supabase Auth
alter table public.profiles drop constraint if exists profiles_user_id_fkey;

-- Add unique constraint back (without foreign key)
alter table public.profiles add constraint profiles_user_id_unique unique (user_id);

-- Recreate policies for Clerk Auth (using text user_id)
create policy "Users can view their own profile"
    on public.profiles for select
    using (user_id = current_setting('app.current_user_id', true));

create policy "Users can update their own profile"
    on public.profiles for update
    using (user_id = current_setting('app.current_user_id', true));

create policy "Users can insert their own profile"
    on public.profiles for insert
    with check (user_id = current_setting('app.current_user_id', true));

-- Also fix the at_bats table user_id column
alter table public.at_bats alter column user_id type text;

-- Remove any existing foreign key constraints on at_bats
alter table public.at_bats drop constraint if exists at_bats_user_id_fkey;

-- Add policies for at_bats table
drop policy if exists "Users can view their own at_bats" on public.at_bats;
drop policy if exists "Users can insert their own at_bats" on public.at_bats;
drop policy if exists "Users can update their own at_bats" on public.at_bats;
drop policy if exists "Users can delete their own at_bats" on public.at_bats;

create policy "Users can view their own at_bats"
    on public.at_bats for select
    using (user_id = current_setting('app.current_user_id', true));

create policy "Users can insert their own at_bats"
    on public.at_bats for insert
    with check (user_id = current_setting('app.current_user_id', true));

create policy "Users can update their own at_bats"
    on public.at_bats for update
    using (user_id = current_setting('app.current_user_id', true));

create policy "Users can delete their own at_bats"
    on public.at_bats for delete
    using (user_id = current_setting('app.current_user_id', true));
