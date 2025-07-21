import { redirect, fail } from "@sveltejs/kit";
import { supabase } from "$lib/supabase";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url, locals }) => {
  // If user is already logged in, redirect to dashboard
  if (locals.session) {
    throw redirect(303, url.searchParams.get("redirectTo") || "/dashboard");
  }

  return {};
};

export const actions: Actions = {
  default: async ({ request, url }) => {
    const formData = await request.formData();
    const email = formData.get("email") as string;

    if (!email) {
      return fail(400, {
        error: "Email is required",
        email,
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return fail(400, {
        error: "Please enter a valid email address",
        email,
      });
    }

    try {
      const redirectTo = url.searchParams.get("redirectTo") || "/dashboard";
      const callbackUrl = `${
        url.origin
      }/auth/callback?next=${encodeURIComponent(redirectTo)}`;

      console.log("Sending magic link to:", email);
      console.log("Callback URL:", callbackUrl);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl,
        },
      });

      if (error) {
        console.error("Magic link error:", error);
        return fail(500, {
          error: error.message,
          email,
        });
      }

      console.log("Magic link sent successfully");
      return {
        success: true,
        email,
      };
    } catch (err) {
      console.error("Unexpected error:", err);
      return fail(500, {
        error: "An unexpected error occurred. Please try again.",
        email,
      });
    }
  },
};
