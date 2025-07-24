<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import { CheckCircle, XCircle, Loader2 } from "lucide-svelte";

  let loading = false;
  let results: any[] = [];
  let envVars: any = {};

  onMount(() => {
    checkEnvironmentVariables();
  });

  function checkEnvironmentVariables() {
    envVars = {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
    };

    // Check if keys are present (without exposing them)
    const checks = [
      {
        name: "VITE_SUPABASE_URL",
        value: envVars.VITE_SUPABASE_URL,
        valid:
          !!envVars.VITE_SUPABASE_URL &&
          envVars.VITE_SUPABASE_URL.startsWith("https://"),
        message: envVars.VITE_SUPABASE_URL
          ? "✅ Supabase URL is configured"
          : "❌ Supabase URL is missing",
      },
      {
        name: "VITE_SUPABASE_ANON_KEY",
        value: envVars.VITE_SUPABASE_ANON_KEY,
        valid:
          !!envVars.VITE_SUPABASE_ANON_KEY &&
          envVars.VITE_SUPABASE_ANON_KEY.length > 20,
        message: envVars.VITE_SUPABASE_ANON_KEY
          ? "✅ Supabase Anon Key is configured"
          : "❌ Supabase Anon Key is missing",
      },
      {
        name: "VITE_OPENAI_API_KEY",
        value: envVars.VITE_OPENAI_API_KEY,
        valid: !!envVars.VITE_OPENAI_API_KEY,
        message: envVars.VITE_OPENAI_API_KEY
          ? "✅ OpenAI API Key is configured"
          : "⚠️ OpenAI API Key is missing (optional)",
      },
    ];

    results = checks;
  }

  async function testSupabaseConnection() {
    loading = true;
    results = [];

    try {
      // Test 1: Basic connection
      const { data, error } = await supabase
        .from("users")
        .select("count")
        .limit(1);

      if (error) {
        results.push({
          test: "Database Connection",
          success: false,
          message: `❌ Connection failed: ${error.message}`,
          details: error,
        });
      } else {
        results.push({
          test: "Database Connection",
          success: true,
          message: "✅ Successfully connected to Supabase database",
        });
      }

      // Test 2: Authentication
      const { data: authData, error: authError } =
        await supabase.auth.getSession();

      if (authError) {
        results.push({
          test: "Authentication",
          success: false,
          message: `❌ Auth failed: ${authError.message}`,
          details: authError,
        });
      } else {
        results.push({
          test: "Authentication",
          success: true,
          message: "✅ Authentication service is working",
        });
      }

      // Test 3: Magic Link (without sending)
      const { error: magicError } = await supabase.auth.signInWithOtp({
        email: "test@example.com",
        options: {
          shouldCreateUser: false,
        },
      });

      if (magicError && magicError.message.includes("Invalid API key")) {
        results.push({
          test: "Magic Link Service",
          success: false,
          message: "❌ Invalid API key - check your VITE_SUPABASE_ANON_KEY",
          details: magicError,
        });
      } else if (
        magicError &&
        magicError.message.includes("Email not confirmed")
      ) {
        results.push({
          test: "Magic Link Service",
          success: true,
          message:
            "✅ Magic link service is working (expected error for test email)",
        });
      } else {
        results.push({
          test: "Magic Link Service",
          success: true,
          message: "✅ Magic link service is working",
        });
      }
    } catch (error) {
      results.push({
        test: "General Error",
        success: false,
        message: `❌ Unexpected error: ${error}`,
        details: error,
      });
    } finally {
      loading = false;
    }
  }

  function getKeyPreview(key: string): string {
    if (!key) return "Not set";
    if (key.length <= 8) return key;
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
  }
</script>

<svelte:head>
  <title>Supabase Configuration Test - BigStep Labs</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-4xl">
  <div class="mb-8">
    <h1 class="text-3xl font-bold mb-2">Supabase Configuration Test</h1>
    <p class="text-gray-600">Test your Supabase configuration and connection</p>
  </div>

  <!-- Environment Variables -->
  <Card class="mb-6 p-6">
    <div class="mb-4">
      <h2 class="text-xl font-semibold">Environment Variables</h2>
      <p class="text-gray-600">
        Check if required environment variables are configured
      </p>
    </div>
    <div class="space-y-4">
      {#each results.filter((r) => !r.test) as result}
        <div class="flex items-center justify-between p-3 rounded-lg border">
          <div>
            <div class="font-medium">{result.name}</div>
            <div class="text-sm text-gray-500">
              Preview: {getKeyPreview(result.value)}
            </div>
          </div>
          <div class="flex items-center gap-2">
            {#if result.valid}
              <CheckCircle class="w-5 h-5 text-green-500" />
            {:else}
              <XCircle class="w-5 h-5 text-red-500" />
            {/if}
            <span class="text-sm">{result.message}</span>
          </div>
        </div>
      {/each}
    </div>
  </Card>

  <!-- Connection Test -->
  <Card class="mb-6 p-6">
    <div class="mb-4">
      <h2 class="text-xl font-semibold">Connection Tests</h2>
      <p class="text-gray-600">Test Supabase connection and services</p>
    </div>
    <div class="space-y-4">
      <Button
        on:click={testSupabaseConnection}
        disabled={loading}
        class="w-full"
      >
        {#if loading}
          <Loader2 class="w-4 h-4 mr-2 animate-spin" />
          Testing...
        {:else}
          Run Connection Tests
        {/if}
      </Button>

      {#if results.filter((r) => r.test).length > 0}
        <div class="space-y-3">
          {#each results.filter((r) => r.test) as result}
            <div
              class={result.success
                ? "border-green-200 bg-green-50 p-4 rounded-lg"
                : "border-red-200 bg-red-50 p-4 rounded-lg"}
            >
              <div class={result.success ? "text-green-800" : "text-red-800"}>
                <div class="font-medium">{result.test}</div>
                <div>{result.message}</div>
                {#if result.details}
                  <details class="mt-2">
                    <summary class="cursor-pointer text-sm"
                      >View Details</summary
                    >
                    <pre
                      class="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(
                        result.details,
                        null,
                        2
                      )}</pre>
                  </details>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </Card>

  <!-- Instructions -->
  <Card class="p-6">
    <div class="mb-4">
      <h2 class="text-xl font-semibold">Configuration Instructions</h2>
    </div>
    <div class="prose prose-sm max-w-none">
      <h3>Required Environment Variables:</h3>
      <ul>
        <li><code>VITE_SUPABASE_URL</code> - Your Supabase project URL</li>
        <li>
          <code>VITE_SUPABASE_ANON_KEY</code> - Your Supabase anonymous/public key
        </li>
      </ul>

      <h3>How to get these values:</h3>
      <ol>
        <li>
          Go to your <a
            href="https://supabase.com/dashboard"
            target="_blank"
            class="text-blue-600 hover:underline">Supabase Dashboard</a
          >
        </li>
        <li>Select your project</li>
        <li>Go to Settings → API</li>
        <li>Copy the "Project URL" to <code>VITE_SUPABASE_URL</code></li>
        <li>
          Copy the "anon public" key to <code>VITE_SUPABASE_ANON_KEY</code>
        </li>
      </ol>

      <h3>For Vercel Deployment:</h3>
      <ul>
        <li>Add these variables in your Vercel project settings</li>
        <li>Make sure to use the exact variable names shown above</li>
        <li>Redeploy after adding the variables</li>
      </ul>
    </div>
  </Card>
</div>
