<script lang="ts">
  import { onMount } from "svelte";
  import { authStore } from "$lib/stores/auth";
  import { modulesStore, clearModulesStorage } from "$lib/stores/modules";
  import { unitsStore, loadUnits } from "$lib/stores/units";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";

  $: user = $authStore.user;
  $: moduleState = $modulesStore;
  $: unitState = $unitsStore;

  let localStorageData = "";
  let modulesData = "";

  onMount(() => {
    loadLocalStorageData();
    loadModulesData();
  });

  function loadLocalStorageData() {
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem("bigstep_modules");
      localStorageData = stored
        ? JSON.stringify(JSON.parse(stored), null, 2)
        : "No data";
    }
  }

  function loadModulesData() {
    modulesData = JSON.stringify(moduleState.modules, null, 2);
  }

  function handleClearStorage() {
    clearModulesStorage();
    loadLocalStorageData();
    loadModulesData();
  }

  function handleTestUnits() {
    loadUnits();
  }
</script>

<svelte:head>
  <title>Debug Units - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6 space-y-6">
  <h1 class="text-2xl font-bold">Debug Units</h1>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- LocalStorage Data -->
    <Card class="p-6">
      <h2 class="text-lg font-semibold mb-4">LocalStorage Data</h2>
      <pre
        class="bg-muted p-4 rounded text-sm overflow-auto max-h-96">{localStorageData}</pre>
      <Button on:click={handleClearStorage} class="mt-4">
        Clear Storage & Reset
      </Button>
    </Card>

    <!-- Current Modules Store -->
    <Card class="p-6">
      <h2 class="text-lg font-semibold mb-4">Current Modules Store</h2>
      <pre
        class="bg-muted p-4 rounded text-sm overflow-auto max-h-96">{modulesData}</pre>
      <Button on:click={loadModulesData} class="mt-4">Refresh Data</Button>
    </Card>
  </div>

  <!-- Units Store Status -->
  <Card class="p-6">
    <h2 class="text-lg font-semibold mb-4">Units Store Status</h2>
    <div class="space-y-2">
      <p><strong>Loading:</strong> {unitState.loading}</p>
      <p><strong>Error:</strong> {unitState.error || "None"}</p>
      <p><strong>Units Count:</strong> {unitState.units.length}</p>
    </div>
    <Button on:click={handleTestUnits} class="mt-4">Test Load Units</Button>
  </Card>

  <!-- User Info -->
  <Card class="p-6">
    <h2 class="text-lg font-semibold mb-4">User Info</h2>
    <div class="space-y-2">
      <p><strong>User:</strong> {user?.email || "Not logged in"}</p>
      <p><strong>Role:</strong> {user?.role || "Unknown"}</p>
    </div>
  </Card>
</div>
