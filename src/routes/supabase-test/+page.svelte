<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";

  let testResults = {
    connection: null as any,
    auth: null as any,
    config: null as any,
    loading: false,
  };

  onMount(async () => {
    await runTests();
  });

  async function runTests() {
    testResults.loading = true;
    console.log("🔍 Running Supabase tests...");

    // Test 1: Check configuration
    try {
      testResults.config = {
        url: import.meta.env.VITE_SUPABASE_URL,
        key:
          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.substring(0, 20) +
          "...",
        hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasKey: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      };
      console.log("✅ Config test:", testResults.config);
    } catch (err) {
      console.error("❌ Config test failed:", err);
      testResults.config = { error: err };
    }

    // Test 2: Test basic connection
    try {
      const { data, error } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .limit(1);

      testResults.connection = {
        success: !error,
        error: error?.message,
        data: data?.length || 0,
      };
      console.log("✅ Connection test:", testResults.connection);
    } catch (err) {
      console.error("❌ Connection test failed:", err);
      testResults.connection = { error: err };
    }

    // Test 3: Test auth configuration
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      testResults.auth = {
        hasSession: !!session,
        error: error?.message,
        sessionUser: session?.user?.email || null,
      };
      console.log("✅ Auth test:", testResults.auth);
    } catch (err) {
      console.error("❌ Auth test failed:", err);
      testResults.auth = { error: err };
    }

    testResults.loading = false;
    console.log("🔍 Tests complete");
  }

  async function testMagicLink() {
    const testEmail = "test@example.com";
    console.log("🔍 Testing magic link with:", testEmail);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: testEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("❌ Magic link test failed:", error);
        alert(`Magic link test failed: ${error.message}`);
      } else {
        console.log("✅ Magic link test successful");
        alert("Magic link test successful! Check console for details.");
      }
    } catch (err) {
      console.error("❌ Magic link test error:", err);
      alert(`Magic link test error: ${err}`);
    }
  }
</script>

<svelte:head>
  <title>Supabase Test - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-2xl">
  <h1 class="text-2xl font-bold mb-6">Supabase Connection Test</h1>

  <div class="space-y-6">
    <Card class="p-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">Test Controls</h2>
        <Button on:click={runTests} disabled={testResults.loading}>
          {testResults.loading ? "Running..." : "🔄 Run Tests"}
        </Button>
      </div>

      <Button on:click={testMagicLink} variant="outline" size="sm">
        🧪 Test Magic Link
      </Button>
    </Card>

    <!-- Configuration Test -->
    <Card class="p-4">
      <h3 class="font-semibold mb-2">Configuration</h3>
      {#if testResults.config?.error}
        <div class="bg-red-50 border border-red-200 rounded p-3">
          <p class="text-red-800">
            <strong>Error:</strong>
            {testResults.config.error}
          </p>
        </div>
      {:else if testResults.config}
        <div class="space-y-2">
          <p>
            <strong>URL:</strong>
            {testResults.config.hasUrl ? "✅ Set" : "❌ Missing"}
          </p>
          <p>
            <strong>Key:</strong>
            {testResults.config.hasKey ? "✅ Set" : "❌ Missing"}
          </p>
          <p><strong>Key Preview:</strong> {testResults.config.key}</p>
        </div>
      {:else}
        <p class="text-gray-600">No data yet</p>
      {/if}
    </Card>

    <!-- Connection Test -->
    <Card class="p-4">
      <h3 class="font-semibold mb-2">Database Connection</h3>
      {#if testResults.connection?.error}
        <div class="bg-red-50 border border-red-200 rounded p-3">
          <p class="text-red-800">
            <strong>Error:</strong>
            {testResults.connection.error}
          </p>
        </div>
      {:else if testResults.connection}
        <div class="space-y-2">
          <p>
            <strong>Status:</strong>
            {testResults.connection.success ? "✅ Connected" : "❌ Failed"}
          </p>
          {#if testResults.connection.data !== undefined}
            <p><strong>Tables Found:</strong> {testResults.connection.data}</p>
          {/if}
        </div>
      {:else}
        <p class="text-gray-600">No data yet</p>
      {/if}
    </Card>

    <!-- Auth Test -->
    <Card class="p-4">
      <h3 class="font-semibold mb-2">Authentication</h3>
      {#if testResults.auth?.error}
        <div class="bg-red-50 border border-red-200 rounded p-3">
          <p class="text-red-800">
            <strong>Error:</strong>
            {testResults.auth.error}
          </p>
        </div>
      {:else if testResults.auth}
        <div class="space-y-2">
          <p>
            <strong>Session:</strong>
            {testResults.auth.hasSession ? "✅ Active" : "❌ None"}
          </p>
          {#if testResults.auth.sessionUser}
            <p><strong>User:</strong> {testResults.auth.sessionUser}</p>
          {/if}
        </div>
      {:else}
        <p class="text-gray-600">No data yet</p>
      {/if}
    </Card>

    <!-- Raw Data -->
    <Card class="p-4">
      <h3 class="font-semibold mb-2">Raw Test Data</h3>
      <details class="text-sm">
        <summary class="cursor-pointer">Click to expand</summary>
        <pre
          class="mt-2 bg-gray-100 p-2 rounded overflow-auto text-xs">{JSON.stringify(
            testResults,
            null,
            2
          )}</pre>
      </details>
    </Card>
  </div>
</div>
