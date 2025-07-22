<script lang="ts">
  import { onMount } from "svelte";
  import Button from "$lib/components/ui/button.svelte";
  import {
    loadPersonas,
    createPersona,
    updatePersona,
    deletePersona,
    personasStore,
  } from "$lib/stores/personas";
  import {
    loadModels,
    createModel,
    updateModel,
    deleteModel,
    modelsStore,
  } from "$lib/stores/models";
  import {
    loadDatasets,
    createDataset,
    deleteDataset,
    datasetsStore,
  } from "$lib/stores/datasets";
  import {
    loadAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    agentsStore,
  } from "$lib/stores/agents";
  import {
    loadChatSessions,
    createChatSession,
    sendMessage,
    deleteChatSession,
    chatStore,
  } from "$lib/stores/chat";

  let testResults: Array<{
    test: string;
    status: "pending" | "success" | "error";
    message: string;
    data?: any;
  }> = [];
  let isRunning = false;
  let testData: any = {};

  // Reactive stores
  $: personas = $personasStore.personas;
  $: models = $modelsStore.models;
  $: datasets = $datasetsStore.datasets;
  $: agents = $agentsStore.agents;
  $: chatSessions = $chatStore.sessions;

  function addTestResult(
    test: string,
    status: "pending" | "success" | "error",
    message: string,
    data?: any
  ) {
    testResults = [...testResults, { test, status, message, data }];
  }

  async function runAllTests() {
    isRunning = true;
    testResults = [];

    console.log("🧪 Starting comprehensive database tests...");

    try {
      // Test 1: Load existing data
      addTestResult("Load Existing Data", "pending", "Loading current data...");

      await Promise.all([
        loadPersonas(),
        loadModels(),
        loadDatasets(),
        loadAgents(),
        loadChatSessions(),
      ]);

      addTestResult(
        "Load Existing Data",
        "success",
        `Loaded: ${personas.length} personas, ${models.length} models, ${datasets.length} datasets, ${agents.length} agents, ${chatSessions.length} chat sessions`
      );

      // Test 2: Create Persona
      addTestResult("Create Persona", "pending", "Creating test persona...");
      const newPersona = {
        name: "Test Persona",
        system_prompt: "You are a helpful test assistant.",
        description: "Test persona for database operations",
        is_default: false,
        created_by: null,
      };

      const personaResult = await createPersona(newPersona);
      if (personaResult.error) throw new Error(personaResult.error);

      testData.personaId = personaResult.data?.id;
      addTestResult(
        "Create Persona",
        "success",
        `Created persona: ${personaResult.data?.name}`,
        personaResult.data
      );

      // Test 3: Create Model
      addTestResult("Create Model", "pending", "Creating test model...");
      const newModel = {
        name: "Test Model",
        provider: "openai",
        engine: "gpt-3.5-turbo",
        api_key_id: null,
        max_tokens: 1000,
        temperature: 0.7,
        is_active: true,
      };

      const modelResult = await createModel(newModel);
      if (modelResult.error) throw new Error(modelResult.error);

      testData.modelId = modelResult.data?.id;
      addTestResult(
        "Create Model",
        "success",
        `Created model: ${modelResult.data?.name}`,
        modelResult.data
      );

      // Test 4: Create Dataset
      addTestResult("Create Dataset", "pending", "Creating test dataset...");
      const newDataset = {
        name: "Test Dataset",
        description: "Test dataset for database operations",
        content_type: "text" as const,
        user_id: "test-user-id",
        text_content: "This is test content for the dataset.",
        text_format: "plain" as const,
      };

      const datasetResult = await createDataset(newDataset);
      if (datasetResult.error) throw new Error(datasetResult.error);

      testData.datasetId = datasetResult.data?.id;
      addTestResult(
        "Create Dataset",
        "success",
        `Created dataset: ${datasetResult.data?.name}`,
        datasetResult.data
      );

      // Test 5: Create Agent
      addTestResult("Create Agent", "pending", "Creating test agent...");
      const newAgent = {
        name: "Test Agent",
        description: "Test agent for database operations",
        persona_id: testData.personaId,
        model_id: testData.modelId,
        dataset_ids: [testData.datasetId],
        is_active: true,
        metadata: { test: true },
      };

      const agentResult = await createAgent(newAgent);
      if (agentResult.error) throw new Error(agentResult.error);

      testData.agentId = agentResult.data?.id;
      addTestResult(
        "Create Agent",
        "success",
        `Created agent: ${agentResult.data?.name}`,
        agentResult.data
      );

      // Test 6: Create Chat Session
      addTestResult(
        "Create Chat Session",
        "pending",
        "Creating test chat session..."
      );
      const sessionResult = await createChatSession(
        testData.agentId,
        "test-user-id"
      );
      if (sessionResult.error) throw new Error(sessionResult.error);

      testData.sessionId = sessionResult.data?.id;
      addTestResult(
        "Create Chat Session",
        "success",
        `Created chat session: ${sessionResult.data?.title}`,
        sessionResult.data
      );

      // Test 7: Send Message
      addTestResult("Send Message", "pending", "Sending test message...");
      const messageResult = await sendMessage(
        "Hello, this is a test message!",
        testData.sessionId
      );
      if (messageResult.error) throw new Error(messageResult.error);

      addTestResult(
        "Send Message",
        "success",
        "Message sent and AI response received",
        messageResult.data
      );

      // Test 8: Update Persona
      addTestResult("Update Persona", "pending", "Updating test persona...");
      const updatePersonaResult = await updatePersona(testData.personaId, {
        name: "Updated Test Persona",
        system_prompt: "You are an updated test assistant.",
      });
      if (updatePersonaResult.error) throw new Error(updatePersonaResult.error);

      addTestResult(
        "Update Persona",
        "success",
        `Updated persona: ${updatePersonaResult.data?.name}`,
        updatePersonaResult.data
      );

      // Test 9: Update Model
      addTestResult("Update Model", "pending", "Updating test model...");
      const updateModelResult = await updateModel(testData.modelId, {
        name: "Updated Test Model",
        temperature: 0.8,
      });
      if (updateModelResult.error) throw new Error(updateModelResult.error);

      addTestResult(
        "Update Model",
        "success",
        `Updated model: ${updateModelResult.data?.name}`,
        updateModelResult.data
      );

      // Test 10: Update Agent
      addTestResult("Update Agent", "pending", "Updating test agent...");
      const updateAgentResult = await updateAgent(testData.agentId, {
        name: "Updated Test Agent",
        description: "Updated test agent description",
      });
      if (updateAgentResult.error) throw new Error(updateAgentResult.error);

      addTestResult(
        "Update Agent",
        "success",
        `Updated agent: ${updateAgentResult.data?.name}`,
        updateAgentResult.data
      );

      // Test 11: Load Updated Data
      addTestResult("Load Updated Data", "pending", "Loading updated data...");
      await Promise.all([
        loadPersonas(),
        loadModels(),
        loadDatasets(),
        loadAgents(),
        loadChatSessions(),
      ]);

      addTestResult(
        "Load Updated Data",
        "success",
        `Updated data loaded: ${personas.length} personas, ${models.length} models, ${datasets.length} datasets, ${agents.length} agents, ${chatSessions.length} chat sessions`
      );

      // Test 12: Delete Chat Session
      addTestResult(
        "Delete Chat Session",
        "pending",
        "Deleting test chat session..."
      );
      const deleteSessionResult = await deleteChatSession(testData.sessionId);
      if (deleteSessionResult.error) throw new Error(deleteSessionResult.error);

      addTestResult(
        "Delete Chat Session",
        "success",
        "Chat session deleted successfully"
      );

      // Test 13: Delete Agent
      addTestResult("Delete Agent", "pending", "Deleting test agent...");
      const deleteAgentResult = await deleteAgent(testData.agentId);
      if (deleteAgentResult.error) throw new Error(deleteAgentResult.error);

      addTestResult("Delete Agent", "success", "Agent deleted successfully");

      // Test 14: Delete Dataset
      addTestResult("Delete Dataset", "pending", "Deleting test dataset...");
      const deleteDatasetResult = await deleteDataset(testData.datasetId);
      if (deleteDatasetResult.error) throw new Error(deleteDatasetResult.error);

      addTestResult(
        "Delete Dataset",
        "success",
        "Dataset deleted successfully"
      );

      // Test 15: Delete Model
      addTestResult("Delete Model", "pending", "Deleting test model...");
      const deleteModelResult = await deleteModel(testData.modelId);
      if (deleteModelResult.error) throw new Error(deleteModelResult.error);

      addTestResult("Delete Model", "success", "Model deleted successfully");

      // Test 16: Delete Persona
      addTestResult("Delete Persona", "pending", "Deleting test persona...");
      const deletePersonaResult = await deletePersona(testData.personaId);
      if (deletePersonaResult.error) throw new Error(deletePersonaResult.error);

      addTestResult(
        "Delete Persona",
        "success",
        "Persona deleted successfully"
      );

      // Test 17: Final Data Load
      addTestResult("Final Data Load", "pending", "Loading final data...");
      await Promise.all([
        loadPersonas(),
        loadModels(),
        loadDatasets(),
        loadAgents(),
        loadChatSessions(),
      ]);

      addTestResult(
        "Final Data Load",
        "success",
        `Final data loaded: ${personas.length} personas, ${models.length} models, ${datasets.length} datasets, ${agents.length} agents, ${chatSessions.length} chat sessions`
      );

      console.log("✅ All database tests completed successfully!");
    } catch (error) {
      console.error("❌ Database test failed:", error);
      addTestResult(
        "Test Suite",
        "error",
        `Test failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      isRunning = false;
    }
  }

  function clearResults() {
    testResults = [];
    testData = {};
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 border-green-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "pending":
        return "⏳";
      default:
        return "❓";
    }
  }
</script>

<svelte:head>
  <title>Database Test - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6 space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold">Database Operations Test</h1>
      <p class="text-muted-foreground">
        Comprehensive test of all Supabase CRUD operations
      </p>
    </div>
    <div class="flex space-x-2">
      <Button variant="outline" on:click={clearResults} disabled={isRunning}>
        Clear Results
      </Button>
      <Button on:click={runAllTests} disabled={isRunning}>
        {isRunning ? "Running Tests..." : "Run All Tests"}
      </Button>
    </div>
  </div>

  <!-- Current Data Summary -->
  <div class="bg-card rounded-lg border p-6">
    <h2 class="text-xl font-semibold mb-4">Current Data Summary</h2>
    <p class="text-muted-foreground mb-4">Data currently loaded in stores</p>
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="text-center">
        <div class="text-2xl font-bold text-blue-600">{personas.length}</div>
        <div class="text-sm text-muted-foreground">Personas</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-green-600">{models.length}</div>
        <div class="text-sm text-muted-foreground">Models</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-purple-600">{datasets.length}</div>
        <div class="text-sm text-muted-foreground">Datasets</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-orange-600">{agents.length}</div>
        <div class="text-sm text-muted-foreground">Agents</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-red-600">{chatSessions.length}</div>
        <div class="text-sm text-muted-foreground">Chat Sessions</div>
      </div>
    </div>
  </div>

  <!-- Test Results -->
  <div class="bg-card rounded-lg border p-6">
    <h2 class="text-xl font-semibold mb-4">Test Results</h2>
    <p class="text-muted-foreground mb-4">
      {testResults.length > 0
        ? `${testResults.filter((r) => r.status === "success").length}/${testResults.length} tests passed`
        : "No tests run yet"}
    </p>
    {#if testResults.length === 0}
      <div class="text-center py-8 text-muted-foreground">
        <p>Click "Run All Tests" to start testing database operations</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each testResults as result}
          <div class="flex items-start space-x-3 p-3 rounded-lg border">
            <div class="text-lg">{getStatusIcon(result.status)}</div>
            <div class="flex-1">
              <div class="flex items-center space-x-2">
                <span class="font-medium">{result.test}</span>
                <span
                  class="px-2 py-1 text-xs rounded-full {getStatusColor(
                    result.status
                  )}"
                >
                  {result.status}
                </span>
              </div>
              <p class="text-sm text-muted-foreground mt-1">{result.message}</p>
              {#if result.data}
                <details class="mt-2">
                  <summary class="text-xs text-blue-600 cursor-pointer"
                    >View Data</summary
                  >
                  <pre
                    class="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">{JSON.stringify(
                      result.data,
                      null,
                      2
                    )}</pre>
                </details>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Test Summary -->
  {#if testResults.length > 0}
    <div class="bg-card rounded-lg border p-6">
      <h2 class="text-xl font-semibold mb-4">Test Summary</h2>
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <div class="text-2xl font-bold text-green-600">
            {testResults.filter((r) => r.status === "success").length}
          </div>
          <div class="text-sm text-muted-foreground">Passed</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-red-600">
            {testResults.filter((r) => r.status === "error").length}
          </div>
          <div class="text-sm text-muted-foreground">Failed</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-yellow-600">
            {testResults.filter((r) => r.status === "pending").length}
          </div>
          <div class="text-sm text-muted-foreground">Pending</div>
        </div>
      </div>
    </div>
  {/if}
</div>
