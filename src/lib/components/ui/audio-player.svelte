<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Play, Pause, Volume2, VolumeX } from "lucide-svelte";

  export let src: string;
  export let title: string = "";
  export let autoPlay: boolean = false;

  let audio: HTMLAudioElement;
  let isPlaying = false;
  let currentTime = 0;
  let duration = 0;
  let volume = 1;
  let isMuted = false;
  let isLoading = true;
  let hasError = false;

  let progressBar: HTMLDivElement;
  let volumeSlider: HTMLInputElement;

  onMount(() => {
    if (audio) {
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("error", handleError);
      audio.addEventListener("canplay", handleCanPlay);

      if (autoPlay) {
        audio.play().catch(console.error);
      }
    }
  });

  onDestroy(() => {
    if (audio) {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("canplay", handleCanPlay);
    }
  });

  function handleLoadedMetadata() {
    duration = audio.duration;
    isLoading = false;
  }

  function handleTimeUpdate() {
    currentTime = audio.currentTime;
  }

  function handleEnded() {
    isPlaying = false;
    currentTime = 0;
  }

  function handleError() {
    hasError = true;
    isLoading = false;
  }

  function handleCanPlay() {
    isLoading = false;
  }

  function togglePlay() {
    if (!audio || hasError) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
    isPlaying = !isPlaying;
  }

  function handleProgressClick(event: MouseEvent) {
    if (!audio || hasError) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    audio.currentTime = newTime;
    currentTime = newTime;
  }

  function handleVolumeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    volume = parseFloat(target.value);
    audio.volume = volume;
    isMuted = volume === 0;
  }

  function toggleMute() {
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      isMuted = false;
    } else {
      audio.volume = 0;
      isMuted = true;
    }
  }

  function formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds === Infinity || seconds === -Infinity)
      return "0:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function getProgressPercentage(): number {
    if (duration === 0 || isNaN(duration) || duration === Infinity) return 0;
    return (currentTime / duration) * 100;
  }
</script>

<div
  class="audio-player bg-background/50 rounded-md border border-border/50 p-3"
>
  <!-- Voice Message Label -->
  <div class="flex items-center space-x-2 mb-2">
    <svg
      class="w-3 h-3 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
      ></path>
    </svg>
    <span class="text-xs font-medium text-muted-foreground">Voice Message</span>
  </div>

  <!-- Audio Element (hidden) -->
  <audio
    bind:this={audio}
    {src}
    preload="metadata"
    on:loadedmetadata={handleLoadedMetadata}
    on:timeupdate={handleTimeUpdate}
    on:ended={handleEnded}
    on:error={handleError}
    on:canplay={handleCanPlay}
  ></audio>

  <!-- Controls -->
  <div class="flex items-center space-x-3">
    <!-- Play/Pause Button -->
    <button
      on:click={togglePlay}
      disabled={hasError || isLoading}
      class="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {#if isLoading}
        <div
          class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
        ></div>
      {:else if hasError}
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          ></path>
        </svg>
      {:else if isPlaying}
        <Pause class="w-4 h-4" />
      {:else}
        <Play class="w-4 h-4" />
      {/if}
    </button>

    <!-- Progress Bar -->
    <div class="flex-1">
      <div
        bind:this={progressBar}
        on:click={handleProgressClick}
        class="relative h-2 bg-muted rounded-full cursor-pointer overflow-hidden"
      >
        <div
          class="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-100"
          style="width: {getProgressPercentage()}%"
        ></div>
      </div>
    </div>

    <!-- Time Display -->
    <div class="text-xs text-muted-foreground min-w-[40px] text-right">
      {formatTime(currentTime)} / {formatTime(duration)}
    </div>

    <!-- Volume Control -->
    <div class="flex items-center space-x-1">
      <button
        on:click={toggleMute}
        class="p-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        {#if isMuted || volume === 0}
          <VolumeX class="w-3 h-3" />
        {:else}
          <Volume2 class="w-3 h-3" />
        {/if}
      </button>
      <input
        bind:this={volumeSlider}
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={volume}
        on:input={handleVolumeChange}
        class="w-12 h-1 bg-muted rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  </div>

  <!-- Error Message -->
  {#if hasError}
    <div class="text-xs text-destructive mt-2">Failed to load audio</div>
  {/if}
</div>

<style>
  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: hsl(var(--primary));
    cursor: pointer;
  }

  .slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: hsl(var(--primary));
    cursor: pointer;
    border: none;
  }

  .slider::-ms-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: hsl(var(--primary));
    cursor: pointer;
  }
</style>
