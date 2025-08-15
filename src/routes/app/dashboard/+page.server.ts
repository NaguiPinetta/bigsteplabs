import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  // Check if user is authenticated
  if (!locals.session) {
    // Instead of redirecting, let the client handle auth
    // The client-side auth will redirect if needed
    return {
      user: null,
      session: null,
    };
  }

  // Return minimal data to prevent 500 errors
  return {
    user: locals.user,
    session: locals.session,
    // Add any other data needed by the dashboard
  };
};
