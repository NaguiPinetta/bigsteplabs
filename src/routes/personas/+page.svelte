<script lang="ts">
  import { onMount } from "svelte";
  import { authStore, canManageContent } from "$lib/stores/auth";
  import {
    personasStore,
    loadPersonas,
    createPersona,
    updatePersona,
    deletePersona,
    setSelectedPersona,
    clearPersonasError,
    validatePersona,
    getPersonaTemplates,
  } from "$lib/stores/personas";

  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Textarea from "$lib/components/ui/textarea.svelte";
  import Select from "$lib/components/ui/select.svelte";
  import CrudTips from "$lib/components/ui/crud-tips.svelte";
  import {
    Bot,
    Plus,
    Edit,
    Trash2,
    Copy,
    Eye,
    Loader2,
    AlertCircle,
    Users,
    Sparkles,
    MessageSquare,
  } from "lucide-svelte";

  let createDialogOpen = false;
  let editDialogOpen = false;
  let viewDialogOpen = false;
  let templateDialogOpen = false;

  let newPersona = {
    name: "",
    description: "",
    system_prompt: "",
  };

  let editPersona = {
    id: "",
    name: "",
    description: "",
    system_prompt: "",
  };

  let validationErrors: string[] = [];
  let templates = getPersonaTemplates();

  $: user = $authStore.user;
  $: canManage = $canManageContent;
  $: state = $personasStore;
  $: personas = state.personas;
  $: selectedPersona = state.selectedPersona;

  // Debug form state
  $: {
    console.log("🔍 Form state changed:", {
      name: newPersona.name,
      description: newPersona.description,
      system_prompt: newPersona.system_prompt,
      nameValid: newPersona.name.trim().length >= 2,
      promptValid: newPersona.system_prompt.trim().length >= 10,
      buttonDisabled:
        !newPersona.name.trim() || !newPersona.system_prompt.trim(),
    });
  }

  onMount(() => {
    if (canManage) {
      loadPersonas();
    }
  });

  function resetNewPersona() {
    newPersona = {
      name: "",
      description: "",
      system_prompt: "",
    };
    validationErrors = [];
  }

  async function handleCreatePersona() {
    console.log("🔍 handleCreatePersona called");
    console.log("🔍 User:", user);
    console.log("🔍 New persona data:", newPersona);

    if (!user) {
      console.log("❌ No user found, returning");
      return;
    }

    const validation = validatePersona(newPersona);
    console.log("🔍 Validation result:", validation);

    if (!validation.valid) {
      validationErrors = validation.errors;
      console.log("❌ Validation failed:", validationErrors);
      return;
    }

    const personaData = {
      name: newPersona.name.trim(),
      description: newPersona.description.trim() || null,
      system_prompt: newPersona.system_prompt.trim(),
      is_default: false,
      created_by: user.id,
    };

    console.log("🔍 Calling createPersona with:", personaData);

    const result = await createPersona(personaData);

    console.log("🔍 createPersona result:", result);

    if (result.data) {
      console.log("✅ Persona created successfully:", result.data);
      resetNewPersona();
      createDialogOpen = false;
    } else {
      console.log("❌ Persona creation failed:", result.error);
    }
  }

  async function handleUpdatePersona() {
    const validation = validatePersona(editPersona);
    if (!validation.valid) {
      validationErrors = validation.errors;
      return;
    }

    const result = await updatePersona(editPersona.id, {
      name: editPersona.name.trim(),
      description: editPersona.description.trim() || null,
      system_prompt: editPersona.system_prompt.trim(),
    });

    if (result.data) {
      validationErrors = [];
      editDialogOpen = false;
    }
  }

  async function handleDeletePersona(persona: any) {
    if (
      !confirm(`Are you sure you want to delete the persona "${persona.name}"?`)
    ) {
      return;
    }

    await deletePersona(persona.id);
  }

  async function openEditDialog(persona: any) {
    editPersona = {
      id: persona.id,
      name: persona.name,
      description: persona.description || "",
      system_prompt: persona.system_prompt,
    };
    validationErrors = [];
    editDialogOpen = true;
  }

  function openViewDialog(persona: any) {
    setSelectedPersona(persona);
    viewDialogOpen = true;
  }

  function openCreateDialog() {
    console.log("🔍 openCreateDialog called");
    resetNewPersona();
    createDialogOpen = true;
  }

  function openTemplatesDialog() {
    templateDialogOpen = true;
  }

  function applyTemplate(template: any) {
    newPersona = {
      ...newPersona,
      name: template.name,
      description: template.description,
      system_prompt: template.system_prompt,
    };
    templateDialogOpen = false;
    createDialogOpen = true;
  }

  async function duplicatePersona(persona: any) {
    newPersona = {
      name: `${persona.name} (Copy)`,
      description: persona.description || "",
      system_prompt: persona.system_prompt,
    };
    createDialogOpen = true;
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function truncateText(text: string, maxLength: number = 100): string {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  }
</script>

<svelte:head>
  <title>AI Personas - BigStepLabs</title>
  <meta name="description" content="Manage AI personas and teaching styles" />
</svelte:head>

<!-- Page Header -->
<div class="mb-8 flex items-center justify-between">
  <div>
    <h1 class="text-2xl font-bold text-foreground">AI Personas</h1>
    <p class="text-muted-foreground">
      Define personalities and teaching styles for your AI agents
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
        Create Persona
      </Button>
    </div>
  {/if}
</div>

<div class="max-w-7xl mx-auto">
  {#if !canManage}
    <Card class="p-8 text-center">
      <h2 class="text-xl font-semibold mb-2">Access Restricted</h2>
      <p class="text-muted-foreground">
        You need Admin or Collaborator privileges to manage AI personas.
      </p>
    </Card>
  {:else if state.loading}
    <div class="flex items-center justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
      <span class="ml-2 text-muted-foreground">Loading personas...</span>
    </div>
  {:else if state.error}
    <Card class="p-6 border-destructive">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <AlertCircle class="w-5 h-5 text-destructive mr-2" />
          <span class="text-destructive font-medium">Error: {state.error}</span>
        </div>
        <Button variant="outline" on:click={clearPersonasError}>Dismiss</Button>
      </div>
    </Card>
  {:else if personas.length === 0}
    <Card class="p-12 text-center">
      <Bot class="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h2 class="text-xl font-semibold mb-2">No Personas Yet</h2>
      <p class="text-muted-foreground mb-6">
        Create AI personas to define different teaching styles and personalities
        for your agents.
      </p>
      <div class="flex justify-center space-x-3">
        <Button variant="outline" on:click={openTemplatesDialog}>
          <Sparkles class="w-4 h-4 mr-2" />
          Browse Templates
        </Button>
        <Button on:click={openCreateDialog}>
          <Plus class="w-4 h-4 mr-2" />
          Create Your First Persona
        </Button>
      </div>
    </Card>
  {:else}
    <!-- Personas Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each personas as persona (persona.id)}
        <Card class="p-6 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div
                class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-2xl"
              >
                🤖
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-foreground">
                  {persona.name}
                </h3>
                <p class="text-sm text-primary">AI Persona</p>
              </div>
            </div>

            <div class="flex items-center space-x-1">
              <button
                on:click={() => openViewDialog(persona)}
                class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                title="View details"
              >
                <Eye class="w-4 h-4" />
              </button>

              <button
                on:click={() => duplicatePersona(persona)}
                class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                title="Duplicate"
              >
                <Copy class="w-4 h-4" />
              </button>

              <button
                on:click={() => openEditDialog(persona)}
                class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                title="Edit persona"
              >
                <Edit class="w-4 h-4" />
              </button>

              <button
                on:click={() => handleDeletePersona(persona)}
                class="p-2 hover:bg-destructive/20 rounded-md text-muted-foreground hover:text-destructive"
                title="Delete persona"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          {#if persona.description}
            <p class="text-sm text-muted-foreground mb-3">
              {truncateText(persona.description, 120)}
            </p>
          {/if}

          <div class="text-xs text-muted-foreground mb-3">
            System Prompt: {persona.system_prompt.length} characters
          </div>

          <div
            class="text-xs text-muted-foreground pt-2 border-t border-border"
          >
            Created {formatDate(persona.created_at)}
          </div>
        </Card>
      {/each}
    </div>

    <!-- Tips -->
    <CrudTips
      title="Persona Management Tips"
      tips={[
        "Create diverse personas to match different teaching styles and student needs",
        "Write clear system prompts that define the AI's behavior and expertise",
        "Use personality traits and expertise areas to make personas more specific",
        "Test personas with different types of questions to ensure they work well",
      ]}
    />
  {/if}
</div>

<!-- Templates Dialog -->
<Dialog bind:open={templateDialogOpen} title="Persona Templates" size="lg">
  <div class="space-y-4">
    <p class="text-muted-foreground">
      Choose from these pre-built persona templates to get started quickly.
    </p>

    {#each templates as template}
      <Card class="p-4 hover:shadow-sm transition-shadow">
        <div class="flex items-start justify-between mb-2">
          <h4 class="font-semibold text-foreground">{template.name}</h4>
          <Button size="sm" on:click={() => applyTemplate(template)}>
            Use Template
          </Button>
        </div>
        <p class="text-sm text-muted-foreground mb-3">
          {template.description}
        </p>
        <details class="text-xs">
          <summary class="cursor-pointer text-primary hover:text-primary/80">
            View system prompt preview
          </summary>
          <div
            class="mt-2 p-2 bg-muted rounded text-muted-foreground font-mono"
          >
            {truncateText(template.system_prompt, 200)}
          </div>
        </details>
      </Card>
    {/each}
  </div>

  <div slot="footer" class="flex justify-end">
    <Button variant="outline" on:click={() => (templateDialogOpen = false)}>
      Close
    </Button>
  </div>
</Dialog>

<!-- Create Persona Dialog -->
<Dialog bind:open={createDialogOpen} title="Create New Persona" size="lg">
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

    <div>
      <label for="name" class="block text-sm font-medium mb-2"
        >Persona Name *</label
      >
      <Input
        id="name"
        bind:value={newPersona.name}
        placeholder="e.g., Friendly Tutor, Grammar Expert"
        required
        on:input={() => console.log("🔍 Name input changed:", newPersona.name)}
      />
    </div>

    <div>
      <label for="description" class="block text-sm font-medium mb-2"
        >Description</label
      >
      <Textarea
        id="description"
        bind:value={newPersona.description}
        placeholder="Brief description of this persona's role and characteristics..."
        rows={2}
      />
    </div>

    <div>
      <label for="system-prompt" class="block text-sm font-medium mb-2"
        >System Prompt *</label
      >
      <Textarea
        id="system-prompt"
        bind:value={newPersona.system_prompt}
        placeholder="Define how this AI persona should behave, respond, and interact with students..."
        rows={8}
        class="font-mono text-sm"
        on:input={() =>
          console.log(
            "🔍 System prompt input changed:",
            newPersona.system_prompt
          )}
      />
      <div class="flex justify-between text-xs text-muted-foreground mt-1">
        <span>This defines how the AI will behave and respond</span>
        <span>{newPersona.system_prompt.length}/4000 characters</span>
      </div>
    </div>
  </div>

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={() => (createDialogOpen = false)}>
      Cancel
    </Button>
    <Button
      on:click={() => {
        console.log("🔍 Create Persona button clicked");
        handleCreatePersona();
      }}
      disabled={!newPersona.name.trim() || !newPersona.system_prompt.trim()}
    >
      Create Persona
      {#if !newPersona.name.trim() || !newPersona.system_prompt.trim()}
        (Disabled - missing required fields)
      {/if}
    </Button>
  </div>
</Dialog>

<!-- Edit Persona Dialog -->
<Dialog bind:open={editDialogOpen} title="Edit Persona" size="lg">
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

    <div>
      <label for="edit-name" class="block text-sm font-medium mb-2"
        >Persona Name *</label
      >
      <Input id="edit-name" bind:value={editPersona.name} required />
    </div>

    <div>
      <label for="edit-description" class="block text-sm font-medium mb-2"
        >Description</label
      >
      <Textarea
        id="edit-description"
        bind:value={editPersona.description}
        rows={2}
      />
    </div>

    <div>
      <label for="edit-system-prompt" class="block text-sm font-medium mb-2"
        >System Prompt *</label
      >
      <Textarea
        id="edit-system-prompt"
        bind:value={editPersona.system_prompt}
        rows={8}
        class="font-mono text-sm"
      />
      <div class="flex justify-between text-xs text-muted-foreground mt-1">
        <span>This defines how the AI will behave and respond</span>
        <span>{editPersona.system_prompt.length}/4000 characters</span>
      </div>
    </div>
  </div>

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={() => (editDialogOpen = false)}>
      Cancel
    </Button>
    <Button
      on:click={handleUpdatePersona}
      disabled={!editPersona.name.trim() || !editPersona.system_prompt.trim()}
    >
      Save Changes
    </Button>
  </div>
</Dialog>

<!-- View Persona Dialog -->
<Dialog bind:open={viewDialogOpen} title="Persona Details" size="lg">
  {#if selectedPersona}
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-start space-x-4 pb-4 border-b border-border">
        <div
          class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-3xl"
        >
          🤖
        </div>
        <div class="flex-1">
          <h3 class="text-xl font-semibold text-foreground mb-1">
            {selectedPersona.name}
          </h3>
          <p class="text-primary mb-2">AI Persona</p>
          {#if selectedPersona.description}
            <p class="text-muted-foreground">
              {selectedPersona.description}
            </p>
          {/if}
        </div>
      </div>

      <!-- System Prompt -->
      <div>
        <h4 class="font-medium text-foreground mb-2">System Prompt</h4>
        <div class="bg-muted rounded-md p-4 max-h-64 overflow-y-auto">
          <pre
            class="text-sm text-muted-foreground whitespace-pre-wrap font-mono">{selectedPersona.system_prompt}</pre>
        </div>
      </div>

      <!-- Metadata -->
      <div class="text-sm text-muted-foreground pt-4 border-t border-border">
        Created {formatDate(selectedPersona.created_at)}
        {#if selectedPersona.updated_at !== selectedPersona.created_at}
          • Updated {formatDate(selectedPersona.updated_at)}
        {/if}
      </div>
    </div>
  {/if}

  <div slot="footer" class="flex justify-between">
    <Button
      variant="outline"
      on:click={() => duplicatePersona(selectedPersona)}
    >
      <Copy class="w-4 h-4 mr-2" />
      Duplicate
    </Button>
    <div class="flex space-x-2">
      <Button
        variant="outline"
        on:click={() => openEditDialog(selectedPersona)}
      >
        <Edit class="w-4 h-4 mr-2" />
        Edit
      </Button>
      <Button variant="outline" on:click={() => (viewDialogOpen = false)}>
        Close
      </Button>
    </div>
  </div>
</Dialog>
