<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { authStore } from "$lib/stores/auth";
  import { PUBLIC_SUPABASE_URL } from "$lib/supabase";

  let loading = true;
  let error = "";

  onMount(() => {
    // Check if Supabase is configured
    if (!PUBLIC_SUPABASE_URL || PUBLIC_SUPABASE_URL.includes("your-project")) {
      error = "Supabase not configured";
      loading = false;
      return;
    }

    // Set up auth state subscription
    const unsubscribe = authStore.subscribe((auth) => {
      if (!auth.loading) {
        loading = false;
        if (auth.user) {
          goto("/dashboard");
        } else {
          goto("/auth/login");
        }
      }
    });

    // Auth is already initialized in root layout, no need to call initAuth here
    // Cleanup
    return unsubscribe;
  });
</script>

<svelte:head>
  <title>BigStepLabs 2.0</title>
</svelte:head>

<!-- Loading state -->
<div class="min-h-screen bg-background flex items-center justify-center">
  <div class="text-center">
    {#if error}
      <div class="text-red-500 mb-4">{error}</div>
    {:else}
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"
      ></div>
      <p class="text-muted-foreground">Loading...</p>
    {/if}
  </div>
</div>
