<script lang="ts">
  import DashboardLayout from "$lib/components/layout/dashboard-layout.svelte";
  import { authStore, isAdmin } from "$lib/stores/auth";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  $: user = $authStore.user;
  $: canAccess = isAdmin(user);

  onMount(() => {
    if (!canAccess) {
      goto("/dashboard");
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
      <p class="text-muted-foreground">
        You don't have permission to access this area.
      </p>
    </div>
  </div>
{/if}
