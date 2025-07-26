<script lang="ts">
  import { onMount } from "svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import { CheckCircle, XCircle, AlertTriangle } from "lucide-svelte";

  let envStatus = {
    loading: true,
    hasUrl: false,
    hasAnonKey: false,
    hasServiceKey: false,
    url: "",
    anonKeyLength: 0,
    serviceKeyLength: 0,
    error: "",
  };

  async function checkEnvironment() {
    try {
      const response = await fetch("/api/debug-env");
      const data = await response.json();

      envStatus = {
        loading: false,
        hasUrl: data.hasUrl,
        hasAnonKey: data.hasAnonKey,
        hasServiceKey: data.hasServiceKey,
        url: data.VITE_SUPABASE_URL || "",
        anonKeyLength: data.anonKeyLength,
        serviceKeyLength: data.serviceKeyLength,
        error: "",
      };
    } catch (error) {
      envStatus = {
        loading: false,
        hasUrl: false,
        hasAnonKey: false,
        hasServiceKey: false,
        url: "",
        anonKeyLength: 0,
        serviceKeyLength: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  onMount(() => {
    checkEnvironment();
  });
</script>

<svelte:head>
  <title>Environment Check - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-2xl">
  <h1 class="text-2xl font-bold mb-6">Environment Variables Check</h1>

  <Card class="p-6">
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Supabase Configuration</h2>
        <Button on:click={checkEnvironment} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {#if envStatus.loading}
        <div class="text-center py-8">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"
          ></div>
          <p class="mt-2 text-muted-foreground">
            Checking environment variables...
          </p>
        </div>
      {:else}
        <div class="space-y-3">
          <!-- VITE_SUPABASE_URL -->
          <div class="flex items-center space-x-3 p-3 rounded-lg border">
            <div class="flex-shrink-0">
              {#if envStatus.hasUrl}
                <CheckCircle class="w-5 h-5 text-green-600" />
              {:else}
                <XCircle class="w-5 h-5 text-red-600" />
              {/if}
            </div>
            <div class="flex-1">
              <div class="font-medium">VITE_SUPABASE_URL</div>
              <div class="text-sm text-muted-foreground">
                {envStatus.hasUrl ? envStatus.url : "Missing"}
              </div>
            </div>
          </div>

          <!-- VITE_SUPABASE_ANON_KEY -->
          <div class="flex items-center space-x-3 p-3 rounded-lg border">
            <div class="flex-shrink-0">
              {#if envStatus.hasAnonKey}
                <CheckCircle class="w-5 h-5 text-green-600" />
              {:else}
                <XCircle class="w-5 h-5 text-red-600" />
              {/if}
            </div>
            <div class="flex-1">
              <div class="font-medium">VITE_SUPABASE_ANON_KEY</div>
              <div class="text-sm text-muted-foreground">
                {envStatus.hasAnonKey
                  ? `Set (${envStatus.anonKeyLength} characters)`
                  : "Missing"}
              </div>
            </div>
          </div>

          <!-- SUPABASE_SERVICE_ROLE_KEY -->
          <div class="flex items-center space-x-3 p-3 rounded-lg border">
            <div class="flex-shrink-0">
              {#if envStatus.hasServiceKey}
                <CheckCircle class="w-5 h-5 text-green-600" />
              {:else}
                <XCircle class="w-5 h-5 text-red-600" />
              {/if}
            </div>
            <div class="flex-1">
              <div class="font-medium">SUPABASE_SERVICE_ROLE_KEY</div>
              <div class="text-sm text-muted-foreground">
                {envStatus.hasServiceKey
                  ? `Set (${envStatus.serviceKeyLength} characters)`
                  : "Missing"}
              </div>
            </div>
          </div>
        </div>

        {#if envStatus.error}
          <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center space-x-2">
              <XCircle class="w-4 h-4 text-red-600" />
              <span class="text-red-800 font-medium">Error:</span>
            </div>
            <p class="text-red-700 text-sm mt-1">{envStatus.error}</p>
          </div>
        {/if}

        <!-- Status Summary -->
        <div
          class="mt-6 p-4 rounded-lg {envStatus.hasUrl &&
          envStatus.hasAnonKey &&
          envStatus.hasServiceKey
            ? 'bg-green-50 border border-green-200'
            : 'bg-yellow-50 border border-yellow-200'}"
        >
          <div class="flex items-center space-x-2">
            {#if envStatus.hasUrl && envStatus.hasAnonKey && envStatus.hasServiceKey}
              <CheckCircle class="w-5 h-5 text-green-600" />
              <span class="font-medium text-green-800"
                >All environment variables are configured!</span
              >
            {:else}
              <AlertTriangle class="w-5 h-5 text-yellow-600" />
              <span class="font-medium text-yellow-800"
                >Missing required environment variables</span
              >
            {/if}
          </div>

          {#if !envStatus.hasUrl || !envStatus.hasAnonKey || !envStatus.hasServiceKey}
            <div class="mt-2 text-sm text-yellow-700">
              <p>
                To fix this, create a <code class="bg-yellow-100 px-1 rounded"
                  >.env</code
                > file in your project root with:
              </p>
              <pre
                class="mt-2 bg-yellow-100 p-2 rounded text-xs overflow-x-auto">
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key</pre>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </Card>

  <div class="mt-6">
    <a href="/admin/users" class="text-primary hover:underline">
      ← Back to User Management
    </a>
  </div>
</div>
