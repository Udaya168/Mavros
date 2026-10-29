import { defineConfig } from "vitest/config";

export default defineConfig({
  root: "..",
  test: {
    include: ["backend/tests/**/*.{test,spec}.ts"],
  },
});
