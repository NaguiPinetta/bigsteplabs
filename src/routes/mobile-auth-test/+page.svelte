<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import {
    Mail,
    Smartphone,
    Monitor,
    AlertCircle,
    CheckCircle,
  } from "lucide-svelte";

  let email = "";
  let status = "Ready to test";
  let deviceInfo: Record<string, any> = {};
  let testResults: Array<{
    test: string;
    status: "testing" | "success" | "failed";
    message: string;
  }> = [];

  onMount(() => {
    detectDevice();
  });

  function detectDevice() {
    const userAgent = navigator.userAgent;
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      );
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent);

    deviceInfo = {
      userAgent: userAgent,
      isMobile,
      isIOS,
      isAndroid,
      isSafari,
      isChrome,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      currentUrl: window.location.href,
      origin: window.location.origin,
    };

    console.log("🔍 Device info:", deviceInfo);
  }

  async function testMagicLink() {
    if (!email) {
      status = "Please enter an email address";
      return;
    }

    status = "Testing magic link...";
    testResults = [];

    try {
      // Test 1: Basic connection
      testResults.push({
        test: "Supabase Connection",
        status: "testing",
        message: "Testing connection to Supabase...",
      });

      const { data, error } = await supabase.auth.getSession();

      if (error) {
        testResults.push({
          test: "Supabase Connection",
          status: "failed",
          message: `Connection failed: ${error.message}`,
        });
      } else {
        testResults.push({
          test: "Supabase Connection",
          status: "success",
          message: "Successfully connected to Supabase",
        });
      }

      // Test 2: Magic link send
      testResults.push({
        test: "Magic Link Send",
        status: "testing",
        message: "Sending magic link...",
      });

      const callbackUrl = `${window.location.origin}/auth/callback`;
      console.log("🔍 Using callback URL:", callbackUrl);

      const { error: magicError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl,
          shouldCreateUser: false,
        },
      });

      if (magicError) {
        testResults.push({
          test: "Magic Link Send",
          status: "failed",
          message: `Failed to send magic link: ${magicError.message}`,
        });
        status = "Magic link failed";
      } else {
        testResults.push({
          test: "Magic Link Send",
          status: "success",
          message: "Magic link sent successfully! Check your email.",
        });
        status = "Magic link sent! Check your email.";
      }
    } catch (error) {
      testResults.push({
        test: "General Error",
        status: "failed",
        message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      });
      status = "Test failed";
    }
  }

  function getStatusIcon(status: "testing" | "success" | "failed") {
    switch (status) {
      case "success":
        return CheckCircle;
      case "failed":
        return AlertCircle;
      default:
        return Monitor;
    }
  }

  function getStatusColor(status: "testing" | "success" | "failed") {
    switch (status) {
      case "success":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      default:
        return "text-blue-600";
    }
  }
</script>

<svelte:head>
  <title>Mobile Auth Test - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-2xl">
  <h1 class="text-2xl font-bold mb-6 flex items-center gap-2">
    <Smartphone class="w-6 h-6" />
    Mobile Authentication Test
  </h1>

  <div class="space-y-6">
    <!-- Device Information -->
    <Card class="p-4">
      <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <Monitor class="w-5 h-5" />
        Device Information
      </h2>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <strong>Device Type:</strong>
          <span class="font-mono"
            >{deviceInfo.isMobile ? "Mobile" : "Desktop"}</span
          >
        </div>
        <div class="flex justify-between">
          <strong>Platform:</strong>
          <span class="font-mono">{deviceInfo.platform}</span>
        </div>
        <div class="flex justify-between">
          <strong>Browser:</strong>
          <span class="font-mono">
            {deviceInfo.isSafari
              ? "Safari"
              : deviceInfo.isChrome
                ? "Chrome"
                : "Other"}
          </span>
        </div>
        <div class="flex justify-between">
          <strong>Online:</strong>
          <span class="font-mono">{deviceInfo.onLine ? "Yes" : "No"}</span>
        </div>
        <div class="flex justify-between">
          <strong>Cookies:</strong>
          <span class="font-mono"
            >{deviceInfo.cookieEnabled ? "Enabled" : "Disabled"}</span
          >
        </div>
        <div class="flex justify-between">
          <strong>Current URL:</strong>
          <span class="font-mono text-xs break-all"
            >{deviceInfo.currentUrl}</span
          >
        </div>
      </div>
    </Card>

    <!-- Magic Link Test -->
    <Card class="p-4">
      <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <Mail class="w-5 h-5" />
        Magic Link Test
      </h2>

      <div class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium mb-2"
            >Email Address</label
          >
          <Input
            id="email"
            type="email"
            bind:value={email}
            placeholder="test@example.com"
            class="w-full"
          />
        </div>

        <Button on:click={testMagicLink} class="w-full">Test Magic Link</Button>

        <div class="text-sm text-gray-600">
          Status: <strong>{status}</strong>
        </div>
      </div>
    </Card>

    <!-- Test Results -->
    {#if testResults.length > 0}
      <Card class="p-4">
        <h2 class="text-lg font-semibold mb-4">Test Results</h2>
        <div class="space-y-3">
          {#each testResults as result}
            <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <svelte:component
                this={getStatusIcon(result.status)}
                class="w-5 h-5 mt-0.5 {getStatusColor(result.status)}"
              />
              <div class="flex-1">
                <div class="font-medium">{result.test}</div>
                <div class="text-sm text-gray-600">{result.message}</div>
              </div>
            </div>
          {/each}
        </div>
      </Card>
    {/if}

    <!-- Instructions -->
    <Card class="p-4">
      <h2 class="text-lg font-semibold mb-4">Mobile Testing Instructions</h2>
      <div class="space-y-2 text-sm text-gray-600">
        <p>1. Enter your email address above</p>
        <p>2. Click "Test Magic Link" to send a test email</p>
        <p>3. Check your email on this device</p>
        <p>4. Click the magic link in your email</p>
        <p>5. Note any errors or issues that occur</p>
        <p class="text-red-600 font-medium">
          If the link doesn't work, try opening it in a different browser
        </p>
      </div>
    </Card>
  </div>
</div>
