<script lang="ts">
  import { onMount } from "svelte";
  import {
    handleMagicLinkAuth,
    redirectAuthenticatedUser,
    ensureUserProfile,
  } from "$lib/auth";
  import { authStore } from "$lib/stores/auth";
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

      if (result.success && result.session) {
        console.log("✅ Authentication successful");

        // Ensure user profile exists
        console.log("🔍 Ensuring user profile exists...");
        const profileResult = await ensureUserProfile(result.session);

        if (profileResult.success) {
          console.log("✅ User profile ensured:", profileResult.user);

          // Update the auth store with the session and user
          authStore.set({
            session: result.session,
            user: profileResult.user,
            loading: false,
            initialized: true,
          });

          console.log("✅ Auth store updated with session and user");

          // Force a small delay to ensure the store is updated
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Double-check the auth store state
          console.log("🔍 Auth store state after update:", $authStore);
        } else {
          console.error(
            "❌ Failed to ensure user profile:",
            profileResult.error
          );
        }

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
          console.log("🔍 Current auth store state:", $authStore);

          // Try the redirect function first
          try {
            await redirectAuthenticatedUser();
          } catch (error) {
            console.error("❌ Redirect function failed:", error);
            // Fallback to direct redirect
            console.log("🔄 Using fallback redirect to dashboard");
            window.location.replace("/dashboard");
          }
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

<div class="min-h-screen flex items-center justify-center bg-background">
  <div class="max-w-md w-full space-y-8 p-6">
    <Card class="p-8">
      <div class="text-center">
        {#if loading}
          <div class="flex justify-center mb-4">
            <Loader2 class="h-12 w-12 text-primary animate-spin" />
          </div>
          <h2 class="text-xl font-semibold text-foreground mb-2">
            {status}
          </h2>
          <p class="text-muted-foreground">
            Please wait while we complete your authentication...
          </p>
        {:else if success}
          <div class="flex justify-center mb-4">
            <CheckCircle class="h-12 w-12 text-green-600" />
          </div>
          <h2 class="text-xl font-semibold text-foreground mb-2">
            Welcome to BigStepLabs!
          </h2>
          <p class="text-muted-foreground">
            You have been successfully authenticated. Redirecting to
            dashboard...
          </p>
        {:else}
          <div class="flex justify-center mb-4">
            <AlertCircle class="h-12 w-12 text-destructive" />
          </div>
          <h2 class="text-xl font-semibold text-foreground mb-2">
            Authentication Failed
          </h2>
          <p class="text-muted-foreground mb-6">
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
          <summary class="cursor-pointer font-medium text-foreground">
            Technical Details
          </summary>
          <pre
            class="mt-2 bg-muted p-2 rounded overflow-auto text-xs text-muted-foreground">
{JSON.stringify(error.details, null, 2)}
          </pre>
        </details>
      </Card>
    {/if}
  </div>
</div>
