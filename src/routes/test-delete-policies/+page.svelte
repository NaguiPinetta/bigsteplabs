<script lang="ts">
  import { onMount } from "svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import { Trash2, AlertCircle, CheckCircle, Loader2, RefreshCw } from "lucide-svelte";

  let testResults: any = null;
  let loading = false;

  async function testDeletePolicies() {
    loading = true;
    testResults = null;

    try {
      const response = await fetch("/api/test-delete-policies");
      const data = await response.json();
      testResults = data;
    } catch (error) {
      testResults = {
        error: "Failed to test policies",
        details: error instanceof Error ? error.message : String(error),
      };
    } finally {
      loading = false;
    }
  }

  function getStatusIcon(success: boolean | null) {
    if (success === null) return Loader2;
    return success ? CheckCircle : AlertCircle;
  }

  function getStatusColor(success: boolean | null) {
    if (success === null) return "text-blue-600";
    return success ? "text-green-600" : "text-red-600";
  }

  onMount(() => {
    testDeletePolicies();
  });
</script>

<svelte:head>
  <title>Delete Policies Test - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-4xl">
  <h1 class="text-2xl font-bold mb-6">Delete Policies Test</h1>

  <div class="mb-6">
    <Button on:click={testDeletePolicies} disabled={loading}>
      <RefreshCw class="w-4 h-4 mr-2" />
      {loading ? "Testing..." : "Test Delete Policies"}
    </Button>
  </div>

  {#if loading}
    <Card class="p-6">
      <div class="flex items-center justify-center">
        <Loader2 class="w-6 h-6 animate-spin mr-2" />
        <span>Testing delete policies...</span>
      </div>
    </Card>
  {:else if testResults}
    <div class="space-y-6">
      <!-- Summary -->
      <Card class="p-6">
        <h2 class="text-lg font-semibold mb-4">Test Summary</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center space-x-2">
            <svelte:component this={getStatusIcon(testResults.summary?.sessionsAvailable)} class="w-5 h-5 {getStatusColor(testResults.summary?.sessionsAvailable)}" />
            <span>Sessions Available: {testResults.summary?.sessionsAvailable ? "Yes" : "No"}</span>
          </div>
          <div class="flex items-center space-x-2">
            <svelte:component this={getStatusIcon(testResults.summary?.agentsAvailable)} class="w-5 h-5 {getStatusColor(testResults.summary?.agentsAvailable)}" />
            <span>Agents Available: {testResults.summary?.agentsAvailable ? "Yes" : "No"}</span>
          </div>
          <div class="flex items-center space-x-2">
            <svelte:component this={getStatusIcon(testResults.summary?.sessionDeleteSuccess)} class="w-5 h-5 {getStatusColor(testResults.summary?.sessionDeleteSuccess)}" />
            <span>Session Delete: {testResults.summary?.sessionDeleteSuccess ? "Success" : "Failed"}</span>
          </div>
          <div class="flex items-center space-x-2">
            <svelte:component this={getStatusIcon(testResults.summary?.agentDeleteSuccess)} class="w-5 h-5 {getStatusColor(testResults.summary?.agentDeleteSuccess)}" />
            <span>Agent Delete: {testResults.summary?.agentDeleteSuccess ? "Success" : "Failed"}</span>
          </div>
        </div>
      </Card>

      <!-- User Info -->
      <Card class="p-6">
        <h2 class="text-lg font-semibold mb-4">User Information</h2>
        <p><strong>User ID:</strong> {testResults.user || "Not available"}</p>
      </Card>

      <!-- Sessions -->
      <Card class="p-6">
        <h2 class="text-lg font-semibold mb-4">Available Sessions ({testResults.sessions?.length || 0})</h2>
        {#if testResults.sessions && testResults.sessions.length > 0}
          <div class="space-y-2">
            {#each testResults.sessions as session}
              <div class="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p class="font-medium">ID: {session.id}</p>
                  <p class="text-sm text-muted-foreground">
                    Title: {session.title || "Untitled"} | Messages: {session.message_count || 0}
                  </p>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-muted-foreground">No sessions found</p>
        {/if}
      </Card>

      <!-- Agents -->
      <Card class="p-6">
        <h2 class="text-lg font-semibold mb-4">Available Agents ({testResults.agents?.length || 0})</h2>
        {#if testResults.agents && testResults.agents.length > 0}
          <div class="space-y-2">
            {#each testResults.agents as agent}
              <div class="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p class="font-medium">ID: {agent.id}</p>
                  <p class="text-sm text-muted-foreground">
                    Name: {agent.name} | Status: {agent.status}
                  </p>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-muted-foreground">No agents found</p>
        {/if}
      </Card>

      <!-- Session Delete Result -->
      {#if testResults.sessionDelete}
        <Card class="p-6">
          <h2 class="text-lg font-semibold mb-4">Session Delete Test</h2>
          <div class="space-y-2">
            <p><strong>Session ID:</strong> {testResults.sessionDelete.sessionId}</p>
            <p><strong>Success:</strong> {testResults.sessionDelete.success ? "Yes" : "No"}</p>
            <p><strong>Count Deleted:</strong> {testResults.sessionDelete.count || 0}</p>
            {#if testResults.sessionDelete.error}
              <div class="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p class="text-destructive font-medium">Error:</p>
                <pre class="text-sm text-destructive mt-1">{JSON.stringify(testResults.sessionDelete.error, null, 2)}</pre>
              </div>
            {/if}
          </div>
        </Card>
      {/if}

      <!-- Agent Delete Result -->
      {#if testResults.agentDelete}
        <Card class="p-6">
          <h2 class="text-lg font-semibold mb-4">Agent Delete Test</h2>
          <div class="space-y-2">
            <p><strong>Agent ID:</strong> {testResults.agentDelete.agentId}</p>
            <p><strong>Success:</strong> {testResults.agentDelete.success ? "Yes" : "No"}</p>
            <p><strong>Count Deleted:</strong> {testResults.agentDelete.count || 0}</p>
            {#if testResults.agentDelete.error}
              <div class="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p class="text-destructive font-medium">Error:</p>
                <pre class="text-sm text-destructive mt-1">{JSON.stringify(testResults.agentDelete.error, null, 2)}</pre>
              </div>
            {/if}
          </div>
        </Card>
      {/if}

      <!-- Error Display -->
      {#if testResults.error}
        <Card class="p-6 border-destructive">
          <h2 class="text-lg font-semibold mb-4 text-destructive">Test Error</h2>
          <div class="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p class="text-destructive font-medium">{testResults.error}</p>
            {#if testResults.details}
              <pre class="text-sm text-destructive mt-1">{JSON.stringify(testResults.details, null, 2)}</pre>
            {/if}
          </div>
        </Card>
      {/if}
    </div>
  {/if}
</div> 