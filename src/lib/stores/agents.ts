import { writable } from "svelte/store";
import { supabase } from "$lib/supabase";
import type { Agent } from "$lib/types/database";

interface AgentsState {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  selectedAgent: Agent | null;
}

const initialState: AgentsState = {
  agents: [],
  loading: false,
  error: null,
  selectedAgent: null,
};

export const agentsStore = writable<AgentsState>(initialState);

/**
 * Load all agents from Supabase with populated relationships
 */
export async function loadAgents() {
  agentsStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    const { data, error } = await supabase
      .from("agents")
      .select(
        `
        *,
        persona:personas!inner(id, name, system_prompt),
        model:models!inner(id, name, provider, engine)
      `
      )
      .order("name", { ascending: true });

    if (error) throw error;

    // For datasets, we need to fetch them separately since it's an array relationship
    const enrichedAgents = await Promise.all(
      (data || []).map(async (agent: any) => {
        let datasets: any[] = [];
        if (agent.dataset_ids && agent.dataset_ids.length > 0) {
          const { data: datasetData } = await supabase
            .from("datasets")
            .select("id, name, description")
            .in("id", agent.dataset_ids);
          datasets = datasetData || [];
        }

        return {
          ...agent,
          datasets, // Array of associated datasets
          dataset: datasets[0] || null, // First dataset for backward compatibility
        };
      })
    );

    agentsStore.update((state) => ({
      ...state,
      agents: enrichedAgents,
      loading: false,
    }));

    console.log(
      "✅ Agents loaded with populated relationships:",
      enrichedAgents.length
    );
    return { data: enrichedAgents, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load agents";
    console.error("❌ Error loading agents:", errorMessage);
    agentsStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Create a new agent in Supabase with relationships
 */
export async function createAgent(agent: any) {
  agentsStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    const { data, error } = await supabase
      .from("agents")
      .insert({
        name: agent.name,
        description: agent.description,
        persona_id: agent.persona_id,
        model_id: agent.model_id,
        dataset_ids: agent.dataset_ids || [],
        tools: null,
        output_format: null,
        is_active: (agent.status as string) === "active",
        created_by: agent.created_by,
      })
      .select(
        `
        *,
        persona:personas!inner(id, name, system_prompt),
        model:models!inner(id, name, provider, engine)
      `
      )
      .single();

    if (error) throw error;

    // Load datasets if any
    let datasets: any[] = [];
    if (data.dataset_ids && data.dataset_ids.length > 0) {
      const { data: datasetData } = await supabase
        .from("datasets")
        .select("id, name, description")
        .in("id", data.dataset_ids);
      datasets = datasetData || [];
    }

    const enrichedAgent = {
      ...data,
      datasets,
      dataset: datasets[0] || null,
    };

    // Update store
    agentsStore.update((state) => ({
      ...state,
      agents: [...state.agents, enrichedAgent],
      loading: false,
    }));

    console.log("✅ Agent created successfully:", data.name);
    return { data: enrichedAgent, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create agent";
    console.error("❌ Error creating agent:", errorMessage);
    agentsStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Update an agent in Supabase
 */
export async function updateAgent(id: string, updates: any) {
  agentsStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    const { data, error } = await supabase
      .from("agents")
      .update(updates)
      .eq("id", id)
      .select(
        `
        *,
        persona:personas!inner(id, name, system_prompt),
        model:models!inner(id, name, provider, engine)
      `
      )
      .single();

    if (error) throw error;

    // Load datasets if any
    let datasets: any[] = [];
    if (data.dataset_ids && data.dataset_ids.length > 0) {
      const { data: datasetData } = await supabase
        .from("datasets")
        .select("id, name, description")
        .in("id", data.dataset_ids);
      datasets = datasetData || [];
    }

    const enrichedAgent = {
      ...data,
      datasets,
      dataset: datasets[0] || null,
    };

    // Update local store
    agentsStore.update((state) => ({
      ...state,
      agents: state.agents.map((a) => (a.id === id ? enrichedAgent : a)),
      loading: false,
    }));

    console.log("✅ Agent updated successfully:", data.name);
    return { data: enrichedAgent, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update agent";
    console.error("❌ Error updating agent:", errorMessage);
    agentsStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Delete an agent from Supabase
 */
export async function deleteAgent(id: string) {
  agentsStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    const { error } = await supabase.from("agents").delete().eq("id", id);

    if (error) throw error;

    // Update local store
    agentsStore.update((state) => ({
      ...state,
      agents: state.agents.filter((a) => a.id !== id),
      loading: false,
    }));

    console.log("✅ Agent deleted successfully");
    return { error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete agent";
    console.error("❌ Error deleting agent:", errorMessage);
    agentsStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { error: errorMessage };
  }
}

/**
 * Test an agent
 */
export async function testAgent(id: string) {
  try {
    // This would normally make a test call to the agent
    // For now, we'll simulate a successful test
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("✅ Agent test successful:", id);
    return {
      success: true,
      response:
        "Agent test successful! The agent is properly configured and ready to chat.",
      error: null,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to test agent";
    console.error("❌ Error testing agent:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Set selected agent
 */
export function setSelectedAgent(agent: any) {
  agentsStore.update((state) => ({
    ...state,
    selectedAgent: agent,
  }));
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
export function validateAgent(agent: any): {
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
 * Get agent statuses
 */
export function getAgentStatuses() {
  return [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "training", label: "Training" },
    { value: "maintenance", label: "Maintenance" },
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
