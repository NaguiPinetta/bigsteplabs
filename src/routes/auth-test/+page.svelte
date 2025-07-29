<script lang="ts">
  import { onMount } from "svelte";
  import { authStore, resetAuth } from "$lib/stores/auth";
  import { supabase } from "$lib/supabase";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import {
    RefreshCw,
    LogOut,
    User,
    AlertCircle,
    CheckCircle,
  } from "lucide-svelte";

  let authState = $authStore;
  let testResults: string[] = [];

  // Subscribe to auth store changes
  authStore.subscribe((state) => {
    authState = state;
  });

  function addResult(
    message: string,
    type: "info" | "success" | "error" = "info"
  ) {
    const timestamp = new Date().toLocaleTimeString();
    testResults = [...testResults, `[${timestamp}] ${message}`];
  }

  async function testAuthState() {
    addResult("🔍 Testing current auth state...");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        addResult(`✅ Session exists - User: ${session.user.email}`, "success");
        addResult(`   User ID: ${session.user.id}`, "info");
        addResult(
          `   Session expires: ${new Date(session.expires_at! * 1000).toLocaleString()}`,
          "info"
        );
      } else {
        addResult("❌ No active session found", "error");
      }
    } catch (error) {
      addResult(`❌ Error checking session: ${error}`, "error");
    }
  }

  async function testUserProfile() {
    addResult("🔍 Testing user profile access...");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        addResult("❌ No session to test profile", "error");
        return;
      }

      addResult(`✅ Session found - User ID: ${session.user.id}`, "success");

      // Test the exact query that's failing
      addResult("🔍 Attempting to fetch user profile...", "info");

      const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) {
        addResult(`❌ Profile fetch error: ${error.message}`, "error");
        addResult(`   Error code: ${error.code}`, "info");
        addResult(`   Error details: ${JSON.stringify(error)}`, "info");

        // If it's a 500 error, it might still be the RLS issue
        if (error.code === "42P17") {
          addResult("🚨 This is still the infinite recursion error!", "error");
          addResult(
            "   The RLS policy fix may not have been applied correctly",
            "error"
          );
        }
      } else if (profile) {
        addResult(`✅ Profile found - Role: ${profile.role}`, "success");
        addResult(`   Email: ${profile.email}`, "info");
        addResult(
          `   Created: ${new Date(profile.created_at).toLocaleString()}`,
          "info"
        );
      } else {
        addResult("❌ No profile found", "error");
      }
    } catch (error) {
      addResult(`❌ Error testing profile: ${error}`, "error");
    }
  }

  async function resetAuthState() {
    addResult("🔄 Resetting auth state...");

    try {
      // Clear Supabase session
      await supabase.auth.signOut();
      addResult("✅ Supabase session cleared", "success");

      // Reset local auth store
      resetAuth();
      addResult("✅ Local auth store reset", "success");

      // Clear browser storage
      localStorage.removeItem("supabase.auth.token");
      sessionStorage.clear();
      addResult("✅ Browser storage cleared", "success");
    } catch (error) {
      addResult(`❌ Error resetting auth: ${error}`, "error");
    }
  }

  async function forceReload() {
    addResult("🔄 Force reloading page...");
    window.location.reload();
  }

  function clearResults() {
    testResults = [];
  }

  onMount(() => {
    addResult("🚀 Auth test page loaded");
    addResult(
      `Current auth state: ${authState.loading ? "Loading" : authState.user ? "Authenticated" : "Not authenticated"}`
    );
  });
</script>

<svelte:head>
  <title>Auth Test - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-4xl">
  <div class="mb-6">
    <h1 class="text-2xl font-bold mb-2">🔧 Auth Test Page</h1>
    <p class="text-muted-foreground">Debug and test authentication issues</p>
  </div>

  <!-- Current Status -->
  <Card class="mb-6 p-6">
    <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
      <User class="w-5 h-5" />
      Current Auth Status
    </h2>

    <div class="grid grid-cols-2 gap-4 text-sm">
      <div>
        <strong>Loading:</strong>
        <span class={authState.loading ? "text-yellow-600" : "text-green-600"}>
          {authState.loading ? "Yes" : "No"}
        </span>
      </div>
      <div>
        <strong>Initialized:</strong>
        <span class={authState.initialized ? "text-green-600" : "text-red-600"}>
          {authState.initialized ? "Yes" : "No"}
        </span>
      </div>
      <div>
        <strong>Has Session:</strong>
        <span class={authState.session ? "text-green-600" : "text-red-600"}>
          {authState.session ? "Yes" : "No"}
        </span>
      </div>
      <div>
        <strong>Has User:</strong>
        <span class={authState.user ? "text-green-600" : "text-red-600"}>
          {authState.user ? "Yes" : "No"}
        </span>
      </div>
    </div>

    {#if authState.user}
      <div
        class="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded"
      >
        <div class="flex items-center gap-2 text-green-800 dark:text-green-200">
          <CheckCircle class="w-4 h-4" />
          <strong>User Profile:</strong>
          {authState.user.email} ({authState.user.role})
        </div>
      </div>
    {:else if !authState.loading}
      <div
        class="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded"
      >
        <div
          class="flex items-center gap-2 text-yellow-800 dark:text-yellow-200"
        >
          <AlertCircle class="w-4 h-4" />
          <strong>No user profile loaded</strong>
        </div>
      </div>
    {/if}
  </Card>

  <!-- Test Actions -->
  <Card class="mb-6 p-6">
    <h2 class="text-lg font-semibold mb-4">🧪 Test Actions</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Button on:click={testAuthState} variant="outline" class="w-full">
        <User class="w-4 h-4 mr-2" />
        Test Auth State
      </Button>

      <Button on:click={testUserProfile} variant="outline" class="w-full">
        <User class="w-4 h-4 mr-2" />
        Test User Profile
      </Button>

      <Button on:click={resetAuthState} variant="destructive" class="w-full">
        <LogOut class="w-4 h-4 mr-2" />
        Reset Auth State
      </Button>

      <Button on:click={forceReload} variant="outline" class="w-full">
        <RefreshCw class="w-4 h-4 mr-2" />
        Force Reload
      </Button>
    </div>
  </Card>

  <!-- Test Results -->
  <Card class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold">📋 Test Results</h2>
      <Button on:click={clearResults} variant="outline" size="sm">Clear</Button>
    </div>

    <div
      class="bg-gray-50 dark:bg-gray-900 p-4 rounded border max-h-96 overflow-y-auto"
    >
      {#if testResults.length === 0}
        <p class="text-muted-foreground text-sm">
          No test results yet. Run some tests above.
        </p>
      {:else}
        {#each testResults as result}
          <div class="text-sm font-mono mb-1">{result}</div>
        {/each}
      {/if}
    </div>
  </Card>

  <!-- Quick Links -->
  <div class="mt-6 text-center">
    <div class="flex gap-4 justify-center">
      <a href="/auth/login" class="text-primary hover:underline">Go to Login</a>
      <a href="/dashboard" class="text-primary hover:underline"
        >Go to Dashboard</a
      >
      <a href="/" class="text-primary hover:underline">Go to Home</a>
    </div>
  </div>
</div>
