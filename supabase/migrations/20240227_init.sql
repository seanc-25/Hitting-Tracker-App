-- Drop existing profiles table if it exists
drop table if exists public.profiles;

-- Create profiles table with correct schema
create table public.profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid unique references auth.users(id),
    email text,
    first_name text not null,
    last_name text not null,
    birthday date not null,
    hitting_side text not null check (hitting_side in ('left', 'right', 'switch')),
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    has_completed_onboarding boolean not null default false
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create policies
create policy "Users can view their own profile"
    on public.profiles for select
    using (auth.uid() = user_id);

create policy "Users can update their own profile"
    on public.profiles for update
    using (auth.uid() = user_id);

create policy "Users can insert their own profile"
    on public.profiles for insert
    with check (auth.uid() = user_id);

-- Create function to handle updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger handle_updated_at
    before update on public.profiles
    for each row
    execute procedure public.handle_updated_at(); 