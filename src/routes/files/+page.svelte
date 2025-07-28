<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import { authStore, canManageContent } from "$lib/stores/auth";
  import {
    filesStore,
    loadFiles,
    uploadFiles,
    deleteFiles,
    createFolder,
    renameFile,
    moveFiles,
    searchFiles,
    toggleFileSelection,
    selectAllFiles,
    clearSelection,
    setViewMode,
    clearFilesError,
    formatFileSize,
    getFileIcon,
  } from "$lib/stores/files";

  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import CrudTips from "$lib/components/ui/crud-tips.svelte";
  import {
    Upload,
    FolderPlus,
    Search,
    Grid3X3,
    List,
    Trash2,
    Edit,
    Download,
    Move,
    Copy,
    Eye,
    MoreHorizontal,
    ArrowUp,
    File,
    Folder,
    Image,
    Video,
    Music,
    FileText,
    Archive,
    Loader2,
    AlertCircle,
    CheckCircle,
    X,
    Plus,
  } from "lucide-svelte";

  let fileInput: HTMLInputElement;
  let dragActive = false;
  let uploadProgress = 0;

  // Dialogs
  let createFolderOpen = false;
  let renameDialogOpen = false;
  let moveDialogOpen = false;
  let deleteDialogOpen = false;
  let previewDialogOpen = false;

  // Form data
  let newFolderName = "";
  let renameFileName = "";
  let selectedFileForRename = null;
  let selectedFileForPreview = null;
  let moveTargetFolder = "/";

  $: user = $authStore.user;
  $: canManage = $canManageContent;
  $: state = $filesStore;
  $: filteredFiles = state.searchQuery
    ? state.files.filter(
        (f) =>
          f.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
          f.type.toLowerCase().includes(state.searchQuery.toLowerCase())
      )
    : state.files;

  onMount(async () => {
    if (canManage) {
      await loadFiles("/");
    }
  });

  function handleFileSelect(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      handleUpload(files);
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragActive = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      handleUpload(files);
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragActive = true;
  }

  function handleDragLeave() {
    dragActive = false;
  }

  async function handleUpload(files: FileList) {
    uploadProgress = 0;

    await uploadFiles(files, state.currentFolder, (progress) => {
      uploadProgress = progress;
    });

    uploadProgress = 0;
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;

    await createFolder(newFolderName.trim(), state.currentFolder);
    newFolderName = "";
    createFolderOpen = false;

    // Reload files
    await loadFiles(state.currentFolder);
  }

  async function handleRename() {
    if (!selectedFileForRename || !renameFileName.trim()) return;

    await renameFile(selectedFileForRename.path, renameFileName.trim());

    selectedFileForRename = null;
    renameFileName = "";
    renameDialogOpen = false;
  }

  async function handleDelete() {
    if (state.selectedFiles.length === 0) return;

    const selectedPaths = state.files
      .filter((f) => state.selectedFiles.includes(f.id))
      .map((f) => f.path);

    await deleteFiles(selectedPaths);
    deleteDialogOpen = false;
  }

  async function handleMove() {
    if (state.selectedFiles.length === 0) return;

    const selectedPaths = state.files
      .filter((f) => state.selectedFiles.includes(f.id))
      .map((f) => f.path);

    await moveFiles(selectedPaths, moveTargetFolder);
    moveDialogOpen = false;
  }

  function openRenameDialog(file) {
    selectedFileForRename = file;
    renameFileName = file.name;
    renameDialogOpen = true;
  }

  function openPreviewDialog(file) {
    selectedFileForPreview = file;
    previewDialogOpen = true;
  }

  async function navigateToFolder(folder: string) {
    await loadFiles(folder);
    clearSelection();
  }

  function downloadFile(file) {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function getFileTypeIcon(type: string) {
    switch (type) {
      case "image":
        return Image;
      case "video":
        return Video;
      case "audio":
        return Music;
      case "document":
        return FileText;
      case "archive":
        return Archive;
      case "folder":
        return Folder;
      default:
        return File;
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function isImageFile(file) {
    return file.type === "image" || file.type.startsWith("image/");
  }

  function isVideoFile(file) {
    return file.type === "video" || file.type.startsWith("video/");
  }

  function getBreadcrumbs(folder: string): string[] {
    if (folder === "/") return ["/"];
    return folder.split("/").filter(Boolean);
  }
</script>

<svelte:head>
  <title>File Manager - BigStepLabs</title>
  <meta
    name="description"
    content="Manage course files and learning materials"
  />
</svelte:head>

<!-- Page Header -->
<div
  class="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
>
  <div>
    <h1 class="text-xl lg:text-2xl font-bold text-foreground">File Manager</h1>
    <p class="text-sm lg:text-base text-muted-foreground">
      Upload, organize, and manage your course files and learning materials
    </p>
  </div>

  {#if canManage}
    <div class="flex flex-col sm:flex-row gap-2">
      <Button
        variant="outline"
        on:click={() => (createFolderOpen = true)}
        class="w-full sm:w-auto"
      >
        <FolderPlus class="w-4 h-4 mr-2" />
        New Folder
      </Button>
      <Button on:click={() => fileInput.click()} class="w-full sm:w-auto">
        <Upload class="w-4 h-4 mr-2" />
        Upload Files
      </Button>
    </div>
  {/if}
</div>

<div class="max-w-7xl mx-auto">
  {#if !canManage}
    <Card class="p-8 text-center">
      <h2 class="text-xl font-semibold mb-2">Access Restricted</h2>
      <p class="text-muted-foreground">
        You need Admin or Collaborator privileges to manage files.
      </p>
    </Card>
  {:else if state.loading}
    <div class="flex items-center justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
      <span class="ml-2 text-muted-foreground">Loading files...</span>
    </div>
  {:else}
    <!-- Toolbar -->
    <Card class="p-4 mb-6">
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div class="flex items-center space-x-4">
          <!-- Breadcrumbs -->
          <div class="flex items-center space-x-2 text-sm overflow-x-auto">
            <button
              class="text-primary hover:underline whitespace-nowrap"
              on:click={() => navigateToFolder("/")}
            >
              Home
            </button>
            {#each getBreadcrumbs(state.currentFolder).slice(1) as folder, index}
              <span class="text-muted-foreground">/</span>
              <button
                class="text-primary hover:underline whitespace-nowrap"
                on:click={() =>
                  navigateToFolder(
                    "/" +
                      getBreadcrumbs(state.currentFolder)
                        .slice(1, index + 2)
                        .join("/")
                  )}
              >
                {folder}
              </button>
            {/each}
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <!-- Search -->
          <div class="relative">
            <Search
              class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"
            />
            <Input
              placeholder="Search files..."
              class="pl-10 w-full sm:w-64"
              value={state.searchQuery}
              on:input={(e) => searchFiles(e.target.value)}
            />
          </div>

          <!-- View Toggle -->
          <div
            class="flex border border-border rounded-md self-start sm:self-auto"
          >
            <button
              class="p-2 {state.viewMode === 'grid' ? 'bg-accent' : ''}"
              on:click={() => setViewMode("grid")}
            >
              <Grid3X3 class="w-4 h-4" />
            </button>
            <button
              class="p-2 {state.viewMode === 'list' ? 'bg-accent' : ''}"
              on:click={() => setViewMode("list")}
            >
              <List class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Selection Actions -->
      {#if state.selectedFiles.length > 0}
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t border-border"
        >
          <span class="text-sm text-muted-foreground">
            {state.selectedFiles.length} file(s) selected
          </span>

          <div
            class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            <Button
              variant="outline"
              size="sm"
              on:click={() => (moveDialogOpen = true)}
              class="w-full sm:w-auto"
            >
              <Move class="w-4 h-4 mr-2" />
              Move
            </Button>
            <Button
              variant="outline"
              size="sm"
              on:click={() => (deleteDialogOpen = true)}
              class="w-full sm:w-auto"
            >
              <Trash2 class="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              on:click={clearSelection}
              class="w-full sm:w-auto"
            >
              <X class="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      {/if}
    </Card>

    <!-- Upload Area -->
    {#if state.uploading || uploadProgress > 0}
      <Card class="p-6 mb-6 border-primary">
        <div class="text-center">
          <Loader2 class="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p class="text-foreground font-medium">Uploading files...</p>
          <div class="w-full bg-muted rounded-full h-2 mt-2">
            <div
              class="bg-primary rounded-full h-2 transition-all duration-300"
              style="width: {uploadProgress}%"
            ></div>
          </div>
          <p class="text-sm text-muted-foreground mt-2">
            {uploadProgress}% complete
          </p>
        </div>
      </Card>
    {/if}

    <!-- Drag & Drop Zone -->
    <div
      class="mb-6 border-2 border-dashed border-border rounded-lg p-8 text-center {dragActive
        ? 'border-primary bg-primary/5'
        : ''} {state.uploading ? 'pointer-events-none opacity-50' : ''}"
      on:drop={handleDrop}
      on:dragover={handleDragOver}
      on:dragleave={handleDragLeave}
    >
      <Upload class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 class="text-lg font-semibold text-foreground mb-2">
        {dragActive ? "Drop files here" : "Upload Files"}
      </h3>
      <p class="text-muted-foreground mb-4">
        Drag and drop files here, or click to browse
      </p>
      <Button variant="outline" on:click={() => fileInput.click()}>
        <Upload class="w-4 h-4 mr-2" />
        Browse Files
      </Button>
    </div>

    <!-- Error Display -->
    {#if state.error}
      <Card class="p-4 mb-6 border-destructive">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <AlertCircle class="w-5 h-5 text-destructive mr-2" />
            <span class="text-destructive font-medium">{state.error}</span>
          </div>
          <Button variant="outline" size="sm" on:click={clearFilesError}>
            Dismiss
          </Button>
        </div>
      </Card>
    {/if}

    <!-- Files Display -->
    {#if filteredFiles.length === 0}
      <Card class="p-12 text-center">
        <Folder class="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 class="text-xl font-semibold mb-2">
          {state.searchQuery ? "No files found" : "No files in this folder"}
        </h2>
        <p class="text-muted-foreground mb-6">
          {state.searchQuery
            ? "Try adjusting your search query"
            : "Upload some files to get started"}
        </p>
        {#if !state.searchQuery}
          <Button on:click={() => fileInput.click()}>
            <Upload class="w-4 h-4 mr-2" />
            Upload Files
          </Button>
        {/if}
      </Card>
    {:else if state.viewMode === "grid"}
      <!-- Grid View -->
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {#each filteredFiles as file (file.id)}
          {@const FileIcon = getFileTypeIcon(file.type)}
          <Card
            class="p-4 hover:shadow-md transition-shadow cursor-pointer {state.selectedFiles.includes(
              file.id
            )
              ? 'ring-2 ring-primary'
              : ''}"
            on:click={() => toggleFileSelection(file.id)}
          >
            <div class="text-center">
              {#if isImageFile(file) && file.url}
                <div
                  class="w-full h-24 bg-muted rounded-md mb-3 overflow-hidden"
                >
                  <img
                    src={file.url}
                    alt={file.name}
                    class="w-full h-full object-cover"
                    on:error={(e) => {
                      e.target.style.display = "none";
                      e.target.nextElementSibling.style.display = "flex";
                    }}
                  />
                  <div class="w-full h-full hidden items-center justify-center">
                    <FileIcon class="w-8 h-8 text-muted-foreground" />
                  </div>
                </div>
              {:else}
                <div
                  class="w-full h-24 bg-muted rounded-md mb-3 flex items-center justify-center"
                >
                  <FileIcon class="w-8 h-8 text-muted-foreground" />
                </div>
              {/if}

              <p class="text-sm font-medium text-foreground truncate mb-1">
                {file.name}
              </p>
              <p class="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>

              <!-- Actions -->
              <div
                class="flex items-center justify-center space-x-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <button
                  class="p-1 hover:bg-accent rounded"
                  on:click|stopPropagation={() => openPreviewDialog(file)}
                  title="Preview"
                >
                  <Eye class="w-3 h-3" />
                </button>
                <button
                  class="p-1 hover:bg-accent rounded"
                  on:click|stopPropagation={() => downloadFile(file)}
                  title="Download"
                >
                  <Download class="w-3 h-3" />
                </button>
                <button
                  class="p-1 hover:bg-accent rounded"
                  on:click|stopPropagation={() => openRenameDialog(file)}
                  title="Rename"
                >
                  <Edit class="w-3 h-3" />
                </button>
              </div>
            </div>
          </Card>
        {/each}
      </div>
    {:else}
      <!-- Desktop List View -->
      <div class="hidden lg:block">
        <Card class="overflow-hidden">
          <div class="p-4 border-b border-border bg-muted">
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  class="rounded border-input"
                  checked={state.selectedFiles.length === filteredFiles.length}
                  on:change={(e) =>
                    e.target.checked ? selectAllFiles() : clearSelection()}
                />
                <span class="text-sm font-medium">Name</span>
              </div>
              <div class="w-20 text-sm font-medium">Size</div>
              <div class="w-32 text-sm font-medium">Modified</div>
              <div class="w-20 text-sm font-medium">Actions</div>
            </div>
          </div>

          <div class="divide-y divide-border">
            {#each filteredFiles as file (file.id)}
              {@const FileIcon = getFileTypeIcon(file.type)}
              <div
                class="p-4 hover:bg-accent transition-colors {state.selectedFiles.includes(
                  file.id
                )
                  ? 'bg-primary/5'
                  : ''}"
              >
                <div class="flex items-center space-x-4">
                  <div class="flex items-center space-x-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      class="rounded border-input"
                      checked={state.selectedFiles.includes(file.id)}
                      on:change={() => toggleFileSelection(file.id)}
                    />
                    <FileIcon
                      class="w-5 h-5 text-muted-foreground flex-shrink-0"
                    />
                    <span class="text-sm font-medium truncate">{file.name}</span
                    >
                  </div>
                  <div class="w-20 text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </div>
                  <div class="w-32 text-sm text-muted-foreground">
                    {formatDate(file.uploaded_at)}
                  </div>
                  <div class="w-20">
                    <div class="flex items-center space-x-1">
                      <button
                        class="p-1 hover:bg-background rounded"
                        on:click={() => openPreviewDialog(file)}
                        title="Preview"
                      >
                        <Eye class="w-4 h-4" />
                      </button>
                      <button
                        class="p-1 hover:bg-background rounded"
                        on:click={() => downloadFile(file)}
                        title="Download"
                      >
                        <Download class="w-4 h-4" />
                      </button>
                      <button
                        class="p-1 hover:bg-background rounded"
                        on:click={() => openRenameDialog(file)}
                        title="Rename"
                      >
                        <Edit class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </Card>
      </div>

      <!-- Mobile List View -->
      <div class="lg:hidden">
        <div class="space-y-3">
          {#each filteredFiles as file (file.id)}
            {@const FileIcon = getFileTypeIcon(file.type)}
            <Card
              class="p-4 {state.selectedFiles.includes(file.id)
                ? 'bg-primary/5 border-primary/20'
                : ''}"
            >
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center space-x-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    class="rounded border-input"
                    checked={state.selectedFiles.includes(file.id)}
                    on:change={() => toggleFileSelection(file.id)}
                  />
                  <FileIcon
                    class="w-6 h-6 text-muted-foreground flex-shrink-0"
                  />
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </h3>
                    <p class="text-xs text-muted-foreground">
                      {formatFileSize(file.size)} • {formatDate(
                        file.uploaded_at
                      )}
                    </p>
                  </div>
                </div>
                <div class="flex items-center space-x-1">
                  <button
                    class="p-2 hover:bg-accent rounded-md"
                    on:click={() => openPreviewDialog(file)}
                    title="Preview"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button
                    class="p-2 hover:bg-accent rounded-md"
                    on:click={() => downloadFile(file)}
                    title="Download"
                  >
                    <Download class="w-4 h-4" />
                  </button>
                  <button
                    class="p-2 hover:bg-accent rounded-md"
                    on:click={() => openRenameDialog(file)}
                    title="Rename"
                  >
                    <Edit class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          {/each}
        </div>
      </div>

      <!-- Tips -->
      <CrudTips
        title="File Management Tips"
        tips={[
          "Organize files into folders to maintain a clean and structured file system",
          "Use descriptive file names to make content easier to find and manage",
          "Upload files in supported formats for optimal compatibility",
          "Use the search function to quickly locate specific files or content",
        ]}
      />
    {/if}
  {/if}
</div>

<!-- Hidden File Input -->
<input
  bind:this={fileInput}
  type="file"
  multiple
  class="hidden"
  on:change={handleFileSelect}
/>

<!-- Create Folder Dialog -->
<Dialog bind:open={createFolderOpen} title="Create New Folder">
  <div class="space-y-4">
    <div>
      <label for="folder-name" class="block text-sm font-medium mb-2"
        >Folder Name</label
      >
      <Input
        id="folder-name"
        bind:value={newFolderName}
        placeholder="Enter folder name..."
        autofocus
      />
    </div>
  </div>

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={() => (createFolderOpen = false)}>
      Cancel
    </Button>
    <Button on:click={handleCreateFolder} disabled={!newFolderName.trim()}>
      <FolderPlus class="w-4 h-4 mr-2" />
      Create Folder
    </Button>
  </div>
</Dialog>

<!-- Rename Dialog -->
<Dialog bind:open={renameDialogOpen} title="Rename File">
  {#if selectedFileForRename}
    <div class="space-y-4">
      <div>
        <label for="rename-input" class="block text-sm font-medium mb-2"
          >New Name</label
        >
        <Input id="rename-input" bind:value={renameFileName} autofocus />
      </div>
    </div>
  {/if}

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={() => (renameDialogOpen = false)}>
      Cancel
    </Button>
    <Button on:click={handleRename} disabled={!renameFileName.trim()}>
      <Edit class="w-4 h-4 mr-2" />
      Rename
    </Button>
  </div>
</Dialog>

<!-- Move Dialog -->
<Dialog bind:open={moveDialogOpen} title="Move Files">
  <div class="space-y-4">
    <p class="text-muted-foreground">
      Move {state.selectedFiles.length} selected file(s) to:
    </p>

    <div>
      <label for="target-folder" class="block text-sm font-medium mb-2"
        >Target Folder</label
      >
      <select
        id="target-folder"
        bind:value={moveTargetFolder}
        class="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md"
      >
        {#each state.folders as folder}
          <option value={folder}>{folder === "/" ? "Root" : folder}</option>
        {/each}
      </select>
    </div>
  </div>

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={() => (moveDialogOpen = false)}>
      Cancel
    </Button>
    <Button on:click={handleMove}>
      <Move class="w-4 h-4 mr-2" />
      Move Files
    </Button>
  </div>
</Dialog>

<!-- Delete Confirmation Dialog -->
<Dialog bind:open={deleteDialogOpen} title="Delete Files">
  <div class="space-y-4">
    <div class="flex items-start space-x-3">
      <AlertCircle class="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
      <div>
        <p class="font-medium text-foreground">
          Are you sure you want to delete {state.selectedFiles.length} file(s)?
        </p>
        <p class="text-sm text-muted-foreground mt-2">
          This action cannot be undone. The files will be permanently deleted.
        </p>
      </div>
    </div>
  </div>

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={() => (deleteDialogOpen = false)}>
      Cancel
    </Button>
    <Button variant="destructive" on:click={handleDelete}>
      <Trash2 class="w-4 h-4 mr-2" />
      Delete Files
    </Button>
  </div>
</Dialog>

<!-- Preview Dialog -->
<Dialog bind:open={previewDialogOpen} title="File Preview" size="lg">
  {#if selectedFileForPreview}
    <div class="space-y-4">
      <div class="flex items-center space-x-3 mb-4">
        <svelte:component
          this={getFileTypeIcon(selectedFileForPreview.type)}
          class="w-6 h-6 text-primary"
        />
        <div>
          <h3 class="font-semibold text-foreground">
            {selectedFileForPreview.name}
          </h3>
          <p class="text-sm text-muted-foreground">
            {formatFileSize(selectedFileForPreview.size)} • {formatDate(
              selectedFileForPreview.uploaded_at
            )}
          </p>
        </div>
      </div>

      <div
        class="border border-border rounded-lg p-4 min-h-[300px] flex items-center justify-center bg-muted"
      >
        {#if isImageFile(selectedFileForPreview) && selectedFileForPreview.url}
          <img
            src={selectedFileForPreview.url}
            alt={selectedFileForPreview.name}
            class="max-w-full max-h-[400px] object-contain"
          />
        {:else if isVideoFile(selectedFileForPreview) && selectedFileForPreview.url}
          <video
            src={selectedFileForPreview.url}
            controls
            class="max-w-full max-h-[400px]"
          >
            Your browser doesn't support video playback.
          </video>
        {:else}
          <div class="text-center">
            <svelte:component
              this={getFileTypeIcon(selectedFileForPreview.type)}
              class="w-16 h-16 text-muted-foreground mx-auto mb-4"
            />
            <p class="text-muted-foreground">
              Preview not available for this file type
            </p>
            <Button
              variant="outline"
              class="mt-4"
              on:click={() => downloadFile(selectedFileForPreview)}
            >
              <Download class="w-4 h-4 mr-2" />
              Download to view
            </Button>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <div slot="footer" class="flex justify-between">
    <Button
      variant="outline"
      on:click={() => downloadFile(selectedFileForPreview)}
    >
      <Download class="w-4 h-4 mr-2" />
      Download
    </Button>
    <Button variant="outline" on:click={() => (previewDialogOpen = false)}>
      Close
    </Button>
  </div>
</Dialog>
