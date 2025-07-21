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
});
