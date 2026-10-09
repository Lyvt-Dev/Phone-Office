import { defineConfig, devices } from "@playwright/test";
const production = process.env.PHONE_OFFICE_PRODUCTION === "1";
const appUrl = production ? "http://127.0.0.1:4173" : "http://127.0.0.1:5173";
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: appUrl,
    launchOptions: process.env.PHONE_OFFICE_CHROMIUM
      ? { executablePath: process.env.PHONE_OFFICE_CHROMIUM }
      : {},
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command: production ? "npm run preview" : "npm run dev",
    url: appUrl,
    reuseExistingServer: true,
  },
  reporter: "list",
});
