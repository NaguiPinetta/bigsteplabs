<script lang="ts">
  import { onMount } from "svelte";
  import { authStore, canManageContent } from "$lib/stores/auth";
  import { supabase } from "$lib/supabase";
  import {
    lessonsStore,
    loadLessons,
    createLesson,
    updateLesson,
    deleteLesson,
    clearError,
  } from "$lib/stores/lessons";
  import { modulesStore, loadModules } from "$lib/stores/modules";
  import { unitsStore, loadUnits } from "$lib/stores/units";

  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Select from "$lib/components/ui/select.svelte";
  import CrudTips from "$lib/components/ui/crud-tips.svelte";
  import LoadingOptimizer from "$lib/components/ui/loading-optimizer.svelte";
  import {
    Database,
    Plus,
    Edit,
    Trash2,
    FileText,
    ExternalLink,
    Eye,
    ChevronRight,
    Loader2,
    AlertCircle,
    CheckCircle,
    Filter,
  } from "lucide-svelte";

  let createDialogOpen = false;
  let editDialogOpen = false;
  let deleteDialogOpen = false;
  let lessonToDelete: any = null;
  let isCreatingLesson = false;
  let isUpdatingLesson = false;

  // Filters
  let selectedModule = "";
  let selectedUnit = "";
  let showPublishedOnly = false;

  let newLesson = {
    title: "",
    notion_url: "",
    embed_url: "",
    module_id: "",
    unit_id: "",
    content_type: {},
    is_published: false,
  };

  let editLesson = {
    id: "",
    title: "",
    notion_url: "",
    embed_url: "",
    module_id: "",
    unit_id: "",
    content_type: {},
    is_published: false,
  };

  // Add state for embed validation
  let embedUrlValidated = false;
  let embedUrlError = "";
  let editEmbedUrlValidated = false;
  let editEmbedUrlError = "";

  $: user = $authStore.user;
  $: canManage = $canManageContent;
  $: state = $lessonsStore;
  $: lessons = state.lessons;
  $: modules = $modulesStore.modules;
  $: units = $unitsStore.units;

  // Filter lessons based on selected filters
  $: filteredLessons = lessons.filter((lesson) => {
    if (selectedModule && lesson.module_id !== selectedModule) return false;
    if (selectedUnit && lesson.unit_id !== selectedUnit) return false;
    if (showPublishedOnly && !lesson.is_published) return false;
    return true;
  });

  onMount(() => {
    if (canManage) {
      loadLessons();
      loadModules();
      loadUnits();
    }
  });

  async function handleCreateLesson() {
    console.log("🚀 handleCreateLesson called");
    console.log("Current state:", {
      title: newLesson.title,
      notion_url: newLesson.notion_url,
      embed_url: newLesson.embed_url,
      embedUrlValidated,
      user: !!user,
    });

    if (!newLesson.title.trim()) {
      console.log("❌ No title provided");
      return;
    }

    if (!newLesson.notion_url.trim() && !newLesson.embed_url.trim()) {
      console.log("❌ No Notion URL or Embed URL provided");
      return;
    }

    if (!user) {
      console.log("❌ No user found");
      return;
    }

    // Require embed URL validation
    if (!embedUrlValidated) {
      console.log("❌ Embed URL not validated. Please click 'Apply' first.");
      return;
    }

    console.log("🚀 Creating lesson with:", {
      title: newLesson.title,
      notion_url: newLesson.notion_url,
      embed_url: newLesson.embed_url,
      module_id: newLesson.module_id,
      unit_id: newLesson.unit_id,
      is_published: newLesson.is_published,
    });

    isCreatingLesson = true;

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn("Lesson creation timed out after 10 seconds");
      isCreatingLesson = false;
    }, 10000);

    try {
      const result = await createLesson({
        title: newLesson.title.trim(),
        notion_url: newLesson.notion_url.trim() || newLesson.embed_url.trim(),
        embed_url: newLesson.embed_url || null,
        module_id: newLesson.module_id || null,
        unit_id: newLesson.unit_id || null,
        content_type: newLesson.content_type,
        is_published: newLesson.is_published,
      });

      clearTimeout(timeoutId);

      if (result) {
        console.log("✅ Lesson created successfully:", result);
        newLesson = {
          title: "",
          notion_url: "",
          embed_url: "",
          module_id: "",
          unit_id: "",
          content_type: {},
          is_published: false,
        };
        embedUrlValidated = false;
        embedUrlError = "";
        createDialogOpen = false;
      } else {
        // If creation failed, show error but don't close dialog
        console.error("Failed to create lesson - result was null");
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Error creating lesson:", error);
      // Don't close dialog on error, let user try again
    } finally {
      isCreatingLesson = false;
    }
  }

  async function handleUpdateLesson() {
    if (!editLesson.title.trim() || !editLesson.notion_url.trim()) return;

    isUpdatingLesson = true;
    try {
      const result = await updateLesson(editLesson.id, {
        title: editLesson.title.trim(),
        notion_url: editLesson.notion_url.trim(),
        embed_url: editLesson.embed_url || null,
        module_id: editLesson.module_id || null,
        unit_id: editLesson.unit_id || null,
        content_type: editLesson.content_type,
        is_published: editLesson.is_published,
      });

      if (result) {
        editDialogOpen = false;
      }
    } catch (error) {
      console.error("Error updating lesson:", error);
    } finally {
      isUpdatingLesson = false;
    }
  }

  async function handleDeleteLesson() {
    if (!lessonToDelete) return;

    const success = await deleteLesson(lessonToDelete.id);
    if (success) {
      deleteDialogOpen = false;
      lessonToDelete = null;
    }
  }

  function openEditDialog(lesson: any) {
    editLesson = {
      id: lesson.id,
      title: lesson.title,
      notion_url: lesson.notion_url,
      embed_url: lesson.embed_url || "",
      module_id: lesson.module_id || "",
      unit_id: lesson.unit_id || "",
      content_type: lesson.content_type || {},
      is_published: lesson.is_published,
    };
    editDialogOpen = true;
  }

  function openDeleteDialog(lesson: any) {
    lessonToDelete = lesson;
    deleteDialogOpen = true;
  }

  function getModuleName(moduleId: string | null): string {
    if (!moduleId) return "No Module";
    const module = modules.find((m) => m.id === moduleId);
    return module?.title || "Unknown Module";
  }

  function getUnitName(unitId: string | null): string {
    if (!unitId) return "No Unit";
    const unit = units.find((u) => u.id === unitId);
    return unit?.title || "Unknown Unit";
  }

  function clearFilters() {
    selectedModule = "";
    selectedUnit = "";
    showPublishedOnly = false;
  }

  function extractNotionEmbedUrl(url: string): string | null {
    // First, check if it's an iframe snippet and extract the src URL
    const iframeMatch = url.match(/src="([^"]+)"/);
    if (iframeMatch) {
      const srcUrl = iframeMatch[1];
      console.log("🔍 Extracted URL from iframe:", srcUrl);
      return srcUrl;
    }

    // If it's a regular URL, extract the page ID and create embed URL
    const cleanUrl = url.replace(/\s+/g, "_").split("?")[0];
    const pageIdMatch = cleanUrl.match(/\/([a-f0-9]{32})/);
    if (pageIdMatch) {
      const pageId = pageIdMatch[1];
      console.log("🔍 Extracted page ID:", pageId);
      return `https://bigstep-idiomas.notion.site/ebd/${pageId}`;
    }
    console.log("❌ Could not extract page ID from URL:", cleanUrl);
    return null; // Return null instead of the original URL to indicate failure
  }

  function validateEmbedUrl() {
    console.log("🔍 Validating embed URL");
    console.log("Notion URL field:", newLesson.notion_url);
    console.log("Embed URL field:", newLesson.embed_url);

    // Check if we have content in either field
    const hasNotionUrl = newLesson.notion_url.trim();
    const hasEmbedUrl = newLesson.embed_url.trim();

    if (!hasNotionUrl && !hasEmbedUrl) {
      embedUrlError = "Please enter a Notion URL or iframe snippet first";
      embedUrlValidated = false;
      console.log("❌ No URL provided in either field");
      return false;
    }

    // If embed URL field has content, try to extract from it
    if (hasEmbedUrl) {
      const embedUrl = extractNotionEmbedUrl(newLesson.embed_url);
      if (embedUrl) {
        newLesson.embed_url = embedUrl;
        embedUrlValidated = true;
        embedUrlError = "";
        console.log("✅ Embed URL validated from embed field:", embedUrl);
        return true;
      }
    }

    // If notion URL field has content, try to extract from it
    if (hasNotionUrl) {
      // Check if it's a placeholder URL
      if (newLesson.notion_url.includes("notion.so/your-page")) {
        embedUrlError =
          "Please enter a real Notion page URL or iframe snippet (not the placeholder)";
        embedUrlValidated = false;
        console.log("❌ Placeholder URL detected");
        return false;
      }

      const embedUrl = extractNotionEmbedUrl(newLesson.notion_url);
      if (embedUrl) {
        newLesson.embed_url = embedUrl;
        embedUrlValidated = true;
        embedUrlError = "";
        console.log("✅ Embed URL validated from notion field:", embedUrl);
        return true;
      }
    }

    // If we get here, extraction failed
    embedUrlError =
      "Could not extract embed URL. Please paste either a Notion page URL or the iframe snippet from Notion's embed dialog.";
    embedUrlValidated = false;
    console.log("❌ Failed to extract embed URL from both fields");
    return false;
  }

  function validateEditEmbedUrl() {
    if (!editLesson.notion_url.trim()) {
      editEmbedUrlError = "Please enter a Notion URL first";
      editEmbedUrlValidated = false;
      return false;
    }

    const embedUrl = extractNotionEmbedUrl(editLesson.notion_url);
    if (embedUrl) {
      editLesson.embed_url = embedUrl;
      editEmbedUrlValidated = true;
      editEmbedUrlError = "";
      console.log("✅ Edit Embed URL validated:", embedUrl);
      return true;
    } else {
      editEmbedUrlError = "Could not extract embed URL from Notion URL";
      editEmbedUrlValidated = false;
      console.log(
        "❌ Failed to extract embed URL from:",
        editLesson.notion_url
      );
      return false;
    }
  }

  function handleNotionUrlInput() {
    // Auto-extract embed URL when user pastes a Notion URL
    if (newLesson.notion_url) {
      const embedUrl = extractNotionEmbedUrl(newLesson.notion_url);
      if (embedUrl) {
        console.log("🔍 Auto-extracted embed URL:", embedUrl);
        newLesson.embed_url = embedUrl;
        embedUrlValidated = true;
        embedUrlError = "";
      } else {
        embedUrlValidated = false;
        embedUrlError = "Could not extract embed URL";
      }
    }
  }

  function handleEditNotionUrlInput() {
    // Auto-extract embed URL when user pastes a Notion URL in edit dialog
    if (editLesson.notion_url) {
      const embedUrl = extractNotionEmbedUrl(editLesson.notion_url);
      if (embedUrl) {
        console.log("🔍 Auto-extracted edit embed URL:", embedUrl);
        editLesson.embed_url = embedUrl;
        editEmbedUrlValidated = true;
        editEmbedUrlError = "";
      } else {
        editEmbedUrlValidated = false;
        editEmbedUrlError = "Could not extract embed URL";
      }
    }
  }

  function testButtonClick() {
    console.log("🔘 Test button clicked!");
    console.log("Current embedUrlValidated:", embedUrlValidated);
    console.log("Current embedUrlError:", embedUrlError);
    console.log("Current newLesson:", newLesson);
  }

  function testApplyButton() {
    console.log("🔘 Apply button clicked!");
    validateEmbedUrl();
  }
</script>

<svelte:head>
  <title>Lessons - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-3xl font-bold">Lessons</h1>
      <p class="text-muted-foreground">
        Manage Notion-based lessons for your learning platform
      </p>
    </div>
    {#if canManage}
      <Button on:click={() => (createDialogOpen = true)}>
        <Plus class="w-4 h-4 mr-2" />
        New Lesson
      </Button>
    {/if}
  </div>

  <CrudTips
    title="Lesson Management"
    tips={[
      "Each lesson is a Notion page that can contain text, videos, quizzes, and more",
      "Use the filters to organize lessons by module and unit",
      "Published lessons are visible to all users",
      "Unpublished lessons are only visible to content managers",
    ]}
  />

  <!-- Filters -->
  <Card class="mb-6">
    <div class="p-4">
      <div class="flex items-center gap-4 mb-4">
        <Filter class="w-4 h-4" />
        <h3 class="font-semibold">Filters</h3>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Select bind:value={selectedModule} placeholder="Filter by Module">
          <option value="">All Modules</option>
          {#each modules as module}
            <option value={module.id}>{module.title}</option>
          {/each}
        </Select>

        <Select bind:value={selectedUnit} placeholder="Filter by Unit">
          <option value="">All Units</option>
          {#each units as unit}
            <option value={unit.id}>{unit.title}</option>
          {/each}
        </Select>

        <div class="flex items-center space-x-2">
          <input
            type="checkbox"
            id="published-only"
            bind:checked={showPublishedOnly}
            class="rounded"
          />
          <label for="published-only" class="text-sm">Published only</label>
        </div>

        <Button variant="outline" on:click={clearFilters} size="sm">
          Clear Filters
        </Button>
      </div>
    </div>
  </Card>

  <!-- Lessons List -->
  <LoadingOptimizer>
    {#if state.loading}
      <div class="flex items-center justify-center p-8">
        <Loader2 class="w-6 h-6 animate-spin mr-2" />
        Loading lessons...
      </div>
    {:else if state.error}
      <Card class="p-6">
        <div class="flex items-center text-destructive">
          <AlertCircle class="w-5 h-5 mr-2" />
          <span>{state.error}</span>
        </div>
      </Card>
    {:else if filteredLessons.length === 0}
      <Card class="p-6">
        <div class="text-center text-muted-foreground">
          <FileText class="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 class="text-lg font-semibold mb-2">No lessons found</h3>
          <p class="mb-4">
            {lessons.length === 0
              ? "Create your first lesson to get started"
              : "No lessons match your current filters"}
          </p>
          {#if canManage && lessons.length === 0}
            <Button on:click={() => (createDialogOpen = true)}>
              <Plus class="w-4 h-4 mr-2" />
              Create First Lesson
            </Button>
          {/if}
        </div>
      </Card>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each filteredLessons as lesson}
          <Card class="hover:shadow-md transition-shadow">
            <div class="p-6">
              <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                  <h3 class="font-semibold text-lg mb-1">{lesson.title}</h3>
                  <div
                    class="flex items-center gap-2 text-sm text-muted-foreground mb-2"
                  >
                    <span>{getModuleName(lesson.module_id)}</span>
                    {#if lesson.unit_id}
                      <span>•</span>
                      <span>{getUnitName(lesson.unit_id)}</span>
                    {/if}
                  </div>
                  <div class="flex items-center gap-2">
                    {#if lesson.is_published}
                      <CheckCircle class="w-4 h-4 text-green-500" />
                      <span class="text-sm text-green-600">Published</span>
                    {:else}
                      <AlertCircle class="w-4 h-4 text-yellow-500" />
                      <span class="text-sm text-yellow-600">Draft</span>
                    {/if}
                  </div>
                </div>
                {#if canManage}
                  <div class="flex items-center gap-1">
                    <button
                      on:click={() => openEditDialog(lesson)}
                      class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                      title="Edit lesson"
                    >
                      <Edit class="w-4 h-4" />
                    </button>
                    <button
                      on:click={() => openDeleteDialog(lesson)}
                      class="p-2 hover:bg-destructive/20 rounded-md text-muted-foreground hover:text-destructive"
                      title="Delete lesson"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                {/if}
              </div>

              <div class="flex items-center gap-2">
                <a href="/lessons/{lesson.id}" class="flex-1">
                  <Button variant="outline" class="w-full">
                    <Eye class="w-4 h-4 mr-2" />
                    View Lesson
                  </Button>
                </a>
                <a
                  href={lesson.notion_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex-shrink-0"
                >
                  <Button variant="ghost" size="sm">
                    <ExternalLink class="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </div>
          </Card>
        {/each}
      </div>
    {/if}
  </LoadingOptimizer>
</div>

<!-- Create Lesson Dialog -->
<Dialog bind:open={createDialogOpen} title="Create New Lesson">
  <div class="space-y-4">
    <div>
      <label for="title" class="block text-sm font-medium mb-1">Title</label>
      <Input
        id="title"
        bind:value={newLesson.title}
        placeholder="Enter lesson title"
        required
      />
    </div>

    <div>
      <label for="notion_url" class="block text-sm font-medium mb-1"
        >Notion URL</label
      >
      <Input
        id="notion_url"
        bind:value={newLesson.notion_url}
        placeholder="Paste Notion URL or iframe snippet here"
        on:input={handleNotionUrlInput}
        required
      />
      {#if newLesson.notion_url}
        {#if embedUrlValidated}
          <p class="text-xs text-green-600 mt-1">
            ✅ Embed URL is automatically populated
          </p>
        {:else}
          <p class="text-xs text-yellow-600 mt-1">
            ⚠️ Could not extract embed URL. You may need to use manual embed in
            the lesson view.
          </p>
        {/if}
        {#if embedUrlError}
          <p class="text-xs text-red-600 mt-1">{embedUrlError}</p>
        {/if}
      {/if}
      <p class="text-xs text-muted-foreground mt-1">
        💡 You can paste either a Notion page URL or the iframe snippet from
        Notion's embed dialog. Make sure your Notion page is set to "Public" in
        sharing settings for embedding to work.
      </p>
    </div>

    <div>
      <label for="embed_url" class="block text-sm font-medium mb-1"
        >Embed URL</label
      >
      <div class="flex items-center gap-2">
        <Input
          id="embed_url"
          bind:value={newLesson.embed_url}
          placeholder="https://bigstep-idiomas.notion.site/ebd/your-page-id"
          on:input={() => {
            if (newLesson.embed_url) {
              console.log("🔍 Embed URL field changed:", newLesson.embed_url);
              // Auto-validate if it looks like an iframe snippet
              if (newLesson.embed_url.includes("<iframe")) {
                validateEmbedUrl();
              }
            }
          }}
          required
        />
        <Button variant="outline" on:click={validateEmbedUrl} size="sm">
          Apply
        </Button>
        <Button variant="outline" on:click={testApplyButton} size="sm">
          Test Apply
        </Button>
      </div>
      {#if newLesson.embed_url}
        <p class="text-xs text-green-600 mt-1">
          ✅ Embed URL is automatically populated from Notion URL
        </p>
      {/if}
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="module" class="block text-sm font-medium mb-1">Module</label
        >
        <Select bind:value={newLesson.module_id} id="module">
          <option value="">No Module</option>
          {#each modules as module}
            <option value={module.id}>{module.title}</option>
          {/each}
        </Select>
      </div>

      <div>
        <label for="unit" class="block text-sm font-medium mb-1">Unit</label>
        <Select bind:value={newLesson.unit_id} id="unit">
          <option value="">No Unit</option>
          {#each units as unit}
            <option value={unit.id}>{unit.title}</option>
          {/each}
        </Select>
      </div>
    </div>

    <div class="flex items-center space-x-2">
      <input
        type="checkbox"
        id="is_published"
        bind:checked={newLesson.is_published}
        class="rounded"
      />
      <label for="is_published" class="text-sm">Publish immediately</label>
    </div>
  </div>

  <div class="flex justify-end gap-2 mt-6">
    <Button variant="outline" on:click={() => (createDialogOpen = false)}>
      Cancel
    </Button>
    <Button on:click={handleCreateLesson} disabled={isCreatingLesson}>
      {#if isCreatingLesson}
        <Loader2 class="w-4 h-4 mr-2 animate-spin" />
        Creating...
      {:else}
        Create Lesson
      {/if}
    </Button>
    <Button variant="outline" on:click={testButtonClick} size="sm">
      Test Create
    </Button>
  </div>
</Dialog>

<!-- Edit Lesson Dialog -->
<Dialog bind:open={editDialogOpen} title="Edit Lesson">
  <div class="space-y-4">
    <div>
      <label for="edit-title" class="block text-sm font-medium mb-1"
        >Title</label
      >
      <Input
        id="edit-title"
        bind:value={editLesson.title}
        placeholder="Enter lesson title"
        required
      />
    </div>

    <div>
      <label for="edit-notion_url" class="block text-sm font-medium mb-1"
        >Notion URL</label
      >
      <Input
        id="edit-notion_url"
        bind:value={editLesson.notion_url}
        placeholder="https://notion.so/your-page"
        on:input={handleEditNotionUrlInput}
        required
      />
      {#if editLesson.notion_url}
        {#if editEmbedUrlValidated}
          <p class="text-xs text-green-600 mt-1">
            ✅ Embed URL is automatically populated
          </p>
        {:else}
          <p class="text-xs text-yellow-600 mt-1">
            ⚠️ Could not extract embed URL. You may need to use manual embed in
            the lesson view.
          </p>
        {/if}
        {#if editEmbedUrlError}
          <p class="text-xs text-red-600 mt-1">{editEmbedUrlError}</p>
        {/if}
      {/if}
      <p class="text-xs text-muted-foreground mt-1">
        💡 You can paste either a Notion page URL or the iframe snippet from
        Notion's embed dialog. Make sure your Notion page is set to "Public" in
        sharing settings for embedding to work.
      </p>
    </div>

    <div>
      <label for="edit-embed_url" class="block text-sm font-medium mb-1"
        >Embed URL</label
      >
      <div class="flex items-center gap-2">
        <Input
          id="edit-embed_url"
          bind:value={editLesson.embed_url}
          placeholder="https://bigstep-idiomas.notion.site/ebd/your-page-id"
          on:input={() => {
            if (editLesson.notion_url) {
              const embedUrl = extractNotionEmbedUrl(editLesson.notion_url);
              if (embedUrl) {
                editLesson.embed_url = embedUrl;
              }
            }
          }}
          required
        />
        <Button variant="outline" on:click={validateEditEmbedUrl} size="sm">
          Apply
        </Button>
      </div>
      {#if editLesson.embed_url}
        <p class="text-xs text-green-600 mt-1">
          ✅ Embed URL is automatically populated from Notion URL
        </p>
      {/if}
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="edit-module" class="block text-sm font-medium mb-1"
          >Module</label
        >
        <Select bind:value={editLesson.module_id} id="edit-module">
          <option value="">No Module</option>
          {#each modules as module}
            <option value={module.id}>{module.title}</option>
          {/each}
        </Select>
      </div>

      <div>
        <label for="edit-unit" class="block text-sm font-medium mb-1"
          >Unit</label
        >
        <Select bind:value={editLesson.unit_id} id="edit-unit">
          <option value="">No Unit</option>
          {#each units as unit}
            <option value={unit.id}>{unit.title}</option>
          {/each}
        </Select>
      </div>
    </div>

    <div class="flex items-center space-x-2">
      <input
        type="checkbox"
        id="edit-is_published"
        bind:checked={editLesson.is_published}
        class="rounded"
      />
      <label for="edit-is_published" class="text-sm">Published</label>
    </div>
  </div>

  <div class="flex justify-end gap-2 mt-6">
    <Button variant="outline" on:click={() => (editDialogOpen = false)}>
      Cancel
    </Button>
    <Button on:click={handleUpdateLesson} disabled={isUpdatingLesson}>
      {#if isUpdatingLesson}
        <Loader2 class="w-4 h-4 mr-2 animate-spin" />
        Updating...
      {:else}
        Update Lesson
      {/if}
    </Button>
  </div>
</Dialog>

<!-- Delete Confirmation Dialog -->
<Dialog bind:open={deleteDialogOpen} title="Delete Lesson">
  <p class="text-muted-foreground mb-4">
    Are you sure you want to delete "{lessonToDelete?.title}"? This action
    cannot be undone.
  </p>

  <div class="flex justify-end gap-2">
    <Button variant="outline" on:click={() => (deleteDialogOpen = false)}>
      Cancel
    </Button>
    <Button variant="destructive" on:click={handleDeleteLesson}>
      Delete Lesson
    </Button>
  </div>
</Dialog>
