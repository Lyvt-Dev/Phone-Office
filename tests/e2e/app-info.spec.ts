import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const { version } = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
);
test("Creator und Versionshinweise sind offline erreichbar; Lizenzdialog ist bedienbar", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Neues Notizbuch", exact: true }),
  ).toBeVisible();
  const menu = page.getByRole("button", { name: "Menü öffnen", exact: true });
  if (await menu.isVisible()) await menu.click();
  await expect(page.locator(".sidebar-version")).toContainText(
    "Erstellt von Lyvt",
  );
  await expect(page.locator(".sidebar-version")).toContainText(version);
  await page
    .getByRole("button", { name: "Über Phone Office", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Über Phone Office",
    exact: true,
  });
  await expect(dialog).toContainText(".pnote");
  await expect(dialog).toContainText("Erstellt von Lyvt");
  await dialog.locator("summary").click();
  await expect(dialog.locator("pre")).toContainText("SIL OPEN FONT LICENSE");
  await expect(dialog.locator("pre")).toContainText("react@");
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Neues Notizbuch", exact: true }),
  ).toBeVisible();
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole("button", { name: "Über Phone Office", exact: true })
    .click();
  await expect(dialog).toContainText(version);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
