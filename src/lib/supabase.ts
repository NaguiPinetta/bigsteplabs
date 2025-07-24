import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { browser } from '$app/environment';
import type { Database } from './types/database';

// These variables must be defined in the environment (.env) and begin with VITE_
const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase configuration: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set');
}

// Client-side Supabase instance (anon key only)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper to create a load-time client for SvelteKit load functions
export const createSupabaseLoadClient = (fetch: typeof globalThis.fetch) => {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: { fetch },
    cookies: {
      get(key: string) {
        if (!browser) return undefined;
        return document.cookie
          .split(';')
          .find((c) => c.trim().startsWith(`${key}=`))
          ?.split('=')[1];
      },
      set(key, value, options?) {
        if (!browser) return;
        const opts = options?.maxAge ? `; Max-Age=${options.maxAge}` : '';
        document.cookie = `${key}=${value}; Path=/` + opts;
      },
      remove(key) {
        if (!browser) return;
        document.cookie = `${key}=; Path=/; Max-Age=0`;
      },
    },
  });
};

// Do NOT export the service role key here. If server-side functions need it,
// create a separate module (e.g., src/lib/server/supabase-admin.ts) that
// reads process.env.SUPABASE_SERVICE_ROLE_KEY and uses createClient there.

// Export for backward compatibility (deprecated - use VITE_SUPABASE_ANON_KEY instead)
export const PUBLIC_SUPABASE_URL = supabaseUrl;
export const PUBLIC_SUPABASE_PUBLISHABLE_KEY = supabaseAnonKey;
