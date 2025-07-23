<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Input from "$lib/components/ui/input.svelte";

  let email = "jdpinetta@gmail.com";
  let status = "Click 'Test Supabase Config' to check your setup";
  let usersTableStatus = "Not tested yet";
  let testResults = {
    config: null as any,
    connection: null as any,
    auth: null as any,
    magicLink: null as any,
  };

  onMount(async () => {
    await runAllTests();
  });

  async function runAllTests() {
    status = "Running tests...";

    // Test 1: Configuration
    await testConfig();

    // Test 2: Database Connection
    await testConnection();

    // Test 3: Auth Configuration
    await testAuth();

    status = "Tests complete";
  }

  async function testConfig() {
    try {
      testResults.config = {
        url: import.meta.env.VITE_SUPABASE_URL,
        keyLength: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.length || 0,
        hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasKey: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        keyPreview:
          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.substring(0, 20) +
          "...",
      };
      console.log("✅ Config test:", testResults.config);
    } catch (err) {
      console.error("❌ Config test failed:", err);
      testResults.config = { error: err };
    }
  }

  async function testConnection() {
    try {
      const { data, error } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .limit(5);

      testResults.connection = {
        success: !error,
        error: error?.message,
        tablesFound: data?.length || 0,
        tables: data?.map((t) => t.table_name) || [],
      };
      console.log("✅ Connection test:", testResults.connection);
    } catch (err) {
      console.error("❌ Connection test failed:", err);
      testResults.connection = { error: err };
    }
  }

  async function testAuth() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      testResults.auth = {
        hasSession: !!session,
        error: error?.message,
        userEmail: session?.user?.email || null,
        userId: session?.user?.id || null,
      };
      console.log("✅ Auth test:", testResults.auth);
    } catch (err) {
      console.error("❌ Auth test failed:", err);
      testResults.auth = { error: err };
    }
  }

  async function testMagicLink() {
    if (!email) {
      status = "Please enter an email address";
      return;
    }

    status = "Sending magic link...";

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      testResults.magicLink = {
        success: !error,
        error: error?.message,
        email: email,
      };

      if (error) {
        status = `Magic link failed: ${error.message}`;
        console.error("❌ Magic link error:", error);
      } else {
        status = "Magic link sent successfully!";
        console.log("✅ Magic link sent successfully");
      }
    } catch (err) {
      testResults.magicLink = { error: err, email: email };
      status = `Unexpected error: ${err}`;
      console.error("❌ Magic link unexpected error:", err);
    }
  }

  async function checkSupabaseSettings() {
    status = "Checking Supabase settings...";

    // This would typically be done in the Supabase dashboard
    // But we can provide guidance
    const settings = {
      authSettings: [
        "Check Authentication > Settings > Email Auth",
        "Ensure 'Enable email confirmations' is ON",
        "Check 'Secure email change' settings",
      ],
      redirectUrls: [
        "Check Authentication > URL Configuration",
        "Add: http://localhost:5173/auth/callback",
        "Add: http://localhost:5173/auth/login",
      ],
      emailTemplates: [
        "Check Authentication > Email Templates",
        "Verify 'Confirm signup' template exists",
        "Check 'Magic Link' template if using",
      ],
    };

    console.log("📋 Supabase settings to check:", settings);
    status = "Check console for Supabase settings guidance";
  }

  async function testUsersTablePolicies() {
    try {
      console.log("🔍 Testing users table policies...");

      // Test if we can insert a user profile
      const testUser = {
        id: "test-user-" + Date.now(),
        email: "test@example.com",
        role: "Student",
      };

      const { data, error } = await supabase
        .from("users")
        .insert(testUser)
        .select()
        .single();

      if (error) {
        console.error("❌ Users table insert failed:", error);
        usersTableStatus = `Failed: ${error.message}`;
      } else {
        console.log("✅ Users table insert successful:", data);
        usersTableStatus = "Working - can insert user profiles";

        // Clean up test user
        await supabase.from("users").delete().eq("id", testUser.id);
      }
    } catch (error) {
      console.error("❌ Users table test error:", error);
      usersTableStatus = `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  async function updateUserToAdmin() {
    try {
      console.log("🔍 Updating user to Admin role...");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("❌ No authenticated user found");
        status = "No authenticated user found";
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .update({ role: "Admin" })
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        console.error("❌ Failed to update user role:", error);
        status = `Failed to update role: ${error.message}`;
      } else {
        console.log("✅ User role updated to Admin:", data);
        status = "User role updated to Admin! Refresh the page to see changes.";

        // Refresh the auth store to pick up the new role
        window.location.reload();
      }
    } catch (error) {
      console.error("❌ Update role error:", error);
      status = `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
</script>

<svelte:head>
  <title>Supabase Config Test</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-2xl">
  <h1 class="text-2xl font-bold mb-6">Supabase Configuration Test</h1>

  <div class="space-y-4">
    <Card class="p-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">Test Controls</h2>
        <div class="space-x-2">
          <Button on:click={runAllTests} size="sm">🔄 Run All Tests</Button>
          <Button on:click={checkSupabaseSettings} variant="outline" size="sm">
            📋 Check Settings
          </Button>
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
          <Button on:click={testMagicLink} size="sm">🧪 Test Magic Link</Button>
          <Button on:click={testUsersTablePolicies} size="sm"
            >👥 Test Users Table</Button
          >
          <Button on:click={updateUserToAdmin} size="sm" variant="destructive"
            >👑 Make Admin</Button
          >
        </div>
      </div>

      <p class="text-sm text-gray-600 mt-2">Status: {status}</p>
      <p class="text-sm text-gray-600">Users Table: {usersTableStatus}</p>
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
        <div class="space-y-1 text-sm">
          <p>
            <strong>URL:</strong>
            {testResults.config.hasUrl ? "✅ Set" : "❌ Missing"}
          </p>
          <p>
            <strong>Key:</strong>
            {testResults.config.hasKey ? "✅ Set" : "❌ Missing"}
          </p>
          <p>
            <strong>Key Length:</strong>
            {testResults.config.keyLength} characters
          </p>
          <p><strong>Key Preview:</strong> {testResults.config.keyPreview}</p>
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
        <div class="space-y-1 text-sm">
          <p>
            <strong>Status:</strong>
            {testResults.connection.success ? "✅ Connected" : "❌ Failed"}
          </p>
          <p>
            <strong>Tables Found:</strong>
            {testResults.connection.tablesFound}
          </p>
          {#if testResults.connection.tables.length > 0}
            <p>
              <strong>Tables:</strong>
              {testResults.connection.tables.join(", ")}
            </p>
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
        <div class="space-y-1 text-sm">
          <p>
            <strong>Session:</strong>
            {testResults.auth.hasSession ? "✅ Active" : "❌ None"}
          </p>
          {#if testResults.auth.userEmail}
            <p><strong>User:</strong> {testResults.auth.userEmail}</p>
            <p><strong>User ID:</strong> {testResults.auth.userId}</p>
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
            <strong>Status:</strong>
            {testResults.magicLink.success ? "✅ Sent" : "❌ Failed"}
          </p>
          <p><strong>Email:</strong> {testResults.magicLink.email}</p>
          {#if testResults.magicLink.error}
            <p><strong>Error:</strong> {testResults.magicLink.error}</p>
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
