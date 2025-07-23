<script lang="ts">
  import { onMount } from "svelte";
  import { handleMagicLinkAuth, redirectAuthenticatedUser } from "$lib/auth";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import { AlertCircle, CheckCircle, Loader2 } from "lucide-svelte";

  let status = "Processing authentication...";
  let loading = true;
  let error = null as any;
  let success = false;

  onMount(async () => {
    await processAuthentication();
  });

  async function processAuthentication() {
    try {
      console.log("🔍 Processing authentication in callback...");
      console.log("🔍 Current URL:", window.location.href);

      const result = await handleMagicLinkAuth();

      console.log("🔍 Auth result:", {
        success: result.success,
        errorType: result.error?.type,
        hasSession: !!result.session,
        hasUser: !!result.user,
      });

      if (result.success) {
        console.log("✅ Authentication successful");
        status = "Authentication successful! Redirecting...";
        success = true;

        // Clear URL parameters to prevent issues
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.hash = "";
          url.search = "";
          window.history.replaceState({}, "", url.toString());
          console.log("🔍 Cleared URL parameters");
        }

        // Redirect to dashboard after a short delay
        setTimeout(async () => {
          console.log("🔍 Redirecting to dashboard...");
          await redirectAuthenticatedUser();
        }, 1000);
      } else {
        console.error("❌ Authentication failed:", result.error);
        error = result.error;
        status = "Authentication failed";
        loading = false;
      }
    } catch (err) {
      console.error("❌ Unexpected error in callback:", err);
      error = {
        type: "unknown",
        message: "Unexpected error during authentication",
        details: err,
      };
      status = "Unexpected error";
      loading = false;
    }
  }

  function getErrorMessage() {
    if (!error) return "";

    switch (error.type) {
      case "no_code":
        return "No authentication code found. Please request a new magic link.";
      case "invalid_link":
        return "The magic link is invalid or has expired. Please request a new one.";
      case "exchange_failed":
        return "Failed to complete authentication. Please try again.";
      case "network_error":
        return "Network error. Please check your connection and try again.";
      default:
        return error.message || "An unknown error occurred.";
    }
  }

  function goToLogin() {
    window.location.href = "/auth/login";
  }

  function requestNewLink() {
    window.location.href = "/auth/login";
  }
</script>

<svelte:head>
  <title>Authentication - BigStepLabs</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <div class="max-w-md w-full space-y-8 p-6">
    <Card class="p-8">
      <div class="text-center">
        {#if loading}
          <div class="flex justify-center mb-4">
            <Loader2 class="h-12 w-12 text-blue-600 animate-spin" />
          </div>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">
            {status}
          </h2>
          <p class="text-gray-600">
            Please wait while we complete your authentication...
          </p>
        {:else if success}
          <div class="flex justify-center mb-4">
            <CheckCircle class="h-12 w-12 text-green-600" />
          </div>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">
            Welcome to BigStepLabs!
          </h2>
          <p class="text-gray-600">
            You have been successfully authenticated. Redirecting to
            dashboard...
          </p>
        {:else}
          <div class="flex justify-center mb-4">
            <AlertCircle class="h-12 w-12 text-red-600" />
          </div>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">
            Authentication Failed
          </h2>
          <p class="text-gray-600 mb-6">
            {getErrorMessage()}
          </p>

          <div class="space-y-3">
            <Button on:click={requestNewLink} class="w-full">
              Request New Magic Link
            </Button>
            <Button on:click={goToLogin} variant="outline" class="w-full">
              Back to Login
            </Button>
          </div>
        {/if}
      </div>
    </Card>

    {#if error && error.details}
      <Card class="p-4">
        <details class="text-sm">
          <summary class="cursor-pointer font-medium text-gray-700">
            Technical Details
          </summary>
          <pre class="mt-2 bg-gray-100 p-2 rounded overflow-auto text-xs">
{JSON.stringify(error.details, null, 2)}
          </pre>
        </details>
      </Card>
    {/if}
  </div>
</div>
