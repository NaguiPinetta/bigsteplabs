import type { RequestHandler } from "@sveltejs/kit";
import { SUPABASE_SERVICE_ROLE_KEY } from "$env/static/private";

export const GET: RequestHandler = async () => {
  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
      ? "***SET***"
      : "MISSING",
    SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY
      ? "***SET***"
      : "MISSING",
    hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
    hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY,
    urlLength: import.meta.env.VITE_SUPABASE_URL?.length || 0,
    anonKeyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
    serviceKeyLength: SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    // Debug: Show first few characters of service key if it exists
    serviceKeyPreview: SUPABASE_SERVICE_ROLE_KEY
      ? SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + "..."
      : "NOT_FOUND",
    // Debug: Show all environment variable names
    allEnvKeys: Object.keys(import.meta.env).filter((key) =>
      key.includes("SUPABASE")
    ),
    // Debug: Show process.env keys
    processEnvKeys: Object.keys(process.env).filter((key) =>
      key.includes("SUPABASE")
    ),
  };

  return new Response(JSON.stringify(envVars, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
