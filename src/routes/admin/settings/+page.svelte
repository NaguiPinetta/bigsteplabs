<script lang="ts">
  import { onMount } from "svelte";
  import { authStore, isAdmin } from "$lib/stores/auth";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Textarea from "$lib/components/ui/textarea.svelte";
  import Select from "$lib/components/ui/select.svelte";
  import {
    Settings,
    Save,
    Key,
    Database,
    Mail,
    Globe,
    Shield,
    Palette,
    AlertCircle,
    CheckCircle,
    Info,
  } from "lucide-svelte";

  // Mock settings data
  let settings = {
    general: {
      siteName: "BigStepLabs",
      siteDescription: "AI-Powered Learning Management System",
      logoUrl: "/images/bigstep-logo.png",
      timezone: "UTC",
      defaultLanguage: "en",
    },
    authentication: {
      allowRegistration: false,
      requireEmailVerification: true,
      sessionTimeout: 24, // hours
      passwordMinLength: 8,
      enableMagicLink: true,
    },
    email: {
      smtpHost: "",
      smtpPort: 587,
      smtpUser: "",
      smtpPassword: "",
      fromEmail: "noreply@bigsteplabs.com",
      fromName: "BigStepLabs",
    },
    ai: {
      openaiApiKey: "",
      defaultModel: "gpt-4",
      maxTokens: 4096,
      temperature: 0.7,
      enableAssistants: true,
    },
    storage: {
      maxFileSize: 50, // MB
      allowedFileTypes: "pdf,doc,docx,txt,md,jpg,png,gif,mp4,mp3",
      storageQuota: 10000, // MB per user
    },
    appearance: {
      primaryColor: "#3b82f6",
      theme: "system", // light, dark, system
      customCSS: "",
    },
  };

  let activeTab = "general";
  let saveStatus = "";
  let errors = {};

  $: user = $authStore.user;
  $: canAccess = isAdmin(user);

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "auth", label: "Authentication", icon: Shield },
    { id: "email", label: "Email", icon: Mail },
    { id: "ai", label: "AI Configuration", icon: Key },
    { id: "storage", label: "Storage", icon: Database },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  const timezones = [
    { label: "UTC", value: "UTC" },
    { label: "America/New_York", value: "America/New_York" },
    { label: "America/Los_Angeles", value: "America/Los_Angeles" },
    { label: "Europe/London", value: "Europe/London" },
    { label: "Europe/Paris", value: "Europe/Paris" },
    { label: "Asia/Tokyo", value: "Asia/Tokyo" },
  ];

  const languages = [
    { label: "English", value: "en" },
    { label: "Spanish", value: "es" },
    { label: "French", value: "fr" },
    { label: "German", value: "de" },
    { label: "Portuguese", value: "pt" },
  ];

  // Dynamic AI models list
  let aiModels = [
    { label: "GPT-4", value: "gpt-4" },
    { label: "GPT-4 Turbo", value: "gpt-4-turbo" },
    { label: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
  ];

  let loadingModels = false;
  let modelSyncStatus = "";
  let availableModels = [];

  const themes = [
    { label: "System", value: "system" },
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
  ];

  function handleSave() {
    saveStatus = "saving";

    // Mock save operation
    setTimeout(() => {
      saveStatus = "success";
      setTimeout(() => {
        saveStatus = "";
      }, 3000);
    }, 1000);
  }

  function validateSettings() {
    errors = {};

    if (settings.general.siteName.length < 3) {
      errors.siteName = "Site name must be at least 3 characters";
    }

    if (settings.authentication.passwordMinLength < 6) {
      errors.passwordMinLength = "Minimum length must be at least 6";
    }

    if (settings.email.smtpHost && !settings.email.smtpUser) {
      errors.smtpUser = "SMTP user is required when host is provided";
    }

    if (settings.storage.maxFileSize < 1) {
      errors.maxFileSize = "Max file size must be at least 1 MB";
    }

    return Object.keys(errors).length === 0;
  }

  function testEmailConnection() {
    alert(
      "Email connection test would be performed here in a real application"
    );
  }

  async function syncModels() {
    if (!settings.ai.openaiApiKey.trim()) {
      modelSyncStatus = "error";
      alert("Please enter your OpenAI API Key first");
      setTimeout(() => {
        modelSyncStatus = "";
      }, 3000);
      return;
    }

    loadingModels = true;
    modelSyncStatus = "loading";

    try {
      // Call OpenAI API to get available models
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${settings.ai.openaiApiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      // Filter for GPT models and sort by name
      availableModels = data.data
        .filter(
          (model: any) =>
            model.id.includes("gpt") &&
            !model.id.includes("instruct") &&
            !model.id.includes("edit")
        )
        .sort((a: any, b: any) => a.id.localeCompare(b.id));

      // Update the aiModels dropdown
      aiModels = availableModels.map((model: any) => ({
        label: model.id.toUpperCase().replace(/-/g, " "),
        value: model.id,
      }));

      modelSyncStatus = "success";
    } catch (error) {
      console.error("Failed to sync models:", error);
      modelSyncStatus = "error";
      alert(`Failed to sync models: ${error.message}`);
    } finally {
      loadingModels = false;
      setTimeout(() => {
        modelSyncStatus = "";
      }, 3000);
    }
  }

  function testAIConnection() {
    if (!settings.ai.openaiApiKey.trim()) {
      alert("Please enter your OpenAI API Key first");
      return;
    }

    alert("Testing connection with your API key...");
    // In a real app, this would test the connection
  }
</script>

<svelte:head>
  <title>System Settings - BigStepLabs Admin</title>
</svelte:head>

{#if !canAccess}
  <Card class="p-8 text-center">
    <AlertCircle class="w-16 h-16 text-destructive mx-auto mb-4" />
    <h2 class="text-xl font-semibold mb-2">Access Denied</h2>
    <p class="text-muted-foreground">
      You need Admin privileges to manage system settings.
    </p>
  </Card>
{:else}
  <!-- Page Header -->
  <div class="mb-8 flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-foreground">System Settings</h1>
      <p class="text-muted-foreground">
        Configure your BigStepLabs installation
      </p>
    </div>

    <div class="flex items-center space-x-2">
      {#if saveStatus === "saving"}
        <span class="text-sm text-muted-foreground">Saving...</span>
      {:else if saveStatus === "success"}
        <div class="flex items-center text-sm text-green-600">
          <CheckCircle class="w-4 h-4 mr-1" />
          Settings saved
        </div>
      {/if}

      <Button on:click={handleSave} disabled={saveStatus === "saving"}>
        <Save class="w-4 h-4 mr-2" />
        Save Changes
      </Button>
    </div>
  </div>

  <!-- Tabs Navigation -->
  <div class="mb-6">
    <div class="border-b border-border">
      <nav class="-mb-px flex space-x-8">
        {#each tabs as tab}
          <button
            class={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            }`}
            on:click={() => (activeTab = tab.id)}
          >
            <div class="flex items-center">
              <svelte:component this={tab.icon} class="w-4 h-4 mr-2" />
              {tab.label}
            </div>
          </button>
        {/each}
      </nav>
    </div>
  </div>

  <!-- Settings Content -->
  <div class="space-y-6">
    {#if activeTab === "general"}
      <Card class="p-6">
        <h2 class="text-lg font-semibold mb-4">General Settings</h2>
        <div class="space-y-4">
          <div>
            <label for="site-name" class="block text-sm font-medium mb-2"
              >Site Name *</label
            >
            <Input
              id="site-name"
              bind:value={settings.general.siteName}
              placeholder="Your LMS Name"
            />
            {#if errors.siteName}
              <p class="text-sm text-destructive mt-1">{errors.siteName}</p>
            {/if}
          </div>

          <div>
            <label for="site-desc" class="block text-sm font-medium mb-2"
              >Site Description</label
            >
            <Textarea
              id="site-desc"
              bind:value={settings.general.siteDescription}
              placeholder="Brief description of your learning platform"
              rows={3}
            />
          </div>

          <div>
            <label for="logo-url" class="block text-sm font-medium mb-2"
              >Logo URL</label
            >
            <Input
              id="logo-url"
              bind:value={settings.general.logoUrl}
              placeholder="/images/logo.png"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="timezone" class="block text-sm font-medium mb-2"
                >Default Timezone</label
              >
              <Select
                id="timezone"
                bind:value={settings.general.timezone}
                options={timezones}
              />
            </div>

            <div>
              <label for="language" class="block text-sm font-medium mb-2"
                >Default Language</label
              >
              <Select
                id="language"
                bind:value={settings.general.defaultLanguage}
                options={languages}
              />
            </div>
          </div>
        </div>
      </Card>
    {/if}

    {#if activeTab === "auth"}
      <Card class="p-6">
        <h2 class="text-lg font-semibold mb-4">Authentication Settings</h2>
        <div class="space-y-4">
          <div class="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allow-registration"
              bind:checked={settings.authentication.allowRegistration}
              class="rounded border-input"
            />
            <label for="allow-registration" class="text-sm font-medium">
              Allow public user registration
            </label>
          </div>

          <div class="flex items-center space-x-2">
            <input
              type="checkbox"
              id="require-email-verification"
              bind:checked={settings.authentication.requireEmailVerification}
              class="rounded border-input"
            />
            <label for="require-email-verification" class="text-sm font-medium">
              Require email verification for new accounts
            </label>
          </div>

          <div class="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enable-magic-link"
              bind:checked={settings.authentication.enableMagicLink}
              class="rounded border-input"
            />
            <label for="enable-magic-link" class="text-sm font-medium">
              Enable magic link authentication
            </label>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                for="session-timeout"
                class="block text-sm font-medium mb-2"
                >Session Timeout (hours)</label
              >
              <Input
                id="session-timeout"
                type="number"
                bind:value={settings.authentication.sessionTimeout}
                min="1"
                max="168"
              />
            </div>

            <div>
              <label
                for="password-min-length"
                class="block text-sm font-medium mb-2"
                >Minimum Password Length</label
              >
              <Input
                id="password-min-length"
                type="number"
                bind:value={settings.authentication.passwordMinLength}
                min="6"
                max="32"
              />
              {#if errors.passwordMinLength}
                <p class="text-sm text-destructive mt-1">
                  {errors.passwordMinLength}
                </p>
              {/if}
            </div>
          </div>
        </div>
      </Card>
    {/if}

    {#if activeTab === "email"}
      <Card class="p-6">
        <h2 class="text-lg font-semibold mb-4">Email Configuration</h2>
        <div class="space-y-4">
          <div class="bg-info/15 border border-info/20 rounded-md p-4">
            <div class="flex">
              <Info class="w-5 h-5 text-info flex-shrink-0" />
              <div class="ml-3">
                <p class="text-sm text-info">
                  Configure SMTP settings to enable email notifications, magic
                  links, and user invitations.
                </p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="smtp-host" class="block text-sm font-medium mb-2"
                >SMTP Host</label
              >
              <Input
                id="smtp-host"
                bind:value={settings.email.smtpHost}
                placeholder="smtp.gmail.com"
              />
            </div>

            <div>
              <label for="smtp-port" class="block text-sm font-medium mb-2"
                >SMTP Port</label
              >
              <Input
                id="smtp-port"
                type="number"
                bind:value={settings.email.smtpPort}
                placeholder="587"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="smtp-user" class="block text-sm font-medium mb-2"
                >SMTP Username</label
              >
              <Input
                id="smtp-user"
                bind:value={settings.email.smtpUser}
                placeholder="your-email@gmail.com"
              />
              {#if errors.smtpUser}
                <p class="text-sm text-destructive mt-1">{errors.smtpUser}</p>
              {/if}
            </div>

            <div>
              <label for="smtp-password" class="block text-sm font-medium mb-2"
                >SMTP Password</label
              >
              <Input
                id="smtp-password"
                type="password"
                bind:value={settings.email.smtpPassword}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="from-email" class="block text-sm font-medium mb-2"
                >From Email</label
              >
              <Input
                id="from-email"
                type="email"
                bind:value={settings.email.fromEmail}
                placeholder="noreply@yoursite.com"
              />
            </div>

            <div>
              <label for="from-name" class="block text-sm font-medium mb-2"
                >From Name</label
              >
              <Input
                id="from-name"
                bind:value={settings.email.fromName}
                placeholder="Your Site Name"
              />
            </div>
          </div>

          <div>
            <Button variant="outline" on:click={testEmailConnection}>
              Test Email Connection
            </Button>
          </div>
        </div>
      </Card>
    {/if}

    {#if activeTab === "ai"}
      <Card class="p-6">
        <h2 class="text-lg font-semibold mb-4">AI Configuration</h2>
        <div class="space-y-4">
          <div class="bg-info/15 border border-info/20 rounded-md p-4">
            <div class="flex">
              <Info class="w-5 h-5 text-info flex-shrink-0" />
              <div class="ml-3">
                <p class="text-sm text-info">
                  Configure AI providers and settings for chat assistants,
                  content generation, and automated feedback.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label for="openai-key" class="block text-sm font-medium mb-2"
              >OpenAI API Key</label
            >
            <div class="flex space-x-2">
              <Input
                id="openai-key"
                type="password"
                bind:value={settings.ai.openaiApiKey}
                placeholder="sk-..."
                class="flex-1"
              />
              <Button
                variant="outline"
                on:click={syncModels}
                disabled={loadingModels || !settings.ai.openaiApiKey.trim()}
                class="px-3"
              >
                {#if loadingModels}
                  <div
                    class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"
                  ></div>
                {:else}
                  <Key class="w-4 h-4" />
                {/if}
                {loadingModels ? "Syncing..." : "Sync Models"}
              </Button>
            </div>
            <div class="flex items-center justify-between mt-1">
              <p class="text-xs text-muted-foreground">
                Required for AI chat functionality and content generation
              </p>
              {#if modelSyncStatus === "success"}
                <div class="flex items-center text-xs text-green-600">
                  <CheckCircle class="w-3 h-3 mr-1" />
                  {aiModels.length} models synced
                </div>
              {:else if modelSyncStatus === "error"}
                <div class="flex items-center text-xs text-red-600">
                  <AlertCircle class="w-3 h-3 mr-1" />
                  Sync failed
                </div>
              {/if}
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="default-model" class="block text-sm font-medium mb-2"
                >Default AI Model</label
              >
              <Select
                id="default-model"
                bind:value={settings.ai.defaultModel}
                options={aiModels}
              />
              {#if aiModels.length > 3}
                <p class="text-xs text-green-600 mt-1">
                  ✅ {aiModels.length} models available
                </p>
              {:else}
                <p class="text-xs text-muted-foreground mt-1">
                  💡 Use "Sync Models" to get your available models
                </p>
              {/if}
            </div>

            <div>
              <label for="max-tokens" class="block text-sm font-medium mb-2"
                >Max Tokens</label
              >
              <Input
                id="max-tokens"
                type="number"
                bind:value={settings.ai.maxTokens}
                min="100"
                max="32000"
              />
            </div>
          </div>

          <div>
            <label for="temperature" class="block text-sm font-medium mb-2">
              Temperature ({settings.ai.temperature})
            </label>
            <input
              type="range"
              id="temperature"
              bind:value={settings.ai.temperature}
              min="0"
              max="2"
              step="0.1"
              class="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
            <div
              class="flex justify-between text-xs text-muted-foreground mt-1"
            >
              <span>Conservative (0.0)</span>
              <span>Creative (2.0)</span>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enable-assistants"
              bind:checked={settings.ai.enableAssistants}
              class="rounded border-input"
            />
            <label for="enable-assistants" class="text-sm font-medium">
              Enable AI assistants for students
            </label>
          </div>

          <div>
            <Button variant="outline" on:click={testAIConnection}>
              Test AI Connection
            </Button>
          </div>
        </div>
      </Card>
    {/if}

    {#if activeTab === "storage"}
      <Card class="p-6">
        <h2 class="text-lg font-semibold mb-4">Storage Settings</h2>
        <div class="space-y-4">
          <div>
            <label for="max-file-size" class="block text-sm font-medium mb-2"
              >Maximum File Size (MB)</label
            >
            <Input
              id="max-file-size"
              type="number"
              bind:value={settings.storage.maxFileSize}
              min="1"
              max="1000"
            />
            {#if errors.maxFileSize}
              <p class="text-sm text-destructive mt-1">{errors.maxFileSize}</p>
            {/if}
          </div>

          <div>
            <label for="allowed-types" class="block text-sm font-medium mb-2"
              >Allowed File Types</label
            >
            <Input
              id="allowed-types"
              bind:value={settings.storage.allowedFileTypes}
              placeholder="pdf,doc,docx,txt,md,jpg,png"
            />
            <p class="text-xs text-muted-foreground mt-1">
              Comma-separated file extensions (without dots)
            </p>
          </div>

          <div>
            <label for="storage-quota" class="block text-sm font-medium mb-2"
              >Storage Quota per User (MB)</label
            >
            <Input
              id="storage-quota"
              type="number"
              bind:value={settings.storage.storageQuota}
              min="100"
              max="100000"
            />
          </div>
        </div>
      </Card>
    {/if}

    {#if activeTab === "appearance"}
      <Card class="p-6">
        <h2 class="text-lg font-semibold mb-4">Appearance Settings</h2>
        <div class="space-y-4">
          <div>
            <label for="primary-color" class="block text-sm font-medium mb-2"
              >Primary Color</label
            >
            <div class="flex items-center space-x-2">
              <input
                type="color"
                id="primary-color"
                bind:value={settings.appearance.primaryColor}
                class="w-12 h-10 border border-input rounded cursor-pointer"
              />
              <Input
                bind:value={settings.appearance.primaryColor}
                placeholder="#3b82f6"
              />
            </div>
          </div>

          <div>
            <label for="theme" class="block text-sm font-medium mb-2"
              >Default Theme</label
            >
            <Select
              id="theme"
              bind:value={settings.appearance.theme}
              options={themes}
            />
          </div>

          <div>
            <label for="custom-css" class="block text-sm font-medium mb-2"
              >Custom CSS</label
            >
            <Textarea
              id="custom-css"
              bind:value={settings.appearance.customCSS}
              placeholder="/* Your custom CSS here */"
              rows={6}
            />
            <p class="text-xs text-muted-foreground mt-1">
              Advanced: Add custom CSS to override default styles
            </p>
          </div>
        </div>
      </Card>
    {/if}
  </div>
{/if}
