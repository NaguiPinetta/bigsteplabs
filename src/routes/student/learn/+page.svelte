<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { authStore } from "$lib/stores/auth";
  import { supabase } from "$lib/supabase";

  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import {
    BookOpen,
    Play,
    CheckCircle,
    Clock,
    ArrowRight,
    ArrowLeft,
    Lock,
    Star,
    BarChart3,
    Target,
    Award,
    FileText,
    Video,
    Headphones,
    ExternalLink,
    Bot,
  } from "lucide-svelte";

  let modules = [];
  let currentModule = null;
  let currentUnit = null;
  let currentContent = null;
  let userProgress = [];
  let loading = true;
  let contentLoading = false;
  let chatOpen = false;
  let selectedModuleId = null;
  let selectedUnitId = null;

  $: user = $authStore.user;
  $: urlParams = $page.url.searchParams;

  onMount(async () => {
    // Get module and unit from URL params
    selectedModuleId = urlParams.get("module");
    selectedUnitId = urlParams.get("unit");

    await loadModules();
    await loadUserProgress();

    // If specific module/unit specified, load it
    if (selectedModuleId) {
      await selectModule(selectedModuleId);
      if (selectedUnitId) {
        await selectUnit(selectedUnitId);
      }
    }

    loading = false;
  });

  async function loadModules() {
    try {
      const { data, error } = await supabase
        .from("modules")
        .select(
          `
					*,
					units:units(
						*,
						content:content(id, title, content_type, file_url, order_index)
					)
				`
        )
        .eq("is_published", true)
        .order("order_index");

      if (error) throw error;

      modules =
        data?.map((module) => ({
          ...module,
          units: module.units.sort((a, b) => a.order_index - b.order_index),
        })) || [];
    } catch (error) {
      console.error("Failed to load modules:", error);
    }
  }

  async function loadUserProgress() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      userProgress = data || [];
    } catch (error) {
      console.error("Failed to load progress:", error);
    }
  }

  async function selectModule(moduleId) {
    currentModule = modules.find((m) => m.id === moduleId);
    currentUnit = null;
    currentContent = null;

    if (currentModule) {
      // Update URL
      const url = new URL(window.location);
      url.searchParams.set("module", moduleId);
      url.searchParams.delete("unit");
      window.history.replaceState({}, "", url);
    }
  }

  async function selectUnit(unitId) {
    if (!currentModule) return;

    currentUnit = currentModule.units.find((u) => u.id === unitId);
    contentLoading = true;

    if (currentUnit) {
      // Update URL
      const url = new URL(window.location);
      url.searchParams.set("unit", unitId);
      window.history.replaceState({}, "", url);

      // Load unit content
      await loadUnitContent(unitId);

      // Mark unit as started
      await updateProgress(unitId, "in_progress");
    }

    contentLoading = false;
  }

  async function loadUnitContent(unitId) {
    try {
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("unit_id", unitId)
        .order("order_index");

      if (error) throw error;

      if (data && data.length > 0) {
        currentContent = data[0]; // Load first content item
      }
    } catch (error) {
      console.error("Failed to load content:", error);
    }
  }

  async function updateProgress(unitId, status) {
    if (!user) return;

    try {
      const existing = userProgress.find((p) => p.unit_id === unitId);

      if (existing) {
        const { error } = await supabase
          .from("user_progress")
          .update({
            status,
            last_accessed_at: new Date().toISOString(),
            completion_percentage:
              status === "done" ? 100 : status === "in_progress" ? 50 : 0,
          })
          .eq("id", existing.id);

        if (!error) {
          userProgress = userProgress.map((p) =>
            p.id === existing.id
              ? { ...p, status, last_accessed_at: new Date().toISOString() }
              : p
          );
        }
      } else {
        const { data, error } = await supabase
          .from("user_progress")
          .insert([
            {
              user_id: user.id,
              unit_id: unitId,
              status,
              completion_percentage:
                status === "done" ? 100 : status === "in_progress" ? 50 : 0,
              last_accessed_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (!error && data) {
          userProgress = [...userProgress, data];
        }
      }
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  }

  async function markUnitComplete(unitId) {
    await updateProgress(unitId, "done");

    // Move to next unit if available
    if (currentModule && currentUnit) {
      const currentIndex = currentModule.units.findIndex(
        (u) => u.id === unitId
      );
      if (currentIndex < currentModule.units.length - 1) {
        const nextUnit = currentModule.units[currentIndex + 1];
        await selectUnit(nextUnit.id);
      }
    }
  }

  function getUnitProgress(unitId) {
    const progress = userProgress.find((p) => p.unit_id === unitId);
    return progress?.status || "not_started";
  }

  function getModuleProgress(module) {
    const completedUnits = module.units.filter(
      (unit) => getUnitProgress(unit.id) === "done"
    ).length;

    return Math.round((completedUnits / module.units.length) * 100);
  }

  function getStatusIcon(status) {
    switch (status) {
      case "done":
        return CheckCircle;
      case "in_progress":
        return Clock;
      default:
        return BookOpen;
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case "done":
        return "text-green-600";
      case "in_progress":
        return "text-blue-600";
      default:
        return "text-muted-foreground";
    }
  }

  function getContentTypeIcon(type) {
    switch (type) {
      case "video":
        return Video;
      case "audio":
        return Headphones;
      case "document":
        return FileText;
      case "link":
        return ExternalLink;
      default:
        return FileText;
    }
  }

  function formatTime(minutes) {
    if (!minutes) return "5 min read";
    return minutes < 60
      ? `${minutes}min`
      : `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
</script>

<svelte:head>
  <title>Learn - BigStepLabs</title>
  <meta
    name="description"
    content="Access your learning content and track progress"
  />
</svelte:head>

<div class="min-h-screen bg-background">
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="text-center">
        <div
          class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"
        ></div>
        <p class="text-muted-foreground">Loading your learning materials...</p>
      </div>
    </div>
  {:else}
    <div class="flex h-screen">
      <!-- Sidebar Navigation -->
      <div class="w-80 bg-card border-r border-border overflow-y-auto">
        <div class="p-6">
          <h2 class="text-lg font-semibold text-foreground mb-4">
            Your Learning Path
          </h2>

          <!-- Module List -->
          <div class="space-y-4">
            {#each modules as module (module.id)}
              <Card
                class="p-4 {currentModule?.id === module.id
                  ? 'ring-2 ring-primary'
                  : ''}"
              >
                <button
                  class="w-full text-left"
                  on:click={() => selectModule(module.id)}
                >
                  <div class="flex items-start space-x-3">
                    <div
                      class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0"
                    >
                      <BookOpen class="w-5 h-5 text-primary" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="font-medium text-foreground mb-1">
                        {module.title}
                      </h3>
                      <p
                        class="text-sm text-muted-foreground mb-2 line-clamp-2"
                      >
                        {module.description || "No description available"}
                      </p>

                      <!-- Progress Bar -->
                      <div class="w-full bg-muted rounded-full h-2 mb-2">
                        <div
                          class="bg-primary rounded-full h-2 transition-all duration-300"
                          style="width: {getModuleProgress(module)}%"
                        ></div>
                      </div>
                      <div
                        class="flex items-center justify-between text-xs text-muted-foreground"
                      >
                        <span>{getModuleProgress(module)}% complete</span>
                        <span>{module.units.length} units</span>
                      </div>
                    </div>
                  </div>
                </button>

                <!-- Unit List (when module is selected) -->
                {#if currentModule?.id === module.id}
                  <div class="mt-4 ml-13 space-y-2">
                    {#each module.units as unit (unit.id)}
                      {@const status = getUnitProgress(unit.id)}
                      {@const StatusIcon = getStatusIcon(status)}
                      <button
                        class="w-full text-left p-2 rounded-md hover:bg-accent transition-colors {currentUnit?.id ===
                        unit.id
                          ? 'bg-accent'
                          : ''}"
                        on:click={() => selectUnit(unit.id)}
                      >
                        <div class="flex items-center space-x-2">
                          <StatusIcon
                            class="w-4 h-4 {getStatusColor(status)}"
                          />
                          <span class="text-sm font-medium flex-1">
                            {unit.title}
                          </span>
                          <span class="text-xs text-muted-foreground">
                            {unit.content?.length || 0} items
                          </span>
                        </div>
                      </button>
                    {/each}
                  </div>
                {/if}
              </Card>
            {/each}
          </div>

          <!-- Progress Summary -->
          <Card class="p-4 mt-6">
            <h3 class="font-medium text-foreground mb-3">Your Progress</h3>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Completed Units:</span>
                <span class="font-medium"
                  >{userProgress.filter((p) => p.status === "done")
                    .length}</span
                >
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">In Progress:</span>
                <span class="font-medium"
                  >{userProgress.filter((p) => p.status === "in_progress")
                    .length}</span
                >
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Total Modules:</span>
                <span class="font-medium">{modules.length}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col">
        {#if !currentModule}
          <!-- Welcome Screen -->
          <div class="flex-1 flex items-center justify-center p-8">
            <div class="text-center max-w-md">
              <BookOpen class="w-16 h-16 text-primary mx-auto mb-6" />
              <h2 class="text-2xl font-bold text-foreground mb-4">
                Welcome to Your Learning Journey
              </h2>
              <p class="text-muted-foreground mb-6">
                Select a module from the sidebar to begin learning. Track your
                progress and unlock new content as you advance.
              </p>
              {#if modules.length > 0}
                <Button on:click={() => selectModule(modules[0].id)}>
                  <Play class="w-4 h-4 mr-2" />
                  Start Learning
                </Button>
              {/if}
            </div>
          </div>
        {:else if !currentUnit}
          <!-- Module Overview -->
          <div class="flex-1 p-8">
            <div class="max-w-4xl mx-auto">
              <!-- Module Header -->
              <div class="mb-8">
                <div class="flex items-center space-x-4 mb-4">
                  <div
                    class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center"
                  >
                    <BookOpen class="w-8 h-8 text-primary" />
                  </div>
                  <div class="flex-1">
                    <h1 class="text-3xl font-bold text-foreground mb-2">
                      {currentModule.title}
                    </h1>
                    <div
                      class="flex items-center space-x-4 text-sm text-muted-foreground"
                    >
                      <span>{currentModule.units.length} units</span>
                      <span>{getModuleProgress(currentModule)}% complete</span>
                      <span>Updated {formatDate(currentModule.updated_at)}</span
                      >
                    </div>
                  </div>
                </div>

                {#if currentModule.description}
                  <p class="text-lg text-muted-foreground leading-relaxed">
                    {currentModule.description}
                  </p>
                {/if}

                <!-- Progress Bar -->
                <div class="mt-6">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium">Module Progress</span>
                    <span class="text-sm text-muted-foreground"
                      >{getModuleProgress(currentModule)}%</span
                    >
                  </div>
                  <div class="w-full bg-muted rounded-full h-3">
                    <div
                      class="bg-primary rounded-full h-3 transition-all duration-500"
                      style="width: {getModuleProgress(currentModule)}%"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- Unit Grid -->
              <div class="grid gap-6">
                <h2 class="text-xl font-semibold text-foreground">
                  Learning Units
                </h2>

                {#each currentModule.units as unit, index (unit.id)}
                  {@const status = getUnitProgress(unit.id)}
                  {@const StatusIcon = getStatusIcon(status)}
                  {@const isLocked =
                    index > 0 &&
                    getUnitProgress(currentModule.units[index - 1].id) !==
                      "done"}

                  <Card
                    class="p-6 {isLocked
                      ? 'opacity-60'
                      : 'hover:shadow-md cursor-pointer'} transition-all"
                  >
                    <button
                      class="w-full text-left"
                      on:click={() => !isLocked && selectUnit(unit.id)}
                      disabled={isLocked}
                    >
                      <div class="flex items-start space-x-4">
                        <div
                          class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0"
                        >
                          {#if isLocked}
                            <Lock class="w-6 h-6 text-muted-foreground" />
                          {:else}
                            <StatusIcon
                              class="w-6 h-6 {getStatusColor(status)}"
                            />
                          {/if}
                        </div>

                        <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between mb-2">
                            <h3 class="font-semibold text-foreground">
                              Unit {index + 1}: {unit.title}
                            </h3>
                            {#if !isLocked}
                              <ArrowRight
                                class="w-5 h-5 text-muted-foreground"
                              />
                            {/if}
                          </div>

                          {#if unit.description}
                            <p class="text-muted-foreground mb-3 line-clamp-2">
                              {unit.description}
                            </p>
                          {/if}

                          <div
                            class="flex items-center space-x-4 text-sm text-muted-foreground"
                          >
                            <span class="flex items-center">
                              <FileText class="w-4 h-4 mr-1" />
                              {unit.content?.length || 0} content items
                            </span>
                            <span class="flex items-center">
                              <Clock class="w-4 h-4 mr-1" />
                              {formatTime(15)} estimated
                            </span>
                            {#if status === "done"}
                              <span class="flex items-center text-green-600">
                                <CheckCircle class="w-4 h-4 mr-1" />
                                Completed
                              </span>
                            {:else if status === "in_progress"}
                              <span class="flex items-center text-blue-600">
                                <Clock class="w-4 h-4 mr-1" />
                                In Progress
                              </span>
                            {/if}
                          </div>

                          {#if isLocked}
                            <div class="mt-3 text-sm text-muted-foreground">
                              Complete the previous unit to unlock
                            </div>
                          {/if}
                        </div>
                      </div>
                    </button>
                  </Card>
                {/each}
              </div>
            </div>
          </div>
        {:else if contentLoading}
          <div class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <div
                class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"
              ></div>
              <p class="text-muted-foreground">Loading content...</p>
            </div>
          </div>
        {:else}
          <!-- Unit Content View -->
          <div class="flex-1 flex flex-col">
            <!-- Unit Header -->
            <div class="border-b border-border p-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    on:click={() => {
                      currentUnit = null;
                      currentContent = null;
                    }}
                  >
                    <ArrowLeft class="w-4 h-4 mr-2" />
                    Back to Module
                  </Button>
                  <div>
                    <h1 class="text-xl font-semibold text-foreground">
                      {currentUnit.title}
                    </h1>
                    <p class="text-sm text-muted-foreground">
                      {currentModule.title}
                    </p>
                  </div>
                </div>

                <div class="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    on:click={() => (chatOpen = true)}
                  >
                    <Bot class="w-4 h-4 mr-2" />
                    Ask AI
                  </Button>

                  {#if getUnitProgress(currentUnit.id) !== "done"}
                    <Button
                      size="sm"
                      on:click={() => markUnitComplete(currentUnit.id)}
                    >
                      <CheckCircle class="w-4 h-4 mr-2" />
                      Mark Complete
                    </Button>
                  {:else}
                    <Button variant="outline" size="sm" disabled>
                      <CheckCircle class="w-4 h-4 mr-2" />
                      Completed
                    </Button>
                  {/if}
                </div>
              </div>
            </div>

            <!-- Content Display -->
            <div class="flex-1 p-8">
              {#if currentContent}
                <div class="max-w-4xl mx-auto">
                  <Card class="p-8">
                    <div class="flex items-center space-x-3 mb-6">
                      <svelte:component
                        this={getContentTypeIcon(currentContent.content_type)}
                        class="w-6 h-6 text-primary"
                      />
                      <h2 class="text-2xl font-semibold text-foreground">
                        {currentContent.title}
                      </h2>
                    </div>

                    {#if currentContent.content_type === "video"}
                      <div
                        class="aspect-video bg-muted rounded-lg flex items-center justify-center mb-6"
                      >
                        <div class="text-center">
                          <Video
                            class="w-16 h-16 text-muted-foreground mx-auto mb-4"
                          />
                          <p class="text-muted-foreground">
                            Video content would be displayed here
                          </p>
                          {#if currentContent.file_url}
                            <Button variant="outline" class="mt-4">
                              <Play class="w-4 h-4 mr-2" />
                              Play Video
                            </Button>
                          {/if}
                        </div>
                      </div>
                    {:else if currentContent.content_type === "document"}
                      <div
                        class="prose prose-gray dark:prose-invert max-w-none"
                      >
                        <p class="text-lg leading-relaxed">
                          This is sample learning content. In a real
                          implementation, this would display the actual lesson
                          content from the database.
                        </p>

                        <h3>Key Learning Objectives</h3>
                        <ul>
                          <li>Understand the fundamental concepts</li>
                          <li>Apply knowledge through practical examples</li>
                          <li>Complete hands-on exercises</li>
                          <li>Demonstrate mastery of the topic</li>
                        </ul>

                        <h3>Content Overview</h3>
                        <p>
                          This unit covers important material that builds upon
                          previous lessons. Take your time to absorb the
                          information and don't hesitate to ask questions using
                          the AI assistant.
                        </p>

                        <blockquote>
                          <p>
                            Remember: Learning is a journey, not a destination.
                            Take breaks when needed and celebrate your progress!
                          </p>
                        </blockquote>
                      </div>
                    {/if}

                    <!-- Navigation -->
                    <div
                      class="flex justify-between mt-8 pt-6 border-t border-border"
                    >
                      <Button variant="outline">
                        <ArrowLeft class="w-4 h-4 mr-2" />
                        Previous Content
                      </Button>

                      <Button variant="outline">
                        Next Content
                        <ArrowRight class="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </Card>
                </div>
              {:else}
                <div class="text-center py-12">
                  <FileText
                    class="w-16 h-16 text-muted-foreground mx-auto mb-4"
                  />
                  <h3 class="text-lg font-semibold text-foreground mb-2">
                    No Content Available
                  </h3>
                  <p class="text-muted-foreground">
                    This unit doesn't have any content yet. Check back later or
                    contact your instructor.
                  </p>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- AI Chat Overlay -->
{#if chatOpen}
  <div class="fixed inset-0 bg-black/50 z-50 flex items-end justify-end p-6">
    <Card class="w-96 h-96 p-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-foreground">AI Learning Assistant</h3>
        <Button variant="ghost" size="sm" on:click={() => (chatOpen = false)}
          >×</Button
        >
      </div>

      <div class="text-center py-12 text-muted-foreground">
        <Bot class="w-12 h-12 mx-auto mb-4" />
        <p>AI chat functionality would be integrated here</p>
        <p class="text-sm">Connected to your learning context</p>
      </div>
    </Card>
  </div>
{/if}
