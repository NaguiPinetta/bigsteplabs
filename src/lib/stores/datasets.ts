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
  console.log("🔍 createDataset called with:", dataset);

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

    console.log("🔍 Prepared dataset data for insertion:", datasetData);
    console.log("🔍 Inserting into Supabase...");

    const { data, error } = await supabase
      .from("datasets")
      .insert(datasetData)
      .select()
      .single();

    console.log("🔍 Supabase response - data:", data, "error:", error);

    if (error) {
      console.error("❌ Supabase error:", error);
      throw error;
    }

    console.log("✅ Dataset inserted successfully:", data);

    // Update store
    datasetsStore.update((state) => ({
      ...state,
      datasets: [data, ...state.datasets],
    }));

    console.log("✅ Store updated successfully");
    return data;
  } catch (error) {
    console.error("❌ Error creating dataset:", error);
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
    console.log("🔍 Loading chunks for dataset:", datasetId);
    const { data, error } = await supabase
      .from("dataset_chunks")
      .select("*")
      .eq("dataset_id", datasetId)
      .order("index", { ascending: true });

    if (error) {
      console.error("❌ Error loading dataset chunks:", error);
      throw error;
    }

    console.log(
      "✅ Loaded",
      data?.length || 0,
      "chunks for dataset:",
      datasetId
    );

    // Update the store with the loaded chunks
    datasetsStore.update((state) => ({
      ...state,
      chunks: {
        ...state.chunks,
        [datasetId]: data || [],
      },
    }));

    return data || [];
  } catch (error) {
    console.error("❌ Error loading dataset chunks:", error);
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
          end_position: Math.min(i + chunkSize, content.length),
        },
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
      .update({ total_chunks: data?.length || 0 })
      .eq("id", datasetId);

    // Refresh the datasets store to reflect the updated total_chunks
    const { data: updatedDataset } = await supabase
      .from("datasets")
      .select("*")
      .eq("id", datasetId)
      .single();

    if (updatedDataset) {
      datasetsStore.update((state) => ({
        ...state,
        datasets: state.datasets.map((dataset) =>
          dataset.id === datasetId ? updatedDataset : dataset
        ),
      }));
    }

    // Refresh chunks in store
    const updatedChunks = await loadDatasetChunks(datasetId);

    return { data: data || [], error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create chunks";
    console.error("❌ Error creating chunks:", errorMessage);
    return { data: null, error: errorMessage };
  }
}

/**
 * Process file and create structured chunks
 */
export async function processFileToStructuredChunks(
  datasetId: string,
  file: File
): Promise<{ data: any[] | null; error: string | null }> {
  try {
    console.log("🔍 Processing file:", file.name, "for dataset:", datasetId);

    const text = await file.text();
    return await createStructuredChunks(datasetId, text, `file:${file.name}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process file";
    console.error("❌ Error processing file:", errorMessage);
    return { data: null, error: errorMessage };
  }
}

/**
 * Smart chunking for structured content (exercises, lessons, etc.)
 * This respects semantic boundaries instead of arbitrary character limits
 */
export async function createStructuredChunks(
  datasetId: string,
  content: string,
  source: string
): Promise<{ data: any[] | null; error: string | null }> {
  try {
    console.log("🔍 createStructuredChunks called for dataset:", datasetId);
    console.log("🔍 Content length:", content.length);
    console.log("🔍 Source:", source);

    // Parse content into structured chunks
    console.log("🔍 Parsing structured content...");
    const chunks = parseStructuredContent(content);
    console.log("🔍 Parsed into", chunks.length, "structured chunks");

    if (chunks.length === 0) {
      console.warn("⚠️ No chunks created from content");
      return { data: [], error: null };
    }

    // Prepare chunks for database insertion
    console.log("🔍 Preparing chunks for database insertion...");
    const dbChunks = chunks.map((chunk, index) => ({
      dataset_id: datasetId,
      index: index,
      content: chunk.content,
      char_count: chunk.content.length,
      token_count: Math.ceil(chunk.content.length / 4), // Rough estimate
      metadata: {
        source: source,
        chunk_type: chunk.type,
        exercise_number: chunk.exerciseNumber,
        prompt: chunk.prompt,
        expected_response: chunk.expectedResponse,
        variations: chunk.variations,
        ...chunk.metadata,
      },
    }));

    console.log("🔍 Prepared", dbChunks.length, "chunks for insertion");
    console.log("🔍 Inserting chunks into database...");

    // Insert chunks into database
    const { data, error } = await supabase
      .from("dataset_chunks")
      .insert(dbChunks)
      .select();

    if (error) {
      console.error("❌ Error inserting structured chunks:", error);
      throw error;
    }

    console.log(
      "✅ Successfully inserted",
      data?.length || 0,
      "structured chunks"
    );

    // Update dataset total_chunks count
    console.log("🔍 Updating dataset total_chunks count...");
    await supabase
      .from("datasets")
      .update({ total_chunks: data?.length || 0 })
      .eq("id", datasetId);

    console.log("✅ Dataset total_chunks updated successfully");

    return { data, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to create structured chunks";
    console.error("❌ Error creating structured chunks:", errorMessage);
    return { data: null, error: errorMessage };
  }
}

/**
 * Parse structured content into logical chunks
 */
export function parseStructuredContent(content: string): Array<{
  content: string;
  type: "metadata" | "exercise" | "instruction";
  exerciseNumber?: number;
  prompt?: string;
  expectedResponse?: string;
  variations?: string[];
  metadata?: Record<string, any>;
}> {
  console.log(
    "🔍 parseStructuredContent called with content:",
    content.substring(0, 200) + "..."
  );

  // Test the Portuguese translation pattern on the full content
  const testPattern =
    /###\s*(\d+)\.\s*Frase:\s*(.+?)\s*>\s*Resposta esperada:\s*(.+?)(?=\n|$)/s;
  const allMatches = content.matchAll(testPattern);
  let matchCount = 0;
  for (const match of allMatches) {
    matchCount++;
    if (matchCount <= 3) {
      // Show first 3 matches
      console.log(`🔍 Found Portuguese translation match ${matchCount}:`, {
        exerciseNumber: match[1],
        prompt: match[2]?.trim(),
        response: match[3]?.trim(),
      });
    }
  }
  console.log(`🔍 Total Portuguese translation matches found: ${matchCount}`);

  // Also test for language direction indicator
  const langDirectionMatch = content.match(/\[pt-BR>(\w+)\]/);
  if (langDirectionMatch) {
    console.log(
      `🔍 Found language direction: pt-BR > ${langDirectionMatch[1]}`
    );
  }

  const chunks: Array<{
    content: string;
    type: "metadata" | "exercise" | "instruction";
    exerciseNumber?: number;
    prompt?: string;
    expectedResponse?: string;
    variations?: string[];
    metadata?: Record<string, any>;
  }> = [];

  // Detect content format dynamically
  const formatPatterns = [
    // Portuguese translation format with language direction: "[pt-BR>de] ### 1. Frase: [Portuguese] > Resposta esperada: [Target]"
    {
      name: "PortugueseTranslation",
      exercisePattern:
        /###\s*(\d+)\.\s*Frase:\s*(.+?)\s*>\s*Resposta esperada:\s*(.+?)(?=\n|$)/s,
      responsePattern: null, // Response is already in the pattern
      variationsPattern: null,
      sectionSplitter: /(?=###\s*\d+\.)/,
      metadataPattern: /\[pt-BR>(\w+)\]/s,
    },
    // Portuguese-German translation format: "### 1. Frase: [Portuguese] > Resposta esperada: [German]"
    {
      name: "PortugueseGerman",
      exercisePattern:
        /###\s*(\d+)\.\s*Frase:\s*(.+?)\s*>\s*Resposta esperada:\s*(.+?)(?=\n|$)/s,
      responsePattern: null, // Response is already in the pattern
      variationsPattern: null,
      sectionSplitter: /(?=###\s*\d+\.)/,
      metadataPattern: /Nível:\s*(.+?)(?=\n\n|$)/s,
    },
    // English format: "1. Prompt: ... Expected Response: ..."
    {
      name: "English",
      exercisePattern: /(\d+)\.\s*Prompt:\s*(.+?)(?=\s*Expected Response:)/s,
      responsePattern: /Expected Response:\s*(.+?)(?=\s*Variations:|$)/s,
      variationsPattern: /Variations:\s*([\s\S]*?)(?=\n\n|\d+\.\s*Prompt:|$)/s,
      sectionSplitter: /(?=\d+\.\s*Prompt:)/,
      metadataPattern: /Level:\s*(.+?)(?=\n\n|$)/s,
    },
    // Portuguese format: "1. Frase: ... Resposta esperada: ..."
    {
      name: "Portuguese",
      exercisePattern: /(\d+)\.\s*Frase:\s*(.+?)(?=\s*Resposta esperada:)/s,
      responsePattern: /Resposta esperada:\s*(.+?)(?=\s*Variações:|$)/s,
      variationsPattern: /Variações:\s*([\s\S]*?)(?=\n\n|\d+\.\s*Frase:|$)/s,
      sectionSplitter: /(?=\d+\.\s*Frase:)/,
      metadataPattern: /Nível:\s*(.+?)(?=\n\n|$)/s,
    },
    // Generic numbered format: "1. [content]"
    {
      name: "Generic",
      exercisePattern: /(\d+)\.\s*(.+?)(?=\n\n|\d+\.|$)/s,
      responsePattern: null,
      variationsPattern: null,
      sectionSplitter: /(?=\d+\.)/,
      metadataPattern: null,
    },
  ];

  // Find the best matching format
  let detectedFormat = null;
  for (const format of formatPatterns) {
    if (format.exercisePattern && format.exercisePattern.test(content)) {
      detectedFormat = format;
      console.log(`🔍 Detected format: ${format.name}`);
      break;
    }
  }

  if (!detectedFormat) {
    console.log(
      "🔍 No structured format detected, treating as general content"
    );
    chunks.push({
      content: content.trim(),
      type: "instruction",
      metadata: {
        content_type: "general",
        source: "manual_input",
      },
    });
    return chunks;
  }

  // Split content into sections
  const sections = content.split(detectedFormat.sectionSplitter);
  console.log(
    `🔍 Split into ${sections.length} sections (${detectedFormat.name} format)`
  );

  if (detectedFormat.name === "PortugueseGerman") {
    console.log("🔍 Portuguese-German sections:");
    sections.forEach((section, index) => {
      console.log(`Section ${index}:`, section.substring(0, 100) + "...");

      // Test the regex pattern on this section
      const testMatch = section.match(detectedFormat.exercisePattern!);
      if (testMatch) {
        console.log(`✅ Section ${index} matches pattern:`, {
          exerciseNumber: testMatch[1],
          prompt: testMatch[2]?.substring(0, 50) + "...",
          response: testMatch[3]?.substring(0, 30) + "...",
        });
      } else {
        console.log(`❌ Section ${index} does NOT match pattern`);
      }
    });
  }

  let currentSection = sections[0] || "";

  // Handle metadata/instructions section
  if (currentSection.trim() && detectedFormat.metadataPattern) {
    const metadataMatch = currentSection.match(detectedFormat.metadataPattern);
    if (metadataMatch) {
      const metadata: Record<string, any> = {
        has_instructions: true,
        format: detectedFormat.name,
      };

      // Handle different metadata patterns
      if (detectedFormat.name === "PortugueseTranslation") {
        metadata.target_language = metadataMatch[1].trim();
        metadata.source_language = "pt-BR";
      } else {
        metadata.level = metadataMatch[1].trim();
      }

      chunks.push({
        content: currentSection.trim(),
        type: "metadata",
        metadata,
      });
      console.log("🔍 Added metadata chunk:", metadata);
    }
  }

  // Process all sections for exercises
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();
    if (!section) continue;

    console.log(
      `🔍 Processing ${detectedFormat.name} section ${i}:`,
      section.substring(0, 100) + "..."
    );

    // Extract exercise information using the detected format
    const exerciseMatch = section.match(detectedFormat.exercisePattern!);

    if (exerciseMatch) {
      const exerciseNumber = parseInt(exerciseMatch[1]);
      const prompt = exerciseMatch[2].trim();

      let expectedResponse = "";
      let variations: string[] = [];

      // Handle Portuguese-German format where response is in the pattern
      if (detectedFormat.name === "PortugueseGerman" && exerciseMatch[3]) {
        expectedResponse = exerciseMatch[3].trim();
        console.log(
          `🔍 Portuguese-German format: Exercise ${exerciseNumber}, Prompt: "${prompt}", Response: "${expectedResponse}"`
        );
      }
      // Extract expected response if pattern exists
      else if (detectedFormat.responsePattern) {
        const expectedMatch = section.match(detectedFormat.responsePattern);
        if (expectedMatch) {
          expectedResponse = expectedMatch[1].trim();
        }
      }

      // Extract variations if pattern exists
      if (detectedFormat.variationsPattern) {
        const variationsMatch = section.match(detectedFormat.variationsPattern);
        if (variationsMatch) {
          const variationText = variationsMatch[1].trim();
          const lines = variationText.split("\n").filter((line) => line.trim());

          lines.forEach((line) => {
            const trimmedLine = line.trim();
            const cleanLine = trimmedLine.replace(/^[-•*]\s*/, "").trim();
            if (cleanLine) {
              variations.push(cleanLine);
            }
          });
        }
      }

      console.log(
        `🔍 Added ${detectedFormat.name} exercise chunk ${exerciseNumber}`,
        "with prompt:",
        prompt.substring(0, 50) + "...",
        "expected:",
        expectedResponse.substring(0, 30) + "...",
        "variations:",
        variations.length
      );

      // Find metadata chunk to get target language
      let targetLanguage = "german"; // default
      const metadataChunk = chunks.find((chunk) => chunk.type === "metadata");
      if (metadataChunk && metadataChunk.metadata?.target_language) {
        targetLanguage = metadataChunk.metadata.target_language;
      }

      chunks.push({
        content: section,
        type: "exercise",
        exerciseNumber,
        prompt,
        expectedResponse,
        variations,
        metadata: {
          exercise_type: "translation_drill",
          language_from:
            detectedFormat.name === "PortugueseTranslation"
              ? "pt-BR"
              : "portuguese",
          language_to: targetLanguage,
          chunk_type: "exercise",
          format: detectedFormat.name,
        },
      });
    } else {
      // If no exercise pattern matches, treat as instruction
      chunks.push({
        content: section,
        type: "instruction",
        metadata: {
          content_type: "instruction",
          source: "manual_input",
          format: detectedFormat.name,
        },
      });
    }
  }

  if (chunks.length === 0) {
    console.log("🔍 No structured content found, treating as single chunk");
    chunks.push({
      content: content.trim(),
      type: "instruction",
      metadata: {
        content_type: "general",
        source: "manual_input",
      },
    });
  }

  console.log("🔍 Final chunks created:", chunks.length);
  chunks.forEach((chunk, index) => {
    console.log(
      `  Chunk ${index}: type=${chunk.type}, exerciseNumber=${chunk.exerciseNumber}, content length=${chunk.content.length}`
    );
  });

  return chunks;
}
