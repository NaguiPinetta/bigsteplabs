<script lang="ts">
  import { onMount } from "svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import {
    AlertCircle,
    CheckCircle,
    Loader2,
    RefreshCw,
    Database,
  } from "lucide-svelte";

  let checkResults: any = null;
  let loading = false;

  async function checkConstraints() {
    loading = true;
    checkResults = null;

    try {
      const response = await fetch("/api/check-constraints");
      const data = await response.json();
      checkResults = data;
    } catch (error) {
      checkResults = {
        error: "Failed to check constraints",
        details: error instanceof Error ? error.message : String(error),
      };
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    checkConstraints();
  });
</script>

<svelte:head>
  <title>Check Constraints - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-4xl">
  <h1 class="text-2xl font-bold mb-6">Foreign Key Constraints Check</h1>

  <div class="mb-6">
    <Button on:click={checkConstraints} disabled={loading}>
      <RefreshCw class="w-4 h-4 mr-2" />
      {loading ? "Checking..." : "Check Constraints"}
    </Button>
  </div>

  {#if loading}
    <Card class="p-6">
      <div class="flex items-center justify-center">
        <Loader2 class="w-6 h-6 animate-spin mr-2" />
        <span>Checking foreign key constraints...</span>
      </div>
    </Card>
  {:else if checkResults}
    <div class="space-y-6">
      <!-- Summary -->
      <Card class="p-6">
        <h2 class="text-lg font-semibold mb-4">Summary</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">
              {checkResults.summary?.chatConstraintsCount || 0}
            </div>
            <div class="text-sm text-muted-foreground">Chat Constraints</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">
              {checkResults.summary?.agentConstraintsCount || 0}
            </div>
            <div class="text-sm text-muted-foreground">Agent Constraints</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">
              {checkResults.summary?.refConstraintsCount || 0}
            </div>
            <div class="text-sm text-muted-foreground">Ref Constraints</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">
              {checkResults.summary?.sessionsWithAgentsCount || 0}
            </div>
            <div class="text-sm text-muted-foreground">
              Sessions with Agents
            </div>
          </div>
        </div>
      </Card>

      <!-- Referential Constraints -->
      <Card class="p-6">
        <h2 class="text-lg font-semibold mb-4">
          Referential Constraints (Delete Rules)
        </h2>
        {#if checkResults.refConstraints && checkResults.refConstraints.length > 0}
          <div class="space-y-2">
            {#each checkResults.refConstraints as constraint}
              <div
                class="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p class="font-medium">{constraint.constraint_name}</p>
                  <p class="text-sm text-muted-foreground">
                    Delete Rule: <span class="font-mono"
                      >{constraint.delete_rule}</span
                    >
                    | Update Rule:
                    <span class="font-mono">{constraint.update_rule}</span>
                  </p>
                </div>
                <div class="flex items-center space-x-2">
                  {#if constraint.delete_rule === "CASCADE"}
                    <CheckCircle class="w-5 h-5 text-green-600" />
                    <span class="text-sm text-green-600">CASCADE</span>
                  {:else}
                    <AlertCircle class="w-5 h-5 text-red-600" />
                    <span class="text-sm text-red-600"
                      >{constraint.delete_rule}</span
                    >
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-muted-foreground">No referential constraints found</p>
        {/if}
      </Card>

      <!-- Sessions with Agents -->
      <Card class="p-6">
        <h2 class="text-lg font-semibold mb-4">
          Chat Sessions with Agent References
        </h2>
        {#if checkResults.sessionsWithAgents && checkResults.sessionsWithAgents.length > 0}
          <div class="space-y-2">
            {#each checkResults.sessionsWithAgents as session}
              <div
                class="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p class="font-medium">Session ID: {session.id}</p>
                  <p class="text-sm text-muted-foreground">
                    Agent ID: {session.agent_id} | Title: {session.title ||
                      "Untitled"}
                  </p>
                </div>
                <Database class="w-5 h-5 text-blue-600" />
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-muted-foreground">
            No sessions with agent references found
          </p>
        {/if}
      </Card>

      <!-- Error Display -->
      {#if checkResults.error}
        <Card class="p-6 border-destructive">
          <h2 class="text-lg font-semibold mb-4 text-destructive">
            Check Error
          </h2>
          <div
            class="p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
          >
            <p class="text-destructive font-medium">{checkResults.error}</p>
            {#if checkResults.details}
              <pre class="text-sm text-destructive mt-1">{JSON.stringify(
                  checkResults.details,
                  null,
                  2
                )}</pre>
            {/if}
          </div>
        </Card>
      {/if}

      <!-- Individual Errors -->
      {#if checkResults.errors}
        <Card class="p-6">
          <h2 class="text-lg font-semibold mb-4">Individual Errors</h2>
          <div class="space-y-2">
            {#each Object.entries(checkResults.errors) as [key, error]}
              {#if error}
                <div
                  class="p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
                >
                  <p class="text-destructive font-medium">{key}:</p>
                  <pre class="text-sm text-destructive mt-1">{JSON.stringify(
                      error,
                      null,
                      2
                    )}</pre>
                </div>
              {/if}
            {/each}
          </div>
        </Card>
      {/if}
    </div>
  {/if}
</div>
