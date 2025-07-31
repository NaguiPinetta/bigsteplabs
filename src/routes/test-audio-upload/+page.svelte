<script lang="ts">
  import { onMount } from "svelte";
  import Button from "$lib/components/ui/button.svelte";
  import AudioPlayer from "$lib/components/ui/audio-player.svelte";

  let isRecording = false;
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let isTranscribing = false;
  let transcriptionResult: any = null;
  let audioUrl: string | null = null;
  let recordingTimer: ReturnType<typeof setInterval> | null = null;
  let recordingDuration = 0;

  async function startRecording() {
    try {
      recordingDuration = 0;
      console.log("🎙️ Starting audio recording...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
        },
        video: false,
      });

      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/wav",
      ];

      let selectedMimeType = null;
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      if (!selectedMimeType) {
        throw new Error("No supported audio MIME type found");
      }

      mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000,
      });
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (recordingTimer) {
          clearInterval(recordingTimer);
          recordingTimer = null;
        }
        await handleRecordingComplete();
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000);
      isRecording = true;

      // Start recording timer for 10-second limit
      recordingTimer = setInterval(() => {
        recordingDuration += 1;
        if (recordingDuration >= 10) {
          console.log(
            "⏰ 10-second recording limit reached, stopping automatically"
          );
          stopRecording();
        }
      }, 1000);
    } catch (error) {
      console.error("❌ Error starting recording:", error);
    }
  }

  function stopRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      isRecording = false;
      if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
      }
    }
  }

  async function handleRecordingComplete() {
    if (audioChunks.length === 0) return;

    isTranscribing = true;

    try {
      const audioBlob = new Blob(audioChunks, {
        type: "audio/webm",
      });

      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");
      formData.append("sessionId", "test-session");

      console.log("📤 Testing audio upload...");

      const response = await fetch("/api/test-audio-upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      console.log("📋 Upload result:", result);

      if (result.success) {
        audioUrl = result.audioUrl;
        console.log("✅ Audio URL:", audioUrl);
      } else {
        console.error("❌ Upload failed:", result);
      }
    } catch (error) {
      console.error("❌ Error:", error);
    } finally {
      isTranscribing = false;
      audioChunks = [];
    }
  }
</script>

<div class="p-8 max-w-2xl mx-auto">
  <h1 class="text-2xl font-bold mb-6">Audio Upload Test</h1>

  <div class="space-y-4">
    <div class="flex space-x-4">
      <Button
        variant={isRecording ? "destructive" : "outline"}
        on:click={isRecording ? stopRecording : startRecording}
        disabled={isTranscribing}
      >
        {#if isTranscribing}
          Transcribing...
        {:else if isRecording}
          Stop Recording
        {:else}
          Start Recording
        {/if}
      </Button>
    </div>

    {#if isRecording}
      <div class="flex items-center space-x-2 text-sm text-muted-foreground">
        <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span>Recording... {recordingDuration}s / 10s</span>
      </div>
    {/if}

    {#if audioUrl}
      <div class="border rounded-lg p-4">
        <h3 class="font-semibold mb-2">Audio Player Test</h3>
        <AudioPlayer src={audioUrl} title="Test Audio" />
        <div class="mt-2 text-sm text-muted-foreground">
          Audio URL: {audioUrl}
        </div>
      </div>
    {/if}

    {#if transcriptionResult}
      <div class="border rounded-lg p-4">
        <h3 class="font-semibold mb-2">Transcription Result</h3>
        <pre class="text-sm bg-muted p-2 rounded">{JSON.stringify(
            transcriptionResult,
            null,
            2
          )}</pre>
      </div>
    {/if}
  </div>
</div>
