import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  outputDir: "/tmp/ani-reminder-browser-results",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3016",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.E2E_START_SERVER ? {
    command: "npm run start -- --hostname 127.0.0.1 --port 3016",
    url: "http://127.0.0.1:3016",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  } : undefined,
});
