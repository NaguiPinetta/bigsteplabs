<script lang="ts">
  import { onMount } from "svelte";
  import { authStore, canManageContent } from "$lib/stores/auth";
  import { supabase } from "$lib/supabase";
  import {
    datasetsStore,
    loadDatasets,
    createDataset,
    updateDataset,
    deleteDataset,
    loadDatasetChunks,
    createChunks,
    createStructuredChunks,
    processFileToStructuredChunks,
    setSelectedDataset,
    clearDatasetsError,
  } from "$lib/stores/datasets";

  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Textarea from "$lib/components/ui/textarea.svelte";
  import FileUpload from "$lib/components/ui/file-upload.svelte";
  import CrudTips from "$lib/components/ui/crud-tips.svelte";
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
    RefreshCw,
    Bug,
  } from "lucide-svelte";

  let createDialogOpen = false;
  let editDialogOpen = false;
  let chunkDialogOpen = false;
  let viewDialogOpen = false;
  let deleteDialogOpen = false;
  let datasetToDelete: any = null;
  let isCreatingDataset = false;

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
    chunkSize: "1000",
    overlap: "200",
  };

  $: user = $authStore.user;
  $: canManage = $canManageContent;
  $: state = $datasetsStore;
  $: datasets = state.datasets;
  $: selectedDataset = state.selectedDataset;
  $: selectedChunks = selectedDataset
    ? state.chunks[selectedDataset.id] || []
    : [];

  // Reactive statement to load chunks when datasets change
  $: if (datasets.length > 0 && canManage) {
    // Load chunks for datasets that don't have chunks loaded yet
    datasets.forEach(async (dataset) => {
      if (!state.chunks[dataset.id]) {
        console.log("🔍 Loading chunks for dataset:", dataset.name);
        await loadDatasetChunks(dataset.id);
      }
    });
  }

  onMount(() => {
    if (canManage) {
      loadDatasets().then(() => {
        // After datasets are loaded, load chunks for each dataset
        if (datasets.length > 0) {
          console.log("🔍 Loading chunks for existing datasets...");
          datasets.forEach(async (dataset) => {
            await loadDatasetChunks(dataset.id);
          });
        }
      });
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

    console.log("🚀 Starting dataset creation process...");
    isCreatingDataset = true;

    try {
      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let fileSize: number | undefined;
      let fileType: string | undefined;

      // Handle file upload if content type is file
      if (newDataset.contentType === "file" && newDataset.file) {
        console.log("📁 Starting file upload:", newDataset.file.name);

        // Upload file to Supabase storage
        const fileExt = newDataset.file.name.split(".").pop();
        const fileNameWithTimestamp = `${Date.now()}-${newDataset.file.name}`;
        const filePath = `datasets/${user.id}/${fileNameWithTimestamp}`;

        console.log("📁 Upload path:", filePath);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("datasets")
          .upload(filePath, newDataset.file);

        if (uploadError) {
          console.error("❌ File upload error:", uploadError);
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }

        console.log("✅ File upload successful, getting public URL...");

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from("datasets")
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        fileName = newDataset.file.name;
        fileSize = newDataset.file.size;
        fileType = newDataset.file.type;

        console.log("✅ File uploaded successfully:", fileUrl);
      }

      console.log("📝 Preparing dataset data...");
      const datasetData = {
        name: newDataset.name.trim(),
        description: newDataset.description.trim() || undefined,
        user_id: user.id,
        content_type: newDataset.contentType as "file" | "text",
        text_content:
          newDataset.contentType === "text"
            ? newDataset.textContent
            : undefined,
        text_format:
          newDataset.contentType === "text"
            ? (newDataset.textFormat as "json" | "markdown" | "plain")
            : undefined,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
      };

      console.log("📝 Dataset data prepared:", datasetData);
      console.log("💾 Creating dataset in database...");

      const result = await createDataset(datasetData);

      console.log("💾 Dataset creation result:", result);

      if (result) {
        console.log("✅ Dataset created successfully, processing chunks...");
        // Process content for chunks
        if (result.id) {
          if (newDataset.contentType === "file" && newDataset.file) {
            console.log("🔧 Processing file for chunks...");
            const chunkResult = await processFileToStructuredChunks(
              result.id,
              newDataset.file
            );
            console.log("🔧 File chunking result:", chunkResult);
            if (chunkResult.error) {
              console.warn(
                "⚠️ Warning: File processed but chunking failed:",
                chunkResult.error
              );
            }
          } else if (
            newDataset.contentType === "text" &&
            newDataset.textContent
          ) {
            console.log("🔧 Processing text content for chunks...");
            const chunkResult = await createStructuredChunks(
              result.id,
              newDataset.textContent,
              "manual_input"
            );
            console.log("🔧 Text chunking result:", chunkResult);
            if (chunkResult.error) {
              console.warn(
                "⚠️ Warning: Text processed but chunking failed:",
                chunkResult.error
              );
            }
          }
        }

        console.log("🔄 Resetting form and closing dialog...");
        newDataset = {
          name: "",
          description: "",
          contentType: "file",
          textFormat: "plain",
          textContent: "",
          file: null as File | null,
        };
        createDialogOpen = false;
        console.log("✅ Dataset creation process completed successfully!");
      } else {
        console.error("❌ Dataset creation returned null result");
        throw new Error("Failed to create dataset - no result returned");
      }
    } catch (error) {
      console.error("❌ Error in handleCreateDataset:", error);
      // Show error to user
      alert("Failed to create dataset. Please check the console for details.");
    } finally {
      console.log("🏁 Finally block - resetting loading state");
      isCreatingDataset = false;
    }
  }

  async function handleUpdateDataset() {
    if (!editDataset.name.trim()) return;

    const result = await updateDataset(editDataset.id, {
      name: editDataset.name.trim(),
      description: editDataset.description.trim() || undefined,
    });

    if (result) {
      editDialogOpen = false;
    }
  }

  async function handleDeleteDataset(dataset: any) {
    datasetToDelete = dataset;
    deleteDialogOpen = true;
  }

  async function confirmDeleteDataset() {
    if (datasetToDelete) {
      await deleteDataset(datasetToDelete.id);
      deleteDialogOpen = false;
      datasetToDelete = null;
    }
  }

  function cancelDeleteDataset() {
    deleteDialogOpen = false;
    datasetToDelete = null;
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
    console.log("🔍 Opening view dialog for dataset:", dataset.name);
    setSelectedDataset(dataset);

    // Ensure chunks are loaded
    console.log("🔍 Loading chunks for dataset:", dataset.id);
    const chunks = await loadDatasetChunks(dataset.id);
    console.log(
      "🔍 Loaded",
      chunks.length,
      "chunks for dataset:",
      dataset.name
    );

    viewDialogOpen = true;
  }

  async function openChunkDialog(dataset: any) {
    setSelectedDataset(dataset);
    chunkInput = { content: "", chunkSize: "1000", overlap: "200" };
    chunkDialogOpen = true;
  }

  async function handleCreateChunks() {
    if (!selectedDataset || !chunkInput.content.trim()) return;

    const result = await createStructuredChunks(
      selectedDataset.id,
      chunkInput.content,
      "manual_input"
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

    await processFileToStructuredChunks(datasetId, file);
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

  async function refreshAllChunks() {
    console.log("🔄 Refreshing all chunks...");
    if (canManage) {
      datasets.forEach(async (dataset) => {
        if (dataset.id) {
          console.log("🔍 Loading chunks for dataset:", dataset.name);
          await loadDatasetChunks(dataset.id);
        }
      });
      console.log("✅ All chunks refreshed.");
    } else {
      console.warn("⚠️ Cannot refresh chunks: not authorized.");
    }
  }

  async function debugDatasetState() {
    console.log("🔍 Debugging dataset state...");
    if (canManage && datasets.length > 0) {
      for (const dataset of datasets) {
        console.log(`🔍 Dataset: ${dataset.name} (${dataset.id})`);
        console.log(`  - DB total_chunks: ${dataset.total_chunks}`);
        console.log(
          `  - Loaded chunks: ${(state.chunks[dataset.id] || []).length}`
        );

        // Check actual database state
        const { data: actualChunks } = await supabase
          .from("dataset_chunks")
          .select("count")
          .eq("dataset_id", dataset.id);

        console.log(`  - Actual DB chunks: ${actualChunks?.[0]?.count || 0}`);

        // Check dataset record
        const { data: datasetRecord } = await supabase
          .from("datasets")
          .select("total_chunks")
          .eq("id", dataset.id)
          .single();

        console.log(
          `  - Dataset record total_chunks: ${datasetRecord?.total_chunks || 0}`
        );
      }
    }
  }

  async function debugAgentLanguage() {
    console.log("🔍 Debugging agent language configuration...");
    try {
      const { data: agents, error } = await supabase
        .from("agents")
        .select("id, name, whisper_language, dataset_ids")
        .eq("name", "Agent Deutsch");

      if (error) {
        console.error("❌ Error fetching agents:", error);
        return;
      }

      console.log("🔍 Found agents:", agents);

      if (agents && agents.length > 0) {
        const agent = agents[0];
        console.log(`🔍 Agent Deutsch configuration:`);
        console.log(`  - ID: ${agent.id}`);
        console.log(`  - Name: ${agent.name}`);
        console.log(
          `  - Whisper Language: "${agent.whisper_language}" (type: ${typeof agent.whisper_language})`
        );

        // Map the language code to human readable
        const languageMap: Record<string, string> = {
          en: "English",
          de: "German",
          es: "Spanish",
          fr: "French",
          it: "Italian",
          pt: "Portuguese",
          ru: "Russian",
          ja: "Japanese",
          ko: "Korean",
          zh: "Chinese",
          ar: "Arabic",
          auto: "Auto-detect",
        };

        const languageLabel = languageMap[agent.whisper_language] || "Unknown";
        console.log(`  - Language Label: ${languageLabel}`);
        console.log(`  - Dataset IDs: ${agent.dataset_ids}`);

        // Check if it has the TEST DEUTSCH 2 dataset
        if (
          agent.dataset_ids &&
          agent.dataset_ids.includes("c0ab366c-408e-4ff2-a63c-174843bdeea3")
        ) {
          console.log("✅ Agent has TEST DEUTSCH 2 dataset assigned");
        } else {
          console.log("❌ Agent does NOT have TEST DEUTSCH 2 dataset assigned");
        }

        // Check if language needs to be updated
        if (agent.whisper_language !== "de") {
          console.log(
            "⚠️ Agent language is not set to German (de). Current:",
            agent.whisper_language
          );
          console.log(
            "💡 You may want to update the agent's language configuration in the Agents page."
          );
        } else {
          console.log("✅ Agent language is correctly set to German (de)");
        }
      } else {
        console.log("❌ No Agent Deutsch found");
      }
    } catch (error) {
      console.error("❌ Error in debugAgentLanguage:", error);
    }
  }

  async function debugDatasetParsing() {
    console.log("🔍 Debugging dataset parsing...");
    if (canManage && datasets.length > 0) {
      for (const dataset of datasets) {
        console.log(`🔍 Testing parsing for dataset: ${dataset.name}`);

        // Get the dataset content
        const { data: datasetRecord } = await supabase
          .from("datasets")
          .select("text_content, file_url")
          .eq("id", dataset.id)
          .single();

        if (datasetRecord) {
          console.log(
            `🔍 Dataset content type: ${datasetRecord.text_content ? "text" : "file"}`
          );

          if (datasetRecord.text_content) {
            console.log(
              `🔍 Text content preview:`,
              datasetRecord.text_content.substring(0, 200) + "..."
            );

            // Get the chunks from the database to see what was actually parsed
            const { data: chunks } = await supabase
              .from("dataset_chunks")
              .select("content, metadata, index")
              .eq("dataset_id", dataset.id)
              .order("index", { ascending: true });

            console.log(`🔍 Database chunks:`, chunks?.length || 0);
            chunks?.forEach((chunk, index) => {
              console.log(`  Chunk ${index}:`, {
                type: chunk.metadata?.chunk_type,
                exerciseNumber: chunk.metadata?.exercise_number,
                prompt: chunk.metadata?.prompt?.substring(0, 50) + "...",
                expectedResponse:
                  chunk.metadata?.expected_response?.substring(0, 30) + "...",
                variations: chunk.metadata?.variations?.length || 0,
                contentLength: chunk.content.length,
              });
            });
          }
        }
      }
    }
  }

  async function debugAgentDataset() {
    console.log("🔍 Debugging Agent Deutsch dataset...");
    try {
      // Get Agent Deutsch
      const { data: agents, error } = await supabase
        .from("agents")
        .select("id, name, dataset_ids")
        .eq("name", "Agent Deutsch");

      if (error || !agents || agents.length === 0) {
        console.error("❌ Agent Deutsch not found");
        return;
      }

      const agent = agents[0];
      console.log("🔍 Agent Deutsch:", agent);

      if (!agent.dataset_ids || agent.dataset_ids.length === 0) {
        console.log("❌ Agent has no datasets assigned");
        return;
      }

      // Get the dataset content
      for (const datasetId of agent.dataset_ids) {
        console.log(`🔍 Checking dataset: ${datasetId}`);

        const { data: dataset } = await supabase
          .from("datasets")
          .select("id, name, text_content")
          .eq("id", datasetId)
          .single();

        if (dataset) {
          console.log(`🔍 Dataset: ${dataset.name}`);
          console.log(
            `🔍 Content preview:`,
            dataset.text_content?.substring(0, 300) + "..."
          );

          // Get the chunks
          const { data: chunks } = await supabase
            .from("dataset_chunks")
            .select("content, metadata, index")
            .eq("dataset_id", datasetId)
            .order("index", { ascending: true });

          console.log(`🔍 Chunks found:`, chunks?.length || 0);

          // Show first few exercises
          const exerciseChunks =
            chunks?.filter(
              (chunk) => chunk.metadata?.chunk_type === "exercise"
            ) || [];
          console.log(`🔍 Exercise chunks:`, exerciseChunks.length);

          exerciseChunks.slice(0, 3).forEach((chunk, index) => {
            console.log(`  Exercise ${index + 1}:`, {
              exerciseNumber: chunk.metadata?.exercise_number,
              prompt: chunk.metadata?.prompt,
              expectedResponse: chunk.metadata?.expected_response,
              variations: chunk.metadata?.variations?.length || 0,
            });
          });
        }
      }
    } catch (error) {
      console.error("❌ Error debugging agent dataset:", error);
    }
  }

  async function reprocessDataset(datasetId: string) {
    console.log("🔄 Reprocessing dataset:", datasetId);
    try {
      // Get the dataset content
      const { data: dataset } = await supabase
        .from("datasets")
        .select("id, name, text_content")
        .eq("id", datasetId)
        .single();

      if (!dataset || !dataset.text_content) {
        console.error("❌ Dataset not found or has no content");
        return;
      }

      console.log("🔍 Reprocessing dataset:", dataset.name);
      console.log("🔍 Content length:", dataset.text_content.length);

      // Delete existing chunks
      const { error: deleteError } = await supabase
        .from("dataset_chunks")
        .delete()
        .eq("dataset_id", datasetId);

      if (deleteError) {
        console.error("❌ Error deleting existing chunks:", deleteError);
        return;
      }

      console.log("✅ Deleted existing chunks");

      // Create new chunks with updated parsing logic
      const chunkResult = await createStructuredChunks(
        datasetId,
        dataset.text_content,
        "reprocessed"
      );

      if (chunkResult.error) {
        console.error("❌ Error creating new chunks:", chunkResult.error);
        return;
      }

      console.log(
        "✅ Successfully reprocessed dataset with",
        chunkResult.data?.length || 0,
        "chunks"
      );

      // Refresh the chunks in the store
      await loadDatasetChunks(datasetId);
    } catch (error) {
      console.error("❌ Error reprocessing dataset:", error);
    }
  }

  async function testDatasetParsing(datasetId: string) {
    console.log("🔍 Testing dataset parsing for:", datasetId);
    try {
      // Get the dataset content
      const { data: dataset } = await supabase
        .from("datasets")
        .select("id, name, text_content")
        .eq("id", datasetId)
        .single();

      if (!dataset || !dataset.text_content) {
        console.error("❌ Dataset not found or has no content");
        return;
      }

      console.log("🔍 Dataset:", dataset.name);
      console.log(
        "🔍 Content preview:",
        dataset.text_content.substring(0, 500) + "..."
      );

      // Test the parsing logic directly
      const { parseStructuredContent } = await import("$lib/stores/datasets");
      const chunks = parseStructuredContent(dataset.text_content);

      console.log("🔍 Parsed chunks:", chunks.length);
      chunks.forEach((chunk: any, index: number) => {
        console.log(`Chunk ${index}:`, {
          type: chunk.type,
          exerciseNumber: chunk.exerciseNumber,
          prompt: chunk.prompt?.substring(0, 50) + "...",
          expectedResponse: chunk.expectedResponse?.substring(0, 30) + "...",
          metadata: chunk.metadata,
        });
      });

      // Check if we have exercise chunks
      const exerciseChunks = chunks.filter(
        (chunk: any) => chunk.type === "exercise"
      );
      console.log("🔍 Exercise chunks found:", exerciseChunks.length);

      if (exerciseChunks.length === 0) {
        console.warn(
          "⚠️ No exercise chunks found! This is why the agent is not working correctly."
        );
      } else {
        console.log("✅ Exercise chunks found! First few exercises:");
        exerciseChunks.slice(0, 3).forEach((chunk: any, index: number) => {
          console.log(`  Exercise ${index + 1}:`, {
            number: chunk.exerciseNumber,
            prompt: chunk.prompt,
            expected: chunk.expectedResponse,
          });
        });
      }
    } catch (error) {
      console.error("❌ Error testing dataset parsing:", error);
    }
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

  <div class="flex space-x-2">
    {#if canManage}
      <Button variant="outline" on:click={debugAgentDataset}>
        <Bug class="w-4 h-4 mr-2" />
        Debug Agent Dataset
      </Button>
      <Button variant="outline" on:click={debugDatasetParsing}>
        <Bug class="w-4 h-4 mr-2" />
        Debug Parsing
      </Button>
      <Button variant="outline" on:click={debugAgentLanguage}>
        <Bug class="w-4 h-4 mr-2" />
        Debug Agent
      </Button>
      <Button variant="outline" on:click={debugDatasetState}>
        <Bug class="w-4 h-4 mr-2" />
        Debug State
      </Button>
      <Button variant="outline" on:click={refreshAllChunks}>
        <RefreshCw class="w-4 h-4 mr-2" />
        Refresh Chunks
      </Button>
      <Button on:click={() => (createDialogOpen = true)}>
        <Plus class="w-4 h-4 mr-2" />
        Create Dataset
      </Button>
    {/if}
  </div>
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

              <button
                on:click={() => reprocessDataset(dataset.id)}
                class="p-2 hover:bg-info/20 rounded-md text-muted-foreground hover:text-info"
                title="Reprocess dataset"
              >
                <RefreshCw class="w-4 h-4" />
              </button>

              <button
                on:click={() => testDatasetParsing(dataset.id)}
                class="p-2 hover:bg-warning/20 rounded-md text-muted-foreground hover:text-warning"
                title="Test parsing"
              >
                <Bug class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between text-sm">
            <span class="flex items-center text-muted-foreground">
              <FileText class="w-4 h-4 mr-1" />
              {dataset.total_chunks || 0} chunks (DB) • {(
                state.chunks[dataset.id] || []
              ).length} loaded
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

    <!-- Tips -->
    <CrudTips
      title="Dataset Management Tips"
      tips={[
        "Create diverse datasets to provide comprehensive knowledge to your AI agents",
        "Use clear naming conventions to organize your datasets effectively",
        "Upload files or input text directly depending on your content format",
        "Monitor dataset processing status to ensure successful chunking and indexing",
        "Supported structured formats: Portuguese translation exercises with '### 1. Frase: [text] > Resposta esperada: [text]' format",
        "Language direction indicators like '[pt-BR>de]' help specify source and target languages",
        "For translation exercises, use numbered format with clear prompts and expected responses",
      ]}
    />
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

      <!-- Format Guide -->
      <div class="bg-muted/50 p-4 rounded-lg">
        <h4 class="text-sm font-medium mb-2">📋 Supported Structured Formats</h4>
        <div class="text-xs text-muted-foreground space-y-2">
          <div>
            <strong>Translation Exercises:</strong>
            <pre class="mt-1 bg-background p-2 rounded text-xs overflow-x-auto">
[pt-BR>de]
### 1. Frase: Eu compro pão > Resposta esperada: Ich kaufe Brot
### 2. Frase: Eu compro leite > Resposta esperada: Ich kaufe Milch</pre>
          </div>
          <div>
            <strong>Language Direction:</strong> Use <code>[pt-BR>de]</code> for Portuguese to German, <code>[pt-BR>en]</code> for Portuguese to English, etc.
          </div>
          <div>
            <strong>Exercise Format:</strong> Each exercise must follow <code>### [number]. Frase: [prompt] > Resposta esperada: [answer]</code>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={() => (createDialogOpen = false)}>
      Cancel
    </Button>
    <Button
      on:click={handleCreateDataset}
      disabled={isCreatingDataset ||
        !newDataset.name.trim() ||
        (newDataset.contentType === "text" &&
          !newDataset.textContent?.trim()) ||
        (newDataset.contentType === "file" && !newDataset.file)}
    >
      {#if isCreatingDataset}
        <Loader2 class="w-4 h-4 mr-2 animate-spin" />
        Creating...
      {:else}
        Create Dataset
      {/if}
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
          />
          <p class="text-xs text-muted-foreground mt-1">Characters per chunk</p>
        </div>

        <div>
          <label for="overlap" class="block text-sm font-medium mb-2"
            >Overlap</label
          >
          <Input id="overlap" type="number" bind:value={chunkInput.overlap} />
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

<!-- Delete Dataset Confirmation Dialog -->
<Dialog bind:open={deleteDialogOpen} title="Delete Dataset">
  {#if datasetToDelete}
    <div class="space-y-4">
      <p class="text-muted-foreground">
        Are you sure you want to delete <strong>"{datasetToDelete.name}"</strong
        > and all its chunks?
      </p>
      <p class="text-sm text-destructive">
        This action cannot be undone. All content chunks will be permanently
        deleted.
      </p>
    </div>
  {/if}

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={cancelDeleteDataset}>Cancel</Button>
    <Button variant="destructive" on:click={confirmDeleteDataset}>
      Delete Dataset
    </Button>
  </div>
</Dialog>
