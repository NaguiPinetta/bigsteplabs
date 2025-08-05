<script lang="ts">
  import DashboardLayout from "$lib/components/layout/dashboard-layout.svelte";
  import { authStore, isAdmin } from "$lib/stores/auth";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  $: user = $authStore.user;
  $: canAccess = isAdmin();

  // Reactive redirect when auth state changes
  $: if (!$authStore.loading && !canAccess) {
    // If user is not authenticated, redirect to login
    // If user is authenticated but not admin, redirect to dashboard
    if (!$authStore.user) {
      goto("/auth/login");
    } else {
      goto("/dashboard");
    }
  }

  onMount(() => {
    if (!canAccess) {
      // If user is not authenticated, redirect to login
      // If user is authenticated but not admin, redirect to dashboard
      if (!$authStore.user) {
        goto("/auth/login");
      } else {
        goto("/dashboard");
      }
    }
  });
</script>

{#if canAccess}
  <DashboardLayout>
    <slot />
  </DashboardLayout>
{:else}
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <h1 class="text-2xl font-bold mb-4">Access Denied</h1>
      <p class="text-muted-foreground mb-6">
        You don't have permission to access this area.
      </p>
      <div class="space-y-3">
        <a
          href="/auth/login"
          class="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Sign In
        </a>
        <div class="text-sm text-muted-foreground">
          or <a href="/dashboard" class="text-primary hover:underline"
            >go to dashboard</a
          >
        </div>
      </div>
    </div>
  </div>
{/if}
