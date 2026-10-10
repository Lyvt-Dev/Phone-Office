import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: ["ipad-webkit.spec.ts", "notes-060.spec.ts"],
  workers: 1,
  use: { baseURL: "http://127.0.0.1:4173" },
  projects: [
    {
      name: "ipad-webkit",
      use: { ...devices["iPad Pro 11"], browserName: "webkit" },
    },
  ],
  webServer: {
    command: "npm run preview",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
  },
  reporter: "list",
});
