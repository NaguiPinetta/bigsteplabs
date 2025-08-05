<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Upload, File as FileIcon, X, AlertCircle } from "lucide-svelte";

  export let accept: string = "*/*";
  export let maxSize: number = 10 * 1024 * 1024; // 10MB default
  export let multiple: boolean = false;
  export let disabled: boolean = false;
  export let label: string = "Upload files";
  export let description: string = "";

  const dispatch = createEventDispatcher<{
    upload: { files: FileList };
    error: { message: string };
  }>();

  let dragOver = false;
  let fileInput: HTMLInputElement;
  let selectedFiles: File[] = [];
  let errors: string[] = [];

  function handleFiles(files: FileList) {
    errors = [];
    const validFiles: File[] = [];

    Array.from(files).forEach((file) => {
      // Check file size
      if (file.size > maxSize) {
        errors.push(
          `${file.name} is too large (max ${formatFileSize(maxSize)})`
        );
        return;
      }

      // Check file type if accept is specified
      if (accept !== "*/*") {
        const acceptedTypes = accept.split(",").map((type) => type.trim());
        const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
        const mimeType = file.type;

        const isAccepted = acceptedTypes.some((acceptedType) => {
          if (acceptedType.startsWith(".")) {
            return acceptedType.toLowerCase() === fileExtension;
          }
          if (acceptedType.includes("/*")) {
            return mimeType.startsWith(acceptedType.split("/")[0]);
          }
          return acceptedType === mimeType;
        });

        if (!isAccepted) {
          errors.push(`${file.name} is not an accepted file type`);
          return;
        }
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      dispatch("error", { message: errors.join(", ") });
    }

    if (validFiles.length > 0) {
      selectedFiles = multiple ? [...selectedFiles, ...validFiles] : validFiles;

      // Create a new FileList-like object
      const dataTransfer = new DataTransfer();
      selectedFiles.forEach((file) => dataTransfer.items.add(file));

      dispatch("upload", { files: dataTransfer.files });
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (!disabled) {
      dragOver = true;
    }
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;

    if (disabled || !e.dataTransfer?.files) return;

    handleFiles(e.dataTransfer.files);
  }

  function handleFileInput(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files) {
      handleFiles(target.files);
    }
  }

  function removeFile(index: number) {
    selectedFiles = selectedFiles.filter((_, i) => i !== index);

    if (selectedFiles.length === 0) {
      // Reset file input
      if (fileInput) fileInput.value = "";
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function openFileDialog() {
    if (!disabled) {
      fileInput?.click();
    }
  }
</script>

<div class="w-full">
  <input
    bind:this={fileInput}
    type="file"
    {accept}
    {multiple}
    {disabled}
    on:change={handleFileInput}
    class="hidden"
  />

  <!-- Upload Area -->
  <div
    class={`
			relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer
			${dragOver ? "border-primary bg-primary/5" : "border-border"}
			${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:bg-primary/5"}
		`}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:drop={handleDrop}
    on:click={openFileDialog}
    role="button"
    tabindex="0"
    on:keydown={(e) => e.key === "Enter" && openFileDialog()}
  >
    <div class="text-center">
      <Upload
        class={`w-12 h-12 mx-auto mb-4 ${dragOver ? "text-primary" : "text-muted-foreground"}`}
      />

      <div class="mb-2">
        <span class="text-lg font-medium text-foreground">{label}</span>
      </div>

      {#if description}
        <p class="text-sm text-muted-foreground mb-2">{description}</p>
      {/if}

      <p class="text-xs text-muted-foreground">
        {dragOver ? "Drop files here" : "Click to browse or drag and drop"}
      </p>

      {#if accept !== "*/*"}
        <p class="text-xs text-muted-foreground mt-1">
          Accepted: {accept}
        </p>
      {/if}

      <p class="text-xs text-muted-foreground">
        Max size: {formatFileSize(maxSize)}
      </p>
    </div>
  </div>

  <!-- Selected Files -->
  {#if selectedFiles.length > 0}
    <div class="mt-4 space-y-2">
      <h4 class="text-sm font-medium text-foreground">Selected Files:</h4>
      {#each selectedFiles as file, index}
        <div class="flex items-center justify-between p-2 bg-muted rounded-md">
          <div class="flex items-center space-x-2 flex-1 min-w-0">
            <FileIcon class="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-foreground truncate">
                {file.name}
              </p>
              <p class="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
          <button
            on:click|stopPropagation={() => removeFile(index)}
            class="p-1 hover:bg-destructive/20 rounded-sm text-muted-foreground hover:text-destructive"
            aria-label="Remove file"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Errors -->
  {#if errors.length > 0}
    <div
      class="mt-4 p-3 bg-destructive/15 border border-destructive/20 rounded-md"
    >
      <div class="flex">
        <AlertCircle class="w-5 h-5 text-destructive flex-shrink-0" />
        <div class="ml-3">
          <h4 class="text-sm font-medium text-destructive">Upload Errors:</h4>
          <ul class="mt-1 text-sm text-destructive/80">
            {#each errors as error}
              <li>• {error}</li>
            {/each}
          </ul>
        </div>
      </div>
    </div>
  {/if}
</div>
