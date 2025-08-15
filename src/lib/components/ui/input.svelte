<script lang="ts">
  import { cn } from "$lib/utils";

  export let value: string | number = "";
  export let placeholder: string = "";
  export let type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "search"
    | "url"
    | "tel" = "text";
  export let disabled: boolean = false;
  export let readonly: boolean = false;
  export let required: boolean = false;
  export let id: string = "";
  export let name: string = "";
  export let min: string | number | undefined = undefined;
  export let max: string | number | undefined = undefined;
  export let step: string | number | undefined = undefined;
  // Limit autocomplete to known set to satisfy typings; still forwarded if set
  export let autocomplete: "off" | "on" | undefined = undefined;
  export let autofocus: boolean | undefined = undefined;

  let className: string = "";
  export { className as class };
</script>

<input
  {id}
  {name}
  {type}
  {placeholder}
  {disabled}
  {readonly}
  {required}
  {min}
  {max}
  {step}
  {autocomplete}
  {autofocus}
  bind:value
  class={cn(
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  {...$$restProps}
/>
