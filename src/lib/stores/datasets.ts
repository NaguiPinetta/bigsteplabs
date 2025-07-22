import { writable } from "svelte/store";
import { supabase } from "$lib/supabase";
import type { Dataset, ContentChunk } from "$lib/types/database";

interface DatasetsState {
  datasets: Dataset[];
  chunks: Record<string, ContentChunk[]>;
  loading: boolean;
  error: string | null;
  selectedDataset: Dataset | null;
}

// Load existing data from localStorage or use mock data as fallback
function getInitialDatasets(): Dataset[] {
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem("bigstep_datasets");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn("Failed to parse stored datasets:", e);
      }
    }
  }

  // Only return mock data if no existing data
  return [];
}

const initialDatasets = getInitialDatasets();

const initialState: DatasetsState = {
  datasets: initialDatasets,
  chunks: {},
  loading: false,
  error: null,
  selectedDataset: null,
};

export const datasetsStore = writable<DatasetsState>(initialState);

// Save datasets to localStorage whenever they change
function saveDatasetsToStorage(datasets: Dataset[]) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("bigstep_datasets", JSON.stringify(datasets));
  }
}

/**
 * Load all datasets from Supabase
 */
export async function loadDatasets() {
  datasetsStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    const { data, error } = await supabase
      .from("datasets")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    datasetsStore.update((state) => ({
      ...state,
      datasets: data || [],
      loading: false,
    }));

    console.log("✅ Datasets loaded from database:", data?.length || 0);
    return { data: data || [], error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load datasets";
    console.error("❌ Error loading datasets:", errorMessage);
    datasetsStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Create a new dataset in Supabase
 * Supports both file upload and direct text input
 */
export async function createDataset(dataset: {
  name: string;
  description?: string;
  content_type: "file" | "text";
  user_id: string;
  // For file uploads
  file?: File;
  // For direct text input
  text_content?: string;
  text_format?: "json" | "markdown" | "plain";
}) {
  datasetsStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    const { data, error } = await supabase
      .from("datasets")
      .insert({
        name: dataset.name,
        description: dataset.description || null,
        user_id: dataset.user_id,
        file_url: null, // Would be set after file upload
        file_name: dataset.file?.name || null,
        file_size:
          dataset.content_type === "file"
            ? dataset.file?.size || 0
            : dataset.text_content?.length || 0,
        file_type:
          dataset.file?.type ||
          (dataset.content_type === "text" ? "text/plain" : null),
        total_chunks: 0,
        processing_status: "ready",
        metadata: {
          content_type: dataset.content_type,
          text_format: dataset.text_format || null,
          text_content: dataset.text_content || null,
        },
      })
      .select()
      .single();

    if (error) throw error;

    // Update local store
    datasetsStore.update((state) => ({
      ...state,
      datasets: [...state.datasets, data],
      loading: false,
    }));

    console.log("✅ Dataset created successfully:", data.name);
    return { data, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create dataset";
    datasetsStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Update a dataset (mock implementation)
 */
export async function updateDataset(id: string, updates: Partial<Dataset>) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const currentDatasets = getInitialDatasets();
    const datasetIndex = currentDatasets.findIndex((d) => d.id === id);
    if (datasetIndex === -1) {
      throw new Error("Dataset not found");
    }

    // Update the dataset
    const updatedDataset = {
      ...currentDatasets[datasetIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    currentDatasets[datasetIndex] = updatedDataset;
    saveDatasetsToStorage(currentDatasets);

    // Update store
    datasetsStore.update((state) => ({
      ...state,
      datasets: [...currentDatasets],
    }));

    console.log("✅ Dataset updated successfully:", updatedDataset.name);
    return { data: updatedDataset, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update dataset";
    datasetsStore.update((state) => ({ ...state, error: errorMessage }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Delete a dataset (mock implementation)
 */
export async function deleteDataset(id: string) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const currentDatasets = getInitialDatasets();
    const datasetIndex = currentDatasets.findIndex((d) => d.id === id);
    if (datasetIndex === -1) {
      throw new Error("Dataset not found");
    }

    const deletedDataset = currentDatasets[datasetIndex];
    currentDatasets.splice(datasetIndex, 1);
    saveDatasetsToStorage(currentDatasets);

    // Update store
    datasetsStore.update((state) => ({
      ...state,
      datasets: [...currentDatasets],
    }));

    console.log("✅ Dataset deleted successfully:", deletedDataset.name);
    return { success: true, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete dataset";
    datasetsStore.update((state) => ({ ...state, error: errorMessage }));
    return { success: false, error: errorMessage };
  }
}

/**
 * Load chunks for a dataset (mock implementation)
 */
export async function loadDatasetChunks(datasetId: string) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Generate mock chunks based on dataset
    const currentDatasets = getInitialDatasets();
    const dataset = currentDatasets.find((d) => d.id === datasetId);

    if (!dataset) {
      throw new Error("Dataset not found");
    }

    const mockChunks: ContentChunk[] = [];

    if (dataset.metadata?.text_content) {
      // Split text content into chunks for demonstration
      const content = dataset.metadata.text_content;
      const chunkSize = 500; // characters
      const numChunks = Math.ceil(content.length / chunkSize);

      for (let i = 0; i < numChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, content.length);
        const chunkContent = content.substring(start, end);

        mockChunks.push({
          id: `chunk-${datasetId}-${i}`,
          dataset_id: datasetId,
          index: i,
          content: chunkContent,
          token_count: Math.ceil(chunkContent.length / 4), // Rough estimate
          char_count: chunkContent.length,
          metadata: {
            source: dataset.name,
            format: dataset.metadata.text_format || "plain",
            start_char: start,
            end_char: end,
          },
          created_at: new Date().toISOString(),
        });
      }
    } else {
      // Mock chunks for file-based datasets
      for (let i = 0; i < 3; i++) {
        mockChunks.push({
          id: `chunk-${datasetId}-${i}`,
          dataset_id: datasetId,
          index: i,
          content: `Sample content chunk ${i + 1} from ${dataset.name}`,
          token_count: 50 + Math.floor(Math.random() * 100),
          char_count: 100 + Math.floor(Math.random() * 200),
          metadata: {
            source: dataset.metadata?.file_name || dataset.name,
            page: i + 1,
          },
          created_at: new Date().toISOString(),
        });
      }
    }

    // Update store
    datasetsStore.update((state) => ({
      ...state,
      chunks: {
        ...state.chunks,
        [datasetId]: mockChunks,
      },
    }));

    return { data: mockChunks, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load chunks";
    datasetsStore.update((state) => ({ ...state, error: errorMessage }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Set selected dataset
 */
export function setSelectedDataset(dataset: Dataset | null) {
  datasetsStore.update((state) => ({ ...state, selectedDataset: dataset }));
}

/**
 * Clear datasets error
 */
export function clearDatasetsError() {
  datasetsStore.update((state) => ({ ...state, error: null }));
}

/**
 * Validate dataset data
 */
export function validateDataset(dataset: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!dataset.name || dataset.name.trim().length < 2) {
    errors.push("Dataset name must be at least 2 characters long");
  }

  if (dataset.name && dataset.name.length > 100) {
    errors.push("Dataset name must be less than 100 characters");
  }

  if (dataset.content_type === "text" && !dataset.text_content?.trim()) {
    errors.push("Text content is required when creating a text dataset");
  }

  if (dataset.content_type === "file" && !dataset.file) {
    errors.push("File is required when creating a file dataset");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get dataset statistics (mock implementation)
 */
export async function getDatasetStats(datasetId: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Return mock statistics
  return {
    chunks: Math.floor(Math.random() * 50) + 10,
    tokens: Math.floor(Math.random() * 10000) + 1000,
    characters: Math.floor(Math.random() * 50000) + 5000,
  };
}
