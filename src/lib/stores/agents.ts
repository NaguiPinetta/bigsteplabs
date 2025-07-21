import { writable } from "svelte/store";
// import { supabase } from "$lib/supabase";  // Commented out for mock data
import type { Agent } from "$lib/types/database";

interface AgentsState {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  selectedAgent: Agent | null;
}

// Load existing data from localStorage or use mock data as fallback
function getInitialAgents(): Agent[] {
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem("bigstep_agents");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn("Failed to parse stored agents:", e);
      }
    }
  }

  // Only return mock data if no existing data
  return [];
}

const initialAgents = getInitialAgents();

const initialState: AgentsState = {
  agents: initialAgents,
  loading: false,
  error: null,
  selectedAgent: null,
};

export const agentsStore = writable<AgentsState>(initialState);

// Save agents to localStorage whenever they change
function saveAgentsToStorage(agents: Agent[]) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("bigstep_agents", JSON.stringify(agents));
  }
}

/**
 * Load all agents (mock implementation)
 */
export async function loadAgents() {
  agentsStore.update((state) => ({ ...state, loading: true, error: null }));

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    const currentAgents = getInitialAgents();

    agentsStore.update((state) => ({
      ...state,
      agents: currentAgents,
      loading: false,
    }));

    return { data: currentAgents, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load agents";
    agentsStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Create a new agent (mock implementation)
 */
export async function createAgent(
  agent: Omit<Agent, "id" | "created_at" | "updated_at">
) {
  agentsStore.update((state) => ({ ...state, loading: true, error: null }));

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const currentAgents = getInitialAgents();

    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name: agent.name,
      description: agent.description,
      persona_id: agent.persona_id,
      model_id: agent.model_id,
      dataset_id: agent.dataset_id,
      status: agent.status as "active" | "inactive" | "training",
      configuration: agent.configuration || {},
      created_by: agent.created_by || "admin-mock-id",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedAgents = [...currentAgents, newAgent];
    saveAgentsToStorage(updatedAgents);

    // Update store
    agentsStore.update((state) => ({
      ...state,
      agents: updatedAgents,
      loading: false,
    }));

    console.log("✅ Agent created successfully:", newAgent.name);
    return { data: newAgent, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create agent";
    agentsStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Update an agent (mock implementation)
 */
export async function updateAgent(id: string, updates: Partial<Agent>) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const currentAgents = getInitialAgents();
    const agentIndex = currentAgents.findIndex((a) => a.id === id);
    if (agentIndex === -1) {
      throw new Error("Agent not found");
    }

    // Update the agent
    const updatedAgent = {
      ...currentAgents[agentIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    currentAgents[agentIndex] = updatedAgent;
    saveAgentsToStorage(currentAgents);

    // Update store
    agentsStore.update((state) => ({
      ...state,
      agents: [...currentAgents],
    }));

    console.log("✅ Agent updated successfully:", updatedAgent.name);
    return { data: updatedAgent, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update agent";
    agentsStore.update((state) => ({ ...state, error: errorMessage }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Delete an agent (mock implementation)
 */
export async function deleteAgent(id: string) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const currentAgents = getInitialAgents();
    const agentIndex = currentAgents.findIndex((a) => a.id === id);
    if (agentIndex === -1) {
      throw new Error("Agent not found");
    }

    const deletedAgent = currentAgents[agentIndex];
    currentAgents.splice(agentIndex, 1);
    saveAgentsToStorage(currentAgents);

    // Update store
    agentsStore.update((state) => ({
      ...state,
      agents: [...currentAgents],
    }));

    console.log("✅ Agent deleted successfully:", deletedAgent.name);
    return { success: true, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete agent";
    agentsStore.update((state) => ({ ...state, error: errorMessage }));
    return { success: false, error: errorMessage };
  }
}

/**
 * Test an agent (mock implementation)
 */
export async function testAgent(id: string, prompt?: string) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const currentAgents = getInitialAgents();
    const agent = currentAgents.find((a) => a.id === id);
    if (!agent) {
      throw new Error("Agent not found");
    }

    // Mock successful test response
    const responses = [
      "Hello! I'm ready to help you with your learning journey.",
      "Great question! Let me provide you with a detailed explanation.",
      "I understand your concern. Here's how I can assist you with that topic.",
      "That's an interesting point! Let me break this down for you.",
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];

    return {
      success: true,
      response: response,
      responseTime: 500 + Math.floor(Math.random() * 1000),
      metadata: {
        tokenCount: Math.floor(Math.random() * 100) + 50,
        modelUsed: agent.model_id,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to test agent",
    };
  }
}

/**
 * Set selected agent
 */
export function setSelectedAgent(agent: Agent | null) {
  agentsStore.update((state) => ({ ...state, selectedAgent: agent }));
}

/**
 * Clear agents error
 */
export function clearAgentsError() {
  agentsStore.update((state) => ({ ...state, error: null }));
}

/**
 * Validate agent data
 */
export function validateAgent(agent: Partial<Agent>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!agent.name || agent.name.trim().length < 2) {
    errors.push("Agent name must be at least 2 characters long");
  }

  if (agent.name && agent.name.length > 100) {
    errors.push("Agent name must be less than 100 characters");
  }

  if (!agent.persona_id) {
    errors.push("Persona is required");
  }

  if (!agent.model_id) {
    errors.push("Model is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get agent statuses for dropdown
 */
export function getAgentStatuses() {
  return [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "training", label: "Training" },
  ];
}

/**
 * Get agent templates
 */
export function getAgentTemplates() {
  return [
    {
      name: "Language Tutor",
      description: "Helps students practice conversation and grammar",
      status: "active",
      example_personas: ["Friendly Teacher", "Native Speaker"],
      suggested_models: ["GPT-4", "GPT-3.5"],
      example_datasets: ["Grammar Rules", "Conversation Examples"],
    },
    {
      name: "Study Assistant",
      description:
        "Provides explanations and answers questions about course material",
      status: "active",
      example_personas: ["Helpful Assistant", "Subject Expert"],
      suggested_models: ["GPT-4", "Claude"],
      example_datasets: ["Course Materials", "FAQ Database"],
    },
    {
      name: "Practice Quiz Bot",
      description: "Creates and administers practice quizzes",
      status: "active",
      example_personas: ["Quiz Master", "Encouraging Coach"],
      suggested_models: ["GPT-3.5", "GPT-4"],
      example_datasets: ["Question Bank", "Learning Objectives"],
    },
  ];
}
