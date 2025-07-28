<script lang="ts">
  import { onMount, afterUpdate } from "svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import {
    Bot,
    MessageSquare,
    Plus,
    Loader2,
    Send,
    Users,
    Cpu,
    Trash2,
    MoreHorizontal,
    Mic,
    MicOff,
    Square,
    AlertTriangle,
    ChevronLeft,
  } from "lucide-svelte";

  import { authStore } from "$lib/stores/auth";
  import {
    chatStore,
    loadChatSessions,
    loadAvailableAgents,
    createChatSession,
    sendMessage,
    deleteChatSession,
    endChatSession,
    clearChatError,
    setCurrentSession,
  } from "$lib/stores/chat";
  import { isOpenAIConfigured } from "$lib/utils/openai-test";

  // Reactive state
  $: ({ user } = $authStore);
  $: ({
    sessions,
    currentSession,
    messages,
    agents,
    loading,
    sendingMessage,
    typingIndicator,
    error: state,
  } = $chatStore);

  // Local state
  let messageInput = "";
  let messagesContainer: HTMLElement;
  let newChatDialogOpen = false;
  let selectedAgentId = "";

  // Delete confirmation dialog state
  let deleteDialogOpen = false;
  let sessionToDelete: any = null;

  // Voice recording state
  let isRecording = false;
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let isTranscribing = false;
  let recordingError = "";
  let currentAudioUrl: string | null = null;

  // Load data on mount
  onMount(async () => {
    console.log("🔄 Loading chat data...");
    await loadChatSessions();
    await loadAvailableAgents();

    // Check for agent in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const agentFromUrl = urlParams.get("agent");
    if (agentFromUrl && agents.length > 0) {
      const agent = agents.find((a) => a.id === agentFromUrl);
      if (agent) {
        console.log("🎯 Found agent from URL, creating session:", agent.name);
        await handleCreateSession(agentFromUrl);
      }
    }
  });

  // Auto-scroll messages
  afterUpdate(() => {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });

  async function handleCreateSession(agentId: string) {
    if (!user || !agentId) return;

    console.log("🚀 Creating new chat session for agent:", agentId);
    newChatDialogOpen = false;
    await createChatSession(agentId, user.id);
  }

  async function handleSendMessage() {
    if (!messageInput.trim() || !currentSession || sendingMessage) return;

    const content = messageInput.trim();
    const audioUrl = currentAudioUrl; // Store reference before clearing
    messageInput = "";
    currentAudioUrl = null; // Clear the audio URL

    console.log("📤 Sending message with audio URL:", audioUrl);

    // Clear any previous errors
    await clearChatError();
    await sendMessage(content, currentSession.id, audioUrl || undefined);

    // Re-focus the input after sending
    setTimeout(() => {
      const textarea = document.querySelector(
        'textarea[placeholder*="Type your message"]'
      ) as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
      }
    }, 100);
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
    // Shift+Enter should create new line (default behavior)
  }

  function handleDeleteSession(session: any) {
    console.log("🗑️ Delete button clicked for session:", session);
    sessionToDelete = session;
    deleteDialogOpen = true;
  }

  async function confirmDeleteSession() {
    if (!sessionToDelete) {
      console.warn("⚠️ No session to delete");
      return;
    }

    console.log("🗑️ Confirming delete for session:", sessionToDelete.id);
    const result = await deleteChatSession(sessionToDelete.id);

    if (result.error) {
      console.error("❌ Delete failed:", result.error);
    } else {
      console.log("✅ Delete successful");
    }

    deleteDialogOpen = false;
    sessionToDelete = null;
  }

  function cancelDeleteSession() {
    deleteDialogOpen = false;
    sessionToDelete = null;
  }

  async function handleEndSession(session: any) {
    if (!confirm(`Are you sure you want to end this conversation?`)) {
      return;
    }

    await endChatSession(session.id);
  }

  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else if (diffInHours < 48) {
      return `Yesterday at ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;
    } else {
      return (
        date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }) +
        " at " +
        date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
    }
  }

  function formatMessageTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function clearCurrentSession() {
    setCurrentSession(null);
  }

  // Voice recording functions
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
    if (audioChunks.length === 0 || !currentSession) return;

    isTranscribing = true;
    recordingError = "";

    try {
      const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.wav");
      formData.append("sessionId", currentSession?.id || "default");
      formData.append("agentId", currentSession?.agent_id || "");

      const response = await fetch("/api/whisper-transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.text && result.text.trim()) {
        // Insert transcribed text into the input
        messageInput = result.text.trim();
        console.log("✅ Transcription completed:", result.text);

        // Store audio URL for later use (we'll attach it to the message when sent)
        if (result.audioUrl) {
          currentAudioUrl = result.audioUrl;
          console.log("✅ Audio stored and URL captured:", result.audioUrl);
          console.log("🔍 Current audio URL state:", currentAudioUrl);
        } else {
          console.warn("⚠️ No audio URL returned from transcription API");
        }
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

  function getAgentIcon(agent: any): string {
    if (!agent) return "🤖";
    const style = agent.persona?.response_style || "friendly";
    const icons = {
      friendly: "😊",
      professional: "💼",
      casual: "😎",
      formal: "🎓",
      playful: "🎭",
      supportive: "🤝",
    };
    return icons[style as keyof typeof icons] || "🤖";
  }
</script>

<svelte:head>
  <title>Chat - BigStepLabs</title>
  <meta name="description" content="Chat with AI learning assistants" />
</svelte:head>

<div class="h-[calc(100vh-4rem)] flex bg-background">
  <!-- Sessions Sidebar -->
  <div class="w-full md:w-80 border-r border-border bg-card flex flex-col">
    <!-- Sidebar Header -->
    <div class="p-4 border-b border-border">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-foreground">Conversations</h2>
        <Button size="sm" on:click={() => (newChatDialogOpen = true)}>
          <Plus class="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>
    </div>

    <!-- Sessions List -->
    <div class="flex-1 overflow-y-auto">
      {#if loading}
        <div class="flex items-center justify-center py-8">
          <Loader2 class="w-6 h-6 animate-spin text-primary" />
        </div>
      {:else if sessions.length === 0}
        <div class="p-4 text-center">
          <MessageSquare class="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p class="text-muted-foreground mb-3">No conversations yet</p>
          <Button variant="outline" on:click={() => (newChatDialogOpen = true)}>
            <Plus class="w-4 h-4 mr-2" />
            Start Chat
          </Button>
        </div>
      {:else}
        <div class="p-2 space-y-2">
          {#each sessions as session (session.id)}
            <Card
              class="p-3 cursor-pointer hover:bg-accent transition-colors {currentSession?.id ===
              session.id
                ? 'ring-2 ring-primary'
                : ''}"
              on:click={() => setCurrentSession(session)}
            >
              <div class="flex items-start justify-between">
                <div class="flex items-start space-x-3 flex-1 min-w-0">
                  <div
                    class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                  >
                    {getAgentIcon(session.agent)}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm truncate">
                      {session.agent?.name || "AI Assistant"}
                    </p>
                    <p class="text-xs text-muted-foreground">
                      {session.status}
                    </p>
                    {#if session.updated_at}
                      <p class="text-xs text-muted-foreground">
                        {formatTime(session.updated_at)}
                      </p>
                    {/if}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  on:click={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session);
                  }}
                >
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>
            </Card>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Main Chat Area -->
  <div class="hidden md:flex flex-1 flex-col">
    {#if !currentSession}
      <!-- Welcome Screen -->
      <div class="flex-1 flex items-center justify-center">
        <div class="text-center max-w-md">
          <Bot class="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 class="text-xl font-semibold text-foreground mb-2">
            Welcome to BigStepLabs Chat
          </h3>
          <p class="text-muted-foreground mb-6">
            Select a conversation from the sidebar or start a new chat with one
            of our AI learning assistants.
          </p>
          <Button on:click={() => (newChatDialogOpen = true)}>
            <Plus class="w-4 h-4 mr-2" />
            Start New Conversation
          </Button>
        </div>
      </div>
    {:else}
      <!-- Chat Header -->
      <div class="p-4 border-b border-border bg-card">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div
              class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-lg"
            >
              {getAgentIcon(currentSession.agent)}
            </div>
            <div>
              <h3 class="font-semibold text-foreground">
                {currentSession.agent?.name || "AI Assistant"}
              </h3>
              <div
                class="flex items-center space-x-2 text-sm text-muted-foreground"
              >
                <Users class="w-3 h-3" />
                <span>{currentSession.agent?.persona?.name || "Assistant"}</span
                >
                <span>•</span>
                <span class="flex items-center space-x-1">
                  {#if isOpenAIConfigured()}
                    <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span class="text-xs">OpenAI</span>
                  {:else}
                    <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span class="text-xs">No API Key</span>
                  {/if}
                </span>
                <span>•</span>
                <Cpu class="w-3 h-3" />
                <span>{currentSession.agent?.model?.name || "AI Model"}</span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" on:click={clearCurrentSession}>
            Close Chat
          </Button>
        </div>
      </div>

      <!-- Messages -->
      <div
        bind:this={messagesContainer}
        class="flex-1 flex flex-col p-4 min-h-0"
      >
        {#if loading}
          <div class="flex items-center justify-center py-8">
            <Loader2 class="w-6 h-6 animate-spin text-primary" />
            <span class="ml-2 text-muted-foreground">Loading messages...</span>
          </div>
        {:else}
          <!-- Messages Container with proper responsive height -->
          <div
            class="flex-1 space-y-4 overflow-y-auto min-h-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border"
          >
            {#if messages.length === 0}
              <div class="flex items-center justify-center h-full">
                <div class="text-center">
                  <MessageSquare
                    class="w-12 h-12 text-muted-foreground mx-auto mb-3"
                  />
                  <p class="text-muted-foreground">
                    Start the conversation! Send a message to {currentSession
                      .agent?.name || "your assistant"}.
                  </p>
                </div>
              </div>
            {:else}
              {#each messages as message (message.id)}
                <div
                  class={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    class={`${message.role === "user" ? "max-w-[70%]" : "max-w-[85%]"} ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    } rounded-lg px-4 py-2`}
                  >
                    <p class="whitespace-pre-wrap">{message.content}</p>

                    <!-- Audio Playback for Voice Messages -->
                    {#if message.metadata?.audio_url}
                      <div
                        class="mt-2 p-2 bg-background/50 rounded-md border border-border/50"
                      >
                        <div class="flex items-center space-x-2 mb-1">
                          <Mic class="w-3 h-3 text-muted-foreground" />
                          <span
                            class="text-xs font-medium text-muted-foreground"
                            >Voice Message</span
                          >
                        </div>
                        <audio
                          controls
                          src={message.metadata.audio_url}
                          class="w-full h-8"
                          preload="none"
                        ></audio>
                      </div>
                    {:else if message.metadata?.is_voice_message}
                      <!-- Debug: Show when voice message flag is set but no audio URL -->
                      <div class="mt-2 text-xs text-muted-foreground">
                        🎵 Voice message (audio URL missing)
                      </div>
                    {/if}

                    <p
                      class={`text-xs mt-1 ${
                        message.role === "user"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground/70"
                      }`}
                    >
                      {formatMessageTime(message.created_at)}
                    </p>
                  </div>
                </div>
              {/each}
            {/if}

            <!-- Typing Indicator -->
            {#if typingIndicator}
              <div class="flex justify-start">
                <div
                  class="bg-muted text-muted-foreground rounded-lg px-4 py-2"
                >
                  <div class="flex items-center space-x-1">
                    <div class="flex space-x-1">
                      <div
                        class="w-2 h-2 bg-current rounded-full animate-pulse"
                      ></div>
                      <div
                        class="w-2 h-2 bg-current rounded-full animate-pulse"
                        style="animation-delay: 0.2s"
                      ></div>
                      <div
                        class="w-2 h-2 bg-current rounded-full animate-pulse"
                        style="animation-delay: 0.4s"
                      ></div>
                    </div>
                    <span class="text-xs ml-2">
                      {currentSession.agent?.name || "Assistant"} is typing...
                    </span>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Message Input -->
      <div class="p-4 border-t border-border bg-background flex-shrink-0">
        <div class="flex space-x-2">
          <textarea
            bind:value={messageInput}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            disabled={sendingMessage ||
              currentSession.status !== "active" ||
              isRecording}
            on:keydown={handleKeyPress}
            class="flex-1 min-h-[40px] max-h-32 resize-none border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
            rows="1"
          ></textarea>

          <!-- Voice Recording Button -->
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="sm"
            on:click={isRecording ? stopRecording : startRecording}
            disabled={sendingMessage ||
              currentSession.status !== "active" ||
              isTranscribing}
            class="self-end"
            title={isRecording ? "Stop recording" : "Start voice recording"}
          >
            {#if isTranscribing}
              <Loader2 class="w-4 h-4 animate-spin" />
            {:else if isRecording}
              <Square class="w-4 h-4" />
            {:else}
              <Mic class="w-4 h-4" />
            {/if}
          </Button>

          <Button
            on:click={handleSendMessage}
            disabled={!messageInput.trim() ||
              sendingMessage ||
              currentSession.status !== "active" ||
              isRecording}
            class="self-end"
          >
            {#if sendingMessage}
              <Loader2 class="w-4 h-4 animate-spin" />
            {:else}
              <Send class="w-4 h-4" />
            {/if}
          </Button>
        </div>

        <!-- Recording Status and Error Messages -->
        {#if isRecording}
          <div
            class="flex items-center space-x-2 mt-2 text-sm text-muted-foreground"
          >
            <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>Recording... Click the square button to stop</span>
          </div>
        {/if}

        {#if isTranscribing}
          <div
            class="flex items-center space-x-2 mt-2 text-sm text-muted-foreground"
          >
            <Loader2 class="w-4 h-4 animate-spin" />
            <span>Transcribing audio...</span>
          </div>
        {/if}

        {#if recordingError}
          <div class="mt-2 text-sm text-destructive">
            {recordingError}
          </div>
        {/if}

        {#if currentSession.status !== "active"}
          <p class="text-sm text-muted-foreground mt-2">
            This conversation has ended. Start a new conversation to continue
            chatting.
          </p>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Mobile Chat View -->
  {#if currentSession}
    <div class="md:hidden flex flex-col h-[calc(100vh-4rem)]">
      <!-- Mobile Chat Header -->
      <div class="p-4 border-b border-border bg-card">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <button
              on:click={() => setCurrentSession(null)}
              class="p-2 hover:bg-accent rounded-md"
            >
              <ChevronLeft class="w-5 h-5" />
            </button>
            <div
              class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm"
            >
              {getAgentIcon(currentSession.agent)}
            </div>
            <div>
              <h3 class="font-semibold text-foreground">
                {currentSession.agent?.name || "AI Assistant"}
              </h3>
              <p class="text-xs text-muted-foreground">
                {currentSession.status}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Messages -->
      <div class="flex-1 flex flex-col p-4 min-h-0">
        {#if loading}
          <div class="flex items-center justify-center py-8">
            <Loader2 class="w-6 h-6 animate-spin text-primary" />
            <span class="ml-2 text-muted-foreground">Loading messages...</span>
          </div>
        {:else}
          <div class="flex-1 space-y-4 overflow-y-auto min-h-0">
            {#if messages.length === 0}
              <div class="flex items-center justify-center h-full">
                <div class="text-center">
                  <MessageSquare
                    class="w-12 h-12 text-muted-foreground mx-auto mb-3"
                  />
                  <p class="text-muted-foreground">
                    Start the conversation! Send a message to {currentSession
                      .agent?.name || "your assistant"}.
                  </p>
                </div>
              </div>
            {:else}
              {#each messages as message (message.id)}
                <div
                  class={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    class={`${message.role === "user" ? "max-w-[85%]" : "max-w-[90%]"} ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    } rounded-lg px-3 py-2`}
                  >
                    <p class="whitespace-pre-wrap text-sm">{message.content}</p>

                    <!-- Audio Playback for Voice Messages -->
                    {#if message.metadata?.audio_url}
                      <div
                        class="mt-2 p-2 bg-background/50 rounded-md border border-border/50"
                      >
                        <div class="flex items-center space-x-2 mb-1">
                          <Mic class="w-3 h-3 text-muted-foreground" />
                          <span
                            class="text-xs font-medium text-muted-foreground"
                            >Voice Message</span
                          >
                        </div>
                        <audio
                          controls
                          src={message.metadata.audio_url}
                          class="w-full h-8"
                          preload="none"
                        ></audio>
                      </div>
                    {/if}

                    <p
                      class={`text-xs mt-1 ${
                        message.role === "user"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground/70"
                      }`}
                    >
                      {formatMessageTime(message.created_at)}
                    </p>
                  </div>
                </div>
              {/each}
            {/if}

            <!-- Typing Indicator -->
            {#if typingIndicator}
              <div class="flex justify-start">
                <div
                  class="bg-muted text-muted-foreground rounded-lg px-3 py-2"
                >
                  <div class="flex items-center space-x-1">
                    <div class="flex space-x-1">
                      <div
                        class="w-2 h-2 bg-current rounded-full animate-pulse"
                      ></div>
                      <div
                        class="w-2 h-2 bg-current rounded-full animate-pulse"
                        style="animation-delay: 0.2s"
                      ></div>
                      <div
                        class="w-2 h-2 bg-current rounded-full animate-pulse"
                        style="animation-delay: 0.4s"
                      ></div>
                    </div>
                    <span class="text-xs ml-2">
                      {currentSession.agent?.name || "Assistant"} is typing...
                    </span>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Mobile Message Input -->
      <div class="p-4 border-t border-border bg-background flex-shrink-0">
        <div class="flex space-x-2">
          <textarea
            bind:value={messageInput}
            placeholder="Type your message..."
            disabled={sendingMessage ||
              currentSession.status !== "active" ||
              isRecording}
            on:keydown={handleKeyPress}
            class="flex-1 min-h-[40px] max-h-24 resize-none border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
            rows="1"
          ></textarea>

          <!-- Voice Recording Button -->
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="sm"
            on:click={isRecording ? stopRecording : startRecording}
            disabled={sendingMessage ||
              currentSession.status !== "active" ||
              isTranscribing}
            class="self-end"
            title={isRecording ? "Stop recording" : "Start voice recording"}
          >
            {#if isTranscribing}
              <Loader2 class="w-4 h-4 animate-spin" />
            {:else if isRecording}
              <Square class="w-4 h-4" />
            {:else}
              <Mic class="w-4 h-4" />
            {/if}
          </Button>

          <Button
            on:click={handleSendMessage}
            disabled={!messageInput.trim() ||
              sendingMessage ||
              currentSession.status !== "active" ||
              isRecording}
            class="self-end"
          >
            {#if sendingMessage}
              <Loader2 class="w-4 h-4 animate-spin" />
            {:else}
              <Send class="w-4 h-4" />
            {/if}
          </Button>
        </div>

        <!-- Recording Status and Error Messages -->
        {#if isRecording}
          <div
            class="flex items-center space-x-2 mt-2 text-sm text-muted-foreground"
          >
            <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>Recording... Tap to stop</span>
          </div>
        {/if}

        {#if isTranscribing}
          <div
            class="flex items-center space-x-2 mt-2 text-sm text-muted-foreground"
          >
            <Loader2 class="w-4 h-4 animate-spin" />
            <span>Transcribing audio...</span>
          </div>
        {/if}

        {#if recordingError}
          <div class="mt-2 text-sm text-destructive">
            {recordingError}
          </div>
        {/if}

        {#if currentSession.status !== "active"}
          <p class="text-sm text-muted-foreground mt-2">
            This conversation has ended. Start a new conversation to continue
            chatting.
          </p>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Mobile Welcome Screen -->
    <div class="md:hidden flex-1 flex items-center justify-center p-4">
      <div class="text-center max-w-sm">
        <Bot class="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 class="text-xl font-semibold text-foreground mb-2">
          Welcome to BigStepLabs Chat
        </h3>
        <p class="text-muted-foreground mb-6 text-sm">
          Select a conversation from the list or start a new chat with one of
          our AI learning assistants.
        </p>
        <Button on:click={() => (newChatDialogOpen = true)} class="w-full">
          <Plus class="w-4 h-4 mr-2" />
          Start New Conversation
        </Button>
      </div>
    </div>
  {/if}
</div>

<!-- New Chat Dialog -->
<Dialog bind:open={newChatDialogOpen} title="Start New Conversation">
  <div class="space-y-4">
    <p class="text-muted-foreground">
      Choose an AI assistant to start a conversation with:
    </p>

    {#if agents.length === 0}
      <div class="text-center py-8">
        <Bot class="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p class="text-muted-foreground mb-3">No active agents available</p>
        <p class="text-sm text-muted-foreground">
          Contact your administrator to set up AI agents.
        </p>
      </div>
    {:else}
      <div class="space-y-2 max-h-64 overflow-y-auto">
        {#each agents as agent (agent.id)}
          <label class="relative block">
            <input
              type="radio"
              name="selectedAgent"
              value={agent.id}
              bind:group={selectedAgentId}
              class="sr-only peer"
            />
            <div
              class="border border-input rounded-lg p-4 cursor-pointer transition-colors peer-checked:border-primary peer-checked:bg-primary/5 hover:bg-accent"
            >
              <div class="flex items-start space-x-3">
                <div
                  class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                >
                  {getAgentIcon(agent)}
                </div>
                <div class="flex-1">
                  <h4 class="font-medium text-foreground">{agent.name}</h4>
                  {#if agent.description}
                    <p class="text-sm text-muted-foreground mt-1">
                      {agent.description}
                    </p>
                  {/if}
                  <div
                    class="flex items-center space-x-4 mt-2 text-xs text-muted-foreground"
                  >
                    <span class="flex items-center">
                      <Users class="w-3 h-3 mr-1" />
                      Assistant
                    </span>
                    <span class="flex items-center">
                      <Cpu class="w-3 h-3 mr-1" />
                      AI Model
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </label>
        {/each}
      </div>

      <div class="flex justify-end space-x-3">
        <Button variant="outline" on:click={() => (newChatDialogOpen = false)}>
          Cancel
        </Button>
        <Button
          disabled={!selectedAgentId}
          on:click={() => handleCreateSession(selectedAgentId)}
        >
          Start Chat
        </Button>
      </div>
    {/if}
  </div>
</Dialog>

<!-- Delete Confirmation Dialog -->
<Dialog bind:open={deleteDialogOpen} title="Delete Conversation">
  <div class="space-y-4">
    <div class="flex items-start space-x-3">
      <AlertTriangle class="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
      <div>
        <p class="text-foreground font-medium">
          Are you sure you want to delete this conversation?
        </p>
        <p class="text-sm text-muted-foreground mt-1">
          This action cannot be undone. All messages in this conversation will
          be permanently deleted.
        </p>
        {#if sessionToDelete}
          <div class="mt-3 p-3 bg-muted rounded-lg">
            <p class="text-sm font-medium">
              {sessionToDelete.agent?.name || "AI Assistant"}
            </p>
            <p class="text-xs text-muted-foreground">
              {sessionToDelete.message_count || 0} messages
            </p>
          </div>
        {/if}
      </div>
    </div>

    <div class="flex justify-end space-x-3">
      <Button variant="outline" on:click={cancelDeleteSession}>Cancel</Button>
      <Button variant="destructive" on:click={confirmDeleteSession}>
        Delete Conversation
      </Button>
    </div>
  </div>
</Dialog>
