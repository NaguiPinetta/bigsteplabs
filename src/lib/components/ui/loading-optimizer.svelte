<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { authStore } from "$lib/stores/auth";
  import { dataManagerStore, isAnyDataLoading } from "$lib/stores/data-manager";
  import { Loader2 } from "lucide-svelte";

  export let showLoadingIndicator = true;
  export let loadingText = "Loading...";
  export let delay = 300; // Show loading indicator after this delay

  let loading = false;
  let showSpinner = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  // Subscribe to loading states
  $: loading = $authStore.loading || $isAnyDataLoading;
  
  // Show spinner after delay to prevent flickering
  $: if (loading && !showSpinner) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      showSpinner = true;
    }, delay);
  } else if (!loading) {
    if (timeoutId) clearTimeout(timeoutId);
    showSpinner = false;
  }

  onDestroy(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
</script>

{#if showSpinner && showLoadingIndicator}
  <div class="flex items-center justify-center p-4">
    <Loader2 class="w-6 h-6 animate-spin text-primary mr-2" />
    <span class="text-sm text-muted-foreground">{loadingText}</span>
  </div>
{/if}

<slot /> 