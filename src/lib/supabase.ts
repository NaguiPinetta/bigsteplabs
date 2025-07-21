import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import { browser } from "$app/environment";
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_PUBLISHABLE_KEY,
} from "$env/static/public";
import type { Database } from "./types/database";

const supabaseUrl = PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = PUBLIC_SUPABASE_PUBLISHABLE_KEY || "placeholder-key";

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export const createSupabaseLoadClient = (fetch: typeof globalThis.fetch) => {
  return createBrowserClient<Database>(supabaseUrl, supabaseKey, {
    global: { fetch },
    cookies: {
      get: (key: string) => {
        if (!browser) return undefined;
        const cookies = document.cookie.split(";");
        const cookie = cookies.find((c) => c.trim().startsWith(`${key}=`));
        return cookie ? cookie.split("=")[1] : undefined;
      },
      set: (key: string, value: string, options?: any) => {
        if (!browser) return;
        const cookieString = `${key}=${value}; Path=/; ${
          options?.maxAge ? `Max-Age=${options.maxAge};` : ""
        }`;
        document.cookie = cookieString;
      },
      remove: (key: string, options?: any) => {
        if (!browser) return;
        document.cookie = `${key}=; Path=/; Max-Age=0`;
      },
    },
  });
};
