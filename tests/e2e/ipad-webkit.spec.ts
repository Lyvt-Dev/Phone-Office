import { awaitSaved } from "./persistence";
import { test, expect } from "@playwright/test";
import { jsPDF } from "jspdf";
test("iPad WebKit: Handschrift, Zwei-Finger-Zoom, Seiten und Offline-Neustart", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: /Neues Notizbuch/ }).click();
  const area = page.locator(".ink-sheet"),
    r = (await area.boundingBox())!,
    clip = (await page.locator(".ink-scroll").boundingBox())!;
  const e = {
    pointerId: 7,
    pointerType: "pen",
    button: 0,
    buttons: 1,
    pressure: 0.3,
    bubbles: true,
    clientX: r.x + 40,
    clientY: clip.y + 80,
  };
  await area.dispatchEvent("pointerdown", e);
  await area.dispatchEvent("pointermove", {
    ...e,
    clientX: e.clientX + 100,
    pressure: 0.9,
  });
  await area.dispatchEvent("pointerup", e);
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(1);
  const a = { ...e, pointerType: "touch", pointerId: 10, clientX: r.x + 100 },
    b = { ...a, pointerId: 11, clientX: r.x + 200 };
  await area.dispatchEvent("pointerdown", a);
  await area.dispatchEvent("pointerdown", b);
  await area.dispatchEvent("pointermove", { ...b, clientX: r.x + 250 });
  await area.dispatchEvent("pointerup", a);
  await area.dispatchEvent("pointerup", b);
  await expect(
    page.getByRole("button", { name: "Notizzoom zurücksetzen" }),
  ).toHaveText("150%");
  await page
    .getByRole("button", { name: "Seitenübersicht", exact: true })
    .click();
  await page.getByLabel("Titel Seite 1").fill("iPad Notiz");
  await page.keyboard.press("Escape");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await awaitSaved(page);
  await page.reload();
  await context.setOffline(true);
  await awaitSaved(page);
  await page.reload();
  await page
    .getByRole("button", { name: /Unbenannte Notiz.*Notizseiten/ })
    .click();
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(1);
  await context.setOffline(false);
  expect(errors).toEqual([]);
});
test("iPad WebKit: PDF-Arbeitsblatt und PDF-Ausgabe funktionieren lokal", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const pdf = new jsPDF();
  pdf.text("iPad Arbeitsblatt", 20, 30);
  await page.goto("/");
  page.once("dialog", (d) => d.accept());
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "iPad.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(pdf.output("arraybuffer")),
    });
  await expect(page.getByRole("status")).toContainText(
    "PDF als neue Notizkopie geöffnet",
    { timeout: 30000 },
  );
  await expect(page.locator(".ink-sheet image")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Notizeinstellungen", exact: true })
    .click();
  page.once("dialog", (d) => d.accept());
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Notizseiten als PDF", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe("iPad.pdf");
  expect(errors).toEqual([]);
});
