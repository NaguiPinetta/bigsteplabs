import { writable } from "svelte/store";
import { supabase } from "$lib/supabase";
import type { ChatSession, Message } from "$lib/types/database";
import { generateAIResponse } from "$lib/services/openai";

interface ChatState {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  messages: Message[];
  agents: any[];
  loading: boolean;
  error: string | null;
  sendingMessage: boolean;
  typingIndicator: boolean;
}

const initialState: ChatState = {
  sessions: [],
  currentSession: null,
  messages: [],
  agents: [],
  loading: false,
  error: null,
  sendingMessage: false,
  typingIndicator: false,
};

export const chatStore = writable<ChatState>(initialState);

/**
 * Load user's chat sessions from Supabase
 */
export async function loadChatSessions() {
  chatStore.update((state) => ({ ...state, loading: true, error: null }));

  try {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select(
        `
        *,
        agent:agents(
          id, name, is_active,
          persona:personas(name, system_prompt),
          model:models(name, provider, engine)
        )
      `
      )
      .order("started_at", { ascending: false });

    if (error) throw error;

    chatStore.update((state) => ({
      ...state,
      sessions: data || [],
      loading: false,
    }));

    console.log("✅ Chat sessions loaded from database:", data?.length || 0);
    return { data, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load chat sessions";
    console.error("❌ Error loading chat sessions:", errorMessage);
    chatStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Load available agents for chat from Supabase
 */
export async function loadAvailableAgents() {
  try {
    const { data, error } = await supabase
      .from("agents")
      .select(
        `
        id, name, description,
        persona:personas!inner(id, name, system_prompt),
        model:models!inner(id, name, provider, engine)
      `
      )
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) throw error;

    chatStore.update((state) => ({
      ...state,
      agents: data || [],
    }));

    console.log(
      "📝 Loaded available agents for chat from database:",
      data?.length || 0
    );
    return { data: data || [], error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load agents";
    console.error("❌ Error loading agents for chat:", errorMessage);
    chatStore.update((state) => ({ ...state, error: errorMessage }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Create a new chat session in Supabase
 */
export async function createChatSession(agentId: string, userId: string) {
  try {
    console.log("🚀 Creating chat session for agent:", agentId);

    // First get the agent details
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select(
        `
        id, name,
        persona:personas!inner(name, system_prompt),
        model:models!inner(name, provider, engine)
      `
      )
      .eq("id", agentId)
      .single();

    if (agentError || !agent) {
      throw new Error("Agent not found");
    }

    // Create the session
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: userId,
        agent_id: agentId,
        unit_id: null,
        status: "active",
        title: `Chat with ${agent.name}`,
        message_count: 0,
        metadata: {},
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Combine session with agent data
    const newSession = {
      ...session,
      agent,
    };

    // Update local store
    chatStore.update((state) => ({
      ...state,
      sessions: [newSession, ...state.sessions],
      currentSession: newSession,
      messages: [],
    }));

    console.log("✅ Chat session created in database:", session.id);
    return { data: newSession, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create chat session";
    console.error("❌ Error creating chat session:", errorMessage);
    chatStore.update((state) => ({ ...state, error: errorMessage }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Set current chat session and load messages from Supabase
 */
export async function setCurrentSession(session: ChatSession | null) {
  if (!session) {
    chatStore.update((state) => ({
      ...state,
      currentSession: null,
      messages: [],
      loading: false,
    }));
    return { data: null, error: null };
  }

  chatStore.update((state) => ({
    ...state,
    currentSession: session,
    messages: [],
    loading: true,
  }));

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    chatStore.update((state) => ({
      ...state,
      messages: data || [],
      loading: false,
    }));

    console.log(
      "✅ Chat session set with messages from database:",
      data?.length || 0
    );
    return { data: data || [], error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load messages";
    console.error("❌ Error loading messages:", errorMessage);
    chatStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Send a message in the current session to Supabase
 */
export async function sendMessage(
  content: string,
  sessionId: string,
  audioUrl?: string
) {
  console.log("💬 Sending message:", content, audioUrl ? "(with audio)" : "");

  chatStore.update((state) => ({
    ...state,
    sendingMessage: true,
    error: null,
  }));

  try {
    // Get current session to find agent ID
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("agent_id")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error("Session not found");
    }

    // Prepare message metadata
    const messageMetadata: any = {};
    if (audioUrl) {
      messageMetadata.audio_url = audioUrl;
      messageMetadata.is_voice_message = true;
    }

    // Create and save user message to database
    const { data: userMessage, error: userError } = await supabase
      .from("messages")
      .insert({
        session_id: sessionId,
        role: "user",
        content: content.trim(),
        metadata: messageMetadata,
      })
      .select()
      .single();

    if (userError) throw userError;

    // Update local state with user message immediately
    chatStore.update((state) => ({
      ...state,
      messages: [...state.messages, userMessage],
      typingIndicator: true,
    }));

    // Generate AI response using OpenAI API
    const startTime = Date.now();
    let aiResponse;

    try {
      aiResponse = await generateAIResponse(
        content,
        session.agent_id,
        sessionId
      );
    } catch (error) {
      console.error("❌ OpenAI API error:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to generate AI response. Please check your OpenAI API key and try again."
      );
    }

    const responseTime = Date.now() - startTime;

    // Create and save AI message to database
    const { data: aiMessage, error: aiError } = await supabase
      .from("messages")
      .insert({
        session_id: sessionId,
        role: "assistant",
        content: aiResponse.content,
        metadata: {
          response_time_ms: responseTime,
          usage: aiResponse.usage,
          model: "openai",
        },
      })
      .select()
      .single();

    if (aiError) throw aiError;

    // Update session's message count
    const { data: sessionData } = await supabase
      .from("chat_sessions")
      .select("message_count")
      .eq("id", sessionId)
      .single();

    if (sessionData) {
      const { error: sessionError } = await supabase
        .from("chat_sessions")
        .update({
          message_count: (sessionData.message_count || 0) + 2,
        })
        .eq("id", sessionId);

      if (sessionError) {
        console.warn(
          "⚠️ Failed to update session message count:",
          sessionError
        );
      }
    }

    // Update local state with AI response
    chatStore.update((state) => ({
      ...state,
      messages: [...state.messages, aiMessage],
      typingIndicator: false,
      sendingMessage: false,
    }));

    console.log("✅ Messages sent and received successfully via OpenAI API");
    return { data: { userMessage, aiMessage }, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send message";
    console.error("❌ Error sending message:", errorMessage);

    chatStore.update((state) => ({
      ...state,
      sendingMessage: false,
      typingIndicator: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Delete a chat session from Supabase
 */
export async function deleteChatSession(sessionId: string) {
  try {
    // Delete messages first (cascade should handle this, but being explicit)
    const { error: messagesError } = await supabase
      .from("messages")
      .delete()
      .eq("session_id", sessionId);

    if (messagesError) {
      console.warn("⚠️ Error deleting messages:", messagesError);
    }

    // Delete session
    const { error: sessionError } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", sessionId);

    if (sessionError) throw sessionError;

    // Update local state
    chatStore.update((state) => ({
      ...state,
      sessions: state.sessions.filter((s) => s.id !== sessionId),
      currentSession:
        state.currentSession?.id === sessionId ? null : state.currentSession,
      messages: state.currentSession?.id === sessionId ? [] : state.messages,
    }));

    console.log("✅ Chat session deleted from database:", sessionId);
    return { error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete chat session";
    console.error("❌ Error deleting chat session:", errorMessage);
    chatStore.update((state) => ({ ...state, error: errorMessage }));
    return { error: errorMessage };
  }
}

/**
 * End a chat session in Supabase
 */
export async function endChatSession(sessionId: string) {
  try {
    const { error } = await supabase
      .from("chat_sessions")
      .update({ status: "ended" })
      .eq("id", sessionId);

    if (error) throw error;

    // Update local state
    chatStore.update((state) => ({
      ...state,
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, status: "ended" as const } : s
      ),
      currentSession:
        state.currentSession?.id === sessionId
          ? { ...state.currentSession, status: "ended" as const }
          : state.currentSession,
    }));

    console.log("✅ Chat session ended:", sessionId);
    return { error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to end chat session";
    console.error("❌ Error ending chat session:", errorMessage);
    return { error: errorMessage };
  }
}

/**
 * Clear chat store errors
 */
export function clearChatError() {
  chatStore.update((state) => ({ ...state, error: null }));
}

/**
 * Clear current session
 */
export function clearCurrentSession() {
  chatStore.update((state) => ({
    ...state,
    currentSession: null,
    messages: [],
  }));
}

// Helper functions

async function getMessageCount(sessionId: string): Promise<number> {
  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId);

  return count || 0;
}
