<script lang="ts">
  export const ssr = false;
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  onMount(() => {
    // Preserve the hash when hopping to /app
    const frag = window.location.hash ?? "";
    goto("/app/auth/callback" + frag, { replaceState: true });
  });
</script>

<p>Redirecting to authentication...</p>
