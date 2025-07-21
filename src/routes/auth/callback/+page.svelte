<script lang="ts">
  import { onMount } from "svelte";

  onMount(() => {
    // This page should redirect quickly via the server load function
    // If we're here longer than 5 seconds, something went wrong
    const timeout = setTimeout(() => {
      window.location.href = "/auth/login?error=timeout";
    }, 5000);

    return () => clearTimeout(timeout);
  });
</script>

<svelte:head>
  <title>Signing you in...</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-background">
  <div class="text-center">
    <div
      class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
    ></div>
    <h1 class="text-xl font-semibold text-foreground mb-2">
      Signing you in...
    </h1>
    <p class="text-muted-foreground">
      Please wait while we complete your authentication.
    </p>
  </div>
</div>
