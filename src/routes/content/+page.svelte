<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  onMount(() => {
    // Redirect to lessons page since we've migrated from Content to Lessons
    goto("/lessons");
  });
</script>

<svelte:head>
  <title>Redirecting to Lessons - BigStepLabs</title>
</svelte:head>

<div class="min-h-screen bg-background flex items-center justify-center">
  <div class="text-center">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
    <p class="text-muted-foreground">Redirecting to Lessons...</p>
  </div>
</div>
