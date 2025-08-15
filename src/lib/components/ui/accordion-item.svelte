<script lang="ts">
  import { cn } from '$lib/utils';
  import { ChevronDown } from 'lucide-svelte';

  export let value: string;
export let disabled = false;
export let classList = '';

// This value is used by the parent accordion component
export const valueForParent = value;

  let isOpen = false;
  let content: HTMLDivElement;

  function toggle() {
    if (disabled) return;
    isOpen = !isOpen;
  }
</script>

<div class={cn('border rounded-lg', classList)}>
  <button
    type="button"
    class="flex w-full items-center justify-between py-4 px-6 text-left font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180"
    disabled={disabled}
    on:click={toggle}
    data-state={isOpen ? 'open' : 'closed'}
  >
    <slot name="trigger" />
    <ChevronDown class="h-4 w-4 shrink-0 transition-transform duration-200" />
  </button>
  
  <div
    bind:this={content}
    class="overflow-hidden text-sm transition-all duration-200"
    style="max-height: {isOpen ? content?.scrollHeight + 'px' : '0px'}"
  >
    <div class="px-6 pb-4 pt-0">
      <slot />
    </div>
  </div>
</div>
