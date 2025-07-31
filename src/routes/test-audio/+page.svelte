<script lang="ts">
  import AudioPlayer from "$lib/components/ui/audio-player.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import { onMount } from "svelte";

  let testAudioUrl = "";
  let testTitle = "Test Audio";
  let testResults: any[] = [];

  // Test with a sample audio URL (you can replace this with a real one)
  const sampleAudioUrl =
    "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav";

  onMount(() => {
    console.log("🧪 Audio test page mounted");
  });

  async function testAudioStorage() {
    try {
      console.log("🧪 Testing audio storage...");
      const response = await fetch("/api/test-audio-storage");
      const result = await response.json();
      console.log("🧪 Audio storage test result:", result);
      testResults.push({ test: "Audio Storage", result });
    } catch (error) {
      console.error("❌ Audio storage test failed:", error);
      testResults.push({
        test: "Audio Storage",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async function testMessages() {
    try {
      console.log("🧪 Testing messages...");
      const response = await fetch("/api/test-messages");
      const result = await response.json();
      console.log("🧪 Messages test result:", result);
      testResults.push({ test: "Messages", result });
    } catch (error) {
      console.error("❌ Messages test failed:", error);
      testResults.push({
        test: "Messages",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async function setupAudioStorage() {
    try {
      console.log("🔧 Setting up audio storage...");
      const response = await fetch("/api/setup-audio-storage", {
        method: "POST",
      });
      const result = await response.json();
      console.log("🔧 Audio storage setup result:", result);
      testResults.push({ test: "Audio Storage Setup", result });
    } catch (error) {
      console.error("❌ Audio storage setup failed:", error);
      testResults.push({
        test: "Audio Storage Setup",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async function testSessionId() {
    try {
      console.log("🧪 Testing sessionId...");
      
      // Create a test form data with sample values
      const formData = new FormData();
      formData.append("sessionId", "test-session-id");
      formData.append("agentId", "test-agent-id");
      
      const response = await fetch("/api/test-session-id", { 
        method: "POST",
        body: formData
      });
      const result = await response.json();
      console.log("🧪 SessionId test result:", result);
      testResults.push({ test: "SessionId Test", result });
    } catch (error) {
      console.error("❌ SessionId test failed:", error);
      testResults.push({
        test: "SessionId Test",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async function testSimpleAudioStorage() {
    try {
      console.log("🧪 Testing simple audio storage...");
      const response = await fetch("/api/simple-audio-test");
      const result = await response.json();
      console.log("🧪 Simple audio storage test result:", result);
      testResults.push({ test: "Simple Audio Storage Test", result });
    } catch (error) {
      console.error("❌ Simple audio storage test failed:", error);
      testResults.push({
        test: "Simple Audio Storage Test",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  function testAudioPlayer() {
    console.log("🧪 Testing AudioPlayer with URL:", testAudioUrl);
    testResults.push({ test: "AudioPlayer", url: testAudioUrl });
  }
</script>

<svelte:head>
  <title>Audio Test Page</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-4xl">
  <h1 class="text-3xl font-bold mb-6">Audio Playback Test Page</h1>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Test Controls -->
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Test Controls</h2>

      <div class="space-y-2">
        <label class="text-sm font-medium">Test Audio URL:</label>
        <Input
          bind:value={testAudioUrl}
          placeholder="Enter audio URL to test"
          class="w-full"
        />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium">Test Title:</label>
        <Input
          bind:value={testTitle}
          placeholder="Enter title for audio"
          class="w-full"
        />
      </div>

      <div class="flex gap-2">
        <Button on:click={testAudioStorage}>Test Audio Storage</Button>
        <Button on:click={testMessages}>Test Messages</Button>
        <Button on:click={setupAudioStorage}>Setup Audio Storage</Button>
        <Button on:click={testSessionId}>Test SessionId</Button>
        <Button on:click={testSimpleAudioStorage}>Test Simple Audio Storage</Button>
        <Button on:click={testAudioPlayer}>Test AudioPlayer</Button>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium">Sample Audio (Bell):</label>
        <AudioPlayer src={sampleAudioUrl} title="Sample Bell Sound" />
      </div>
    </div>

    <!-- Test Results -->
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Test Results</h2>

      <div class="space-y-2">
        {#if testResults.length === 0}
          <p class="text-muted-foreground">
            No test results yet. Run some tests above.
          </p>
        {:else}
          {#each testResults as result, index}
            <div class="border rounded-lg p-3">
              <h3 class="font-medium">{result.test}</h3>
              {#if result.error}
                <p class="text-red-500 text-sm">{result.error}</p>
              {:else if result.url}
                <p class="text-sm">Testing URL: {result.url}</p>
                <AudioPlayer src={result.url} title={testTitle} />
              {:else}
                <pre
                  class="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(result.result, null, 2)}
                </pre>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>

  <!-- Custom Audio Player Test -->
  {#if testAudioUrl}
    <div class="mt-6 border-t pt-6">
      <h2 class="text-xl font-semibold mb-4">Custom Audio Player Test</h2>
      <AudioPlayer src={testAudioUrl} title={testTitle} />
    </div>
  {/if}
</div>
