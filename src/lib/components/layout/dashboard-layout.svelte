<script lang="ts">
  import { onMount } from "svelte";
  import Sidebar from "../navigation/sidebar.svelte";
  import { authStore, signOut, initAuth } from "$lib/stores/auth";
  import { goto } from "$app/navigation";
  import { LogOut } from "lucide-svelte";
  import {
    LayoutDashboard,
    BookOpen,
    Layers,
    FileText,
    FolderOpen,
    Database,
    Users,
    Cpu,
    Bot,
    MessageSquare,
    TestTube,
  } from "lucide-svelte";

  $: authState = $authStore;
  $: user = authState.user;
  $: loading = authState.loading;

  // Define role-based access
  $: canManage = user?.role === "Admin" || user?.role === "Collaborator";
  $: isAdminUser = user?.role === "Admin";

  // Check if user is authenticated, if not redirect to login
  $: if (!loading && !user) {
    goto("/auth/login");
  }

  async function handleSignOut() {
    await signOut();
    goto("/auth/login");
  }

  // Navigation items based on user role
  $: navigation = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      show: true,
    },
    {
      label: "Learn",
      href: "/learn",
      icon: BookOpen,
      show: true,
    },
    {
      label: "Modules",
      href: "/modules",
      icon: BookOpen,
      show: canManage,
    },
    {
      label: "Units",
      href: "/units",
      icon: Layers,
      show: canManage,
    },
    {
      label: "Content",
      href: "/content",
      icon: FileText,
      show: canManage,
    },
    {
      label: "Files",
      href: "/files",
      icon: FolderOpen,
      show: canManage,
    },
    {
      label: "Datasets",
      href: "/datasets",
      icon: Database,
      show: canManage,
    },
    {
      label: "Personas",
      href: "/personas",
      icon: Users,
      show: canManage,
    },
    {
      label: "Models",
      href: "/models",
      icon: Cpu,
      show: canManage,
    },
    {
      label: "AI Agents",
      href: "/agents",
      icon: Bot,
      show: canManage,
    },
    {
      label: "Chat",
      href: "/chat",
      icon: MessageSquare,
      show: true,
    },
    {
      label: "Workbench",
      href: "/workbench",
      icon: TestTube,
      show: isAdminUser,
    },
  ];
</script>

<div class="min-h-screen bg-background">
  <Sidebar />

  <!-- Main Content -->
  <main class="lg:ml-64 min-h-screen">
    <!-- Top Bar -->
    <header
      class="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div class="flex h-16 items-center justify-between px-4 lg:px-6">
        <!-- Spacer for mobile menu button -->
        <div class="lg:hidden w-10"></div>

        <!-- Empty space for balance -->
        <div class="flex-1"></div>

        <!-- User Actions -->
        <div class="flex items-center space-x-4">
          {#if loading}
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
              <div
                class="hidden sm:block w-20 h-4 bg-muted rounded animate-pulse"
              ></div>
            </div>
          {:else if user}
            <div class="hidden sm:flex items-center space-x-2 text-sm">
              <span class="text-muted-foreground">Welcome,</span>
              <span class="font-medium">{user.email?.split("@")[0]}</span>
              <span class="text-xs bg-secondary px-2 py-1 rounded-full">
                {user.role}
              </span>
            </div>

            <button
              on:click={handleSignOut}
              class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              title="Sign Out"
            >
              <LogOut class="w-4 h-4" />
              <span class="hidden sm:inline">Sign Out</span>
            </button>
          {/if}
        </div>
      </div>
    </header>

    <!-- Content Area -->
    <div class="p-4 lg:p-8">
      <slot />
    </div>
  </main>
</div>
