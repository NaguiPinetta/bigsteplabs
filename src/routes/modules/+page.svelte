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
  import { supabase } from "$lib/supabase";
  import { toastStore } from "$lib/stores/toast";

  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Textarea from "$lib/components/ui/textarea.svelte";
  import CrudTips from "$lib/components/ui/crud-tips.svelte";
  import Collapsible from "$lib/components/ui/collapsible.svelte";
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
    ChevronDown,
    ChevronRight,
    Play,
    Layers,
    ExternalLink,
  } from "lucide-svelte";

  // Dialog states
  let createDialogOpen = false;
  let editDialogOpen = false;
  let deleteDialogOpen = false;

  // Form data
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

  // Hierarchical data
  let unitsData: Record<string, any[]> = {};
  let lessonsData: Record<string, any[]> = {};
  let loadingUnits: Record<string, boolean> = {};
  let loadingLessons: Record<string, boolean> = {};

  // Collapsible states
  let expandedModules: Record<string, boolean> = {};
  let expandedUnits: Record<string, boolean> = {};
  let expandedLessons: Record<string, boolean> = {};

  // Auth and store state
  $: user = $authStore.user;
  $: canManage = $canManageContent;
  $: state = $modulesStore;
  $: modules = state.modules;
  $: selectedModule = state.selectedModule;

  onMount(async () => {
    await loadModules();
  });

  // Load units for a module
  async function loadUnits(moduleId: string) {
    if (unitsData[moduleId]) return; // Already loaded

    loadingUnits[moduleId] = true;
    try {
      const { data: units, error } = await supabase
        .from("units")
        .select("*")
        .eq("module_id", moduleId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      unitsData[moduleId] = units || [];
    } catch (err) {
      console.error("Error loading units:", err);
      toastStore.error("Failed to load units");
      unitsData[moduleId] = [];
    } finally {
      loadingUnits[moduleId] = false;
    }
  }

  // Load lessons for a unit
  async function loadLessons(unitId: string) {
    if (lessonsData[unitId]) return; // Already loaded

    loadingLessons[unitId] = true;
    try {
      const { data: lessons, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("unit_id", unitId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      lessonsData[unitId] = lessons || [];
    } catch (err) {
      console.error("Error loading lessons:", err);
      toastStore.error("Failed to load lessons");
      lessonsData[unitId] = [];
    } finally {
      loadingLessons[unitId] = false;
    }
  }

  // Toggle module expansion
  function toggleModule(moduleId: string) {
    expandedModules[moduleId] = !expandedModules[moduleId];
    expandedModules = { ...expandedModules }; // Trigger reactivity

    if (expandedModules[moduleId]) {
      loadUnits(moduleId);
    }
  }

  // Toggle unit expansion
  function toggleUnit(unitId: string) {
    expandedUnits[unitId] = !expandedUnits[unitId];
    expandedUnits = { ...expandedUnits }; // Trigger reactivity

    if (expandedUnits[unitId]) {
      loadLessons(unitId);
    }
  }

  // Toggle lesson expansion
  function toggleLesson(lessonId: string) {
    expandedLessons[lessonId] = !expandedLessons[lessonId];
    expandedLessons = { ...expandedLessons }; // Trigger reactivity
  }

  // View lesson content (now expands inline)
  function viewLesson(lesson: any) {
    toggleLesson(lesson.id);
  }

  // Module management functions
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
      description: newModule.description.trim() || "No description provided",
      is_published: newModule.is_published,
    });

    if (result.data) {
      createDialogOpen = false;
      resetNewModule();
      toastStore.success("Module created successfully");
    } else {
      toastStore.error(String(result.error) || "Failed to create module");
    }
  }

  async function handleUpdateModule() {
    console.log("🔍 handleUpdateModule called");
    console.log("🔍 Current user:", user);
    console.log("🔍 Edit module data:", editModule);

    if (!user) {
      console.log("❌ No user found, returning");
      return;
    }

    const validation = validateModule(editModule);
    console.log("🔍 Validation result:", validation);

    if (!validation.valid) {
      console.log("❌ Validation failed:", validation.errors);
      validationErrors = validation.errors;
      return;
    }

    console.log("🔍 Calling updateModule with:", {
      id: editModule.id,
      updates: {
        title: editModule.title.trim(),
        description: editModule.description.trim() || "No description provided",
        is_published: editModule.is_published,
      },
    });

    const result = await updateModule(editModule.id, {
      title: editModule.title.trim(),
      description: editModule.description.trim() || "No description provided",
      is_published: editModule.is_published,
    });

    console.log("🔍 Update result:", result);

    if (result.data) {
      console.log("✅ Update successful, closing dialog");
      editDialogOpen = false;
      toastStore.success("Module updated successfully");
    } else {
      console.log("❌ Update failed:", result.error);
      toastStore.error(String(result.error) || "Failed to update module");
    }
  }

  async function handleDeleteModule() {
    if (!moduleToDelete) return;

    const result = await deleteModule(moduleToDelete.id);
    if (result.success) {
      deleteDialogOpen = false;
      moduleToDelete = null;
      toastStore.success("Module deleted successfully");
    } else {
      toastStore.error(String(result.error) || "Failed to delete module");
    }
  }

  async function handleTogglePublication(moduleId: string) {
    const result = await toggleModulePublication(moduleId);
    if (result.data) {
      toastStore.success("Module publication status updated");
    } else {
      toastStore.error(
        String(result.error) || "Failed to update publication status"
      );
    }
  }

  async function handleDuplicateModule(moduleId: string) {
    const result = await duplicateModule(moduleId);
    if (result.data) {
      toastStore.success("Module duplicated successfully");
    } else {
      toastStore.error(String(result.error) || "Failed to duplicate module");
    }
  }

  function openCreateDialog() {
    resetNewModule();
    createDialogOpen = true;
  }

  function openEditDialog(module: any) {
    editModule = {
      id: module.id,
      title: module.title,
      description: module.description,
      is_published: module.is_published,
    };
    editDialogOpen = true;
  }

  function openDeleteDialog(module: any) {
    moduleToDelete = module;
    deleteDialogOpen = true;
  }

  function openViewDialog(module: any) {
    setSelectedModule(module);
  }

  // Get module stats
  async function loadModuleStats(moduleId: string) {
    if (moduleStats[moduleId]) return;

    loadingStats[moduleId] = true;
    try {
      const stats = await getModuleStats(moduleId);
      moduleStats[moduleId] = stats;
    } catch (err) {
      console.error("Error loading module stats:", err);
      moduleStats[moduleId] = { units: 0, content: 0, students: 0 };
    } finally {
      loadingStats[moduleId] = false;
    }
  }

  // Load stats when modules change
  $: if (modules.length > 0) {
    modules.forEach((module) => {
      if (!moduleStats[module.id]) {
        loadModuleStats(module.id);
      }
    });
  }
</script>

<svelte:head>
  <title>Learning Modules - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-3xl font-bold text-foreground">Learning Modules</h1>
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

  <!-- Loading State -->
  {#if state.loading}
    <div class="flex items-center justify-center p-8">
      <Loader2 class="w-6 h-6 animate-spin mr-2" />
      Loading modules...
    </div>
  {:else if state.error}
    <Card class="p-6">
      <div class="flex items-center text-destructive">
        <AlertCircle class="w-5 h-5 mr-2" />
        <span>{state.error}</span>
      </div>
    </Card>
  {:else if modules.length === 0}
    <Card class="p-8 text-center">
      <BookOpen class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 class="text-lg font-semibold mb-2">No modules yet</h3>
      <p class="text-muted-foreground mb-4">
        {canManage
          ? "Create your first module to get started"
          : "No modules are available yet"}
      </p>
      {#if canManage}
        <Button on:click={openCreateDialog}>
          <Plus class="w-4 h-4 mr-2" />
          Create Your First Module
        </Button>
      {/if}
    </Card>
  {:else}
    <!-- Modules List -->
    <div class="space-y-4">
      {#each modules as module (module.id)}
        <!-- Module Card -->
        <Card class="overflow-hidden">
          <div class="p-6">
            <!-- Module Header -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-start gap-4 flex-1">
                <!-- Module Icon -->
                <div
                  class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"
                >
                  <BookOpen class="w-5 h-5 text-primary" />
                </div>

                <!-- Module Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-3 mb-2">
                    <h3 class="text-lg font-semibold text-foreground">
                      {module.title}
                    </h3>
                    <span
                      class={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        module.is_published
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
                      }`}
                    >
                      {module.is_published ? "Published" : "Draft"}
                    </span>
                  </div>

                  <p class="text-sm text-muted-foreground mb-3">
                    {module.description || "No description provided"}
                  </p>

                  <!-- Module Stats -->
                  <div
                    class="flex items-center gap-4 text-sm text-muted-foreground"
                  >
                    <div class="flex items-center gap-1">
                      <Layers class="w-4 h-4" />
                      <span>
                        {#if loadingStats[module.id]}
                          <Loader2 class="w-3 h-3 animate-spin inline" />
                        {:else}
                          {moduleStats[module.id]?.units || 0} units
                        {/if}
                      </span>
                    </div>
                    <div class="flex items-center gap-1">
                      <FileText class="w-4 h-4" />
                      <span>
                        {#if loadingStats[module.id]}
                          <Loader2 class="w-3 h-3 animate-spin inline" />
                        {:else}
                          {moduleStats[module.id]?.content || 0} lessons
                        {/if}
                      </span>
                    </div>
                    <div class="flex items-center gap-1">
                      <Users class="w-4 h-4" />
                      <span>
                        {#if loadingStats[module.id]}
                          <Loader2 class="w-3 h-3 animate-spin inline" />
                        {:else}
                          {moduleStats[module.id]?.students || 0} students
                        {/if}
                      </span>
                    </div>
                    <span class="text-xs">
                      Updated {new Date(module.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Admin Actions -->
              {#if canManage}
                <div class="flex items-center gap-1">
                  <button
                    on:click={() => handleTogglePublication(module.id)}
                    class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                    title={module.is_published ? "Unpublish" : "Publish"}
                  >
                    {#if module.is_published}
                      <Globe class="w-4 h-4" />
                    {:else}
                      <Lock class="w-4 h-4" />
                    {/if}
                  </button>
                  <button
                    on:click={() => handleDuplicateModule(module.id)}
                    class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                    title="Duplicate module"
                  >
                    <Copy class="w-4 h-4" />
                  </button>
                  <button
                    on:click={() => openViewDialog(module)}
                    class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                    title="View module"
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
                    class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground text-destructive"
                    title="Delete module"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              {/if}
            </div>

            <!-- Collapsible Units Section -->
            <Collapsible bind:open={expandedModules[module.id]}>
              <div class="flex items-center justify-between">
                <button
                  on:click={() => toggleModule(module.id)}
                  class="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {#if expandedModules[module.id]}
                    <ChevronDown class="w-4 h-4" />
                    Hide Units
                  {:else}
                    <ChevronRight class="w-4 h-4" />
                    Show Units ({moduleStats[module.id]?.units || 0})
                  {/if}
                </button>
              </div>

              <div slot="content" class="mt-4">
                {#if loadingUnits[module.id]}
                  <div class="flex items-center justify-center p-4">
                    <Loader2 class="w-4 h-4 animate-spin mr-2" />
                    Loading units...
                  </div>
                {:else if unitsData[module.id]?.length === 0}
                  <div class="text-center p-4 text-muted-foreground">
                    <Layers class="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No units in this module</p>
                    {#if canManage}
                      <Button variant="outline" size="sm" class="mt-2">
                        <Plus class="w-3 h-3 mr-1" />
                        Add Unit
                      </Button>
                    {/if}
                  </div>
                {:else}
                  <div class="space-y-3">
                    {#each unitsData[module.id] || [] as unit (unit.id)}
                      <!-- Unit Card -->
                      <Card class="p-4">
                        <div class="flex items-start justify-between mb-3">
                          <div class="flex items-start gap-3 flex-1">
                            <!-- Unit Icon -->
                            <div
                              class="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center"
                            >
                              <Layers class="w-4 h-4 text-blue-500" />
                            </div>

                            <!-- Unit Info -->
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center gap-2 mb-1">
                                <h4 class="font-medium text-foreground">
                                  {unit.title}
                                </h4>
                                <span
                                  class={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    unit.is_published
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                      : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
                                  }`}
                                >
                                  {unit.is_published ? "Published" : "Draft"}
                                </span>
                              </div>

                              <p class="text-sm text-muted-foreground mb-2">
                                {unit.description || "No description"}
                              </p>

                              <!-- Unit Stats -->
                              <div
                                class="flex items-center gap-3 text-xs text-muted-foreground"
                              >
                                <span>
                                  {#if loadingLessons[unit.id]}
                                    <Loader2
                                      class="w-3 h-3 animate-spin inline"
                                    />
                                  {:else}
                                    {lessonsData[unit.id]?.length || 0} lessons
                                  {/if}
                                </span>
                                <span>
                                  Updated {new Date(
                                    unit.updated_at
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <!-- Unit Actions -->
                          {#if canManage}
                            <div class="flex items-center gap-1">
                              <button
                                on:click={() => openEditDialog(unit)}
                                class="p-1 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                                title="Edit unit"
                              >
                                <Edit class="w-3 h-3" />
                              </button>
                              <button
                                on:click={() => openDeleteDialog(unit)}
                                class="p-1 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground text-destructive"
                                title="Delete unit"
                              >
                                <Trash2 class="w-3 h-3" />
                              </button>
                            </div>
                          {/if}
                        </div>

                        <!-- Collapsible Lessons Section -->
                        <Collapsible bind:open={expandedUnits[unit.id]}>
                          <div class="flex items-center justify-between">
                            <button
                              on:click={() => toggleUnit(unit.id)}
                              class="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {#if expandedUnits[unit.id]}
                                <ChevronDown class="w-3 h-3" />
                                Hide Lessons
                              {:else}
                                <ChevronRight class="w-3 h-3" />
                                Show Lessons ({lessonsData[unit.id]?.length ||
                                  0})
                              {/if}
                            </button>
                          </div>

                          <div slot="content" class="mt-3">
                            {#if loadingLessons[unit.id]}
                              <div class="flex items-center justify-center p-2">
                                <Loader2 class="w-3 h-3 animate-spin mr-1" />
                                Loading lessons...
                              </div>
                            {:else if lessonsData[unit.id]?.length === 0}
                              <div
                                class="text-center p-2 text-muted-foreground"
                              >
                                <FileText
                                  class="w-6 h-6 mx-auto mb-1 opacity-50"
                                />
                                <p class="text-xs">No lessons in this unit</p>
                                {#if canManage}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    class="mt-1 text-xs"
                                  >
                                    <Plus class="w-3 h-3 mr-1" />
                                    Add Lesson
                                  </Button>
                                {/if}
                              </div>
                            {:else}
                              <div class="space-y-2">
                                {#each lessonsData[unit.id] || [] as lesson (lesson.id)}
                                  <!-- Lesson Card -->
                                  <div
                                    class="border rounded p-3 bg-muted/30 {expandedLessons[
                                      lesson.id
                                    ]
                                      ? 'min-h-[300px]'
                                      : 'min-h-[80px]'}"
                                  >
                                    <div
                                      class="flex items-center justify-between"
                                    >
                                      <div
                                        class="flex items-center gap-2 flex-1"
                                      >
                                        <!-- Lesson Icon -->
                                        <div
                                          class="w-6 h-6 bg-green-500/10 rounded flex items-center justify-center"
                                        >
                                          <FileText
                                            class="w-3 h-3 text-green-500"
                                          />
                                        </div>

                                        <!-- Lesson Info -->
                                        <div class="flex-1 min-w-0">
                                          <div class="flex items-center gap-2">
                                            <h5
                                              class="text-sm font-medium text-foreground truncate"
                                            >
                                              {lesson.title}
                                            </h5>
                                            <span
                                              class={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                                lesson.is_published
                                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                                  : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
                                              }`}
                                            >
                                              {lesson.is_published
                                                ? "Published"
                                                : "Draft"}
                                            </span>
                                          </div>
                                          <p
                                            class="text-xs text-muted-foreground"
                                          >
                                            Created {new Date(
                                              lesson.created_at
                                            ).toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>

                                      <!-- Lesson Actions -->
                                      <div class="flex items-center gap-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          on:click={() => viewLesson(lesson)}
                                          class="text-xs"
                                        >
                                          {#if expandedLessons[lesson.id]}
                                            <ChevronDown class="w-3 h-3 mr-1" />
                                            Hide Content
                                          {:else}
                                            <Play class="w-3 h-3 mr-1" />
                                            View Lesson
                                          {/if}
                                        </Button>
                                        {#if canManage}
                                          <button
                                            on:click={() =>
                                              openEditDialog(lesson)}
                                            class="p-1 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                                            title="Edit lesson"
                                          >
                                            <Edit class="w-3 h-3" />
                                          </button>
                                          <button
                                            on:click={() =>
                                              openDeleteDialog(lesson)}
                                            class="p-1 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground text-destructive"
                                            title="Delete lesson"
                                          >
                                            <Trash2 class="w-3 h-3" />
                                          </button>
                                        {/if}
                                      </div>
                                    </div>

                                    <!-- Expanded Lesson Content -->
                                    {#if expandedLessons[lesson.id]}
                                      <div
                                        class="mt-3 pt-3 border-t border-border"
                                      >
                                        {#if lesson.embed_url}
                                          <div
                                            class="bg-background rounded border"
                                          >
                                            <iframe
                                              src={lesson.embed_url}
                                              style="width: 100%; height: 1200px; border: none;"
                                              title={lesson.title}
                                              loading="eager"
                                              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-downloads allow-modals"
                                              allow="fullscreen; autoplay; encrypted-media; picture-in-picture; microphone; camera"
                                              referrerpolicy="no-referrer"
                                            />
                                          </div>
                                        {:else if lesson.notion_url}
                                          <div
                                            class="text-center p-4 bg-muted rounded"
                                          >
                                            <FileText
                                              class="w-8 h-8 text-muted-foreground mx-auto mb-2"
                                            />
                                            <h6 class="font-medium mb-1">
                                              Notion Content
                                            </h6>
                                            <p
                                              class="text-sm text-muted-foreground mb-3"
                                            >
                                              This lesson contains Notion
                                              content that needs to be embedded.
                                            </p>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              on:click={() =>
                                                window.open(
                                                  lesson.notion_url,
                                                  "_blank"
                                                )}
                                            >
                                              <ExternalLink
                                                class="w-3 h-3 mr-1"
                                              />
                                              Open in Notion
                                            </Button>
                                          </div>
                                        {:else}
                                          <div
                                            class="text-center p-4 bg-muted rounded"
                                          >
                                            <FileText
                                              class="w-8 h-8 text-muted-foreground mx-auto mb-2"
                                            />
                                            <h6 class="font-medium mb-1">
                                              No Content Available
                                            </h6>
                                            <p
                                              class="text-sm text-muted-foreground"
                                            >
                                              This lesson doesn't have any
                                              content configured yet.
                                            </p>
                                          </div>
                                        {/if}
                                      </div>
                                    {/if}
                                  </div>
                                {/each}
                              </div>
                            {/if}
                          </div>
                        </Collapsible>
                      </Card>
                    {/each}
                  </div>
                {/if}
              </div>
            </Collapsible>
          </div>
        </Card>
      {/each}
    </div>
  {/if}

  <!-- Module Management Tips -->
  {#if canManage}
    <CrudTips
      title="Module Management Tips"
      tips={[
        "Drag modules to reorder them in your course structure",
        "Create descriptive titles and descriptions for better organization",
        "Use draft status to prepare modules before publishing",
        "Duplicate existing modules to quickly create similar content",
      ]}
    />
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
