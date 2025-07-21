<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { resetAuth } from "$lib/stores/auth";

  let message = "Clearing authentication state...";
  let countdown = 3;
  let timer: ReturnType<typeof setInterval> | null = null;

  onMount(() => {
    try {
      // Clear localStorage completely
      if (typeof localStorage !== "undefined") {
        localStorage.clear();
      }

      // Reset auth state
      resetAuth();

      message = "Authentication cleared! Redirecting to login...";

      timer = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
          if (timer) clearInterval(timer);
          goto("/auth/login");
        }
      }, 1000);
    } catch (error) {
      console.error("Error clearing auth:", error);
      message =
        "Error clearing authentication. Please clear browser cache manually.";
    }

    // Cleanup function
    return () => {
      if (timer) clearInterval(timer);
    };
  });
</script>

<svelte:head>
  <title>Clear Auth - BigStepLabs</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-background">
  <div class="text-center space-y-4 max-w-md">
    <h1 class="text-2xl font-bold">🧹 Clearing Authentication</h1>
    <p class="text-muted-foreground">{message}</p>

    {#if countdown > 0}
      <div class="text-4xl font-bold text-primary">{countdown}</div>
    {/if}

    <div class="space-y-2">
      <button
        on:click={() => goto("/auth/login")}
        class="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 mr-2"
      >
        Go to Login
      </button>
      <button
        on:click={() => goto("/dashboard")}
        class="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80"
      >
        Try Dashboard
      </button>
    </div>

    <div class="text-xs text-muted-foreground mt-4">
      <p>If you're still having issues:</p>
      <ol class="list-decimal list-inside space-y-1 mt-2">
        <li>Open DevTools (F12)</li>
        <li>Go to Application → Storage</li>
        <li>Clear all localStorage</li>
        <li>Refresh the page</li>
      </ol>
    </div>
  </div>
</div>
