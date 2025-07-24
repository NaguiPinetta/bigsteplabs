import { callOpenAI } from "$lib/services/openai";

/**
 * Test OpenAI API connectivity
 */
export async function testOpenAIConnection(): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    const response = await callOpenAI(
      [
        {
          role: "system",
          content: "You are a helpful assistant. Respond with 'Hello from OpenAI!' if you receive this test message.",
        },
        {
          role: "user",
          content: "This is a test message. Please respond with 'Hello from OpenAI!'",
        },
      ],
      "gpt-3.5-turbo",
      0.1,
      50
    );

    if (response.content.includes("Hello from OpenAI")) {
      return {
        success: true,
        message: "OpenAI API connection successful!",
      };
    } else {
      return {
        success: false,
        message: "OpenAI API responded but with unexpected content",
        error: `Expected 'Hello from OpenAI!' but got: ${response.content}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "OpenAI API connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if OpenAI is properly configured
 */
export function isOpenAIConfigured(): boolean {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  return !!apiKey && apiKey !== "your-openai-api-key";
}
