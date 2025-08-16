<script lang="ts">
  import { page } from "$app/stores";

  // Hide on /app/* routes
  $: showFooter = !$page.url.pathname.startsWith("/app");
</script>

{#if showFooter}
  <footer class="bg-textHi text-textInvHi">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Company Info -->
        <div class="col-span-1 md:col-span-2">
          <div class="flex items-center space-x-3 mb-4">
            <img
              src="/images/bigstep-logo.png"
              alt="BigStepLabs Logo"
              class="w-10 h-10 object-contain"
            />
            <h3 class="text-2xl font-bold text-brand">BigStepLabs</h3>
          </div>
          <p class="text-textInvLo mb-6 max-w-md">
            Transforme seu aprendizado de idiomas com nossa metodologia
            inovadora e tecnologia de IA avançada.
          </p>

          <!-- Primary CTA -->
          <div class="mb-6">
            <a
              href="https://wa.me/5585999883225?text=Olá! Gostaria de agendar uma entrevista para conhecer os cursos da BigStepLabs."
              class="inline-flex items-center rounded-xl2 bg-brand px-5 py-3 font-semibold text-white shadow-soft hover:bg-brandHover focus:outline-none focus:ring-4 focus:ring-brandRing transition-all duration-300"
            >
              Agendar entrevista
            </a>
          </div>

          <div class="flex space-x-4">
            <a
              href="https://facebook.com/bigsteplabs"
              class="text-textInvLo hover:text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span class="sr-only">Facebook</span>
              <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
            </a>
            <a
              href="https://instagram.com/bigsteplabs"
              class="text-textInvLo hover:text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span class="sr-only">Instagram</span>
              <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323z"
                />
              </svg>
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="text-lg font-semibold mb-4">Links Rápidos</h4>
          <ul class="space-y-2">
            <li>
              <a
                href="/cursos"
                class="text-textInvLo hover:text-white transition-colors"
                >Cursos</a
              >
            </li>
            <li>
              <a
                href="/metodologia"
                class="text-textInvLo hover:text-white transition-colors"
                >Metodologia</a
              >
            </li>
            <li>
              <a
                href="/equipe"
                class="text-textInvLo hover:text-white transition-colors"
                >Equipe</a
              >
            </li>
            <li>
              <a
                href="/faq"
                class="text-textInvLo hover:text-white transition-colors">FAQ</a
              >
            </li>
          </ul>
        </div>

        <!-- Contact Info -->
        <div>
          <h4 class="text-lg font-semibold mb-4">Contato</h4>
          <ul class="space-y-2 text-textInvLo">
            <li>contato@bigsteplabs.xyz</li>
            <li>+55 (11) 99999-9999</li>
            <li>São Paulo, SP</li>
          </ul>
        </div>
      </div>

      <div
        class="border-t border-textInvLo/20 mt-8 pt-8 text-center text-textInvLo"
      >
        <p>&copy; 2024 BigStepLabs. Todos os direitos reservados.</p>
      </div>
    </div>
  </footer>
{/if}
