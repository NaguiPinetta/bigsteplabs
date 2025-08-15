<script lang="ts">
  import { PUBLIC_APP_BASE_URL, PUBLIC_SUPABASE_URL } from "$env/static/public";
</script>

<svelte:head>
  <title>Environment Test - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6">
  <h1 class="text-2xl font-bold mb-4">Environment Variables Test</h1>

  <div class="space-y-4">
    <div class="p-4 border rounded">
      <h2 class="font-semibold">PUBLIC_APP_BASE_URL:</h2>
      <p class="font-mono bg-gray-100 p-2 rounded">
        {PUBLIC_APP_BASE_URL || "NOT SET"}
      </p>
    </div>

    <div class="p-4 border rounded">
      <h2 class="font-semibold">PUBLIC_SUPABASE_URL:</h2>
      <p class="font-mono bg-gray-100 p-2 rounded">
        {PUBLIC_SUPABASE_URL || "NOT SET"}
      </p>
    </div>

    <div class="p-4 border rounded">
      <h2 class="font-semibold">Magic Link URL:</h2>
      <p class="font-mono bg-gray-100 p-2 rounded">
        {PUBLIC_APP_BASE_URL}/app/auth/callback
      </p>
    </div>
  </div>
</div>
