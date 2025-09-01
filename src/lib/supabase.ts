import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable automatic session persistence
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Enable to catch OAuth redirects
    // Use localStorage for session storage
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
    // PKCE flow for enhanced security
    flowType: 'pkce',
  },
}); 