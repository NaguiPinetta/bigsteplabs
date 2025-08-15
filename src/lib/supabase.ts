import { createClient } from "@supabase/supabase-js";
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
} from "$env/static/public";

if (!PUBLIC_SUPABASE_URL) throw new Error("PUBLIC_SUPABASE_URL missing");
if (!PUBLIC_SUPABASE_ANON_KEY)
  throw new Error("PUBLIC_SUPABASE_ANON_KEY missing");

export const supabase = createClient(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
