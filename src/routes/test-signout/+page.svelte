<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import { signOut } from "$lib/auth";
  import { authStore } from "$lib/stores/auth";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import { LogOut, RefreshCw, AlertCircle, CheckCircle } from "lucide-svelte";

  let sessionInfo = {
    hasSession: false,
    user: null as any,
    loading: true,
    error: "",
  };

  let signOutResults = {
    method1: { status: "idle", message: "" },
    method2: { status: "idle", message: "" },
    method3: { status: "idle", message: "" },
  };

  onMount(async () => {
    await checkSession();
  });

  async function checkSession() {
    sessionInfo.loading = true;
    sessionInfo.error = "";

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        sessionInfo.error = `Session error: ${error.message}`;
      } else {
        sessionInfo.hasSession = !!session;
        sessionInfo.user = session?.user || null;
      }
    } catch (err) {
      sessionInfo.error = `Unexpected error: ${err}`;
    }

    sessionInfo.loading = false;
  }

  async function testMethod1() {
    signOutResults.method1 = {
      status: "testing",
      message: "Testing direct Supabase signOut...",
    };

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        signOutResults.method1 = {
          status: "failed",
          message: `Failed: ${error.message}`,
        };
      } else {
        signOutResults.method1 = {
          status: "success",
          message: "Success! Session cleared.",
        };
      }
    } catch (err) {
      signOutResults.method1 = {
        status: "failed",
        message: `Error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }

    await checkSession();
  }

  async function testMethod2() {
    signOutResults.method2 = {
      status: "testing",
      message: "Testing auth.ts signOut function...",
    };

    try {
      await signOut();
      signOutResults.method2 = {
        status: "success",
        message: "Success! Should redirect to login.",
      };
    } catch (err) {
      signOutResults.method2 = {
        status: "failed",
        message: `Error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  async function testMethod3() {
    signOutResults.method3 = {
      status: "testing",
      message: "Testing manual cleanup...",
    };

    try {
      // Clear auth store
      authStore.set({ session: null, user: null, loading: false });

      // Clear localStorage
      if (typeof window !== "undefined") {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes("supabase") || key.includes("auth"))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      }

      // Try Supabase signOut
      const { error } = await supabase.auth.signOut();

      if (error) {
        signOutResults.method3 = {
          status: "failed",
          message: `Supabase error: ${error.message}`,
        };
      } else {
        signOutResults.method3 = {
          status: "success",
          message: "Success! Manual cleanup complete.",
        };
      }
    } catch (err) {
      signOutResults.method3 = {
        status: "failed",
        message: `Error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }

    await checkSession();
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "success":
        return CheckCircle;
      case "failed":
        return AlertCircle;
      case "testing":
        return RefreshCw;
      default:
        return LogOut;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "success":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      case "testing":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  }
</script>

<svelte:head>
  <title>Sign Out Test - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-2xl">
  <h1 class="text-2xl font-bold mb-6">Sign Out Test</h1>

  <div class="space-y-6">
    <!-- Current Session Status -->
    <Card class="p-4">
      <h2 class="text-lg font-semibold mb-4">Current Session Status</h2>

      {#if sessionInfo.loading}
        <p>Loading...</p>
      {:else}
        <div class="space-y-2">
          <p>
            <strong>Has Session:</strong>
            {sessionInfo.hasSession ? "✅ Yes" : "❌ No"}
          </p>

          {#if sessionInfo.user}
            <div class="bg-green-50 border border-green-200 rounded p-3">
              <h3 class="font-semibold text-green-800">Logged In User:</h3>
              <p><strong>Email:</strong> {sessionInfo.user.email}</p>
              <p><strong>ID:</strong> {sessionInfo.user.id}</p>
            </div>
          {:else}
            <div class="bg-red-50 border border-red-200 rounded p-3">
              <p class="text-red-800">No user logged in</p>
            </div>
          {/if}
        </div>
      {/if}

      <div class="mt-4">
        <Button on:click={checkSession} variant="outline" size="sm">
          <RefreshCw class="w-4 h-4 mr-2" />
          Refresh Status
        </Button>
      </div>
    </Card>

    <!-- Sign Out Test Methods -->
    <Card class="p-4">
      <h2 class="text-lg font-semibold mb-4">Sign Out Test Methods</h2>

      <div class="space-y-4">
        <!-- Method 1: Direct Supabase -->
        <div class="border rounded-lg p-4">
          <h3 class="font-medium mb-2">Method 1: Direct Supabase signOut()</h3>
          <p class="text-sm text-gray-600 mb-3">
            Tests the basic Supabase auth.signOut() method
          </p>

          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <svelte:component
                this={getStatusIcon(signOutResults.method1.status)}
                class="w-4 h-4 {getStatusColor(signOutResults.method1.status)}"
              />
              <span class="text-sm">{signOutResults.method1.message}</span>
            </div>
            <Button
              on:click={testMethod1}
              size="sm"
              disabled={signOutResults.method1.status === "testing"}
            >
              Test Method 1
            </Button>
          </div>
        </div>

        <!-- Method 2: Auth.ts function -->
        <div class="border rounded-lg p-4">
          <h3 class="font-medium mb-2">Method 2: Auth.ts signOut() function</h3>
          <p class="text-sm text-gray-600 mb-3">
            Tests the enhanced signOut function with cleanup and redirect
          </p>

          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <svelte:component
                this={getStatusIcon(signOutResults.method2.status)}
                class="w-4 h-4 {getStatusColor(signOutResults.method2.status)}"
              />
              <span class="text-sm">{signOutResults.method2.message}</span>
            </div>
            <Button
              on:click={testMethod2}
              size="sm"
              disabled={signOutResults.method2.status === "testing"}
            >
              Test Method 2
            </Button>
          </div>
        </div>

        <!-- Method 3: Manual cleanup -->
        <div class="border rounded-lg p-4">
          <h3 class="font-medium mb-2">Method 3: Manual cleanup</h3>
          <p class="text-sm text-gray-600 mb-3">
            Tests manual cleanup of auth store and localStorage
          </p>

          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <svelte:component
                this={getStatusIcon(signOutResults.method3.status)}
                class="w-4 h-4 {getStatusColor(signOutResults.method3.status)}"
              />
              <span class="text-sm">{signOutResults.method3.message}</span>
            </div>
            <Button
              on:click={testMethod3}
              size="sm"
              disabled={signOutResults.method3.status === "testing"}
            >
              Test Method 3
            </Button>
          </div>
        </div>
      </div>
    </Card>

    <!-- Instructions -->
    <Card class="p-4">
      <h2 class="text-lg font-semibold mb-4">Instructions</h2>
      <div class="space-y-2 text-sm text-gray-600">
        <p>1. Check your current session status above</p>
        <p>2. Try each sign-out method to see which works</p>
        <p>3. Method 2 should redirect you to the login page</p>
        <p>
          4. If you see a 403 error, it means the session is already invalid
        </p>
        <p class="text-red-600 font-medium">
          If all methods fail, try clearing your browser cache and cookies
        </p>
      </div>
    </Card>

    {#if sessionInfo.error}
      <Card class="p-4 border-red-200 bg-red-50">
        <h3 class="font-semibold text-red-800">Error:</h3>
        <p class="text-red-700">{sessionInfo.error}</p>
      </Card>
    {/if}
  </div>
</div>
