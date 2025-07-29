<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { authStore, canManageContent } from "$lib/stores/auth";
  import { getLessonById } from "$lib/stores/lessons";
  import type { LessonWithRelations } from "$lib/types/database";

  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import LoadingOptimizer from "$lib/components/ui/loading-optimizer.svelte";
  import {
    ArrowLeft,
    ExternalLink,
    Edit,
    Trash2,
    Loader2,
    AlertCircle,
    CheckCircle,
    Eye,
  } from "lucide-svelte";

  let lesson: LessonWithRelations | null = null;
  let loading = true;
  let error: string | null = null;

  $: lessonId = $page.params.id;
  $: user = $authStore.user;
  $: canManage = $canManageContent;

  async function loadLesson() {
    if (!lessonId) return;

    loading = true;
    error = null;

    try {
      console.log("🔍 Loading lesson:", lessonId);
      lesson = await getLessonById(lessonId);

      if (!lesson) {
        error = "Lesson not found";
        return;
      }

      // Initialize embed after lesson is loaded
      console.log("Loading lesson:", lesson.title);
      console.log("Getting lesson by ID:", lesson.id);
      console.log("Retrieved lesson:", lesson);

      // Check if we have a stored embed URL - if so, use it directly
      if (lesson.embed_url) {
        console.log("✅ Using stored embed URL directly:", lesson.embed_url);
        // Don't set loading state - let iframe load naturally
        embedLoading = false;
        embedError = false;
      } else {
        // Only try automatic embed if no stored embed_url
        const embedUrl = getCurrentEmbedUrl();
        if (embedUrl) {
          embedLoading = false;
          embedError = false;
        } else {
          // If automatic embed fails, show manual embed option
          embedError = true;
        }
      }

      // Log lesson view for analytics (stub for future implementation)
      console.log("📊 Lesson viewed:", {
        lessonId: lesson.id,
        title: lesson.title,
        userId: user?.id,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("❌ Error loading lesson:", err);
      error = "Failed to load lesson";
    } finally {
      loading = false;
    }
  }

  function getModuleName(moduleId: string | null): string {
    if (!moduleId) return "No Module";
    return lesson?.module?.title || "Unknown Module";
  }

  function getUnitName(unitId: string | null): string {
    if (!unitId) return "No Unit";
    return lesson?.unit?.title || "Unknown Unit";
  }

  function openNotionInNewTab() {
    if (lesson?.notion_url) {
      // Fix the URL if it has formatting issues
      const fixedUrl = lesson.notion_url.replace(/\s+/g, "_");
      window.open(fixedUrl, "_blank", "noopener,noreferrer");
    }
  }

  function getNotionEmbedUrl(url: string): string | null {
    const cleanUrl = url.replace(/\s+/g, "_").split("?")[0];
    // Extract the page ID from the URL and create embed URL
    const pageIdMatch = cleanUrl.match(/\/([a-f0-9]{32})/);
    if (pageIdMatch) {
      const pageId = pageIdMatch[1];
      console.log("🔍 Extracted page ID:", pageId);
      return `https://bigstep-idiomas.notion.site/ebd/${pageId}`;
    }
    console.log("❌ Could not extract page ID from URL:", cleanUrl);
    return null; // Return null instead of the original URL to indicate failure
  }

  function getNotionPublicEmbedUrl(notionUrl: string): string {
    // Try different embed formats for Notion
    let embedUrl = notionUrl.replace(/\s+/g, "_");

    // Method 1: Standard embed
    const baseUrl = embedUrl.split("?")[0];
    return `${baseUrl}?embed=true`;
  }

  let embedLoading = false;
  let embedError = false;
  let showManualEmbed = false;
  let manualEmbedUrl = "";
  let embedTimeout: ReturnType<typeof setTimeout> | null = null;

  function handleEmbedLoad() {
    console.log("✅ Embed loaded successfully");
    if (embedTimeout) clearTimeout(embedTimeout);
    embedLoading = false;
    embedError = false;
  }

  function handleEmbedError() {
    console.error("❌ Failed to load Notion embed");
    if (embedTimeout) clearTimeout(embedTimeout);
    embedLoading = false;
    embedError = true;
  }

  function getCurrentEmbedUrl() {
    if (!lesson) return "";

    // If lesson has a stored embed_url, use it directly (skip automatic extraction)
    if (lesson.embed_url) {
      console.log("🔗 Using stored embed URL directly:", lesson.embed_url);
      return lesson.embed_url;
    }

    // Only try automatic extraction if no stored embed_url
    const embedUrl = getNotionEmbedUrl(lesson.notion_url);
    if (embedUrl) {
      console.log("🔗 Using automatic embed URL:", embedUrl);
      return embedUrl;
    }

    // If automatic method fails, return null to trigger manual embed
    console.log("❌ Automatic embed failed, prompting for manual embed");
    return null;
  }

  function useManualEmbed() {
    showManualEmbed = true;
    embedLoading = false;
    embedError = false;
  }

  function applyManualEmbed() {
    if (manualEmbedUrl) {
      // Extract the URL from the iframe src attribute if user pasted the full iframe code
      let embedUrl = manualEmbedUrl;

      // If user pasted the full iframe code, extract just the src URL
      const srcMatch = manualEmbedUrl.match(/src="([^"]+)"/);
      if (srcMatch) {
        embedUrl = srcMatch[1];
      }

      // Clean up the URL
      embedUrl = embedUrl.trim();

      console.log("🔧 Applying manual embed URL:", embedUrl);

      manualEmbedUrl = embedUrl;
      showManualEmbed = false;
      embedLoading = true;
      embedError = false;
      startEmbedTimeout();
    }
  }

  function startEmbedTimeout() {
    if (embedTimeout) clearTimeout(embedTimeout);
    embedTimeout = setTimeout(() => {
      console.warn("Embed timeout after 30 seconds");
      embedLoading = false;
      embedError = true;
    }, 30000); // Increased from 10 to 30 seconds
  }

  // Start timeout when component loads
  onMount(() => {
    if (lessonId) {
      loadLesson();
    }
  });
</script>

<svelte:head>
  <title>{lesson?.title || "Loading..."} - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-4">
      <a
        href="/lessons"
        class="flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft class="w-4 h-4" />
        Back to Lessons
      </a>
    </div>

    {#if lesson && canManage}
      <div class="flex items-center gap-2">
        <a href="/lessons/{lesson.id}/edit">
          <Button variant="outline" size="sm">
            <Edit class="w-4 h-4 mr-2" />
            Edit
          </Button>
        </a>
        <Button variant="outline" size="sm" on:click={openNotionInNewTab}>
          <ExternalLink class="w-4 h-4 mr-2" />
          Open in Notion
        </Button>
      </div>
    {/if}
  </div>

  <LoadingOptimizer>
    {#if loading}
      <div class="flex items-center justify-center p-8">
        <Loader2 class="w-6 h-6 animate-spin mr-2" />
        Loading lesson...
      </div>
    {:else if error}
      <Card class="p-6">
        <div class="flex items-center text-destructive">
          <AlertCircle class="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      </Card>
    {:else if lesson}
      <!-- Lesson Info -->
      <Card class="mb-6">
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h1 class="text-3xl font-bold mb-2">{lesson.title}</h1>
              <div
                class="flex items-center gap-4 text-sm text-muted-foreground mb-4"
              >
                <span>{getModuleName(lesson.module_id)}</span>
                {#if lesson.unit_id}
                  <span>•</span>
                  <span>{getUnitName(lesson.unit_id)}</span>
                {/if}
                <span>•</span>
                <span
                  >Created {new Date(
                    lesson.created_at
                  ).toLocaleDateString()}</span
                >
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
          </div>

          {#if lesson.content_type && Object.keys(lesson.content_type).length > 0}
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Content types:</span>
              {#each Object.keys(lesson.content_type) as contentType}
                <span class="px-2 py-1 bg-accent rounded text-xs"
                  >{contentType}</span
                >
              {/each}
            </div>
          {/if}
        </div>
      </Card>

      <!-- Notion Embed -->
      <Card class="mb-6">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold">Lesson Content</h2>
            <Button variant="outline" size="sm" on:click={openNotionInNewTab}>
              <ExternalLink class="w-4 h-4 mr-2" />
              Open in Notion
            </Button>
          </div>

          <div class="border rounded-lg overflow-hidden">
            {#if embedLoading}
              <div class="flex items-center justify-center p-8">
                <div
                  class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"
                ></div>
                <div>
                  <span>Loading Notion content...</span>
                  <div class="text-xs text-muted-foreground mt-1">
                    Method 1 of 1
                  </div>
                </div>
              </div>
            {:else if embedError && !lesson.embed_url}
              <div class="p-6 text-center">
                <div class="mb-4">
                  <svg
                    class="w-12 h-12 text-muted-foreground mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                  </svg>
                  <h3 class="text-lg font-semibold mb-2">
                    Manual Embed Required
                  </h3>
                  <p class="text-sm text-muted-foreground mb-4">
                    Please use the manual embed option below to paste the Notion
                    embed URL.
                  </p>
                </div>
                <div class="flex gap-2 justify-center">
                  <Button variant="default" on:click={useManualEmbed}>
                    Use Manual Embed
                  </Button>
                  <Button variant="outline" on:click={openNotionInNewTab}>
                    <ExternalLink class="w-4 h-4 mr-2" />
                    Open in Notion
                  </Button>
                </div>
              </div>
            {:else}
              <iframe
                src={getCurrentEmbedUrl()}
                style="width: 100%; height: 80vh; border: none;"
                title={lesson.title}
                loading="eager"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
                allow="fullscreen"
                referrerpolicy="no-referrer"
              />
            {/if}
          </div>

          <!-- Manual Embed Input -->
          {#if showManualEmbed}
            <div
              class="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
            >
              <h4
                class="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2"
              >
                🔧 Manual Embed URL
              </h4>
              <p class="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                Paste the embed URL from Notion's "Embed this page" dialog:
              </p>
              <div class="flex gap-2">
                <input
                  type="text"
                  bind:value={manualEmbedUrl}
                  placeholder="https://bigstep-idiomas.notion.site/ebd/..."
                  class="flex-1 px-3 py-2 border border-yellow-300 dark:border-yellow-700 rounded-md bg-white dark:bg-gray-800 text-sm"
                />
                <Button variant="outline" size="sm" on:click={applyManualEmbed}>
                  Apply
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  on:click={() => (showManualEmbed = false)}
                >
                  Cancel
                </Button>
              </div>
              <p class="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                💡 You can paste the full iframe code or just the src URL. The
                system will extract the correct URL automatically.
              </p>
            </div>
          {/if}

          <!-- Embed Instructions -->
          <div
            class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
          >
            <h4
              class="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2"
            >
              💡 Embedding Instructions
            </h4>
            <ul class="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>
                • Make sure your Notion page is set to "Public" in sharing
                settings
              </li>
              <li>• The page should be accessible without login</li>
              <li>
                • If embedding fails, click "Open in Notion" to view the content
              </li>
            </ul>
          </div>

          <!-- Debug Panel -->
          <div
            class="mt-4 p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg"
          >
            <h4
              class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2"
            >
              🔍 Debug Info
            </h4>
            <div class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div>
                <strong>Status:</strong>
                {embedLoading ? "Loading" : embedError ? "Failed" : "Success"}
              </div>
              <div>
                <strong>Method:</strong>
                {showManualEmbed ? "Manual" : "Automatic"}
              </div>
              <div>
                <strong>Current URL:</strong>
                {getCurrentEmbedUrl() || "None"}
              </div>
              <div><strong>Original URL:</strong> {lesson?.notion_url}</div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Analytics Stub -->
      <Card class="mb-6">
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4">Lesson Analytics</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center p-4 bg-accent rounded-lg">
              <Eye class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <div class="text-2xl font-bold">1</div>
              <div class="text-sm text-muted-foreground">Views</div>
            </div>
            <div class="text-center p-4 bg-accent rounded-lg">
              <CheckCircle class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <div class="text-2xl font-bold">0</div>
              <div class="text-sm text-muted-foreground">Completions</div>
            </div>
            <div class="text-center p-4 bg-accent rounded-lg">
              <div class="w-8 h-8 mx-auto mb-2 text-muted-foreground">⏱️</div>
              <div class="text-2xl font-bold">--</div>
              <div class="text-sm text-muted-foreground">Avg. Time</div>
            </div>
          </div>
          <p class="text-sm text-muted-foreground mt-4">
            Analytics tracking will be implemented in the next phase with the
            lesson_views table.
          </p>
        </div>
      </Card>
    {:else}
      <Card class="p-6">
        <div class="text-center text-muted-foreground">
          <AlertCircle class="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 class="text-lg font-semibold mb-2">Lesson not found</h3>
          <p class="mb-4">
            The lesson you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <a href="/lessons">
            <Button>
              <ArrowLeft class="w-4 h-4 mr-2" />
              Back to Lessons
            </Button>
          </a>
        </div>
      </Card>
    {/if}
  </LoadingOptimizer>
</div>
