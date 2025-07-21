import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  // Get tokens from cookies
  const accessToken = event.cookies.get("access_token");
  const refreshToken = event.cookies.get("refresh_token");
  const userCookie = event.cookies.get("user");

  // Set auth state in locals for server-side access
  if (accessToken && refreshToken && userCookie) {
    try {
      const user = JSON.parse(userCookie);
      // Create a simplified session object
      event.locals.session = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 3600,
        token_type: "bearer",
        user,
      } as any;
      event.locals.user = user;
    } catch (e) {
      console.error("Failed to parse user cookie:", e);
      // Clear invalid cookies
      event.cookies.delete("access_token", { path: "/" });
      event.cookies.delete("refresh_token", { path: "/" });
      event.cookies.delete("user", { path: "/" });
    }
  }

  return await resolve(event);
};
