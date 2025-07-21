<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";

  let connectionStatus = "Testing...";
  let sampleData: any[] = [];
  let error = "";

  onMount(async () => {
    try {
      // Test basic connection by fetching personas
      const { data: personas, error: personasError } = await supabase
        .from("personas")
        .select("*")
        .limit(3);

      if (personasError) {
        throw personasError;
      }

      connectionStatus = "✅ Connected!";
      sampleData = personas || [];

      // Also test fetching modules
      const { data: modules, error: modulesError } = await supabase
        .from("modules")
        .select("*")
        .limit(3);

      if (!modulesError && modules) {
        sampleData = [...sampleData, ...modules];
      }
    } catch (err: any) {
      connectionStatus = "❌ Connection Failed";
      error = err.message || "Unknown error";
      console.error("Database connection test failed:", err);
    }
  });
</script>

<svelte:head>
  <title>Database Test - BigStepLabs</title>
</svelte:head>

<div class="min-h-screen bg-background p-8">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold text-foreground mb-8">
      🧪 Database Connection Test
    </h1>

    <div class="bg-card p-6 rounded-lg border shadow-sm mb-6">
      <h2 class="text-xl font-semibold mb-4">Connection Status</h2>
      <p class="text-lg mb-2">{connectionStatus}</p>

      {#if error}
        <div
          class="bg-destructive/10 border border-destructive/20 rounded-md p-3 mt-4"
        >
          <p class="text-destructive text-sm font-medium">Error Details:</p>
          <p class="text-destructive text-sm">{error}</p>
        </div>
      {/if}
    </div>

    {#if sampleData.length > 0}
      <div class="bg-card p-6 rounded-lg border shadow-sm">
        <h2 class="text-xl font-semibold mb-4">Sample Data</h2>
        <p class="text-muted-foreground mb-4">
          Here's some data from your database:
        </p>

        <div class="space-y-4">
          {#each sampleData as item}
            <div class="bg-muted/50 rounded-md p-4">
              <h3 class="font-medium text-foreground">
                {item.name || item.title}
              </h3>
              <p class="text-sm text-muted-foreground mt-1">
                {item.description || "No description"}
              </p>
              <div class="text-xs text-muted-foreground mt-2">
                ID: {item.id} | Created: {new Date(
                  item.created_at
                ).toLocaleDateString()}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <div class="mt-8 text-center">
      <a
        href="/dashboard"
        class="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
      >
        ← Back to Dashboard
      </a>
    </div>
  </div>
</div>
