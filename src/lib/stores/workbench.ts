import { writable, get } from "svelte/store";
import { supabase } from "$lib/supabase";
import { agentsStore, loadAgents } from "./agents";
import { authStore } from "./auth";

interface TestResult {
  id: string;
  agentId: string;
  agentName: string;
  prompt: string;
  response: string;
  responseTime: number;
  timestamp: string;
  success: boolean;
  error?: string;
  metadata?: {
    tokenCount?: number;
    modelUsed?: string;
    temperature?: number;
    maxTokens?: number;
  };
}

interface AgentComparison {
  prompt: string;
  results: TestResult[];
  timestamp: string;
}

interface WorkbenchState {
  activeAgents: any[];
  testResults: TestResult[];
  comparisons: AgentComparison[];
  loading: boolean;
  testing: boolean;
  error: string | null;
  selectedAgents: string[];
}

// Load existing data from localStorage or use mock data as fallback
function getInitialTestResults(): TestResult[] {
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem("bigstep_workbench_results");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
  }
  return [];
}

function getInitialComparisons(): AgentComparison[] {
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem("bigstep_workbench_comparisons");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
  }
  return [];
}

const initialState: WorkbenchState = {
  activeAgents: [],
  testResults: getInitialTestResults(),
  comparisons: getInitialComparisons(),
  loading: false,
  testing: false,
  error: null,
  selectedAgents: [],
};

export const workbenchStore = writable<WorkbenchState>(initialState);

// Save data to localStorage
function saveTestResults(results: TestResult[]) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("bigstep_workbench_results", JSON.stringify(results));
  }
}

function saveComparisons(comparisons: AgentComparison[]) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(
      "bigstep_workbench_comparisons",
      JSON.stringify(comparisons)
    );
  }
}

/**
 * Load active agents for testing from database
 */
export async function loadActiveAgents() {
  workbenchStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    console.log("🔄 Workbench: Starting to load active agents...");

    // Check auth state first
    const authState = get(authStore);
    console.log("🔄 Workbench: Auth state:", {
      user: authState.user?.email,
      role: authState.user?.role,
      initialized: authState.initialized,
      loading: authState.loading,
    });

    // Try to load agents directly from database first to debug
    console.log("🔄 Workbench: Trying direct database query...");
    const { data: directAgents, error: directError } = await supabase
      .from("agents")
      .select("*")
      .order("name", { ascending: true });

    console.log("🔄 Workbench: Direct database query result:", {
      agentsCount: directAgents?.length || 0,
      error: directError?.message || null,
    });

    // Load agents from the database using the agents store
    let { data: agents, error } = await loadAgents();

    console.log("🔄 Workbench: loadAgents result:", {
      agentsCount: agents?.length || 0,
      error: error || null,
    });

    if (error) {
      console.log(
        "⚠️ Workbench: Using direct database result due to loadAgents error"
      );
      if (directError) {
        throw new Error(`Database error: ${directError.message}`);
      }
      // Use direct agents if available
      if (directAgents && directAgents.length > 0) {
        agents = directAgents;
      } else {
        throw new Error(error);
      }
    }

    if (!agents || agents.length === 0) {
      console.log("⚠️ Workbench: No agents found in database");
      workbenchStore.update((state) => ({
        ...state,
        activeAgents: [],
        loading: false,
      }));
      return { data: [], error: null };
    }

    // Filter for active agents and format for workbench
    const activeAgents = agents
      .filter((agent: any) => agent.is_active !== false)
      .map((agent: any) => ({
        ...agent,
        persona: agent.persona || {
          id: agent.persona_id,
          name: "Unknown Persona",
          response_style: "professional",
        },
        model: agent.model || {
          id: agent.model_id,
          name: "Unknown Model",
          provider: "unknown",
          engine: "unknown",
        },
        dataset: agent.dataset || null,
      }));

    workbenchStore.update((state) => ({
      ...state,
      activeAgents,
      loading: false,
    }));

    console.log("✅ Workbench loaded active agents:", activeAgents.length);
    return { data: activeAgents, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load active agents";
    workbenchStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    console.error("❌ Error loading active agents:", errorMessage);
    return { data: null, error: errorMessage };
  }
}

/**
 * Test a single agent using real API
 */
export async function testAgent(agentId: string, prompt: string) {
  workbenchStore.update((state) => ({ ...state, testing: true }));

  const startTime = Date.now();

  try {
    const state = workbenchStore;
    let currentState: WorkbenchState;
    state.subscribe((s) => (currentState = s))();

    // Ensure we have an authenticated user; chat_sessions.user_id is NOT NULL
    const currentAuth = get(authStore);
    const currentUserId = currentAuth.user?.id;
    if (!currentUserId) {
      throw new Error("You must be signed in to run a workbench test");
    }

    const agent = currentState.activeAgents.find((a) => a.id === agentId);
    if (!agent) {
      throw new Error("Agent not found");
    }

    // Create a temporary chat session for testing
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: currentUserId,
        agent_id: agentId,
        title: `Test: ${prompt.substring(0, 50)}...`,
        metadata: { is_test: true },
      })
      .select()
      .single();

    if (sessionError) {
      throw new Error(`Failed to create test session: ${sessionError.message}`);
    }

    // Call the OpenAI service to generate a response
    const { generateAIResponse } = await import("$lib/services/openai");
    const response = await generateAIResponse(prompt, agentId, session.id);

    const responseTime = Date.now() - startTime;
    const success = !response.error;

    const testResult: TestResult = {
      id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      agentName: agent.name,
      prompt,
      response: success ? response.content : "",
      responseTime: Math.round(responseTime),
      timestamp: new Date().toISOString(),
      success,
      error: success ? undefined : response.error || "Unknown error",
      metadata: {
        tokenCount: response.usage?.total_tokens,
        modelUsed: agent.model?.name,
        temperature: agent.model?.temperature || 0.7,
        maxTokens: agent.model?.max_tokens || 1000,
      },
    };

    const updatedResults = [...currentState.testResults, testResult];
    saveTestResults(updatedResults);

    workbenchStore.update((state) => ({
      ...state,
      testResults: updatedResults,
      testing: false,
    }));

    console.log(
      "✅ Agent test completed:",
      agent.name,
      success ? "Success" : "Failed",
      `(${responseTime}ms)`
    );
    return { data: testResult, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to test agent";
    workbenchStore.update((state) => ({
      ...state,
      testing: false,
      error: errorMessage,
    }));
    console.error("❌ Agent test failed:", errorMessage);
    return { data: null, error: errorMessage };
  }
}

/**
 * Compare multiple agents (mock implementation)
 */
export async function compareAgents(agentIds: string[], prompt: string) {
  workbenchStore.update((state) => ({ ...state, testing: true }));

  try {
    const testResults: TestResult[] = [];

    // Test each agent with the same prompt
    for (const agentId of agentIds) {
      const result = await testAgent(agentId, prompt);
      if (result.data) {
        testResults.push(result.data);
      }
    }

    const comparison: AgentComparison = {
      prompt,
      results: testResults,
      timestamp: new Date().toISOString(),
    };

    let currentState: WorkbenchState;
    workbenchStore.subscribe((s) => (currentState = s))();

    const updatedComparisons = [...currentState.comparisons, comparison];
    saveComparisons(updatedComparisons);

    workbenchStore.update((state) => ({
      ...state,
      comparisons: updatedComparisons,
      testing: false,
    }));

    console.log(
      "✅ Agent comparison completed:",
      testResults.length,
      "agents tested"
    );
    return { data: comparison, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to compare agents";
    workbenchStore.update((state) => ({
      ...state,
      testing: false,
      error: errorMessage,
    }));
    console.error("❌ Agent comparison failed:", errorMessage);
    return { data: null, error: errorMessage };
  }
}

/**
 * Run batch tests (mock implementation)
 */
export async function runBatchTest(agentIds: string[], prompts: string[]) {
  workbenchStore.update((state) => ({ ...state, testing: true }));

  try {
    const batchResults: TestResult[] = [];

    // Test each agent with each prompt
    for (const agentId of agentIds) {
      for (const prompt of prompts) {
        const result = await testAgent(agentId, prompt);
        if (result.data) {
          batchResults.push(result.data);
        }
        // Small delay between tests
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    workbenchStore.update((state) => ({ ...state, testing: false }));

    console.log("✅ Batch test completed:", batchResults.length, "tests run");
    return { data: batchResults, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to run batch test";
    workbenchStore.update((state) => ({
      ...state,
      testing: false,
      error: errorMessage,
    }));
    console.error("❌ Batch test failed:", errorMessage);
    return { data: null, error: errorMessage };
  }
}

/**
 * Get agent analytics (mock implementation)
 */
export async function getAgentAnalytics() {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  let currentState: WorkbenchState;
  workbenchStore.subscribe((s) => (currentState = s))();

  const results = currentState.testResults;
  const agents = currentState.activeAgents;

  // Calculate analytics
  const totalTests = results.length;
  const successfulTests = results.filter((r) => r.success).length;
  const successRate =
    totalTests > 0 ? Math.round((successfulTests / totalTests) * 100) : 0;

  const avgResponseTime =
    results.length > 0
      ? Math.round(
          results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
        )
      : 0;

  // Average token count across tests (only count results that report tokens)
  const tokenCounts = results
    .map((r) => r.metadata?.tokenCount)
    .filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  const averageTokenCount =
    tokenCounts.length > 0
      ? Math.round(
          tokenCounts.reduce((sum, v) => sum + v, 0) / tokenCounts.length
        )
      : 0;

  const agentStats = agents.map((agent) => {
    const agentResults = results.filter((r) => r.agentId === agent.id);
    const agentSuccesses = agentResults.filter((r) => r.success).length;
    const agentSuccessRate =
      agentResults.length > 0
        ? Math.round((agentSuccesses / agentResults.length) * 100)
        : 0;

    return {
      agentId: agent.id,
      agentName: agent.name,
      totalTests: agentResults.length,
      successRate: agentSuccessRate,
      avgResponseTime:
        agentResults.length > 0
          ? Math.round(
              agentResults.reduce((sum, r) => sum + r.responseTime, 0) /
                agentResults.length
            )
          : 0,
    };
  });

  return {
    // Flattened fields to align with existing UI expectations
    totalTests,
    successRate,
    averageResponseTime: avgResponseTime,
    averageTokenCount,

    // Structured overview for programmatic use
    overview: {
      totalTests,
      successRate,
      avgResponseTime,
      totalAgents: agents.length,
      averageTokenCount,
    },
    agents: agentStats,
    recentTests: results.slice(-10).reverse(),
    comparisons: currentState.comparisons.slice(-5).reverse(),
  };
}

/**
 * Clear test results
 */
export function clearTestResults() {
  workbenchStore.update((state) => ({
    ...state,
    testResults: [],
    comparisons: [],
  }));

  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("bigstep_workbench_results");
    localStorage.removeItem("bigstep_workbench_comparisons");
  }
}

/**
 * Clear workbench errors
 */
export function clearWorkbenchError() {
  workbenchStore.update((state) => ({ ...state, error: null }));
}

/**
 * Set selected agents
 */
export function setSelectedAgents(agentIds: string[]) {
  workbenchStore.update((state) => ({ ...state, selectedAgents: agentIds }));
}

/**
 * Export test results to CSV (mock implementation)
 */
export async function exportTestResults(): Promise<string> {
  let currentState: WorkbenchState;
  workbenchStore.subscribe((s) => (currentState = s))();

  const results = currentState.testResults;

  // CSV headers
  let csv =
    "Timestamp,Agent Name,Prompt,Success,Response Time (ms),Token Count,Error\n";

  // CSV rows
  results.forEach((result) => {
    const row = [
      result.timestamp,
      `"${result.agentName}"`,
      `"${result.prompt.replace(/"/g, '""')}"`,
      result.success ? "Success" : "Failed",
      result.responseTime.toString(),
      result.metadata?.tokenCount?.toString() || "",
      result.error ? `"${result.error.replace(/"/g, '""')}"` : "",
    ].join(",");

    csv += row + "\n";
  });

  return csv;
}
