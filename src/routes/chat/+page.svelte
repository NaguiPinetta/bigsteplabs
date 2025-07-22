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
    messageInput = "";

    // Clear any previous errors
    await clearChatError();
    await sendMessage(content, currentSession.id);

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

  async function handleDeleteSession(session: any) {
    if (!confirm(`Are you sure you want to delete this conversation?`)) {
      return;
    }

    await deleteChatSession(session.id);
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
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
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
  <div class="w-80 border-r border-border bg-card flex flex-col">
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
  <div class="flex-1 flex flex-col">
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
            disabled={sendingMessage || currentSession.status !== "active"}
            on:keydown={handleKeyPress}
            class="flex-1 min-h-[40px] max-h-32 resize-none border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
            rows="1"
          ></textarea>
          <Button
            on:click={handleSendMessage}
            disabled={!messageInput.trim() ||
              sendingMessage ||
              currentSession.status !== "active"}
            class="self-end"
          >
            {#if sendingMessage}
              <Loader2 class="w-4 h-4 animate-spin" />
            {:else}
              <Send class="w-4 h-4" />
            {/if}
          </Button>
        </div>

        {#if currentSession.status !== "active"}
          <p class="text-sm text-muted-foreground mt-2">
            This conversation has ended. Start a new conversation to continue
            chatting.
          </p>
        {/if}
      </div>
    {/if}
  </div>
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
