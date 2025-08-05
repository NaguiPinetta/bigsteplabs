<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { authStore } from "$lib/stores/auth";
  import { PUBLIC_SUPABASE_URL } from "$lib/supabase";

  let loading = true;
  let error = "";

  onMount(async () => {
    console.log("🔄 Main page: Starting...");

    // Check if Supabase is configured
    if (!PUBLIC_SUPABASE_URL || PUBLIC_SUPABASE_URL.includes("your-project")) {
      error = "Supabase not configured";
      loading = false;
      return;
    }

    // Wait for auth to initialize
    console.log("🔄 Main page: Waiting for auth to initialize...");
    await new Promise((resolve) => {
      const unsubscribe = authStore.subscribe((state) => {
        if (state.initialized) {
          console.log("🔄 Main page: Auth initialized, redirecting...");
          unsubscribe();
          resolve(null);
        }
      });
    });

    // Redirect based on authentication status
    let authState: any;
    authStore.subscribe((state) => {
      authState = state;
    })();

    console.log("🔄 Main page: Auth state:", {
      hasUser: !!authState.user,
      userRole: authState.user?.role,
    });

    if (authState.user) {
      // User is authenticated, redirect to dashboard
      console.log("🔄 Main page: Redirecting to dashboard...");
      await goto("/dashboard");
    } else {
      // User is not authenticated, redirect to login
      console.log("🔄 Main page: Redirecting to login...");
      await goto("/auth/login");
    }

    loading = false;
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
