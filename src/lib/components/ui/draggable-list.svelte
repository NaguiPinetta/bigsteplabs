<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { GripVertical } from "lucide-svelte";

  export let items: any[] = [];
  export let disabled = false;
  export let dragHandle = true;
  export let classList = "";

  const dispatch = createEventDispatcher();

  let draggedItem: any = null;
  let draggedIndex = -1;
  let dropTargetIndex = -1;

  function handleDragStart(event: DragEvent, item: any, index: number) {
    if (disabled) return;
    
    draggedItem = item;
    draggedIndex = index;
    
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", index.toString());
    }
  }

  function handleDragOver(event: DragEvent, index: number) {
    if (disabled || draggedIndex === index) return;
    
    event.preventDefault();
    event.dataTransfer!.dropEffect = "move";
    dropTargetIndex = index;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    dropTargetIndex = -1;
  }

  function handleDrop(event: DragEvent, index: number) {
    if (disabled || draggedIndex === index || draggedIndex === -1) return;
    
    event.preventDefault();
    
    // Create new array with reordered items
    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, removed);
    
    // Dispatch reorder event
    dispatch("reorder", {
      oldIndex: draggedIndex,
      newIndex: index,
      items: newItems
    });
    
    // Reset drag state
    draggedItem = null;
    draggedIndex = -1;
    dropTargetIndex = -1;
  }

  function handleDragEnd() {
    draggedItem = null;
    draggedIndex = -1;
    dropTargetIndex = -1;
  }
</script>

<div class="space-y-2 {classList}">
  {#each items as item, index (item.id || index)}
    <div
      class="relative transition-all duration-200 {draggedIndex === index ? 'opacity-50' : ''} {dropTargetIndex === index ? 'border-2 border-dashed border-primary' : ''}"
      draggable={!disabled}
      on:dragstart={(e) => handleDragStart(e, item, index)}
      on:dragover={(e) => handleDragOver(e, index)}
      on:dragleave={handleDragLeave}
      on:drop={(e) => handleDrop(e, index)}
      on:dragend={handleDragEnd}
    >
      <slot {item} {index} {draggedIndex} {dropTargetIndex} />
    </div>
  {/each}
</div> 