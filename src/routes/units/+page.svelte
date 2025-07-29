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
  import LoadingOptimizer from "$lib/components/ui/loading-optimizer.svelte";
  import CrudTips from "$lib/components/ui/crud-tips.svelte";
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
    AlertTriangle,
  } from "lucide-svelte";

  $: user = $authStore.user;
  $: canManage = $canManageContent;
  $: unitState = $unitsStore;
  $: moduleState = $modulesStore;
  $: units = unitState.units;
  $: modules = moduleState.modules;

  let createDialogOpen = false;
  let editDialogOpen = false;
  let deleteDialogOpen = false;
  let unitToDelete: any = null;
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

    // Wait for auth to be ready
    if ($authStore.loading) {
      console.log("⏳ Waiting for auth to initialize...");
      const unsubscribe = authStore.subscribe((auth) => {
        if (!auth.loading && auth.initialized) {
          unsubscribe();
          loadData();
        }
      });
    } else {
      loadData();
    }
  });

  async function loadData() {
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
  }

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
    unitToDelete = unit;
    deleteDialogOpen = true;
  }

  async function confirmDeleteUnit() {
    if (!unitToDelete) {
      console.warn("⚠️ No unit to delete");
      return;
    }

    console.log("🗑️ Confirming delete for unit:", unitToDelete.id);
    const result = await deleteUnit(unitToDelete.id);

    if (result.error) {
      console.error("❌ Delete failed:", result.error);
    } else {
      console.log("✅ Delete successful");
    }

    deleteDialogOpen = false;
    unitToDelete = null;
  }

  function cancelDeleteUnit() {
    deleteDialogOpen = false;
    unitToDelete = null;
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

    <!-- Tips -->
    <CrudTips
      title="Unit Management Tips"
      tips={[
        "Organize units within modules to create a logical learning flow",
        "Set realistic estimated durations to help students plan their study time",
        "Use descriptive titles and descriptions for better content organization",
        "Create units in draft mode before publishing to students"
      ]}
    />
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
      <input
        id="estimated-duration"
        type="number"
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        value={newUnit.estimated_duration_minutes.toString()}
        min="1"
        max="1440"
        on:input={(e) => {
          const target = e.target as HTMLInputElement;
          newUnit.estimated_duration_minutes = parseInt(target.value) || 30;
        }}
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

<!-- Delete Unit Confirmation Dialog -->
<Dialog bind:open={deleteDialogOpen} title="Delete Unit">
  <div class="space-y-4">
    <div class="flex items-start space-x-3">
      <AlertTriangle class="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
      <div>
        <p class="text-foreground font-medium">
          Are you sure you want to delete this unit?
        </p>
        <p class="text-sm text-muted-foreground mt-1">
          This action cannot be undone. All content and progress associated with this unit will be permanently deleted.
        </p>
        {#if unitToDelete}
          <div class="mt-3 p-3 bg-muted rounded-lg">
            <p class="text-sm font-medium">{unitToDelete.title}</p>
            <p class="text-xs text-muted-foreground">
              Module: {getModuleName(unitToDelete.module_id)}
            </p>
          </div>
        {/if}
      </div>
    </div>

    <div class="flex justify-end space-x-3">
      <Button variant="outline" on:click={cancelDeleteUnit}>Cancel</Button>
      <Button variant="destructive" on:click={confirmDeleteUnit}>
        Delete Unit
      </Button>
    </div>
  </div>
</Dialog>
