<script lang="ts">
  import "../app.css";
  import NavBar from "$lib/components/vitrine/NavBar.svelte";
  import Footer from "$lib/components/vitrine/Footer.svelte";
</script>

<svelte:head>
  <meta name="theme-color" content="#09090b" />
</svelte:head>

<div class="min-h-screen bg-bg text-textHi antialiased">
  <NavBar />
  <main>
    <slot />
  </main>
  <Footer />
</div>
