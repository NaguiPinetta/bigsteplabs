<script lang="ts">
  import "../app.css";
  import NavBar from "$lib/components/vitrine/NavBar.svelte";
  import Footer from "$lib/components/vitrine/Footer.svelte";
  import { page } from "$app/stores";

  export let data: any;

  // Only show header and footer on vitrine pages (not on /app/* routes)
  $: showVitrineElements = !$page.url.pathname.startsWith("/app");
</script>

<svelte:head>
  <meta name="theme-color" content="#09090b" />
</svelte:head>

{#if showVitrineElements}
  <NavBar />
{/if}
<main>
  <slot />
</main>
{#if showVitrineElements}
  <Footer />
{/if}
