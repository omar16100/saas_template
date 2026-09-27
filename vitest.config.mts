import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
    globals: true,
    // lib/env.ts validates process.env at import time; give unit tests the one required var.
    env: { NEXT_PUBLIC_APP_URL: "http://localhost:3000" },
  },
  resolve: {
    alias: { "@": path.dirname(fileURLToPath(import.meta.url)) },
  },
});
