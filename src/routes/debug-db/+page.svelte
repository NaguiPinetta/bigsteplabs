<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";

  let modules = [];
  let units = [];
  let loading = true;
  let error = "";

  onMount(async () => {
    await loadAllData();
  });

  async function loadAllData() {
    loading = true;
    error = "";

    try {
      // Load modules
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select("*")
        .order("created_at", { ascending: false });

      if (modulesError) {
        error = `Modules error: ${modulesError.message}`;
        console.error("Modules error:", modulesError);
      } else {
        modules = modulesData || [];
        console.log("Modules from database:", modules);
      }

      // Load units
      const { data: unitsData, error: unitsError } = await supabase
        .from("units")
        .select("*")
        .order("created_at", { ascending: false });

      if (unitsError) {
        error = error
          ? `${error}; Units error: ${unitsError.message}`
          : `Units error: ${unitsError.message}`;
        console.error("Units error:", unitsError);
      } else {
        units = unitsData || [];
        console.log("Units from database:", units);
      }
    } catch (err) {
      error = err.message;
      console.error("Unexpected error:", err);
    } finally {
      loading = false;
    }
  }

  async function createTestModule() {
    try {
      const { data, error: dbError } = await supabase
        .from("modules")
        .insert({
          title: "Test Module " + new Date().toISOString(),
          description: "This is a test module created via debug page",
          is_published: false,
        })
        .select()
        .single();

      if (dbError) {
        error = dbError.message;
        console.error("Create error:", dbError);
      } else {
        console.log("Created module:", data);
        await loadAllData(); // Refresh the list
      }
    } catch (err) {
      error = err.message;
      console.error("Create error:", err);
    }
  }

  async function clearAllData() {
    if (
      !confirm(
        "Are you sure you want to delete ALL modules and units? This cannot be undone!"
      )
    ) {
      return;
    }

    try {
      // Delete units first (due to foreign key constraints)
      const { error: unitsError } = await supabase
        .from("units")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (unitsError) {
        console.error("Error deleting units:", unitsError);
      }

      // Delete modules
      const { error: modulesError } = await supabase
        .from("modules")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (modulesError) {
        console.error("Error deleting modules:", modulesError);
      }

      await loadAllData(); // Refresh the list
    } catch (err) {
      error = err.message;
      console.error("Delete error:", err);
    }
  }
</script>

<svelte:head>
  <title>Database Debug - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6 space-y-6">
  <h1 class="text-2xl font-bold">Database Debug</h1>

  <div class="flex gap-4">
    <Button on:click={loadAllData}>Refresh All Data</Button>
    <Button on:click={createTestModule}>Create Test Module</Button>
    <Button variant="destructive" on:click={clearAllData}>Clear All Data</Button
    >
  </div>

  {#if error}
    <Card class="p-4 bg-red-50 border-red-200">
      <h3 class="font-semibold text-red-800">Error</h3>
      <p class="text-red-700">{error}</p>
    </Card>
  {/if}

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Modules -->
    <Card class="p-6">
      <h2 class="text-lg font-semibold mb-4">
        Modules in Database ({modules.length})
      </h2>

      {#if loading}
        <p>Loading...</p>
      {:else if modules.length === 0}
        <p class="text-muted-foreground">No modules found in database.</p>
      {:else}
        <div class="space-y-4">
          {#each modules as module}
            <div class="border rounded p-4">
              <h3 class="font-semibold">{module.title}</h3>
              <p class="text-sm text-muted-foreground">{module.description}</p>
              <div class="text-xs text-muted-foreground mt-2">
                ID: {module.id}<br />
                Created: {new Date(module.created_at).toLocaleString()}<br />
                Published: {module.is_published ? "Yes" : "No"}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </Card>

    <!-- Units -->
    <Card class="p-6">
      <h2 class="text-lg font-semibold mb-4">
        Units in Database ({units.length})
      </h2>

      {#if loading}
        <p>Loading...</p>
      {:else if units.length === 0}
        <p class="text-muted-foreground">No units found in database.</p>
      {:else}
        <div class="space-y-4">
          {#each units as unit}
            <div class="border rounded p-4">
              <h3 class="font-semibold">{unit.title}</h3>
              <p class="text-sm text-muted-foreground">
                {unit.description || "No description"}
              </p>
              <div class="text-xs text-muted-foreground mt-2">
                ID: {unit.id}<br />
                Module ID: {unit.module_id}<br />
                Created: {new Date(unit.created_at).toLocaleString()}<br />
                Status: {unit.status}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </Card>
  </div>
</div>
