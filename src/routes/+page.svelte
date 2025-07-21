<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { authStore } from "$lib/stores/auth";
  import { PUBLIC_SUPABASE_URL } from "$env/static/public";

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

    // Initialize auth
    import("$lib/stores/auth")
      .then((module) => module.initAuth())
      .catch((err) => {
        console.error("Auth initialization failed:", err);
        error = "Authentication initialization failed";
        loading = false;
      });

    // Cleanup
    return unsubscribe;
  });
</script>

<svelte:head>
  <title>BigStepLabs 2.0</title>
</svelte:head>

<main class="flex items-center justify-center min-h-screen p-4">
  {#if loading}
    <div class="text-center">
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"
      ></div>
      <p class="text-muted-foreground">Loading BigStepLabs...</p>
    </div>
  {:else if error}
    <div class="max-w-md text-center space-y-4">
      <h1 class="text-2xl font-bold">⚠️ Configuration Issue</h1>
      <p class="text-muted-foreground">{error}</p>
      <div class="flex gap-3 justify-center">
        <button
          on:click={() => window.location.reload()}
          class="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
        >
          Retry
        </button>
        <a
          href="/dev"
          class="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80"
        >
          Dev Mode
        </a>
      </div>
    </div>
  {:else}
    <p class="text-muted-foreground">Redirecting...</p>
  {/if}
</main>
