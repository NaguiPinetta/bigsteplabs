<script lang="ts">
  import AudioPlayer from "$lib/components/ui/audio-player.svelte";
  import Button from "$lib/components/ui/button.svelte";

  // The actual audio URL from the database
  const testAudioUrl = "https://oegldjlecdhxheiwtxxu.supabase.co/storage/v1/object/public/audio-messages/7cc2fd01-85bc-4f65-87f0-6f86149932a3/1753987725670_audio.webm";
  
  let showPlayer = false;

  function togglePlayer() {
    showPlayer = !showPlayer;
  }
</script>

<div class="p-8 max-w-2xl mx-auto">
  <h1 class="text-2xl font-bold mb-6">Audio Playback Test</h1>
  
  <div class="space-y-4">
    <div class="border rounded-lg p-4">
      <h3 class="font-semibold mb-2">Test Audio URL</h3>
      <p class="text-sm text-muted-foreground mb-4 break-all">
        {testAudioUrl}
      </p>
      
      <Button on:click={togglePlayer}>
        {showPlayer ? 'Hide' : 'Show'} Audio Player
      </Button>
      
      {#if showPlayer}
        <div class="mt-4">
          <h4 class="font-medium mb-2">AudioPlayer Component Test</h4>
          <AudioPlayer 
            src={testAudioUrl} 
            title="Test Audio - Hallo, hallo, hallo" 
          />
        </div>
      {/if}
    </div>

    <div class="border rounded-lg p-4">
      <h3 class="font-semibold mb-2">Native HTML Audio Test</h3>
      <audio controls src={testAudioUrl} class="w-full">
        Your browser does not support the audio element.
      </audio>
    </div>

    <div class="border rounded-lg p-4">
      <h3 class="font-semibold mb-2">Debug Info</h3>
      <div class="text-sm space-y-1">
        <p><strong>URL:</strong> {testAudioUrl}</p>
        <p><strong>Protocol:</strong> {testAudioUrl.startsWith('https') ? 'HTTPS' : 'HTTP'}</p>
        <p><strong>Domain:</strong> {new URL(testAudioUrl).hostname}</p>
        <p><strong>Path:</strong> {new URL(testAudioUrl).pathname}</p>
      </div>
    </div>
  </div>
</div> 