import { supabase } from "$lib/supabase";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  dataset_ids?: string[];
  persona?: {
    name: string;
    system_prompt: string;
  };
  model?: {
    name: string;
    provider: string;
    engine: string;
  };
}

/**
 * Call OpenAI's chat completion API
 */
export async function callOpenAI(
  messages: ChatMessage[],
  model: string = "gpt-3.5-turbo",
  temperature: number = 0.7,
  maxTokens: number = 1000
): Promise<OpenAIResponse> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your environment variables."
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText} - ${
          errorData.error?.message || "Unknown error"
        }`
      );
    }

    const data = await response.json();

    return {
      content:
        data.choices[0]?.message?.content ||
        "I'm sorry, I couldn't generate a response.",
      usage: data.usage,
    };
  } catch (error) {
    console.error("❌ OpenAI API call failed:", error);
    throw error;
  }
}

/**
 * Build conversation context for an agent
 */
export async function buildAgentContext(
  agentId: string,
  sessionId: string,
  recentMessages: ChatMessage[] = []
): Promise<{
  systemPrompt: string;
  conversationHistory: ChatMessage[];
}> {
  try {
    // Get agent configuration
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select(
        `
        id, name, description, dataset_ids,
        persona:personas(name, system_prompt),
        model:models(name, provider, engine, temperature, max_tokens)
      `
      )
      .eq("id", agentId)
      .single();

    if (agentError || !agent) {
      throw new Error("Agent not found");
    }

    // Build system prompt
    let systemPrompt = "";

    // Add persona instructions
    if (agent.persona?.system_prompt) {
      systemPrompt += `${agent.persona.system_prompt}\n\n`;
    }

    // Add agent description
    if (agent.description) {
      systemPrompt += `Agent Description: ${agent.description}\n\n`;
    }

    // Add dataset context if available
    if (agent.dataset_ids && agent.dataset_ids.length > 0) {
      const { data: datasets } = await supabase
        .from("datasets")
        .select("id, name, description, metadata")
        .in("id", agent.dataset_ids);

      if (datasets && datasets.length > 0) {
        systemPrompt += "Available Knowledge Bases:\n";
        datasets.forEach((dataset) => {
          systemPrompt += `- ${dataset.name}: ${
            dataset.description || "No description"
          }\n`;

          // Include dataset content if available
          if (dataset.metadata?.text_content) {
            systemPrompt += `  Content: ${dataset.metadata.text_content.substring(
              0,
              500
            )}...\n`;
          }
        });
        systemPrompt += "\n";
      }
    }

    // Add behavioral instructions
    systemPrompt += `You are ${agent.name}, an AI assistant designed to help with learning and education. 
    Always respond in a helpful, educational manner. 
    If you're working with structured curriculum content, follow the provided instructions carefully.
    Keep responses concise but informative.`;

    // Get conversation history (last 10 messages to maintain context)
    let conversationHistory: ChatMessage[] = [];

    if (recentMessages.length === 0) {
      const { data: messages } = await supabase
        .from("messages")
        .select("role, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .limit(10);

      if (messages) {
        conversationHistory = messages.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));
      }
    } else {
      conversationHistory = recentMessages.slice(-10); // Keep last 10 messages
    }

    return {
      systemPrompt,
      conversationHistory,
    };
  } catch (error) {
    console.error("❌ Error building agent context:", error);
    throw error;
  }
}

/**
 * Generate AI response using OpenAI API
 */
export async function generateAIResponse(
  userMessage: string,
  agentId: string,
  sessionId: string,
  recentMessages: ChatMessage[] = []
): Promise<OpenAIResponse> {
  try {
    // Build context
    const { systemPrompt, conversationHistory } = await buildAgentContext(
      agentId,
      sessionId,
      recentMessages
    );

    // Get agent model configuration
    const { data: agent } = await supabase
      .from("agents")
      .select(
        `
        model:models(name, provider, engine, temperature, max_tokens)
      `
      )
      .eq("id", agentId)
      .single();

    // Prepare messages for OpenAI
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...conversationHistory,
      {
        role: "user",
        content: userMessage,
      },
    ];

    // Use agent's model configuration or defaults
    const model = agent?.model?.engine || "gpt-3.5-turbo";
    const temperature = agent?.model?.temperature || 0.7;
    const maxTokens = agent?.model?.max_tokens || 1000;

    console.log("🤖 Calling OpenAI API with:", {
      model,
      temperature,
      maxTokens,
      messageCount: messages.length,
      agentModel: agent?.model,
    });

    // Call OpenAI
    const response = await callOpenAI(messages, model, temperature, maxTokens);

    console.log("✅ OpenAI response received:", {
      contentLength: response.content.length,
      usage: response.usage,
    });

    return response;
  } catch (error) {
    console.error("❌ Error generating AI response:", error);
    throw error;
  }
}
