<script lang="ts">
  import { onMount } from "svelte";
  import { authStore } from "$lib/stores/auth";
  import {
    chatStore,
    loadChatSessions,
    loadAvailableAgents,
    createChatSession,
    setCurrentSession,
    sendMessage,
    deleteChatSession,
    endChatSession,
    clearCurrentSession,
    clearChatError,
  } from "$lib/stores/chat";

  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import {
    MessageSquare,
    Plus,
    Send,
    Trash2,
    StopCircle,
    Bot,
    Loader2,
    AlertCircle,
    Users,
    Cpu,
    MoreVertical,
  } from "lucide-svelte";

  let newChatDialogOpen = false;
  let selectedAgentId = "";
  let messageInput = "";
  let messagesContainer: HTMLElement;

  $: user = $authStore.user;
  $: state = $chatStore;
  $: sessions = state.sessions;
  $: currentSession = state.currentSession;
  $: messages = state.messages;
  $: agents = state.agents;
  $: loading = state.loading;
  $: sendingMessage = state.sendingMessage;
  $: typingIndicator = state.typingIndicator;

  onMount(async () => {
    if (user) {
      await Promise.all([loadChatSessions(), loadAvailableAgents()]);
    }
  });

  // Auto-scroll messages to bottom
  $: if (messages && messagesContainer) {
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
  }

  async function handleCreateChat() {
    if (!user || !selectedAgentId) return;

    const result = await createChatSession(selectedAgentId, user.id);

    if (result.data) {
      selectedAgentId = "";
      newChatDialogOpen = false;
    }
  }

  async function handleSendMessage() {
    if (!messageInput.trim() || !currentSession || sendingMessage) return;

    const content = messageInput.trim();
    messageInput = "";

    await sendMessage(content, currentSession.id);
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
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

  function getAgentIcon(agent: any): string {
    const style = agent.persona?.response_style;
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
          <Button size="sm" on:click={() => (newChatDialogOpen = true)}>
            <Plus class="w-4 h-4 mr-2" />
            Start First Chat
          </Button>
        </div>
      {:else}
        <div class="p-2">
          {#each sessions as session (session.id)}
            <div
              class={`w-full text-left p-3 rounded-lg mb-2 transition-colors group cursor-pointer ${
                currentSession?.id === session.id
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-accent"
              }`}
              on:click={() => setCurrentSession(session)}
              on:keydown={(e) =>
                e.key === "Enter" && setCurrentSession(session)}
              tabindex="0"
              role="button"
            >
              <div class="flex items-start justify-between">
                <div class="flex items-center space-x-3 flex-1 min-w-0">
                  <div
                    class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm"
                  >
                    {getAgentIcon(session.agent)}
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-foreground truncate">
                      {session.agent?.name || "Unknown Agent"}
                    </h4>
                    <p class="text-sm text-muted-foreground truncate">
                      {session.agent?.persona?.response_style || "AI Assistant"}
                    </p>
                  </div>
                </div>
                <div
                  class="flex items-center space-x-1 opacity-0 group-hover:opacity-100"
                >
                  <button
                    on:click|stopPropagation={() => handleEndSession(session)}
                    class="p-1 hover:bg-accent rounded"
                    title="End conversation"
                  >
                    <StopCircle class="w-4 h-4" />
                  </button>
                  <button
                    on:click|stopPropagation={() =>
                      handleDeleteSession(session)}
                    class="p-1 hover:bg-destructive/20 rounded text-destructive"
                    title="Delete conversation"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div class="flex items-center justify-between mt-2">
                <span
                  class={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    session.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
                  }`}
                >
                  {session.status}
                </span>
                <span class="text-xs text-muted-foreground">
                  {formatTime(session.updated_at)}
                </span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Chat Area -->
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
                <span>{currentSession.agent?.persona?.name}</span>
                <span>•</span>
                <Cpu class="w-3 h-3" />
                <span>{currentSession.agent?.model?.name}</span>
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
        class="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {#if loading}
          <div class="flex items-center justify-center py-8">
            <Loader2 class="w-6 h-6 animate-spin text-primary" />
            <span class="ml-2 text-muted-foreground">Loading messages...</span>
          </div>
        {:else if messages.length === 0}
          <div class="text-center py-8">
            <MessageSquare
              class="w-12 h-12 text-muted-foreground mx-auto mb-3"
            />
            <p class="text-muted-foreground">
              Start the conversation! Send a message to {currentSession.agent
                ?.name}.
            </p>
          </div>
        {:else}
          {#each messages as message (message.id)}
            <div
              class={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                class={`max-w-[70%] ${
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
            <div class="bg-muted text-muted-foreground rounded-lg px-4 py-2">
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
                  {currentSession.agent?.name} is typing...
                </span>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Message Input -->
      <div class="p-4 border-t border-border bg-card">
        {#if state.error}
          <div
            class="mb-4 bg-destructive/15 border border-destructive/20 rounded-md p-3"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <AlertCircle class="w-4 h-4 text-destructive mr-2" />
                <span class="text-sm text-destructive">{state.error}</span>
              </div>
              <Button variant="ghost" size="sm" on:click={clearChatError}>
                Dismiss
              </Button>
            </div>
          </div>
        {/if}

        <div class="flex space-x-2">
          <Input
            bind:value={messageInput}
            placeholder="Type your message..."
            disabled={sendingMessage || currentSession.status !== "active"}
            on:keydown={handleKeyPress}
            class="flex-1"
          />
          <Button
            on:click={handleSendMessage}
            disabled={!messageInput.trim() ||
              sendingMessage ||
              currentSession.status !== "active"}
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
              bind:group={selectedAgentId}
              value={agent.id}
              class="sr-only"
            />
            <div
              class={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedAgentId === agent.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div class="flex items-start space-x-3">
                <div
                  class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-lg"
                >
                  {getAgentIcon(agent)}
                </div>
                <div class="flex-1">
                  <h4 class="font-medium text-foreground">{agent.name}</h4>
                  <p class="text-sm text-primary mb-2">
                    {agent.persona?.name} • {agent.persona?.response_style}
                  </p>
                  {#if agent.description}
                    <p class="text-sm text-muted-foreground">
                      {agent.description}
                    </p>
                  {/if}
                  <div
                    class="flex items-center space-x-2 mt-2 text-xs text-muted-foreground"
                  >
                    <Cpu class="w-3 h-3" />
                    <span>{agent.model?.name} ({agent.model?.provider})</span>
                  </div>
                </div>
              </div>
            </div>
          </label>
        {/each}
      </div>
    {/if}
  </div>

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={() => (newChatDialogOpen = false)}>
      Cancel
    </Button>
    <Button
      on:click={handleCreateChat}
      disabled={!selectedAgentId || agents.length === 0}
    >
      Start Conversation
    </Button>
  </div>
</Dialog>
