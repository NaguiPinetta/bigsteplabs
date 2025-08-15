<script lang="ts">
  import { onMount } from "svelte";
  import { authStore, initializeAuthManually } from "$lib/stores/auth";

  onMount(() => {
    // Just initialize auth state, don't interfere with navigation
    initializeAuthManually();
  });
</script>

<slot />
