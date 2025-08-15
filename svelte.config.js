import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
    // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
    // See https://svelte.dev/docs/kit/adapters for more information about adapters.
    adapter: adapter(),

    // Handle prerendering errors gracefully
    prerender: {
      handleHttpError: ({ path, referrer, message }) => {
        // Ignore prerendering errors for pages with form actions or dynamic content
        if (
          path === "/contato" ||
          path.startsWith("/cursos/") ||
          path.startsWith("/app/") ||
          path.startsWith("/auth/")
        ) {
          console.warn(`Skipping prerender for ${path}: ${message}`);
          return;
        }

        // Throw error for other pages
        throw new Error(message);
      },
    },
  },
};

export default config;
