<script lang="ts">
  import { onMount } from "svelte";
  import {
    authStore,
    isAdmin,
    isCollaborator,
    isStudent,
    canManageContent,
    initAuth,
  } from "$lib/stores/auth";

  $: user = $authStore.user;
  $: console.log("Dashboard auth state:", {
    loading: $authStore.loading,
    user: $authStore.user,
    hasUser: !!$authStore.user,
    userRole: $authStore.user?.role,
    isAdmin: isAdmin($authStore.user),
    canManageContent: canManageContent($authStore.user),
  });

  onMount(() => {
    // Ensure auth is initialized when dashboard loads
    initAuth();
  });
</script>

<svelte:head>
  <title>Dashboard - BigStepLabs</title>
  <meta name="description" content="BigStepLabs Dashboard" />
</svelte:head>

<!-- Page Header -->
<div class="mb-8">
  <h1 class="text-2xl font-bold text-foreground">Dashboard</h1>
  <p class="text-muted-foreground">Welcome to BigStepLabs 2.0</p>
</div>

<!-- Debug Panel -->
{#if !user}
  <div
    class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md"
  >
    <h3 class="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
      Debug Information
    </h3>
    <div class="text-sm space-y-1">
      <p><strong>Loading:</strong> {$authStore.loading}</p>
      <p><strong>Has User:</strong> {!!$authStore.user}</p>
      <p><strong>User Role:</strong> {$authStore.user?.role || "None"}</p>
      <p><strong>Is Admin:</strong> {isAdmin($authStore.user)}</p>
      <p><strong>Can Manage:</strong> {canManageContent($authStore.user)}</p>
      <p>
        <strong>User Object:</strong>
        {JSON.stringify($authStore.user, null, 2)}
      </p>
    </div>
  </div>
{/if}

<div class="max-w-7xl mx-auto">
  {#if $authStore.loading}
    <div class="flex items-center justify-center py-12">
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
      ></div>
      <span class="ml-3 text-muted-foreground">Loading user data...</span>
    </div>
  {:else if user}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Student Dashboard -->
      {#if isCollaborator(user) || isStudent(user)}
        <div class="bg-card p-6 rounded-lg border shadow-sm">
          <h2 class="text-lg font-semibold mb-2">📚 My Learning</h2>
          <p class="text-muted-foreground text-sm mb-4">
            Access your modules and track progress
          </p>
          <a
            href="/modules"
            class="block w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors text-center"
          >
            Browse Modules
          </a>
        </div>
      {/if}

      <!-- Content Management (Admin/Collaborator) -->
      {#if canManageContent(user)}
        <div class="bg-card p-6 rounded-lg border shadow-sm">
          <h2 class="text-lg font-semibold mb-2">📝 Content</h2>
          <p class="text-muted-foreground text-sm mb-4">
            Create and manage learning materials
          </p>
          <a
            href="/modules"
            class="block w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors text-center"
          >
            Manage Content
          </a>
        </div>

        <div class="bg-card p-6 rounded-lg border shadow-sm">
          <h2 class="text-lg font-semibold mb-2">🤖 AI Agents</h2>
          <p class="text-muted-foreground text-sm mb-4">
            Configure AI agents and datasets
          </p>
          <a
            href="/agents"
            class="block w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors text-center"
          >
            Manage Agents
          </a>
        </div>

        <div class="bg-card p-6 rounded-lg border shadow-sm">
          <h2 class="text-lg font-semibold mb-2">📊 Datasets</h2>
          <p class="text-muted-foreground text-sm mb-4">
            Upload and manage AI training datasets
          </p>
          <a
            href="/datasets"
            class="block w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors text-center"
          >
            Manage Datasets
          </a>
        </div>

        <div class="bg-card p-6 rounded-lg border shadow-sm">
          <h2 class="text-lg font-semibold mb-2">🎭 Personas</h2>
          <p class="text-muted-foreground text-sm mb-4">
            Create AI personalities and teaching styles
          </p>
          <a
            href="/personas"
            class="block w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors text-center"
          >
            Manage Personas
          </a>
        </div>

        <div class="bg-card p-6 rounded-lg border shadow-sm">
          <h2 class="text-lg font-semibold mb-2">🖥️ Models</h2>
          <p class="text-muted-foreground text-sm mb-4">
            Configure AI models and providers
          </p>
          <a
            href="/models"
            class="block w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors text-center"
          >
            Manage Models
          </a>
        </div>

        <div class="bg-card p-6 rounded-lg border shadow-sm">
          <h2 class="text-lg font-semibold mb-2">📁 Files</h2>
          <p class="text-muted-foreground text-sm mb-4">
            Upload and organize content files
          </p>
          <a
            href="/files"
            class="block w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors text-center"
          >
            Manage Files
          </a>
        </div>
      {/if}

      <!-- Admin Only -->
      {#if isAdmin(user)}
        <div class="bg-card p-6 rounded-lg border shadow-sm">
          <h2 class="text-lg font-semibold mb-2">⚙️ System</h2>
          <p class="text-muted-foreground text-sm mb-4">
            User management and system settings
          </p>
          <a
            href="/admin/users"
            class="block w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors text-center"
          >
            Admin Panel
          </a>
        </div>
      {/if}

      <!-- Chat (All Users) -->
      <div class="bg-card p-6 rounded-lg border shadow-sm">
        <h2 class="text-lg font-semibold mb-2">💬 Chat</h2>
        <p class="text-muted-foreground text-sm mb-4">
          Start a conversation with AI agents
        </p>
        <a
          href="/chat"
          class="block w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors text-center"
        >
          Start Chatting
        </a>
      </div>
    </div>

    <div class="mt-8 bg-muted/50 rounded-lg p-6">
      <h2 class="text-lg font-semibold mb-2">🚀 Getting Started</h2>
      <p class="text-muted-foreground mb-4">
        BigStepLabs 2.0 is now ready for development! The core authentication
        and database setup is complete.
      </p>

      <div class="space-y-2 text-sm mb-4">
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Authentication system with role-based access</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Database schema with 12 tables and RLS policies</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Storage buckets for file management</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Collapsible sidebar navigation</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Content management system</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>AI agent management with personas and datasets</span>
        </div>
      </div>

      <div class="flex space-x-3 flex-wrap gap-2">
        <a
          href="/personas"
          class="bg-purple-600 text-white px-4 py-2 rounded-md text-sm hover:bg-purple-700 transition-colors"
        >
          🎭 Create Personas
        </a>
        <a
          href="/models"
          class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
        >
          🖥️ Configure Models
        </a>
        <a
          href="/datasets"
          class="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 transition-colors"
        >
          📊 Upload Datasets
        </a>
        <a
          href="/agents"
          class="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 transition-colors"
        >
          🤖 Build AI Agents
        </a>
      </div>
    </div>
  {:else}
    <div class="text-center py-12">
      <p class="text-muted-foreground">No user data available</p>
      <div
        class="mt-4 p-4 bg-muted rounded-md text-sm text-left max-w-md mx-auto"
      >
        <p><strong>Debug Info:</strong></p>
        <p>Loading: {$authStore.loading}</p>
        <p>User: {JSON.stringify($authStore.user, null, 2)}</p>
        <p>Session: {$authStore.session ? "Present" : "None"}</p>
      </div>
      <div class="mt-4">
        <a href="/auth/login" class="text-primary hover:underline">
          Return to Login
        </a>
      </div>
    </div>
  {/if}
</div>
