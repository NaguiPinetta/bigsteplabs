<script lang="ts">
  import { onMount } from "svelte";
  import { authStore, isAdmin } from "$lib/stores/auth";
  import {
    workbenchStore,
    loadActiveAgents,
    testAgent,
    compareAgents,
    runBatchTest,
    getAgentAnalytics,
    clearTestResults,
    clearWorkbenchError,
    setSelectedAgents,
    exportTestResults,
  } from "$lib/stores/workbench";

  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Select from "$lib/components/ui/select.svelte";
  import Textarea from "$lib/components/ui/textarea.svelte";
  import {
    TestTube,
    Play,
    BarChart3,
    Download,
    Trash2,
    Settings,
    Loader2,
    AlertCircle,
    CheckCircle,
    Clock,
    Zap,
    Target,
    Bot,
    Users,
    TrendingUp,
    Activity,
    GitCompare,
    FileText,
  } from "lucide-svelte";

  let activeTab = "test"; // 'test', 'compare', 'batch', 'analytics'
  let testPrompt = "";
  let selectedAgentId = "";
  let batchPrompts = "";
  let showResults = false;
  let exportDialogOpen = false;

  let analytics: any = {};
  let loadingAnalytics = false;

  $: user = $authStore.user;
  $: isAdminUser = isAdmin();
  $: state = $workbenchStore;
  $: agents = state.activeAgents;
  $: testResults = state.testResults;
  $: comparisons = state.comparisons;
  $: selectedAgents = state.selectedAgents;

  // Debug logging for state changes
  $: console.log("🔄 Workbench state changed:", {
    loading: state.loading,
    error: state.error,
    agentsCount: agents?.length || 0,
    isAdminUser,
    user: user?.email,
  });

  onMount(async () => {
    console.log("🔄 Workbench onMount: Starting...");
    console.log("🔄 Workbench onMount: User:", user);
    console.log("🔄 Workbench onMount: isAdminUser:", isAdminUser);

    // Temporarily bypass admin check for debugging
    console.log("🔄 Workbench onMount: Bypassing admin check for debugging...");
    await loadActiveAgents();
    loadAnalytics();

    // Original code (commented out for debugging):
    // if (isAdminUser) {
    //   console.log("🔄 Workbench onMount: User is admin, loading agents...");
    //   await loadActiveAgents();
    //   loadAnalytics();
    // } else {
    //   console.log("⚠️ Workbench onMount: User is not admin, cannot load agents");
    //   console.log("⚠️ Workbench onMount: User role:", user?.role);
    // }
  });

  async function loadAnalytics() {
    loadingAnalytics = true;
    analytics = await getAgentAnalytics();
    loadingAnalytics = false;
  }

  async function handleSingleTest() {
    if (!selectedAgentId || !testPrompt.trim()) return;

    await testAgent(selectedAgentId, testPrompt.trim());
    testPrompt = "";
    showResults = true;
    loadAnalytics();
  }

  async function handleComparison() {
    if (selectedAgents.length < 2 || !testPrompt.trim()) return;

    await compareAgents(selectedAgents, testPrompt.trim());
    testPrompt = "";
    showResults = true;
    loadAnalytics();
  }

  async function handleBatchTest() {
    if (selectedAgents.length === 0 || !batchPrompts.trim()) return;

    const prompts = batchPrompts
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (prompts.length === 0) return;

    await runBatchTest(selectedAgents, prompts);
    batchPrompts = "";
    showResults = true;
    loadAnalytics();
  }

  function handleAgentSelection(agentId: string, checked: boolean) {
    const newSelection = checked
      ? [...selectedAgents, agentId]
      : selectedAgents.filter((id) => id !== agentId);

    setSelectedAgents(newSelection);
  }

  async function handleExport() {
    const csv = await exportTestResults();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workbench-results-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    exportDialogOpen = false;
  }

  function formatTime(ms: number): string {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function getSuccessRateColor(rate: number): string {
    if (rate >= 90) return "text-green-600";
    if (rate >= 70) return "text-yellow-600";
    return "text-red-600";
  }

  function getResponseTimeColor(time: number): string {
    if (time <= 1000) return "text-green-600";
    if (time <= 3000) return "text-yellow-600";
    return "text-red-600";
  }
</script>

<svelte:head>
  <title>AI Workbench - BigStepLabs</title>
  <meta name="description" content="Test and analyze AI agent performance" />
</svelte:head>

<!-- Page Header -->
<div class="mb-8 flex items-center justify-between">
  <div>
    <h1 class="text-2xl font-bold text-foreground">AI Agent Workbench</h1>
    <p class="text-muted-foreground">
      Test, compare, and analyze your AI agents' performance
    </p>
  </div>

  <div class="flex space-x-2">
    <Button
      variant="outline"
      on:click={() => (exportDialogOpen = true)}
      disabled={testResults.length === 0}
    >
      <Download class="w-4 h-4 mr-2" />
      Export Results
    </Button>
    <Button
      variant="outline"
      on:click={clearTestResults}
      disabled={testResults.length === 0}
    >
      <Trash2 class="w-4 h-4 mr-2" />
      Clear Results
    </Button>
  </div>
</div>

<div class="max-w-7xl mx-auto">
  {#if !isAdminUser}
    <Card class="p-8 text-center">
      <h2 class="text-xl font-semibold mb-2">Admin Access Required</h2>
      <p class="text-muted-foreground">
        The AI Workbench is only available to system administrators.
      </p>
    </Card>
  {:else if state.loading}
    <div class="flex flex-col items-center justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-primary mb-4" />
      <span class="text-muted-foreground mb-4">Loading workbench...</span>
      <Button
        variant="outline"
        on:click={() => {
          console.log("🔄 Manually resetting workbench loading state");
          workbenchStore.update((state) => ({
            ...state,
            loading: false,
            error: null,
          }));
        }}
      >
        Reset Loading State
      </Button>
    </div>
  {:else if state.error}
    <Card class="p-6 border-destructive">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <AlertCircle class="w-5 h-5 text-destructive mr-2" />
          <span class="text-destructive font-medium">Error: {state.error}</span>
        </div>
        <Button variant="outline" on:click={clearWorkbenchError}>
          Dismiss
        </Button>
      </div>
    </Card>
  {:else}
    <!-- Tab Navigation -->
    <div class="flex space-x-1 bg-muted p-1 rounded-lg mb-8">
      <button
        class={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
          activeTab === "test"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        on:click={() => (activeTab = "test")}
      >
        <TestTube class="w-4 h-4 inline mr-2" />
        Single Test
      </button>
      <button
        class={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
          activeTab === "compare"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        on:click={() => (activeTab = "compare")}
      >
        <GitCompare class="w-4 h-4 inline mr-2" />
        Compare Agents
      </button>
      <button
        class={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
          activeTab === "batch"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        on:click={() => (activeTab = "batch")}
      >
        <Target class="w-4 h-4 inline mr-2" />
        Batch Testing
      </button>
      <button
        class={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
          activeTab === "analytics"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        on:click={() => {
          activeTab = "analytics";
          loadAnalytics();
        }}
      >
        <BarChart3 class="w-4 h-4 inline mr-2" />
        Analytics
      </button>
    </div>

    <!-- Tab Content -->
    {#if activeTab === "test"}
      <!-- Single Agent Test -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2">
          <Card class="p-6">
            <h3 class="text-lg font-semibold mb-4">Test Single Agent</h3>

            <div class="space-y-4">
              <!-- Agent Selection -->
              <div>
                <label class="block text-sm font-medium mb-2"
                  >Select Agent</label
                >
                <Select
                  bind:value={selectedAgentId}
                  placeholder="Choose an agent..."
                  options={agents.map((agent) => ({
                    value: agent.id,
                    label: `${agent.name} (${agent.persona?.response_style})`,
                  }))}
                />
              </div>

              <!-- Test Prompt -->
              <div>
                <label class="block text-sm font-medium mb-2">Test Prompt</label
                >
                <Textarea
                  bind:value={testPrompt}
                  placeholder="Enter your test prompt here..."
                  rows={4}
                />
              </div>

              <Button
                on:click={handleSingleTest}
                disabled={!selectedAgentId ||
                  !testPrompt.trim() ||
                  state.testing}
                class="w-full"
              >
                {#if state.testing}
                  <Loader2 class="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                {:else}
                  <Play class="w-4 h-4 mr-2" />
                  Run Test
                {/if}
              </Button>
            </div>
          </Card>
        </div>

        <div>
          <Card class="p-6">
            <h3 class="text-lg font-semibold mb-4">Agent Details</h3>
            {#if selectedAgentId}
              {@const selectedAgent = agents.find(
                (a) => a.id === selectedAgentId
              )}
              {#if selectedAgent}
                <div class="space-y-3">
                  <div>
                    <span class="text-sm font-medium">Name:</span>
                    <p class="text-muted-foreground">{selectedAgent.name}</p>
                  </div>
                  <div>
                    <span class="text-sm font-medium">Persona:</span>
                    <p class="text-muted-foreground">
                      {selectedAgent.persona?.name} ({selectedAgent.persona
                        ?.response_style})
                    </p>
                  </div>
                  <div>
                    <span class="text-sm font-medium">Model:</span>
                    <p class="text-muted-foreground">
                      {selectedAgent.model?.name} ({selectedAgent.model
                        ?.provider})
                    </p>
                  </div>
                  {#if selectedAgent.dataset}
                    <div>
                      <span class="text-sm font-medium">Dataset:</span>
                      <p class="text-muted-foreground">
                        {selectedAgent.dataset.name}
                      </p>
                    </div>
                  {/if}
                </div>
              {/if}
            {:else}
              <p class="text-muted-foreground text-sm">
                Select an agent to see details
              </p>
            {/if}
          </Card>
        </div>
      </div>
    {:else if activeTab === "compare"}
      <!-- Agent Comparison -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2">
          <Card class="p-6">
            <h3 class="text-lg font-semibold mb-4">Compare Multiple Agents</h3>

            <div class="space-y-4">
              <!-- Agent Selection -->
              <div>
                <label class="block text-sm font-medium mb-3"
                  >Select Agents to Compare (minimum 2)</label
                >
                <div
                  class="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto"
                >
                  {#each agents as agent}
                    <label
                      class="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAgents.includes(agent.id)}
                        on:change={(e) =>
                          handleAgentSelection(
                            agent.id,
                            e.currentTarget.checked
                          )}
                        class="rounded border-input"
                      />
                      <div class="flex-1">
                        <p class="text-sm font-medium">{agent.name}</p>
                        <p class="text-xs text-muted-foreground">
                          {agent.persona?.response_style}
                        </p>
                      </div>
                    </label>
                  {/each}
                </div>
              </div>

              <!-- Test Prompt -->
              <div>
                <label class="block text-sm font-medium mb-2"
                  >Comparison Prompt</label
                >
                <Textarea
                  bind:value={testPrompt}
                  placeholder="Enter a prompt to test all selected agents..."
                  rows={4}
                />
              </div>

              <Button
                on:click={handleComparison}
                disabled={selectedAgents.length < 2 ||
                  !testPrompt.trim() ||
                  state.testing}
                class="w-full"
              >
                {#if state.testing}
                  <Loader2 class="w-4 h-4 mr-2 animate-spin" />
                  Comparing...
                {:else}
                  <GitCompare class="w-4 h-4 mr-2" />
                  Compare Agents ({selectedAgents.length})
                {/if}
              </Button>
            </div>
          </Card>
        </div>

        <div>
          <Card class="p-6">
            <h3 class="text-lg font-semibold mb-4">Selected Agents</h3>
            {#if selectedAgents.length === 0}
              <p class="text-muted-foreground text-sm">No agents selected</p>
            {:else}
              <div class="space-y-2">
                {#each selectedAgents as agentId}
                  {@const agent = agents.find((a) => a.id === agentId)}
                  {#if agent}
                    <div class="p-2 bg-muted rounded-md">
                      <p class="text-sm font-medium">{agent.name}</p>
                      <p class="text-xs text-muted-foreground">
                        {agent.persona?.response_style}
                      </p>
                    </div>
                  {/if}
                {/each}
              </div>
            {/if}
          </Card>
        </div>
      </div>
    {:else if activeTab === "batch"}
      <!-- Batch Testing -->
      <Card class="p-6">
        <h3 class="text-lg font-semibold mb-4">Batch Testing</h3>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="space-y-4">
            <!-- Agent Selection -->
            <div>
              <label class="block text-sm font-medium mb-3"
                >Select Agents for Batch Testing</label
              >
              <div
                class="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border border-input rounded-md p-3"
              >
                {#each agents as agent}
                  <label
                    class="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAgents.includes(agent.id)}
                      on:change={(e) =>
                        handleAgentSelection(agent.id, e.currentTarget.checked)}
                      class="rounded border-input"
                    />
                    <div class="flex-1">
                      <p class="text-sm font-medium">{agent.name}</p>
                      <p class="text-xs text-muted-foreground">
                        {agent.persona?.response_style} • {agent.model?.name}
                      </p>
                    </div>
                  </label>
                {/each}
              </div>
            </div>

            <Button
              on:click={handleBatchTest}
              disabled={selectedAgents.length === 0 ||
                !batchPrompts.trim() ||
                state.testing}
              class="w-full"
            >
              {#if state.testing}
                <Loader2 class="w-4 h-4 mr-2 animate-spin" />
                Running Batch Test...
              {:else}
                <Target class="w-4 h-4 mr-2" />
                Run Batch Test
              {/if}
            </Button>
          </div>

          <div>
            <!-- Batch Prompts -->
            <div>
              <label class="block text-sm font-medium mb-2"
                >Test Prompts (one per line)</label
              >
              <Textarea
                bind:value={batchPrompts}
                placeholder="Enter multiple prompts, one per line:

How do you say 'hello' in Spanish?
What is the difference between 'ser' and 'estar'?
Can you explain Spanish verb conjugations?
What are some common Spanish greetings?"
                rows={15}
                class="font-mono text-sm"
              />
              <p class="text-xs text-muted-foreground mt-2">
                {batchPrompts.split("\n").filter((p) => p.trim()).length} prompts
                • {selectedAgents.length} agents • {batchPrompts
                  .split("\n")
                  .filter((p) => p.trim()).length * selectedAgents.length} total
                tests
              </p>
            </div>
          </div>
        </div>
      </Card>
    {:else if activeTab === "analytics"}
      <!-- Analytics -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <Card class="p-6 text-center">
          <div class="text-2xl font-bold text-foreground mb-1">
            {#if loadingAnalytics}
              <Loader2 class="w-6 h-6 animate-spin mx-auto" />
            {:else}
              {analytics.totalTests || 0}
            {/if}
          </div>
          <div class="text-sm text-muted-foreground">Total Tests</div>
        </Card>

        <Card class="p-6 text-center">
          <div
            class="text-2xl font-bold mb-1 {getSuccessRateColor(
              analytics.successRate || 0
            )}"
          >
            {#if loadingAnalytics}
              <Loader2 class="w-6 h-6 animate-spin mx-auto" />
            {:else}
              {(analytics.successRate || 0).toFixed(1)}%
            {/if}
          </div>
          <div class="text-sm text-muted-foreground">Success Rate</div>
        </Card>

        <Card class="p-6 text-center">
          <div
            class="text-2xl font-bold mb-1 {getResponseTimeColor(
              analytics.averageResponseTime || 0
            )}"
          >
            {#if loadingAnalytics}
              <Loader2 class="w-6 h-6 animate-spin mx-auto" />
            {:else}
              {formatTime(analytics.averageResponseTime || 0)}
            {/if}
          </div>
          <div class="text-sm text-muted-foreground">Avg Response Time</div>
        </Card>

        <Card class="p-6 text-center">
          <div class="text-2xl font-bold text-foreground mb-1">
            {#if loadingAnalytics}
              <Loader2 class="w-6 h-6 animate-spin mx-auto" />
            {:else}
              {Math.round(analytics.averageTokenCount || 0)}
            {/if}
          </div>
          <div class="text-sm text-muted-foreground">Avg Tokens</div>
        </Card>
      </div>
    {/if}

    <!-- Results Section -->
    {#if showResults && (testResults.length > 0 || comparisons.length > 0)}
      <div class="mt-8">
        <Card class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold">Recent Results</h3>
            <Button
              variant="outline"
              size="sm"
              on:click={() => (showResults = false)}
            >
              Hide Results
            </Button>
          </div>

          <!-- Test Results -->
          {#if testResults.length > 0}
            <div class="space-y-4">
              <h4 class="font-medium">Individual Tests</h4>
              <div class="grid gap-4">
                {#each testResults.slice(0, 5) as result}
                  <div class="border border-border rounded-lg p-4">
                    <div class="flex items-start justify-between mb-3">
                      <div>
                        <div class="flex items-center space-x-2">
                          <span class="font-medium">{result.agentName}</span>
                          {#if result.success}
                            <CheckCircle class="w-4 h-4 text-green-600" />
                          {:else}
                            <AlertCircle class="w-4 h-4 text-red-600" />
                          {/if}
                        </div>
                        <div
                          class="flex items-center space-x-4 text-sm text-muted-foreground mt-1"
                        >
                          <span class="flex items-center">
                            <Clock class="w-3 h-3 mr-1" />
                            {formatTime(result.responseTime)}
                          </span>
                          <span>{formatDate(result.timestamp)}</span>
                          {#if result.metadata?.tokenCount}
                            <span>{result.metadata.tokenCount} tokens</span>
                          {/if}
                        </div>
                      </div>
                    </div>

                    <div class="space-y-2">
                      <div>
                        <span class="text-sm font-medium">Prompt:</span>
                        <p class="text-sm text-muted-foreground">
                          {result.prompt}
                        </p>
                      </div>
                      {#if result.success}
                        <div>
                          <span class="text-sm font-medium">Response:</span>
                          <p class="text-sm text-muted-foreground">
                            {result.response}
                          </p>
                        </div>
                      {:else if result.error}
                        <div>
                          <span class="text-sm font-medium text-red-600"
                            >Error:</span
                          >
                          <p class="text-sm text-red-600">{result.error}</p>
                        </div>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Comparison Results -->
          {#if comparisons.length > 0}
            <div class="space-y-4 mt-8">
              <h4 class="font-medium">Agent Comparisons</h4>
              {#each comparisons.slice(0, 3) as comparison}
                <div class="border border-border rounded-lg p-4">
                  <div class="mb-4">
                    <span class="text-sm font-medium">Prompt:</span>
                    <p class="text-sm text-muted-foreground">
                      {comparison.prompt}
                    </p>
                  </div>

                  <div class="grid gap-3">
                    {#each comparison.results as result}
                      <div class="bg-muted rounded-md p-3">
                        <div class="flex items-center justify-between mb-2">
                          <span class="font-medium">{result.agentName}</span>
                          <div
                            class="flex items-center space-x-2 text-sm text-muted-foreground"
                          >
                            {#if result.success}
                              <CheckCircle class="w-4 h-4 text-green-600" />
                            {:else}
                              <AlertCircle class="w-4 h-4 text-red-600" />
                            {/if}
                            <span>{formatTime(result.responseTime)}</span>
                          </div>
                        </div>
                        {#if result.success}
                          <p class="text-sm text-muted-foreground">
                            {result.response}
                          </p>
                        {:else if result.error}
                          <p class="text-sm text-red-600">{result.error}</p>
                        {/if}
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </Card>
      </div>
    {/if}
  {/if}
</div>

<!-- Export Dialog -->
<Dialog bind:open={exportDialogOpen} title="Export Test Results">
  <div class="space-y-4">
    <p class="text-muted-foreground">
      Export all test results to a CSV file for further analysis.
    </p>

    <div class="space-y-2">
      <div class="flex justify-between">
        <span class="text-sm font-medium">Total Results:</span>
        <span class="text-sm text-muted-foreground">{testResults.length}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-sm font-medium">Date Range:</span>
        <span class="text-sm text-muted-foreground">
          {testResults.length > 0
            ? `${formatDate(testResults[testResults.length - 1].timestamp)} - ${formatDate(testResults[0].timestamp)}`
            : "No data"}
        </span>
      </div>
    </div>
  </div>

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={() => (exportDialogOpen = false)}>
      Cancel
    </Button>
    <Button on:click={handleExport} disabled={testResults.length === 0}>
      <Download class="w-4 h-4 mr-2" />
      Export CSV
    </Button>
  </div>
</Dialog>
