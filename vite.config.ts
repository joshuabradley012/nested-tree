import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@core": resolve(__dirname, "src/core"),
      "@store": resolve(__dirname, "src/store"),
      "@adapters": resolve(__dirname, "src/adapters"),
      "@components": resolve(__dirname, "src/components"),
      "@ui": resolve(__dirname, "src/components/ui"),
      "@tests": resolve(__dirname, "src/tests"),
      "@lib": resolve(__dirname, "src/lib"),
      "@hooks": resolve(__dirname, "src/hooks"),
    }
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      reporter: ["text", "html"],
      provider: "v8",
    },
    css: true,
  },
});

