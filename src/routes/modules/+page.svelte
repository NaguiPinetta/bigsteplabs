<script lang="ts">
  import { onMount } from "svelte";
  import { authStore, canManageContent } from "$lib/stores/auth";
  import {
    modulesStore,
    loadModules,
    createModule,
    updateModule,
    deleteModule,
    reorderModules,
    toggleModulePublication,
    setSelectedModule,
    clearModulesError,
    validateModule,
    getModuleStats,
    duplicateModule,
  } from "$lib/stores/modules";

  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Textarea from "$lib/components/ui/textarea.svelte";
  import {
    BookOpen,
    Plus,
    Edit,
    Trash2,
    Eye,
    GripVertical,
    Loader2,
    AlertCircle,
    Globe,
    Lock,
    Copy,
    Users,
    FileText,
    BarChart3,
    ArrowRight,
    CheckCircle,
    Clock,
  } from "lucide-svelte";

  let createDialogOpen = false;
  let editDialogOpen = false;
  let viewDialogOpen = false;
  let deleteDialogOpen = false;

  let newModule = {
    title: "",
    description: "",
    is_published: false,
  };

  let editModule = {
    id: "",
    title: "",
    description: "",
    is_published: false,
  };

  let moduleToDelete: any = null;
  let validationErrors: string[] = [];
  let moduleStats: Record<string, any> = {};
  let loadingStats: Record<string, boolean> = {};

  $: user = $authStore.user;
  $: canManage = canManageContent(user);
  $: state = $modulesStore;
  $: modules = state.modules;
  $: selectedModule = state.selectedModule;

  onMount(async () => {
    if (canManage) {
      await loadModules();
    }
  });

  function resetNewModule() {
    newModule = {
      title: "",
      description: "",
      is_published: false,
    };
    validationErrors = [];
  }

  async function handleCreateModule() {
    if (!user) return;

    const validation = validateModule(newModule);
    if (!validation.valid) {
      validationErrors = validation.errors;
      return;
    }

    const result = await createModule({
      title: newModule.title.trim(),
      description: newModule.description.trim() || null,
      is_published: newModule.is_published,
    });

    if (result.data) {
      resetNewModule();
      createDialogOpen = false;
    }
  }

  async function handleUpdateModule() {
    const validation = validateModule(editModule);
    if (!validation.valid) {
      validationErrors = validation.errors;
      return;
    }

    const result = await updateModule(editModule.id, {
      title: editModule.title.trim(),
      description: editModule.description.trim() || null,
      is_published: editModule.is_published,
    });

    if (result.data) {
      validationErrors = [];
      editDialogOpen = false;
    }
  }

  async function handleDeleteModule() {
    if (!moduleToDelete) return;

    await deleteModule(moduleToDelete.id);
    moduleToDelete = null;
    deleteDialogOpen = false;
  }

  async function handleTogglePublication(module: any) {
    await toggleModulePublication(module.id);
  }

  async function handleDuplicateModule(module: any) {
    const newTitle = `${module.title} (Copy)`;
    await duplicateModule(module.id, newTitle);
  }

  async function openEditDialog(module: any) {
    editModule = {
      id: module.id,
      title: module.title,
      description: module.description || "",
      is_published: module.is_published,
    };
    validationErrors = [];
    editDialogOpen = true;
  }

  async function openViewDialog(module: any) {
    setSelectedModule(module);
    viewDialogOpen = true;

    // Load module statistics
    if (!moduleStats[module.id]) {
      loadingStats[module.id] = true;
      moduleStats[module.id] = await getModuleStats(module.id);
      loadingStats[module.id] = false;
    }
  }

  function openDeleteDialog(module: any) {
    moduleToDelete = module;
    deleteDialogOpen = true;
  }

  function openCreateDialog() {
    resetNewModule();
    createDialogOpen = true;
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getStatusIcon(module: any) {
    return module.is_published ? Globe : Lock;
  }

  function getStatusColor(module: any): string {
    return module.is_published
      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
  }

  function truncateText(text: string, maxLength: number = 100): string {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  }

  // Simple drag and drop placeholder - would need a proper library for production
  let draggedModule: any = null;

  function handleDragStart(event: DragEvent, module: any) {
    draggedModule = module;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
  }

  async function handleDrop(event: DragEvent, targetModule: any) {
    event.preventDefault();

    if (!draggedModule || draggedModule.id === targetModule.id) return;

    const modulesCopy = [...modules];
    const draggedIndex = modulesCopy.findIndex(
      (m) => m.id === draggedModule.id
    );
    const targetIndex = modulesCopy.findIndex((m) => m.id === targetModule.id);

    // Reorder array
    modulesCopy.splice(draggedIndex, 1);
    modulesCopy.splice(targetIndex, 0, draggedModule);

    // Update order in database
    const moduleIds = modulesCopy.map((m) => m.id);
    await reorderModules(moduleIds);

    draggedModule = null;
  }
</script>

<svelte:head>
  <title>Modules - BigStepLabs</title>
  <meta
    name="description"
    content="Manage learning modules and course structure"
  />
</svelte:head>

<!-- Page Header -->
<div class="mb-8 flex items-center justify-between">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Learning Modules</h1>
    <p class="text-muted-foreground">
      Create and organize your course content into structured modules
    </p>
  </div>

  {#if canManage}
    <Button on:click={openCreateDialog}>
      <Plus class="w-4 h-4 mr-2" />
      Create Module
    </Button>
  {/if}
</div>

<div class="max-w-7xl mx-auto">
  {#if !canManage}
    <Card class="p-8 text-center">
      <h2 class="text-xl font-semibold mb-2">Access Restricted</h2>
      <p class="text-muted-foreground">
        You need Admin or Collaborator privileges to manage learning modules.
      </p>
    </Card>
  {:else if state.loading}
    <div class="flex items-center justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
      <span class="ml-2 text-muted-foreground">Loading modules...</span>
    </div>
  {:else if state.error}
    <Card class="p-6 border-destructive">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <AlertCircle class="w-5 h-5 text-destructive mr-2" />
          <span class="text-destructive font-medium">Error: {state.error}</span>
        </div>
        <Button variant="outline" on:click={clearModulesError}>Dismiss</Button>
      </div>
    </Card>
  {:else if modules.length === 0}
    <Card class="p-12 text-center">
      <BookOpen class="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h2 class="text-xl font-semibold mb-2">No Modules Created</h2>
      <p class="text-muted-foreground mb-6">
        Start building your course by creating your first learning module.
        Modules help organize related units and content into logical groups.
      </p>
      <Button on:click={openCreateDialog}>
        <Plus class="w-4 h-4 mr-2" />
        Create Your First Module
      </Button>
    </Card>
  {:else}
    <!-- Modules List -->
    <div class="space-y-4">
      {#each modules as module (module.id)}
        <Card
          class="p-6 hover:shadow-md transition-shadow cursor-move"
          draggable="true"
          on:dragstart={(e) => handleDragStart(e, module)}
          on:dragover={handleDragOver}
          on:drop={(e) => handleDrop(e, module)}
        >
          <div class="flex items-start justify-between">
            <div class="flex items-start space-x-4 flex-1">
              <!-- Drag Handle -->
              <div
                class="mt-1 text-muted-foreground hover:text-foreground cursor-grab"
              >
                <GripVertical class="w-5 h-5" />
              </div>

              <!-- Module Icon -->
              <div
                class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0"
              >
                <BookOpen class="w-6 h-6 text-primary" />
              </div>

              <!-- Module Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-3 mb-2">
                  <h3 class="text-lg font-semibold text-foreground">
                    {module.title}
                  </h3>
                  <span
                    class={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(module)}`}
                  >
                    <svelte:component
                      this={getStatusIcon(module)}
                      class="w-3 h-3 mr-1"
                    />
                    {module.is_published ? "Published" : "Draft"}
                  </span>
                </div>

                {#if module.description}
                  <p class="text-muted-foreground text-sm mb-3">
                    {truncateText(module.description, 200)}
                  </p>
                {/if}

                <!-- Module Stats -->
                <div
                  class="flex items-center space-x-6 text-sm text-muted-foreground"
                >
                  <div class="flex items-center space-x-1">
                    <FileText class="w-4 h-4" />
                    <span>{module.units?.length || 0} units</span>
                  </div>
                  <div class="flex items-center space-x-1">
                    <Clock class="w-4 h-4" />
                    <span>Updated {formatDate(module.updated_at)}</span>
                  </div>
                  <div class="flex items-center space-x-1">
                    <Users class="w-4 h-4" />
                    <span>Order #{module.order_index}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center space-x-1">
              <button
                on:click={() => handleTogglePublication(module)}
                class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                title={module.is_published ? "Unpublish" : "Publish"}
              >
                <svelte:component
                  this={module.is_published ? Lock : Globe}
                  class="w-4 h-4"
                />
              </button>

              <button
                on:click={() => handleDuplicateModule(module)}
                class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                title="Duplicate module"
              >
                <Copy class="w-4 h-4" />
              </button>

              <button
                on:click={() => openViewDialog(module)}
                class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                title="View details"
              >
                <Eye class="w-4 h-4" />
              </button>

              <button
                on:click={() => openEditDialog(module)}
                class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                title="Edit module"
              >
                <Edit class="w-4 h-4" />
              </button>

              <button
                on:click={() => openDeleteDialog(module)}
                class="p-2 hover:bg-destructive/20 rounded-md text-muted-foreground hover:text-destructive"
                title="Delete module"
              >
                <Trash2 class="w-4 h-4" />
              </button>

              <Button
                variant="outline"
                size="sm"
                class="ml-2"
                on:click={() =>
                  (window.location.href = `/units?module=${module.id}`)}
              >
                Manage Units
                <ArrowRight class="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      {/each}
    </div>

    <!-- Tips -->
    <Card class="p-6 mt-8 bg-muted/50">
      <h3 class="font-semibold text-foreground mb-2">
        💡 Module Management Tips
      </h3>
      <div
        class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground"
      >
        <div class="flex items-start space-x-2">
          <CheckCircle class="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <span>Drag modules to reorder them in your course structure</span>
        </div>
        <div class="flex items-start space-x-2">
          <CheckCircle class="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <span>Use draft status to prepare modules before publishing</span>
        </div>
        <div class="flex items-start space-x-2">
          <CheckCircle class="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <span
            >Create descriptive titles and descriptions for better organization</span
          >
        </div>
        <div class="flex items-start space-x-2">
          <CheckCircle class="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <span
            >Duplicate existing modules to quickly create similar content</span
          >
        </div>
      </div>
    </Card>
  {/if}
</div>

<!-- Create Module Dialog -->
<Dialog bind:open={createDialogOpen} title="Create New Module">
  <div class="space-y-4">
    <!-- Validation Errors -->
    {#if validationErrors.length > 0}
      <div
        class="bg-destructive/15 border border-destructive/20 rounded-md p-4"
      >
        <div class="flex">
          <AlertCircle class="w-5 h-5 text-destructive flex-shrink-0" />
          <div class="ml-3">
            <h4 class="text-sm font-medium text-destructive">
              Please fix these errors:
            </h4>
            <ul class="mt-1 text-sm text-destructive/80 list-disc list-inside">
              {#each validationErrors as error}
                <li>{error}</li>
              {/each}
            </ul>
          </div>
        </div>
      </div>
    {/if}

    <div>
      <label for="title" class="block text-sm font-medium mb-2"
        >Module Title *</label
      >
      <Input
        id="title"
        bind:value={newModule.title}
        placeholder="e.g., Introduction to Spanish Grammar"
        required
      />
    </div>

    <div>
      <label for="description" class="block text-sm font-medium mb-2"
        >Description</label
      >
      <Textarea
        id="description"
        bind:value={newModule.description}
        placeholder="Brief description of what students will learn in this module..."
        rows={3}
      />
    </div>

    <div class="flex items-center space-x-2">
      <input
        type="checkbox"
        id="published"
        bind:checked={newModule.is_published}
        class="rounded border-input"
      />
      <label for="published" class="text-sm font-medium">
        Publish immediately (students can access this module)
      </label>
    </div>
  </div>

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={() => (createDialogOpen = false)}>
      Cancel
    </Button>
    <Button on:click={handleCreateModule} disabled={!newModule.title.trim()}>
      Create Module
    </Button>
  </div>
</Dialog>

<!-- Edit Module Dialog -->
<Dialog bind:open={editDialogOpen} title="Edit Module">
  <div class="space-y-4">
    <!-- Validation Errors -->
    {#if validationErrors.length > 0}
      <div
        class="bg-destructive/15 border border-destructive/20 rounded-md p-4"
      >
        <div class="flex">
          <AlertCircle class="w-5 h-5 text-destructive flex-shrink-0" />
          <div class="ml-3">
            <h4 class="text-sm font-medium text-destructive">
              Please fix these errors:
            </h4>
            <ul class="mt-1 text-sm text-destructive/80 list-disc list-inside">
              {#each validationErrors as error}
                <li>{error}</li>
              {/each}
            </ul>
          </div>
        </div>
      </div>
    {/if}

    <div>
      <label for="edit-title" class="block text-sm font-medium mb-2"
        >Module Title *</label
      >
      <Input id="edit-title" bind:value={editModule.title} required />
    </div>

    <div>
      <label for="edit-description" class="block text-sm font-medium mb-2"
        >Description</label
      >
      <Textarea
        id="edit-description"
        bind:value={editModule.description}
        rows={3}
      />
    </div>

    <div class="flex items-center space-x-2">
      <input
        type="checkbox"
        id="edit-published"
        bind:checked={editModule.is_published}
        class="rounded border-input"
      />
      <label for="edit-published" class="text-sm font-medium">
        Published (students can access this module)
      </label>
    </div>
  </div>

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={() => (editDialogOpen = false)}>
      Cancel
    </Button>
    <Button on:click={handleUpdateModule} disabled={!editModule.title.trim()}>
      Save Changes
    </Button>
  </div>
</Dialog>

<!-- View Module Dialog -->
<Dialog bind:open={viewDialogOpen} title="Module Details" size="lg">
  {#if selectedModule}
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-start space-x-4 pb-4 border-b border-border">
        <div
          class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center"
        >
          <BookOpen class="w-8 h-8 text-primary" />
        </div>
        <div class="flex-1">
          <h3 class="text-xl font-semibold text-foreground mb-2">
            {selectedModule.title}
          </h3>
          <div class="flex items-center space-x-2 mb-2">
            <span
              class={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedModule)}`}
            >
              <svelte:component
                this={getStatusIcon(selectedModule)}
                class="w-3 h-3 mr-1"
              />
              {selectedModule.is_published ? "Published" : "Draft"}
            </span>
          </div>
          {#if selectedModule.description}
            <p class="text-muted-foreground">
              {selectedModule.description}
            </p>
          {/if}
        </div>
      </div>

      <!-- Statistics -->
      <div class="grid grid-cols-3 gap-4">
        <div class="text-center p-4 bg-muted rounded-md">
          <div class="text-2xl font-bold text-foreground">
            {#if loadingStats[selectedModule.id]}
              <Loader2 class="w-6 h-6 animate-spin mx-auto" />
            {:else}
              {moduleStats[selectedModule.id]?.units || 0}
            {/if}
          </div>
          <div class="text-sm text-muted-foreground">Units</div>
        </div>
        <div class="text-center p-4 bg-muted rounded-md">
          <div class="text-2xl font-bold text-foreground">
            {#if loadingStats[selectedModule.id]}
              <Loader2 class="w-6 h-6 animate-spin mx-auto" />
            {:else}
              {moduleStats[selectedModule.id]?.content || 0}
            {/if}
          </div>
          <div class="text-sm text-muted-foreground">Content Items</div>
        </div>
        <div class="text-center p-4 bg-muted rounded-md">
          <div class="text-2xl font-bold text-foreground">
            {#if loadingStats[selectedModule.id]}
              <Loader2 class="w-6 h-6 animate-spin mx-auto" />
            {:else}
              {moduleStats[selectedModule.id]?.students || 0}
            {/if}
          </div>
          <div class="text-sm text-muted-foreground">Students</div>
        </div>
      </div>

      <!-- Metadata -->
      <div class="text-sm text-muted-foreground pt-4 border-t border-border">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <strong>Created:</strong>
            {formatDate(selectedModule.created_at)}
          </div>
          <div>
            <strong>Last Updated:</strong>
            {formatDate(selectedModule.updated_at)}
          </div>
          <div>
            <strong>Order:</strong> #{selectedModule.order_index}
          </div>
          <div>
            <strong>Slug:</strong>
            {selectedModule.slug || "Auto-generated"}
          </div>
        </div>
      </div>
    </div>
  {/if}

  <div slot="footer" class="flex justify-between">
    <Button
      variant="outline"
      on:click={() => handleDuplicateModule(selectedModule)}
    >
      <Copy class="w-4 h-4 mr-2" />
      Duplicate
    </Button>
    <div class="flex space-x-2">
      <Button variant="outline" on:click={() => openEditDialog(selectedModule)}>
        <Edit class="w-4 h-4 mr-2" />
        Edit
      </Button>
      <Button
        variant="outline"
        on:click={() =>
          (window.location.href = `/units?module=${selectedModule.id}`)}
      >
        Manage Units
        <ArrowRight class="w-4 h-4 ml-1" />
      </Button>
      <Button variant="outline" on:click={() => (viewDialogOpen = false)}>
        Close
      </Button>
    </div>
  </div>
</Dialog>

<!-- Delete Confirmation Dialog -->
<Dialog bind:open={deleteDialogOpen} title="Delete Module">
  {#if moduleToDelete}
    <div class="space-y-4">
      <div class="flex items-start space-x-3">
        <AlertCircle class="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
        <div>
          <p class="font-medium text-foreground">
            Are you sure you want to delete "{moduleToDelete.title}"?
          </p>
          <p class="text-sm text-muted-foreground mt-2">
            This will permanently delete the module and all its units and
            content. This action cannot be undone.
          </p>
        </div>
      </div>
    </div>
  {/if}

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={() => (deleteDialogOpen = false)}>
      Cancel
    </Button>
    <Button variant="destructive" on:click={handleDeleteModule}>
      Delete Module
    </Button>
  </div>
</Dialog>
