<script lang="ts">
  import { onMount } from "svelte";
  import {
    handleMagicLinkAuth,
    sendMagicLink,
    getCurrentSession,
  } from "$lib/auth";
  import { authStore } from "$lib/stores/auth";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Input from "$lib/components/ui/input.svelte";

  let email = "jdpinetta@gmail.com";
  let status = "Ready";
  let testResults = {
    session: null as any,
    authFlow: null as any,
    magicLink: null as any,
  };

  $: user = $authStore.user;

  onMount(async () => {
    await checkCurrentSession();
  });

  async function checkCurrentSession() {
    try {
      const session = await getCurrentSession();
      testResults.session = {
        hasSession: !!session,
        userEmail: session?.user?.email || null,
        userId: session?.user?.id || null,
      };
      console.log("✅ Current session check:", testResults.session);
    } catch (err) {
      console.error("❌ Session check failed:", err);
      testResults.session = { error: err };
    }
  }

  async function testAuthFlow() {
    status = "Testing auth flow...";

    try {
      const result = await handleMagicLinkAuth();
      testResults.authFlow = {
        success: result.success,
        error: result.error,
        hasSession: !!result.session,
        userEmail: result.user?.email || null,
      };

      if (result.success) {
        status = "Auth flow successful!";
        await checkCurrentSession(); // Refresh session info
      } else {
        status = `Auth flow failed: ${result.error?.message}`;
      }

      console.log("✅ Auth flow test:", testResults.authFlow);
    } catch (err) {
      console.error("❌ Auth flow test failed:", err);
      testResults.authFlow = { error: err };
      status = "Auth flow test failed";
    }
  }

  async function testMagicLink() {
    if (!email) {
      status = "Please enter an email address";
      return;
    }

    status = "Sending magic link...";

    try {
      const result = await sendMagicLink(email, "/auth/callback");
      testResults.magicLink = {
        success: result.success,
        error: result.error,
        email: email,
      };

      if (result.success) {
        status = "Magic link sent successfully!";
      } else {
        status = `Magic link failed: ${result.error?.message}`;
      }

      console.log("✅ Magic link test:", testResults.magicLink);
    } catch (err) {
      console.error("❌ Magic link test failed:", err);
      testResults.magicLink = { error: err, email: email };
      status = "Magic link test failed";
    }
  }

  function simulateHashAuth() {
    // Simulate the hash format that Supabase sends
    const mockHash =
      "#access_token=mock_token&refresh_token=mock_refresh&token_type=bearer&type=magiclink";
    window.location.hash = mockHash;
    status = "Simulated hash auth - check console for details";
    console.log("🔍 Simulated hash auth:", mockHash);
  }

  function clearHash() {
    window.location.hash = "";
    status = "Hash cleared";
  }
</script>

<svelte:head>
  <title>Auth Flow Test</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-2xl">
  <h1 class="text-2xl font-bold mb-6">Authentication Flow Test</h1>

  <div class="space-y-6">
    <Card class="p-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">Test Controls</h2>
        <div class="space-x-2">
          <Button on:click={checkCurrentSession} size="sm">
            🔄 Check Session
          </Button>
          <Button on:click={testAuthFlow} size="sm">🧪 Test Auth Flow</Button>
        </div>
      </div>

      <div class="space-y-2">
        <label for="email" class="block text-sm font-medium">Test Email</label>
        <div class="flex space-x-2">
          <Input
            id="email"
            type="email"
            bind:value={email}
            placeholder="your@email.com"
          />
          <Button on:click={testMagicLink} size="sm">📧 Send Magic Link</Button>
        </div>
      </div>

      <div class="mt-4 space-x-2">
        <Button on:click={simulateHashAuth} variant="outline" size="sm">
          🎭 Simulate Hash Auth
        </Button>
        <Button on:click={clearHash} variant="outline" size="sm">
          🧹 Clear Hash
        </Button>
      </div>

      <p class="text-sm text-gray-600 mt-2">Status: {status}</p>
    </Card>

    <!-- Current Session -->
    <Card class="p-4">
      <h3 class="font-semibold mb-2">Current Session</h3>
      {#if testResults.session?.error}
        <div class="bg-red-50 border border-red-200 rounded p-3">
          <p class="text-red-800">
            <strong>Error:</strong>
            {testResults.session.error}
          </p>
        </div>
      {:else if testResults.session}
        <div class="space-y-1 text-sm">
          <p>
            <strong>Has Session:</strong>
            {testResults.session.hasSession ? "✅ Yes" : "❌ No"}
          </p>
          {#if testResults.session.userEmail}
            <p><strong>User:</strong> {testResults.session.userEmail}</p>
            <p><strong>User ID:</strong> {testResults.session.userId}</p>
          {/if}
        </div>
      {:else}
        <p class="text-gray-600">No data yet</p>
      {/if}
    </Card>

    <!-- Auth Flow Test -->
    <Card class="p-4">
      <h3 class="font-semibold mb-2">Auth Flow Test</h3>
      {#if testResults.authFlow?.error}
        <div class="bg-red-50 border border-red-200 rounded p-3">
          <p class="text-red-800">
            <strong>Error:</strong>
            {testResults.authFlow.error}
          </p>
        </div>
      {:else if testResults.authFlow}
        <div class="space-y-1 text-sm">
          <p>
            <strong>Success:</strong>
            {testResults.authFlow.success ? "✅ Yes" : "❌ No"}
          </p>
          {#if testResults.authFlow.error}
            <p><strong>Error:</strong> {testResults.authFlow.error.message}</p>
          {/if}
          <p>
            <strong>Has Session:</strong>
            {testResults.authFlow.hasSession ? "✅ Yes" : "❌ No"}
          </p>
          {#if testResults.authFlow.userEmail}
            <p><strong>User:</strong> {testResults.authFlow.userEmail}</p>
          {/if}
        </div>
      {:else}
        <p class="text-gray-600">No data yet</p>
      {/if}
    </Card>

    <!-- Magic Link Test -->
    <Card class="p-4">
      <h3 class="font-semibold mb-2">Magic Link Test</h3>
      {#if testResults.magicLink?.error}
        <div class="bg-red-50 border border-red-200 rounded p-3">
          <p class="text-red-800">
            <strong>Error:</strong>
            {testResults.magicLink.error}
          </p>
          <p class="text-sm text-red-700">
            Email: {testResults.magicLink.email}
          </p>
        </div>
      {:else if testResults.magicLink}
        <div class="space-y-1 text-sm">
          <p>
            <strong>Success:</strong>
            {testResults.magicLink.success ? "✅ Yes" : "❌ No"}
          </p>
          <p><strong>Email:</strong> {testResults.magicLink.email}</p>
          {#if testResults.magicLink.error}
            <p><strong>Error:</strong> {testResults.magicLink.error.message}</p>
          {/if}
        </div>
      {:else}
        <p class="text-gray-600">No data yet</p>
      {/if}
    </Card>

    <!-- Auth Store State -->
    <Card class="p-4">
      <h3 class="font-semibold mb-2">Auth Store State</h3>
      <div class="space-y-1 text-sm">
        <p><strong>Has User:</strong> {user ? "✅ Yes" : "❌ No"}</p>
        {#if user}
          <p><strong>User Email:</strong> {user.email}</p>
          <p><strong>User Role:</strong> {user.role}</p>
        {/if}
      </div>
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
