import { json } from "@sveltejs/kit";
import { supabase } from "$lib/supabase";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { apiKey, provider } = await request.json();

    if (!apiKey || !provider) {
      return json(
        { error: "API key and provider are required" },
        { status: 400 }
      );
    }

    // For now, we'll store the API key directly in the models table
    // In a production system, you'd want to encrypt this or use a separate secure storage


    // Test the API key based on provider
    if (provider === "openai") {
      try {
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `OpenAI API error: ${response.status} ${response.statusText}`
          );
        }

        const models = await response.json();


        return json({
          success: true,
          message: "OpenAI API key validated successfully",
          availableModels: models.data || [],
        });
      } catch (error) {
        console.error("❌ OpenAI API key validation failed:", error);
        return json(
          {
            error: "Invalid OpenAI API key or network error",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 400 }
        );
      }
    } else if (provider === "anthropic") {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 1,
            messages: [{ role: "user", content: "test" }],
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Anthropic API error: ${response.status} ${response.statusText}`
          );
        }


        return json({
          success: true,
          message: "Anthropic API key validated successfully",
          availableModels: [],
        });
      } catch (error) {
        console.error("❌ Anthropic API key validation failed:", error);
        return json(
          {
            error: "Invalid Anthropic API key or network error",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 400 }
        );
      }
    } else if (provider === "google") {
      // Google AI validation is more complex, so we'll just accept the key for now

      return json({
        success: true,
        message: "Google AI API key accepted",
        availableModels: [],
      });
    } else if (provider === "azure") {
      // Azure OpenAI validation is similar to OpenAI but with different endpoint

      return json({
        success: true,
        message: "Azure OpenAI API key accepted",
        availableModels: [],
      });
    } else if (provider === "mistral") {
      try {
        const response = await fetch("https://api.mistral.ai/v1/models", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Mistral API error: ${response.status} ${response.statusText}`
          );
        }

        const models = await response.json();
        console.log(
          "✅ Mistral API key validated, found models:",
          models.data?.length || 0
        );

        return json({
          success: true,
          message: "Mistral API key validated successfully",
          availableModels: models.data || [],
        });
      } catch (error) {
        console.error("❌ Mistral API key validation failed:", error);
        return json(
          {
            error: "Invalid Mistral API key or network error",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 400 }
        );
      }
    } else if (provider === "cohere") {
      try {
        const response = await fetch("https://api.cohere.ai/v1/models", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Cohere API error: ${response.status} ${response.statusText}`
          );
        }

        const models = await response.json();
        console.log(
          "✅ Cohere API key validated, found models:",
          models.models?.length || 0
        );

        return json({
          success: true,
          message: "Cohere API key validated successfully",
          availableModels: models.models || [],
        });
      } catch (error) {
        console.error("❌ Cohere API key validation failed:", error);
        return json(
          {
            error: "Invalid Cohere API key or network error",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 400 }
        );
      }
    }

    return json(
      { error: `Unsupported provider: ${provider}` },
      { status: 400 }
    );
  } catch (error) {
    console.error("❌ Error in sync models:", error);
    return json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
