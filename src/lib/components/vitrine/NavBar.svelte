<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/button.svelte";
  import { Menu, X } from "lucide-svelte";

  let mobileMenuOpen = false;

  const navigation = [
    { name: "Cursos", href: "/cursos" },
    { name: "Metodologia", href: "/metodologia" },
    { name: "Equipe", href: "/equipe" },
    { name: "FAQ", href: "/faq" },
    { name: "Contato", href: "/contato" },
  ];

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function goToLogin() {
    goto("/app/auth/login");
  }
</script>

<nav class="bg-white shadow-sm border-b border-gray-200">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <!-- Logo and desktop navigation -->
      <div class="flex">
        <div class="flex-shrink-0 flex items-center">
          <a href="/" class="flex items-center space-x-3">
            <img
              src="/images/bigstep-logo.png"
              alt="BigStepLabs Logo"
              class="w-10 h-10 object-contain"
            />
            <span class="text-2xl font-bold text-red-600">BigStepLabs</span>
          </a>
        </div>
        <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
          {#each navigation as item}
            <a
              href={item.href}
              class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 {$page
                .url.pathname === item.href
                ? 'border-red-500 text-gray-900'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
            >
              {item.name}
            </a>
          {/each}
        </div>
      </div>

      <!-- Login button and mobile menu button -->
      <div class="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          on:click={goToLogin}
          class="hidden sm:inline-flex"
        >
          Login
        </Button>

        <button
          type="button"
          class="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          on:click={toggleMobileMenu}
        >
          {#if mobileMenuOpen}
            <X class="h-6 w-6" />
          {:else}
            <Menu class="h-6 w-6" />
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile menu -->
  {#if mobileMenuOpen}
    <div class="sm:hidden">
      <div class="pt-2 pb-3 space-y-1">
        {#each navigation as item}
          <a
            href={item.href}
            class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200 {$page
              .url.pathname === item.href
              ? 'bg-red-50 border-red-500 text-red-700'
              : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}"
          >
            {item.name}
          </a>
        {/each}
        <div class="pt-4 pl-3">
          <Button
            variant="outline"
            size="sm"
            on:click={goToLogin}
            class="w-full"
          >
            Login
          </Button>
        </div>
      </div>
    </div>
  {/if}
</nav>
