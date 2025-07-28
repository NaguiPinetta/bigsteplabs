<script lang="ts">
  import { cn } from "$lib/utils";
  import { createEventDispatcher } from "svelte";

  export let open: boolean = false;
  export let title: string = "";
  export let description: string = "";
  export let size: string = "lg"; // Add size prop for compatibility

  let className: string = "";
  export { className as class };

  const dispatch = createEventDispatcher<{
    close: void;
    "open-change": boolean;
  }>();

  function handleClose() {
    open = false;
    dispatch("close");
    dispatch("open-change", false);
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      handleClose();
    }
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center"
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    aria-describedby="dialog-description"
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    tabindex="-1"
  >
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/80"></div>

    <!-- Dialog Content -->
    <div
      class={cn(
        "relative z-50 grid w-full max-w-lg gap-4 border bg-background p-4 lg:p-6 shadow-lg duration-200 sm:rounded-lg mx-4",
        className
      )}
    >
      <!-- Header -->
      {#if title || description}
        <div class="flex flex-col space-y-1.5 text-center sm:text-left">
          {#if title}
            <h2
              id="dialog-title"
              class="text-lg font-semibold leading-none tracking-tight"
            >
              {title}
            </h2>
          {/if}
          {#if description}
            <p id="dialog-description" class="text-sm text-muted-foreground">
              {description}
            </p>
          {/if}
        </div>
      {/if}

      <!-- Content -->
      <slot />

      <!-- Footer -->
      <slot name="footer" />

      <!-- Close button -->
      <button
        on:click={handleClose}
        class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        aria-label="Close"
      >
        <svg
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  </div>
{/if}
