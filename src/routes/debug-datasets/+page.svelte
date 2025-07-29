<script lang="ts">
  import { onMount } from "svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import {
    RefreshCw,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2,
  } from "lucide-svelte";

  let diagnostics: any = null;
  let loading = false;
  let error: string | null = null;

  async function runDiagnostics() {
    loading = true;
    error = null;

    try {
      console.log("🔍 Running dataset diagnostics...");
      const response = await fetch("/api/debug-datasets");
      const data = await response.json();

      if (response.ok) {
        diagnostics = data;
        console.log("✅ Diagnostics completed:", data);
      } else {
        error = data.error || "Failed to run diagnostics";
        console.error("❌ Diagnostics failed:", data);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Network error";
      console.error("❌ Error running diagnostics:", err);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    runDiagnostics();
  });

  function getStatusIcon(check: any) {
    if ((check as any).error) return XCircle;
    if (
      (check as any).exists ||
      (check as any).insert_allowed ||
      (check as any).authenticated
    )
      return CheckCircle;
    return AlertCircle;
  }

  function getStatusColor(check: any) {
    if ((check as any).error) return "text-destructive";
    if (
      (check as any).exists ||
      (check as any).insert_allowed ||
      (check as any).authenticated
    )
      return "text-green-600";
    return "text-yellow-600";
  }
</script>

<div class="container mx-auto p-6">
  <div class="max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Dataset Diagnostics</h1>
      <Button on:click={runDiagnostics} disabled={loading}>
        {#if loading}
          <Loader2 class="w-4 h-4 mr-2 animate-spin" />
        {:else}
          <RefreshCw class="w-4 h-4 mr-2" />
        {/if}
        Run Diagnostics
      </Button>
    </div>

    {#if error}
      <Card class="p-6 border-destructive mb-6">
        <div class="flex items-center">
          <XCircle class="w-5 h-5 text-destructive mr-2" />
          <span class="text-destructive font-medium">Error: {error}</span>
        </div>
      </Card>
    {/if}

    {#if diagnostics}
      <div class="space-y-4">
        <Card class="p-6">
          <h2 class="text-lg font-semibold mb-4">Database Tables</h2>
          <div class="space-y-3">
            {#each Object.entries(diagnostics.checks) as [checkName, check]}
              {#if ["datasets_table", "dataset_chunks_table", "content_chunks_table"].includes(checkName)}
                <div
                  class="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div class="flex items-center">
                    <svelte:component
                      this={getStatusIcon(check)}
                      class="w-5 h-5 mr-3 {getStatusColor(check)}"
                    />
                    <div>
                      <div class="font-medium">
                        {checkName
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </div>
                      <div class="text-sm text-muted-foreground">
                        {(check as any).exists
                          ? "Table exists"
                          : "Table missing"}
                        {#if (check as any).sample_data !== undefined}
                          • {(check as any).sample_data} records
                        {/if}
                      </div>
                    </div>
                  </div>
                  {#if (check as any).error}
                    <div class="text-sm text-destructive max-w-xs text-right">
                      {(check as any).error}
                    </div>
                  {/if}
                </div>
              {/if}
            {/each}
          </div>
        </Card>

        <Card class="p-6">
          <h2 class="text-lg font-semibold mb-4">Permissions & Context</h2>
          <div class="space-y-3">
            {#each Object.entries(diagnostics.checks) as [checkName, check]}
              {#if ["rls_policies", "storage_bucket", "user_context"].includes(checkName)}
                <div
                  class="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div class="flex items-center">
                    <svelte:component
                      this={getStatusIcon(check)}
                      class="w-5 h-5 mr-3 {getStatusColor(check)}"
                    />
                    <div>
                      <div class="font-medium">
                        {checkName
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </div>
                      <div class="text-sm text-muted-foreground">
                        {#if checkName === "rls_policies"}
                          {(check as any).insert_allowed
                            ? "Insert allowed"
                            : "Insert blocked"}
                        {:else if checkName === "storage_bucket"}
                          {(check as any).exists
                            ? "Bucket exists"
                            : "Bucket missing"}
                        {:else if checkName === "user_context"}
                          {(check as any).authenticated
                            ? "User authenticated"
                            : "User not authenticated"}
                          {#if (check as any).user_id}
                            • ID: {(check as any).user_id.substring(0, 8)}...
                          {/if}
                        {/if}
                      </div>
                    </div>
                  </div>
                  {#if (check as any).error}
                    <div class="text-sm text-destructive max-w-xs text-right">
                      {(check as any).error}
                    </div>
                  {/if}
                </div>
              {/if}
            {/each}
          </div>
        </Card>

        <Card class="p-6">
          <h2 class="text-lg font-semibold mb-4">Summary</h2>
          <div class="text-sm text-muted-foreground">
            <p>
              <strong>Timestamp:</strong>
              {new Date(diagnostics.timestamp).toLocaleString()}
            </p>
            <p class="mt-2">
              This diagnostic tool checks for common dataset-related issues
              including:
            </p>
            <ul class="list-disc list-inside mt-2 space-y-1">
              <li>Database table existence and structure</li>
              <li>Row Level Security (RLS) policies</li>
              <li>Storage bucket configuration</li>
              <li>User authentication context</li>
            </ul>
          </div>
        </Card>
      </div>
    {:else if loading}
      <Card class="p-12 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p class="text-muted-foreground">Running dataset diagnostics...</p>
      </Card>
    {/if}
  </div>
</div>
