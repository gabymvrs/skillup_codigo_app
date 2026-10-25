import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: { allowedHosts: ["terminal.local"] },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    restoreMocks: true,
    // Tests must never inherit credentials from a developer's .env.local.
    env: {
      VITE_SUPABASE_URL: "",
      VITE_SUPABASE_PUBLISHABLE_KEY: "",
      VITE_ENABLE_DEMO: "true",
    },
  },
  build: { sourcemap: false, chunkSizeWarningLimit: 650 },
});
