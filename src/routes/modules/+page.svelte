<script lang="ts">
  import { onMount, afterUpdate } from "svelte";
  import { authStore, canManageContent } from "$lib/stores/auth";
  import {
    modulesStore,
    loadModules,
    createModule,
    updateModule,
    deleteModule,
    reorderModules,
    setSelectedModule,
    clearError,
  } from "$lib/stores/modules";
  import {
    userModuleAccessStore,
    loadUserModuleAccess,
    filterModulesByAccess,
  } from "$lib/stores/user-module-access";
  import { reorderUnits } from "$lib/stores/units";
  import {
    reorderLessons,
    loadLessons as loadGlobalLessons,
  } from "$lib/stores/lessons";
  import { supabase } from "$lib/supabase";
  import { toastStore } from "$lib/stores/toast";
  import { agentsStore, loadAgents } from "$lib/stores/agents";
  import {
    chatStore,
    sendMessage,
    createChatSession,
    setCurrentSession,
  } from "$lib/stores/chat";
  import AudioPlayer from "$lib/components/ui/audio-player.svelte";

  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Textarea from "$lib/components/ui/textarea.svelte";
  import CrudTips from "$lib/components/ui/crud-tips.svelte";
  import Collapsible from "$lib/components/ui/collapsible.svelte";
  import DraggableList from "$lib/components/ui/draggable-list.svelte";
  import {
    BookOpen,
    Plus,
    Edit,
    Trash2,
    Eye,
    GripVertical,
    Loader2,
    AlertCircle,
    Globe,
    Lock,
    Copy,
    Users,
    FileText,
    BarChart3,
    ArrowRight,
    CheckCircle,
    Clock,
    ChevronDown,
    ChevronRight,
    Play,
    Layers,
    ExternalLink,
    MessageSquare,
    Bot,
    Mic,
    MicOff,
    Square,
    Send,
  } from "lucide-svelte";

  // Dialog states
  let createDialogOpen = false;
  let editDialogOpen = false;
  let deleteDialogOpen = false;

  // Form data
  let newModule = {
    title: "",
    description: "",
    is_published: false,
  };

  let editModule = {
    id: "",
    title: "",
    description: "",
    is_published: false,
  };

  let moduleToDelete: any = null;
  let validationErrors: string[] = [];
  let moduleStats: Record<string, any> = {};
  let loadingStats: Record<string, boolean> = {};

  // Hierarchical data
  let unitsData: Record<string, any[]> = {};
  let lessonsData: Record<string, any[]> = {};
  let loadingUnits: Record<string, boolean> = {};
  let loadingLessons: Record<string, boolean> = {};

  // Collapsible states
  let expandedModules: Record<string, boolean> = {};
  let expandedUnits: Record<string, boolean> = {};
  let expandedLessons: Record<string, boolean> = {};

  // Inline chat states
  let activeChatSessions: Record<string, string> = {}; // lessonId -> sessionId
  let chatMessages: Record<string, any[]> = {};
  let sendingMessage: Record<string, boolean> = {};
  let newMessageText: Record<string, string> = {};

  // Voice recording states
  let isRecording: Record<string, boolean> = {};
  let mediaRecorder: Record<string, MediaRecorder | null> = {};
  let audioChunks: Record<string, Blob[]> = {};
  let isTranscribing: Record<string, boolean> = {};
  let recordingError: Record<string, string> = {};
  let currentAudioUrl: Record<string, string | null> = {};
  let recordingTimer: Record<string, ReturnType<typeof setInterval> | null> =
    {};
  let recordingDuration: Record<string, number> = {};

  // Auto-scroll containers for inline chat
  let inlineChatContainers: Record<string, HTMLElement> = {};

  // Auth and store state
  $: user = $authStore.user;
  $: canManage = $canManageContent;
  $: state = $modulesStore;
  $: allModules = state.modules;
  $: selectedModule = state.selectedModule;
  $: agents = $agentsStore.agents;

  // Filter modules based on user access - use a more stable reactive statement
  $: modules =
    user && user.role === "Student"
      ? filterModulesByAccess(allModules)
      : allModules;

  // Remove the problematic reactive statement that was causing multiple loads
  // $: if (user && user.role === "Student") {
  //   loadUserModuleAccess();
  // }

  // Track if user module access has been loaded to prevent multiple loads
  let userModuleAccessLoaded = false;

  // Sync chat messages from global store to local arrays
  $: {
    const currentSession = $chatStore.currentSession;
    const messages = $chatStore.messages;

    // Find which lesson this session belongs to
    for (const lessonId in activeChatSessions) {
      if (activeChatSessions[lessonId] === currentSession?.id) {
        chatMessages[lessonId] = messages;
        break;
      }
    }
  }

  // Auto-scroll to latest message in inline chats
  afterUpdate(() => {
    for (const lessonId in inlineChatContainers) {
      const container = inlineChatContainers[lessonId];
      if (
        container &&
        chatMessages[lessonId] &&
        chatMessages[lessonId].length > 0
      ) {
        // Use smooth scrolling for better UX
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  });

  // Additional auto-scroll trigger when messages change
  $: {
    // Trigger auto-scroll when any chat messages change
    for (const lessonId in chatMessages) {
      if (chatMessages[lessonId] && chatMessages[lessonId].length > 0) {
        const container = inlineChatContainers[lessonId];
        if (container) {
          // Use setTimeout to ensure DOM is updated
          setTimeout(() => {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: "smooth",
            });
          }, 100);
        }
      }
    }
  }

  onMount(async () => {
    try {
      // Load modules first
      await loadModules();

      // Load agents
      await loadAgents();

      // Load user module access for filtering (only once)
      if (user && user.role === "Student" && !userModuleAccessLoaded) {
        await loadUserModuleAccess();
        userModuleAccessLoaded = true;
      }
    } catch (error) {
      console.error("Modules page initialization error:", error);
    }
  });

  // Watch for user changes and load module access when needed
  $: if (user && user.role === "Student" && !userModuleAccessLoaded) {
    // Use setTimeout to prevent immediate execution during reactive updates
    setTimeout(async () => {
      if (!userModuleAccessLoaded) {
        await loadUserModuleAccess();
        userModuleAccessLoaded = true;
      }
    }, 100);
  }

  // Reset user module access flag when user changes
  $: if (!user || user.role !== "Student") {
    userModuleAccessLoaded = false;
  }

  // Load units for a module
  async function loadUnits(moduleId: string) {
    if (unitsData[moduleId]) return; // Already loaded

    loadingUnits[moduleId] = true;
    try {
      const { data: units, error } = await supabase
        .from("units")
        .select("*")
        .eq("module_id", moduleId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      unitsData[moduleId] = units || [];
    } catch (err) {
      console.error("Error loading units:", err);
      toastStore.error("Failed to load units");
      unitsData[moduleId] = [];
    } finally {
      loadingUnits[moduleId] = false;
    }
  }

  // Load lessons for a unit
  async function loadLessons(unitId: string) {
    if (lessonsData[unitId]) return; // Already loaded

    loadingLessons[unitId] = true;
    try {
      const { data: lessons, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("unit_id", unitId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      lessonsData[unitId] = lessons || [];
    } catch (err) {
      console.error("Error loading lessons:", err);
      toastStore.error("Failed to load lessons");
      lessonsData[unitId] = [];
    } finally {
      loadingLessons[unitId] = false;
    }
  }

  // Toggle module expansion
  function toggleModule(moduleId: string) {
    expandedModules[moduleId] = !expandedModules[moduleId];
    expandedModules = { ...expandedModules }; // Trigger reactivity

    if (expandedModules[moduleId]) {
      loadUnits(moduleId);
    }
  }

  // Toggle unit expansion
  function toggleUnit(unitId: string) {
    expandedUnits[unitId] = !expandedUnits[unitId];
    expandedUnits = { ...expandedUnits }; // Trigger reactivity

    if (expandedUnits[unitId]) {
      loadLessons(unitId);
    }
  }

  // Toggle lesson expansion
  function toggleLesson(lessonId: string) {
    expandedLessons[lessonId] = !expandedLessons[lessonId];
    expandedLessons = { ...expandedLessons }; // Trigger reactivity
  }

  // View lesson content (now expands inline)
  function viewLesson(lesson: any) {
    toggleLesson(lesson.id);
  }

  // Start agent chat
  async function startAgentChat(lesson: any) {
    if (!lesson.agent_id) {
      toastStore.error("No agent configured for this chat lesson");
      return;
    }

    if (!user) {
      toastStore.error("You must be logged in to start a chat");
      return;
    }

    try {
      // Create a new chat session for this lesson
      const result = await createChatSession(lesson.agent_id, user.id);

      if (result.data) {
        // Store the session ID for this lesson
        activeChatSessions[lesson.id] = result.data.id;
        chatMessages[lesson.id] = [];
        newMessageText[lesson.id] = "";
        sendingMessage[lesson.id] = false;
        isRecording[lesson.id] = false; // Initialize recording states
        mediaRecorder[lesson.id] = null;
        audioChunks[lesson.id] = [];
        isTranscribing[lesson.id] = false;
        recordingError[lesson.id] = "";
        currentAudioUrl[lesson.id] = null;

        // Set as current session in chat store
        const sessionResult = await setCurrentSession(result.data);

        // Load existing messages from the session into local array
        if (sessionResult.data) {
          chatMessages[lesson.id] = sessionResult.data;
        }

        // Expand the lesson card to show the chat interface
        expandedLessons[lesson.id] = true;
        expandedLessons = { ...expandedLessons }; // Trigger reactivity

        toastStore.success("Chat session started");
      } else {
        toastStore.error("Failed to start chat session");
      }
    } catch (error) {
      console.error("Error starting chat session:", error);
      toastStore.error("Failed to start chat session");
    }
  }

  // Send message in inline chat
  async function sendInlineMessage(lessonId: string) {
    const messageText = newMessageText[lessonId]?.trim();
    const sessionId = activeChatSessions[lessonId];
    const audioUrl = currentAudioUrl[lessonId];

    if (!messageText || !sessionId) return;

    sendingMessage[lessonId] = true;

    try {
      const result = await sendMessage(
        messageText,
        sessionId,
        audioUrl || undefined
      );

      if (result.data) {
        // The sendMessage function already updates the global chat store
        // We just need to sync the local messages from the global store
        const currentState = $chatStore;
        if (currentState.currentSession?.id === activeChatSessions[lessonId]) {
          chatMessages[lessonId] = [...currentState.messages];
        }

        // Clear input and audio
        newMessageText[lessonId] = "";
        currentAudioUrl[lessonId] = null;
      } else {
        toastStore.error(result.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toastStore.error("Failed to send message");
    } finally {
      sendingMessage[lessonId] = false;
    }
  }

  // Voice recording functions
  async function startRecording(lessonId: string) {
    try {
      recordingError[lessonId] = "";
      recordingDuration[lessonId] = 0;

      // Get microphone-only stream with strict constraints
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

      // Check available MIME types and use the best one
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

      mediaRecorder[lessonId] = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000,
      });
      audioChunks[lessonId] = [];

      mediaRecorder[lessonId]!.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks[lessonId].push(event.data);
        }
      };

      mediaRecorder[lessonId]!.onstop = async () => {
        if (recordingTimer[lessonId]) {
          clearInterval(recordingTimer[lessonId]!);
          recordingTimer[lessonId] = null;
        }
        await handleRecordingComplete(lessonId);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder[lessonId]!.start(1000);
      isRecording[lessonId] = true;

      // Start recording timer for 10-second limit
      recordingTimer[lessonId] = setInterval(() => {
        recordingDuration[lessonId] += 1;
        if (recordingDuration[lessonId] >= 10) {
          stopRecording(lessonId);
        }
      }, 1000);
    } catch (error) {
      console.error("❌ Error starting recording:", error);
      recordingError[lessonId] =
        "Failed to access microphone. Please check permissions.";
    }
  }

  function stopRecording(lessonId: string) {
    if (mediaRecorder[lessonId] && isRecording[lessonId]) {
      mediaRecorder[lessonId]!.stop();
      isRecording[lessonId] = false;
      if (recordingTimer[lessonId]) {
        clearInterval(recordingTimer[lessonId]!);
        recordingTimer[lessonId] = null;
      }
    }
  }

  async function handleRecordingComplete(lessonId: string) {
    if (audioChunks[lessonId].length === 0 || !activeChatSessions[lessonId])
      return;

    isTranscribing[lessonId] = true;
    recordingError[lessonId] = "";

    try {
      const audioBlob = new Blob(audioChunks[lessonId], {
        type: "audio/webm",
      });
      

      if (audioBlob.size < 1000) {
        throw new Error("Audio recording too small - may not contain speech");
      }

      // Test the audio blob to ensure it's valid
      const testAudio = new Audio();
      const testUrl = URL.createObjectURL(audioBlob);
      testAudio.src = testUrl;

      await new Promise((resolve, reject) => {
        testAudio.onloadedmetadata = resolve;
        testAudio.onerror = () => reject(new Error("Audio blob is invalid"));
        setTimeout(() => reject(new Error("Audio loading timeout")), 5000);
      });


      URL.revokeObjectURL(testUrl);

      // Send to transcription API
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");
      formData.append("sessionId", activeChatSessions[lessonId]);



      // Get the agent ID from the lesson data
      let agentId = "";
      for (const unitId in lessonsData) {
        const lessons = lessonsData[unitId] || [];
        const lesson = lessons.find((l) => l.id === lessonId);
        if (lesson && lesson.agent_id) {
          agentId = lesson.agent_id;
          break;
        }
      }
      formData.append("agentId", agentId);



      const response = await fetch("/api/whisper-transcribe", {
        method: "POST",
        body: formData,
      });



      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Transcription API error:", errorText);
        throw new Error(
          `Transcription failed: ${response.statusText} - ${errorText}`
        );
      }

      const result = await response.json();


      if (result.text && result.text.trim()) {
        // Insert transcribed text into the input
        newMessageText[lessonId] = result.text.trim();


        // Store audio URL for later use
        if (result.audioUrl) {
          currentAudioUrl[lessonId] = result.audioUrl;

        } else {
          console.warn("⚠️ No audio URL returned from transcription API");
        }
      } else {
        recordingError[lessonId] = "No speech detected. Please try again.";
        console.warn("⚠️ No speech detected in audio");
      }
    } catch (error) {
      console.error("❌ Transcription error:", error);
      recordingError[lessonId] =
        "Failed to transcribe audio. Please try again.";
    } finally {
      isTranscribing[lessonId] = false;
      audioChunks[lessonId] = [];
    }
  }

  // Module management functions
  function resetNewModule() {
    newModule = {
      title: "",
      description: "",
      is_published: false,
    };
    validationErrors = [];
  }

  async function handleCreateModule() {
    if (!user) return;

    // Simple validation
    validationErrors = [];
    if (!newModule.title.trim()) {
      validationErrors.push("Title is required");
    }
    if (validationErrors.length > 0) {
      return;
    }

    const result = await createModule({
      title: newModule.title.trim(),
      description: newModule.description.trim() || "No description provided",
      is_published: newModule.is_published,
    });

    if (result.data) {
      createDialogOpen = false;
      resetNewModule();
      toastStore.success("Module created successfully");
    } else {
      toastStore.error(String(result.error) || "Failed to create module");
    }
  }

  async function handleUpdateModule() {

    if (!user) {
      return;
    }

    // Simple validation
    validationErrors = [];
    if (!editModule.title.trim()) {
      validationErrors.push("Title is required");
    }
    if (validationErrors.length > 0) {
      return;
    }



    const result = await updateModule(editModule.id, {
      title: editModule.title.trim(),
      description: editModule.description.trim() || "No description provided",
      is_published: editModule.is_published,
    });


    if (result.data) {
      editDialogOpen = false;
      toastStore.success("Module updated successfully");
    } else {
      toastStore.error(String(result.error) || "Failed to update module");
    }
  }

  async function handleDeleteModule() {
    if (!moduleToDelete) return;

    const success = await deleteModule(moduleToDelete.id);
    if (success) {
      deleteDialogOpen = false;
      moduleToDelete = null;
      toastStore.success("Module deleted successfully");
    } else {
      toastStore.error("Failed to delete module");
    }
  }

  async function handleTogglePublication(moduleId: string) {
    // Find the module and toggle its publication status
    const module = modules.find((m) => m.id === moduleId);
    if (!module) {
      toastStore.error("Module not found");
      return;
    }

    const result = await updateModule(moduleId, {
      is_published: !module.is_published,
    });

    if (result.data) {
      toastStore.success("Module publication status updated");
    } else {
      toastStore.error(
        String(result.error) || "Failed to update publication status"
      );
    }
  }

  async function handleDuplicateModule(moduleId: string) {
    // Find the module to duplicate
    const module = modules.find((m) => m.id === moduleId);
    if (!module) {
      toastStore.error("Module not found");
      return;
    }

    // Create a new module with the same data but a new title
    const result = await createModule({
      title: `${module.title} (Copy)`,
      description: module.description,
      is_published: false,
    });

    if (result.data) {
      toastStore.success("Module duplicated successfully");
    } else {
      toastStore.error(String(result.error) || "Failed to duplicate module");
    }
  }

  function openCreateDialog() {
    resetNewModule();
    createDialogOpen = true;
  }

  function openEditDialog(module: any) {
    editModule = {
      id: module.id,
      title: module.title,
      description: module.description,
      is_published: module.is_published,
    };
    editDialogOpen = true;
  }

  function openDeleteDialog(module: any) {
    moduleToDelete = module;
    deleteDialogOpen = true;
  }

  function openViewDialog(module: any) {
    setSelectedModule(module);
  }

  // Get module stats
  async function loadModuleStats(moduleId: string) {
    if (moduleStats[moduleId]) return;

    loadingStats[moduleId] = true;
    try {
      // Calculate stats from the module data
      const module = modules.find((m) => m.id === moduleId);
      if (module) {
        const units = module.units?.length || 0;
        const lessons =
          module.units?.reduce(
            (total: number, unit: any) => total + (unit.lessons?.length || 0),
            0
          ) || 0;
        moduleStats[moduleId] = { units, lessons, students: 0 };
      } else {
        moduleStats[moduleId] = { units: 0, lessons: 0, students: 0 };
      }
    } catch (err) {
      console.error("Error loading module stats:", err);
      moduleStats[moduleId] = { units: 0, lessons: 0, students: 0 };
    } finally {
      loadingStats[moduleId] = false;
    }
  }

  // Load stats when modules change
  $: if (modules.length > 0) {
    modules.forEach((module) => {
      if (!moduleStats[module.id]) {
        loadModuleStats(module.id);
      }
    });
  }

  // Reordering functions
  async function handleReorderModules(event: CustomEvent) {
    const { items } = event.detail;
    const moduleIds = items.map((module: any) => module.id);

    try {
      const success = await reorderModules(moduleIds);
      if (success) {
        toastStore.success("Modules reordered successfully");
        await loadModules(true); // Refresh data
      } else {
        toastStore.error("Failed to reorder modules");
      }
    } catch (error) {
      console.error("Error reordering modules:", error);
      toastStore.error("Failed to reorder modules");
    }
  }

  async function handleReorderUnits(event: CustomEvent, moduleId: string) {
    const { items } = event.detail;
    const unitIds = items.map((unit: any) => unit.id);

    try {
      const success = await reorderUnits(unitIds);
      if (success) {
        toastStore.success("Units reordered successfully");
        // Refresh units for this module
        delete unitsData[moduleId]; // Clear cached data
        await loadUnits(moduleId);
      } else {
        toastStore.error("Failed to reorder units");
      }
    } catch (error) {
      console.error("Error reordering units:", error);
      toastStore.error("Failed to reorder units");
    }
  }

  async function handleReorderLessons(event: CustomEvent, unitId: string) {
    const { items } = event.detail;
    const lessonIds = items.map((lesson: any) => lesson.id);

    try {
      const success = await reorderLessons(lessonIds);
      if (success) {
        toastStore.success("Lessons reordered successfully");
        // Refresh lessons for this unit
        delete lessonsData[unitId]; // Clear cached data
        await loadLessons(unitId);
        // Also refresh the global lessons store
        await loadGlobalLessons(true); // Force refresh
      } else {
        toastStore.error("Failed to reorder lessons");
      }
    } catch (error) {
      console.error("Error reordering lessons:", error);
      toastStore.error("Failed to reorder lessons");
    }
  }
</script>

<svelte:head>
  <title>Learning Modules - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-3xl font-bold text-foreground">Learning Modules</h1>
      <p class="text-muted-foreground">
        Create and organize your course content into structured modules
      </p>
    </div>
    {#if canManage}
      <Button on:click={openCreateDialog}>
        <Plus class="w-4 h-4 mr-2" />
        Create Module
      </Button>
    {/if}
  </div>

  <!-- Loading State -->
  {#if state.loading}
    <div class="flex items-center justify-center p-8">
      <Loader2 class="w-6 h-6 animate-spin mr-2" />
      Loading modules...
    </div>
  {:else if state.error}
    <Card class="p-6">
      <div class="flex items-center text-destructive">
        <AlertCircle class="w-5 h-5 mr-2" />
        <span>{state.error}</span>
      </div>
    </Card>
  {:else if modules.length === 0}
    <Card class="p-8 text-center">
      <BookOpen class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 class="text-lg font-semibold mb-2">No modules yet</h3>
      <p class="text-muted-foreground mb-4">
        {canManage
          ? "Create your first module to get started"
          : "No modules are available yet"}
      </p>
      {#if canManage}
        <Button on:click={openCreateDialog}>
          <Plus class="w-4 h-4 mr-2" />
          Create Your First Module
        </Button>
      {/if}
    </Card>
  {:else}
    <!-- Modules List -->
    <DraggableList
      items={modules}
      disabled={!canManage}
      on:reorder={handleReorderModules}
      classList="space-y-4"
    >
      <svelte:fragment
        let:item={module}
        let:index
        let:draggedIndex
        let:dropTargetIndex
      >
        <!-- Module Card -->
        <Card class="overflow-hidden">
          <div class="p-6">
            <!-- Module Header -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-start gap-4 flex-1">
                <!-- Drag Handle -->
                {#if canManage}
                  <div
                    class="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                  >
                    <GripVertical class="w-4 h-4" />
                  </div>
                {/if}
                <!-- Module Icon -->
                <div
                  class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"
                >
                  <BookOpen class="w-5 h-5 text-primary" />
                </div>

                <!-- Module Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-3 mb-2">
                    <h3 class="text-lg font-semibold text-foreground">
                      {module.title}
                    </h3>
                    <span
                      class={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        module.is_published
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
                      }`}
                    >
                      {module.is_published ? "Published" : "Draft"}
                    </span>
                  </div>

                  <p class="text-sm text-muted-foreground mb-3">
                    {module.description || "No description provided"}
                  </p>

                  <!-- Module Stats -->
                  <div
                    class="flex items-center gap-4 text-sm text-muted-foreground"
                  >
                    <div class="flex items-center gap-1">
                      <Layers class="w-4 h-4" />
                      <span>
                        {#if loadingStats[module.id]}
                          <Loader2 class="w-3 h-3 animate-spin inline" />
                        {:else}
                          {moduleStats[module.id]?.units || 0} units
                        {/if}
                      </span>
                    </div>
                    <div class="flex items-center gap-1">
                      <FileText class="w-4 h-4" />
                      <span>
                        {#if loadingStats[module.id]}
                          <Loader2 class="w-3 h-3 animate-spin inline" />
                        {:else}
                          {moduleStats[module.id]?.content || 0} lessons
                        {/if}
                      </span>
                    </div>
                    <div class="flex items-center gap-1">
                      <Users class="w-4 h-4" />
                      <span>
                        {#if loadingStats[module.id]}
                          <Loader2 class="w-3 h-3 animate-spin inline" />
                        {:else}
                          {moduleStats[module.id]?.students || 0} students
                        {/if}
                      </span>
                    </div>
                    <span class="text-xs">
                      Updated {new Date(module.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Admin Actions -->
              {#if canManage}
                <div class="flex items-center gap-1">
                  <button
                    on:click={() => handleTogglePublication(module.id)}
                    class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                    title={module.is_published ? "Unpublish" : "Publish"}
                  >
                    {#if module.is_published}
                      <Globe class="w-4 h-4" />
                    {:else}
                      <Lock class="w-4 h-4" />
                    {/if}
                  </button>
                  <button
                    on:click={() => handleDuplicateModule(module.id)}
                    class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                    title="Duplicate module"
                  >
                    <Copy class="w-4 h-4" />
                  </button>
                  <button
                    on:click={() => openViewDialog(module)}
                    class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                    title="View module"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button
                    on:click={() => openEditDialog(module)}
                    class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                    title="Edit module"
                  >
                    <Edit class="w-4 h-4" />
                  </button>
                  <button
                    on:click={() => openDeleteDialog(module)}
                    class="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground text-destructive"
                    title="Delete module"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              {/if}
            </div>

            <!-- Collapsible Units Section -->
            <Collapsible bind:open={expandedModules[module.id]}>
              <div class="flex items-center justify-between">
                <button
                  on:click={() => toggleModule(module.id)}
                  class="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {#if expandedModules[module.id]}
                    <ChevronDown class="w-4 h-4" />
                    Hide Units
                  {:else}
                    <ChevronRight class="w-4 h-4" />
                    Show Units ({moduleStats[module.id]?.units || 0})
                  {/if}
                </button>
              </div>

              <div slot="content" class="mt-4">
                {#if loadingUnits[module.id]}
                  <div class="flex items-center justify-center p-4">
                    <Loader2 class="w-4 h-4 animate-spin mr-2" />
                    Loading units...
                  </div>
                {:else if unitsData[module.id]?.length === 0}
                  <div class="text-center p-4 text-muted-foreground">
                    <Layers class="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No units in this module</p>
                    {#if canManage}
                      <Button variant="outline" size="sm" class="mt-2">
                        <Plus class="w-3 h-3 mr-1" />
                        Add Unit
                      </Button>
                    {/if}
                  </div>
                {:else}
                  <DraggableList
                    items={unitsData[module.id] || []}
                    disabled={!canManage}
                    on:reorder={(event) => handleReorderUnits(event, module.id)}
                    classList="space-y-3"
                  >
                    <svelte:fragment
                      let:item={unit}
                      let:index
                      let:draggedIndex
                      let:dropTargetIndex
                    >
                      <!-- Unit Card -->
                      <Card class="p-4">
                        <div class="flex items-start justify-between mb-3">
                          <div class="flex items-start gap-3 flex-1">
                            <!-- Drag Handle -->
                            {#if canManage}
                              <div
                                class="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                              >
                                <GripVertical class="w-4 h-4" />
                              </div>
                            {/if}
                            <!-- Unit Icon -->
                            <div
                              class="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center"
                            >
                              <Layers class="w-4 h-4 text-blue-500" />
                            </div>

                            <!-- Unit Info -->
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center gap-2 mb-1">
                                <h4 class="font-medium text-foreground">
                                  {unit.title}
                                </h4>
                                <span
                                  class={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    unit.is_published
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                      : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
                                  }`}
                                >
                                  {unit.is_published ? "Published" : "Draft"}
                                </span>
                              </div>

                              <p class="text-sm text-muted-foreground mb-2">
                                {unit.description || "No description"}
                              </p>

                              <!-- Unit Stats -->
                              <div
                                class="flex items-center gap-3 text-xs text-muted-foreground"
                              >
                                <span>
                                  {#if loadingLessons[unit.id]}
                                    <Loader2
                                      class="w-3 h-3 animate-spin inline"
                                    />
                                  {:else}
                                    {lessonsData[unit.id]?.length || 0} lessons
                                  {/if}
                                </span>
                                <span>
                                  Updated {new Date(
                                    unit.updated_at
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <!-- Unit Actions -->
                          {#if canManage}
                            <div class="flex items-center gap-1">
                              <button
                                on:click={() => openEditDialog(unit)}
                                class="p-1 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                                title="Edit unit"
                              >
                                <Edit class="w-3 h-3" />
                              </button>
                              <button
                                on:click={() => openDeleteDialog(unit)}
                                class="p-1 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground text-destructive"
                                title="Delete unit"
                              >
                                <Trash2 class="w-3 h-3" />
                              </button>
                            </div>
                          {/if}
                        </div>

                        <!-- Collapsible Lessons Section -->
                        <Collapsible bind:open={expandedUnits[unit.id]}>
                          <div class="flex items-center justify-between">
                            <button
                              on:click={() => toggleUnit(unit.id)}
                              class="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {#if expandedUnits[unit.id]}
                                <ChevronDown class="w-3 h-3" />
                                Hide Lessons
                              {:else}
                                <ChevronRight class="w-3 h-3" />
                                Show Lessons ({lessonsData[unit.id]?.length ||
                                  0})
                              {/if}
                            </button>
                          </div>

                          <div slot="content" class="mt-3">
                            {#if loadingLessons[unit.id]}
                              <div class="flex items-center justify-center p-2">
                                <Loader2 class="w-3 h-3 animate-spin mr-1" />
                                Loading lessons...
                              </div>
                            {:else if lessonsData[unit.id]?.length === 0}
                              <div
                                class="text-center p-2 text-muted-foreground"
                              >
                                <FileText
                                  class="w-6 h-6 mx-auto mb-1 opacity-50"
                                />
                                <p class="text-xs">No lessons in this unit</p>
                                {#if canManage}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    class="mt-1 text-xs"
                                  >
                                    <Plus class="w-3 h-3 mr-1" />
                                    Add Lesson
                                  </Button>
                                {/if}
                              </div>
                            {:else}
                              <DraggableList
                                items={lessonsData[unit.id] || []}
                                disabled={!canManage}
                                on:reorder={(event) =>
                                  handleReorderLessons(event, unit.id)}
                                classList="space-y-2"
                              >
                                <svelte:fragment
                                  let:item={lesson}
                                  let:index
                                  let:draggedIndex
                                  let:dropTargetIndex
                                >
                                  <!-- Lesson Card -->
                                  <div
                                    class="border rounded p-3 bg-muted/30 {expandedLessons[
                                      lesson.id
                                    ]
                                      ? 'min-h-[300px]'
                                      : 'min-h-[80px]'}"
                                  >
                                    <div
                                      class="flex items-center justify-between"
                                    >
                                      <div
                                        class="flex items-center gap-2 flex-1"
                                      >
                                        <!-- Drag Handle -->
                                        {#if canManage}
                                          <div
                                            class="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                                          >
                                            <GripVertical class="w-3 h-3" />
                                          </div>
                                        {/if}
                                        <!-- Lesson Icon -->
                                        <div
                                          class="w-6 h-6 {lesson.content_type ===
                                          'agent_chat'
                                            ? 'bg-blue-500/10'
                                            : 'bg-green-500/10'} rounded flex items-center justify-center"
                                        >
                                          {#if lesson.content_type === "agent_chat"}
                                            <Bot
                                              class="w-3 h-3 text-blue-500"
                                            />
                                          {:else}
                                            <FileText
                                              class="w-3 h-3 text-green-500"
                                            />
                                          {/if}
                                        </div>

                                        <!-- Lesson Info -->
                                        <div class="flex-1 min-w-0">
                                          <div class="flex items-center gap-2">
                                            <h5
                                              class="text-sm font-medium text-foreground truncate"
                                            >
                                              {lesson.title}
                                            </h5>
                                            <span
                                              class={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                                lesson.is_published
                                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                                  : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
                                              }`}
                                            >
                                              {lesson.is_published
                                                ? "Published"
                                                : "Draft"}
                                            </span>
                                          </div>
                                          <p
                                            class="text-xs text-muted-foreground"
                                          >
                                            Created {new Date(
                                              lesson.created_at
                                            ).toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>

                                      <!-- Lesson Actions -->
                                      <div class="flex items-center gap-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          on:click={() =>
                                            lesson.content_type === "agent_chat"
                                              ? activeChatSessions[lesson.id]
                                                ? toggleLesson(lesson.id)
                                                : startAgentChat(lesson)
                                              : viewLesson(lesson)}
                                          class="text-xs"
                                        >
                                          {#if expandedLessons[lesson.id]}
                                            <ChevronDown class="w-3 h-3 mr-1" />
                                            Hide Content
                                          {:else if lesson.content_type === "agent_chat"}
                                            <MessageSquare
                                              class="w-3 h-3 mr-1"
                                            />
                                            Start Chat
                                          {:else}
                                            <Play class="w-3 h-3 mr-1" />
                                            View Lesson
                                          {/if}
                                        </Button>
                                        {#if canManage}
                                          <button
                                            on:click={() =>
                                              openEditDialog(lesson)}
                                            class="p-1 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                                            title="Edit lesson"
                                          >
                                            <Edit class="w-3 h-3" />
                                          </button>
                                          <button
                                            on:click={() =>
                                              openDeleteDialog(lesson)}
                                            class="p-1 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground text-destructive"
                                            title="Delete lesson"
                                          >
                                            <Trash2 class="w-3 h-3" />
                                          </button>
                                        {/if}
                                      </div>
                                    </div>

                                    <!-- Expanded Lesson Content -->
                                    {#if expandedLessons[lesson.id]}
                                      <div
                                        class="mt-3 pt-3 border-t border-border"
                                      >
                                        {#if lesson.content_type === "agent_chat"}
                                          {#if activeChatSessions[lesson.id]}
                                            <!-- Inline Chat Interface -->
                                            <div
                                              class="bg-background rounded border h-[500px] flex flex-col"
                                            >
                                              <!-- Chat Header -->
                                              <div
                                                class="p-3 border-b border-border bg-muted/50"
                                              >
                                                <div
                                                  class="flex items-center justify-between"
                                                >
                                                  <div
                                                    class="flex items-center gap-2"
                                                  >
                                                    <Bot
                                                      class="w-4 h-4 text-blue-500"
                                                    />
                                                    <span
                                                      class="text-sm font-medium"
                                                      >Chat Session</span
                                                    >
                                                  </div>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    on:click={() => {
                                                      delete activeChatSessions[
                                                        lesson.id
                                                      ];
                                                      delete chatMessages[
                                                        lesson.id
                                                      ];
                                                      delete newMessageText[
                                                        lesson.id
                                                      ];
                                                      delete sendingMessage[
                                                        lesson.id
                                                      ];
                                                      delete isRecording[
                                                        lesson.id
                                                      ];
                                                      delete mediaRecorder[
                                                        lesson.id
                                                      ];
                                                      delete audioChunks[
                                                        lesson.id
                                                      ];
                                                      delete isTranscribing[
                                                        lesson.id
                                                      ];
                                                      delete recordingError[
                                                        lesson.id
                                                      ];
                                                      delete currentAudioUrl[
                                                        lesson.id
                                                      ];
                                                    }}
                                                  >
                                                    End Chat
                                                  </Button>
                                                </div>
                                              </div>

                                              <!-- Messages Area -->
                                              <div
                                                bind:this={
                                                  inlineChatContainers[
                                                    lesson.id
                                                  ]
                                                }
                                                class="flex-1 overflow-y-auto p-3 space-y-3"
                                                style="height: calc(100vh - 16rem);"
                                              >
                                                {#if chatMessages[lesson.id] && chatMessages[lesson.id].length > 0}
                                                  {#each chatMessages[lesson.id] as message}
                                                    <div
                                                      class="flex {message.role ===
                                                      'user'
                                                        ? 'justify-end'
                                                        : 'justify-start'}"
                                                    >
                                                      <div
                                                        class="max-w-xs lg:max-w-md px-3 py-2 rounded-lg {message.role ===
                                                        'user'
                                                          ? 'bg-blue-500 text-white'
                                                          : 'bg-muted'}"
                                                      >
                                                        <p
                                                          class="text-sm whitespace-pre-wrap"
                                                        >
                                                          {message.content}
                                                        </p>

                                                        <!-- Audio Playback for Voice Messages -->
                                                        {#if message.metadata?.audio_url}
                                                          <div class="mt-2">
                                                            <AudioPlayer
                                                              src={message
                                                                .metadata
                                                                .audio_url}
                                                              title={message.content}
                                                            />
                                                          </div>
                                                        {:else if message.metadata?.is_voice_message}
                                                          <div
                                                            class="mt-2 text-xs text-muted-foreground"
                                                          >
                                                            🎵 Voice message
                                                          </div>
                                                        {/if}

                                                        <p
                                                          class="text-xs mt-1 opacity-70"
                                                        >
                                                          {new Date(
                                                            message.created_at
                                                          ).toLocaleTimeString()}
                                                        </p>
                                                      </div>
                                                    </div>
                                                  {/each}
                                                {:else}
                                                  <div
                                                    class="text-center text-muted-foreground py-8"
                                                  >
                                                    <Bot
                                                      class="w-8 h-8 mx-auto mb-2 opacity-50"
                                                    />
                                                    <p class="text-sm">
                                                      Start chatting with the AI
                                                      agent
                                                    </p>
                                                  </div>
                                                {/if}

                                                {#if sendingMessage[lesson.id]}
                                                  <div
                                                    class="flex justify-start"
                                                  >
                                                    <div
                                                      class="bg-muted px-3 py-2 rounded-lg"
                                                    >
                                                      <div
                                                        class="flex items-center gap-2"
                                                      >
                                                        <div
                                                          class="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                                                        ></div>
                                                        <div
                                                          class="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                                                          style="animation-delay: 0.1s"
                                                        ></div>
                                                        <div
                                                          class="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                                                          style="animation-delay: 0.2s"
                                                        ></div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                {/if}
                                              </div>

                                              <!-- Message Input -->
                                              <div
                                                class="p-3 border-t border-border"
                                              >
                                                <div class="flex gap-2">
                                                  <textarea
                                                    bind:value={
                                                      newMessageText[lesson.id]
                                                    }
                                                    placeholder="Type your message..."
                                                    disabled={sendingMessage[
                                                      lesson.id
                                                    ] || isRecording[lesson.id]}
                                                    on:keydown={(e) => {
                                                      if (
                                                        e.key === "Enter" &&
                                                        !e.shiftKey
                                                      ) {
                                                        e.preventDefault();
                                                        sendInlineMessage(
                                                          lesson.id
                                                        );
                                                      }
                                                    }}
                                                    class="flex-1 min-h-[40px] max-h-24 resize-none border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                                                    rows="1"
                                                  ></textarea>

                                                  <!-- Voice Recording Button -->
                                                  <Button
                                                    variant={isRecording[
                                                      lesson.id
                                                    ]
                                                      ? "destructive"
                                                      : "outline"}
                                                    size="sm"
                                                    on:click={isRecording[
                                                      lesson.id
                                                    ]
                                                      ? () =>
                                                          stopRecording(
                                                            lesson.id
                                                          )
                                                      : () =>
                                                          startRecording(
                                                            lesson.id
                                                          )}
                                                    disabled={sendingMessage[
                                                      lesson.id
                                                    ] ||
                                                      isTranscribing[lesson.id]}
                                                    class="self-end"
                                                  >
                                                    {#if isTranscribing[lesson.id]}
                                                      <Loader2
                                                        class="w-4 h-4 animate-spin"
                                                      />
                                                    {:else if isRecording[lesson.id]}
                                                      <Square class="w-4 h-4" />
                                                    {:else}
                                                      <Mic class="w-4 h-4" />
                                                    {/if}
                                                  </Button>

                                                  <Button
                                                    on:click={() =>
                                                      sendInlineMessage(
                                                        lesson.id
                                                      )}
                                                    disabled={!newMessageText[
                                                      lesson.id
                                                    ]?.trim() ||
                                                      sendingMessage[
                                                        lesson.id
                                                      ] ||
                                                      isRecording[lesson.id]}
                                                    size="sm"
                                                    class="self-end"
                                                  >
                                                    {#if sendingMessage[lesson.id]}
                                                      <Loader2
                                                        class="w-4 h-4 animate-spin"
                                                      />
                                                    {:else}
                                                      <Send class="w-4 h-4" />
                                                    {/if}
                                                  </Button>
                                                </div>

                                                <!-- Recording Status and Error Messages -->
                                                {#if isRecording[lesson.id]}
                                                  <div
                                                    class="flex items-center space-x-2 mt-2 text-sm text-muted-foreground"
                                                  >
                                                    <div
                                                      class="w-2 h-2 bg-red-500 rounded-full animate-pulse"
                                                    ></div>
                                                    <span
                                                      >Recording... {recordingDuration[
                                                        lesson.id
                                                      ] || 0}s / 10s (Click to
                                                      stop)</span
                                                    >
                                                  </div>
                                                {/if}

                                                {#if isTranscribing[lesson.id]}
                                                  <div
                                                    class="flex items-center space-x-2 mt-2 text-sm text-muted-foreground"
                                                  >
                                                    <Loader2
                                                      class="w-4 h-4 animate-spin"
                                                    />
                                                    <span
                                                      >Transcribing audio...</span
                                                    >
                                                  </div>
                                                {/if}

                                                {#if recordingError[lesson.id]}
                                                  <div
                                                    class="mt-2 text-sm text-destructive"
                                                  >
                                                    {recordingError[lesson.id]}
                                                  </div>
                                                {/if}
                                              </div>
                                            </div>
                                          {:else}
                                            <!-- Start Chat Button -->
                                            <div
                                              class="text-center p-4 bg-muted rounded"
                                            >
                                              <Bot
                                                class="w-8 h-8 text-blue-500 mx-auto mb-2"
                                              />
                                              <h6 class="font-medium mb-1">
                                                Agent Chat Lesson
                                              </h6>
                                              <p
                                                class="text-sm text-muted-foreground mb-3"
                                              >
                                                This lesson is configured as an
                                                interactive chat session with an
                                                AI agent.
                                              </p>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                on:click={() =>
                                                  startAgentChat(lesson)}
                                              >
                                                <MessageSquare
                                                  class="w-3 h-3 mr-1"
                                                />
                                                Start Chat Session
                                              </Button>
                                            </div>
                                          {/if}
                                        {:else if lesson.embed_url}
                                          <div
                                            class="bg-background rounded border"
                                          >
                                            <iframe
                                              src={lesson.embed_url}
                                              style="width: 100%; height: 1200px; border: none;"
                                              title={lesson.title}
                                              loading="eager"
                                              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-downloads allow-modals"
                                              allow="fullscreen; autoplay; encrypted-media; picture-in-picture; microphone; camera"
                                              referrerpolicy="no-referrer"
                                            />
                                          </div>
                                        {:else if lesson.notion_url}
                                          <div
                                            class="text-center p-4 bg-muted rounded"
                                          >
                                            <FileText
                                              class="w-8 h-8 text-muted-foreground mx-auto mb-2"
                                            />
                                            <h6 class="font-medium mb-1">
                                              Notion Content
                                            </h6>
                                            <p
                                              class="text-sm text-muted-foreground mb-3"
                                            >
                                              This lesson contains Notion
                                              content that needs to be embedded.
                                            </p>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              on:click={() =>
                                                window.open(
                                                  lesson.notion_url,
                                                  "_blank"
                                                )}
                                            >
                                              <ExternalLink
                                                class="w-3 h-3 mr-1"
                                              />
                                              Open in Notion
                                            </Button>
                                          </div>
                                        {:else}
                                          <div
                                            class="text-center p-4 bg-muted rounded"
                                          >
                                            <FileText
                                              class="w-8 h-8 text-muted-foreground mx-auto mb-2"
                                            />
                                            <h6 class="font-medium mb-1">
                                              No Content Available
                                            </h6>
                                            <p
                                              class="text-sm text-muted-foreground"
                                            >
                                              This lesson doesn't have any
                                              content configured yet.
                                            </p>
                                          </div>
                                        {/if}
                                      </div>
                                    {/if}
                                  </div>
                                </svelte:fragment>
                              </DraggableList>
                            {/if}
                          </div>
                        </Collapsible>
                      </Card>
                    </svelte:fragment>
                  </DraggableList>
                {/if}
              </div>
            </Collapsible>
          </div>
        </Card>
      </svelte:fragment>
    </DraggableList>
  {/if}

  <!-- Module Management Tips -->
  {#if canManage}
    <CrudTips
      title="Module Management Tips"
      tips={[
        "Drag modules to reorder them in your course structure",
        "Create descriptive titles and descriptions for better organization",
        "Use draft status to prepare modules before publishing",
        "Duplicate existing modules to quickly create similar content",
      ]}
    />
  {/if}
</div>

<!-- Create Module Dialog -->
<Dialog bind:open={createDialogOpen} title="Create New Module">
  <div class="space-y-4">
    <!-- Validation Errors -->
    {#if validationErrors.length > 0}
      <div
        class="bg-destructive/15 border border-destructive/20 rounded-md p-4"
      >
        <div class="flex">
          <AlertCircle class="w-5 h-5 text-destructive flex-shrink-0" />
          <div class="ml-3">
            <h4 class="text-sm font-medium text-destructive">
              Please fix these errors:
            </h4>
            <ul class="mt-1 text-sm text-destructive/80 list-disc list-inside">
              {#each validationErrors as error}
                <li>{error}</li>
              {/each}
            </ul>
          </div>
        </div>
      </div>
    {/if}

    <div>
      <label for="title" class="block text-sm font-medium mb-2"
        >Module Title *</label
      >
      <Input
        id="title"
        bind:value={newModule.title}
        placeholder="e.g., Introduction to Spanish Grammar"
        required
      />
    </div>

    <div>
      <label for="description" class="block text-sm font-medium mb-2"
        >Description</label
      >
      <Textarea
        id="description"
        bind:value={newModule.description}
        placeholder="Brief description of what students will learn in this module..."
        rows={3}
      />
    </div>

    <div class="flex items-center space-x-2">
      <input
        type="checkbox"
        id="published"
        bind:checked={newModule.is_published}
        class="rounded border-input"
      />
      <label for="published" class="text-sm font-medium">
        Publish immediately (students can access this module)
      </label>
    </div>
  </div>

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={() => (createDialogOpen = false)}>
      Cancel
    </Button>
    <Button on:click={handleCreateModule} disabled={!newModule.title.trim()}>
      Create Module
    </Button>
  </div>
</Dialog>

<!-- Edit Module Dialog -->
<Dialog bind:open={editDialogOpen} title="Edit Module">
  <div class="space-y-4">
    <!-- Validation Errors -->
    {#if validationErrors.length > 0}
      <div
        class="bg-destructive/15 border border-destructive/20 rounded-md p-4"
      >
        <div class="flex">
          <AlertCircle class="w-5 h-5 text-destructive flex-shrink-0" />
          <div class="ml-3">
            <h4 class="text-sm font-medium text-destructive">
              Please fix these errors:
            </h4>
            <ul class="mt-1 text-sm text-destructive/80 list-disc list-inside">
              {#each validationErrors as error}
                <li>{error}</li>
              {/each}
            </ul>
          </div>
        </div>
      </div>
    {/if}

    <div>
      <label for="edit-title" class="block text-sm font-medium mb-2"
        >Module Title *</label
      >
      <Input id="edit-title" bind:value={editModule.title} required />
    </div>

    <div>
      <label for="edit-description" class="block text-sm font-medium mb-2"
        >Description</label
      >
      <Textarea
        id="edit-description"
        bind:value={editModule.description}
        rows={3}
      />
    </div>

    <div class="flex items-center space-x-2">
      <input
        type="checkbox"
        id="edit-published"
        bind:checked={editModule.is_published}
        class="rounded border-input"
      />
      <label for="edit-published" class="text-sm font-medium">
        Published (students can access this module)
      </label>
    </div>
  </div>

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={() => (editDialogOpen = false)}>
      Cancel
    </Button>
    <Button on:click={handleUpdateModule} disabled={!editModule.title.trim()}>
      Save Changes
    </Button>
  </div>
</Dialog>

<!-- Delete Confirmation Dialog -->
<Dialog bind:open={deleteDialogOpen} title="Delete Module">
  {#if moduleToDelete}
    <div class="space-y-4">
      <div class="flex items-start space-x-3">
        <AlertCircle class="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
        <div>
          <p class="font-medium text-foreground">
            Are you sure you want to delete "{moduleToDelete.title}"?
          </p>
          <p class="text-sm text-muted-foreground mt-2">
            This will permanently delete the module and all its units and
            content. This action cannot be undone.
          </p>
        </div>
      </div>
    </div>
  {/if}

  <div slot="footer" class="flex justify-end space-x-2">
    <Button variant="outline" on:click={() => (deleteDialogOpen = false)}>
      Cancel
    </Button>
    <Button variant="destructive" on:click={handleDeleteModule}>
      Delete Module
    </Button>
  </div>
</Dialog>
