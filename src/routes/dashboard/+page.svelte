<script lang="ts">
  import { onMount } from "svelte";
  import {
    authStore,
    isAdmin,
    isCollaborator,
    isStudent,
    canManageContent,
  } from "$lib/stores/auth";
  import { supabase } from "$lib/supabase";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import {
    BookOpen,
    Layers3,
    FileText,
    Users,
    MessageSquare,
    TrendingUp,
    Clock,
    BarChart3,
    Plus,
    ArrowRight,
    Loader2,
    AlertCircle,
    CheckCircle,
    Globe,
    Lock,
  } from "lucide-svelte";

  let loading = true;
  let error = "";
  let stats = {
    totalModules: 0,
    publishedModules: 0,
    totalUnits: 0,
    publishedUnits: 0,
    totalContent: 0,
    totalUsers: 0,
    totalChatSessions: 0,
  };
  let recentModules: any[] = [];
  let recentActivity: any[] = [];

  $: user = $authStore.user;
  $: console.log("Dashboard auth state:", {
    loading: $authStore.loading,
    user: $authStore.user,
    hasUser: !!$authStore.user,
    userRole: $authStore.user?.role,
    isAdmin: isAdmin(),
    canManageContent: $canManageContent,
  });

  onMount(async () => {
    if (user) {
      await loadDashboardData();
    }
  });

  async function loadDashboardData() {
    loading = true;
    error = "";

    try {
      await Promise.all([
        loadStats(),
        loadRecentModules(),
        loadRecentActivity(),
      ]);
    } catch (err) {
      error =
        err instanceof Error ? err.message : "Failed to load dashboard data";
      console.error("Dashboard error:", err);
    } finally {
      loading = false;
    }
  }

  async function loadStats() {
    // Get modules count
    const { count: totalModules } = await supabase
      .from("modules")
      .select("*", { count: "exact", head: true });

    const { count: publishedModules } = await supabase
      .from("modules")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true);

    // Get units count
    const { count: totalUnits } = await supabase
      .from("units")
      .select("*", { count: "exact", head: true });

    const { count: publishedUnits } = await supabase
      .from("units")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true);

    // Get content count
    const { count: totalContent } = await supabase
      .from("content")
      .select("*", { count: "exact", head: true });

    // Get users count (admin only)
    let totalUsers = 0;
    if (isAdmin()) {
      const { count } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });
      totalUsers = count || 0;
    }

    // Get chat sessions count
    const { count: totalChatSessions } = await supabase
      .from("chat_sessions")
      .select("*", { count: "exact", head: true });

    stats = {
      totalModules: totalModules || 0,
      publishedModules: publishedModules || 0,
      totalUnits: totalUnits || 0,
      publishedUnits: publishedUnits || 0,
      totalContent: totalContent || 0,
      totalUsers,
      totalChatSessions: totalChatSessions || 0,
    };
  }

  async function loadRecentModules() {
    const { data } = await supabase
      .from("modules")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    recentModules = data || [];
  }

  async function loadRecentActivity() {
    // Get recent chat sessions
    const { data: recentChats } = await supabase
      .from("chat_sessions")
      .select(
        `
        *,
        user:users(email),
        agent:agents(name)
      `
      )
      .order("created_at", { ascending: false })
      .limit(5);

    recentActivity = recentChats || [];
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

<!-- Loading user data... -->
{#if $authStore.loading || loading}
  <div class="text-center py-8">
    <div
      class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"
    ></div>
    <p class="text-muted-foreground">Loading user data...</p>
  </div>
{:else if user}
  <!-- Dashboard content for authenticated users -->
  <div class="space-y-8">
    <!-- Welcome Card -->
    <Card class="p-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-foreground mb-2">
            Welcome back, {user.email}!
          </h2>
          <p class="text-muted-foreground">
            You're logged in as <span class="font-semibold text-primary"
              >{user.role}</span
            >
          </p>
        </div>
        <div class="text-right">
          <p class="text-sm text-muted-foreground">Last login</p>
          <p class="text-sm font-medium">{formatDate(user.updated_at)}</p>
        </div>
      </div>
    </Card>

    <!-- Statistics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card class="p-6">
        <div class="flex items-center justify-between mb-2">
          <BookOpen class="w-8 h-8 text-primary" />
          <span class="text-2xl font-bold text-foreground"
            >{stats.totalModules}</span
          >
        </div>
        <h3 class="font-semibold text-foreground">Total Modules</h3>
        <p class="text-sm text-muted-foreground">
          {stats.publishedModules} published
        </p>
      </Card>

      <Card class="p-6">
        <div class="flex items-center justify-between mb-2">
          <Layers3 class="w-8 h-8 text-blue-500" />
          <span class="text-2xl font-bold text-foreground"
            >{stats.totalUnits}</span
          >
        </div>
        <h3 class="font-semibold text-foreground">Total Units</h3>
        <p class="text-sm text-muted-foreground">
          {stats.publishedUnits} published
        </p>
      </Card>

      <Card class="p-6">
        <div class="flex items-center justify-between mb-2">
          <FileText class="w-8 h-8 text-green-500" />
          <span class="text-2xl font-bold text-foreground"
            >{stats.totalContent}</span
          >
        </div>
        <h3 class="font-semibold text-foreground">Content Items</h3>
        <p class="text-sm text-muted-foreground">Total lessons & materials</p>
      </Card>

      <Card class="p-6">
        <div class="flex items-center justify-between mb-2">
          <MessageSquare class="w-8 h-8 text-purple-500" />
          <span class="text-2xl font-bold text-foreground"
            >{stats.totalChatSessions}</span
          >
        </div>
        <h3 class="font-semibold text-foreground">Chat Sessions</h3>
        <p class="text-sm text-muted-foreground">AI interactions</p>
      </Card>
    </div>

    <!-- Admin Stats (if admin) -->
    {#if isAdmin()}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card class="p-6">
          <div class="flex items-center justify-between mb-2">
            <Users class="w-8 h-8 text-orange-500" />
            <span class="text-2xl font-bold text-foreground"
              >{stats.totalUsers}</span
            >
          </div>
          <h3 class="font-semibold text-foreground">Total Users</h3>
          <p class="text-sm text-muted-foreground">Registered users</p>
        </Card>

        <Card class="p-6">
          <div class="flex items-center justify-between mb-2">
            <TrendingUp class="w-8 h-8 text-emerald-500" />
            <span class="text-2xl font-bold text-foreground">
              {stats.publishedModules > 0
                ? Math.round((stats.publishedUnits / stats.totalUnits) * 100)
                : 0}%
            </span>
          </div>
          <h3 class="font-semibold text-foreground">Publishing Rate</h3>
          <p class="text-sm text-muted-foreground">Units published</p>
        </Card>
      </div>
    {/if}

    <!-- Quick Actions -->
    {#if $canManageContent}
      <Card class="p-6">
        <h3 class="text-lg font-semibold mb-4">Quick Actions</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            class="w-full justify-start"
            on:click={() => (window.location.href = "/lessons")}
          >
            <Plus class="w-4 h-4 mr-2" />
            Manage Lessons
          </Button>
          <Button
            variant="outline"
            class="w-full justify-start"
            on:click={() => (window.location.href = "/personas")}
          >
            <Users class="w-4 h-4 mr-2" />
            Manage Personas
          </Button>
          <Button
            variant="outline"
            class="w-full justify-start"
            on:click={() => (window.location.href = "/agents")}
          >
            <MessageSquare class="w-4 h-4 mr-2" />
            Manage Agents
          </Button>
        </div>
      </Card>
    {/if}

    <!-- Recent Modules -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Recent Modules</h3>
          <Button
            variant="ghost"
            size="sm"
            on:click={() => (window.location.href = "/modules")}
          >
            View All
            <ArrowRight class="w-4 h-4 ml-1" />
          </Button>
        </div>

        {#if recentModules.length === 0}
          <p class="text-muted-foreground text-sm">No modules created yet.</p>
        {:else}
          <div class="space-y-3">
            {#each recentModules as module}
              <div
                class="flex items-center justify-between p-3 bg-muted rounded-md"
              >
                <div class="flex items-center space-x-3">
                  <svelte:component
                    this={getStatusIcon(module)}
                    class="w-4 h-4 text-muted-foreground"
                  />
                  <div>
                    <p class="font-medium text-sm">{module.title}</p>
                    <p class="text-xs text-muted-foreground">
                      {formatDate(module.created_at)}
                    </p>
                  </div>
                </div>
                <span
                  class={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(module)}`}
                >
                  {module.is_published ? "Published" : "Draft"}
                </span>
              </div>
            {/each}
          </div>
        {/if}
      </Card>

      <!-- Recent Activity -->
      <Card class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Recent Activity</h3>
          <Button
            variant="ghost"
            size="sm"
            on:click={() => (window.location.href = "/chat")}
          >
            View All
            <ArrowRight class="w-4 h-4 ml-1" />
          </Button>
        </div>

        {#if recentActivity.length === 0}
          <p class="text-muted-foreground text-sm">No recent activity.</p>
        {:else}
          <div class="space-y-3">
            {#each recentActivity as activity}
              <div class="flex items-center space-x-3 p-3 bg-muted rounded-md">
                <MessageSquare class="w-4 h-4 text-muted-foreground" />
                <div class="flex-1">
                  <p class="text-sm">
                    <span class="font-medium"
                      >{activity.user?.email || "Unknown"}</span
                    >
                    {#if activity.agent?.name}
                      chatted with <span class="font-medium"
                        >{activity.agent.name}</span
                      >
                    {/if}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {formatDate(activity.created_at)}
                  </p>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </Card>
    </div>
  </div>
{/if}
