<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { initAuth, authStore } from "$lib/stores/auth";

  // Initialize auth state on app load - only once
  onMount(() => {
    console.log("🔄 Root layout: Initializing auth...");
    initAuth();
  });

  export let data: any;

  // Update auth store with server data
  $: if (data?.session && data?.user) {
    authStore.set({
      session: data.session,
      user: data.user,
      loading: false,
      initialized: true,
    });
  }
</script>

<svelte:head>
  <meta name="theme-color" content="#09090b" />
</svelte:head>

<slot />
