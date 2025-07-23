<script lang="ts">
  import {
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  } from "$lib/supabase";

  let envInfo = {
    supabaseUrl: PUBLIC_SUPABASE_URL,
    supabaseKey: PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    keyLength: PUBLIC_SUPABASE_PUBLISHABLE_KEY?.length || 0,
    keyStartsWithEyJ:
      PUBLIC_SUPABASE_PUBLISHABLE_KEY?.startsWith("eyJ") || false,
    hasValidFormat: false,
    issues: [] as string[],
  };

  // Analyze the key format
  if (envInfo.supabaseKey) {
    envInfo.hasValidFormat =
      envInfo.keyStartsWithEyJ && envInfo.keyLength > 100;

    if (!envInfo.keyStartsWithEyJ) {
      envInfo.issues.push(
        "❌ Key doesn't start with 'eyJ' (should be JWT format)"
      );
    }
    if (envInfo.keyLength < 100) {
      envInfo.issues.push(
        `❌ Key too short (${envInfo.keyLength} chars, should be >100)`
      );
    }
    if (envInfo.keyLength > 200) {
      envInfo.issues.push(
        `❌ Key too long (${envInfo.keyLength} chars, should be ~150-200)`
      );
    }
  } else {
    envInfo.issues.push("❌ No publishable key found");
  }

  if (!envInfo.supabaseUrl) {
    envInfo.issues.push("❌ No Supabase URL found");
  }
</script>

<svelte:head>
  <title>Environment Debug - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6">
  <h1 class="text-3xl font-bold mb-6">Environment Variables Debug</h1>

  <div class="space-y-6">
    <!-- Supabase URL -->
    <div class="bg-card rounded-lg border p-4">
      <h2 class="text-xl font-semibold mb-2">Supabase URL</h2>
      <div class="font-mono text-sm bg-muted p-2 rounded">
        {envInfo.supabaseUrl || "NOT SET"}
      </div>
    </div>

    <!-- Supabase Key Analysis -->
    <div class="bg-card rounded-lg border p-4">
      <h2 class="text-xl font-semibold mb-2">
        Supabase Publishable Key Analysis
      </h2>

      <div class="space-y-2">
        <div class="flex items-center space-x-2">
          <span class="font-medium">Key Length:</span>
          <span class="text-sm">{envInfo.keyLength} characters</span>
        </div>

        <div class="flex items-center space-x-2">
          <span class="font-medium">Starts with 'eyJ':</span>
          <span
            class="text-sm {envInfo.keyStartsWithEyJ
              ? 'text-green-600'
              : 'text-red-600'}"
          >
            {envInfo.keyStartsWithEyJ ? "✅ Yes" : "❌ No"}
          </span>
        </div>

        <div class="flex items-center space-x-2">
          <span class="font-medium">Valid Format:</span>
          <span
            class="text-sm {envInfo.hasValidFormat
              ? 'text-green-600'
              : 'text-red-600'}"
          >
            {envInfo.hasValidFormat ? "✅ Yes" : "❌ No"}
          </span>
        </div>
      </div>

      <!-- Key Preview -->
      <div class="mt-4">
        <div class="font-medium mb-2">Key Preview (first 50 chars):</div>
        <div class="font-mono text-sm bg-muted p-2 rounded">
          {envInfo.supabaseKey
            ? envInfo.supabaseKey.substring(0, 50) + "..."
            : "NOT SET"}
        </div>
      </div>
    </div>

    <!-- Issues -->
    {#if envInfo.issues.length > 0}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 class="text-red-800 font-semibold mb-2">Issues Found:</h3>
        <ul class="text-red-700 text-sm space-y-1">
          {#each envInfo.issues as issue}
            <li>{issue}</li>
          {/each}
        </ul>
      </div>
    {:else}
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 class="text-green-800 font-semibold">
          ✅ Environment Variables Look Good
        </h3>
        <p class="text-green-700 text-sm mt-1">
          Your Supabase configuration appears to be correct.
        </p>
      </div>
    {/if}

    <!-- Instructions -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 class="text-blue-800 font-semibold mb-2">How to Fix:</h3>
      <ol class="text-blue-700 text-sm space-y-1 list-decimal list-inside">
        <li>
          Go to <a
            href="https://supabase.com/dashboard"
            target="_blank"
            class="underline">Supabase Dashboard</a
          >
        </li>
        <li>Select your project: <code>oegldjlecdhxheiwtxxu</code></li>
        <li>Go to <strong>Settings</strong> → <strong>API</strong></li>
        <li>Copy the <strong>anon public</strong> key</li>
        <li>Update your <code>.env</code> file with the correct key</li>
        <li>Restart your development server</li>
      </ol>
    </div>
  </div>
</div>
