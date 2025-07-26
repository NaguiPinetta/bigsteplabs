<script lang="ts">
  import { onMount } from "svelte";
  import { authStore, canManageContent } from "$lib/stores/auth";
  import { unitsStore, loadUnits } from "$lib/stores/units";
  import { modulesStore, loadModules } from "$lib/stores/modules";
  import {
    contentStore,
    loadContent,
    createContent,
    updateContent,
    deleteContent,
    clearContentError,
    validateContent,
  } from "$lib/stores/content";

  import Button from "$lib/components/ui/button.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Textarea from "$lib/components/ui/textarea.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import {
    FileText,
    Edit,
    Trash2,
    Plus,
    Clock,
    BookOpen,
    Layers3,
    Loader2,
    AlertCircle,
  } from "lucide-svelte";

  // Content state from store
  let contentState = $contentStore;

  // Dialog state
  let showCreateDialog = false;
  let showEditDialog = false;
  let editingContent: any = null;

  // Form state
  let formTitle = "";
  let formSlug = "";
  let formBody = "";
  let formUnitId = "";
  let formEstimatedMinutes = 15;
  let submitting = false;

  // Filter state
  let selectedModuleFilter = "";
  let selectedUnitFilter = "";

  $: user = $authStore.user;
  $: canManage = canManageContent(user);
  $: unitState = $unitsStore;
  $: moduleState = $modulesStore;
  $: contentState = $contentStore;
  $: units = unitState.units;
  $: modules = moduleState.modules;
  $: content = contentState.content;
  $: loading = contentState.loading;
  $: error = contentState.error;

  $: filteredUnits = selectedModuleFilter
    ? units.filter((unit) => unit.module_id === selectedModuleFilter)
    : units;
  $: filteredContent = content.filter((item) => {
    if (selectedUnitFilter) return item.unit_id === selectedUnitFilter;
    if (selectedModuleFilter) {
      const unit = units.find((u) => u.id === item.unit_id);
      return unit?.module_id === selectedModuleFilter;
    }
    return true;
  });

  onMount(async () => {
    if (canManage) {
      // Load all required data
      await Promise.all([loadUnits(), loadModules(), loadContent()]);
    }
  });

  function openCreateDialog() {
    formTitle = "";
    formSlug = "";
    formBody = "";
    formUnitId = "";
    formEstimatedMinutes = 15;
    showCreateDialog = true;
  }

  function openEditDialog(item: any) {
    editingContent = item;
    formTitle = item.title;
    formSlug = item.slug || "";
    formBody = item.body || "";
    formUnitId = item.unit_id;
    formEstimatedMinutes = item.estimated_minutes || 15;
    showEditDialog = true;
  }

  function closeDialogs() {
    showCreateDialog = false;
    showEditDialog = false;
    editingContent = null;
    formTitle = "";
    formSlug = "";
    formBody = "";
    formUnitId = "";
    formEstimatedMinutes = 15;
  }

  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();
  }

  $: if (formTitle && !formSlug) {
    formSlug = generateSlug(formTitle);
  }

  async function handleCreate() {
    if (!formTitle.trim() || !formUnitId) {
      clearContentError();
      contentStore.update((state) => ({
        ...state,
        error: "Please fill in all required fields",
      }));
      return;
    }

    try {
      submitting = true;
      clearContentError();

      const result = await createContent({
        title: formTitle.trim(),
        description: formBody.trim() || "No description provided",
        content: formBody.trim() || "",
        type: "markdown",
        unit_id: formUnitId,
        file_url: null,
        is_published: false,
        metadata: {
          estimated_minutes: formEstimatedMinutes,
          slug: formSlug.trim() || generateSlug(formTitle),
        },
      });

      if (result.error) {
        console.error("Error creating content:", result.error);
      } else {
        console.log("✅ Content created successfully:", result.data?.title);
        closeDialogs();
      }
    } catch (err: any) {
      console.error("Error creating content:", err);
      contentStore.update((state) => ({ ...state, error: err.message }));
    } finally {
      submitting = false;
    }
  }

  async function handleUpdate() {
    if (!editingContent || !formTitle.trim() || !formUnitId) {
      error = "Please fill in all required fields";
      return;
    }

    try {
      submitting = true;
      error = "";

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      const updatedContent = {
        ...editingContent,
        title: formTitle.trim(),
        slug: formSlug.trim() || generateSlug(formTitle),
        body: formBody.trim() || null,
        unit_id: formUnitId,
        estimated_minutes: formEstimatedMinutes,
        updated_at: new Date().toISOString(),
      };

      content = content.map((c) =>
        c.id === editingContent.id ? updatedContent : c
      );
      console.log("✅ Content updated successfully:", updatedContent.title);
      closeDialogs();
    } catch (err: any) {
      error = err.message;
      console.error("Error updating content:", err);
    } finally {
      submitting = false;
    }
  }

  async function handleDelete(item: any) {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) {
      return;
    }

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      content = content.filter((c) => c.id !== item.id);
      console.log("✅ Content deleted successfully:", item.title);
    } catch (err: any) {
      error = err.message;
      console.error("Error deleting content:", err);
    }
  }

  async function toggleStatus(item: any) {
    const newStatus = item.status === "published" ? "draft" : "published";

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 200));

      const updatedContent = {
        ...item,
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      content = content.map((c) => (c.id === item.id ? updatedContent : c));
      console.log("✅ Content status toggled:", item.title, newStatus);
    } catch (err: any) {
      error = err.message;
      console.error("Error toggling content status:", err);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  }

  function getContentTypeIcon(type: string) {
    switch (type) {
      case "lesson":
        return FileText;
      case "video":
        return "Play"; // You can add more icons
      case "exercise":
        return "CheckSquare";
      default:
        return FileText;
    }
  }

  function getUnitName(unitId: string): string {
    const unit = units.find((u) => u.id === unitId);
    return unit ? unit.title : "Unknown Unit";
  }

  function getModuleName(unitId: string): string {
    const unit = units.find((u) => u.id === unitId);
    if (!unit) return "Unknown Module";
    const module = modules.find((m) => m.id === unit.module_id);
    return module ? module.title : "Unknown Module";
  }
</script>

<svelte:head>
  <title>Content - BigStepLabs</title>
  <meta name="description" content="Manage learning content and lessons" />
</svelte:head>

<!-- Page Header -->
<div class="mb-8 flex items-center justify-between">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Content</h1>
    <p class="text-muted-foreground">
      Create and manage learning content, lessons, and materials
    </p>
  </div>

  {#if canManage}
    <div class="flex items-center gap-3">
      <!-- Module Filter -->
      {#if modules.length > 0}
        <select
          bind:value={selectedModuleFilter}
          on:change={() => (selectedUnitFilter = "")}
          class="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Modules</option>
          {#each modules as module}
            <option value={module.id}>{module.title}</option>
          {/each}
        </select>
      {/if}

      <!-- Unit Filter -->
      {#if filteredUnits.length > 0}
        <select
          bind:value={selectedUnitFilter}
          class="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Units</option>
          {#each filteredUnits as unit}
            <option value={unit.id}>{unit.title}</option>
          {/each}
        </select>
      {/if}

      <Button on:click={openCreateDialog}>
        <Plus class="w-4 h-4 mr-2" />
        Create Content
      </Button>
    </div>
  {/if}
</div>

<div class="max-w-7xl mx-auto">
  {#if !canManage}
    <Card class="p-8 text-center">
      <h2 class="text-xl font-semibold mb-2">Access Restricted</h2>
      <p class="text-muted-foreground">
        You need Admin or Collaborator privileges to manage content.
      </p>
    </Card>
  {:else if unitState.loading || moduleState.loading}
    <div class="flex items-center justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
      <span class="ml-2 text-muted-foreground">Loading content...</span>
    </div>
  {:else if error}
    <Card class="p-6 border-destructive">
      <div class="flex items-center">
        <AlertCircle class="w-5 h-5 text-destructive mr-2" />
        <span class="text-destructive font-medium">Error: {error}</span>
      </div>
    </Card>
  {:else if filteredContent.length === 0 && units.length === 0}
    <Card class="p-12 text-center">
      <FileText class="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h2 class="text-xl font-semibold mb-2">No Units Available</h2>
      <p class="text-muted-foreground mb-6">
        You need to create modules and units before you can create content.
        Content is created within units to organize your learning materials.
      </p>
      <div
        class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-6"
      >
        <div class="flex items-center">
          <AlertCircle class="w-5 h-5 text-yellow-600 mr-2" />
          <div class="text-left">
            <h4
              class="text-sm font-medium text-yellow-800 dark:text-yellow-200"
            >
              Prerequisites Required
            </h4>
            <p class="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              Create at least one module and one unit first, then you can add
              content to that unit.
            </p>
          </div>
        </div>
      </div>
      <div class="flex justify-center space-x-3">
        <Button
          variant="outline"
          on:click={() => (window.location.href = "/modules")}
        >
          Go to Modules
        </Button>
        <Button
          variant="outline"
          on:click={() => (window.location.href = "/units")}
        >
          Go to Units
        </Button>
      </div>
    </Card>
  {:else if filteredContent.length === 0}
    <Card class="p-12 text-center">
      <FileText class="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h2 class="text-xl font-semibold mb-2">
        {selectedUnitFilter || selectedModuleFilter
          ? "No Content in Selection"
          : "No Content Yet"}
      </h2>
      <p class="text-muted-foreground mb-6">
        {selectedUnitFilter || selectedModuleFilter
          ? "This selection doesn't have any content yet."
          : "Create your first piece of learning content to get started."}
      </p>
      <Button on:click={openCreateDialog}>
        <Plus class="w-4 h-4 mr-2" />
        Create Your First Content
      </Button>
    </Card>
  {:else}
    <!-- Content List -->
    <div class="grid gap-6">
      {#each filteredContent as item (item.id)}
        <Card class="p-6">
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-4 flex-1">
              <!-- Content Type Icon -->
              <div class="mt-1 text-muted-foreground">
                <svelte:component
                  this={getContentTypeIcon(item.type)}
                  class="w-5 h-5"
                />
              </div>

              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="text-xl font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <span
                    class={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
                  >
                    {item.status}
                  </span>
                  {#if item.estimated_minutes}
                    <span
                      class="text-xs text-muted-foreground bg-muted px-2 py-1 rounded flex items-center gap-1"
                    >
                      <Clock class="w-3 h-3" />
                      {item.estimated_minutes} min
                    </span>
                  {/if}
                </div>

                <!-- Content Preview -->
                {#if item.body}
                  <p class="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {item.body.substring(0, 200)}{item.body.length > 200
                      ? "..."
                      : ""}
                  </p>
                {/if}

                <!-- Hierarchy Info -->
                <div
                  class="flex items-center gap-4 text-xs text-muted-foreground mb-3"
                >
                  <span class="flex items-center gap-1">
                    <BookOpen class="w-3 h-3" />
                    {getModuleName(item.unit_id)}
                  </span>
                  <span class="flex items-center gap-1">
                    <Layers3 class="w-3 h-3" />
                    {getUnitName(item.unit_id)}
                  </span>
                </div>

                <div
                  class="flex items-center gap-4 text-xs text-muted-foreground"
                >
                  <span
                    >Created: {new Date(
                      item.created_at
                    ).toLocaleDateString()}</span
                  >
                  {#if item.slug}
                    <span>Slug: {item.slug}</span>
                  {/if}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 ml-4">
              <!-- Status toggle -->
              <Button
                variant="ghost"
                size="sm"
                on:click={() => toggleStatus(item)}
              >
                {item.status === "published" ? "Unpublish" : "Publish"}
              </Button>

              <!-- Edit -->
              <Button
                variant="ghost"
                size="sm"
                on:click={() => openEditDialog(item)}
              >
                <Edit class="w-4 h-4" />
              </Button>

              <!-- Delete -->
              <Button
                variant="ghost"
                size="sm"
                on:click={() => handleDelete(item)}
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

<!-- Create Content Dialog -->
<Dialog bind:open={showCreateDialog} title="Create New Content">
  <div class="space-y-4">
    <div>
      <label for="create-unit" class="block text-sm font-medium mb-2">
        Unit *
      </label>
      <select
        id="create-unit"
        bind:value={formUnitId}
        required
        class="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">Select a unit...</option>
        {#each units as unit}
          <option value={unit.id}>
            {getModuleName(unit.id)} → {unit.title}
          </option>
        {/each}
      </select>
    </div>

    <div>
      <label for="create-title" class="block text-sm font-medium mb-2">
        Content Title *
      </label>
      <Input
        id="create-title"
        bind:value={formTitle}
        placeholder="Enter content title..."
        required
      />
    </div>

    <div>
      <label for="create-slug" class="block text-sm font-medium mb-2">
        URL Slug
      </label>
      <Input
        id="create-slug"
        bind:value={formSlug}
        placeholder="auto-generated-from-title"
      />
      <p class="text-xs text-muted-foreground mt-1">
        Leave empty to auto-generate from title
      </p>
    </div>

    <div>
      <label for="create-body" class="block text-sm font-medium mb-2">
        Content Body
      </label>
      <Textarea
        id="create-body"
        bind:value={formBody}
        placeholder="Enter the lesson content, instructions, or description..."
        rows={8}
      />
    </div>

    <div>
      <label for="create-minutes" class="block text-sm font-medium mb-2">
        Estimated Duration (minutes)
      </label>
      <Input
        id="create-minutes"
        type="number"
        bind:value={formEstimatedMinutes}
        min="1"
        max="300"
        placeholder="15"
      />
    </div>
  </div>

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={closeDialogs}>Cancel</Button>
    <Button
      on:click={handleCreate}
      disabled={submitting || !formTitle.trim() || !formUnitId}
    >
      {submitting ? "Creating..." : "Create Content"}
    </Button>
  </div>
</Dialog>

<!-- Edit Content Dialog -->
<Dialog bind:open={showEditDialog} title="Edit Content">
  <div class="space-y-4">
    <div>
      <label for="edit-unit" class="block text-sm font-medium mb-2">
        Unit *
      </label>
      <select
        id="edit-unit"
        bind:value={formUnitId}
        required
        class="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">Select a unit...</option>
        {#each units as unit}
          <option value={unit.id}>
            {getModuleName(unit.id)} → {unit.title}
          </option>
        {/each}
      </select>
    </div>

    <div>
      <label for="edit-title" class="block text-sm font-medium mb-2">
        Content Title *
      </label>
      <Input
        id="edit-title"
        bind:value={formTitle}
        placeholder="Enter content title..."
        required
      />
    </div>

    <div>
      <label for="edit-slug" class="block text-sm font-medium mb-2">
        URL Slug
      </label>
      <Input
        id="edit-slug"
        bind:value={formSlug}
        placeholder="auto-generated-from-title"
      />
    </div>

    <div>
      <label for="edit-body" class="block text-sm font-medium mb-2">
        Content Body
      </label>
      <Textarea
        id="edit-body"
        bind:value={formBody}
        placeholder="Enter the lesson content, instructions, or description..."
        rows={8}
      />
    </div>

    <div>
      <label for="edit-minutes" class="block text-sm font-medium mb-2">
        Estimated Duration (minutes)
      </label>
      <Input
        id="edit-minutes"
        type="number"
        bind:value={formEstimatedMinutes}
        min="1"
        max="300"
        placeholder="15"
      />
    </div>
  </div>

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={closeDialogs}>Cancel</Button>
    <Button
      on:click={handleUpdate}
      disabled={submitting || !formTitle.trim() || !formUnitId}
    >
      {submitting ? "Updating..." : "Update Content"}
    </Button>
  </div>
</Dialog>
