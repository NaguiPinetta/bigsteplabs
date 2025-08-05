<script lang="ts">
  import { cn } from "$lib/utils";

  export let value: string = "";
  export let options: { label: string; value: string }[] = [];
  export let placeholder: string = "Select an option...";
  export let disabled: boolean = false;
  export let required: boolean = false;
  export let id: string = "";
  export let name: string = "";

  let className: string = "";
  export { className as class };
</script>

<select
  {id}
  {name}
  {disabled}
  {required}
  bind:value
  class={cn(
    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
>
  {#if placeholder}
    <option value="">{placeholder}</option>
  {/if}
  {#each options as option}
    <option value={option.value}>{option.label}</option>
  {/each}
  <slot />
</select>
