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

  // Debug logging for auth state
  $: console.log("🔄 Dashboard auth state:", {
    user: user?.email || "no user",
    authLoading: $authStore.loading,
    authInitialized: $authStore.initialized,
    dashboardLoading: loading,
  });

  onMount(async () => {
    console.log("🔄 Dashboard onMount: Starting...");
    if (user) {
      console.log("🔄 Dashboard onMount: User found, loading data...");
      await loadDashboardData();
    } else {
      console.log("🔄 Dashboard onMount: No user found");
    }
  });

  async function loadDashboardData() {
    console.log("🔄 Dashboard: Starting to load data...");
    loading = true;
    error = "";

    try {
      console.log("🔄 Dashboard: Loading stats, modules, and activity...");
      await Promise.all([
        loadStats(),
        loadRecentModules(),
        loadRecentActivity(),
      ]);
      console.log("🔄 Dashboard: All data loaded successfully");
    } catch (err) {
      error =
        err instanceof Error ? err.message : "Failed to load dashboard data";
      console.error("❌ Dashboard error:", err);
    } finally {
      console.log("🔄 Dashboard: Setting loading to false");
      loading = false;
    }
  }

  async function loadStats() {
    console.log("🔄 Dashboard: Loading stats...");

    try {
      // Initialize stats with default values
      let totalModules = 0;
      let publishedModules = 0;
      let totalUnits = 0;
      let publishedUnits = 0;
      let totalContent = 0;
      let totalUsers = 0;
      let totalChatSessions = 0;

      try {
        // Get modules count
        console.log("🔄 Dashboard: Loading modules count...");
        const { count: modulesCount, error: modulesError } = await supabase
          .from("modules")
          .select("*", { count: "exact", head: true });

        if (!modulesError) {
          totalModules = modulesCount || 0;

          const { count: publishedCount, error: publishedError } =
            await supabase
              .from("modules")
              .select("*", { count: "exact", head: true })
              .eq("is_published", true);

          if (!publishedError) {
            publishedModules = publishedCount || 0;
          }
        }
      } catch (error) {
        console.warn("⚠️ Dashboard: Modules table not accessible:", error);
      }

      try {
        // Get units count
        console.log("🔄 Dashboard: Loading units count...");
        const { count: unitsCount, error: unitsError } = await supabase
          .from("units")
          .select("*", { count: "exact", head: true });

        if (!unitsError) {
          totalUnits = unitsCount || 0;

          const { count: publishedUnitsCount, error: publishedUnitsError } =
            await supabase
              .from("units")
              .select("*", { count: "exact", head: true })
              .eq("is_published", true);

          if (!publishedUnitsError) {
            publishedUnits = publishedUnitsCount || 0;
          }
        }
      } catch (error) {
        console.warn("⚠️ Dashboard: Units table not accessible:", error);
      }

      try {
        // Get content count
        console.log("🔄 Dashboard: Loading content count...");
        const { count: contentCount, error: contentError } = await supabase
          .from("content")
          .select("*", { count: "exact", head: true });

        if (!contentError) {
          totalContent = contentCount || 0;
        }
      } catch (error) {
        console.warn("⚠️ Dashboard: Content table not accessible:", error);
      }

      // Get users count (admin only)
      if (isAdmin()) {
        try {
          console.log("🔄 Dashboard: Loading users count...");
          const { count, error: usersError } = await supabase
            .from("users")
            .select("*", { count: "exact", head: true });

          if (!usersError) {
            totalUsers = count || 0;
          }
        } catch (error) {
          console.warn("⚠️ Dashboard: Users table not accessible:", error);
        }
      }

      try {
        // Get chat sessions count
        console.log("🔄 Dashboard: Loading chat sessions count...");
        const { count: chatCount, error: chatError } = await supabase
          .from("chat_sessions")
          .select("*", { count: "exact", head: true });

        if (!chatError) {
          totalChatSessions = chatCount || 0;
        }
      } catch (error) {
        console.warn(
          "⚠️ Dashboard: Chat sessions table not accessible:",
          error
        );
      }

      stats = {
        totalModules,
        publishedModules,
        totalUnits,
        publishedUnits,
        totalContent,
        totalUsers,
        totalChatSessions,
      };

      console.log("🔄 Dashboard: Stats loaded successfully:", stats);
    } catch (error) {
      console.error("❌ Dashboard: Error loading stats:", error);
      // Don't throw error, just log it and continue with default values
    }
  }

  async function loadRecentModules() {
    try {
      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!error) {
        recentModules = data || [];
      } else {
        console.warn("⚠️ Dashboard: Could not load recent modules:", error);
        recentModules = [];
      }
    } catch (error) {
      console.warn("⚠️ Dashboard: Modules table not accessible:", error);
      recentModules = [];
    }
  }

  async function loadRecentActivity() {
    try {
      // Get recent chat sessions
      const { data: recentChats, error } = await supabase
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

      if (!error) {
        recentActivity = recentChats || [];
      } else {
        console.warn("⚠️ Dashboard: Could not load recent activity:", error);
        recentActivity = [];
      }
    } catch (error) {
      console.warn("⚠️ Dashboard: Chat sessions table not accessible:", error);
      recentActivity = [];
    }
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
          <p class="text-sm font-medium">
            {user.updated_at ? formatDate(user.updated_at) : "N/A"}
          </p>
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
          <p class="text-foreground/60 text-sm">No modules created yet.</p>
        {:else}
          <div class="space-y-3">
            {#each recentModules as module}
              <div
                class="flex items-center justify-between p-3 bg-accent/50 border border-border rounded-md"
              >
                <div class="flex items-center space-x-3">
                  <svelte:component
                    this={getStatusIcon(module)}
                    class="w-4 h-4 text-foreground/60"
                  />
                  <div>
                    <p class="font-medium text-sm text-foreground">
                      {module.title}
                    </p>
                    <p class="text-xs text-foreground/60">
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
          <p class="text-foreground/60 text-sm">No recent activity.</p>
        {:else}
          <div class="space-y-3">
            {#each recentActivity as activity}
              <div
                class="flex items-center space-x-3 p-3 bg-accent/50 border border-border rounded-md"
              >
                <MessageSquare class="w-4 h-4 text-foreground/60" />
                <div class="flex-1">
                  <p class="text-sm text-foreground">
                    <span class="font-medium"
                      >{activity.user?.email || "Unknown"}</span
                    >
                    {#if activity.agent?.name}
                      chatted with <span class="font-medium"
                        >{activity.agent.name}</span
                      >
                    {/if}
                  </p>
                  <p class="text-xs text-foreground/60">
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
