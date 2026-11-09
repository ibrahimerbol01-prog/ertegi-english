import { defineConfig } from "vitest/config";

// Day boundaries (streak, review dates) are checked in the learners' own time zone.
process.env.TZ = "Asia/Almaty";

export default defineConfig({
  // Tests run as the ordinary build (src/research/mode.ts).
  define: { __ERTEGI_RESEARCH__: "false" },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "api/**/*.test.js", "research/**/*.test.ts"],
    setupFiles: ["test/setup.ts"],
    restoreMocks: true,
  },
});
