import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      $lib: "/src/lib",
      $components: "/src/components",
      $types: "/src/lib/types",
      $stores: "/src/lib/stores",
      $utils: "/src/lib/utils",
    },
  },
  // Expose environment variables for server-side use
  define: {
    // This makes SUPABASE_SERVICE_ROLE_KEY available server-side
    'process.env.SUPABASE_SERVICE_ROLE_KEY': JSON.stringify(process.env.SUPABASE_SERVICE_ROLE_KEY),
  },
});
