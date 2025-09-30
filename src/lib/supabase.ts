import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Create Supabase client without auth (Clerk handles authentication)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Disable Supabase auth since we're using Clerk
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// Create a Supabase client that includes Clerk user ID in headers for RLS
export const createSupabaseClientWithClerk = (clerkUserId: string) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'X-Clerk-User-ID': clerkUserId,
      },
    },
  });
};

// For now, let's use the regular client since we disabled RLS temporarily
export const getSupabaseClient = () => supabase; 