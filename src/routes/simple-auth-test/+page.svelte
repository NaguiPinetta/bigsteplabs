<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";

  let status = "Loading...";
  let config = {};
  let session = null;

  onMount(async () => {
    await checkConfig();
    await checkSession();
  });

  async function checkConfig() {
    try {
      config = {
        url: import.meta.env.VITE_SUPABASE_URL,
        keyLength: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.length || 0,
        hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasKey: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      };
      console.log("Config:", config);
    } catch (err) {
      console.error("Config error:", err);
      status = "Config error: " + err;
    }
  }

  async function checkSession() {
    try {
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();
      session = currentSession;
      console.log("Session check:", { hasSession: !!session, error });
      status = error
        ? `Session error: ${error.message}`
        : "Session check complete";
    } catch (err) {
      console.error("Session error:", err);
      status = "Session error: " + err;
    }
  }

  async function testMagicLink() {
    const testEmail = "jdpinetta@gmail.com"; // Use your actual email
    status = "Sending magic link...";

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: testEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        status = `Magic link error: ${error.message}`;
        console.error("Magic link error:", error);
      } else {
        status = "Magic link sent successfully!";
        console.log("Magic link sent successfully");
      }
    } catch (err) {
      status = `Unexpected error: ${err}`;
      console.error("Unexpected error:", err);
    }
  }

  async function clearSession() {
    await supabase.auth.signOut();
    await checkSession();
    status = "Session cleared";
  }
</script>

<svelte:head>
  <title>Simple Auth Test</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-2xl">
  <h1 class="text-2xl font-bold mb-6">Simple Auth Test</h1>

  <div class="space-y-4">
    <Card class="p-4">
      <h2 class="text-lg font-semibold mb-2">Status</h2>
      <p class="text-sm">{status}</p>
    </Card>

    <Card class="p-4">
      <h2 class="text-lg font-semibold mb-2">Configuration</h2>
      <div class="space-y-1 text-sm">
        <p><strong>URL:</strong> {config.hasUrl ? "✅ Set" : "❌ Missing"}</p>
        <p><strong>Key:</strong> {config.hasKey ? "✅ Set" : "❌ Missing"}</p>
        <p><strong>Key Length:</strong> {config.keyLength} characters</p>
      </div>
    </Card>

    <Card class="p-4">
      <h2 class="text-lg font-semibold mb-2">Session</h2>
      <div class="space-y-1 text-sm">
        <p><strong>Has Session:</strong> {session ? "✅ Yes" : "❌ No"}</p>
        {#if session?.user}
          <p><strong>User:</strong> {session.user.email}</p>
        {/if}
      </div>
    </Card>

    <Card class="p-4">
      <h2 class="text-lg font-semibold mb-2">Actions</h2>
      <div class="space-x-2">
        <Button on:click={testMagicLink} size="sm">Test Magic Link</Button>
        <Button on:click={clearSession} variant="outline" size="sm">
          Clear Session
        </Button>
        <Button on:click={checkSession} variant="outline" size="sm">
          Check Session
        </Button>
      </div>
    </Card>

    <Card class="p-4">
      <h2 class="text-lg font-semibold mb-2">Raw Data</h2>
      <details class="text-sm">
        <summary class="cursor-pointer">Click to expand</summary>
        <pre class="mt-2 bg-gray-100 p-2 rounded overflow-auto text-xs">
Config: {JSON.stringify(config, null, 2)}
Session: {JSON.stringify(session, null, 2)}
        </pre>
      </details>
    </Card>
  </div>
</div>
