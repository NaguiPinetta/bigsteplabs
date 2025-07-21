import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
  console.log("Layout server load - Session:", !!locals.session);
  console.log(
    "Layout server load - User:",
    locals.user ? "User exists" : "No user"
  );

  return {
    session: locals.session || null,
    user: locals.user || null,
  };
};
