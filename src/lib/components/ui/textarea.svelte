<script lang="ts">
  import { cn } from "$lib/utils";

  export let value: string = "";
  export let placeholder: string = "";
  export let disabled: boolean = false;
  export let readonly: boolean = false;
  export let required: boolean = false;
  export let id: string = "";
  export let name: string = "";
  export let rows: number = 3;

  let className: string = "";
  export { className as class };
</script>

<textarea
  {id}
  {name}
  {placeholder}
  {disabled}
  {readonly}
  {required}
  {rows}
  bind:value
  class={cn(
    "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
></textarea>
