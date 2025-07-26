<script lang="ts">
  import { onMount } from "svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import { Mic, MicOff, Square, Loader2, Play, Download } from "lucide-svelte";

  let isRecording = false;
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let isTranscribing = false;
  let recordingError = "";
  let transcribedText = "";
  let audioUrl = "";

  onMount(() => {
    // Check if browser supports MediaRecorder
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      recordingError = "Your browser doesn't support audio recording.";
    }
  });

  async function startRecording() {
    try {
      recordingError = "";
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await handleRecordingComplete();
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      isRecording = true;
      console.log("🎙️ Recording started");
    } catch (error) {
      console.error("❌ Error starting recording:", error);
      recordingError = "Failed to access microphone. Please check permissions.";
    }
  }

  function stopRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      isRecording = false;
      console.log("⏹️ Recording stopped");
    }
  }

  async function handleRecordingComplete() {
    if (audioChunks.length === 0) return;

    isTranscribing = true;
    recordingError = "";

    try {
      const audioBlob = new Blob(audioChunks, { type: "audio/wav" });

      // Create audio URL for playback
      audioUrl = URL.createObjectURL(audioBlob);

      const formData = new FormData();
      formData.append("file", audioBlob, "recording.wav");
      formData.append("sessionId", "test-session-" + Date.now()); // Use a test session ID

      const response = await fetch("/api/whisper-transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.text && result.text.trim()) {
        transcribedText = result.text.trim();
        console.log("✅ Transcription completed:", result.text);
      } else {
        recordingError = "No speech detected. Please try again.";
      }
    } catch (error) {
      console.error("❌ Transcription error:", error);
      recordingError = "Failed to transcribe audio. Please try again.";
    } finally {
      isTranscribing = false;
      audioChunks = [];
    }
  }

  function downloadAudio() {
    if (audioUrl) {
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = "recording.wav";
      a.click();
    }
  }
</script>

<svelte:head>
  <title>Voice Recording Test - BigStepLabs</title>
</svelte:head>

<div class="min-h-screen bg-background p-8">
  <div class="max-w-2xl mx-auto">
    <Card class="p-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-foreground mb-2">
          🎤 Voice Recording Test
        </h1>
        <p class="text-muted-foreground">
          Test the voice recording and transcription functionality
        </p>
      </div>

      <!-- Recording Controls -->
      <div class="flex justify-center mb-8">
        <Button
          variant={isRecording ? "destructive" : "default"}
          size="lg"
          on:click={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing}
          class="w-32 h-32 rounded-full"
        >
          {#if isTranscribing}
            <Loader2 class="w-8 h-8 animate-spin" />
          {:else if isRecording}
            <Square class="w-8 h-8" />
          {:else}
            <Mic class="w-8 h-8" />
          {/if}
        </Button>
      </div>

      <!-- Status Messages -->
      {#if isRecording}
        <div class="text-center mb-4">
          <div class="flex items-center justify-center space-x-2 text-red-500">
            <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span class="font-medium">Recording... Click to stop</span>
          </div>
        </div>
      {/if}

      {#if isTranscribing}
        <div class="text-center mb-4">
          <div class="flex items-center justify-center space-x-2 text-blue-500">
            <Loader2 class="w-4 h-4 animate-spin" />
            <span class="font-medium">Transcribing audio...</span>
          </div>
        </div>
      {/if}

      {#if recordingError}
        <div class="text-center mb-4">
          <div class="text-destructive font-medium">{recordingError}</div>
        </div>
      {/if}

      <!-- Audio Playback -->
      {#if audioUrl}
        <div class="mb-6 p-4 bg-muted rounded-lg">
          <h3 class="font-medium mb-2">Recorded Audio</h3>
          <div class="flex items-center space-x-4">
            <audio controls src={audioUrl} class="flex-1"></audio>
            <Button variant="outline" size="sm" on:click={downloadAudio}>
              <Download class="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      {/if}

      <!-- Transcription Result -->
      {#if transcribedText}
        <div
          class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
        >
          <h3 class="font-medium mb-2 text-green-800 dark:text-green-200">
            Transcription Result
          </h3>
          <p class="text-green-700 dark:text-green-300">{transcribedText}</p>
        </div>
      {/if}

      <!-- Instructions -->
      <div
        class="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
      >
        <h3 class="font-medium mb-2 text-blue-800 dark:text-blue-200">
          How to Test
        </h3>
        <ol class="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>1. Click the microphone button to start recording</li>
          <li>2. Speak clearly into your microphone</li>
          <li>3. Click the square button to stop recording</li>
          <li>4. Wait for transcription to complete</li>
          <li>5. Review the transcribed text</li>
        </ol>
      </div>
    </Card>
  </div>
</div>
