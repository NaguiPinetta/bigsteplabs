import { writable } from "svelte/store";
import { supabase } from "$lib/supabase";
import type { ChatSession, Message } from "$lib/types/database";

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
 * Load user's chat sessions
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
					id, name, status,
					persona:personas(name, response_style),
					model:models(name, provider, engine)
				)
			`
      )
      .order("updated_at", { ascending: false });

    if (error) throw error;

    chatStore.update((state) => ({
      ...state,
      sessions: data || [],
      loading: false,
    }));

    return { data, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load chat sessions";
    chatStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Load available agents for chat
 */
export async function loadAvailableAgents() {
  try {
    const { data, error } = await supabase
      .from("agents")
      .select(
        `
				*,
				persona:personas(name, response_style),
				model:models(name, provider, engine)
			`
      )
      .eq("status", "active")
      .order("name");

    if (error) throw error;

    chatStore.update((state) => ({
      ...state,
      agents: data || [],
    }));

    return { data, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load agents";
    return { data: null, error: errorMessage };
  }
}

/**
 * Create a new chat session
 */
export async function createChatSession(agentId: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert([
        {
          agent_id: agentId,
          user_id: userId,
          status: "active",
        },
      ])
      .select(
        `
				*,
				agent:agents(
					id, name, status,
					persona:personas(name, response_style),
					model:models(name, provider, engine)
				)
			`
      )
      .single();

    if (error) throw error;

    // Add to sessions list and set as current
    chatStore.update((state) => ({
      ...state,
      sessions: [data, ...state.sessions],
      currentSession: data,
      messages: [],
    }));

    return { data, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create chat session";
    chatStore.update((state) => ({ ...state, error: errorMessage }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Set current chat session and load messages
 */
export async function setCurrentSession(session: ChatSession) {
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

    return { data, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load messages";
    chatStore.update((state) => ({
      ...state,
      loading: false,
      error: errorMessage,
    }));
    return { data: null, error: errorMessage };
  }
}

/**
 * Send a message in the current session
 */
export async function sendMessage(content: string, sessionId: string) {
  chatStore.update((state) => ({
    ...state,
    sendingMessage: true,
    error: null,
  }));

  try {
    // Add user message
    const { data: userMessage, error: userError } = await supabase
      .from("messages")
      .insert([
        {
          session_id: sessionId,
          role: "user",
          content: content.trim(),
          metadata: {},
        },
      ])
      .select()
      .single();

    if (userError) throw userError;

    // Update local state with user message
    chatStore.update((state) => ({
      ...state,
      messages: [...state.messages, userMessage],
    }));

    // Show typing indicator
    chatStore.update((state) => ({ ...state, typingIndicator: true }));

    // Simulate AI response (in a real implementation, this would call your AI service)
    const aiResponse = await simulateAIResponse(content, sessionId);

    // Add AI message
    const { data: aiMessage, error: aiError } = await supabase
      .from("messages")
      .insert([
        {
          session_id: sessionId,
          role: "assistant",
          content: aiResponse,
          metadata: {
            model_used: "simulated",
            response_time_ms: 1500,
          },
        },
      ])
      .select()
      .single();

    if (aiError) throw aiError;

    // Update session's updated_at timestamp
    await supabase
      .from("chat_sessions")
      .update({
        updated_at: new Date().toISOString(),
        message_count: await getMessageCount(sessionId),
      })
      .eq("id", sessionId);

    // Update local state
    chatStore.update((state) => ({
      ...state,
      messages: [...state.messages, aiMessage],
      sendingMessage: false,
      typingIndicator: false,
    }));

    return { data: { userMessage, aiMessage }, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send message";
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
 * Delete a chat session
 */
export async function deleteChatSession(sessionId: string) {
  try {
    // Delete messages first
    await supabase.from("messages").delete().eq("session_id", sessionId);

    // Delete session
    const { error } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", sessionId);

    if (error) throw error;

    // Update local state
    chatStore.update((state) => ({
      ...state,
      sessions: state.sessions.filter((s) => s.id !== sessionId),
      currentSession:
        state.currentSession?.id === sessionId ? null : state.currentSession,
      messages: state.currentSession?.id === sessionId ? [] : state.messages,
    }));

    return { error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete chat session";
    chatStore.update((state) => ({ ...state, error: errorMessage }));
    return { error: errorMessage };
  }
}

/**
 * End a chat session
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
        s.id === sessionId ? { ...s, status: "ended" } : s
      ),
      currentSession:
        state.currentSession?.id === sessionId
          ? { ...state.currentSession, status: "ended" }
          : state.currentSession,
    }));

    return { error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to end chat session";
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

/**
 * Simulate AI response (replace with actual AI integration)
 */
async function simulateAIResponse(
  userMessage: string,
  sessionId: string
): Promise<string> {
  // Add some realistic delay
  await new Promise((resolve) =>
    setTimeout(resolve, 1000 + Math.random() * 2000)
  );

  // Get session info for more context
  const { data: session } = await supabase
    .from("chat_sessions")
    .select(
      `
			*,
			agent:agents(
				*,
				persona:personas(*),
				model:models(*)
			)
		`
    )
    .eq("id", sessionId)
    .single();

  // Simple response generation based on persona style
  const persona = session?.agent?.persona;
  const responses = getResponseTemplates(persona?.response_style || "friendly");

  // Simple keyword-based response selection
  const lowerMessage = userMessage.toLowerCase();

  if (
    lowerMessage.includes("hello") ||
    lowerMessage.includes("hi") ||
    lowerMessage.includes("hey")
  ) {
    return responses.greeting[
      Math.floor(Math.random() * responses.greeting.length)
    ];
  }

  if (lowerMessage.includes("help") || lowerMessage.includes("how")) {
    return responses.help[Math.floor(Math.random() * responses.help.length)];
  }

  if (lowerMessage.includes("thank") || lowerMessage.includes("thanks")) {
    return responses.thanks[
      Math.floor(Math.random() * responses.thanks.length)
    ];
  }

  if (lowerMessage.includes("bye") || lowerMessage.includes("goodbye")) {
    return responses.goodbye[
      Math.floor(Math.random() * responses.goodbye.length)
    ];
  }

  // Default responses
  return responses.default[
    Math.floor(Math.random() * responses.default.length)
  ];
}

function getResponseTemplates(style: string) {
  const templates = {
    friendly: {
      greeting: [
        "Hello! I'm so happy to chat with you today! How can I help you with your learning?",
        "Hi there! Welcome! What would you like to explore together today?",
        "Hey! Great to see you! I'm excited to help you learn something new.",
      ],
      help: [
        "I'd love to help you with that! Can you tell me more about what you're trying to learn?",
        "Great question! Let me break this down for you in a simple way.",
        "I'm here to support your learning journey! What specific area would you like to focus on?",
      ],
      thanks: [
        "You're so welcome! I'm thrilled I could help. What else would you like to explore?",
        "My pleasure! Learning together is the best part of my day. Anything else on your mind?",
        "Happy to help! You're doing great with your learning. Keep up the awesome work!",
      ],
      goodbye: [
        "Goodbye for now! Remember, I'm always here when you want to learn more. Take care!",
        "See you soon! Keep practicing, and don't hesitate to come back with any questions!",
        "Until next time! You're making wonderful progress. Have a fantastic day!",
      ],
      default: [
        "That's a really interesting point! Can you tell me more about what you're thinking?",
        "I appreciate you sharing that with me. How would you like to explore this further?",
        "Thanks for bringing that up! What aspect of this would you like to dive deeper into?",
      ],
    },
    professional: {
      greeting: [
        "Good day. I'm here to assist you with your learning objectives. How may I help you?",
        "Welcome. Please let me know what educational goals you'd like to work on today.",
        "Hello. I'm ready to provide structured guidance for your learning needs.",
      ],
      help: [
        "I can provide detailed assistance with that topic. Please specify your learning objectives.",
        "Let me address your question systematically. What particular aspect requires clarification?",
        "I'll help you understand this concept thoroughly. What's your current level of familiarity?",
      ],
      thanks: [
        "You're welcome. Is there additional material you'd like to cover?",
        "I'm pleased I could assist you. Do you have further questions on this topic?",
        "Certainly. Please let me know if you need clarification on any other points.",
      ],
      goodbye: [
        "Thank you for your time. I recommend reviewing the concepts we discussed.",
        "Goodbye. Please return when you're ready to continue your learning progress.",
        "Until next time. I suggest practicing the skills we covered today.",
      ],
      default: [
        "That's a valid observation. How would you like to analyze this further?",
        "I understand your perspective. Let's examine this concept more systematically.",
        "Please elaborate on that point. I'd like to ensure we address it comprehensively.",
      ],
    },
    casual: {
      greeting: [
        "Hey! What's up? Ready to learn something cool today?",
        "Hi! Nice to see you here. What are we diving into today?",
        "Hello! Hope you're having a good day. What can we explore together?",
      ],
      help: [
        "Oh, that's a good one! Let me walk you through it step by step.",
        "No worries, I got you covered! Here's how I'd approach this...",
        "Totally understand the confusion. Let's figure this out together!",
      ],
      thanks: [
        "No problem at all! That's what I'm here for. Anything else?",
        "You got it! Happy to help anytime. What's next?",
        "Sure thing! Glad I could clear that up for you.",
      ],
      goodbye: [
        "Catch you later! Feel free to drop by whenever you want to chat and learn.",
        "See ya! Don't be a stranger - I'm always here when you need me.",
        "Later! Keep practicing, and hit me up if you get stuck on anything.",
      ],
      default: [
        "Interesting! Tell me more about what you're thinking.",
        "That's cool! How do you want to dig into this?",
        "Nice point! What's your take on this?",
      ],
    },
  };

  return templates[style as keyof typeof templates] || templates.friendly;
}
