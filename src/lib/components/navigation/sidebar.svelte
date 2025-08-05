<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import {
    authStore,
    canManageContent,
    isAdmin,
    initAuth,
  } from "$lib/stores/auth";
  import {
    Home,
    BookOpen,
    Layers3,
    FileText,
    Database,
    Bot,
    MessageSquare,
    Wrench,
    Settings,
    Users,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
    Upload,
    Cpu,
    Loader2,
  } from "lucide-svelte";

  let collapsed = false;
  let mobileOpen = false;

  $: authState = $authStore;
  $: user = authState.user;
  $: loading = authState.loading;
  $: currentPath = $page.url.pathname;

  // Auth is already initialized in root layout
  // No need to initialize here



  const navigationItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: Home,
      roles: ["Admin", "Collaborator", "Student"],
    },
    {
      label: "Modules",
      href: "/modules",
      icon: BookOpen,
      roles: ["Admin", "Collaborator"],
    },
    {
      label: "Units",
      href: "/units",
      icon: Layers3,
      roles: ["Admin", "Collaborator"],
    },
    {
      label: "Lessons",
      href: "/lessons",
      icon: FileText,
      roles: ["Admin", "Collaborator"],
    },
    {
      label: "Files",
      href: "/files",
      icon: Upload,
      roles: ["Admin", "Collaborator"],
    },
    {
      label: "Datasets",
      href: "/datasets",
      icon: Database,
      roles: ["Admin", "Collaborator"],
    },
    {
      label: "Personas",
      href: "/personas",
      icon: Users,
      roles: ["Admin", "Collaborator"],
    },
    {
      label: "Models",
      href: "/models",
      icon: Cpu,
      roles: ["Admin", "Collaborator"],
    },
    {
      label: "AI Agents",
      href: "/agents",
      icon: Bot,
      roles: ["Admin", "Collaborator"],
    },
    {
      label: "Chat",
      href: "/chat",
      icon: MessageSquare,
      roles: ["Admin", "Collaborator", "Student"],
    },
    {
      label: "Workbench",
      href: "/workbench",
      icon: Wrench,
      roles: ["Admin", "Collaborator"],
    },
  ];

  const adminItems = [
    {
      label: "Users",
      href: "/admin/users",
      icon: Users,
      roles: ["Admin"],
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: Settings,
      roles: ["Admin"],
    },
  ];

  function toggleCollapsed() {
    collapsed = !collapsed;
  }

  function toggleMobile() {
    mobileOpen = !mobileOpen;
  }

  function isActive(href: string): boolean {
    if (href === "/dashboard") {
      return currentPath === "/dashboard" || currentPath === "/";
    }
    return currentPath.startsWith(href);
  }

  function canAccessItem(itemRoles: string[]): boolean {
    // Don't filter items while loading
    if (loading) return true;

    return !!(user?.role && itemRoles.includes(user.role));
  }

  function shouldShowAdminSection(): boolean {
    // Don't filter admin section while loading
    if (loading) return true;

    return isAdmin() && adminItems.some((item) => canAccessItem(item.roles));
  }

  function closeMobileNav() {
    mobileOpen = false;
  }
</script>

<!-- Mobile Menu Button -->
<button
  class="lg:hidden fixed top-4 left-4 z-50 p-2 bg-background border rounded-md shadow-sm"
  on:click={toggleMobile}
  aria-label="Toggle navigation"
>
  {#if mobileOpen}
    <X class="w-5 h-5" />
  {:else}
    <Menu class="w-5 h-5" />
  {/if}
</button>

<!-- Mobile Backdrop -->
{#if mobileOpen}
  <div
    class="lg:hidden fixed inset-0 bg-black/50 z-30"
    on:click={closeMobileNav}
    role="button"
    tabindex="0"
    on:keydown={(e) => e.key === "Escape" && closeMobileNav()}
  ></div>
{/if}

<!-- Sidebar -->
<aside
  class={`
	fixed top-0 left-0 h-full bg-card border-r border-border z-40 transition-all duration-300
	${collapsed ? "w-16" : "w-64"}
	${mobileOpen ? "translate-x-0" : "-translate-x-full"}
	lg:translate-x-0
`}
>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="p-4 border-b border-border">
      <div class="flex items-center justify-between">
        {#if !collapsed}
          <div class="flex items-center space-x-2">
            <img
              src="/images/bigstep-logo.png"
              alt="BigStepLabs"
              class="w-8 h-8 object-contain"
            />
            <span class="font-semibold text-foreground">BigStepLabs</span>
          </div>
        {:else}
          <img
            src="/images/bigstep-logo.png"
            alt="BigStepLabs"
            class="w-8 h-8 object-contain mx-auto"
          />
        {/if}

        <!-- Collapse Toggle (Desktop) -->
        <button
          class="hidden lg:flex p-1 hover:bg-accent rounded-sm transition-colors"
          on:click={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {#if collapsed}
            <ChevronRight class="w-4 h-4" />
          {:else}
            <ChevronLeft class="w-4 h-4" />
          {/if}
        </button>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
      {#if loading}
        <!-- Loading State -->
        <div
          class="flex items-center {collapsed
            ? 'justify-center'
            : 'space-x-2'} px-3 py-2"
        >
          <Loader2 class="w-5 h-5 animate-spin text-muted-foreground" />
          {#if !collapsed}
            <span class="text-sm text-muted-foreground">Loading...</span>
          {/if}
        </div>
      {:else}
        <!-- Main Navigation -->
        {#each navigationItems as item}
          {#if canAccessItem(item.roles)}
            <a
              href={item.href}
              class={`
							flex items-center space-x-3 px-3 py-2 rounded-md transition-colors
							${
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }
							${collapsed ? "justify-center" : ""}
						`}
              on:click={closeMobileNav}
              title={collapsed ? item.label : ""}
            >
              <svelte:component
                this={item.icon}
                class="w-5 h-5 flex-shrink-0"
              />
              {#if !collapsed}
                <span class="font-medium">{item.label}</span>
              {/if}
            </a>
          {/if}
        {/each}

        <!-- Admin Section -->
        {#if shouldShowAdminSection()}
          <div class="pt-4">
            {#if !collapsed}
              <div class="px-3 mb-2">
                <span
                  class="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Administration
                </span>
              </div>
            {:else}
              <div class="border-t border-border my-2"></div>
            {/if}

            {#each adminItems as item}
              {#if canAccessItem(item.roles)}
                <a
                  href={item.href}
                  class={`
									flex items-center space-x-3 px-3 py-2 rounded-md transition-colors
									${
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }
									${collapsed ? "justify-center" : ""}
								`}
                  on:click={closeMobileNav}
                  title={collapsed ? item.label : ""}
                >
                  <svelte:component
                    this={item.icon}
                    class="w-5 h-5 flex-shrink-0"
                  />
                  {#if !collapsed}
                    <span class="font-medium">{item.label}</span>
                  {/if}
                </a>
              {/if}
            {/each}
          </div>
        {/if}
      {/if}
    </nav>

    <!-- User Info -->
    {#if user}
      <div class="p-4 border-t border-border">
        <div
          class={`flex items-center ${collapsed ? "justify-center" : "space-x-3"}`}
        >
          <div
            class="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0"
          >
            <span class="text-xs font-medium">
              {user.email?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          {#if !collapsed}
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-foreground truncate">
                {user.email}
              </p>
              <p class="text-xs text-muted-foreground">
                {user.role}
              </p>
            </div>
          {/if}
        </div>
      </div>
    {:else if loading}
      <!-- Loading user info -->
      <div class="p-4 border-t border-border">
        <div
          class={`flex items-center ${collapsed ? "justify-center" : "space-x-3"}`}
        >
          <div class="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
          {#if !collapsed}
            <div class="flex-1 space-y-1">
              <div class="h-3 bg-muted rounded animate-pulse"></div>
              <div class="h-2 bg-muted rounded w-2/3 animate-pulse"></div>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</aside>
