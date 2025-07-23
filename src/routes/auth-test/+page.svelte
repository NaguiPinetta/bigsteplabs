<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Input from "$lib/components/ui/input.svelte";

  let email = "";
  let loading = false;
  let message = "";
  let session = null as any;
  let user = null as any;

  onMount(async () => {
    await checkSession();
  });

  async function checkSession() {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();
    session = currentSession;
    user = currentSession?.user;
    console.log("🔍 Current session:", session);
    console.log("🔍 Current user:", user);
  }

  async function sendMagicLink() {
    if (!email) {
      message = "Please enter an email address";
      return;
    }

    loading = true;
    message = "";

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        message = `Error: ${error.message}`;
        console.error("❌ Magic link error:", error);
      } else {
        message = "✅ Magic link sent! Check your email.";
        console.log("✅ Magic link sent successfully");
      }
    } catch (err) {
      message = `Unexpected error: ${err}`;
      console.error("❌ Unexpected error:", err);
    } finally {
      loading = false;
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    await checkSession();
    message = "Signed out successfully";
  }

  async function testDatabaseAccess() {
    if (!user) {
      message = "Please sign in first";
      return;
    }

    try {
      console.log("🔍 Testing database access...");

      // Test basic query
      const { data: units, error: unitsError } = await supabase
        .from("units")
        .select("count")
        .limit(1);

      if (unitsError) {
        message = `Database access failed: ${unitsError.message}`;
        console.error("❌ Database access failed:", unitsError);
      } else {
        message = "✅ Database access successful!";
        console.log("✅ Database access successful:", units);
      }
    } catch (err) {
      message = `Database test error: ${err}`;
      console.error("❌ Database test error:", err);
    }
  }
</script>

<svelte:head>
  <title>Auth Test - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-2xl">
  <h1 class="text-2xl font-bold mb-6">Authentication Test</h1>

  <div class="space-y-6">
    <!-- Session Status -->
    <Card class="p-4">
      <h2 class="text-lg font-semibold mb-4">Session Status</h2>
      <div class="space-y-2">
        <p><strong>Authenticated:</strong> {session ? "✅ Yes" : "❌ No"}</p>
        {#if user}
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p>
            <strong>Created:</strong>
            {new Date(user.created_at).toLocaleString()}
          </p>
        {/if}
      </div>
    </Card>

    <!-- Magic Link Form -->
    {#if !session}
      <Card class="p-4">
        <h2 class="text-lg font-semibold mb-4">Send Magic Link</h2>
        <div class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium mb-1"
              >Email</label
            >
            <Input
              id="email"
              type="email"
              bind:value={email}
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>
          <Button on:click={sendMagicLink} disabled={loading || !email}>
            {loading ? "Sending..." : "Send Magic Link"}
          </Button>
        </div>
      </Card>
    {:else}
      <Card class="p-4">
        <h2 class="text-lg font-semibold mb-4">Signed In</h2>
        <div class="space-y-4">
          <Button on:click={signOut} variant="outline">Sign Out</Button>
          <Button on:click={testDatabaseAccess}>Test Database Access</Button>
        </div>
      </Card>
    {/if}

    <!-- Message Display -->
    {#if message}
      <Card class="p-4">
        <div class="text-sm">
          <strong>Message:</strong>
          {message}
        </div>
      </Card>
    {/if}

    <!-- Raw Session Data -->
    <Card class="p-4">
      <h2 class="text-lg font-semibold mb-4">Raw Session Data</h2>
      <details class="text-sm">
        <summary class="cursor-pointer">Click to expand</summary>
        <pre
          class="mt-2 bg-gray-100 p-2 rounded overflow-auto text-xs">{JSON.stringify(
            { session, user },
            null,
            2
          )}</pre>
      </details>
    </Card>
  </div>
</div>
