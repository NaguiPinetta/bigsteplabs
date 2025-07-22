<script lang="ts">
  import { onMount } from "svelte";
  import { authStore, canManageContent } from "$lib/stores/auth";
  import {
    modelsStore,
    loadModels,
    createModel,
    updateModel,
    deleteModel,
    testModel,
    setSelectedModel,
    clearModelsError,
    validateModel,
    getModelProviders,
    getModelPresets,
  } from "$lib/stores/models";

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
    ExternalLink,
    Loader2,
    AlertCircle,
    CheckCircle,
    Cpu,
    Zap,
    Settings,
    Pencil,
    XCircle,
  } from "lucide-svelte";

  let createDialogOpen = false;
  let editDialogOpen = false;
  let viewDialogOpen = false;
  let presetsDialogOpen = false;

  let newModel = {
    name: "",
    provider: "",
    engine: "",
    api_key: "",
    api_endpoint: "",
    max_tokens: 4096,
    temperature: 0.7,
    description: "",
  };

  let editModel = {
    id: "",
    name: "",
    provider: "",
    engine: "",
    api_key: "",
    api_endpoint: "",
    max_tokens: 4096,
    temperature: 0.7,
    description: "",
  };

  let validationErrors: string[] = [];
  let testingModel: string | null = null;
  let testResults: Record<string, { success: boolean; error?: string }> = {};

  let providers = getModelProviders();
  let presets = getModelPresets();

  $: user = $authStore.user;
  $: canManage = canManageContent(user);

  // Debug logging
  $: if (user) {
    console.log("👤 Current user:", user);
    console.log("🔐 User role:", user.role);
    console.log("✅ Can manage:", canManage);
  }
  $: state = $modelsStore;
  $: models = state.models || []; // Ensure models is always an array
  $: selectedModel = state.selectedModel;

  $: selectedProvider = providers.find((p) => p.value === newModel.provider);
  $: editSelectedProvider = providers.find(
    (p) => p.value === editModel.provider
  );

  $: providerOptions = providers.map((p) => ({
    value: p.value,
    label: p.label,
  }));

  onMount(() => {
    // Load models immediately - don't wait for permission checks
    console.log("🔄 Loading models on page mount...");
    loadModels();
  });

  // Also load models when user becomes available (fallback)
  $: if (user && canManage && !state.loading && models && models.length === 0) {
    console.log("🔄 Fallback: Loading models for authenticated user...");
    loadModels();
  }

  function resetNewModel() {
    newModel = {
      name: "",
      provider: "",
      engine: "",
      api_key: "",
      api_endpoint: "",
      max_tokens: 4096,
      temperature: 0.7,
      description: "",
    };
    validationErrors = [];
  }

  async function handleCreateModel() {
    if (!user) return;

    const validation = validateModel(newModel);
    if (!validation.valid) {
      validationErrors = validation.errors;
      return;
    }

    const result = await createModel({
      name: newModel.name.trim(),
      provider: newModel.provider,
      engine: newModel.engine.trim(),
      // api_key: newModel.api_key.trim(),
      // api_endpoint: newModel.api_endpoint.trim() || null,
      max_tokens: newModel.max_tokens,
      temperature: newModel.temperature,
      api_key_id: null,
      is_active: true,
      // description: newModel.description.trim() || null,
      // created_by: user.id,
    });

    if (result.data) {
      resetNewModel();
      createDialogOpen = false;
    }
  }

  async function handleUpdateModel() {
    const validation = validateModel(editModel);
    if (!validation.valid) {
      validationErrors = validation.errors;
      return;
    }

    const result = await updateModel(editModel.id, {
      name: editModel.name.trim(),
      provider: editModel.provider,
      engine: editModel.engine.trim(),
      // api_key: editModel.api_key.trim(),
      // api_endpoint: editModel.api_endpoint.trim() || null,
      max_tokens: editModel.max_tokens,
      temperature: editModel.temperature,
      // description: editModel.description.trim() || null,
    });

    if (result.data) {
      validationErrors = [];
      editDialogOpen = false;
    }
  }

  async function handleDeleteModel(model: any) {
    if (
      !confirm(`Are you sure you want to delete the model "${model.name}"?`)
    ) {
      return;
    }

    await deleteModel(model.id);
  }

  async function handleTestModel(model: any) {
    testingModel = model.id;
    const result = await testModel(model.id);
    testResults[model.id] = result;
    testingModel = null;
  }

  async function openEditDialog(model: any) {
    editModel = {
      id: model.id,
      name: model.name,
      provider: model.provider,
      engine: model.engine,
      api_key: model.api_key,
      api_endpoint: model.api_endpoint || "",
      max_tokens: model.max_tokens,
      temperature: model.temperature,
      description: model.description || "",
    };
    validationErrors = [];
    editDialogOpen = true;
  }

  function openViewDialog(model: any) {
    setSelectedModel(model);
    viewDialogOpen = true;
  }

  function openCreateDialog() {
    resetNewModel();
    createDialogOpen = true;
  }

  function openPresetsDialog() {
    presetsDialogOpen = true;
  }

  function applyPreset(preset: any) {
    newModel = {
      ...newModel,
      name: preset.name,
      provider: preset.provider,
      engine: preset.engine,
      max_tokens: preset.max_tokens,
      temperature: preset.temperature,
      description: preset.description,
    };
    presetsDialogOpen = false;
    createDialogOpen = true;
  }

  function onProviderChange(provider: string) {
    const providerInfo = providers.find((p) => p.value === provider);
    if (providerInfo && providerInfo.engines.length > 0) {
      newModel.engine = providerInfo.engines[0];
    }
  }

  function onEditProviderChange(provider: string) {
    const providerInfo = providers.find((p) => p.value === provider);
    if (providerInfo && providerInfo.engines.length > 0) {
      editModel.engine = providerInfo.engines[0];
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatApiKey(apiKey: string): string {
    if (!apiKey) return "";
    if (apiKey.length <= 8) return "*".repeat(apiKey.length);
    return (
      apiKey.substring(0, 4) +
      "*".repeat(apiKey.length - 8) +
      apiKey.substring(apiKey.length - 4)
    );
  }

  function getProviderIcon(provider: string): string {
    const icons: Record<string, string> = {
      openai: "🤖",
      anthropic: "🧠",
      google: "🎯",
      azure: "☁️",
      mistral: "🌟",
      cohere: "⚡",
    };
    return icons[provider] || "🤖";
  }

  function maskApiKey(apiKey: string): string {
    if (apiKey.length <= 8) return "*".repeat(apiKey.length);
    return (
      apiKey.substring(0, 4) +
      "*".repeat(apiKey.length - 8) +
      apiKey.substring(apiKey.length - 4)
    );
  }
</script>

<svelte:head>
  <title>AI Models - BigStepLabs</title>
  <meta name="description" content="Manage AI models and configurations" />
</svelte:head>

<!-- Page Header -->
<div class="mb-8 flex items-center justify-between">
  <div>
    <h1 class="text-2xl font-bold text-foreground">AI Models</h1>
    <p class="text-muted-foreground">
      Configure AI models and API connections for your agents
    </p>
  </div>

  {#if canManage}
    <div class="flex space-x-2">
      <Button variant="outline" on:click={openPresetsDialog}>
        <Zap class="w-4 h-4 mr-2" />
        Presets
      </Button>
      <Button on:click={openCreateDialog}>
        <Plus class="w-4 h-4 mr-2" />
        Add Model
      </Button>
    </div>
  {/if}
</div>

<div class="max-w-7xl mx-auto">
  {#if user && canManage}
    {#if state.loading}
      <div class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <span class="ml-2 text-muted-foreground">Loading models...</span>
      </div>
    {:else if state.error}
      <Card class="p-6 border-destructive">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <AlertCircle class="w-5 h-5 text-destructive mr-2" />
            <span class="text-destructive font-medium"
              >Error: {state.error}</span
            >
          </div>
          <Button variant="outline" on:click={clearModelsError}>Dismiss</Button>
        </div>
      </Card>
    {:else if models.length === 0}
      <Card class="p-12 text-center">
        <Cpu class="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 class="text-xl font-semibold mb-2">No Models Configured</h2>
        <p class="text-muted-foreground mb-6">
          Add AI models to power your intelligent agents and chat features.
        </p>
        <div class="flex justify-center space-x-3">
          <Button variant="outline" on:click={openPresetsDialog}>
            <Zap class="w-4 h-4 mr-2" />
            Browse Presets
          </Button>
          <Button on:click={openCreateDialog}>
            <Plus class="w-4 h-4 mr-2" />
            Add Your First Model
          </Button>
        </div>
      </Card>
    {:else}
      <!-- Models Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each models as model (model.id)}
          <Card class="p-6 hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div
                  class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-2xl"
                >
                  {getProviderIcon(model.provider)}
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-foreground">
                    {model.name}
                  </h3>
                  <p class="text-sm text-primary capitalize">
                    {model.provider} • {model.engine}
                  </p>
                </div>
              </div>

              <div class="flex items-center space-x-1">
                <button
                  on:click={() => handleTestModel(model)}
                  disabled={testingModel === model.id}
                  class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground disabled:opacity-50"
                  title="Test connection"
                >
                  {#if testingModel === model.id}
                    <Loader2 class="w-4 h-4 animate-spin" />
                  {:else}
                    <Zap class="w-4 h-4" />
                  {/if}
                </button>

                <button
                  on:click={() => openViewDialog(model)}
                  class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                  title="View details"
                >
                  <Eye class="w-4 h-4" />
                </button>

                <button
                  on:click={() => openEditDialog(model)}
                  class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                  title="Edit model"
                >
                  <Pencil class="w-4 h-4" />
                </button>

                <button
                  on:click={() => handleDeleteModel(model)}
                  class="p-2 hover:bg-destructive/20 hover:text-destructive rounded-md text-muted-foreground"
                  title="Delete model"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div class="space-y-3">
              <div
                class="flex items-center justify-between text-xs text-muted-foreground"
              >
                <span>Max tokens: {model.max_tokens}</span>
                <span>Temp: {model.temperature}</span>
              </div>

              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <div class="flex items-center space-x-1">
                    {#if model.is_active}
                      <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span class="text-xs text-green-600 dark:text-green-400"
                        >Active</span
                      >
                    {:else}
                      <div class="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span class="text-xs text-muted-foreground">Inactive</span
                      >
                    {/if}
                  </div>
                  {#if testResults[model.id]}
                    <div class="flex items-center space-x-1">
                      {#if testResults[model.id].success}
                        <CheckCircle class="w-3 h-3 text-green-500" />
                        <span class="text-xs text-green-600 dark:text-green-400"
                          >Connected</span
                        >
                      {:else}
                        <XCircle class="w-3 h-3 text-red-500" />
                        <span class="text-xs text-red-600 dark:text-red-400"
                          >Connection failed</span
                        >
                      {/if}
                    </div>
                  {/if}
                </div>
              </div>
            </div>

            <div
              class="text-xs text-muted-foreground pt-2 border-t border-border"
            >
              Created {formatDate(model.created_at)}
            </div>
          </Card>
        {/each}
      </div>
    {/if}
  {:else if user && !canManage}
    <Card class="p-8 text-center">
      <h2 class="text-xl font-semibold mb-2">Access Restricted</h2>
      <p class="text-muted-foreground">
        You need Admin or Collaborator privileges to manage AI models.
      </p>
    </Card>
  {:else if state.loading}
    <div class="flex items-center justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
      <span class="ml-2 text-muted-foreground">Loading models...</span>
    </div>
  {:else if state.error}
    <Card class="p-6 border-destructive">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <AlertCircle class="w-5 h-5 text-destructive mr-2" />
          <span class="text-destructive font-medium">Error: {state.error}</span>
        </div>
        <Button variant="outline" on:click={clearModelsError}>Dismiss</Button>
      </div>
    </Card>
  {:else if models.length === 0}
    <Card class="p-12 text-center">
      <Cpu class="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h2 class="text-xl font-semibold mb-2">No Models Configured</h2>
      <p class="text-muted-foreground mb-6">
        Add AI models to power your intelligent agents and chat features.
      </p>
      <div class="flex justify-center space-x-3">
        <Button variant="outline" on:click={openPresetsDialog}>
          <Zap class="w-4 h-4 mr-2" />
          Browse Presets
        </Button>
        <Button on:click={openCreateDialog}>
          <Plus class="w-4 h-4 mr-2" />
          Add Your First Model
        </Button>
      </div>
    </Card>
  {:else}
    <!-- Models Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each models as model (model.id)}
        <Card class="p-6 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div
                class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-2xl"
              >
                {getProviderIcon(model.provider)}
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-foreground">
                  {model.name}
                </h3>
                <p class="text-sm text-primary capitalize">
                  {model.provider} • {model.engine}
                </p>
              </div>
            </div>

            <div class="flex items-center space-x-1">
              <button
                on:click={() => handleTestModel(model)}
                disabled={testingModel === model.id}
                class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground disabled:opacity-50"
                title="Test connection"
              >
                {#if testingModel === model.id}
                  <Loader2 class="w-4 h-4 animate-spin" />
                {:else}
                  <TestTube class="w-4 h-4" />
                {/if}
              </button>

              <button
                on:click={() => openViewDialog(model)}
                class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                title="View details"
              >
                <Eye class="w-4 h-4" />
              </button>

              <button
                on:click={() => openEditDialog(model)}
                class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                title="Edit model"
              >
                <Edit class="w-4 h-4" />
              </button>

              <button
                on:click={() => handleDeleteModel(model)}
                class="p-2 hover:bg-destructive/20 rounded-md text-muted-foreground hover:text-destructive"
                title="Delete model"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          {#if model.description}
            <p class="text-sm text-muted-foreground mb-3">
              {model.description}
            </p>
          {/if}

          <div class="space-y-2 mb-4">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Max Tokens:</span>
              <span class="font-medium"
                >{model.max_tokens.toLocaleString()}</span
              >
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Temperature:</span>
              <span class="font-medium">{model.temperature}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">API Key:</span>
              <span class="font-mono text-xs">{maskApiKey(model.api_key)}</span>
            </div>
          </div>

          <!-- Test Status -->
          {#if testResults[model.id]}
            <div
              class={`flex items-center space-x-2 p-2 rounded-md ${
                testResults[model.id].success
                  ? "bg-green-50 dark:bg-green-900/20"
                  : "bg-red-50 dark:bg-red-900/20"
              }`}
            >
              {#if testResults[model.id].success}
                <CheckCircle class="w-4 h-4 text-green-600" />
                <span class="text-sm text-green-700 dark:text-green-300"
                  >Connection OK</span
                >
              {:else}
                <AlertCircle class="w-4 h-4 text-red-600" />
                <span class="text-sm text-red-700 dark:text-red-300"
                  >Connection Failed</span
                >
              {/if}
            </div>
          {/if}

          <div
            class="text-xs text-muted-foreground pt-2 border-t border-border"
          >
            Created {formatDate(model.created_at)}
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>

<!-- Model Presets Dialog -->
<Dialog bind:open={presetsDialogOpen} title="Model Presets" size="lg">
  <div class="space-y-4">
    <p class="text-muted-foreground">
      Choose from these pre-configured models to get started quickly. You'll
      need to add your own API keys.
    </p>

    {#each presets as preset}
      <Card class="p-4 hover:shadow-sm transition-shadow">
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center space-x-3">
            <div
              class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-xl"
            >
              {getProviderIcon(preset.provider)}
            </div>
            <div>
              <h4 class="font-semibold text-foreground">{preset.name}</h4>
              <p class="text-sm text-primary capitalize">
                {preset.provider} • {preset.engine}
              </p>
            </div>
          </div>
          <Button size="sm" on:click={() => applyPreset(preset)}>
            Use Preset
          </Button>
        </div>
        <p class="text-sm text-muted-foreground mb-2">
          {preset.description}
        </p>
        <div class="flex space-x-4 text-xs text-muted-foreground">
          <span>Max Tokens: {preset.max_tokens.toLocaleString()}</span>
          <span>Temperature: {preset.temperature}</span>
        </div>
      </Card>
    {/each}
  </div>

  <div slot="footer" class="flex justify-end">
    <Button variant="outline" on:click={() => (presetsDialogOpen = false)}>
      Close
    </Button>
  </div>
</Dialog>

<!-- Create Model Dialog -->
<Dialog bind:open={createDialogOpen} title="Add New Model" size="lg">
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
          >Model Name *</label
        >
        <Input
          id="name"
          bind:value={newModel.name}
          placeholder="e.g., GPT-4 Production"
          required
        />
      </div>

      <div>
        <label for="provider" class="block text-sm font-medium mb-2"
          >Provider *</label
        >
        <Select
          id="provider"
          bind:value={newModel.provider}
          options={providerOptions}
          on:change={(e) => onProviderChange(e.detail)}
        />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="engine" class="block text-sm font-medium mb-2"
          >Engine/Model ID *</label
        >
        <Input
          id="engine"
          bind:value={newModel.engine}
          placeholder="e.g., gpt-4-turbo"
          required
        />
        {#if selectedProvider}
          <div class="mt-1 text-xs text-muted-foreground">
            Common engines: {selectedProvider.engines.slice(0, 3).join(", ")}
          </div>
        {/if}
      </div>

      <div>
        <label for="api-key" class="block text-sm font-medium mb-2"
          >API Key *</label
        >
        <Input
          id="api-key"
          bind:value={newModel.api_key}
          placeholder="sk-..."
          type="password"
          required
        />
      </div>
    </div>

    <div>
      <label for="api-endpoint" class="block text-sm font-medium mb-2"
        >API Endpoint (Optional)</label
      >
      <Input
        id="api-endpoint"
        bind:value={newModel.api_endpoint}
        placeholder="Leave blank for default endpoint"
      />
      {#if selectedProvider}
        <div class="mt-1 text-xs text-muted-foreground">
          <a
            href={selectedProvider.docs}
            target="_blank"
            class="text-primary hover:underline"
          >
            View {selectedProvider.label} documentation
            <ExternalLink class="w-3 h-3 inline ml-1" />
          </a>
        </div>
      {/if}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="max-tokens" class="block text-sm font-medium mb-2"
          >Max Tokens</label
        >
        <Input
          id="max-tokens"
          bind:value={newModel.max_tokens}
          type="number"
          min="1"
          max="32000"
        />
        <p class="text-xs text-muted-foreground mt-1">
          Maximum tokens per response
        </p>
      </div>

      <div>
        <label for="temperature" class="block text-sm font-medium mb-2"
          >Temperature</label
        >
        <Input
          id="temperature"
          bind:value={newModel.temperature}
          type="number"
          min="0"
          max="2"
          step="0.1"
        />
        <p class="text-xs text-muted-foreground mt-1">
          0 = Focused, 2 = Creative
        </p>
      </div>
    </div>

    <div>
      <label for="description" class="block text-sm font-medium mb-2"
        >Description</label
      >
      <Textarea
        id="description"
        bind:value={newModel.description}
        placeholder="Optional description of this model configuration..."
        rows={2}
      />
    </div>
  </div>

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={() => (createDialogOpen = false)}>
      Cancel
    </Button>
    <Button
      on:click={handleCreateModel}
      disabled={!newModel.name.trim() ||
        !newModel.provider ||
        !newModel.api_key.trim()}
    >
      Add Model
    </Button>
  </div>
</Dialog>

<!-- Edit Model Dialog -->
<Dialog bind:open={editDialogOpen} title="Edit Model" size="lg">
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
          >Model Name *</label
        >
        <Input id="edit-name" bind:value={editModel.name} required />
      </div>

      <div>
        <label for="edit-provider" class="block text-sm font-medium mb-2"
          >Provider *</label
        >
        <Select
          id="edit-provider"
          bind:value={editModel.provider}
          options={providerOptions}
          on:change={(e) => onEditProviderChange(e.detail)}
        />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="edit-engine" class="block text-sm font-medium mb-2"
          >Engine/Model ID *</label
        >
        <Input id="edit-engine" bind:value={editModel.engine} required />
        {#if editSelectedProvider}
          <div class="mt-1 text-xs text-muted-foreground">
            Common engines: {editSelectedProvider.engines
              .slice(0, 3)
              .join(", ")}
          </div>
        {/if}
      </div>

      <div>
        <label for="edit-api-key" class="block text-sm font-medium mb-2"
          >API Key *</label
        >
        <Input
          id="edit-api-key"
          bind:value={editModel.api_key}
          type="password"
          required
        />
      </div>
    </div>

    <div>
      <label for="edit-api-endpoint" class="block text-sm font-medium mb-2"
        >API Endpoint (Optional)</label
      >
      <Input id="edit-api-endpoint" bind:value={editModel.api_endpoint} />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="edit-max-tokens" class="block text-sm font-medium mb-2"
          >Max Tokens</label
        >
        <Input
          id="edit-max-tokens"
          bind:value={editModel.max_tokens}
          type="number"
          min="1"
          max="32000"
        />
      </div>

      <div>
        <label for="edit-temperature" class="block text-sm font-medium mb-2"
          >Temperature</label
        >
        <Input
          id="edit-temperature"
          bind:value={editModel.temperature}
          type="number"
          min="0"
          max="2"
          step="0.1"
        />
      </div>
    </div>

    <div>
      <label for="edit-description" class="block text-sm font-medium mb-2"
        >Description</label
      >
      <Textarea
        id="edit-description"
        bind:value={editModel.description}
        rows={2}
      />
    </div>
  </div>

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={() => (editDialogOpen = false)}>
      Cancel
    </Button>
    <Button
      on:click={handleUpdateModel}
      disabled={!editModel.name.trim() ||
        !editModel.provider ||
        !editModel.api_key.trim()}
    >
      Save Changes
    </Button>
  </div>
</Dialog>

<!-- View Model Dialog -->
<Dialog bind:open={viewDialogOpen} title="Model Details" size="lg">
  {#if selectedModel}
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-start space-x-4 pb-4 border-b border-border">
        <div
          class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-3xl"
        >
          {getProviderIcon(selectedModel.provider)}
        </div>
        <div class="flex-1">
          <h3 class="text-xl font-semibold text-foreground mb-1">
            {selectedModel.name}
          </h3>
          <p class="text-primary capitalize mb-2">
            {selectedModel.provider} • {selectedModel.engine}
          </p>
          {#if selectedModel.description}
            <p class="text-muted-foreground">
              {selectedModel.description}
            </p>
          {/if}
        </div>
      </div>

      <!-- Configuration Details -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="font-medium text-foreground mb-3">Configuration</h4>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Max Tokens:</span>
              <span class="font-medium"
                >{selectedModel.max_tokens.toLocaleString()}</span
              >
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Temperature:</span>
              <span class="font-medium">{selectedModel.temperature}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">API Key:</span>
              <span class="font-mono text-sm"
                >{maskApiKey(selectedModel.api_key)}</span
              >
            </div>
            {#if selectedModel.api_endpoint}
              <div class="flex justify-between">
                <span class="text-muted-foreground">Endpoint:</span>
                <span
                  class="font-mono text-sm truncate max-w-48"
                  title={selectedModel.api_endpoint}
                >
                  {selectedModel.api_endpoint}
                </span>
              </div>
            {/if}
          </div>
        </div>

        <div>
          <h4 class="font-medium text-foreground mb-3">Provider Info</h4>
          {#if selectedProvider}
            <div class="space-y-2">
              <p class="text-sm text-muted-foreground">
                {selectedProvider.description}
              </p>
              <div class="flex space-x-4">
                <a
                  href={selectedProvider.website}
                  target="_blank"
                  class="text-sm text-primary hover:underline flex items-center"
                >
                  Website
                  <ExternalLink class="w-3 h-3 ml-1" />
                </a>
                <a
                  href={selectedProvider.docs}
                  target="_blank"
                  class="text-sm text-primary hover:underline flex items-center"
                >
                  Documentation
                  <ExternalLink class="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Test Status -->
      {#if testResults[selectedModel.id]}
        <div
          class={`p-4 rounded-md ${
            testResults[selectedModel.id].success
              ? "bg-green-50 dark:bg-green-900/20"
              : "bg-red-50 dark:bg-red-900/20"
          }`}
        >
          <div class="flex items-center space-x-2">
            {#if testResults[selectedModel.id].success}
              <CheckCircle class="w-5 h-5 text-green-600" />
              <span class="font-medium text-green-700 dark:text-green-300"
                >Connection Test: Passed</span
              >
            {:else}
              <AlertCircle class="w-5 h-5 text-red-600" />
              <span class="font-medium text-red-700 dark:text-red-300"
                >Connection Test: Failed</span
              >
            {/if}
          </div>
          {#if testResults[selectedModel.id].error}
            <p class="mt-2 text-sm text-red-600 dark:text-red-400">
              {testResults[selectedModel.id].error}
            </p>
          {/if}
        </div>
      {/if}

      <!-- Metadata -->
      <div class="text-sm text-muted-foreground pt-4 border-t border-border">
        Created {formatDate(selectedModel.created_at)}
        {#if selectedModel.updated_at !== selectedModel.created_at}
          • Updated {formatDate(selectedModel.updated_at)}
        {/if}
      </div>
    </div>
  {/if}

  <div slot="footer" class="flex justify-between">
    <Button
      variant="outline"
      on:click={() => handleTestModel(selectedModel)}
      disabled={testingModel === selectedModel.id}
    >
      {#if testingModel === selectedModel.id}
        <Loader2 class="w-4 h-4 mr-2 animate-spin" />
        Testing...
      {:else}
        <TestTube class="w-4 h-4 mr-2" />
        Test Connection
      {/if}
    </Button>
    <div class="flex space-x-2">
      <Button variant="outline" on:click={() => openEditDialog(selectedModel)}>
        <Edit class="w-4 h-4 mr-2" />
        Edit
      </Button>
      <Button variant="outline" on:click={() => (viewDialogOpen = false)}>
        Close
      </Button>
    </div>
  </div>
</Dialog>
