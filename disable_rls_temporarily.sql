-- Temporarily disable RLS to fix profile creation issues
-- Run this in your Supabase SQL editor

-- Disable RLS on profiles table
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on at_bats table  
ALTER TABLE public.at_bats DISABLE ROW LEVEL SECURITY;

-- Check if there are any existing profiles for debugging
SELECT * FROM public.profiles WHERE user_id LIKE 'user_%';
