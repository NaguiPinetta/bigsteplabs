<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";

  let status = "Testing...";
  let tables: string[] = [];
  let error = "";

  onMount(async () => {
    try {
      status = "Connecting to database...";

      // Test basic connection
      const { data, error: connError } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .limit(5);

      if (connError) {
        error = `Connection failed: ${connError.message}`;
        status = "Failed";
        return;
      }

      tables = data?.map((t) => t.table_name) || [];
      status = `Connected! Found ${tables.length} tables`;
    } catch (err) {
      error = `Error: ${err}`;
      status = "Failed";
    }
  });
</script>

<svelte:head>
  <title>Simple DB Test - BigStepLabs</title>
</svelte:head>

<div class="container mx-auto p-6">
  <h1 class="text-2xl font-bold mb-4">Simple Database Test</h1>

  <div class="space-y-4">
    <div class="p-4 border rounded">
      <strong>Status:</strong>
      {status}
    </div>

    {#if error}
      <div class="p-4 border border-red-200 bg-red-50 rounded">
        <strong>Error:</strong>
        {error}
      </div>
    {/if}

    {#if tables.length > 0}
      <div class="p-4 border rounded">
        <strong>Tables found:</strong>
        <ul class="list-disc list-inside mt-2">
          {#each tables as table}
            <li>{table}</li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</div>
