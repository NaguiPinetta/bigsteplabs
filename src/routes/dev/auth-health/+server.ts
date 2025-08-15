import { PUBLIC_SUPABASE_URL } from "$env/static/public";

export const GET = async () => {
  try {
    const res = await fetch(`${PUBLIC_SUPABASE_URL}/auth/v1/health`);

    return new Response(
      JSON.stringify({
        ok: res.ok,
        status: res.status,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { "content-type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );
  }
};
