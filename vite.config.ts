import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@core": resolve(__dirname, "src/core"),
      "@store": resolve(__dirname, "src/store"),
      "@adapters": resolve(__dirname, "src/adapters"),
      "@ui": resolve(__dirname, "src/ui"),
      "@tests": resolve(__dirname, "src/tests")
    }
  },
  server: {
    port: 5173,
    strictPort: true
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      reporter: ["text", "html"],
      provider: "v8"
    },
    css: true
  }
});

