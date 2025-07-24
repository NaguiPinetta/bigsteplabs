<script lang="ts">
  import { onMount } from "svelte";
  import { authStore, canManageContent } from "$lib/stores/auth";
  import {
    datasetsStore,
    loadDatasets,
    createDataset,
    updateDataset,
    deleteDataset,
    loadDatasetChunks,
    setSelectedDataset,
    clearDatasetsError,
  } from "$lib/stores/datasets";

  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Textarea from "$lib/components/ui/textarea.svelte";
  import FileUpload from "$lib/components/ui/file-upload.svelte";
  import {
    Database,
    Plus,
    Edit,
    Trash2,
    FileText,
    Upload,
    Eye,
    ChevronRight,
    Loader2,
    AlertCircle,
    CheckCircle,
  } from "lucide-svelte";

  let createDialogOpen = false;
  let editDialogOpen = false;
  let chunkDialogOpen = false;
  let viewDialogOpen = false;

  let newDataset = {
    name: "",
    description: "",
    contentType: "file",
    textFormat: "plain",
    textContent: "",
    file: null as File | null,
  };

  let editDataset = {
    id: "",
    name: "",
    description: "",
  };

  let chunkInput = {
    content: "",
    chunkSize: 1000,
    overlap: 200,
  };

  $: user = $authStore.user;
  $: canManage = canManageContent();
  $: state = $datasetsStore;
  $: datasets = state.datasets;
  $: selectedDataset = state.selectedDataset;
  $: selectedChunks = selectedDataset
    ? state.chunks[selectedDataset.id] || []
    : [];

  onMount(() => {
    if (canManage) {
      loadDatasets();
    }
  });

  // Handle file selection for dataset creation
  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      newDataset.file = file;
    }
  }

  async function handleCreateDataset() {
    if (!newDataset.name.trim() || !user) return;

    try {
      const datasetData = {
        name: newDataset.name.trim(),
        description: newDataset.description.trim() || null,
        user_id: user.id,
        content_type: newDataset.contentType as "file" | "text",
        text_content:
          newDataset.contentType === "text" ? newDataset.textContent : null,
        text_format:
          newDataset.contentType === "text"
            ? (newDataset.textFormat as "json" | "markdown" | "plain")
            : null,
        file:
          newDataset.contentType === "file" && newDataset.file
            ? newDataset.file
            : undefined,
      };

      const result = await createDataset(datasetData);

      if (result) {
        newDataset = {
          name: "",
          description: "",
          contentType: "file",
          textFormat: "plain",
          textContent: "",
          file: null as File | null,
        };
        createDialogOpen = false;
      }
    } catch (error) {
      console.error("Error creating dataset:", error);
      // Show error to user
      alert("Failed to create dataset. Please check the console for details.");
    }
  }

  async function handleUpdateDataset() {
    if (!editDataset.name.trim()) return;

    const result = await updateDataset(editDataset.id, {
      name: editDataset.name.trim(),
      description: editDataset.description.trim() || null,
    });

    if (result.data) {
      editDialogOpen = false;
    }
  }

  async function handleDeleteDataset(dataset: any) {
    if (
      !confirm(
        `Are you sure you want to delete "${dataset.name}" and all its chunks?`
      )
    ) {
      return;
    }

    await deleteDataset(dataset.id);
  }

  async function openEditDialog(dataset: any) {
    editDataset = {
      id: dataset.id,
      name: dataset.name,
      description: dataset.description || "",
    };
    editDialogOpen = true;
  }

  async function openViewDialog(dataset: any) {
    setSelectedDataset(dataset);
    await loadDatasetChunks(dataset.id);
    viewDialogOpen = true;
  }

  async function openChunkDialog(dataset: any) {
    setSelectedDataset(dataset);
    chunkInput = { content: "", chunkSize: 1000, overlap: 200 };
    chunkDialogOpen = true;
  }

  async function handleCreateChunks() {
    if (!selectedDataset || !chunkInput.content.trim()) return;

    const result = await createChunks(
      selectedDataset.id,
      chunkInput.content,
      "manual_input",
      chunkInput.chunkSize,
      chunkInput.overlap
    );

    if (result.data) {
      chunkInput.content = "";
      chunkDialogOpen = false;
    }
  }

  async function handleFileUpload(
    event: CustomEvent<{ files: FileList }>,
    datasetId: string
  ) {
    const { files } = event.detail;
    const file = files[0]; // Handle one file at a time for now

    if (!file) return;

    await processFileToChunks(
      datasetId,
      file,
      chunkInput.chunkSize,
      chunkInput.overlap
    );
    chunkDialogOpen = false;
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getChunkPreview(content: string, maxLength = 100): string {
    return content.length > maxLength
      ? content.substring(0, maxLength) + "..."
      : content;
  }
</script>

<svelte:head>
  <title>Datasets - BigStepLabs</title>
  <meta name="description" content="Manage AI training datasets" />
</svelte:head>

<!-- Page Header -->
<div class="mb-8 flex items-center justify-between">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Datasets</h1>
    <p class="text-muted-foreground">
      Manage knowledge bases for your AI agents
    </p>
  </div>

  {#if canManage}
    <Button on:click={() => (createDialogOpen = true)}>
      <Plus class="w-4 h-4 mr-2" />
      Create Dataset
    </Button>
  {/if}
</div>

<div class="max-w-7xl mx-auto">
  {#if !canManage}
    <Card class="p-8 text-center">
      <h2 class="text-xl font-semibold mb-2">Access Restricted</h2>
      <p class="text-muted-foreground">
        You need Admin or Collaborator privileges to manage datasets.
      </p>
    </Card>
  {:else if state.loading}
    <div class="flex items-center justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
      <span class="ml-2 text-muted-foreground">Loading datasets...</span>
    </div>
  {:else if state.error}
    <Card class="p-6 border-destructive">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <AlertCircle class="w-5 h-5 text-destructive mr-2" />
          <span class="text-destructive font-medium">Error: {state.error}</span>
        </div>
        <Button variant="outline" on:click={clearDatasetsError}>Dismiss</Button>
      </div>
    </Card>
  {:else if datasets.length === 0}
    <Card class="p-12 text-center">
      <Database class="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h2 class="text-xl font-semibold mb-2">No Datasets Yet</h2>
      <p class="text-muted-foreground mb-6">
        Create your first dataset to start building knowledge bases for AI
        agents.
      </p>
      <Button on:click={() => (createDialogOpen = true)}>
        <Plus class="w-4 h-4 mr-2" />
        Create Your First Dataset
      </Button>
    </Card>
  {:else}
    <!-- Datasets Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each datasets as dataset (dataset.id)}
        <Card class="p-6 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-foreground mb-2">
                {dataset.name}
              </h3>
              {#if dataset.description}
                <p class="text-sm text-muted-foreground mb-3">
                  {dataset.description}
                </p>
              {/if}
              <p class="text-xs text-muted-foreground">
                Created {formatDate(dataset.created_at)}
              </p>
            </div>

            <div class="flex items-center space-x-1 ml-4">
              <button
                on:click={() => openViewDialog(dataset)}
                class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                title="View chunks"
              >
                <Eye class="w-4 h-4" />
              </button>

              <button
                on:click={() => openChunkDialog(dataset)}
                class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                title="Add content"
              >
                <Plus class="w-4 h-4" />
              </button>

              <button
                on:click={() => openEditDialog(dataset)}
                class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                title="Edit dataset"
              >
                <Edit class="w-4 h-4" />
              </button>

              <button
                on:click={() => handleDeleteDataset(dataset)}
                class="p-2 hover:bg-destructive/20 rounded-md text-muted-foreground hover:text-destructive"
                title="Delete dataset"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between text-sm">
            <span class="flex items-center text-muted-foreground">
              <FileText class="w-4 h-4 mr-1" />
              {(state.chunks[dataset.id] || []).length} chunks
            </span>
            <Button
              variant="ghost"
              size="sm"
              on:click={() => openViewDialog(dataset)}
            >
              View Details
              <ChevronRight class="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>

<!-- Create Dataset Dialog -->
<Dialog bind:open={createDialogOpen} title="Create New Dataset">
  <div class="space-y-4">
    <div>
      <label for="name" class="block text-sm font-medium mb-2"
        >Dataset Name *</label
      >
      <Input
        id="name"
        bind:value={newDataset.name}
        placeholder="e.g., Spanish Vocabulary, Grammar Rules"
        required
      />
    </div>

    <div>
      <label for="description" class="block text-sm font-medium mb-2"
        >Description</label
      >
      <Textarea
        id="description"
        bind:value={newDataset.description}
        placeholder="Optional description of what this dataset contains..."
        rows={3}
      />
    </div>

    <!-- Content Type Selection -->
    <div>
      <label class="block text-sm font-medium mb-2">Content Type *</label>
      <div class="flex space-x-4">
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            bind:group={newDataset.contentType}
            value="file"
            class="w-4 h-4 text-primary"
          />
          <span>Upload File</span>
        </label>
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            bind:group={newDataset.contentType}
            value="text"
            class="w-4 h-4 text-primary"
          />
          <span>Direct Text Input</span>
        </label>
      </div>
    </div>

    {#if newDataset.contentType === "file"}
      <!-- File Upload Section -->
      <div>
        <label for="file-upload" class="block text-sm font-medium mb-2"
          >Upload File</label
        >
        <input
          id="file-upload"
          type="file"
          accept=".txt,.md,.csv,.json"
          class="w-full px-3 py-2 border border-input bg-background rounded-md"
          on:change={handleFileSelect}
        />
        <p class="text-xs text-muted-foreground mt-1">
          Supports .txt, .md, .csv, .json files (max 5MB)
        </p>
      </div>
    {:else if newDataset.contentType === "text"}
      <!-- Direct Text Input Section -->
      <div>
        <label class="block text-sm font-medium mb-2">Text Format</label>
        <select
          bind:value={newDataset.textFormat}
          class="w-full px-3 py-2 border border-input bg-background rounded-md"
        >
          <option value="plain">Plain Text</option>
          <option value="markdown">Markdown</option>
          <option value="json">JSON</option>
        </select>
      </div>

      <div>
        <label for="text-content" class="block text-sm font-medium mb-2"
          >Content *</label
        >
        <Textarea
          id="text-content"
          bind:value={newDataset.textContent}
          placeholder={newDataset.textFormat === "json"
            ? '{"data": [{"question": "What is AI?", "answer": "Artificial Intelligence..."}}]'
            : newDataset.textFormat === "markdown"
              ? "# Title\n\n## Section\n\nContent here..."
              : "Enter your text content here..."}
          rows={8}
          required
        />
        <p class="text-xs text-muted-foreground mt-1">
          This content will be automatically chunked for use by AI agents
        </p>
      </div>
    {/if}
  </div>

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={() => (createDialogOpen = false)}>
      Cancel
    </Button>
    <Button
      on:click={handleCreateDataset}
      disabled={!newDataset.name.trim() ||
        (newDataset.contentType === "text" &&
          !newDataset.textContent?.trim()) ||
        (newDataset.contentType === "file" && !newDataset.file)}
    >
      Create Dataset
    </Button>
  </div>
</Dialog>

<!-- Edit Dataset Dialog -->
<Dialog bind:open={editDialogOpen} title="Edit Dataset">
  <div class="space-y-4">
    <div>
      <label for="edit-name" class="block text-sm font-medium mb-2"
        >Dataset Name *</label
      >
      <Input id="edit-name" bind:value={editDataset.name} required />
    </div>

    <div>
      <label for="edit-description" class="block text-sm font-medium mb-2"
        >Description</label
      >
      <Textarea
        id="edit-description"
        bind:value={editDataset.description}
        rows={3}
      />
    </div>
  </div>

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={() => (editDialogOpen = false)}>
      Cancel
    </Button>
    <Button on:click={handleUpdateDataset} disabled={!editDataset.name.trim()}>
      Save Changes
    </Button>
  </div>
</Dialog>

<!-- Add Content Dialog -->
<Dialog bind:open={chunkDialogOpen} title="Add Content to Dataset">
  {#if selectedDataset}
    <div class="space-y-6">
      <div class="text-sm text-muted-foreground mb-4">
        Adding content to: <strong>{selectedDataset.name}</strong>
      </div>

      <!-- Chunking Settings -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="chunk-size" class="block text-sm font-medium mb-2"
            >Chunk Size</label
          >
          <Input
            id="chunk-size"
            type="number"
            bind:value={chunkInput.chunkSize}
            min="100"
            max="4000"
          />
          <p class="text-xs text-muted-foreground mt-1">Characters per chunk</p>
        </div>

        <div>
          <label for="overlap" class="block text-sm font-medium mb-2"
            >Overlap</label
          >
          <Input
            id="overlap"
            type="number"
            bind:value={chunkInput.overlap}
            min="0"
            max="500"
          />
          <p class="text-xs text-muted-foreground mt-1">
            Character overlap between chunks
          </p>
        </div>
      </div>

      <!-- Text Input -->
      <div>
        <label for="content" class="block text-sm font-medium mb-2"
          >Text Content</label
        >
        <Textarea
          id="content"
          bind:value={chunkInput.content}
          placeholder="Paste your text content here, or upload a file below..."
          rows={6}
        />
      </div>

      <!-- OR Divider -->
      <div class="flex items-center">
        <div class="flex-1 border-t border-border"></div>
        <span class="px-3 text-sm text-muted-foreground">OR</span>
        <div class="flex-1 border-t border-border"></div>
      </div>

      <!-- File Upload -->
      <div>
        <span class="block text-sm font-medium mb-2">Upload File</span>
        <FileUpload
          accept=".txt,.md,.csv"
          maxSize={5 * 1024 * 1024}
          label="Upload text file"
          description="Supports .txt, .md, .csv files (max 5MB)"
          on:upload={(e) => handleFileUpload(e, selectedDataset.id)}
        />
      </div>
    </div>
  {/if}

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={() => (chunkDialogOpen = false)}>
      Cancel
    </Button>
    <Button on:click={handleCreateChunks} disabled={!chunkInput.content.trim()}>
      Create Chunks
    </Button>
  </div>
</Dialog>

<!-- View Dataset Dialog -->
<Dialog bind:open={viewDialogOpen} title="Dataset Details" size="lg">
  {#if selectedDataset}
    <div class="space-y-6">
      <!-- Dataset Info -->
      <div class="border-b border-border pb-4">
        <h3 class="text-lg font-semibold mb-2">{selectedDataset.name}</h3>
        {#if selectedDataset.description}
          <p class="text-muted-foreground mb-2">
            {selectedDataset.description}
          </p>
        {/if}
        <p class="text-sm text-muted-foreground">
          Created {formatDate(selectedDataset.created_at)} • {selectedChunks.length}
          chunks
        </p>
      </div>

      <!-- Chunks List -->
      <div>
        <h4 class="font-medium mb-3">Content Chunks</h4>
        {#if selectedChunks.length === 0}
          <div class="text-center py-8 text-muted-foreground">
            <FileText class="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No chunks yet. Add some content to get started.</p>
          </div>
        {:else}
          <div class="max-h-96 overflow-y-auto space-y-2">
            {#each selectedChunks as chunk, index (chunk.id)}
              <div class="border border-border rounded-md p-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium">Chunk {index + 1}</span>
                  <div class="flex items-center text-xs text-muted-foreground">
                    <span>{chunk.content.length} chars</span>
                    {#if chunk.source}
                      <span class="ml-2">• {chunk.source}</span>
                    {/if}
                  </div>
                </div>
                <p class="text-sm text-muted-foreground">
                  {getChunkPreview(chunk.content)}
                </p>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <div slot="footer" class="flex justify-between">
    <Button variant="outline" on:click={() => openChunkDialog(selectedDataset)}>
      <Plus class="w-4 h-4 mr-2" />
      Add Content
    </Button>
    <Button variant="outline" on:click={() => (viewDialogOpen = false)}>
      Close
    </Button>
  </div>
</Dialog>
