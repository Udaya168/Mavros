import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

const repositoryRoot = process.cwd().toLowerCase().endsWith(`${path.sep}frontend`)
  ? path.resolve(process.cwd(), "..")
  : process.cwd();

export default defineConfig({
  root: repositoryRoot,
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["frontend/src/test/setup.ts"],
    include: ["frontend/src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(repositoryRoot, "frontend/src"),
      "@shared": path.resolve(repositoryRoot, "shared"),
    },
  },
  server: {
    fs: {
      allow: [repositoryRoot],
    },
  },
});
