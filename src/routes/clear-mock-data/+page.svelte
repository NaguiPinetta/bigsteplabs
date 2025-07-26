<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { authStore } from "$lib/stores/auth";
  import { supabase } from "$lib/supabase";

  let message = "Clearing mock data...";
  let countdown = 3;
  let timer: ReturnType<typeof setInterval> | null = null;

  onMount(() => {
    try {
      // Clear localStorage completely
      if (typeof localStorage !== "undefined") {
        localStorage.clear();
        console.log("✅ localStorage cleared");
      }

      // Clear sessionStorage
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.clear();
        console.log("✅ sessionStorage cleared");
      }

      // Sign out from Supabase
      supabase.auth.signOut();

      // Reset auth store to initial state
      authStore.set({
        session: null,
        user: null,
        loading: false,
      });

      message = "Mock data cleared! Redirecting to login...";

      timer = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
          if (timer) clearInterval(timer);
          goto("/auth/login");
        }
      }, 1000);
    } catch (error) {
      console.error("Error clearing mock data:", error);
      message =
        "Error clearing mock data. Please clear browser cache manually.";
    }

    // Cleanup function
    return () => {
      if (timer) clearInterval(timer);
    };
  });
</script>

<svelte:head>
  <title>Clear Mock Data - BigStepLabs</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-background">
  <div class="text-center space-y-4 max-w-md">
    <h1 class="text-2xl font-bold">🧹 Clearing Mock Data</h1>
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
  </div>
</div>
