<script lang="ts">
  // Force client-only so the hash (#...) is available
  export const ssr = false;

  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { supabase } from "$lib/supabase";

  onMount(async () => {
    console.log("[AUTH CALLBACK] Page mounted, processing auth...");

    // Check for different auth flow types
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    console.log("[AUTH CALLBACK] Hash params:", {
      accessToken: !!accessToken,
      refreshToken: !!refreshToken,
    });

    if (accessToken && refreshToken) {
      // Direct token flow (older Supabase versions)
      console.log("[AUTH CALLBACK] Using direct token flow");
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.warn("[AUTH CALLBACK] setSession failed:", error.message);
        return;
      }
      console.log("[AUTH CALLBACK] setSession successful");
    } else {
      // PKCE flow (newer Supabase versions)
      console.log("[AUTH CALLBACK] Using PKCE flow");
      const { error } = await supabase.auth.exchangeCodeForSession();
      if (error) {
        console.warn("[AUTH CALLBACK] exchange failed:", error.message);
        return;
      }
      console.log("[AUTH CALLBACK] exchangeCodeForSession successful");
    }

    // Success: replace URL so the hash disappears
    console.log("[AUTH CALLBACK] Redirecting to dashboard...");
    goto("/app/dashboard");
  });
</script>

<p>Signing you in…</p>
