<script lang="ts">
  import { toastStore } from "$lib/stores/toast";
  import Toast from "./toast.svelte";
</script>

<!-- Toast Container -->
<div
  class="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none"
  role="region"
  aria-label="Notifications"
>
  {#each $toastStore as toast (toast.id)}
    <div class="pointer-events-auto">
      <Toast
        type={toast.type}
        title={toast.title}
        message={toast.message}
        duration={toast.duration}
        show={true}
        on:close={() => toastStore.remove(toast.id)}
      />
    </div>
  {/each}
</div>
