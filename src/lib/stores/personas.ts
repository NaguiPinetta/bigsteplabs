import { writable } from "svelte/store";
// import { supabase } from "$lib/supabase";  // Commented out for mock data
import type { Persona } from "$lib/types/database";

interface PersonasState {
  personas: Persona[];
  loading: boolean;
  error: string | null;
  selectedPersona: Persona | null;
}

// Load existing data from localStorage or use mock data as fallback
function getInitialPersonas(): Persona[] {
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem("bigstep_personas");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn("Failed to parse stored personas:", e);
      }
    }
  }

  // Only return mock data if no existing data
  return [];
}

const initialPersonas = getInitialPersonas();

const initialState: PersonasState = {
  personas: initialPersonas,
  loading: false,
  error: null,
  selectedPersona: null,
};

export const personasStore = writable<PersonasState>(initialState);

// Save personas to localStorage whenever they change
function savePersonasToStorage(personas: Persona[]) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("bigstep_personas", JSON.stringify(personas));
  }
}

/**
 * Load all personas (mock implementation)
 */
export async function loadPersonas() {
  personasStore.update((state) => ({ ...state, loading: true, error: null }));

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    const currentPersonas = getInitialPersonas();

    personasStore.update((state) => ({
      ...state,
      personas: currentPersonas,
      loading: false,
    }));

    return { data: currentPersonas, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load personas";
    personasStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Create a new persona (mock implementation)
 */
export async function createPersona(
  persona: Omit<Persona, "id" | "created_at" | "updated_at">
) {
  personasStore.update((state) => ({ ...state, loading: true, error: null }));

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const currentPersonas = getInitialPersonas();

    const newPersona: Persona = {
      id: `persona-${Date.now()}`,
      name: persona.name,
      description: persona.description,
      system_prompt: persona.system_prompt,
      is_default: persona.is_default || false,
      created_by: persona.created_by || "admin-mock-id",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedPersonas = [...currentPersonas, newPersona];
    savePersonasToStorage(updatedPersonas);

    // Update store
    personasStore.update((state) => ({
      ...state,
      personas: updatedPersonas,
      loading: false,
    }));

    console.log("✅ Persona created successfully:", newPersona.name);
    return { data: newPersona, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create persona";
    personasStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Update a persona (mock implementation)
 */
export async function updatePersona(id: string, updates: Partial<Persona>) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const currentPersonas = getInitialPersonas();
    const personaIndex = currentPersonas.findIndex((p) => p.id === id);
    if (personaIndex === -1) {
      throw new Error("Persona not found");
    }

    // Update the persona
    const updatedPersona = {
      ...currentPersonas[personaIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    currentPersonas[personaIndex] = updatedPersona;
    savePersonasToStorage(currentPersonas);

    // Update store
    personasStore.update((state) => ({
      ...state,
      personas: [...currentPersonas],
    }));

    console.log("✅ Persona updated successfully:", updatedPersona.name);
    return { data: updatedPersona, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update persona";
    personasStore.update((state) => ({ ...state, error: errorMessage }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Delete a persona (mock implementation)
 */
export async function deletePersona(id: string) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const currentPersonas = getInitialPersonas();
    const personaIndex = currentPersonas.findIndex((p) => p.id === id);
    if (personaIndex === -1) {
      throw new Error("Persona not found");
    }

    const deletedPersona = currentPersonas[personaIndex];
    currentPersonas.splice(personaIndex, 1);
    savePersonasToStorage(currentPersonas);

    // Update store
    personasStore.update((state) => ({
      ...state,
      personas: [...currentPersonas],
    }));

    console.log("✅ Persona deleted successfully:", deletedPersona.name);
    return { success: true, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete persona";
    personasStore.update((state) => ({ ...state, error: errorMessage }));
    return { success: false, error: errorMessage };
  }
}

/**
 * Set selected persona
 */
export function setSelectedPersona(persona: Persona | null) {
  personasStore.update((state) => ({ ...state, selectedPersona: persona }));
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

  if (persona.system_prompt && persona.system_prompt.length > 4000) {
    errors.push("System prompt must be less than 4000 characters");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
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
