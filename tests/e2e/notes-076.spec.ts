import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { awaitSaved } from "./persistence";
async function start(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Neues Notizbuch", exact: true })
    .click();
}
async function saved(page: Page) {
  await awaitSaved(page);
  return page.evaluate(
    () => JSON.parse(localStorage.getItem("phone-office.documents.v1")!)[0],
  );
}
async function manager(page: Page) {
  await page.getByRole("button", { name: "Haftnotizen", exact: true }).click();
}
async function png(page: Page) {
  return Buffer.from(
    await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 40;
      c.height = 60;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#245fb5";
      ctx.fillRect(0, 0, 40, 60);
      return c.toDataURL("image/png").split(",")[1];
    }),
    "base64",
  );
}
test("Haftnotiz hat Live-Verschieben, Abbruch, Rückgängig und eine vollständige Sicherung", async ({
  page,
}) => {
  await start(page);
  await manager(page);
  await page.getByLabel("Haftnotiztext").fill("Formeln für morgen");
  await page
    .getByRole("button", { name: "Haftnotiz speichern", exact: true })
    .click();
  const original = (await saved(page)).notebook.pages[0].stickies[0];
  const note = page.locator("[data-sticky-id]").first();
  await expect(note).toContainText("Formeln für morgen");
  const svg = page.locator(".ink-sheet");
  const q = await svg.evaluate((s) => {
    const m = (s as SVGSVGElement).getScreenCTM()!;
    const a = new DOMPoint(100, 100).matrixTransform(m),
      b = new DOMPoint(180, 160).matrixTransform(m);
    return { a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y } };
  });
  await page.mouse.move(q.a.x, q.a.y);
  await page.mouse.down();
  await page.mouse.move(q.b.x, q.b.y);
  await expect
    .poll(async () =>
      Number(
        (await note.getAttribute("transform"))!.match(
          /translate\(([-.\d]+)/,
        )![1],
      ),
    )
    .toBeCloseTo(160, 0);
  expect((await saved(page)).notebook.pages[0].stickies[0].x).toBe(original.x);
  await page.mouse.up();
  expect((await saved(page)).notebook.pages[0].stickies[0].x).toBeCloseTo(
    160,
    0,
  );
  await page
    .getByRole("button", { name: "Strich rückgängig", exact: true })
    .click();
  expect((await saved(page)).notebook.pages[0].stickies[0].x).toBe(original.x);
  await page.mouse.move(q.a.x, q.a.y);
  await page.mouse.down();
  await page.mouse.move(q.b.x, q.b.y);
  await note.dispatchEvent("pointercancel", {
    pointerId: 1,
    pointerType: "mouse",
    bubbles: true,
  });
  await page.mouse.up();
  expect((await saved(page)).notebook.pages[0].stickies[0].x).toBe(original.x);
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  const wait = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Notizbuch sichern", exact: true })
    .click();
  const d = await wait;
  const payload = JSON.parse(await readFile((await d.path())!, "utf8"));
  expect(payload.version).toBe(5);
  expect(payload.notebook.pages[0].stickies[0].text).toBe("Formeln für morgen");
  await page.reload();
  await page.locator(".document-open").first().click();
  await expect(page.locator("[data-sticky-id]")).toContainText(
    "Formeln für morgen",
  );
});
test("Haftnotizen bearbeiten, löschen, wiederherstellen und suchen", async ({
  page,
}) => {
  await start(page);
  await manager(page);
  await page.getByLabel("Haftnotiztext").fill("Erste Erinnerung");
  await page
    .getByRole("button", { name: "Haftnotiz speichern", exact: true })
    .click();
  await manager(page);
  await page.getByRole("button", { name: "Haftnotiz 1 bearbeiten" }).click();
  await page.getByLabel("Haftnotiztext").fill("Prüfung Geschichte");
  await page.getByRole("button", { name: "Haftnotizfarbe #ffd6df" }).click();
  await page.getByLabel("Haftnotizbreite").selectOption("300");
  await page
    .getByRole("button", { name: "Haftnotiz speichern", exact: true })
    .click();
  const n = (await saved(page)).notebook.pages[0].stickies[0];
  expect(n.color).toBe("#ffd6df");
  expect(n.width).toBe(300);
  await manager(page);
  await page.getByRole("button", { name: "Haftnotiz 1 bearbeiten" }).click();
  await page
    .getByRole("button", { name: "Haftnotiz löschen", exact: true })
    .click();
  await page.getByRole("button", { name: "Haftnotizen schließen" }).click();
  await expect(page.locator("[data-sticky-id]")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Strich rückgängig", exact: true })
    .click();
  await expect(page.locator("[data-sticky-id]")).toContainText(
    "Prüfung Geschichte",
  );
  await awaitSaved(page);
  await page
    .getByRole("button", { name: "Zur Dokumentübersicht", exact: true })
    .click();
  await page
    .getByRole("searchbox", { name: "Dokumente suchen" })
    .fill("Prüfung Geschichte");
  await expect(page.locator(".document-card")).toHaveCount(1);
  await page
    .getByRole("searchbox", { name: "Dokumente suchen" })
    .fill("Falscher Text");
  await expect(page.locator(".document-card")).toHaveCount(0);
});
test("Coverbilder bleiben lokal, werden gesichert und können entfernt werden", async ({
  page,
}) => {
  await start(page);
  await awaitSaved(page);
  await page
    .getByRole("button", { name: "Zur Dokumentübersicht", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Unbenannte Notiz verwalten", exact: true })
    .click();
  const buffer = await png(page);
  await page
    .getByLabel("Coverbild auswählen")
    .setInputFiles({ name: "cover.png", mimeType: "image/png", buffer });
  await expect(page.getByAltText("Vorschau deines Coverbildes")).toBeVisible();
  await page
    .getByRole("button", { name: "Änderungen speichern", exact: true })
    .click();
  const cover = (await saved(page)).notebook.coverImage;
  expect(cover).toMatch(/^data:image\/jpeg;base64,/);
  await expect(page.locator(".cover-photo")).toHaveAttribute("src", cover);
  await page.reload();
  await expect(page.locator(".cover-photo")).toHaveAttribute("src", cover);
  await page.locator(".document-open").first().click();
  const wait = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Notizbuch sichern", exact: true })
    .click();
  const d = await wait,
    data = await readFile((await d.path())!);
  expect(JSON.parse(data.toString()).notebook.coverImage).toBe(cover);
  await page.locator("input[type=file]").first().setInputFiles({
    name: "copy.pnote",
    mimeType: "application/json",
    buffer: data,
  });
  await awaitSaved(page);
  await page
    .getByRole("button", { name: "Zur Dokumentübersicht", exact: true })
    .click();
  await expect(page.locator(".cover-photo")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Unbenannte Notiz verwalten", exact: true })
    .first()
    .click();
  await page.getByLabel("Coverbild auswählen").setInputFiles({
    name: "broken.png",
    mimeType: "image/png",
    buffer: Buffer.from("broken"),
  });
  await expect(page.getByRole("alert")).toContainText("Bildformat");
  await expect(
    page.getByAltText("Vorschau deines Coverbildes"),
  ).toHaveAttribute("src", cover);
  await page
    .getByRole("button", { name: "Coverbild entfernen", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Änderungen speichern", exact: true })
    .click();
  await awaitSaved(page);
  await page.reload();
  await expect(page.locator(".cover-photo")).toHaveCount(1);
});
test("Gestaltung wird dauerhaft angewendet, neue Bücher übernehmen Papier und Akzent", async ({
  page,
}) => {
  await page.goto("/");
  const open = async () => {
    const menu = page.getByRole("button", { name: "Menü öffnen", exact: true });
    if (await menu.isVisible()) await menu.click();
    await page
      .getByRole("button", { name: "App anpassen", exact: true })
      .click();
  };
  await open();
  await page.getByRole("button", { name: "Akzent Violett" }).click();
  await page
    .getByLabel("Oberflächenschrift", { exact: true })
    .selectOption("serif");
  await page.getByLabel("Oberflächenschriftgröße").selectOption("120");
  await page.getByLabel("Bibliotheksdichte").selectOption("compact");
  await page.getByLabel("Arbeitsbereich-Hintergrund").selectOption("warm");
  await expect(page.locator("html")).toHaveCSS(
    "background-color",
    "rgb(247, 243, 236)",
  );
  await page.getByLabel("Standardpapier").selectOption("dots");
  await page.getByLabel("Anpassung Dunkelmodus").check();
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  await page.reload();
  await open();
  await expect(
    page.getByLabel("Oberflächenschrift", { exact: true }),
  ).toHaveValue("serif");
  await expect(page.getByLabel("Oberflächenschriftgröße")).toHaveValue("120");
  await expect(page.getByLabel("Anpassung Dunkelmodus")).toBeChecked();
  await expect(page.locator("html")).toHaveAttribute("data-accent", "violet");
  expect(
    await page.locator(".app").evaluate((e) => getComputedStyle(e).fontFamily),
  ).toContain("Georgia");
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  await page
    .getByRole("button", { name: "Neues Notizbuch", exact: true })
    .click();
  const n = (await saved(page)).notebook;
  expect(n.pages[0].paper).toBe("dots");
  expect(n.coverColor).toBe("#7142b5");
  await page
    .getByRole("button", { name: "Zur Dokumentübersicht", exact: true })
    .click();
  await open();
  await page
    .getByRole("button", { name: "Gestaltung zurücksetzen", exact: true })
    .click();
  await expect(
    page.getByLabel("Oberflächenschrift", { exact: true }),
  ).toHaveValue("manrope");
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  const fontReady = await page.evaluate(async () => {
    await document.fonts.load("16px Manrope");
    return document.fonts.check("16px Manrope");
  });
  expect(fontReady).toBe(true);
});
test("Haftnotizen sind im tatsächlichen PDF-Export sichtbar und beim Import als Hintergrund erhalten", async ({
  page,
}) => {
  await start(page);
  await manager(page);
  await page.getByLabel("Haftnotiztext").fill("Erinnerung im PDF");
  await page
    .getByRole("button", { name: "Haftnotiz speichern", exact: true })
    .click();
  await awaitSaved(page);
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  const messages: string[] = [];
  page.on("dialog", async (d) => {
    messages.push(d.message());
    await d.accept();
  });
  await page
    .getByRole("button", { name: "Notizeinstellungen", exact: true })
    .click();
  const wait = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Notizseiten als PDF", exact: true })
    .click();
  const download = await wait;
  expect(messages[0]).toContain("Haftnotizen");
  expect(messages[0]).toContain("nicht mehr einzeln bearbeitbar");
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "sticky.pdf",
      mimeType: "application/pdf",
      buffer: await readFile((await download.path())!),
    });
  await expect
    .poll(async () => (await saved(page)).notebook.pages[0].background)
    .toMatch(/^data:image\/jpeg;base64,/);
  const doc = await saved(page);
  expect(doc.notebook.pages[0].background).toMatch(/^data:image\/jpeg;base64,/);
  expect(doc.notebook.pages[0].stickies || []).toHaveLength(0);
  const pixel = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = 800;
    c.height = 1100;
    const x = c.getContext("2d")!;
    x.drawImage(img, 0, 0, 800, 1100);
    return Array.from(x.getImageData(100, 100, 1, 1).data);
  }, doc.notebook.pages[0].background);
  expect(pixel[0]).toBeGreaterThan(235);
  expect(pixel[1]).toBeGreaterThan(220);
  expect(pixel[2]).toBeLessThan(195);
});
