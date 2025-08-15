<script lang="ts">
  import { cn } from '$lib/utils';
  import { ChevronDown } from 'lucide-svelte';

  export let classList = '';
</script>

<span class={cn('flex flex-1', classList)}>
  <slot />
</span>
