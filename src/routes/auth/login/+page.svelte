<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import { signInAsAdmin } from "$lib/stores/auth";
  import type { ActionData } from "./$types";

  export let form: ActionData;

  let loading = false;
  let email = form?.email || "";
  let username = "";
  let password = "";
  let loginMode = "email"; // 'email' or 'admin'
  let adminError = "";
  let adminLoading = false;

  // Check for errors in URL parameters
  import { page } from "$app/stores";
  $: urlError = $page.url.searchParams.get("error");
  $: errorMessage = getErrorMessage(urlError);

  function getErrorMessage(error: string | null) {
    switch (error) {
      case "exchange_failed":
        return "Failed to complete sign in. Please try requesting a new magic link.";
      case "callback_failed":
        return "Authentication callback failed. Please try again.";
      case "no_code":
        return "Invalid magic link. Please request a new one.";
      case "timeout":
        return "Sign in took too long. Please try again.";
      default:
        return null;
    }
  }

  async function handleAdminLogin() {
    if (!username.trim() || !password.trim()) {
      adminError = "Please enter both username and password";
      return;
    }

    adminLoading = true;
    adminError = "";

    const result = await signInAsAdmin(username.trim(), password);

    if (result.success) {
      goto("/dashboard");
    } else {
      adminError = result.error || "Login failed";
    }

    adminLoading = false;
  }

  function switchLoginMode(mode: string) {
    loginMode = mode;
    adminError = "";
  }
</script>

<svelte:head>
  <title>Sign in - BigStepLabs</title>
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
          class={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            loginMode === "email"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          on:click={() => switchLoginMode("email")}
        >
          Magic Link
        </button>
        <button
          class={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            loginMode === "admin"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          on:click={() => switchLoginMode("admin")}
        >
          Admin Login
        </button>
      </div>

      <!-- Error Messages -->
      {#if errorMessage}
        <div
          class="bg-destructive/15 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm"
        >
          {errorMessage}
        </div>
      {/if}

      {#if form?.error}
        <div
          class="bg-destructive/15 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm"
        >
          {form.error}
        </div>
      {/if}

      {#if adminError}
        <div
          class="bg-destructive/15 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm"
        >
          {adminError}
        </div>
      {/if}

      <!-- Success Message -->
      {#if form?.success}
        <div
          class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-md text-sm"
        >
          ✓ Magic link sent to <strong>{form.email}</strong><br />
          Check your email and click the link to continue.
        </div>
      {/if}

      {#if loginMode === "email"}
        <!-- Magic Link Form -->
        <form
          method="POST"
          use:enhance={() => {
            loading = true;
            return async ({ update }) => {
              loading = false;
              update();
            };
          }}
        >
          <div class="space-y-4">
            <div>
              <label
                for="email"
                class="block text-sm font-medium text-foreground mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                bind:value={email}
                disabled={loading}
                class="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                placeholder="Enter your email"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              class="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:cursor-not-allowed flex items-center justify-center"
            >
              {#if loading}
                <svg
                  class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending magic link...
              {:else}
                <svg
                  class="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Send magic link
              {/if}
            </button>
          </div>
        </form>
      {:else}
        <!-- Admin Login Form -->
        <div class="space-y-4">
          <div>
            <label
              for="username"
              class="block text-sm font-medium text-foreground mb-2"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autocomplete="username"
              required
              bind:value={username}
              disabled={adminLoading}
              class="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
              placeholder="Enter admin username"
            />
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium text-foreground mb-2"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              bind:value={password}
              disabled={adminLoading}
              class="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
              placeholder="Enter admin password"
              on:keydown={(e) => e.key === "Enter" && handleAdminLogin()}
            />
          </div>

          <button
            type="button"
            on:click={handleAdminLogin}
            disabled={adminLoading || !username.trim() || !password.trim()}
            class="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:cursor-not-allowed flex items-center justify-center"
          >
            {#if adminLoading}
              <svg
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Signing in...
            {:else}
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              Sign in as Admin
            {/if}
          </button>
        </div>
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

        {#if loginMode === "email"}
          <div class="mt-4">
            <a
              href="/dev"
              class="text-sm text-muted-foreground hover:text-primary underline"
            >
              Development Mode (Test without email)
            </a>
          </div>
        {/if}
      </div>
    </div>
  </div>
</main>
