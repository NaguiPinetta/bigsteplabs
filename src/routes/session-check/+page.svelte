<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";

  let sessionInfo = {
    hasSession: false,
    user: null as any,
    loading: true,
    error: "",
  };

  onMount(async () => {
    await checkSession();
  });

  async function checkSession() {
    sessionInfo.loading = true;
    sessionInfo.error = "";

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        sessionInfo.error = `Session error: ${error.message}`;
      } else {
        sessionInfo.hasSession = !!session;
        sessionInfo.user = session?.user || null;
      }
    } catch (err) {
      sessionInfo.error = `Unexpected error: ${err}`;
    }

    sessionInfo.loading = false;
  }

  async function signOut() {
    await supabase.auth.signOut();
    await checkSession();
  }
</script>

<svelte:head>
  <title>Session Check - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6">
  <h1 class="text-2xl font-bold mb-4">Session Status</h1>

  <div class="space-y-4">
    <Card class="p-4">
      <h2 class="text-lg font-semibold mb-2">Current Session</h2>

      {#if sessionInfo.loading}
        <p>Loading...</p>
      {:else}
        <div class="space-y-2">
          <p>
            <strong>Has Session:</strong>
            {sessionInfo.hasSession ? "✅ Yes" : "❌ No"}
          </p>

          {#if sessionInfo.user}
            <div class="bg-green-50 border border-green-200 rounded p-3">
              <h3 class="font-semibold text-green-800">Logged In User:</h3>
              <p><strong>Email:</strong> {sessionInfo.user.email}</p>
              <p><strong>ID:</strong> {sessionInfo.user.id}</p>
            </div>
          {:else}
            <div class="bg-red-50 border border-red-200 rounded p-3">
              <p class="text-red-800">No user logged in</p>
            </div>
          {/if}
        </div>
      {/if}

      <div class="mt-4 space-x-2">
        <Button on:click={checkSession} variant="outline"
          >Refresh Session</Button
        >
        {#if sessionInfo.hasSession}
          <Button on:click={signOut} variant="destructive">Sign Out</Button>
        {/if}
      </div>
    </Card>

    {#if sessionInfo.error}
      <Card class="p-4 border-red-200 bg-red-50">
        <h3 class="font-semibold text-red-800">Error:</h3>
        <p class="text-red-700">{sessionInfo.error}</p>
      </Card>
    {/if}

    <Card class="p-4">
      <h2 class="text-lg font-semibold mb-2">Quick Actions</h2>
      <div class="space-y-2">
        <a href="/dev" class="block">
          <Button class="w-full">🚀 Go to Development Mode</Button>
        </a>
        <a href="/auth/login" class="block">
          <Button class="w-full" variant="outline">🔐 Go to Login</Button>
        </a>
        <a href="/units" class="block">
          <Button class="w-full" variant="outline">📚 Go to Units</Button>
        </a>
      </div>
    </Card>
  </div>
</div>
