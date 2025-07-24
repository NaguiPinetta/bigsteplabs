<script lang="ts">
  import { goto } from "$app/navigation";
  import { sendMagicLink, redirectAuthenticatedUser } from "$lib/auth";
  import { onMount } from "svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import { Loader2, Mail, Shield } from "lucide-svelte";

  let email = "";
  let loading = false;
  let message = "";
  let messageType: "success" | "error" = "success";

  onMount(async () => {
    // Redirect if already authenticated
    await redirectAuthenticatedUser();
  });

  async function handleMagicLinkLogin() {
    if (!email.trim()) {
      message = "Please enter your email address";
      messageType = "error";
      return;
    }

    loading = true;
    message = "";

    try {
      const result = await sendMagicLink(email);

      if (result.success) {
        message =
          "Magic link sent! Check your email and click the link to sign in.";
        messageType = "success";
        email = "";
      } else {
        message = result.error?.message || "Failed to send magic link";
        messageType = "error";
      }
    } catch (error) {
      message = "An unexpected error occurred";
      messageType = "error";
      console.error("Login error:", error);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Sign In - BigStep Labs</title>
</svelte:head>

<main class="min-h-screen flex">
  <!-- Left Panel - Hero Image -->
  <div class="hidden lg:flex lg:w-1/2 relative">
    <div
      class="absolute inset-0 bg-gradient-to-br from-red-600 via-red-500 to-orange-600"
      style="background-image: url('/images/login-banner.png'); background-size: cover; background-position: center;"
    >
      <div class="absolute inset-0 bg-black/30"></div>
    </div>

    <div
      class="relative z-10 flex flex-col justify-center items-center text-white p-12 text-center"
    >
      <h1 class="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
        Take the Big Step in<br />Language Learning
      </h1>

      <p class="text-xl lg:text-2xl mb-8 max-w-md leading-relaxed">
        Unlock your potential with AI-powered language courses designed for
        real-world success.
      </p>

      <div class="flex items-center space-x-4 text-lg">
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          <span>Join thousands of learners worldwide</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Right Panel - Login Form -->
  <div class="w-full lg:w-1/2 flex items-center justify-center p-8">
    <div class="w-full max-w-md space-y-8">
      <!-- Logo and Welcome -->
      <div class="text-center">
        <div class="text-4xl font-bold text-red-600 mb-2">BigStepLabs</div>
        <h2 class="text-2xl font-bold text-foreground">Welcome back</h2>
        <p class="text-muted-foreground mt-2">
          Sign in to your BigStepLabs account
        </p>
      </div>

      <!-- Error/Success Messages -->
      {#if message}
        <div
          class="rounded-md p-4 {messageType === 'error'
            ? 'bg-destructive/15 border border-destructive/20 text-destructive'
            : messageType === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'}"
        >
          <p class="text-sm">
            {message}
          </p>
        </div>
      {/if}

      <!-- Magic Link Form -->
      <form class="space-y-4" on:submit|preventDefault={handleMagicLinkLogin}>
        <div>
          <label
            for="email"
            class="block text-sm font-medium text-foreground mb-2"
          >
            Email address
          </label>
          <Input
            id="email"
            type="email"
            bind:value={email}
            placeholder="Enter your email"
            disabled={loading}
            on:keydown={(e) =>
              (e as unknown as KeyboardEvent).key === "Enter" &&
              handleMagicLinkLogin()}
            required
          />
        </div>

        <Button
          type="submit"
          class="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400"
          disabled={loading || !email}
        >
          {#if loading}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            Sending magic link...
          {:else}
            <Mail class="mr-2 h-4 w-4" />
            Send magic link
          {/if}
        </Button>
      </form>

      <!-- Footer -->
      <div class="text-center">
        <div class="text-sm text-muted-foreground">
          By signing in, you agree to our{" "}
          <a href="/terms" class="text-primary hover:underline"
            >Terms of Service</a
          >
          {" "}and{" "}
          <a href="/privacy" class="text-primary hover:underline"
            >Privacy Policy</a
          >
        </div>

        <div class="mt-4">
          <a
            href="/dev"
            class="text-sm text-muted-foreground hover:text-primary underline"
          >
            Development Mode (Test without email)
          </a>
        </div>
      </div>
    </div>
  </div>
</main>
