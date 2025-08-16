<script lang="ts">
  import { cn } from "$lib/utils";
  import { cva, type VariantProps } from "class-variance-authority";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
      variants: {
        variant: {
          default: "bg-red-600 text-white hover:bg-red-700",
          destructive: "bg-red-600 text-white hover:bg-red-700",
          outline:
            "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
          secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
          ghost: "hover:bg-gray-100 hover:text-gray-900",
          link: "text-red-600 underline-offset-4 hover:underline",
        },
        size: {
          default: "h-10 px-4 py-2 min-h-[44px]",
          sm: "h-9 rounded-md px-3 min-h-[36px]",
          lg: "h-11 rounded-md px-8 min-h-[48px]",
          icon: "h-10 w-10 min-h-[44px] min-w-[44px]",
        },
      },
      defaultVariants: {
        variant: "default",
        size: "default",
      },
    }
  );

  export let variant: VariantProps<typeof buttonVariants>["variant"] =
    "default";
  export let size: VariantProps<typeof buttonVariants>["size"] = "default";
  export let type: "button" | "submit" | "reset" = "button";
  export let disabled: boolean = false;
  export let href: string | undefined = undefined;

  let className: string = "";
  export { className as class };

  function handleClick(event: MouseEvent) {
    dispatch("click", event);
  }
</script>

{#if href}
  <a
    {href}
    class={cn(buttonVariants({ variant, size }), className)}
    on:click={handleClick}
  >
    <slot />
  </a>
{:else}
  <button
    {type}
    {disabled}
    class={cn(buttonVariants({ variant, size }), className)}
    on:click={handleClick}
  >
    <slot />
  </button>
{/if}
