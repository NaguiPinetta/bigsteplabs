<script lang="ts">
  import {
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  } from "$env/static/public";

  let envStatus = {
    supabaseUrl: PUBLIC_SUPABASE_URL || "NOT SET",
    supabaseKey: PUBLIC_SUPABASE_PUBLISHABLE_KEY ? "SET (hidden)" : "NOT SET",
    hasBoth: !!(PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  };
</script>

<svelte:head>
  <title>Environment Test - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6">
  <h1 class="text-3xl font-bold mb-6">Environment Variables Test</h1>

  <div class="space-y-4">
    <div class="bg-card rounded-lg border p-4">
      <h2 class="text-xl font-semibold mb-2">Environment Variables Status</h2>

      <div class="space-y-2">
        <div class="flex items-center space-x-2">
          <span class="font-medium">PUBLIC_SUPABASE_URL:</span>
          <span
            class="text-sm {envStatus.supabaseUrl === 'NOT SET'
              ? 'text-red-600'
              : 'text-green-600'}"
          >
            {envStatus.supabaseUrl}
          </span>
        </div>

        <div class="flex items-center space-x-2">
          <span class="font-medium">PUBLIC_SUPABASE_PUBLISHABLE_KEY:</span>
          <span
            class="text-sm {envStatus.supabaseKey === 'NOT SET'
              ? 'text-red-600'
              : 'text-green-600'}"
          >
            {envStatus.supabaseKey}
          </span>
        </div>

        <div class="flex items-center space-x-2 mt-4">
          <span class="font-medium">Status:</span>
          <span
            class="text-sm {envStatus.hasBoth
              ? 'text-green-600'
              : 'text-red-600'} font-bold"
          >
            {envStatus.hasBoth
              ? "✅ READY FOR DEPLOYMENT"
              : "❌ MISSING VARIABLES"}
          </span>
        </div>
      </div>
    </div>

    {#if envStatus.hasBoth}
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 class="text-green-800 font-semibold">
          ✅ Environment Variables Configured
        </h3>
        <p class="text-green-700 text-sm mt-1">
          Your environment variables are properly set. The build should work
          now.
        </p>
      </div>
    {:else}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 class="text-red-800 font-semibold">
          ❌ Environment Variables Missing
        </h3>
        <p class="text-red-700 text-sm mt-1">
          You need to add the missing environment variables in Vercel:
        </p>
        <ul class="text-red-700 text-sm mt-2 list-disc list-inside">
          <li>
            Go to Vercel Dashboard → Your Project → Settings → Environment
            Variables
          </li>
          <li>Add PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_PUBLISHABLE_KEY</li>
          <li>Redeploy your project</li>
        </ul>
      </div>
    {/if}
  </div>
</div>
