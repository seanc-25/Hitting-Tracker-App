import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Lazy initialization to avoid issues during static generation
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

const createSupabaseClient = () => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Only throw errors if we're actually trying to use the client (not during static generation)
  if (typeof window !== 'undefined' || process.env.NODE_ENV === 'development') {
    if (!supabaseUrl) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    }

    if (!supabaseAnonKey) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
    }
  }

  // Return a dummy client during static generation if env vars aren't available
  if (!supabaseUrl || !supabaseAnonKey) {
    supabaseClient = createClient<Database>('https://dummy.supabase.co', 'dummy-key', {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
    return supabaseClient;
  }

  // Create real Supabase client
  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Disable Supabase auth since we're using Clerk
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return supabaseClient;
};

// Export the client getter function
export const supabase = createSupabaseClient();

// Create a Supabase client that includes Clerk user ID in headers for RLS
export const createSupabaseClientWithClerk = (clerkUserId: string) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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