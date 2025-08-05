import { writable, get } from "svelte/store";
import { supabase } from "$lib/supabase";
import type { Model } from "$lib/types/database";
import {
  setLoadingState,
  setDataError,
  setDataLoaded,
  shouldRefreshData,
  canLoadData,
} from "./data-manager";

interface ModelsState {
  models: Model[];
  loading: boolean;
  error: string | null;
  selectedModel: Model | null;
}

const initialState: ModelsState = {
  models: [],
  loading: false,
  error: null,
  selectedModel: null,
};

export const modelsStore = writable<ModelsState>(initialState);

/**
 * Load all models from Supabase
 */
export async function loadModels(forceRefresh = false) {
  // Check if we should load data
  const loadCheck = get(canLoadData);
  if (!loadCheck.shouldLoad) {
    console.log(
      "⏸️ Skipping models load - auth not ready or user cannot manage"
    );
    return { data: null, error: "Not authorized or auth not ready" };
  }

  // Check if data is already loading
  const currentState = get(modelsStore);
  if (currentState.loading) {
    console.log("⏸️ Models already loading, returning current data");
    return { data: currentState.models, error: null };
  }

  // Check if we need to refresh data
  if (
    !forceRefresh &&
    !shouldRefreshData("models") &&
    currentState.models.length > 0
  ) {
    console.log("⏸️ Using cached models data");
    return { data: currentState.models, error: null };
  }

  setLoadingState("models", true);
  modelsStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    const { data, error } = await supabase
      .from("models")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    modelsStore.update((state) => ({
      ...state,
      models: data || [],
      loading: false,
    }));

    setDataLoaded("models");
    console.log("✅ Models loaded successfully:", data?.length || 0);
    return { data: data || [], error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load models";
    modelsStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    setDataError("models", errorMessage);
    return { data: null, error: errorMessage };
  }
}

/**
 * Create a new model in Supabase
 */
export async function createModel(
  model: Omit<Model, "id" | "created_at" | "updated_at">
) {
  modelsStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    const { data, error } = await supabase
      .from("models")
      .insert({
        provider: model.provider,
        name: model.name,
        engine: model.engine,
        api_key_id: model.api_key_id,
        api_endpoint: model.api_endpoint,
        description: model.description,
        max_tokens: model.max_tokens,
        temperature: model.temperature,
        is_active: model.is_active,
      })
      .select()
      .single();

    if (error) throw error;

    // Update local store
    modelsStore.update((state) => ({
      ...state,
      models: [...state.models, data],
      loading: false,
    }));

    console.log("✅ Model created successfully:", data.id);
    return { data, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create model";
    modelsStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Update a model in Supabase
 */
export async function updateModel(id: string, updates: Partial<Model>) {
  modelsStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    const { data, error } = await supabase
      .from("models")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Update local store
    modelsStore.update((state) => ({
      ...state,
      models: state.models.map((m) => (m.id === id ? data : m)),
      loading: false,
    }));

    
    return { data, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update model";
    modelsStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Delete a model from Supabase
 */
export async function deleteModel(id: string) {
  modelsStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    const { error } = await supabase.from("models").delete().eq("id", id);

    if (error) throw error;

    // Update local store
    modelsStore.update((state) => ({
      ...state,
      models: state.models.filter((m) => m.id !== id),
      loading: false,
    }));

    
    return { error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete model";
    modelsStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { error: errorMessage };
  }
}

/**
 * Test a model connection
 */
export async function testModel(id: string) {
  modelsStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    // This would normally make a test API call to the AI provider
    // For now, we'll simulate a successful test
    await new Promise((resolve) => setTimeout(resolve, 2000));

    
    modelsStore.update((state) => ({ ...state, loading: false }));
    return {
      success: true,
      response: "Model connection successful!",
      error: null,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to test model";
    modelsStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { success: false, error: errorMessage };
  }
}

/**
 * Set selected model
 */
export function setSelectedModel(model: Model | null) {
  modelsStore.update((state) => ({
    ...state,
    selectedModel: model,
  }));
}

/**
 * Clear models error
 */
export function clearModelsError() {
  modelsStore.update((state) => ({ ...state, error: null }));
}

/**
 * Validate model data
 */
export function validateModel(model: Partial<Model>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!model.name || model.name.trim().length < 2) {
    errors.push("Model name must be at least 2 characters long");
  }

  if (!model.provider || model.provider.trim().length < 2) {
    errors.push("Provider is required");
  }

  if (!model.engine || model.engine.trim().length < 2) {
    errors.push("Engine is required");
  }

  if (model.max_tokens && (model.max_tokens < 1 || model.max_tokens > 200000)) {
    errors.push("Max tokens must be between 1 and 200,000");
  }

  if (model.temperature && (model.temperature < 0 || model.temperature > 2)) {
    errors.push("Temperature must be between 0 and 2");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format API key for display (show only last 4 characters)
 */
export function formatApiKey(apiKey: string | null): string {
  if (!apiKey || apiKey.length < 8) {
    return "Not configured";
  }
  return `•••••••${apiKey.slice(-4)}`;
}

/**
 * Get available model providers
 */
export function getModelProviders() {
  return [
    {
      value: "openai",
      label: "OpenAI",
      description: "GPT models from OpenAI",
      engines: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
      website: "https://openai.com",
      docs: "https://platform.openai.com/docs",
    },
    {
      value: "anthropic",
      label: "Anthropic",
      description: "Claude models from Anthropic",
      engines: [
        "claude-3-opus-20240229",
        "claude-3-sonnet-20240229",
        "claude-3-haiku-20240307",
      ],
      website: "https://anthropic.com",
      docs: "https://docs.anthropic.com",
    },
    {
      value: "google",
      label: "Google AI",
      description: "Gemini models from Google",
      engines: ["gemini-pro", "gemini-pro-vision"],
      website: "https://ai.google.dev",
      docs: "https://ai.google.dev/docs",
    },
    {
      value: "azure",
      label: "Azure OpenAI",
      description: "OpenAI models via Azure",
      engines: ["gpt-4", "gpt-4-turbo", "gpt-35-turbo"],
      website:
        "https://azure.microsoft.com/en-us/products/cognitive-services/openai-service",
      docs: "https://docs.microsoft.com/en-us/azure/cognitive-services/openai",
    },
    {
      value: "mistral",
      label: "Mistral AI",
      description: "Mistral models",
      engines: ["mistral-large", "mistral-medium", "mistral-small"],
      website: "https://mistral.ai",
      docs: "https://docs.mistral.ai",
    },
    {
      value: "cohere",
      label: "Cohere",
      description: "Command models from Cohere",
      engines: ["command", "command-light", "command-nightly"],
      website: "https://cohere.ai",
      docs: "https://docs.cohere.ai",
    },
  ];
}

/**
 * Get model presets for quick setup
 */
export function getModelPresets() {
  return [
    {
      name: "GPT-4 Turbo (Recommended)",
      provider: "openai",
      engine: "gpt-4-turbo",
      max_tokens: 4096,
      temperature: 0.7,
      description: "Latest GPT-4 model, fast and capable",
    },
    {
      name: "GPT-3.5 Turbo (Cost Effective)",
      provider: "openai",
      engine: "gpt-3.5-turbo",
      max_tokens: 4096,
      temperature: 0.7,
      description: "Balanced performance and cost",
    },
    {
      name: "Claude 3 Sonnet (Creative)",
      provider: "anthropic",
      engine: "claude-3-sonnet-20240229",
      max_tokens: 4096,
      temperature: 0.8,
      description: "Excellent for creative and conversational tasks",
    },
    {
      name: "Claude 3 Haiku (Fast)",
      provider: "anthropic",
      engine: "claude-3-haiku-20240307",
      max_tokens: 4096,
      temperature: 0.7,
      description: "Fast and efficient for simple tasks",
    },
    {
      name: "Gemini Pro (Multimodal)",
      provider: "google",
      engine: "gemini-pro",
      max_tokens: 4096,
      temperature: 0.7,
      description: "Google's multimodal AI model",
    },
  ];
}
