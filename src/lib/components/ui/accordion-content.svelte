<script lang="ts">
  import { cn } from '$lib/utils';

  export let classList = '';
</script>

<div class={cn('pt-0', classList)}>
  <slot />
</div>
