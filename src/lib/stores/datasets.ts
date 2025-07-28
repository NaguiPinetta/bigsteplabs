import { writable, get } from "svelte/store";
import { supabase } from "../supabase";
import type { Dataset } from "../types";
import {
  setLoadingState,
  setDataError,
  setDataLoaded,
  shouldRefreshData,
  canLoadData,
} from "./data-manager";

interface DatasetsState {
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  chunks: Record<string, any[]>;
  loading: boolean;
  error: string | null;
}

const initialState: DatasetsState = {
  datasets: [],
  selectedDataset: null,
  chunks: {},
  loading: false,
  error: null,
};

export const datasetsStore = writable<DatasetsState>(initialState);

export async function loadDatasets(forceRefresh = false): Promise<void> {
  // Check if we should load data
  const loadCheck = get(canLoadData);
  if (!loadCheck.shouldLoad) {
    console.log(
      "⏸️ Skipping datasets load - auth not ready or user cannot manage"
    );
    return;
  }

  // Check if data is already loading
  const currentState = get(datasetsStore);
  if (currentState.loading) {
    console.log("⏸️ Datasets already loading, skipping...");
    return;
  }

  // Check if we need to refresh data
  if (
    !forceRefresh &&
    !shouldRefreshData("datasets") &&
    currentState.datasets.length > 0
  ) {
    console.log("⏸️ Datasets data is fresh, skipping load...");
    return;
  }

  console.log("🔄 Loading datasets from Supabase...");
  setLoadingState("datasets", true);
  datasetsStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    const { data, error } = await supabase
      .from("datasets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    datasetsStore.update((state) => ({
      ...state,
      datasets: data || [],
      loading: false,
    }));

    setDataLoaded("datasets");
    console.log("✅ Datasets loaded from database:", data?.length || 0);
  } catch (error) {
    console.error("Error loading datasets:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load datasets";
    datasetsStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    setDataError("datasets", errorMessage);
  }
}

export async function createDataset(
  dataset: Omit<Dataset, "id" | "created_at" | "updated_at">
): Promise<Dataset | null> {
  try {
    // Prepare the dataset data
    const datasetData = {
      name: dataset.name,
      description: dataset.description,
      user_id: dataset.user_id,
      content_type: dataset.content_type || "file",
      text_content: dataset.text_content,
      text_format: dataset.text_format,
      file_url: dataset.file_url,
      file_name: dataset.file_name,
      file_size: dataset.file_size,
      file_type: dataset.file_type,
      total_chunks: dataset.total_chunks || 0,
      processing_status: dataset.processing_status || "pending",
      metadata: dataset.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("datasets")
      .insert(datasetData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update store
    datasetsStore.update((state) => ({
      ...state,
      datasets: [data, ...state.datasets],
    }));

    return data;
  } catch (error) {
    console.error("Error creating dataset:", error);
    datasetsStore.update((state) => ({
      ...state,
      error:
        error instanceof Error ? error.message : "Failed to create dataset",
    }));
    return null;
  }
}

export async function updateDataset(
  id: string,
  updates: Partial<Dataset>
): Promise<Dataset | null> {
  try {
    const { data, error } = await supabase
      .from("datasets")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update store
    datasetsStore.update((state) => ({
      ...state,
      datasets: state.datasets.map((dataset) =>
        dataset.id === id ? data : dataset
      ),
    }));

    return data;
  } catch (error) {
    console.error("Error updating dataset:", error);
    datasetsStore.update((state) => ({
      ...state,
      error:
        error instanceof Error ? error.message : "Failed to update dataset",
    }));
    return null;
  }
}

export async function deleteDataset(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("datasets").delete().eq("id", id);

    if (error) {
      throw error;
    }

    // Update store
    datasetsStore.update((state) => ({
      ...state,
      datasets: state.datasets.filter((dataset) => dataset.id !== id),
    }));

    return true;
  } catch (error) {
    console.error("Error deleting dataset:", error);
    datasetsStore.update((state) => ({
      ...state,
      error:
        error instanceof Error ? error.message : "Failed to delete dataset",
    }));
    return false;
  }
}

export async function loadDatasetChunks(datasetId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("dataset_chunks")
      .select("*")
      .eq("dataset_id", datasetId)
      .order("index", { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error loading dataset chunks:", error);
    return [];
  }
}

// Helper functions
export function getDatasetById(id: string): Dataset | undefined {
  let dataset: Dataset | undefined;
  datasetsStore.subscribe((state) => {
    dataset = state.datasets.find((d) => d.id === id);
  })();
  return dataset;
}

export function clearError(): void {
  datasetsStore.update((state) => ({ ...state, error: null }));
}

export function setSelectedDataset(dataset: Dataset | null): void {
  datasetsStore.update((state) => ({ ...state, selectedDataset: dataset }));
}

export function clearSelectedDataset(): void {
  datasetsStore.update((state) => ({ ...state, selectedDataset: null }));
}

export function clearDatasetsError(): void {
  datasetsStore.update((state) => ({ ...state, error: null }));
}

/**
 * Create chunks from text content
 */
export async function createChunks(
  datasetId: string,
  content: string,
  source: string,
  chunkSize: number = 1000,
  overlap: number = 200
): Promise<{ data: any[] | null; error: string | null }> {
  try {
    console.log("🔍 Creating chunks for dataset:", datasetId);
    console.log("🔍 Content length:", content.length);
    console.log("🔍 Chunk size:", chunkSize, "Overlap:", overlap);

    // Simple text chunking algorithm
    const chunks: any[] = [];
    let index = 0;
    
    for (let i = 0; i < content.length; i += chunkSize - overlap) {
      const chunkContent = content.slice(i, i + chunkSize);
      const charCount = chunkContent.length;
      
      chunks.push({
        dataset_id: datasetId,
        index: index,
        content: chunkContent,
        char_count: charCount,
        token_count: Math.ceil(charCount / 4), // Rough estimate
        metadata: {
          source: source,
          chunk_size: chunkSize,
          overlap: overlap,
          start_position: i,
          end_position: Math.min(i + chunkSize, content.length)
        }
      });
      
      index++;
    }

    console.log("🔍 Created", chunks.length, "chunks");

    // Insert chunks into database
    const { data, error } = await supabase
      .from("dataset_chunks")
      .insert(chunks)
      .select();

    if (error) {
      console.error("❌ Error inserting chunks:", error);
      throw error;
    }

    console.log("✅ Successfully inserted", data?.length || 0, "chunks");

    // Update dataset total_chunks count
    await supabase
      .from("datasets")
      .update({ total_chunks: (data?.length || 0) })
      .eq("id", datasetId);

    // Refresh chunks in store
    const updatedChunks = await loadDatasetChunks(datasetId);
    datasetsStore.update((state) => ({
      ...state,
      chunks: {
        ...state.chunks,
        [datasetId]: updatedChunks
      }
    }));

    return { data: data || [], error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create chunks";
    console.error("❌ Error creating chunks:", errorMessage);
    return { data: null, error: errorMessage };
  }
}

/**
 * Process file and create chunks
 */
export async function processFileToChunks(
  datasetId: string,
  file: File,
  chunkSize: number = 1000,
  overlap: number = 200
): Promise<{ data: any[] | null; error: string | null }> {
  try {
    console.log("🔍 Processing file:", file.name, "for dataset:", datasetId);
    
    const text = await file.text();
    return await createChunks(datasetId, text, `file:${file.name}`, chunkSize, overlap);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to process file";
    console.error("❌ Error processing file:", errorMessage);
    return { data: null, error: errorMessage };
  }
}
