import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  retries: 0,
  timeout: 90_000,
  outputDir: process.env.PREVIEW_OUTPUT_DIR ?? "test-results",
  use: {
    launchOptions: { slowMo: Number(process.env.PREVIEW_SLOW_MO ?? 0) },
    baseURL: "http://localhost:3107",
    viewport: { width: 1440, height: 1000 },
    video: { mode: "on", size: { width: 1440, height: 1000 } },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
