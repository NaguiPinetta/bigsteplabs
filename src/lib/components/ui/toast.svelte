<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { CheckCircle, XCircle, Info, X } from "lucide-svelte";
  import { cn } from "$lib/utils";

  export let type: "success" | "error" | "info" = "info";
  export let title: string = "";
  export let message: string = "";
  export let duration: number = 5000; // Auto-dismiss after 5 seconds
  export let show: boolean = false;

  const dispatch = createEventDispatcher();

  let timeoutId: NodeJS.Timeout;

  $: if (show && duration > 0) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      show = false;
      dispatch("close");
    }, duration);
  }

  function handleClose() {
    show = false;
    dispatch("close");
  }

  function getIcon() {
    switch (type) {
      case "success":
        return CheckCircle;
      case "error":
        return XCircle;
      case "info":
        return Info;
      default:
        return Info;
    }
  }

  function getStyles() {
    const baseStyles =
      "flex items-start space-x-3 p-4 rounded-lg border shadow-lg";

    switch (type) {
      case "success":
        return cn(
          baseStyles,
          "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200"
        );
      case "error":
        return cn(
          baseStyles,
          "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200"
        );
      case "info":
        return cn(
          baseStyles,
          "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200"
        );
      default:
        return cn(
          baseStyles,
          "bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-200"
        );
    }
  }

  const Icon = getIcon();
</script>

{#if show}
  <div
    class={getStyles()}
    role="alert"
    aria-live="assertive"
    aria-atomic="true"
    transition:slide={{ duration: 300 }}
  >
    <Icon class="w-5 h-5 flex-shrink-0 mt-0.5" />
    <div class="flex-1 min-w-0">
      {#if title}
        <h4 class="text-sm font-medium">{title}</h4>
      {/if}
      {#if message}
        <p class="text-sm mt-1">{message}</p>
      {/if}
    </div>
    <button
      on:click={handleClose}
      class="flex-shrink-0 ml-3 text-current opacity-70 hover:opacity-100 transition-opacity"
      aria-label="Close notification"
    >
      <X class="w-4 h-4" />
    </button>
  </div>
{/if}
