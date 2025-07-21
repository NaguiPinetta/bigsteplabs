<script lang="ts">
  import { goto } from "$app/navigation";
  import { authStore } from "$lib/stores/auth";

  // Mock user for development testing
  function loginAsMockAdmin() {
    authStore.set({
      session: { access_token: "mock", refresh_token: "mock" } as any,
      user: {
        id: "mock-admin-id",
        email: "admin@bigsteplabs.com",
        role: "Admin",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      loading: false,
    });
    goto("/dashboard");
  }

  function loginAsMockCollaborator() {
    authStore.set({
      session: { access_token: "mock", refresh_token: "mock" } as any,
      user: {
        id: "mock-collab-id",
        email: "collaborator@bigsteplabs.com",
        role: "Collaborator",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      loading: false,
    });
    goto("/dashboard");
  }

  function loginAsMockStudent() {
    authStore.set({
      session: { access_token: "mock", refresh_token: "mock" } as any,
      user: {
        id: "mock-student-id",
        email: "student@bigsteplabs.com",
        role: "Student",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      loading: false,
    });
    goto("/dashboard");
  }
</script>

<svelte:head>
  <title>Development Mode - BigStepLabs</title>
  <meta name="description" content="Development testing without Supabase" />
</svelte:head>

<main class="min-h-screen bg-background flex items-center justify-center p-4">
  <div class="max-w-md w-full space-y-6">
    <div class="text-center">
      <h1 class="text-3xl font-bold text-foreground mb-2">
        🚀 Development Mode
      </h1>
      <p class="text-muted-foreground">
        Test BigStepLabs without Supabase credentials
      </p>
    </div>

    <div class="bg-card border rounded-lg p-6 space-y-4">
      <h2 class="text-lg font-semibold mb-4">Choose Your Role:</h2>

      <button
        on:click={loginAsMockAdmin}
        class="w-full bg-red-600 text-white p-3 rounded-md hover:bg-red-700 transition-colors text-left"
      >
        <div class="font-semibold">👑 Admin</div>
        <div class="text-sm opacity-90">Full access to all features</div>
      </button>

      <button
        on:click={loginAsMockCollaborator}
        class="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition-colors text-left"
      >
        <div class="font-semibold">✏️ Collaborator</div>
        <div class="text-sm opacity-90">Content & agent management</div>
      </button>

      <button
        on:click={loginAsMockStudent}
        class="w-full bg-green-600 text-white p-3 rounded-md hover:bg-green-700 transition-colors text-left"
      >
        <div class="font-semibold">🎓 Student</div>
        <div class="text-sm opacity-90">Learning and chat access</div>
      </button>
    </div>

    <div class="bg-muted p-4 rounded-lg text-sm">
      <p class="font-semibold mb-2">⚠️ Development Mode Only</p>
      <p class="text-muted-foreground">
        This bypasses authentication for UI testing. Database operations will
        fail without proper Supabase setup.
      </p>
    </div>

    <div class="text-center">
      <a
        href="/"
        class="text-sm text-muted-foreground hover:text-foreground underline"
      >
        ← Back to Main App
      </a>
    </div>
  </div>
</main>
