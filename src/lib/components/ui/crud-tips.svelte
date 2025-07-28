<script lang="ts">
  import { Lightbulb, Check } from "lucide-svelte";
  import Card from "./card.svelte";

  export let tips: string[] = [];
  export let title: string = "Management Tips";
</script>

<Card class="mt-6">
  <div class="flex items-center gap-2 mb-4">
    <Lightbulb class="h-5 w-5 text-yellow-500" />
    <h3 class="text-lg font-semibold">{title}</h3>
  </div>
  <div class="space-y-2">
    {#each tips as tip}
      <div class="flex items-start gap-2">
        <Check class="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
        <span class="text-sm text-muted-foreground">{tip}</span>
      </div>
    {/each}
  </div>
</Card> 