import { writable, get } from "svelte/store";
// import { supabase } from "$lib/supabase";  // Commented out for mock data

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
      } catch (e) {
        console.warn("Failed to parse stored test results:", e);
      }
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
      } catch (e) {
        console.warn("Failed to parse stored comparisons:", e);
      }
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
 * Load active agents for testing (mock implementation)
 */
export async function loadActiveAgents() {
  workbenchStore.update((state) => ({ ...state, loading: true, error: null }));

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    // Get agents from localStorage (created via Agents page)
    const storedAgents = localStorage.getItem("bigstep_agents");
    const storedPersonas = localStorage.getItem("bigstep_personas");
    const storedModels = localStorage.getItem("bigstep_models");

    let agents = [];
    let personas = [];
    let models = [];

    try {
      agents = storedAgents ? JSON.parse(storedAgents) : [];
      personas = storedPersonas ? JSON.parse(storedPersonas) : [];
      models = storedModels ? JSON.parse(storedModels) : [];
    } catch (e) {
      console.warn("Failed to parse stored data for workbench:", e);
    }

    // Create enriched agent data for workbench
    const activeAgents = agents
      .filter((agent: any) => agent.is_active !== false)
      .map((agent: any) => ({
        ...agent,
        persona: personas.find((p: any) => p.id === agent.persona_id) || {
          id: agent.persona_id,
          name: "Unknown Persona",
          response_style: "professional",
        },
        model: models.find((m: any) => m.id === agent.model_id) || {
          id: agent.model_id,
          name: "Unknown Model",
          provider: "unknown",
          engine: "unknown",
        },
        dataset: null, // Would fetch from datasets store if needed
      }));

    workbenchStore.update((state) => ({
      ...state,
      activeAgents,
      loading: false,
    }));

    return { data: activeAgents, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load active agents";
    workbenchStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Test a single agent (mock implementation)
 */
export async function testAgent(agentId: string, prompt: string) {
  workbenchStore.update((state) => ({ ...state, testing: true }));

  // Simulate API delay
  await new Promise((resolve) =>
    setTimeout(resolve, 800 + Math.random() * 1200)
  );

  try {
    const state = workbenchStore;
    let currentState: WorkbenchState;
    state.subscribe((s) => (currentState = s))();

    const agent = currentState.activeAgents.find((a) => a.id === agentId);
    if (!agent) {
      throw new Error("Agent not found");
    }

    // Mock responses based on agent type
    const responses = [
      `Hello! I'm ${agent.name}. ${
        prompt.includes("spanish")
          ? "Hola! ¿Cómo puedo ayudarte con español?"
          : "How can I help you learn today?"
      }`,
      `Great question! As ${agent.name}, I can help you with that. Let me break it down for you...`,
      `That's an interesting topic! Based on my training, here's what I can tell you...`,
      `I understand your question. Let me provide a detailed explanation...`,
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];
    const responseTime = 500 + Math.random() * 1500;
    const success = Math.random() > 0.1; // 90% success rate

    const testResult: TestResult = {
      id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      agentName: agent.name,
      prompt,
      response: success ? response : "",
      responseTime: Math.round(responseTime),
      timestamp: new Date().toISOString(),
      success,
      error: success ? undefined : "Simulated network error",
      metadata: {
        tokenCount: success ? Math.floor(Math.random() * 150) + 50 : undefined,
        modelUsed: agent.model?.name,
        temperature: 0.7,
        maxTokens: 1000,
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
      success ? "Success" : "Failed"
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

    console.log("✅ Agent comparison completed:", agentIds.length, "agents");
    return { data: comparison, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to compare agents";
    workbenchStore.update((state) => ({
      ...state,
      testing: false,
      error: errorMessage,
    }));
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

    console.log("✅ Batch test completed:", batchResults.length, "tests");
    return { data: batchResults, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to run batch test";
    workbenchStore.update((state) => ({
      ...state,
      testing: false,
      error: errorMessage,
    }));
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
    overview: {
      totalTests,
      successRate,
      avgResponseTime,
      totalAgents: agents.length,
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

  console.log("✅ Test results cleared");
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
