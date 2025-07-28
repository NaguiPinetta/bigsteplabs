import { writable, get } from "svelte/store";
import { supabase } from "$lib/supabase";
import type { Persona } from "$lib/types/database";
import {
  setLoadingState,
  setDataError,
  setDataLoaded,
  shouldRefreshData,
  canLoadData,
} from "./data-manager";

interface PersonasState {
  personas: Persona[];
  loading: boolean;
  error: string | null;
  selectedPersona: Persona | null;
}

const initialState: PersonasState = {
  personas: [],
  loading: false,
  error: null,
  selectedPersona: null,
};

export const personasStore = writable<PersonasState>(initialState);

/**
 * Load all personas from Supabase
 */
export async function loadPersonas(forceRefresh = false) {
  // Check if we should load data
  const loadCheck = get(canLoadData);
  if (!loadCheck.shouldLoad) {
    console.log(
      "⏸️ Skipping personas load - auth not ready or user cannot manage"
    );
    return { data: null, error: "Not authorized or auth not ready" };
  }

  // Check if data is already loading
  const currentState = get(personasStore);
  if (currentState.loading) {
    console.log("⏸️ Personas already loading, skipping...");
    return { data: currentState.personas, error: null };
  }

  // Check if we need to refresh data
  if (
    !forceRefresh &&
    !shouldRefreshData("personas") &&
    currentState.personas.length > 0
  ) {
    console.log("⏸️ Personas data is fresh, skipping load...");
    return { data: currentState.personas, error: null };
  }

  console.log("🔄 Loading personas from Supabase...");
  setLoadingState("personas", true);
  personasStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    const { data, error } = await supabase
      .from("personas")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    personasStore.update((state) => ({
      ...state,
      personas: data || [],
      loading: false,
    }));

    setDataLoaded("personas");
    console.log("✅ Personas loaded from database:", data?.length || 0);
    return { data: data || [], error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load personas";
    console.error("❌ Error loading personas:", errorMessage);
    personasStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    setDataError("personas", errorMessage);
    return { data: null, error: errorMessage };
  }
}

/**
 * Create a new persona in Supabase
 */
export async function createPersona(
  persona: Omit<Persona, "id" | "created_at" | "updated_at">
) {
  console.log("🔍 createPersona called with:", persona);
  
  personasStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    console.log("🔍 Inserting persona into Supabase...");
    
    const { data, error } = await supabase
      .from("personas")
      .insert({
        name: persona.name,
        description: persona.description,
        system_prompt: persona.system_prompt,
        is_default: persona.is_default || false,
        created_by: persona.created_by,
      })
      .select()
      .single();

    console.log("🔍 Supabase response - data:", data, "error:", error);

    if (error) {
      console.error("❌ Supabase error:", error);
      throw error;
    }

    // Update local store
    personasStore.update((state) => ({
      ...state,
      personas: [...state.personas, data],
      loading: false,
    }));

    console.log("✅ Persona created successfully:", data.name);
    return { data, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create persona";
    console.error("❌ Error creating persona:", errorMessage);
    console.error("❌ Full error object:", error);
    personasStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Update a persona in Supabase
 */
export async function updatePersona(id: string, updates: Partial<Persona>) {
  personasStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    const { data, error } = await supabase
      .from("personas")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Update local store
    personasStore.update((state) => ({
      ...state,
      personas: state.personas.map((p) => (p.id === id ? data : p)),
      loading: false,
    }));

    console.log("✅ Persona updated successfully:", data.name);
    return { data, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update persona";
    console.error("❌ Error updating persona:", errorMessage);
    personasStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Delete a persona from Supabase
 */
export async function deletePersona(id: string) {
  personasStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    const { error } = await supabase.from("personas").delete().eq("id", id);

    if (error) throw error;

    // Update local store
    personasStore.update((state) => ({
      ...state,
      personas: state.personas.filter((p) => p.id !== id),
      loading: false,
    }));

    console.log("✅ Persona deleted successfully");
    return { error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete persona";
    console.error("❌ Error deleting persona:", errorMessage);
    personasStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { error: errorMessage };
  }
}

/**
 * Set selected persona
 */
export function setSelectedPersona(persona: Persona | null) {
  personasStore.update((state) => ({
    ...state,
    selectedPersona: persona,
  }));
}

/**
 * Clear personas error
 */
export function clearPersonasError() {
  personasStore.update((state) => ({ ...state, error: null }));
}

/**
 * Validate persona data
 */
export function validatePersona(persona: Partial<Persona>): {
  valid: boolean;
  errors: string[];
} {
  console.log("🔍 validatePersona called with:", persona);
  
  const errors: string[] = [];

  if (!persona.name || persona.name.trim().length < 2) {
    errors.push("Persona name must be at least 2 characters long");
  }

  if (persona.name && persona.name.length > 100) {
    errors.push("Persona name must be less than 100 characters");
  }

  if (!persona.system_prompt || persona.system_prompt.trim().length < 10) {
    errors.push("System prompt must be at least 10 characters long");
  }

  if (persona.system_prompt && persona.system_prompt.length > 5000) {
    errors.push("System prompt must be less than 5000 characters");
  }

  if (persona.description && persona.description.length > 500) {
    errors.push("Description must be less than 500 characters");
  }

  const result = {
    valid: errors.length === 0,
    errors,
  };
  
  console.log("🔍 Validation result:", result);
  return result;
}

/**
 * Get persona templates/presets
 */
export function getPersonaTemplates() {
  return [
    {
      name: "Language Tutor",
      description:
        "A friendly and patient language teacher who provides explanations and corrections",
      system_prompt: `You are a friendly and patient language tutor. Your role is to:

1. Help students learn new vocabulary and grammar concepts
2. Provide clear explanations with examples
3. Correct mistakes gently and constructively
4. Encourage students and celebrate their progress
5. Adapt your teaching style to each student's level
6. Use simple language when explaining complex concepts
7. Ask follow-up questions to ensure understanding

Always be supportive, encouraging, and focus on building the student's confidence while helping them improve their language skills.`,
    },
    {
      name: "Conversation Partner",
      description:
        "A casual conversation partner for practicing natural dialogue",
      system_prompt: `You are a friendly conversation partner helping students practice natural dialogue. Your role is to:

1. Engage in natural, flowing conversations on various topics
2. Keep conversations interesting and engaging
3. Gently correct major errors without interrupting the flow
4. Ask open-ended questions to encourage longer responses
5. Share your own thoughts and experiences to make conversations feel natural
6. Adapt your language complexity to match the student's level
7. Introduce new vocabulary naturally in context

Focus on making conversations feel authentic and enjoyable while helping students build fluency and confidence.`,
    },
    {
      name: "Grammar Coach",
      description: "A specialist focused on grammar rules and structure",
      system_prompt: `You are a grammar coach specializing in language structure and rules. Your role is to:

1. Explain grammar rules clearly with practical examples
2. Help students identify and correct grammatical errors
3. Provide targeted exercises for specific grammar points
4. Break down complex grammar concepts into simple steps
5. Show how grammar rules apply in real-world contexts
6. Provide memory techniques for difficult grammar rules
7. Give immediate feedback on grammar usage

Focus on making grammar accessible and practical, helping students understand not just what's correct, but why it's correct.`,
    },
    {
      name: "Cultural Guide",
      description: "An expert in cultural context and customs",
      system_prompt: `You are a cultural guide who helps students understand the cultural context of language. Your role is to:

1. Explain cultural nuances and customs related to language use
2. Help students understand appropriate language in different social contexts
3. Share insights about traditions, holidays, and social norms
4. Explain idiomatic expressions and their cultural origins
5. Help students avoid cultural misunderstandings
6. Provide context for formal vs informal language use
7. Discuss regional variations and cultural differences

Focus on helping students not just speak the language, but understand the culture and context behind it.`,
    },
  ];
}
