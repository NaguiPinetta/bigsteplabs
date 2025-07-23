<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";

  let debugInfo = {
    session: null as any,
    hasSession: false,
    unitsData: null as any,
    unitsError: "",
    directQuery: null as any,
    directError: "",
    rlsTest: null as any,
    rlsError: "",
    loading: false,
  };

  onMount(async () => {
    await runDebug();
  });

  async function runDebug() {
    debugInfo.loading = true;
    debugInfo.unitsError = "";
    debugInfo.directError = "";
    debugInfo.rlsError = "";

    console.log("🔍 Starting Units debug...");

    // 1. Check session
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      debugInfo.session = session;
      debugInfo.hasSession = !!session;
      console.log("📋 Session check:", {
        hasSession: !!session,
        user: session?.user?.email,
      });
    } catch (err) {
      console.error("❌ Session check failed:", err);
    }

    // 2. Try to fetch units through the app's normal flow
    try {
      console.log("📋 Testing Units fetch through app...");
      const { data: units, error: unitsError } = await supabase
        .from("units")
        .select("*")
        .order("created_at", { ascending: false });

      debugInfo.unitsData = units;
      if (unitsError) {
        debugInfo.unitsError = unitsError.message;
        console.error("❌ Units fetch failed:", unitsError);
      } else {
        console.log("✅ Units fetch successful:", units?.length || 0, "units");
      }
    } catch (err) {
      debugInfo.unitsError = `Unexpected error: ${err}`;
      console.error("❌ Units fetch unexpected error:", err);
    }

    // 3. Test direct database connection
    try {
      console.log("📋 Testing direct database connection...");
      const { data: direct, error: directError } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .eq("table_name", "units");

      debugInfo.directQuery = direct;
      if (directError) {
        debugInfo.directError = directError.message;
        console.error("❌ Direct query failed:", directError);
      } else {
        console.log("✅ Direct query successful:", direct);
      }
    } catch (err) {
      debugInfo.directError = `Unexpected error: ${err}`;
      console.error("❌ Direct query unexpected error:", err);
    }

    // 4. Test RLS policies
    try {
      console.log("📋 Testing RLS policies...");
      const { data: rlsTest, error: rlsError } = await supabase
        .from("units")
        .select("count")
        .limit(1);

      debugInfo.rlsTest = rlsTest;
      if (rlsError) {
        debugInfo.rlsError = rlsError.message;
        console.log("📋 RLS test result:", rlsError);
      } else {
        console.log("✅ RLS test successful:", rlsTest);
      }
    } catch (err) {
      debugInfo.rlsError = `Unexpected error: ${err}`;
      console.error("❌ RLS test unexpected error:", err);
    }

    debugInfo.loading = false;
    console.log("🔍 Debug complete");
  }

  async function testWithAuth() {
    console.log("🔐 Testing with authentication...");
    // Try to sign in as admin for testing
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "admin@bigsteplabs.com",
      password: "test123",
    });

    if (error) {
      console.log("❌ Auth test failed:", error.message);
    } else {
      console.log("✅ Auth test successful:", data.user?.email);
      await runDebug(); // Re-run debug with auth
    }
  }
</script>

<svelte:head>
  <title>Units Debug - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6">
  <h1 class="text-2xl font-bold mb-4">Units Data Debug</h1>

  <div class="space-y-4">
    <Card class="p-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">Debug Controls</h2>
        <Button on:click={runDebug} disabled={debugInfo.loading}>
          {debugInfo.loading ? "Running..." : "🔄 Run Debug"}
        </Button>
      </div>

      <div class="space-x-2">
        <Button on:click={testWithAuth} variant="outline" size="sm">
          🔐 Test with Auth
        </Button>
      </div>
    </Card>

    <!-- Session Status -->
    <Card class="p-4">
      <h3 class="font-semibold mb-2">Session Status</h3>
      <div class="space-y-2">
        <p>
          <strong>Has Session:</strong>
          {debugInfo.hasSession ? "✅ Yes" : "❌ No"}
        </p>
        {#if debugInfo.session?.user}
          <p><strong>User:</strong> {debugInfo.session.user.email}</p>
          <p><strong>User ID:</strong> {debugInfo.session.user.id}</p>
        {/if}
      </div>
    </Card>

    <!-- Units Data -->
    <Card class="p-4">
      <h3 class="font-semibold mb-2">Units Data</h3>
      {#if debugInfo.unitsError}
        <div class="bg-red-50 border border-red-200 rounded p-3">
          <p class="text-red-800">
            <strong>Error:</strong>
            {debugInfo.unitsError}
          </p>
        </div>
      {:else if debugInfo.unitsData}
        <div class="bg-green-50 border border-green-200 rounded p-3">
          <p class="text-green-800">
            <strong>Success:</strong> Found {debugInfo.unitsData.length} units
          </p>
          <div class="mt-2 space-y-1">
            {#each debugInfo.unitsData.slice(0, 3) as unit}
              <div class="text-sm">
                • {unit.title} (ID: {unit.id})
              </div>
            {/each}
            {#if debugInfo.unitsData.length > 3}
              <div class="text-sm text-gray-600">
                ... and {debugInfo.unitsData.length - 3} more
              </div>
            {/if}
          </div>
        </div>
      {:else}
        <p class="text-gray-600">No data yet</p>
      {/if}
    </Card>

    <!-- Direct Database Test -->
    <Card class="p-4">
      <h3 class="font-semibold mb-2">Database Connection</h3>
      {#if debugInfo.directError}
        <div class="bg-red-50 border border-red-200 rounded p-3">
          <p class="text-red-800">
            <strong>Error:</strong>
            {debugInfo.directError}
          </p>
        </div>
      {:else if debugInfo.directQuery}
        <div class="bg-green-50 border border-green-200 rounded p-3">
          <p class="text-green-800">
            <strong>Success:</strong> Database connection working
          </p>
          <p class="text-sm">Tables found: {debugInfo.directQuery.length}</p>
        </div>
      {:else}
        <p class="text-gray-600">No data yet</p>
      {/if}
    </Card>

    <!-- RLS Test -->
    <Card class="p-4">
      <h3 class="font-semibold mb-2">RLS Policy Test</h3>
      {#if debugInfo.rlsError}
        <div class="bg-yellow-50 border border-yellow-200 rounded p-3">
          <p class="text-yellow-800">
            <strong>RLS Result:</strong>
            {debugInfo.rlsError}
          </p>
          <p class="text-sm text-yellow-700">
            This might indicate RLS is blocking access
          </p>
        </div>
      {:else if debugInfo.rlsTest}
        <div class="bg-green-50 border border-green-200 rounded p-3">
          <p class="text-green-800">
            <strong>Success:</strong> RLS allows access
          </p>
        </div>
      {:else}
        <p class="text-gray-600">No data yet</p>
      {/if}
    </Card>

    <!-- Raw Data -->
    <Card class="p-4">
      <h3 class="font-semibold mb-2">Raw Debug Data</h3>
      <details class="text-sm">
        <summary class="cursor-pointer">Click to expand</summary>
        <pre
          class="mt-2 bg-gray-100 p-2 rounded overflow-auto text-xs">{JSON.stringify(
            debugInfo,
            null,
            2
          )}</pre>
      </details>
    </Card>
  </div>
</div>
