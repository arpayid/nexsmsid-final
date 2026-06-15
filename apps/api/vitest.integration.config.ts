import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/integration/**/*.spec.ts"],
    globalSetup: ["test/integration/global-setup.ts"],
    // One API server + one database: run files sequentially for determinism
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 180_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
