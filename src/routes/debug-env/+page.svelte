<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import Card from "$lib/components/ui/card.svelte";

  let envVars = {};
  let supabaseConfig = {};

  onMount(() => {
    // Get all VITE_ environment variables
    envVars = {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_PUBLISHABLE_KEY: import.meta.env.VITE_PUBLISHABLE_KEY,
      VITE_SUPABASE_SERVICE_ROLE_KEY: import.meta.env
        .VITE_SUPABASE_SERVICE_ROLE_KEY,
      VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
    };

    // Get Supabase client config from environment variables
    supabaseConfig = {
      url: import.meta.env.VITE_SUPABASE_URL,
      key: import.meta.env.VITE_PUBLISHABLE_KEY
        ? `${import.meta.env.VITE_PUBLISHABLE_KEY.substring(0, 20)}...`
        : "undefined",
    };
  });
</script>

<svelte:head>
  <title>Environment Debug - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-4xl">
  <h1 class="text-2xl font-bold mb-6">Environment Variables Debug</h1>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <Card class="p-4">
      <h2 class="text-lg font-semibold mb-4">Environment Variables</h2>
      <div class="space-y-2 text-sm">
        {#each Object.entries(envVars) as [key, value]}
          <div class="flex justify-between">
            <strong>{key}:</strong>
            <span class="font-mono text-xs">
              {value
                ? value.toString().length > 50
                  ? value.toString().substring(0, 50) + "..."
                  : value
                : "❌ Not set"}
            </span>
          </div>
        {/each}
      </div>
    </Card>

    <Card class="p-4">
      <h2 class="text-lg font-semibold mb-4">Supabase Client Config</h2>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <strong>URL:</strong>
          <span class="font-mono text-xs">{supabaseConfig.url}</span>
        </div>
        <div class="flex justify-between">
          <strong>Key:</strong>
          <span class="font-mono text-xs">{supabaseConfig.key}</span>
        </div>
      </div>
    </Card>
  </div>

  <Card class="p-4 mt-6">
    <h2 class="text-lg font-semibold mb-4">Test Magic Link</h2>
    <div class="space-y-4">
      <p class="text-sm text-gray-600">
        Current domain: <strong
          >{typeof window !== "undefined"
            ? window.location.origin
            : "Server"}</strong
        >
      </p>
      <button
        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        on:click={() => {
          supabase.auth
            .signInWithOtp({
              email: "jdpinetta@gmail.com",
              options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
              },
            })
            .then(({ error }) => {
              if (error) {
                alert(`Error: ${error.message}`);
              } else {
                alert("Magic link sent!");
              }
            });
        }}
      >
        Test Magic Link
      </button>
    </div>
  </Card>
</div>
