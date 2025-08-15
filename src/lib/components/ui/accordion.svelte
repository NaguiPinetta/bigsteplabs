<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ChevronDown } from 'lucide-svelte';
  import { cn } from '$lib/utils';

  export let type: 'single' | 'multiple' = 'single';
  export let collapsible = false;
  export let value: string | string[] | undefined = undefined;
  export let disabled = false;
  export let classList = '';

  const dispatch = createEventDispatcher<{
    valueChange: { value: string | string[] | undefined };
  }>();

  let items: HTMLDivElement[] = [];

  function handleItemClick(itemValue: string) {
    if (disabled) return;

    let newValue: string | string[] | undefined;

    if (type === 'single') {
      if (value === itemValue && collapsible) {
        newValue = undefined;
      } else {
        newValue = itemValue;
      }
    } else {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(itemValue)) {
        newValue = currentValues.filter(v => v !== itemValue);
      } else {
        newValue = [...currentValues, itemValue];
      }
    }

    value = newValue;
    dispatch('valueChange', { value: newValue });
  }

  function isItemOpen(itemValue: string): boolean {
    if (type === 'single') {
      return value === itemValue;
    } else {
      return Array.isArray(value) && value.includes(itemValue);
    }
  }
</script>

<div class={cn('space-y-2', classList)}>
  {#each items as item, index}
    <slot {item} {index} />
  {/each}
</div>

<div bind:this={items} class="hidden"></div>
