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
 * Load available agents for chat (mock implementation)
 */
export async function loadAvailableAgents() {
  try {
    // Load agents from localStorage (mock data)
    let availableAgents = [];

    if (typeof localStorage !== "undefined") {
      const storedAgents = localStorage.getItem("bigstep_agents");
      console.log("🔍 Raw stored agents:", storedAgents);

      if (storedAgents) {
        const allAgents = JSON.parse(storedAgents);
        console.log("🔍 All agents:", allAgents);

        // Filter for active agents only - check both is_active and status fields
        availableAgents = allAgents.filter((agent: any) => {
          const isActive =
            agent.is_active === true || agent.status === "active";
          console.log(
            `🔍 Agent ${agent.name}: is_active=${agent.is_active}, status=${agent.status}, filtered=${isActive}`
          );
          return isActive;
        });
      }
    }

    chatStore.update((state) => ({
      ...state,
      agents: availableAgents,
    }));

    console.log("📝 Loaded available agents for chat:", availableAgents);
    return { data: availableAgents, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load agents";
    console.error("❌ Error loading agents for chat:", errorMessage);
    return { data: null, error: errorMessage };
  }
}

/**
 * Create a new chat session
 */
export async function createChatSession(agentId: string, userId: string) {
  try {
    console.log("🚀 Creating chat session for agent:", agentId);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Get the agent from localStorage
    let selectedAgent = null;
    if (typeof localStorage !== "undefined") {
      const storedAgents = localStorage.getItem("bigstep_agents");
      if (storedAgents) {
        const agents = JSON.parse(storedAgents);
        selectedAgent = agents.find((agent: any) => agent.id === agentId);
      }
    }

    if (!selectedAgent) {
      throw new Error("Agent not found");
    }

    // Create mock chat session
    const newSession = {
      id: `session-${Date.now()}`,
      user_id: userId,
      agent_id: agentId,
      unit_id: null,
      status: "active" as const,
      title: `Chat with ${selectedAgent.name}`,
      started_at: new Date().toISOString(),
      ended_at: null,
      message_count: 0,
      metadata: {},
      agent: {
        id: selectedAgent.id,
        name: selectedAgent.name,
        status: selectedAgent.status,
        persona: {
          name: "Assistant", // Mock persona data
          response_style: "helpful",
        },
        model: {
          name: "GPT-4", // Mock model data
          provider: "openai",
          engine: "gpt-4",
        },
      },
    };

    // Load existing sessions
    let existingSessions = [];
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem("bigstep_chat_sessions");
      if (stored) {
        existingSessions = JSON.parse(stored);
      }
    }

    // Save new session
    const updatedSessions = [newSession, ...existingSessions];
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        "bigstep_chat_sessions",
        JSON.stringify(updatedSessions)
      );
    }

    // Add to sessions list and set as current
    chatStore.update((state) => ({
      ...state,
      sessions: updatedSessions,
      currentSession: newSession,
      messages: [],
    }));

    console.log("✅ Chat session created:", newSession);
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
  console.log("💬 Sending message:", content);

  chatStore.update((state) => ({
    ...state,
    sendingMessage: true,
    error: null,
  }));

  try {
    const timestamp = new Date().toISOString();

    // Create user message
    const userMessage = {
      id: `msg-${Date.now()}-user`,
      session_id: sessionId,
      role: "user" as const,
      content: content.trim(),
      created_at: timestamp,
      metadata: {},
      token_count: null,
    };

    // Update local state with user message immediately
    chatStore.update((state) => ({
      ...state,
      messages: [...state.messages, userMessage],
      typingIndicator: true,
    }));

    // Simulate thinking time
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 2000)
    );

    // Generate AI response
    const aiResponse = await simulateAIResponse(content, sessionId);

    // Create AI message
    const aiMessage = {
      id: `msg-${Date.now()}-ai`,
      session_id: sessionId,
      role: "assistant" as const,
      content: aiResponse,
      created_at: new Date().toISOString(),
      metadata: {
        model_used: "mock-ai",
        response_time_ms: 1500,
      },
      token_count: null,
    };

    // Load existing messages
    let allMessages = [];
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem("bigstep_chat_messages");
      if (stored) {
        allMessages = JSON.parse(stored);
      }
    }

    // Save messages to localStorage
    const updatedMessages = [...allMessages, userMessage, aiMessage];
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        "bigstep_chat_messages",
        JSON.stringify(updatedMessages)
      );
    }

    // Update session's message count and timestamp
    if (typeof localStorage !== "undefined") {
      const sessionsData = localStorage.getItem("bigstep_chat_sessions");
      if (sessionsData) {
        const sessions = JSON.parse(sessionsData);
        const sessionIndex = sessions.findIndex((s: any) => s.id === sessionId);
        if (sessionIndex !== -1) {
          sessions[sessionIndex].updated_at = timestamp;
          sessions[sessionIndex].message_count += 2; // user + AI message
          localStorage.setItem(
            "bigstep_chat_sessions",
            JSON.stringify(sessions)
          );
        }
      }
    }

    // Update local state with AI response
    chatStore.update((state) => ({
      ...state,
      messages: [...state.messages, aiMessage],
      sendingMessage: false,
      typingIndicator: false,
    }));

    console.log("✅ Messages sent and received successfully");
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
  // Get the current session to access agent info
  let currentAgent: any = null;
  let currentSession: any = null;

  if (typeof localStorage !== "undefined") {
    const sessionsData = localStorage.getItem("bigstep_chat_sessions");
    if (sessionsData) {
      const sessions = JSON.parse(sessionsData);
      currentSession = sessions.find((s: any) => s.id === sessionId);

      if (currentSession) {
        const agentsData = localStorage.getItem("bigstep_agents");
        if (agentsData) {
          const agents = JSON.parse(agentsData);
          currentAgent = agents.find(
            (a: any) => a.id === currentSession.agent_id
          );
        }
      }
    }
  }

  // Simulate processing time
  await new Promise((resolve) =>
    setTimeout(resolve, 1000 + Math.random() * 2000)
  );

  // Generate response based on agent and user message
  if (currentAgent && currentSession) {
    const agentName = currentAgent.name || "AI Assistant";
    const agentDescription = currentAgent.description || "";
    const userText = userMessage.toLowerCase();

    // Get persona system prompt if available
    let personaSystemPrompt = "";
    if (currentAgent.persona_id && typeof localStorage !== "undefined") {
      const personasData = localStorage.getItem("bigstep_personas");
      if (personasData) {
        const allPersonas = JSON.parse(personasData);
        const agentPersona = allPersonas.find(
          (p: any) => p.id === currentAgent.persona_id
        );
        if (agentPersona && agentPersona.system_prompt) {
          personaSystemPrompt = agentPersona.system_prompt;
          console.log(
            "🎭 Using persona system prompt for",
            agentName,
            ":",
            agentPersona.name
          );
        }
      }
    }

    // Use both persona system prompt and agent description as behavioral guide
    const hasPersonaInstructions =
      personaSystemPrompt && personaSystemPrompt.trim() !== "";
    const hasAgentInstructions =
      agentDescription &&
      agentDescription.trim() !== "" &&
      agentDescription.toLowerCase() !== agentName.toLowerCase();

    // Context-aware responses based on user input
    if (
      userText.includes("hello") ||
      userText.includes("hi") ||
      userText.includes("hey")
    ) {
      return `Hello! I'm ${agentName}, your AI assistant. How can I help you today?`;
    } else if (userText.includes("help") || userText.includes("assist")) {
      return `I'm here to help! As ${agentName}, I can assist you with various tasks. What specifically would you like help with?`;
    } else if (userText.includes("what") && userText.includes("name")) {
      return `My name is ${agentName}. I'm an AI assistant designed to help you with your learning and questions.`;
    } else if (userText.includes("thank")) {
      return `You're very welcome! I'm glad I could help. Is there anything else you'd like to know?`;
    } else if (userText.includes("learn") || userText.includes("study")) {
      return `I'd be happy to help you learn! As ${agentName}, I can explain concepts, answer questions, and guide you through topics. What would you like to explore?`;
    } else if (userText.includes("explain") || userText.includes("how")) {
      return `Great question! Let me break that down for you. As ${agentName}, I'll do my best to provide a clear explanation. ${
        userMessage.endsWith("?")
          ? "What specifically would you like me to explain?"
          : "Could you be more specific about what you'd like me to explain?"
      }`;
    } else {
      // Enhanced responses using agent description as system prompt
      const hasDatasets =
        currentAgent.dataset_ids && currentAgent.dataset_ids.length > 0;

      // Get dataset context if available
      let datasetContext = "";
      if (hasDatasets && typeof localStorage !== "undefined") {
        const datasetsData = localStorage.getItem("bigstep_datasets");
        if (datasetsData) {
          const allDatasets = JSON.parse(datasetsData);
          const agentDatasets = allDatasets.filter((d: any) =>
            currentAgent.dataset_ids.includes(d.id)
          );
          if (agentDatasets.length > 0) {
            const datasetNames = agentDatasets
              .map((d: any) => d.name)
              .join(", ");
            datasetContext = ` I have access to specialized knowledge from: ${datasetNames}.`;
          }
        }
      }

      // Use persona system prompt as primary behavioral guide, enhanced by agent description
      if (hasPersonaInstructions || hasAgentInstructions) {
        // Combine persona system prompt with agent-specific instructions
        let combinedInstructions = "";
        if (hasPersonaInstructions && hasAgentInstructions) {
          combinedInstructions = `${personaSystemPrompt}\n\nAdditionally, as ${agentName}: ${agentDescription}`;
        } else if (hasPersonaInstructions) {
          combinedInstructions = personaSystemPrompt;
        } else {
          combinedInstructions = agentDescription;
        }

        // Generate response following the combined behavioral instructions
        const behavioralResponses = [
          `${
            hasPersonaInstructions
              ? `Following my core role: ${
                  personaSystemPrompt.split(".")[0]
                }...`
              : agentDescription
          }${datasetContext}

Regarding "${userMessage}": ${
            userMessage.includes("?")
              ? "Let me provide you with a detailed response based on my training."
              : "I'd like to address this thoughtfully."
          }`,

          `As ${agentName}, I'm guided by my purpose: ${
            hasPersonaInstructions
              ? personaSystemPrompt
                  .split("\n")[0]
                  .replace(/^You are (a |an )?/i, "")
                  .trim()
              : agentDescription
                  .toLowerCase()
                  .replace(/^i am|^i'm/, "")
                  .trim()
          }.${datasetContext}

Your inquiry "${userMessage}" aligns with what I'm designed to help with. ${
            userMessage.includes("how") || userMessage.includes("what")
              ? "Let me walk you through this systematically."
              : "Here's my approach to this topic."
          }`,

          `Based on my behavioral framework${
            hasPersonaInstructions ? " from my persona training" : ""
          }:${datasetContext}

I find your message "${userMessage}" particularly relevant. ${
            userMessage.length > 50
              ? "You've shared a detailed question - let me provide a comprehensive response."
              : "Let me give you a thorough answer."
          }`,
        ];

        return behavioralResponses[
          Math.floor(Math.random() * behavioralResponses.length)
        ];
      } else {
        // Fallback to generic educational responses
        const agentPersona = currentAgent.persona_id
          ? `trained with specialized knowledge`
          : `your learning assistant`;

        const responses = [
          `That's a fascinating question! As ${agentName}, ${agentPersona}, I can provide detailed insights on this topic.${datasetContext} Let me break this down for you: ${
            userMessage.includes("?")
              ? "What specific aspect would you like me to focus on?"
              : "Could you be more specific about what you'd like to know more about?"
          }`,

          `Excellent point! I'm ${agentName}, and I've been designed to help with complex learning challenges.${datasetContext} Based on what you're asking, I can see several important angles to consider. Would you like me to dive deeper into the theoretical foundation or focus on practical applications?`,

          `I appreciate you bringing this up! As ${agentName}, I specialize in comprehensive educational support.${datasetContext} This topic connects to several key concepts that I think you'll find valuable. Let me walk you through my understanding and see how I can best help you grasp this.`,
        ];

        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
  }

  // Fallback response if no agent info available
  return "I'm here to help! Could you tell me more about what you'd like to know?";
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
