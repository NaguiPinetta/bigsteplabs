import { redirect } from "@sveltejs/kit";
import { createServerClient } from "@supabase/ssr";
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_PUBLISHABLE_KEY,
} from "$lib/supabase";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url, cookies }) => {
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  console.log("Callback received:", { hasCode: !!code, next });

  if (code) {
    const supabase = createServerClient(
      PUBLIC_SUPABASE_URL,
      PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          get(key) {
            return cookies.get(key);
          },
          set(key, value, options) {
            cookies.set(key, value, {
              ...options,
              path: "/",
              httpOnly: false, // Allow client-side access for development
              secure: false, // Allow non-HTTPS in development
              sameSite: "lax",
            });
          },
          remove(key, options) {
            cookies.delete(key, { ...options, path: "/" });
          },
        },
      }
    );

    try {
      console.log("Exchanging code for session...");
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Code exchange failed:", error);
        throw redirect(303, "/auth/login?error=exchange_failed");
      }

      console.log("Code exchange successful:", {
        hasSession: !!data.session,
        hasUser: !!data.user,
      });

      if (data.session && data.user) {
        // Check if user exists in our users table, create if not
        const { data: existingUser, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (userError && userError.code === "PGRST116") {
          // User doesn't exist, create them
          console.log("Creating new user profile...");
          await supabase.from("users").insert({
            id: data.user.id,
            email: data.user.email,
            role: "Student",
          });
        }

        console.log("Redirecting to:", next);
        throw redirect(303, next);
      }
    } catch (err) {
      if (err instanceof Response) {
        throw err; // Re-throw redirects
      }
      console.error("Unexpected callback error:", err);
      throw redirect(303, "/auth/login?error=callback_failed");
    }
  }

  console.log("No code provided, redirecting to login");
  throw redirect(303, "/auth/login?error=no_code");
};
