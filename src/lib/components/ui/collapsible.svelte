<script lang="ts">
  import { slide } from "svelte/transition";

  export let open = false;
  export let disabled = false;
</script>

<div class="w-full">
  <slot {open} />

  {#if open}
    <div transition:slide={{ duration: 200 }} class="overflow-hidden">
      <slot name="content" />
    </div>
  {/if}
</div>
