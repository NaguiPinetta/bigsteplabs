<script lang="ts">
  import { supabase } from "$lib/supabase";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import { PUBLIC_APP_BASE_URL } from "$env/static/public";

  let email = "jdpinetta@gmail.com";
  let status = "";
  let errorMessage = "";

  async function testMagicLink() {
    status = "Sending magic link...";
    errorMessage = "";

    try {
      const { error: magicError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${PUBLIC_APP_BASE_URL}/app/auth/callback`,
        },
      });

      if (magicError) {
        errorMessage = `Magic link error: ${magicError.message}`;
        status = "Failed";
      } else {
        status = "Magic link sent! Check your email.";
      }
    } catch (err) {
      errorMessage = `Unexpected error: ${err}`;
      status = "Failed";
    }
  }

  async function checkSession() {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      errorMessage = `Session error: ${sessionError.message}`;
    } else if (session) {
      status = `Logged in as: ${session.user.email}`;
    } else {
      status = "No active session";
    }
  }
</script>

<svelte:head>
  <title>Magic Link Test - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6">
  <h1 class="text-2xl font-bold mb-4">Magic Link Test</h1>

  <div class="space-y-4">
    <Card class="p-4">
      <h2 class="text-lg font-semibold mb-2">Test Magic Link</h2>

      <div class="space-y-2">
        <label class="block text-sm font-medium">Email:</label>
        <input
          type="email"
          bind:value={email}
          class="w-full p-2 border rounded"
        />
      </div>

      <div class="mt-4 space-x-2">
        <Button on:click={testMagicLink}>Send Magic Link</Button>
        <Button on:click={checkSession} variant="outline">Check Session</Button>
      </div>
    </Card>

    {#if status}
      <Card class="p-4">
        <h3 class="font-semibold">Status:</h3>
        <p>{status}</p>
      </Card>
    {/if}

    {#if errorMessage}
      <Card class="p-4 border-red-200 bg-red-50">
        <h3 class="font-semibold text-red-800">Error:</h3>
        <p class="text-red-700">{errorMessage}</p>
      </Card>
    {/if}
  </div>
</div>
