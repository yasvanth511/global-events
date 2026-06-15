import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Only run the TypeScript source tests — never the compiled copies in dist/.
    include: ["src/**/*.test.ts"],
  },
});
