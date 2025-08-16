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
    "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  {...$$restProps}
/>
