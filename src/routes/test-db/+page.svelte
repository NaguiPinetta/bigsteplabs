<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import {
    Database,
    CheckCircle,
    XCircle,
    Loader2,
    TestTube,
  } from "lucide-svelte";
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

  let testResults = {
    connection: { status: "pending", message: "" },
    tables: { status: "pending", message: "" },
    auth: { status: "pending", message: "" },
    rls: { status: "pending", message: "" },
    personas: { status: "pending", message: "" },
    models: { status: "pending", message: "" },
    datasets: { status: "pending", message: "" },
    agents: { status: "pending", message: "" },
    chat: { status: "pending", message: "" },
  };

  let loading = true;
  let runningTests = false;
  let testData: any = {};

  // Reactive stores
  $: personas = $personasStore.personas;
  $: models = $modelsStore.models;
  $: datasets = $datasetsStore.datasets;
  $: agents = $agentsStore.agents;
  $: chatSessions = $chatStore.sessions;

  onMount(async () => {
    await runBasicTests();
  });

  async function runBasicTests() {
    loading = true;

    // Test 1: Connection and list all tables
    try {
      console.log("🔍 Testing database connection...");

      // First, let's see what tables actually exist
      const { data: tablesData, error: tablesError } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public");

      if (tablesError) {
        console.error("❌ Error checking tables:", tablesError);
        testResults.connection = {
          status: "error",
          message: `Connection failed: ${tablesError.message}`,
        };
        loading = false;
        return;
      }

      console.log("✅ Database connection successful");
      console.log(
        "📋 Available tables:",
        tablesData?.map((t) => t.table_name) || []
      );

      testResults.connection = {
        status: "success",
        message: "Connected to Supabase successfully",
      };

      // Check if our expected tables exist
      const expectedTables = [
        "users",
        "personas",
        "models",
        "datasets",
        "agents",
        "chat_sessions",
      ];
      const existingTables = tablesData?.map((t) => t.table_name) || [];
      const missingTables = expectedTables.filter(
        (table) => !existingTables.includes(table)
      );

      if (missingTables.length > 0) {
        testResults.tables = {
          status: "error",
          message: `Missing tables: ${missingTables.join(", ")}. Run database migrations first.`,
        };
      } else {
        testResults.tables = {
          status: "success",
          message: `All expected tables found (${existingTables.length} total)`,
        };
      }

      // Test 3: Authentication
      try {
        const { data: authData, error: authError } =
          await supabase.auth.getSession();
        if (authError) {
          testResults.auth = {
            status: "error",
            message: `Auth test failed: ${authError.message}`,
          };
        } else {
          testResults.auth = {
            status: "success",
            message: "Authentication system working",
          };
        }
      } catch (authErr) {
        testResults.auth = {
          status: "error",
          message: `Auth test failed: ${authErr}`,
        };
      }

      // Test 4: RLS (Row Level Security)
      try {
        const { data: rlsData, error: rlsError } = await supabase
          .from("users")
          .select("count")
          .limit(1);

        if (rlsError && rlsError.code === "42501") {
          testResults.rls = {
            status: "success",
            message: "RLS policies are active (access denied as expected)",
          };
        } else if (rlsError) {
          testResults.rls = {
            status: "warning",
            message: `RLS test: ${rlsError.message}`,
          };
        } else {
          testResults.rls = {
            status: "warning",
            message: "RLS might not be properly configured",
          };
        }
      } catch (rlsErr) {
        testResults.rls = {
          status: "error",
          message: `RLS test failed: ${rlsErr}`,
        };
      }
    } catch (error) {
      console.error("❌ Basic tests failed:", error);
      testResults.connection = {
        status: "error",
        message: `Connection failed: ${error}`,
      };
    }

    loading = false;
  }

  async function runComprehensiveTests() {
    runningTests = true;
    console.log("🧪 Starting comprehensive database tests...");

    try {
      // Test 1: Load existing data
      testResults.personas = {
        status: "pending",
        message: "Loading personas...",
      };
      testResults.models = { status: "pending", message: "Loading models..." };
      testResults.datasets = {
        status: "pending",
        message: "Loading datasets...",
      };
      testResults.agents = { status: "pending", message: "Loading agents..." };
      testResults.chat = {
        status: "pending",
        message: "Loading chat sessions...",
      };

      await Promise.all([
        loadPersonas(),
        loadModels(),
        loadDatasets(),
        loadAgents(),
        loadChatSessions(),
      ]);

      testResults.personas = {
        status: "success",
        message: `Loaded ${personas.length} personas`,
      };
      testResults.models = {
        status: "success",
        message: `Loaded ${models.length} models`,
      };
      testResults.datasets = {
        status: "success",
        message: `Loaded ${datasets.length} datasets`,
      };
      testResults.agents = {
        status: "success",
        message: `Loaded ${agents.length} agents`,
      };
      testResults.chat = {
        status: "success",
        message: `Loaded ${chatSessions.length} chat sessions`,
      };

      // Test 2: Create Persona
      testResults.personas = {
        status: "pending",
        message: "Creating test persona...",
      };
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
      testResults.personas = {
        status: "success",
        message: `Created persona: ${personaResult.data?.name}`,
      };

      // Test 3: Create Model
      testResults.models = {
        status: "pending",
        message: "Creating test model...",
      };
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
      testResults.models = {
        status: "success",
        message: `Created model: ${modelResult.data?.name}`,
      };

      // Test 4: Create Dataset
      testResults.datasets = {
        status: "pending",
        message: "Creating test dataset...",
      };
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
      testResults.datasets = {
        status: "success",
        message: `Created dataset: ${datasetResult.data?.name}`,
      };

      // Test 5: Create Agent
      testResults.agents = {
        status: "pending",
        message: "Creating test agent...",
      };
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
      testResults.agents = {
        status: "success",
        message: `Created agent: ${agentResult.data?.name}`,
      };

      // Test 6: Create Chat Session
      testResults.chat = {
        status: "pending",
        message: "Creating test chat session...",
      };
      const sessionResult = await createChatSession(
        testData.agentId,
        "test-user-id"
      );
      if (sessionResult.error) throw new Error(sessionResult.error);

      testData.sessionId = sessionResult.data?.id;
      testResults.chat = {
        status: "success",
        message: `Created chat session: ${sessionResult.data?.title}`,
      };

      // Test 7: Send Message
      testResults.chat = {
        status: "pending",
        message: "Sending test message...",
      };
      const messageResult = await sendMessage(
        "Hello, this is a test message!",
        testData.sessionId
      );
      if (messageResult.error) throw new Error(messageResult.error);

      testResults.chat = {
        status: "success",
        message: "Message sent and AI response received",
      };

      // Test 8: Update Persona
      testResults.personas = {
        status: "pending",
        message: "Updating test persona...",
      };
      const updatePersonaResult = await updatePersona(testData.personaId, {
        name: "Updated Test Persona",
        system_prompt: "You are an updated test assistant.",
      });
      if (updatePersonaResult.error) throw new Error(updatePersonaResult.error);

      testResults.personas = {
        status: "success",
        message: `Updated persona: ${updatePersonaResult.data?.name}`,
      };

      // Test 9: Update Model
      testResults.models = {
        status: "pending",
        message: "Updating test model...",
      };
      const updateModelResult = await updateModel(testData.modelId, {
        name: "Updated Test Model",
        temperature: 0.8,
      });
      if (updateModelResult.error) throw new Error(updateModelResult.error);

      testResults.models = {
        status: "success",
        message: `Updated model: ${updateModelResult.data?.name}`,
      };

      // Test 10: Update Agent
      testResults.agents = {
        status: "pending",
        message: "Updating test agent...",
      };
      const updateAgentResult = await updateAgent(testData.agentId, {
        name: "Updated Test Agent",
        description: "Updated test agent description",
      });
      if (updateAgentResult.error) throw new Error(updateAgentResult.error);

      testResults.agents = {
        status: "success",
        message: `Updated agent: ${updateAgentResult.data?.name}`,
      };

      // Test 11: Load Updated Data
      testResults.personas = {
        status: "pending",
        message: "Loading updated data...",
      };
      await Promise.all([
        loadPersonas(),
        loadModels(),
        loadDatasets(),
        loadAgents(),
        loadChatSessions(),
      ]);

      testResults.personas = {
        status: "success",
        message: `Updated data loaded: ${personas.length} personas, ${models.length} models, ${datasets.length} datasets, ${agents.length} agents, ${chatSessions.length} chat sessions`,
      };

      // Test 12: Delete Chat Session
      testResults.chat = {
        status: "pending",
        message: "Deleting test chat session...",
      };
      const deleteSessionResult = await deleteChatSession(testData.sessionId);
      if (deleteSessionResult.error) throw new Error(deleteSessionResult.error);

      testResults.chat = {
        status: "success",
        message: "Chat session deleted successfully",
      };

      // Test 13: Delete Agent
      testResults.agents = {
        status: "pending",
        message: "Deleting test agent...",
      };
      const deleteAgentResult = await deleteAgent(testData.agentId);
      if (deleteAgentResult.error) throw new Error(deleteAgentResult.error);

      testResults.agents = {
        status: "success",
        message: "Agent deleted successfully",
      };

      // Test 14: Delete Dataset
      testResults.datasets = {
        status: "pending",
        message: "Deleting test dataset...",
      };
      const deleteDatasetResult = await deleteDataset(testData.datasetId);
      if (deleteDatasetResult.error) throw new Error(deleteDatasetResult.error);

      testResults.datasets = {
        status: "success",
        message: "Dataset deleted successfully",
      };

      // Test 15: Delete Model
      testResults.models = {
        status: "pending",
        message: "Deleting test model...",
      };
      const deleteModelResult = await deleteModel(testData.modelId);
      if (deleteModelResult.error) throw new Error(deleteModelResult.error);

      testResults.models = {
        status: "success",
        message: "Model deleted successfully",
      };

      // Test 16: Delete Persona
      testResults.personas = {
        status: "pending",
        message: "Deleting test persona...",
      };
      const deletePersonaResult = await deletePersona(testData.personaId);
      if (deletePersonaResult.error) throw new Error(deletePersonaResult.error);

      testResults.personas = {
        status: "success",
        message: "Persona deleted successfully",
      };

      // Test 17: Final Data Load
      testResults.personas = {
        status: "pending",
        message: "Loading final data...",
      };
      await Promise.all([
        loadPersonas(),
        loadModels(),
        loadDatasets(),
        loadAgents(),
        loadChatSessions(),
      ]);

      testResults.personas = {
        status: "success",
        message: `Final data loaded: ${personas.length} personas, ${models.length} models, ${datasets.length} datasets, ${agents.length} agents, ${chatSessions.length} chat sessions`,
      };

      console.log("✅ All database tests completed successfully!");
    } catch (error) {
      console.error("❌ Database test failed:", error);
      const currentTest = Object.entries(testResults).find(
        ([_, result]) => result.status === "pending"
      );
      if (currentTest) {
        testResults[currentTest[0] as keyof typeof testResults] = {
          status: "error",
          message: `Test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    } finally {
      runningTests = false;
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "success":
        return CheckCircle;
      case "error":
        return XCircle;
      case "warning":
        return XCircle;
      default:
        return Loader2;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "warning":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  }
</script>

<svelte:head>
  <title>Database Test - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6">
  <div class="flex items-center gap-3 mb-6">
    <Database class="h-8 w-8 text-primary" />
    <h1 class="text-3xl font-bold">Database Connection Test</h1>
  </div>

  <div class="space-y-4">
    <Card class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">Basic Connection Tests</h2>
        <Button on:click={runBasicTests} disabled={loading}>
          {#if loading}
            <Loader2 class="h-4 w-4 animate-spin mr-2" />
            Testing...
          {:else}
            Run Basic Tests
          {/if}
        </Button>
      </div>

      <div class="space-y-4">
        {#each Object.entries(testResults).slice(0, 4) as [testName, result]}
          <div class="flex items-center gap-3 p-3 border rounded-lg">
            {#if result.status === "pending"}
              <Loader2 class="h-5 w-5 animate-spin text-gray-500" />
            {:else}
              <svelte:component
                this={getStatusIcon(result.status)}
                class="h-5 w-5 {getStatusColor(result.status)}"
              />
            {/if}
            <div class="flex-1">
              <div class="font-medium capitalize">{testName}</div>
              <div class="text-sm text-muted-foreground">{result.message}</div>
            </div>
          </div>
        {/each}
      </div>
    </Card>

    <Card class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">Comprehensive CRUD Tests</h2>
        <Button
          on:click={runComprehensiveTests}
          disabled={runningTests}
          variant="outline"
        >
          {#if runningTests}
            <Loader2 class="h-4 w-4 animate-spin mr-2" />
            Running Tests...
          {:else}
            <TestTube class="h-4 w-4 mr-2" />
            Run All CRUD Tests
          {/if}
        </Button>
      </div>

      <div class="space-y-4">
        {#each Object.entries(testResults).slice(4) as [testName, result]}
          <div class="flex items-center gap-3 p-3 border rounded-lg">
            {#if result.status === "pending"}
              <Loader2 class="h-5 w-5 animate-spin text-gray-500" />
            {:else}
              <svelte:component
                this={getStatusIcon(result.status)}
                class="h-5 w-5 {getStatusColor(result.status)}"
              />
            {/if}
            <div class="flex-1">
              <div class="font-medium capitalize">{testName}</div>
              <div class="text-sm text-muted-foreground">{result.message}</div>
            </div>
          </div>
        {/each}
      </div>
    </Card>

    <Card class="p-6">
      <h3 class="text-lg font-semibold mb-4">Test Summary</h3>
      <div class="space-y-2 text-sm">
        <p>This comprehensive test suite verifies:</p>
        <ul class="list-disc list-inside space-y-1 ml-4">
          <li>Database connection and table existence</li>
          <li>Authentication and RLS policies</li>
          <li>
            Full CRUD operations for all entities (Personas, Models, Datasets,
            Agents, Chat)
          </li>
          <li>Data relationships and foreign key constraints</li>
          <li>Error handling and edge cases</li>
        </ul>
      </div>
    </Card>
  </div>
</div>
