import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const getEnv = (name: string) => (import.meta as any).env[name] || '';

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

let client: SupabaseClient | null = null;

// Use a proxy to lazily initialize the client only when accessed.
// This prevents the app from crashing on startup if the URL is missing.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!client) {
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.');
      }
      client = createClient(supabaseUrl, supabaseAnonKey);
    }
    return (client as any)[prop];
  }
});
