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
      console.log("🔍 Agent has datasets:", agent.dataset_ids);

      const { data: datasets } = await supabase
        .from("datasets")
        .select("id, name, description, metadata")
        .in("id", agent.dataset_ids);

      if (datasets && datasets.length > 0) {
        console.log(
          "🔍 Found datasets:",
          datasets.map((d) => d.name)
        );
        systemPrompt +=
          "You have access to structured learning exercises. Use this information to guide the conversation and provide accurate feedback:\n\n";

        // Fetch chunks for each dataset
        for (const dataset of datasets) {
          systemPrompt += `Learning Dataset: ${dataset.name}\n`;
          if (dataset.description) {
            systemPrompt += `Description: ${dataset.description}\n`;
          }

          // Fetch dataset chunks with metadata
          const { data: chunks } = await supabase
            .from("dataset_chunks")
            .select("content, index, metadata")
            .eq("dataset_id", dataset.id)
            .order("index", { ascending: true });

          if (chunks && chunks.length > 0) {
            console.log(
              `🔍 Found ${chunks.length} structured chunks for dataset: ${dataset.name}`
            );

            // Separate metadata and exercises
            const metadataChunks = chunks.filter(
              (chunk) => chunk.metadata?.chunk_type === "metadata"
            );
            const exerciseChunks = chunks.filter(
              (chunk) => chunk.metadata?.chunk_type === "exercise"
            );

            console.log(
              `🔍 Metadata chunks: ${metadataChunks.length}, Exercise chunks: ${exerciseChunks.length}`
            );

            // Add metadata/instructions
            if (metadataChunks.length > 0) {
              systemPrompt += `Instructions:\n${metadataChunks
                .map((chunk) => chunk.content)
                .join("\n")}\n\n`;
            }

            // Add exercises in structured format
            if (exerciseChunks.length > 0) {
              systemPrompt += `STRUCTURED EXERCISES - FOLLOW THESE EXACTLY:\n\n`;

              // Sort exercises by exercise number
              exerciseChunks.sort(
                (a, b) =>
                  (a.metadata?.exercise_number || 0) -
                  (b.metadata?.exercise_number || 0)
              );

              exerciseChunks.forEach((chunk) => {
                const exerciseNum = chunk.metadata?.exercise_number;
                const prompt = chunk.metadata?.prompt;
                const expected = chunk.metadata?.expected_response;
                const variations = chunk.metadata?.variations || [];

                if (exerciseNum && prompt && expected) {
                  systemPrompt += `EXERCISE ${exerciseNum}:\n`;
                  systemPrompt += `Prompt: "${prompt}"\n`;
                  systemPrompt += `Expected Response: "${expected}"\n`;

                  if (variations.length > 0) {
                    systemPrompt += `Variations:\n`;
                    variations.forEach((variation: string) => {
                      systemPrompt += `- ${variation}\n`;
                    });
                  }
                  systemPrompt += `\n`;
                }
              });

              systemPrompt += `EXERCISE INSTRUCTIONS:\n`;
              systemPrompt += `1. Start with Exercise 1 and progress sequentially\n`;
              systemPrompt += `2. Present the Portuguese prompt to the user\n`;
              systemPrompt += `3. Wait for their German translation\n`;
              systemPrompt += `4. Evaluate against the expected response\n`;
              systemPrompt += `5. Provide feedback and move to next exercise only after correct answer\n`;
              systemPrompt += `6. Use variations to provide additional practice if needed\n`;
              systemPrompt += `7. Do NOT create your own exercises - use only the ones above\n\n`;
            } else {
              console.warn(
                `⚠️ No exercise chunks found for dataset: ${dataset.name}`
              );
              systemPrompt += `Status: No structured exercises available.\n\n`;
            }
          } else {
            console.log(`⚠️ No chunks found for dataset: ${dataset.name}`);
            systemPrompt += `Status: No content available yet.\n\n`;
          }
        }

        // Add conversation tracking instructions
        systemPrompt += `CONVERSATION TRACKING INSTRUCTIONS:
1. You are a German language tutor using structured exercises from the dataset above
2. Track which exercise number the user is currently working on (start with Exercise 1)
3. ONLY present exercises from the dataset - do not create your own
4. Present the Portuguese prompt exactly as written in the dataset
5. Wait for the user's German translation
6. Compare their response to the expected response from the dataset
7. If correct: acknowledge and move to the next exercise
8. If incorrect: provide specific feedback and repeat the same exercise
9. Use variations from the dataset for additional practice if needed
10. Do NOT ask for random translations or create new exercises
11. Stay within the structured format of the dataset

Current Exercise State: [Track which exercise number the user is on, starting with 1]\n\n`;
      }
    } else {
      console.log("🔍 Agent has no datasets assigned");
    }

    // Add behavioral instructions
    systemPrompt += `CRITICAL INSTRUCTIONS:
You are ${agent.name}, a German language tutor. You MUST follow these rules:

1. ONLY use the structured exercises provided in the dataset above
2. Start with Exercise 1 and progress sequentially
3. Present the Portuguese prompt exactly as written
4. Wait for the user's German translation
5. Compare to the expected response from the dataset
6. Do NOT create your own exercises or ask for random translations
7. Do NOT deviate from the dataset format

If no structured exercises are found in the dataset, inform the user that no exercises are available.

Current Exercise State: [Track which exercise number the user is on, starting with 1]`;

    console.log("🔍 Final system prompt length:", systemPrompt.length);
    console.log(
      "🔍 System prompt preview (first 500 chars):",
      systemPrompt.substring(0, 500)
    );
    if (systemPrompt.length > 500) {
      console.log(
        "🔍 System prompt preview (last 500 chars):",
        systemPrompt.substring(systemPrompt.length - 500)
      );
    }

    // Get conversation history (last 10 messages to maintain context)
    let conversationHistory: ChatMessage[] = [];

    if (recentMessages.length === 0) {
      const { data: messages } = await supabase
        .from("messages")
        .select("role, content, metadata")
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

    // Determine current exercise state from conversation history
    let currentExerciseNumber = 1; // Default to exercise 1

    // Look for exercise progression in the conversation
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      const message = conversationHistory[i];
      if (message.role === "assistant") {
        // Check if the assistant mentioned an exercise number
        const exerciseMatch = message.content.match(/Exercise (\d+)/i);
        if (exerciseMatch) {
          currentExerciseNumber = parseInt(exerciseMatch[1]);
          break;
        }
      }
    }

    console.log(
      `🔍 Current exercise number determined: ${currentExerciseNumber}`
    );
    console.log(
      `🔍 Conversation history length: ${conversationHistory.length}`
    );

    // Update the system prompt with current exercise state
    systemPrompt = systemPrompt.replace(
      /Current Exercise State: \[.*?\]/,
      `Current Exercise State: [Currently on Exercise ${currentExerciseNumber}]`
    );

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
