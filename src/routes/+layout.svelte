<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { initAuth, authStore, initializeAuthManually } from "$lib/stores/auth";

  export let data: any;

  // Initialize auth state on app load
  onMount(async () => {
    console.log("🔄 Layout: Initializing auth...");
    
    // If we have server data, use it
    if (data?.session && data?.user) {
      console.log("🔄 Layout: Using server auth data");
      authStore.set({
        session: data.session,
        user: data.user,
        loading: false,
        initialized: true,
      });
    } else {
      // Otherwise, initialize auth manually
      console.log("🔄 Layout: No server data, initializing auth manually");
      await initializeAuthManually();
    }
  });

  // Update auth store with server data if it changes
  $: if (data?.session && data?.user && !$authStore.initialized) {
    console.log("🔄 Layout: Updating auth store with server data");
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
