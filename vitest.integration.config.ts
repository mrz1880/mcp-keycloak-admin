import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/integration/**/*.test.ts"],
    environment: "node",
    // Integration tests start real containers; give them room.
    testTimeout: 120_000,
    hookTimeout: 180_000,
  },
});
