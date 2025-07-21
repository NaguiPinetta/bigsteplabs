import { writable } from "svelte/store";
// import { supabase } from "$lib/supabase";  // Commented out for mock data
import type { Model } from "$lib/types/database";

interface ModelsState {
  models: Model[];
  loading: boolean;
  error: string | null;
  selectedModel: Model | null;
}

// Load existing data from localStorage or use mock data as fallback
function getInitialModels(): Model[] {
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem("bigstep_models");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn("Failed to parse stored models:", e);
      }
    }
  }

  // Default models if no existing data
  return [
    {
      id: "model-gpt4",
      provider: "openai",
      name: "GPT-4",
      engine: "gpt-4",
      api_key_id: null,
      max_tokens: 4096,
      temperature: 0.7,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "model-gpt35",
      provider: "openai",
      name: "GPT-3.5 Turbo",
      engine: "gpt-3.5-turbo",
      api_key_id: null,
      max_tokens: 4096,
      temperature: 0.7,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

const initialModels = getInitialModels();

const initialState: ModelsState = {
  models: initialModels,
  loading: false,
  error: null,
  selectedModel: null,
};

export const modelsStore = writable<ModelsState>(initialState);

// Save models to localStorage whenever they change
function saveModelsToStorage(models: Model[]) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("bigstep_models", JSON.stringify(models));
  }
}

/**
 * Load all models (mock implementation)
 */
export async function loadModels() {
  modelsStore.update((state) => ({ ...state, loading: true, error: null }));

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    const currentModels = getInitialModels();

    modelsStore.update((state) => ({
      ...state,
      models: currentModels,
      loading: false,
    }));

    return { data: currentModels, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load models";
    modelsStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Create a new model (mock implementation)
 */
export async function createModel(
  model: Omit<Model, "id" | "created_at" | "updated_at">
) {
  modelsStore.update((state) => ({ ...state, loading: true, error: null }));

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const currentModels = getInitialModels();

    const newModel: Model = {
      id: `model-${Date.now()}`,
      provider: model.provider,
      name: model.name,
      engine: model.engine,
      api_key_id: model.api_key_id,
      max_tokens: model.max_tokens,
      temperature: model.temperature,
      is_active: model.is_active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedModels = [...currentModels, newModel];
    saveModelsToStorage(updatedModels);

    // Update store
    modelsStore.update((state) => ({
      ...state,
      models: updatedModels,
      loading: false,
    }));

    console.log("✅ Model created successfully:", newModel.name);
    return { data: newModel, error: null };
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
 * Update a model (mock implementation)
 */
export async function updateModel(id: string, updates: Partial<Model>) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const currentModels = getInitialModels();
    const modelIndex = currentModels.findIndex((m) => m.id === id);
    if (modelIndex === -1) {
      throw new Error("Model not found");
    }

    // Update the model
    const updatedModel = {
      ...currentModels[modelIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    currentModels[modelIndex] = updatedModel;
    saveModelsToStorage(currentModels);

    // Update store
    modelsStore.update((state) => ({
      ...state,
      models: [...currentModels],
    }));

    console.log("✅ Model updated successfully:", updatedModel.name);
    return { data: updatedModel, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update model";
    modelsStore.update((state) => ({ ...state, error: errorMessage }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Delete a model (mock implementation)
 */
export async function deleteModel(id: string) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const currentModels = getInitialModels();
    const modelIndex = currentModels.findIndex((m) => m.id === id);
    if (modelIndex === -1) {
      throw new Error("Model not found");
    }

    const deletedModel = currentModels[modelIndex];
    currentModels.splice(modelIndex, 1);
    saveModelsToStorage(currentModels);

    // Update store
    modelsStore.update((state) => ({
      ...state,
      models: [...currentModels],
    }));

    console.log("✅ Model deleted successfully:", deletedModel.name);
    return { success: true, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete model";
    modelsStore.update((state) => ({ ...state, error: errorMessage }));
    return { success: false, error: errorMessage };
  }
}

/**
 * Test model connection
 */
export async function testModel(
  modelId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // This would be implemented to test the actual API connection
    // For now, we'll simulate a test
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In a real implementation, you'd make a test API call here
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection test failed",
    };
  }
}

/**
 * Set selected model
 */
export function setSelectedModel(model: Model | null) {
  modelsStore.update((state) => ({ ...state, selectedModel: model }));
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

  if (!model.name?.trim()) {
    errors.push("Name is required");
  }

  if (!model.provider?.trim()) {
    errors.push("Provider is required");
  }

  if (!model.api_key?.trim()) {
    errors.push("API key is required");
  }

  if (!model.engine?.trim()) {
    errors.push("Engine/Model ID is required");
  }

  if (model.max_tokens && (model.max_tokens < 1 || model.max_tokens > 32000)) {
    errors.push("Max tokens must be between 1 and 32,000");
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
