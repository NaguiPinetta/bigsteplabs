<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { authStore, canManageContent } from "$lib/stores/auth";
  import {
    agentsStore,
    loadAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    testAgent,
    setSelectedAgent,
    clearAgentsError,
    validateAgent,
    getAgentStatuses,
    getAgentTemplates,
  } from "$lib/stores/agents";
  import { loadPersonas, personasStore } from "$lib/stores/personas";
  import { loadModels, modelsStore } from "$lib/stores/models";
  import { loadDatasets, datasetsStore } from "$lib/stores/datasets";

  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Textarea from "$lib/components/ui/textarea.svelte";
  import Select from "$lib/components/ui/select.svelte";
  import {
    Bot,
    Plus,
    Edit,
    Trash2,
    TestTube,
    Eye,
    Play,
    Pause,
    Loader2,
    AlertCircle,
    CheckCircle,
    Sparkles,
    MessageSquare,
    Users,
    Database,
    Cpu,
    Settings,
  } from "lucide-svelte";

  let createDialogOpen = false;
  let editDialogOpen = false;
  let viewDialogOpen = false;
  let templatesDialogOpen = false;
  let testDialogOpen = false;

  let newAgent = {
    name: "",
    description: "",
    persona_id: "",
    model_id: "",
    dataset_id: "",
    status: "active",
    configuration: {},
  };

  let editAgent = {
    id: "",
    name: "",
    description: "",
    persona_id: "",
    model_id: "",
    dataset_id: "",
    status: "active",
    configuration: {},
  };

  let validationErrors: string[] = [];
  let testingAgent: string | null = null;
  let testResults: Record<
    string,
    { success: boolean; error?: string; response?: string }
  > = {};

  let templates = getAgentTemplates();
  let statuses = getAgentStatuses();

  $: user = $authStore.user;
  $: canManage = canManageContent();
  $: state = $agentsStore;
  $: agents = state.agents;
  $: selectedAgent = state.selectedAgent;

  $: personas = $personasStore.personas;
  $: models = $modelsStore.models;
  $: datasets = $datasetsStore.datasets;

  $: personaOptions = personas.map((p) => ({ value: p.id, label: p.name }));
  $: modelOptions = models.map((m) => ({
    value: m.id,
    label: `${m.name} (${m.provider})`,
  }));
  $: datasetOptions = [
    { value: "", label: "No dataset (optional)" },
    ...datasets.map((d) => ({ value: d.id, label: d.name })),
  ];
  $: statusOptions = statuses.map((s) => ({ value: s.value, label: s.label }));

  onMount(async () => {
    if (canManage) {
      // Load all required data in parallel
      await Promise.all([
        loadAgents(),
        loadPersonas(),
        loadModels(),
        loadDatasets(),
      ]);
    }
  });

  function resetNewAgent() {
    newAgent = {
      name: "",
      description: "",
      persona_id: "",
      model_id: "",
      dataset_id: "",
      status: "active",
      configuration: {},
    };
    validationErrors = [];
  }

  async function handleCreateAgent() {
    if (!user) return;

    const validation = validateAgent(newAgent);
    if (!validation.valid) {
      validationErrors = validation.errors;
      return;
    }

    const result = await createAgent({
      name: newAgent.name.trim(),
      description: newAgent.description.trim() || null,
      persona_id: newAgent.persona_id,
      model_id: newAgent.model_id,
      dataset_ids: newAgent.dataset_id ? [newAgent.dataset_id] : [],
      status: newAgent.status,
      created_by: user.id,
    });

    if (result.data) {
      resetNewAgent();
      createDialogOpen = false;
    }
  }

  async function handleUpdateAgent() {
    const validation = validateAgent(editAgent);
    if (!validation.valid) {
      validationErrors = validation.errors;
      return;
    }

    const result = await updateAgent(editAgent.id, {
      name: editAgent.name.trim(),
      description: editAgent.description.trim() || null,
      persona_id: editAgent.persona_id,
      model_id: editAgent.model_id,
      dataset_ids: editAgent.dataset_id ? [editAgent.dataset_id] : [],
      is_active: editAgent.status === "active",
    });

    if (result.data) {
      validationErrors = [];
      editDialogOpen = false;
    }
  }

  async function handleDeleteAgent(agent: any) {
    if (
      !confirm(`Are you sure you want to delete the agent "${agent.name}"?`)
    ) {
      return;
    }

    await deleteAgent(agent.id);
  }

  async function handleTestAgent(agent: any) {
    testingAgent = agent.id;
    const result = await testAgent(agent.id);
    testResults[agent.id] = {
      success: result.success,
      error: result.error || undefined,
      response: result.response || undefined,
    };
    testingAgent = null;

    if (result.success && result.response) {
      setSelectedAgent(agent);
      testDialogOpen = true;
    }
  }

  async function toggleAgentStatus(agent: any) {
    const newIsActive = !agent.is_active;
    await updateAgent(agent.id, { is_active: newIsActive });
  }

  async function openEditDialog(agent: any) {
    editAgent = {
      id: agent.id,
      name: agent.name,
      description: agent.description || "",
      persona_id: agent.persona_id,
      model_id: agent.model_id,
      dataset_id: agent.dataset_id || "",
      status: agent.status,
      configuration: agent.configuration || {},
    };
    validationErrors = [];
    editDialogOpen = true;
  }

  function openViewDialog(agent: any) {
    setSelectedAgent(agent);
    viewDialogOpen = true;
  }

  function openCreateDialog() {
    resetNewAgent();
    createDialogOpen = true;
  }

  function openTemplatesDialog() {
    templatesDialogOpen = true;
  }

  function applyTemplate(template: any) {
    newAgent = {
      ...newAgent,
      name: template.name,
      description: template.description,
      status: template.status,
    };
    templatesDialogOpen = false;
    createDialogOpen = true;
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getStatusColor(status: string): string {
    const colors = {
      active:
        "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
      inactive:
        "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300",
      training:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
      maintenance:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
    };
    return colors[status as keyof typeof colors] || colors.inactive;
  }

  async function handleStartChat(agent: any) {
    if (!agent) return;

    console.log("🚀 Starting chat with agent:", agent.name);
    // Close the test dialog
    testDialogOpen = false;
    // Navigate to chat page - the agent should be available there now
    goto("/chat");
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "active":
        return Play;
      case "inactive":
        return Pause;
      case "training":
        return Settings;
      case "maintenance":
        return AlertCircle;
      default:
        return Pause;
    }
  }

  function truncateText(text: string, maxLength: number = 100): string {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  }
</script>

<svelte:head>
  <title>AI Agents - BigStepLabs</title>
  <meta
    name="description"
    content="Manage AI agents and their configurations"
  />
</svelte:head>

<!-- Page Header -->
<div class="mb-8 flex items-center justify-between">
  <div>
    <h1 class="text-2xl font-bold text-foreground">AI Agents</h1>
    <p class="text-muted-foreground">
      Create and manage intelligent agents for your learning platform
    </p>
  </div>

  {#if canManage}
    <div class="flex space-x-2">
      <Button variant="outline" on:click={openTemplatesDialog}>
        <Sparkles class="w-4 h-4 mr-2" />
        Templates
      </Button>
      <Button on:click={openCreateDialog}>
        <Plus class="w-4 h-4 mr-2" />
        Create Agent
      </Button>
    </div>
  {/if}
</div>

<div class="max-w-7xl mx-auto">
  {#if !canManage}
    <Card class="p-8 text-center">
      <h2 class="text-xl font-semibold mb-2">Access Restricted</h2>
      <p class="text-muted-foreground">
        You need Admin or Collaborator privileges to manage AI agents.
      </p>
    </Card>
  {:else if state.loading}
    <div class="flex items-center justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
      <span class="ml-2 text-muted-foreground">Loading agents...</span>
    </div>
  {:else if state.error}
    <Card class="p-6 border-destructive">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <AlertCircle class="w-5 h-5 text-destructive mr-2" />
          <span class="text-destructive font-medium">Error: {state.error}</span>
        </div>
        <Button variant="outline" on:click={clearAgentsError}>Dismiss</Button>
      </div>
    </Card>
  {:else if agents.length === 0}
    <Card class="p-12 text-center">
      <Bot class="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h2 class="text-xl font-semibold mb-2">No Agents Created</h2>
      <p class="text-muted-foreground mb-6">
        Create AI agents by combining personas, models, and datasets to power
        intelligent conversations.
      </p>

      {#if personas.length === 0 || models.length === 0}
        <div
          class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-6"
        >
          <div class="flex items-center">
            <AlertCircle class="w-5 h-5 text-yellow-600 mr-2" />
            <div class="text-left">
              <h4
                class="text-sm font-medium text-yellow-800 dark:text-yellow-200"
              >
                Prerequisites Needed
              </h4>
              <p class="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                {#if personas.length === 0 && models.length === 0}
                  You need to create personas and models before creating agents.
                {:else if personas.length === 0}
                  You need to create at least one persona before creating
                  agents.
                {:else}
                  You need to configure at least one model before creating
                  agents.
                {/if}
              </p>
            </div>
          </div>
        </div>
      {/if}

      <div class="flex justify-center space-x-3">
        <Button variant="outline" on:click={openTemplatesDialog}>
          <Sparkles class="w-4 h-4 mr-2" />
          Browse Templates
        </Button>
        <Button
          on:click={openCreateDialog}
          disabled={personas.length === 0 || models.length === 0}
        >
          <Plus class="w-4 h-4 mr-2" />
          Create Your First Agent
        </Button>
      </div>
    </Card>
  {:else}
    <!-- Agents Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each agents as agent (agent.id)}
        <Card class="p-6 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div
                class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center"
              >
                <Bot class="w-6 h-6 text-primary" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-foreground">
                  {agent.name}
                </h3>
                <div class="flex items-center space-x-2">
                  <span
                    class={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(agent.is_active ? "active" : "inactive")}`}
                  >
                    <svelte:component
                      this={getStatusIcon(
                        agent.is_active ? "active" : "inactive"
                      )}
                      class="w-3 h-3 mr-1"
                    />
                    {agent.is_active ? "active" : "inactive"}
                  </span>
                </div>
              </div>
            </div>

            <div class="flex items-center space-x-1">
              <button
                on:click={() => handleTestAgent(agent)}
                disabled={testingAgent === agent.id ||
                  agent.status !== "active"}
                class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground disabled:opacity-50"
                title="Test agent"
              >
                {#if testingAgent === agent.id}
                  <Loader2 class="w-4 h-4 animate-spin" />
                {:else}
                  <TestTube class="w-4 h-4" />
                {/if}
              </button>

              <button
                on:click={() => toggleAgentStatus(agent)}
                class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                title={agent.status === "active" ? "Deactivate" : "Activate"}
              >
                <svelte:component
                  this={agent.status === "active" ? Pause : Play}
                  class="w-4 h-4"
                />
              </button>

              <button
                on:click={() => openViewDialog(agent)}
                class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                title="View details"
              >
                <Eye class="w-4 h-4" />
              </button>

              <button
                on:click={() => openEditDialog(agent)}
                class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                title="Edit agent"
              >
                <Edit class="w-4 h-4" />
              </button>

              <button
                on:click={() => handleDeleteAgent(agent)}
                class="p-2 hover:bg-destructive/20 rounded-md text-muted-foreground hover:text-destructive"
                title="Delete agent"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          {#if agent.description}
            <p class="text-sm text-muted-foreground mb-4">
              {truncateText(agent.description, 120)}
            </p>
          {/if}

          <!-- Configuration Summary -->
          <div class="space-y-2 mb-4">
            <div class="flex items-center justify-between text-sm">
              <span class="flex items-center text-muted-foreground">
                <Users class="w-4 h-4 mr-1" />
                Persona:
              </span>
              <span class="font-medium">{agent.persona?.name || "Unknown"}</span
              >
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="flex items-center text-muted-foreground">
                <Cpu class="w-4 h-4 mr-1" />
                Model:
              </span>
              <span class="font-medium">{agent.model?.name || "Unknown"}</span>
            </div>
            {#if agent.dataset}
              <div class="flex items-center justify-between text-sm">
                <span class="flex items-center text-muted-foreground">
                  <Database class="w-4 h-4 mr-1" />
                  Dataset:
                </span>
                <span class="font-medium">{agent.dataset.name}</span>
              </div>
            {/if}
          </div>

          <!-- Test Status -->
          {#if testResults[agent.id]}
            <div
              class={`flex items-center space-x-2 p-2 rounded-md mb-4 ${
                testResults[agent.id].success
                  ? "bg-green-50 dark:bg-green-900/20"
                  : "bg-red-50 dark:bg-red-900/20"
              }`}
            >
              {#if testResults[agent.id].success}
                <CheckCircle class="w-4 h-4 text-green-600" />
                <span class="text-sm text-green-700 dark:text-green-300"
                  >Test Successful</span
                >
              {:else}
                <AlertCircle class="w-4 h-4 text-red-600" />
                <span class="text-sm text-red-700 dark:text-red-300"
                  >Test Failed</span
                >
              {/if}
            </div>
          {/if}

          <div
            class="text-xs text-muted-foreground pt-2 border-t border-border"
          >
            Created {formatDate(agent.created_at)}
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>

<!-- Templates Dialog -->
<Dialog bind:open={templatesDialogOpen} title="Agent Templates" size="lg">
  <div class="space-y-4">
    <p class="text-muted-foreground">
      Choose from these pre-built agent templates to get started quickly.
    </p>

    {#each templates as template}
      <Card class="p-4 hover:shadow-sm transition-shadow">
        <div class="flex items-start justify-between mb-2">
          <div>
            <h4 class="font-semibold text-foreground">{template.name}</h4>
            <p class="text-sm text-muted-foreground mt-1">
              {template.description}
            </p>
          </div>
          <Button size="sm" on:click={() => applyTemplate(template)}>
            Use Template
          </Button>
        </div>

        <div class="mt-3 space-y-2">
          <div class="text-xs">
            <span class="text-muted-foreground">Suggested Personas:</span>
            <span class="ml-1 text-primary"
              >{template.example_personas.join(", ")}</span
            >
          </div>
          <div class="text-xs">
            <span class="text-muted-foreground">Example Datasets:</span>
            <span class="ml-1 text-primary"
              >{template.example_datasets.join(", ")}</span
            >
          </div>
          <div class="text-xs">
            <span class="text-muted-foreground">Recommended Models:</span>
            <span class="ml-1 text-primary"
              >{template.suggested_models.join(", ")}</span
            >
          </div>
        </div>
      </Card>
    {/each}
  </div>

  <div slot="footer" class="flex justify-end">
    <Button variant="outline" on:click={() => (templatesDialogOpen = false)}>
      Close
    </Button>
  </div>
</Dialog>

<!-- Create Agent Dialog -->
<Dialog bind:open={createDialogOpen} title="Create New Agent" size="lg">
  <div class="space-y-6">
    <!-- Validation Errors -->
    {#if validationErrors.length > 0}
      <div
        class="bg-destructive/15 border border-destructive/20 rounded-md p-4"
      >
        <div class="flex">
          <AlertCircle class="w-5 h-5 text-destructive flex-shrink-0" />
          <div class="ml-3">
            <h4 class="text-sm font-medium text-destructive">
              Please fix these errors:
            </h4>
            <ul class="mt-1 text-sm text-destructive/80 list-disc list-inside">
              {#each validationErrors as error}
                <li>{error}</li>
              {/each}
            </ul>
          </div>
        </div>
      </div>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="name" class="block text-sm font-medium mb-2"
          >Agent Name *</label
        >
        <Input
          id="name"
          bind:value={newAgent.name}
          placeholder="e.g., Spanish Conversation Coach"
          required
        />
      </div>

      <div>
        <label for="status" class="block text-sm font-medium mb-2">Status</label
        >
        <Select
          id="status"
          bind:value={newAgent.status}
          options={statusOptions}
        />
      </div>
    </div>

    <div>
      <label for="description" class="block text-sm font-medium mb-2"
        >Description</label
      >
      <Textarea
        id="description"
        bind:value={newAgent.description}
        placeholder="Brief description of what this agent does..."
        rows={2}
      />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="persona" class="block text-sm font-medium mb-2"
          >Persona *</label
        >
        <Select
          id="persona"
          bind:value={newAgent.persona_id}
          options={personaOptions}
          placeholder="Select a persona..."
        />
        <p class="text-xs text-muted-foreground mt-1">
          Defines the agent's personality and behavior
        </p>
      </div>

      <div>
        <label for="model" class="block text-sm font-medium mb-2"
          >AI Model *</label
        >
        <Select
          id="model"
          bind:value={newAgent.model_id}
          options={modelOptions}
          placeholder="Select a model..."
        />
        <p class="text-xs text-muted-foreground mt-1">
          The AI model that powers this agent
        </p>
      </div>
    </div>

    <div>
      <label for="dataset" class="block text-sm font-medium mb-2"
        >Knowledge Dataset</label
      >
      <Select
        id="dataset"
        bind:value={newAgent.dataset_id}
        options={datasetOptions}
        placeholder="Select a dataset..."
      />
      <p class="text-xs text-muted-foreground mt-1">
        Optional dataset for specialized knowledge
      </p>
    </div>
  </div>

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={() => (createDialogOpen = false)}>
      Cancel
    </Button>
    <Button
      on:click={handleCreateAgent}
      disabled={!newAgent.name.trim() ||
        !newAgent.persona_id ||
        !newAgent.model_id}
    >
      Create Agent
    </Button>
  </div>
</Dialog>

<!-- Edit Agent Dialog -->
<Dialog bind:open={editDialogOpen} title="Edit Agent" size="lg">
  <div class="space-y-6">
    <!-- Validation Errors -->
    {#if validationErrors.length > 0}
      <div
        class="bg-destructive/15 border border-destructive/20 rounded-md p-4"
      >
        <div class="flex">
          <AlertCircle class="w-5 h-5 text-destructive flex-shrink-0" />
          <div class="ml-3">
            <h4 class="text-sm font-medium text-destructive">
              Please fix these errors:
            </h4>
            <ul class="mt-1 text-sm text-destructive/80 list-disc list-inside">
              {#each validationErrors as error}
                <li>{error}</li>
              {/each}
            </ul>
          </div>
        </div>
      </div>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="edit-name" class="block text-sm font-medium mb-2"
          >Agent Name *</label
        >
        <Input id="edit-name" bind:value={editAgent.name} required />
      </div>

      <div>
        <label for="edit-status" class="block text-sm font-medium mb-2"
          >Status</label
        >
        <Select
          id="edit-status"
          bind:value={editAgent.status}
          options={statusOptions}
        />
      </div>
    </div>

    <div>
      <label for="edit-description" class="block text-sm font-medium mb-2"
        >Description</label
      >
      <Textarea
        id="edit-description"
        bind:value={editAgent.description}
        rows={2}
      />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="edit-persona" class="block text-sm font-medium mb-2"
          >Persona *</label
        >
        <Select
          id="edit-persona"
          bind:value={editAgent.persona_id}
          options={personaOptions}
        />
      </div>

      <div>
        <label for="edit-model" class="block text-sm font-medium mb-2"
          >AI Model *</label
        >
        <Select
          id="edit-model"
          bind:value={editAgent.model_id}
          options={modelOptions}
        />
      </div>
    </div>

    <div>
      <label for="edit-dataset" class="block text-sm font-medium mb-2"
        >Knowledge Dataset</label
      >
      <Select
        id="edit-dataset"
        bind:value={editAgent.dataset_id}
        options={datasetOptions}
      />
    </div>
  </div>

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={() => (editDialogOpen = false)}>
      Cancel
    </Button>
    <Button
      on:click={handleUpdateAgent}
      disabled={!editAgent.name.trim() ||
        !editAgent.persona_id ||
        !editAgent.model_id}
    >
      Save Changes
    </Button>
  </div>
</Dialog>

<!-- View Agent Dialog -->
<Dialog bind:open={viewDialogOpen} title="Agent Details" size="lg">
  {#if selectedAgent}
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-start space-x-4 pb-4 border-b border-border">
        <div
          class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center"
        >
          <Bot class="w-8 h-8 text-primary" />
        </div>
        <div class="flex-1">
          <h3 class="text-xl font-semibold text-foreground mb-2">
            {selectedAgent.name}
          </h3>
          <div class="flex items-center space-x-2 mb-2">
            <span
              class={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAgent.status)}`}
            >
              <svelte:component
                this={getStatusIcon(selectedAgent.status)}
                class="w-3 h-3 mr-1"
              />
              {selectedAgent.status}
            </span>
          </div>
          {#if selectedAgent.description}
            <p class="text-muted-foreground">
              {selectedAgent.description}
            </p>
          {/if}
        </div>
      </div>

      <!-- Configuration Details -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="font-medium text-foreground mb-3">
            Persona Configuration
          </h4>
          {#if selectedAgent.persona}
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Name:</span>
                <span class="font-medium">{selectedAgent.persona.name}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Style:</span>
                <span class="font-medium capitalize"
                  >{selectedAgent.persona.response_style}</span
                >
              </div>
            </div>
          {:else}
            <p class="text-muted-foreground text-sm">No persona configured</p>
          {/if}
        </div>

        <div>
          <h4 class="font-medium text-foreground mb-3">AI Model</h4>
          {#if selectedAgent.model}
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Name:</span>
                <span class="font-medium">{selectedAgent.model.name}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Provider:</span>
                <span class="font-medium capitalize"
                  >{selectedAgent.model.provider}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Engine:</span>
                <span class="font-medium">{selectedAgent.model.engine}</span>
              </div>
            </div>
          {:else}
            <p class="text-muted-foreground text-sm">No model configured</p>
          {/if}
        </div>
      </div>

      {#if selectedAgent.dataset}
        <div>
          <h4 class="font-medium text-foreground mb-3">Knowledge Dataset</h4>
          <div class="bg-muted rounded-md p-4">
            <h5 class="font-medium">{selectedAgent.dataset.name}</h5>
            {#if selectedAgent.dataset.description}
              <p class="text-sm text-muted-foreground mt-1">
                {selectedAgent.dataset.description}
              </p>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Test Results -->
      {#if testResults[selectedAgent.id]}
        <div
          class={`p-4 rounded-md ${
            testResults[selectedAgent.id].success
              ? "bg-green-50 dark:bg-green-900/20"
              : "bg-red-50 dark:bg-red-900/20"
          }`}
        >
          <div class="flex items-center space-x-2 mb-2">
            {#if testResults[selectedAgent.id].success}
              <CheckCircle class="w-5 h-5 text-green-600" />
              <span class="font-medium text-green-700 dark:text-green-300"
                >Latest Test: Successful</span
              >
            {:else}
              <AlertCircle class="w-5 h-5 text-red-600" />
              <span class="font-medium text-red-700 dark:text-red-300"
                >Latest Test: Failed</span
              >
            {/if}
          </div>
          {#if testResults[selectedAgent.id].response}
            <div class="bg-background rounded p-3 text-sm">
              <strong>Sample Response:</strong>
              <p class="mt-1 text-muted-foreground italic">
                "{testResults[selectedAgent.id].response}"
              </p>
            </div>
          {/if}
          {#if testResults[selectedAgent.id].error}
            <p class="mt-2 text-sm text-red-600 dark:text-red-400">
              {testResults[selectedAgent.id].error}
            </p>
          {/if}
        </div>
      {/if}

      <!-- Metadata -->
      <div class="text-sm text-muted-foreground pt-4 border-t border-border">
        Created {formatDate(selectedAgent.created_at)}
        {#if selectedAgent.updated_at !== selectedAgent.created_at}
          • Updated {formatDate(selectedAgent.updated_at)}
        {/if}
      </div>
    </div>
  {/if}

  <div slot="footer" class="flex justify-between">
    <Button
      variant="outline"
      on:click={() => handleTestAgent(selectedAgent)}
      disabled={testingAgent === selectedAgent.id ||
        selectedAgent.status !== "active"}
    >
      {#if testingAgent === selectedAgent.id}
        <Loader2 class="w-4 h-4 mr-2 animate-spin" />
        Testing...
      {:else}
        <TestTube class="w-4 h-4 mr-2" />
        Test Agent
      {/if}
    </Button>
    <div class="flex space-x-2">
      <Button variant="outline" on:click={() => openEditDialog(selectedAgent)}>
        <Edit class="w-4 h-4 mr-2" />
        Edit
      </Button>
      <Button variant="outline" on:click={() => (viewDialogOpen = false)}>
        Close
      </Button>
    </div>
  </div>
</Dialog>

<!-- Test Response Dialog -->
<Dialog bind:open={testDialogOpen} title="Agent Test Response">
  {#if selectedAgent && testResults[selectedAgent.id]?.response}
    <div class="space-y-4">
      <div class="flex items-center space-x-2 mb-4">
        <Bot class="w-6 h-6 text-primary" />
        <span class="font-medium">{selectedAgent.name}</span>
      </div>

      <div class="bg-muted rounded-md p-4">
        <p class="text-foreground">
          {testResults[selectedAgent.id].response}
        </p>
      </div>

      <p class="text-sm text-muted-foreground">
        This is a sample response from your agent. The actual responses will
        vary based on the conversation context.
      </p>
    </div>
  {/if}

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={() => (testDialogOpen = false)}>
      Close
    </Button>
    <Button on:click={() => handleStartChat(selectedAgent)}>
      <MessageSquare class="w-4 h-4 mr-2" />
      Start Chat
    </Button>
  </div>
</Dialog>
