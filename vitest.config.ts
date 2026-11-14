import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests only; browser journeys live in e2e/ and run with Playwright.
// The "@/" alias matches tsconfig paths, so library code can be tested with its real imports.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: { include: ["lib/**/*.test.ts"] },
});
