import type { Page } from "@playwright/test";
export async function awaitSaved(page: Page) {
  await page.waitForFunction(() => {
    const status =
      document.querySelector(".save-meta") ||
      document.querySelector(".dashboard footer");
    return status?.textContent?.includes("Lokal gespeichert");
  });
}
