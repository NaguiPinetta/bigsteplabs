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
    isAdmin: isAdmin(),
    canManageContent: $canManageContent,
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
<div class="mb-6 lg:mb-8">
  <h1 class="text-xl lg:text-2xl font-bold text-foreground">Dashboard</h1>
  <p class="text-muted-foreground text-sm lg:text-base">
    Welcome to BigStepLabs 2.0
  </p>
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
      <p><strong>Is Admin:</strong> {isAdmin()}</p>
      <p><strong>Can Manage:</strong> {$canManageContent}</p>
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
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      <!-- Student Dashboard -->
      {#if isCollaborator() || isStudent()}
        <div class="bg-card p-4 lg:p-6 rounded-lg border shadow-sm">
          <h2 class="text-base lg:text-lg font-semibold mb-2">
            📚 My Learning
          </h2>
          <p class="text-muted-foreground text-sm mb-4">
            Access your modules and track progress
          </p>
          <a
            href="/modules"
            class="block w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors text-center text-sm"
          >
            Browse Modules
          </a>
        </div>
      {/if}

      <!-- Content Management (Admin/Collaborator) -->
      {#if $canManageContent}
        <div class="bg-card p-4 lg:p-6 rounded-lg border shadow-sm">
          <h2 class="text-base lg:text-lg font-semibold mb-2">📝 Content</h2>
          <p class="text-muted-foreground text-sm mb-4">
            Create and manage learning materials
          </p>
          <a
            href="/modules"
            class="block w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors text-center text-sm"
          >
            Manage Content
          </a>
        </div>
      {/if}

      <!-- AI Agents (Admin/Collaborator) -->
      {#if $canManageContent}
        <div class="bg-card p-4 lg:p-6 rounded-lg border shadow-sm">
          <h2 class="text-base lg:text-lg font-semibold mb-2">🤖 AI Agents</h2>
          <p class="text-muted-foreground text-sm mb-4">
            Configure AI learning assistants
          </p>
          <a
            href="/agents"
            class="block w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors text-center text-sm"
          >
            Manage Agents
          </a>
        </div>
      {/if}

      <!-- Chat (All Users) -->
      <div class="bg-card p-4 lg:p-6 rounded-lg border shadow-sm">
        <h2 class="text-base lg:text-lg font-semibold mb-2">💬 Chat</h2>
        <p class="text-muted-foreground text-sm mb-4">
          Start conversations with AI assistants
        </p>
        <a
          href="/chat"
          class="block w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors text-center text-sm"
        >
          Start Chat
        </a>
      </div>

      <!-- Admin Tools -->
      {#if isAdmin()}
        <div class="bg-card p-4 lg:p-6 rounded-lg border shadow-sm">
          <h2 class="text-base lg:text-lg font-semibold mb-2">⚙️ Admin</h2>
          <p class="text-muted-foreground text-sm mb-4">
            Manage users and system settings
          </p>
          <a
            href="/admin/users"
            class="block w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors text-center text-sm"
          >
            Manage Users
          </a>
        </div>

        <div class="bg-card p-4 lg:p-6 rounded-lg border shadow-sm">
          <h2 class="text-base lg:text-lg font-semibold mb-2">🔧 Workbench</h2>
          <p class="text-muted-foreground text-sm mb-4">
            Test and debug AI agents
          </p>
          <a
            href="/workbench"
            class="block w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors text-center text-sm"
          >
            Open Workbench
          </a>
        </div>
      {/if}
    </div>

    <!-- Quick Stats Section -->
    <div
      class="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
    >
      <div class="bg-card p-4 lg:p-6 rounded-lg border shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Role</p>
            <p class="text-2xl font-bold text-foreground">{user.role}</p>
          </div>
          <div
            class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center"
          >
            <span class="text-primary text-sm font-medium">
              {user.role.charAt(0)}
            </span>
          </div>
        </div>
      </div>

      <div class="bg-card p-4 lg:p-6 rounded-lg border shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Status</p>
            <p class="text-2xl font-bold text-foreground">Active</p>
          </div>
          <div
            class="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center"
          >
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>

      <div class="bg-card p-4 lg:p-6 rounded-lg border shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">
              Member Since
            </p>
            <p class="text-lg font-bold text-foreground">
              {user.created_at
                ? new Date(user.created_at).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
          <div
            class="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center"
          >
            <span class="text-blue-500 text-sm">📅</span>
          </div>
        </div>
      </div>

      <div class="bg-card p-4 lg:p-6 rounded-lg border shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Email</p>
            <p class="text-sm font-bold text-foreground truncate">
              {user.email}
            </p>
          </div>
          <div
            class="w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center"
          >
            <span class="text-purple-500 text-sm">📧</span>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="text-center py-12">
      <h2 class="text-xl font-semibold mb-2">Not Authenticated</h2>
      <p class="text-muted-foreground mb-4">
        Please log in to access your dashboard.
      </p>
      <a
        href="/auth/login"
        class="inline-block bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
      >
        Go to Login
      </a>
    </div>
  {/if}
</div>
