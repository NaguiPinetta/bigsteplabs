<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { sendMagicLink, redirectAuthenticatedUser } from "$lib/auth";
  import { authStore, signInAsAdmin } from "$lib/stores/auth";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import { Mail, Lock, Loader2 } from "lucide-svelte";

  let email = "";
  let adminUsername = "";
  let adminPassword = "";
  let activeTab = "magic";
  let loading = false;
  let message = "";
  let messageType = "info"; // "info", "success", "error"

  $: user = $authStore.user;

  onMount(async () => {
    // Check if user is already authenticated
    if (user) {
      await redirectAuthenticatedUser();
    }

    // Check for error parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");

    if (error) {
      setMessage(getErrorMessage(error), "error");
      // Clear the error from URL
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  });

  function getErrorMessage(error: string): string {
    switch (error) {
      case "no_code":
        return "No authentication code found. Please request a new magic link.";
      case "invalid_link":
        return "The magic link is invalid or has expired. Please request a new one.";
      case "exchange_failed":
        return "Failed to complete authentication. Please try again.";
      case "timeout":
        return "Authentication timed out. Please try again.";
      default:
        return "An error occurred during authentication. Please try again.";
    }
  }

  function setMessage(text: string, type: "info" | "success" | "error") {
    message = text;
    messageType = type;
  }

  async function handleMagicLink() {
    if (!email) {
      setMessage("Please enter an email address", "error");
      return;
    }

    loading = true;
    setMessage("", "info");

    try {
      const result = await sendMagicLink(email, "/dashboard");

      if (result.success) {
        setMessage(
          "Magic link sent! Check your email and click the link to sign in.",
          "success"
        );
        email = ""; // Clear email field
      } else {
        setMessage(
          result.error?.message || "Failed to send magic link",
          "error"
        );
      }
    } catch (err) {
      setMessage("An unexpected error occurred", "error");
      console.error("Magic link error:", err);
    } finally {
      loading = false;
    }
  }

  async function handleAdminLogin() {
    if (!adminUsername || !adminPassword) {
      setMessage("Please enter both username and password", "error");
      return;
    }

    loading = true;
    setMessage("", "info");

    try {
      const result = await signInAsAdmin(adminUsername, adminPassword);

      if (result.success) {
        setMessage("Admin login successful! Redirecting...", "success");
        setTimeout(() => {
          goto("/dashboard");
        }, 1000);
      } else {
        setMessage(result.error || "Invalid credentials", "error");
      }
    } catch (err) {
      setMessage("An unexpected error occurred", "error");
      console.error("Admin login error:", err);
    } finally {
      loading = false;
    }
  }

  function handleKeydown(event: any) {
    if (event.key === "Enter") {
      if (activeTab === "magic") {
        handleMagicLink();
      } else {
        handleAdminLogin();
      }
    }
  }
</script>

<svelte:head>
  <title>Sign In - BigStepLabs</title>
  <meta name="description" content="Sign in to your BigStepLabs account" />
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

      <!-- Login Mode Tabs -->
      <div class="flex space-x-1 bg-muted p-1 rounded-lg">
        <button
          class="flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors {activeTab ===
          'magic'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'}"
          on:click={() => (activeTab = "magic")}
        >
          Magic Link
        </button>
        <button
          class="flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors {activeTab ===
          'admin'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'}"
          on:click={() => (activeTab = "admin")}
        >
          Admin Login
        </button>
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
      {#if activeTab === "magic"}
        <form class="space-y-4" on:submit|preventDefault={handleMagicLink}>
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
              on:keydown={handleKeydown}
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
      {/if}

      <!-- Admin Login Form -->
      {#if activeTab === "admin"}
        <form class="space-y-4" on:submit|preventDefault={handleAdminLogin}>
          <div>
            <label
              for="username"
              class="block text-sm font-medium text-foreground mb-2"
            >
              Username
            </label>
            <Input
              id="username"
              type="text"
              bind:value={adminUsername}
              placeholder="Enter admin username"
              disabled={loading}
              on:keydown={handleKeydown}
              required
            />
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium text-foreground mb-2"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              bind:value={adminPassword}
              placeholder="Enter admin password"
              disabled={loading}
              on:keydown={handleKeydown}
              required
            />
          </div>

          <Button
            type="submit"
            class="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400"
            disabled={loading || !adminUsername || !adminPassword}
          >
            {#if loading}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            {:else}
              <Lock class="mr-2 h-4 w-4" />
              Sign in as Admin
            {/if}
          </Button>
        </form>
      {/if}

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
