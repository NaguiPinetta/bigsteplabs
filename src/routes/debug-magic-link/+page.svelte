<script lang="ts">
  import { supabase } from "$lib/supabase";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Input from "$lib/components/ui/input.svelte";

  let email = "naguipinetta@gmail.com";
  let status = "";
  let error = "";
  let shouldCreateUser = true;

  async function testMagicLink() {
    status = "Testing magic link...";
    error = "";

    try {
      console.log("🔍 Testing magic link with options:", {
        email,
        shouldCreateUser,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      });

      const { data, error: magicError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: shouldCreateUser,
        },
      });

      if (magicError) {
        error = `Magic link error: ${magicError.message}`;
        status = "Failed";
        console.error("❌ Magic link failed:", magicError);
      } else {
        status = "Magic link sent successfully!";
        console.log("✅ Magic link sent:", data);
      }
    } catch (err) {
      error = `Unexpected error: ${err}`;
      status = "Failed";
      console.error("❌ Unexpected error:", err);
    }
  }

  async function checkUserExists() {
    status = "Checking if user exists...";
    error = "";

    try {
      // Try to sign in without creating user
      const { data, error: checkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (checkError) {
        if (checkError.message.includes("User not found")) {
          status = "User does NOT exist in auth system";
        } else {
          error = `Check error: ${checkError.message}`;
          status = "Error checking user";
        }
      } else {
        status = "User EXISTS in auth system";
      }
    } catch (err) {
      error = `Check error: ${err}`;
      status = "Failed to check user";
    }
  }

  async function clearAuth() {
    await supabase.auth.signOut();
    status = "Auth cleared";
  }
</script>

<svelte:head>
  <title>Magic Link Debug - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-2xl">
  <h1 class="text-2xl font-bold mb-6">Magic Link Debug</h1>

  <div class="space-y-6">
    <Card class="p-4">
      <h2 class="text-lg font-semibold mb-4">Test Configuration</h2>

      <div class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium mb-2">Email</label
          >
          <Input
            id="email"
            type="email"
            bind:value={email}
            placeholder="test@example.com"
          />
        </div>

        <div class="flex items-center space-x-2">
          <input
            type="checkbox"
            id="shouldCreateUser"
            bind:checked={shouldCreateUser}
            class="rounded border-input"
          />
          <label for="shouldCreateUser" class="text-sm font-medium">
            shouldCreateUser: {shouldCreateUser ? "true" : "false"}
          </label>
        </div>

        <div class="flex space-x-2">
          <Button on:click={checkUserExists} variant="outline">
            Check if User Exists
          </Button>
          <Button on:click={testMagicLink}>Test Magic Link</Button>
          <Button on:click={clearAuth} variant="outline">Clear Auth</Button>
        </div>
      </div>
    </Card>

    <Card class="p-4">
      <h2 class="text-lg font-semibold mb-4">Status</h2>
      <div class="space-y-2">
        <div class="text-sm">
          <strong>Status:</strong>
          {status}
        </div>
        {#if error}
          <div class="text-sm text-red-600">
            <strong>Error:</strong>
            {error}
          </div>
        {/if}
      </div>
    </Card>
  </div>
</div>
