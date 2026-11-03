import { defineConfig } from "vitest/config";

// Day boundaries (streak, review dates) are checked in the learners' own time zone.
process.env.TZ = "Asia/Almaty";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "api/**/*.test.js"],
    setupFiles: ["test/setup.ts"],
    restoreMocks: true,
  },
});
