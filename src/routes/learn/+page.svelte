<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { authStore } from "$lib/stores/auth";
  import { modulesStore, loadModules } from "$lib/stores/modules";
  import { unitsStore, loadUnits } from "$lib/stores/units";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import {
    BookOpen,
    Play,
    CheckCircle,
    Clock,
    ChevronRight,
    ArrowLeft,
    ArrowRight,
    MessageCircle,
    FileText,
    Video,
    Headphones,
    Link as LinkIcon,
    Star,
    BarChart3,
    Loader2,
  } from "lucide-svelte";

  let selectedModuleId = "";
  let selectedUnitId = "";
  let currentContent: any = null;
  let showChat = false;
  let progress = 0;

  // Mock content data (would come from content store)
  let mockContent = [
    {
      id: "content-1",
      unit_id: "unit-1",
      title: "Introduction to Spanish Grammar",
      type: "text",
      content: `
# Introduction to Spanish Grammar

Welcome to your Spanish learning journey! In this lesson, we'll cover the fundamental concepts of Spanish grammar.

## Basic Sentence Structure

Spanish follows a Subject-Verb-Object (SVO) structure, similar to English:

- **Yo** (I) **hablo** (speak) **español** (Spanish)
- **Tú** (You) **estudias** (study) **gramática** (grammar)

## Nouns and Articles

Spanish nouns have gender (masculine/feminine) and number (singular/plural):

### Masculine nouns:
- el libro (the book)
- los libros (the books)

### Feminine nouns:
- la mesa (the table) 
- las mesas (the tables)

## Practice Exercise

Try translating these simple sentences:
1. The boy speaks Spanish
2. The girls study grammar
3. I have a book

*Continue practicing with our interactive exercises...*
      `,
      estimated_duration: 15,
      order_index: 1,
      is_published: true,
      completed: false,
    },
    {
      id: "content-2",
      unit_id: "unit-1",
      title: "Spanish Pronunciation Guide",
      type: "video",
      content:
        "Learn proper Spanish pronunciation with this comprehensive video guide.",
      video_url: "https://example.com/spanish-pronunciation.mp4",
      estimated_duration: 20,
      order_index: 2,
      is_published: true,
      completed: false,
    },
    {
      id: "content-3",
      unit_id: "unit-1",
      title: "Listening Practice: Basic Conversations",
      type: "audio",
      content:
        "Practice your listening skills with real Spanish conversations.",
      audio_url: "https://example.com/spanish-conversations.mp3",
      estimated_duration: 10,
      order_index: 3,
      is_published: true,
      completed: true,
    },
  ];

  $: user = $authStore.user;
  $: moduleState = $modulesStore;
  $: unitState = $unitsStore;
  $: modules = moduleState.modules.filter((m) => m.is_published);
  $: units = unitState.units.filter((u) => u.is_published);

  // Get URL parameters for direct links
  $: urlModuleId = $page.url.searchParams.get("module");
  $: urlUnitId = $page.url.searchParams.get("unit");
  $: urlContentId = $page.url.searchParams.get("content");

  onMount(async () => {
    await Promise.all([loadModules(), loadUnits()]);

    // Auto-select from URL parameters
    if (urlModuleId) {
      selectedModuleId = urlModuleId;
    }
    if (urlUnitId) {
      selectedUnitId = urlUnitId;
    }
    if (urlContentId) {
      const content = mockContent.find((c) => c.id === urlContentId);
      if (content) {
        currentContent = content;
      }
    }

    // Auto-select first module if none selected
    if (!selectedModuleId && modules.length > 0) {
      selectedModuleId = modules[0].id;
    }
  });

  $: selectedModule = modules.find((m) => m.id === selectedModuleId);
  $: moduleUnits = units.filter((u) => u.module_id === selectedModuleId);
  $: selectedUnit = units.find((u) => u.id === selectedUnitId);
  $: unitContent = mockContent.filter((c) => c.unit_id === selectedUnitId);

  function selectModule(moduleId: string) {
    selectedModuleId = moduleId;
    selectedUnitId = "";
    currentContent = null;
    updateURL();
  }

  function selectUnit(unitId: string) {
    selectedUnitId = unitId;
    currentContent = null;
    updateURL();
  }

  function selectContent(content: any) {
    currentContent = content;
    updateURL();
  }

  function updateURL() {
    const params = new URLSearchParams();
    if (selectedModuleId) params.set("module", selectedModuleId);
    if (selectedUnitId) params.set("unit", selectedUnitId);
    if (currentContent) params.set("content", currentContent.id);

    const url = `/learn${params.toString() ? "?" + params.toString() : ""}`;
    window.history.replaceState({}, "", url);
  }

  function markContentComplete(contentId: string) {
    const content = mockContent.find((c) => c.id === contentId);
    if (content) {
      content.completed = !content.completed;
      mockContent = [...mockContent]; // Trigger reactivity
      calculateProgress();
    }
  }

  function calculateProgress() {
    const totalContent = unitContent.length;
    const completedContent = unitContent.filter((c) => c.completed).length;
    progress =
      totalContent > 0
        ? Math.round((completedContent / totalContent) * 100)
        : 0;
  }

  function getNextContent() {
    if (!currentContent || !unitContent.length) return null;
    const currentIndex = unitContent.findIndex(
      (c) => c.id === currentContent.id
    );
    return currentIndex < unitContent.length - 1
      ? unitContent[currentIndex + 1]
      : null;
  }

  function getPreviousContent() {
    if (!currentContent || !unitContent.length) return null;
    const currentIndex = unitContent.findIndex(
      (c) => c.id === currentContent.id
    );
    return currentIndex > 0 ? unitContent[currentIndex - 1] : null;
  }

  function getContentIcon(type: string) {
    switch (type) {
      case "video":
        return Video;
      case "audio":
        return Headphones;
      case "link":
        return LinkIcon;
      default:
        return FileText;
    }
  }

  function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  // Recalculate progress when unit changes
  $: if (selectedUnitId) {
    calculateProgress();
  }
</script>

<svelte:head>
  <title>Learn - BigStepLabs</title>
  <meta
    name="description"
    content="Access your learning materials and track your progress"
  />
</svelte:head>

<div class="min-h-screen bg-background">
  {#if moduleState.loading || unitState.loading}
    <div class="flex items-center justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
      <span class="ml-2 text-muted-foreground">Loading your courses...</span>
    </div>
  {:else}
    <div class="flex">
      <!-- Sidebar Navigation -->
      <div
        class="w-80 border-r border-border bg-muted/10 h-screen sticky top-0 overflow-y-auto"
      >
        <div class="p-6">
          <h1 class="text-2xl font-bold text-foreground mb-6 flex items-center">
            <BookOpen class="w-6 h-6 mr-2 text-primary" />
            My Learning
          </h1>

          <!-- Modules List -->
          <div class="space-y-4">
            {#each modules as module (module.id)}
              <div class="space-y-2">
                <button
                  class="w-full text-left p-3 rounded-lg transition-colors {selectedModuleId ===
                  module.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'}"
                  on:click={() => selectModule(module.id)}
                >
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold">{module.title}</h3>
                    <ChevronRight
                      class="w-4 h-4 {selectedModuleId === module.id
                        ? 'rotate-90'
                        : ''} transition-transform"
                    />
                  </div>
                  {#if module.description}
                    <p class="text-sm opacity-80 mt-1">{module.description}</p>
                  {/if}
                </button>

                <!-- Units for selected module -->
                {#if selectedModuleId === module.id}
                  <div class="ml-4 space-y-1">
                    {#each moduleUnits as unit (unit.id)}
                      <button
                        class="w-full text-left p-2 rounded-md text-sm transition-colors {selectedUnitId ===
                        unit.id
                          ? 'bg-secondary'
                          : 'hover:bg-accent/50'}"
                        on:click={() => selectUnit(unit.id)}
                      >
                        <div class="flex items-center justify-between">
                          <span class="font-medium">{unit.title}</span>
                          {#if selectedUnitId === unit.id && progress > 0}
                            <div
                              class="flex items-center text-xs text-muted-foreground"
                            >
                              <BarChart3 class="w-3 h-3 mr-1" />
                              {progress}%
                            </div>
                          {/if}
                        </div>
                        {#if unit.estimated_duration_minutes}
                          <div
                            class="flex items-center text-xs text-muted-foreground mt-1"
                          >
                            <Clock class="w-3 h-3 mr-1" />
                            {formatDuration(unit.estimated_duration_minutes)}
                          </div>
                        {/if}
                      </button>
                    {/each}

                    {#if moduleUnits.length === 0}
                      <p class="text-sm text-muted-foreground ml-2">
                        No units available
                      </p>
                    {/if}
                  </div>
                {/if}
              </div>
            {/each}

            {#if modules.length === 0}
              <div class="text-center py-8">
                <BookOpen
                  class="w-12 h-12 text-muted-foreground mx-auto mb-3"
                />
                <p class="text-muted-foreground">No courses available yet</p>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1">
        {#if !selectedModuleId}
          <!-- Welcome Screen -->
          <div class="p-8">
            <div class="max-w-3xl mx-auto text-center py-12">
              <BookOpen class="w-16 h-16 text-primary mx-auto mb-6" />
              <h2 class="text-3xl font-bold text-foreground mb-4">
                Welcome to Your Learning Journey!
              </h2>
              <p class="text-xl text-muted-foreground mb-8">
                Select a course from the sidebar to begin learning.
              </p>

              {#if modules.length > 0}
                <Button size="lg" on:click={() => selectModule(modules[0].id)}>
                  <Play class="w-5 h-5 mr-2" />
                  Start Learning
                </Button>
              {/if}
            </div>
          </div>
        {:else if !selectedUnitId}
          <!-- Module Overview -->
          <div class="p-8">
            <div class="max-w-4xl mx-auto">
              <div class="mb-8">
                <h1 class="text-3xl font-bold text-foreground mb-4">
                  {selectedModule?.title}
                </h1>
                {#if selectedModule?.description}
                  <p class="text-lg text-muted-foreground">
                    {selectedModule.description}
                  </p>
                {/if}
              </div>

              <!-- Units Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                {#each moduleUnits as unit (unit.id)}
                  <Card
                    class="p-6 hover:shadow-md transition-shadow cursor-pointer"
                    on:click={() => selectUnit(unit.id)}
                  >
                    <div class="flex items-start justify-between mb-4">
                      <h3 class="text-xl font-semibold text-foreground">
                        {unit.title}
                      </h3>
                      <div
                        class="flex items-center text-sm text-muted-foreground"
                      >
                        <Clock class="w-4 h-4 mr-1" />
                        {formatDuration(unit.estimated_duration_minutes || 30)}
                      </div>
                    </div>

                    {#if unit.description}
                      <p class="text-muted-foreground mb-4">
                        {unit.description}
                      </p>
                    {/if}

                    <!-- Mock progress indicators -->
                    <div class="flex items-center justify-between">
                      <div
                        class="flex items-center text-sm text-muted-foreground"
                      >
                        <FileText class="w-4 h-4 mr-1" />
                        {mockContent.filter((c) => c.unit_id === unit.id)
                          .length} lessons
                      </div>
                      <Button variant="outline" size="sm">
                        Start Unit
                        <ChevronRight class="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </Card>
                {/each}
              </div>

              {#if moduleUnits.length === 0}
                <Card class="p-12 text-center">
                  <FileText
                    class="w-16 h-16 text-muted-foreground mx-auto mb-4"
                  />
                  <h3 class="text-xl font-semibold mb-2">No Units Available</h3>
                  <p class="text-muted-foreground">
                    This course doesn't have any units yet. Check back later!
                  </p>
                </Card>
              {/if}
            </div>
          </div>
        {:else if !currentContent}
          <!-- Unit Content List -->
          <div class="p-8">
            <div class="max-w-4xl mx-auto">
              <!-- Unit Header -->
              <div class="mb-8">
                <div
                  class="flex items-center text-sm text-muted-foreground mb-2"
                >
                  <button
                    class="hover:text-foreground"
                    on:click={() => selectUnit("")}
                  >
                    {selectedModule?.title}
                  </button>
                  <ChevronRight class="w-4 h-4 mx-1" />
                  <span>{selectedUnit?.title}</span>
                </div>

                <h1 class="text-3xl font-bold text-foreground mb-4">
                  {selectedUnit?.title}
                </h1>
                {#if selectedUnit?.description}
                  <p class="text-lg text-muted-foreground mb-4">
                    {selectedUnit.description}
                  </p>
                {/if}

                <!-- Progress Bar -->
                {#if unitContent.length > 0}
                  <div class="bg-muted rounded-full h-2 mb-2">
                    <div
                      class="bg-primary h-2 rounded-full transition-all duration-300"
                      style="width: {progress}%"
                    ></div>
                  </div>
                  <p class="text-sm text-muted-foreground">
                    {unitContent.filter((c) => c.completed).length} of {unitContent.length}
                    lessons completed ({progress}%)
                  </p>
                {/if}
              </div>

              <!-- Content List -->
              <div class="space-y-4">
                {#each unitContent as content, index (content.id)}
                  {@const ContentIcon = getContentIcon(content.type)}
                  <Card
                    class="p-6 hover:shadow-md transition-shadow cursor-pointer {content.completed
                      ? 'border-green-200 bg-green-50/50 dark:bg-green-900/10'
                      : ''}"
                    on:click={() => selectContent(content)}
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-4">
                        <div class="flex items-center space-x-3">
                          <div
                            class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center"
                          >
                            <ContentIcon class="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <h3
                              class="font-semibold text-foreground flex items-center"
                            >
                              {content.title}
                              {#if content.completed}
                                <CheckCircle
                                  class="w-4 h-4 ml-2 text-green-600"
                                />
                              {/if}
                            </h3>
                            <div
                              class="flex items-center text-sm text-muted-foreground"
                            >
                              <Clock class="w-3 h-3 mr-1" />
                              {content.estimated_duration} min
                              <span class="mx-2">•</span>
                              <span class="capitalize">{content.type}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center space-x-2">
                        <Button
                          variant={content.completed ? "outline" : "default"}
                          size="sm"
                          on:click={(e) => {
                            e.stopPropagation();
                            markContentComplete(content.id);
                          }}
                        >
                          {content.completed ? "Completed" : "Mark Complete"}
                        </Button>
                        <ChevronRight class="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Card>
                {/each}
              </div>

              {#if unitContent.length === 0}
                <Card class="p-12 text-center">
                  <FileText
                    class="w-16 h-16 text-muted-foreground mx-auto mb-4"
                  />
                  <h3 class="text-xl font-semibold mb-2">
                    No Content Available
                  </h3>
                  <p class="text-muted-foreground">
                    This unit doesn't have any content yet. Check back later!
                  </p>
                </Card>
              {/if}
            </div>
          </div>
        {:else}
          <!-- Content Viewer -->
          <div class="flex flex-col h-screen">
            <!-- Content Header -->
            <div
              class="border-b border-border p-4 bg-background/95 backdrop-blur"
            >
              <div class="max-w-4xl mx-auto flex items-center justify-between">
                <div>
                  <div
                    class="flex items-center text-sm text-muted-foreground mb-1"
                  >
                    <button
                      class="hover:text-foreground"
                      on:click={() => (currentContent = null)}
                    >
                      {selectedUnit?.title}
                    </button>
                    <ChevronRight class="w-4 h-4 mx-1" />
                    <span>{currentContent.title}</span>
                  </div>
                  <h1 class="text-xl font-semibold text-foreground">
                    {currentContent.title}
                  </h1>
                </div>

                <div class="flex items-center space-x-2">
                  <Button
                    variant={currentContent.completed ? "outline" : "default"}
                    size="sm"
                    on:click={() => markContentComplete(currentContent.id)}
                  >
                    {#if currentContent.completed}
                      <CheckCircle class="w-4 h-4 mr-2" />
                      Completed
                    {:else}
                      Mark Complete
                    {/if}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    on:click={() => (showChat = !showChat)}
                  >
                    <MessageCircle class="w-4 h-4 mr-2" />
                    AI Assistant
                  </Button>
                </div>
              </div>
            </div>

            <!-- Content Body -->
            <div class="flex-1 overflow-hidden">
              <div class="flex h-full">
                <!-- Main Content -->
                <div class="flex-1 overflow-y-auto">
                  <div class="max-w-4xl mx-auto p-8">
                    {#if currentContent.type === "text"}
                      <div class="prose prose-lg dark:prose-invert max-w-none">
                        {@html currentContent.content.replace(/\n/g, "<br>")}
                      </div>
                    {:else if currentContent.type === "video"}
                      <div class="space-y-6">
                        <div
                          class="aspect-video bg-muted rounded-lg flex items-center justify-center"
                        >
                          <div class="text-center">
                            <Video
                              class="w-12 h-12 text-muted-foreground mx-auto mb-4"
                            />
                            <p class="text-muted-foreground">
                              Video content would be displayed here
                            </p>
                            <p class="text-sm text-muted-foreground mt-2">
                              URL: {currentContent.video_url}
                            </p>
                          </div>
                        </div>
                        <div class="prose dark:prose-invert">
                          <p>{currentContent.content}</p>
                        </div>
                      </div>
                    {:else if currentContent.type === "audio"}
                      <div class="space-y-6">
                        <div class="bg-muted rounded-lg p-8 text-center">
                          <Headphones
                            class="w-12 h-12 text-muted-foreground mx-auto mb-4"
                          />
                          <p class="text-muted-foreground">
                            Audio content would be displayed here
                          </p>
                          <p class="text-sm text-muted-foreground mt-2">
                            URL: {currentContent.audio_url}
                          </p>
                        </div>
                        <div class="prose dark:prose-invert">
                          <p>{currentContent.content}</p>
                        </div>
                      </div>
                    {/if}
                  </div>
                </div>

                <!-- AI Chat Sidebar -->
                {#if showChat}
                  <div class="w-96 border-l border-border bg-muted/10 p-4">
                    <div class="mb-4">
                      <h3 class="font-semibold flex items-center">
                        <MessageCircle class="w-4 h-4 mr-2" />
                        AI Learning Assistant
                      </h3>
                      <p class="text-sm text-muted-foreground mt-1">
                        Ask questions about this content
                      </p>
                    </div>

                    <div class="space-y-4">
                      <div class="bg-background rounded-lg p-3 border">
                        <p class="text-sm">
                          Hi! I'm here to help you understand this content
                          better. Feel free to ask me any questions about what
                          you're learning!
                        </p>
                      </div>

                      <div class="space-y-2">
                        <input
                          type="text"
                          placeholder="Ask a question..."
                          class="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                        />
                        <Button size="sm" class="w-full">Send Question</Button>
                      </div>
                    </div>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Content Navigation -->
            <div
              class="border-t border-border p-4 bg-background/95 backdrop-blur"
            >
              <div class="max-w-4xl mx-auto flex items-center justify-between">
                <div>
                  {#if getPreviousContent()}
                    <Button
                      variant="outline"
                      on:click={() => selectContent(getPreviousContent())}
                    >
                      <ArrowLeft class="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                  {:else}
                    <div class="w-20"></div>
                  {/if}
                </div>

                <div class="flex items-center space-x-2">
                  <div class="text-sm text-muted-foreground">
                    {unitContent.findIndex((c) => c.id === currentContent.id) +
                      1} of {unitContent.length}
                  </div>
                </div>

                <div>
                  {#if getNextContent()}
                    <Button on:click={() => selectContent(getNextContent())}>
                      Next
                      <ArrowRight class="w-4 h-4 ml-2" />
                    </Button>
                  {:else}
                    <Button
                      variant="outline"
                      on:click={() => (currentContent = null)}
                    >
                      <CheckCircle class="w-4 h-4 mr-2" />
                      Complete Unit
                    </Button>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
