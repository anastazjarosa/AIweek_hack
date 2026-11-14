import { defineConfig } from "vitest/config";

// Unit tests only; browser journeys live in e2e/ and run with Playwright.
export default defineConfig({ test: { include: ["lib/**/*.test.ts"] } });
