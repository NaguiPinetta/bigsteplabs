<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import Card from "$lib/components/ui/card.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import { CheckCircle, XCircle, AlertCircle } from "lucide-svelte";

  let configStatus = "Checking...";
  let connectionStatus = "Checking...";
  let authStatus = "Checking...";
  let email = "jdpinetta@gmail.com";

  onMount(async () => {
    await checkConfiguration();
  });

  async function checkConfiguration() {
    try {
      // Check environment variables
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_PUBLISHABLE_KEY;

      if (!url || url === "https://placeholder.supabase.co") {
        configStatus = "❌ VITE_SUPABASE_URL not set";
        return;
      }

      if (!key || key === "placeholder-key") {
        configStatus = "❌ VITE_PUBLISHABLE_KEY not set";
        return;
      }

      configStatus = "✅ Environment variables configured";

      // Test connection
      const { data, error } = await supabase
        .from("users")
        .select("count")
        .limit(1);

      if (error) {
        connectionStatus = `❌ Connection failed: ${error.message}`;
      } else {
        connectionStatus = "✅ Database connection successful";
      }

      // Test auth
      const { data: authData, error: authError } =
        await supabase.auth.getSession();

      if (authError) {
        authStatus = `❌ Auth failed: ${authError.message}`;
      } else {
        authStatus = "✅ Authentication configured";
      }
    } catch (error) {
      configStatus = `❌ Configuration error: ${error.message}`;
    }
  }

  async function testMagicLink() {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        authStatus = `❌ Magic link failed: ${error.message}`;
      } else {
        authStatus = "✅ Magic link sent successfully";
      }
    } catch (error) {
      authStatus = `❌ Magic link error: ${error.message}`;
    }
  }
</script>

<svelte:head>
  <title>Production Config Test - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-2xl">
  <h1 class="text-2xl font-bold mb-6">Production Configuration Test</h1>

  <div class="space-y-4">
    <Card class="p-4">
      <h2 class="text-lg font-semibold mb-4">Configuration Status</h2>

      <div class="space-y-3">
        <div class="flex items-center space-x-2">
          {#if configStatus.startsWith("✅")}
            <CheckCircle class="w-5 h-5 text-green-500" />
          {:else if configStatus.startsWith("❌")}
            <XCircle class="w-5 h-5 text-red-500" />
          {:else}
            <AlertCircle class="w-5 h-5 text-yellow-500" />
          {/if}
          <span class="font-medium">Environment Variables:</span>
          <span class="text-sm">{configStatus}</span>
        </div>

        <div class="flex items-center space-x-2">
          {#if connectionStatus.startsWith("✅")}
            <CheckCircle class="w-5 h-5 text-green-500" />
          {:else if connectionStatus.startsWith("❌")}
            <XCircle class="w-5 h-5 text-red-500" />
          {:else}
            <AlertCircle class="w-5 h-5 text-yellow-500" />
          {/if}
          <span class="font-medium">Database Connection:</span>
          <span class="text-sm">{connectionStatus}</span>
        </div>

        <div class="flex items-center space-x-2">
          {#if authStatus.startsWith("✅")}
            <CheckCircle class="w-5 h-5 text-green-500" />
          {:else if authStatus.startsWith("❌")}
            <XCircle class="w-5 h-5 text-red-500" />
          {:else}
            <AlertCircle class="w-5 h-5 text-yellow-500" />
          {/if}
          <span class="font-medium">Authentication:</span>
          <span class="text-sm">{authStatus}</span>
        </div>
      </div>

      <div class="mt-4 pt-4 border-t">
        <label for="email" class="block text-sm font-medium mb-2"
          >Test Email</label
        >
        <div class="flex space-x-2">
          <input
            id="email"
            type="email"
            bind:value={email}
            class="flex-1 px-3 py-2 border rounded-md"
            placeholder="test@example.com"
          />
          <Button on:click={testMagicLink} size="sm">Test Magic Link</Button>
        </div>
      </div>
    </Card>

    <Card class="p-4">
      <h2 class="text-lg font-semibold mb-4">Environment Variables</h2>
      <div class="space-y-2 text-sm">
        <div>
          <strong>VITE_SUPABASE_URL:</strong>
          {import.meta.env.VITE_SUPABASE_URL ? "✅ Set" : "❌ Not set"}
        </div>
        <div>
          <strong>VITE_PUBLISHABLE_KEY:</strong>
          {import.meta.env.VITE_PUBLISHABLE_KEY ? "✅ Set" : "❌ Not set"}
        </div>
      </div>
    </Card>
  </div>
</div>
