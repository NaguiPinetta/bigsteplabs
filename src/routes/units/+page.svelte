<script lang="ts">
  import { onMount } from "svelte";
  import { authStore, canManageContent } from "$lib/stores/auth";
  import {
    unitsStore,
    loadUnits,
    createUnit,
    deleteUnit,
  } from "$lib/stores/units";
  import { modulesStore, loadModules } from "$lib/stores/modules";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Textarea from "$lib/components/ui/textarea.svelte";
  import Select from "$lib/components/ui/select.svelte";
  import {
    Layers3,
    Plus,
    Edit,
    Trash2,
    BookOpen,
    Clock,
    GripVertical,
    Loader2,
    AlertCircle,
  } from "lucide-svelte";

  $: user = $authStore.user;
  $: canManage = canManageContent(user);
  $: unitState = $unitsStore;
  $: moduleState = $modulesStore;
  $: units = unitState.units;
  $: modules = moduleState.modules;

  let createDialogOpen = false;
  let newUnit = {
    title: "",
    description: "",
    module_id: "",
    estimated_duration_minutes: 30,
  };

  $: moduleOptions = modules.map((m) => ({
    value: m.id,
    label: m.title,
  }));

  onMount(async () => {
    console.log("🔍 Units page onMount - Debug info:");
    console.log("  - User:", user);
    console.log("  - Can manage:", canManage);
    console.log("  - Auth store state:", $authStore);

    if (canManage) {
      console.log("✅ Loading units and modules...");
      // Load both units and modules
      await Promise.all([loadUnits(), loadModules()]);
      console.log(
        "📋 Load complete - Units:",
        units.length,
        "Modules:",
        modules.length
      );
    } else {
      console.log("❌ Cannot manage content - not loading data");
    }
  });

  function openCreateDialog() {
    newUnit = {
      title: "",
      description: "",
      module_id: "",
      estimated_duration_minutes: 30,
    };
    createDialogOpen = true;
  }

  async function handleCreateUnit() {
    if (!user) return;

    const result = await createUnit({
      title: newUnit.title.trim(),
      description: newUnit.description.trim() || null,
      module_id: newUnit.module_id,
      estimated_duration_minutes: newUnit.estimated_duration_minutes,
      is_published: false,
      status: "pending",
    });

    if (result.data) {
      createDialogOpen = false;
      newUnit = {
        title: "",
        description: "",
        module_id: "",
        estimated_duration_minutes: 30,
      };
    }
  }

  async function handleDeleteUnit(unit: any) {
    if (!confirm(`Are you sure you want to delete "${unit.title}"?`)) {
      return;
    }
    await deleteUnit(unit.id);
  }

  function getModuleName(moduleId: string): string {
    const module = modules.find((m) => m.id === moduleId);
    return module ? module.title : "Unknown Module";
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
</script>

<svelte:head>
  <title>Units - BigStepLabs</title>
  <meta
    name="description"
    content="Manage learning units within your modules"
  />
</svelte:head>

<!-- Page Header -->
<div class="mb-8 flex items-center justify-between">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Units</h1>
    <p class="text-muted-foreground">
      Manage learning units within your modules
    </p>
  </div>

  {#if canManage}
    <Button on:click={openCreateDialog}>
      <Plus class="w-4 h-4 mr-2" />
      Create Unit
    </Button>
  {/if}
</div>

<div class="max-w-7xl mx-auto">
  {#if !canManage}
    <Card class="p-8 text-center">
      <h2 class="text-xl font-semibold mb-2">Access Restricted</h2>
      <p class="text-muted-foreground">
        You need Admin or Collaborator privileges to manage units.
      </p>
    </Card>
  {:else if unitState.loading || moduleState.loading}
    <div class="flex items-center justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
      <span class="ml-2 text-muted-foreground">Loading units...</span>
    </div>
  {:else if unitState.error}
    <Card class="p-6 border-destructive">
      <div class="flex items-center">
        <AlertCircle class="w-5 h-5 text-destructive mr-2" />
        <span class="text-destructive font-medium"
          >Error: {unitState.error}</span
        >
      </div>
    </Card>
  {:else if units.length === 0}
    <Card class="p-12 text-center">
      <Layers3 class="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h3 class="text-xl font-semibold text-foreground mb-2">No Units Yet</h3>
      <p class="text-muted-foreground mb-6">
        Create your first unit to start organizing your learning content. Units
        are lessons or activities within a module.
      </p>

      <Button on:click={openCreateDialog} disabled={modules.length === 0}>
        <Plus class="w-4 h-4 mr-2" />
        Create Your First Unit
      </Button>
    </Card>
  {:else}
    <!-- Units List -->
    <div class="space-y-4">
      {#each units as unit (unit.id)}
        <Card class="p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <Layers3 class="w-5 h-5 text-primary" />
                <h3 class="text-lg font-semibold text-foreground">
                  {unit.title}
                </h3>
                <div class="flex items-center space-x-1 text-muted-foreground">
                  <BookOpen class="w-4 h-4" />
                  <span class="text-sm">{getModuleName(unit.module_id)}</span>
                </div>
              </div>

              {#if unit.description}
                <p class="text-muted-foreground mb-3">
                  {unit.description}
                </p>
              {/if}

              <div
                class="flex items-center space-x-4 text-sm text-muted-foreground"
              >
                <div class="flex items-center space-x-1">
                  <Clock class="w-4 h-4" />
                  <span>{unit.estimated_duration_minutes || 30} minutes</span>
                </div>
                <div>
                  Status: <span class="capitalize">{unit.status}</span>
                </div>
                <div>
                  {unit.is_published ? "Published" : "Draft"}
                </div>
              </div>

              <div class="text-xs text-muted-foreground mt-2">
                Created {formatDate(unit.created_at)}
              </div>
            </div>

            <div class="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Edit class="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                on:click={() => handleDeleteUnit(unit)}
                class="text-destructive hover:text-destructive"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>

<!-- Create Unit Dialog -->
<Dialog bind:open={createDialogOpen} title="Create New Unit">
  <div class="space-y-4">
    <div>
      <label for="unit-title" class="block text-sm font-medium mb-2"
        >Unit Title *</label
      >
      <Input
        id="unit-title"
        bind:value={newUnit.title}
        placeholder="Enter unit title..."
        required
      />
    </div>

    <div>
      <label for="unit-module" class="block text-sm font-medium mb-2"
        >Module *</label
      >
      <Select
        id="unit-module"
        bind:value={newUnit.module_id}
        options={moduleOptions}
        placeholder="Select a module..."
      />
    </div>

    <div>
      <label for="unit-description" class="block text-sm font-medium mb-2"
        >Description</label
      >
      <Textarea
        id="unit-description"
        bind:value={newUnit.description}
        placeholder="Describe what students will learn in this unit..."
        rows={3}
      />
    </div>

    <div>
      <label for="estimated-duration" class="block text-sm font-medium mb-2"
        >Estimated Duration (minutes)</label
      >
      <Input
        id="estimated-duration"
        type="number"
        bind:value={newUnit.estimated_duration_minutes}
        min="1"
        max="1440"
      />
    </div>
  </div>

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={() => (createDialogOpen = false)}>
      Cancel
    </Button>
    <Button
      on:click={handleCreateUnit}
      disabled={!newUnit.title.trim() || !newUnit.module_id}
    >
      Create Unit
    </Button>
  </div>
</Dialog>
