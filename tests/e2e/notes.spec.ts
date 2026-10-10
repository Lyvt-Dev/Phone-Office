import { readFileSync } from "node:fs";
const { version } = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
);
import { awaitSaved } from "./persistence";
import { readFile } from "node:fs/promises";
import { test, expect, type Page } from "@playwright/test";
let errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
});
test.afterEach(() => {
  expect(errors).toEqual([]);
});
async function draw(page: Page, type = "pen", pointerId = 7) {
  const surface = page.getByRole("img", { name: "Schreibfläche Seite 1" });
  await surface.scrollIntoViewIfNeeded();
  const raw = (await surface.boundingBox())!;
  const clip = (await page.locator(".ink-scroll").boundingBox())!;
  const box = { ...raw, y: Math.max(raw.y, clip.y) };
  if (type === "pen") {
    const session = await page.context().newCDPSession(page);
    await session.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x: box.x + 40,
      y: box.y + 80,
      button: "left",
      buttons: 1,
      pointerType: "pen",
      force: 0.3,
    });
    await session.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: box.x + 140,
      y: box.y + 110,
      button: "left",
      buttons: 1,
      pointerType: "pen",
      force: 0.9,
    });
    await session.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: box.x + 140,
      y: box.y + 110,
      button: "left",
      buttons: 0,
      pointerType: "pen",
    });
    await session.detach();
    await awaitSaved(page);
    return;
  }
  const start = {
    pointerId,
    pointerType: type,
    clientX: box.x + 40,
    clientY: box.y + 80,
    pressure: 0.3,
    buttons: 1,
    button: 0,
    bubbles: true,
  };
  await surface.dispatchEvent("pointerdown", start);
  await surface.dispatchEvent("pointermove", {
    ...start,
    clientX: box.x + 140,
    clientY: box.y + 110,
    pressure: 0.9,
  });
  await surface.dispatchEvent("pointerup", { ...start, buttons: 0 });
  await awaitSaved(page);
}
test("Handschrift, mehrere Seiten und Text über Sicherung wieder öffnen", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Neues Notizbuch/ }).click();
  await page.getByLabel("Dokumenttitel").fill("Mathe Notizen");
  await page
    .getByRole("button", { name: "Notizeinstellungen", exact: true })
    .click();
  await page.getByLabel("Schulfach").fill("Mathematik");
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  await draw(page);
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(1);
  await awaitSaved(page);
  const pressures = await page.evaluate(() =>
    JSON.parse(
      localStorage.getItem("phone-office.documents.v1")!,
    )[0].notebook.pages[0].strokes[0].points.map(
      (p: { pressure: number }) => p.pressure,
    ),
  );
  expect(pressures[0]).toBeCloseTo(0.3, 3);
  expect(pressures.at(-1)).toBeCloseTo(0.9, 3);
  await page.getByRole("button", { name: "Strich rückgängig" }).click();
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(0);
  await page.getByRole("button", { name: "Strich wiederholen" }).click();
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(1);
  await page.getByRole("button", { name: "Seite hinzufügen" }).click();
  await page
    .getByRole("button", { name: "Notizeinstellungen", exact: true })
    .click();
  await page.getByLabel("Notizpapier").selectOption("ruled");
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  await page.getByRole("tab", { name: "Text", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Dokument bearbeiten" })
    .fill("Satz des Pythagoras");
  const wait = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Notizbuch sichern", exact: true })
    .click();
  const download = await wait;
  expect(download.suggestedFilename()).toBe("Mathe Notizen.pnote");
  const path = (await download.path())!;
  await awaitSaved(page);
  await page.reload();
  await page
    .getByRole("button", { name: /Mathe Notizen.*2 Notizseiten/ })
    .click();
  await page
    .getByRole("button", { name: "Notizeinstellungen", exact: true })
    .click();
  await expect(page.getByLabel("Schulfach")).toHaveValue("Mathematik");
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(1);
  const beforeImport = await page.evaluate(
    () => JSON.parse(localStorage.getItem("phone-office.documents.v1")!)[0].id,
  );
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: download.suggestedFilename(),
      mimeType: "application/json",
      buffer: await readFile(path),
    });
  await expect(page.getByRole("status")).toContainText(
    "Notizbuch als neue lokale Kopie geöffnet.",
  );
  await awaitSaved(page);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("phone-office.documents.v1")!),
  );
  expect(saved).toHaveLength(2);
  expect(saved[0].id).not.toBe(beforeImport);
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Notizeinstellungen", exact: true })
    .click();
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  await page.getByLabel("Notizseite", { exact: true }).selectOption("1");
  await page
    .getByRole("button", { name: "Notizeinstellungen", exact: true })
    .click();
  await expect(page.getByLabel("Notizpapier")).toHaveValue("ruled");
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  await page.getByRole("tab", { name: "Text", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Dokument bearbeiten" }),
  ).toContainText("Satz des Pythagoras");
  await page.getByRole("tab", { name: "Handschrift" }).click();
  await page.getByLabel("Notizseite", { exact: true }).selectOption("0");
  await page.screenshot({
    path: `/tmp/phone-office-notes-${info.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("Finger zeichnet nur nach Freigabe; Stift sperrt gleichzeitige Handballen", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Neues Notizbuch/ }).click();
  await draw(page, "touch");
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(0);
  const surface = page.getByRole("img", { name: "Schreibfläche Seite 1" }),
    box = (await surface.boundingBox())!;
  const e = {
    pointerId: 10,
    pointerType: "pen",
    clientX: box.x + 50,
    clientY: box.y + 90,
    pressure: 0.5,
    buttons: 1,
    button: 0,
    bubbles: true,
  };
  await surface.dispatchEvent("pointerdown", e);
  await draw(page, "touch", 11);
  await surface.dispatchEvent("pointerup", { ...e, buttons: 0 });
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Notizeinstellungen", exact: true })
    .click();
  await page.getByRole("checkbox", { name: "Mit Finger zeichnen" }).check();
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  await draw(page, "touch", 12);
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(2);
});
test("Radieren, SVG-Ausgabe und Verlustwarnung beim Text-Export", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Neues Notizbuch/ }).click();
  await draw(page);
  await page.getByRole("button", { name: "Radierer", exact: true }).click();
  await draw(page);
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(0);
  await page.getByRole("button", { name: "Strich rückgängig" }).click();
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(1);
  const wait = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Notizeinstellungen", exact: true })
    .click();
  await page.getByRole("button", { name: "Seite als SVG exportieren" }).click();
  expect((await wait).suggestedFilename()).toContain("-seite.svg");
  await page
    .getByRole("button", { name: "Notizeinstellungen", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Weitere Exportformate", exact: true })
    .click();
  let message = "";
  page.once("dialog", async (d) => {
    message = d.message();
    await d.dismiss();
  });
  await page.getByRole("button", { name: /HTML-Dokument/ }).click();
  expect(message).toContain("Handschrift und Notizseiten fehlen");
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(1);
});

test("Abgebrochene Striche bleiben sauber; Textmarker und Drehen erhalten Notizen", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Neues Notizbuch/ }).click();
  const surface = page.getByRole("img", { name: "Schreibfläche Seite 1" }),
    box = (await surface.boundingBox())!;
  const e = {
    pointerId: 21,
    pointerType: "pen",
    clientX: box.x + 50,
    clientY: box.y + 90,
    pressure: 0.5,
    buttons: 1,
    button: 0,
    bubbles: true,
  };
  await surface.dispatchEvent("pointerdown", e);
  await surface.dispatchEvent("pointermove", { ...e, clientX: box.x + 100 });
  await surface.dispatchEvent("pointercancel", { ...e, buttons: 0 });
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(0);
  await page.getByRole("button", { name: "Textmarker", exact: true }).click();
  await draw(page);
  await expect(page.locator("[data-ink-stroke]")).toHaveAttribute(
    "opacity",
    "0.3",
  );
  await page.setViewportSize({ width: 1180, height: 820 });
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(1);
  await awaitSaved(page);
  await page.reload();
  await page
    .getByRole("button", { name: /Unbenannte Notiz.*Notizseiten/ })
    .click();
  await expect(page.locator("[data-ink-stroke]")).toHaveAttribute(
    "opacity",
    "0.3",
  );
});

test("Notizeinstellungen bleiben erhalten und schließen mit Escape", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Neues Notizbuch/ }).click();
  const trigger = page.getByRole("button", {
    name: "Notizeinstellungen",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog", {
    name: "Notizeinstellungen",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Stift", exact: true }).click();
  await page.getByRole("button", { name: "Blau", exact: true }).click();
  await page.getByLabel("Strichstärke", { exact: true }).selectOption("6");
  await page.keyboard.press("Escape");
  await trigger.click();
  await page.getByLabel("Notizzoom", { exact: true }).selectOption("125");
  await page.getByRole("checkbox", { name: "Mit Finger zeichnen" }).check();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await draw(page);
  await expect(page.locator("[data-ink-stroke]")).toHaveAttribute(
    "fill",
    "#2563eb",
  );
  await awaitSaved(page);
  await page.reload();
  await page
    .getByRole("button", { name: /Unbenannte Notiz.*Notizseiten/ })
    .click();
  await trigger.click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Stift", exact: true }).click();
  await expect(page.getByLabel("Stiftfarbe", { exact: true })).toHaveValue(
    "#2563eb",
  );
  await expect(page.getByLabel("Strichstärke", { exact: true })).toHaveValue(
    "6",
  );
  await page.keyboard.press("Escape");
  await trigger.click();
  await expect(page.getByLabel("Notizzoom", { exact: true })).toHaveValue(
    "125",
  );
  await expect(
    page.getByRole("checkbox", { name: "Mit Finger zeichnen" }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "Notizeinstellungen schließen" })
    .click();
  await expect(dialog).not.toBeVisible();
});

test("Querformat zeigt große Schreibfläche und erreichbare Icon-Werkzeuge", async ({
  page,
}) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/");
  await page.getByRole("button", { name: /Neues Notizbuch/ }).click();
  const area = (await page.locator(".ink-scroll").boundingBox())!;
  expect(area.height).toBeGreaterThan(230);
  expect(area.y + area.height).toBeLessThanOrEqual(390);
  for (const name of ["Stift", "Radierer", "Notizeinstellungen"]) {
    const button = page.getByRole("button", { name, exact: true });
    await expect(button).toBeVisible();
    const b = (await button.boundingBox())!;
    expect(b.width).toBeGreaterThanOrEqual(48);
    expect(b.height).toBeGreaterThanOrEqual(48);
    expect(b.y + b.height).toBeLessThanOrEqual(area.y);
  }
  await draw(page);
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Notizeinstellungen", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Notizeinstellungen" }),
  ).toBeVisible();
  await page.getByLabel("Notizpapier").selectOption("plain");
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(1);
  await page.screenshot({
    path: "/tmp/phone-office-notes-phone-landscape.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Zur Dokumentübersicht" }).click();
  await expect(page.locator(".document-card")).toHaveCount(1);
});

test("Zwei Finger zoomen ohne Striche zu verändern; Zoom bleibt nach Neustart", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Neues Notizbuch/ }).click();
  await draw(page);
  const before = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("phone-office.documents.v1")!)[0].notebook
        .pages,
  );
  const clip = (await page.locator(".ink-scroll").boundingBox())!;
  const y = clip.y + Math.min(120, clip.height / 2),
    x = clip.x + clip.width / 2,
    span = Math.min(100, clip.width / 5);
  const cdp = await page.context().newCDPSession(page);
  const points = (d: number) => [
    { x: x - d, y, id: 1 },
    { x: x + d, y, id: 2 },
  ];
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: points(span),
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: points(span * 1.5),
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await cdp.detach();
  await awaitSaved(page);
  const n = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("phone-office.documents.v1")!)[0]
        .notebook,
  );
  expect(n.preferences.zoom).toBeGreaterThanOrEqual(145);
  expect(n.preferences.zoom).toBeLessThanOrEqual(155);
  expect(n.pages).toEqual(before);
  await awaitSaved(page);
  await page.reload();
  await page
    .getByRole("button", { name: /Unbenannte Notiz.*Notizseiten/ })
    .click();
  await expect(
    page.getByRole("button", { name: "Notizzoom zurücksetzen" }),
  ).toHaveText(`${n.preferences.zoom}%`);
  await draw(page);
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(2);
});

test("Zweiter Finger bricht nur eine unfertige Fingerzeichnung ab", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Neues Notizbuch/ }).click();
  await page
    .getByRole("button", { name: "Notizeinstellungen", exact: true })
    .click();
  await page.getByRole("checkbox", { name: "Mit Finger zeichnen" }).check();
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  const svg = page.locator(".ink-sheet"),
    box = (await page.locator(".ink-scroll").boundingBox())!;
  const start = {
    pointerType: "touch",
    bubbles: true,
    button: 0,
    buttons: 1,
    clientX: box.x + 80,
    clientY: box.y + 80,
  };
  await svg.dispatchEvent("pointerdown", { ...start, pointerId: 101 });
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(1);
  await svg.dispatchEvent("pointerdown", {
    ...start,
    pointerId: 102,
    clientX: box.x + 180,
  });
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(0);
  await svg.dispatchEvent("pointermove", {
    ...start,
    pointerId: 102,
    clientX: box.x + 220,
  });
  await svg.dispatchEvent("pointercancel", { ...start, pointerId: 101 });
  await svg.dispatchEvent("pointerup", { ...start, pointerId: 102 });
  await draw(page);
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(1);
});

test("Seitenübersicht verwaltet Titel, Lesezeichen, Kopien und Reihenfolge", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Neues Notizbuch/ }).click();
  await draw(page);
  await page
    .getByRole("button", { name: "Seitenübersicht", exact: true })
    .click();
  await page.getByLabel("Titel Seite 1").fill("Geometrie");
  await page
    .getByRole("button", { name: "Lesezeichen Seite 1", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Seite 1 duplizieren", exact: true })
    .click();
  await expect(page.getByLabel("Titel Seite 2")).toHaveValue(
    "Geometrie (Kopie)",
  );
  await page
    .getByRole("button", { name: "Seite 2 nach vorne", exact: true })
    .click();
  await expect(page.getByLabel("Titel Seite 1")).toHaveValue(
    "Geometrie (Kopie)",
  );
  await page
    .getByRole("button", { name: "Seite 2 öffnen", exact: true })
    .click();
  await expect(page.getByLabel("Notizseite", { exact: true })).toHaveValue("1");
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(1);
  await awaitSaved(page);
  await page.reload();
  await page
    .getByRole("button", { name: /Unbenannte Notiz.*2 Notizseiten/ })
    .click();
  await page
    .getByRole("button", { name: "Seitenübersicht", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Lesezeichen Seite 2", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  page.once("dialog", (d) => d.dismiss());
  await page
    .getByRole("button", { name: "Seite 1 löschen", exact: true })
    .click();
  await expect(page.getByLabel("Titel Seite 2")).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Seite 1 löschen", exact: true })
    .click();
  await expect(page.getByLabel("Titel Seite 1")).toHaveValue("Geometrie");
  await expect(
    page.getByRole("button", { name: "Seite 1 löschen", exact: true }),
  ).toBeDisabled();
});

test("Auswahl verschiebt, kopiert und löscht Handschrift mit Rückgängig", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Neues Notizbuch/ }).click();
  await draw(page);
  const svg = page.locator(".ink-sheet"),
    raw = (await svg.boundingBox())!,
    clip = (await page.locator(".ink-scroll").boundingBox())!;
  const y = Math.max(raw.y, clip.y);
  const event = {
    pointerId: 301,
    pointerType: "pen",
    clientX: raw.x + 20,
    clientY: y + 60,
    pressure: 0.5,
    buttons: 1,
    button: 0,
    bubbles: true,
  };
  await page
    .getByRole("button", { name: "Handschrift auswählen", exact: true })
    .click();
  await svg.dispatchEvent("pointerdown", event);
  await svg.dispatchEvent("pointermove", {
    ...event,
    clientX: raw.x + 160,
    clientY: y + 140,
  });
  await svg.dispatchEvent("pointerup", event);
  await expect(
    page.getByRole("toolbar", { name: "Handschrift-Auswahl" }),
  ).toBeVisible();
  const before = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("phone-office.documents.v1")!)[0].notebook
        .pages[0].strokes[0].points,
  );
  await page.getByRole("button", { name: "Kopieren", exact: true }).click();
  await page.getByRole("button", { name: "Verschieben", exact: true }).click();
  await svg.dispatchEvent("pointerdown", event);
  await svg.dispatchEvent("pointermove", {
    ...event,
    clientX: event.clientX + 50,
  });
  await svg.dispatchEvent("pointerup", event);
  await awaitSaved(page);
  const moved = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("phone-office.documents.v1")!)[0].notebook
        .pages[0].strokes[0].points,
  );
  expect(moved[0].x).toBeGreaterThan(before[0].x);
  expect(moved[0].pressure).toBe(before[0].pressure);
  await page
    .getByRole("button", { name: "Handschrift einfügen", exact: true })
    .click();
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Auswahl löschen", exact: true })
    .click();
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Strich rückgängig", exact: true })
    .click();
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(2);
});

test("Browser-App startet offline und erhält lokale Notizen", async ({
  page,
  context,
}) => {
  test.skip(
    process.env.PHONE_OFFICE_PRODUCTION !== "1",
    "Offline shell is only registered in production builds",
  );
  await page.goto("/");
  await page.getByRole("button", { name: /Neues Notizbuch/ }).click();
  await draw(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await awaitSaved(page);
  await page.reload();
  await page
    .getByRole("button", { name: /Unbenannte Notiz.*Notizseiten/ })
    .click();
  await context.setOffline(true);
  await awaitSaved(page);
  await page.reload();
  await page
    .getByRole("button", { name: /Unbenannte Notiz.*Notizseiten/ })
    .click();
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(1);
  await draw(page);
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(2);
  await context.setOffline(false);
});

test("PDF-Arbeitsblatt lokal beschriften, sichern und als PDF wieder öffnen", async ({
  page,
}) => {
  const { jsPDF } = await import("jspdf");
  const input = new jsPDF({ unit: "pt", format: [800, 1100] });
  input.text("Aufgabe 1", 100, 300);
  input.setFillColor(30, 90, 220);
  input.rect(100, 400, 180, 100, "F");
  input.addPage();
  input.text("Aufgabe 2", 100, 300);
  await page.goto("/");
  page.once("dialog", (d) => d.accept());
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "Arbeitsblatt.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(input.output("arraybuffer")),
    });
  await expect(page.getByRole("status")).toContainText(
    "PDF als neue Notizkopie geöffnet",
    { timeout: 30000 },
  );
  await expect(page.locator(".ink-sheet image")).toHaveCount(1);
  await page.getByRole("button", { name: "Stift", exact: true }).click();
  await page.getByRole("button", { name: "Violett", exact: true }).click();
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  await draw(page);
  const backing = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("phone-office.documents.v1")!)[0].notebook
        .pages[0].background,
  );
  const backupWait = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Notizbuch sichern", exact: true })
    .click();
  const backup = await backupWait;
  const saved = JSON.parse((await readFile((await backup.path())!)).toString());
  expect(saved.notebook.pages).toHaveLength(2);
  expect(saved.notebook.pages[0].background).toBe(backing);
  expect(saved.notebook.pages[0].strokes).toHaveLength(1);
  await page
    .getByRole("button", { name: "Notizeinstellungen", exact: true })
    .click();
  page.once("dialog", (d) => d.accept());
  const wait = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Notizseiten als PDF", exact: true })
    .click();
  const download = await wait;
  const bytes = await readFile((await download.path())!);
  expect(bytes.subarray(0, 4).toString()).toBe("%PDF");
  page.once("dialog", (d) => d.accept());
  await page.locator("input[type=file]").first().setInputFiles({
    name: download.suggestedFilename(),
    mimeType: "application/pdf",
    buffer: bytes,
  });
  await expect(page.getByRole("status")).toContainText(
    "PDF als neue Notizkopie geöffnet",
    { timeout: 30000 },
  );
  await awaitSaved(page);
  const imagePixels = await page.evaluate(async () => {
    const pages = JSON.parse(
      localStorage.getItem("phone-office.documents.v1")!,
    )[0].notebook.pages;
    const image = new window.Image();
    image.src = pages[0].background;
    await image.decode();
    const c = document.createElement("canvas");
    c.width = 800;
    c.height = 1100;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    const data = ctx.getImageData(0, 0, 800, 1100).data;
    let blue = 0,
      violet = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 2] > 150 && data[i] < 100 && data[i + 1] < 140) blue++;
      if (data[i] > 100 && data[i + 2] > 120 && data[i + 1] < 100) violet++;
    }
    return {
      blue,
      violet,
      count: pages.length,
      strokes: pages[0].strokes.length,
    };
  });
  expect(imagePixels.count).toBe(2);
  expect(imagePixels.strokes).toBe(0);
  expect(imagePixels.blue).toBeGreaterThan(5000);
  expect(imagePixels.violet).toBeGreaterThan(10);
});

test("Samsung-Übertragung prüft Dateien und übernimmt mehrere Notizen als neue Kopien", async ({
  page,
}) => {
  const { jsPDF } = await import("jspdf");
  const input = new jsPDF();
  input.text("Samsung Export", 20, 30);
  await page.goto("/");
  await page
    .getByRole("button", { name: "Neues Dokument", exact: true })
    .last()
    .click();
  await page.getByLabel("Dokumenttitel").fill("Vorhandene Datei");
  const back = page.getByRole("button", {
    name: "Zurück zu Dokumenten",
    exact: true,
  });
  await back.click();
  if (
    await page
      .getByRole("button", { name: "Menü öffnen", exact: true })
      .isVisible()
  )
    await page
      .getByRole("button", { name: "Menü öffnen", exact: true })
      .click();
  await expect(page.locator(".sidebar-version")).toContainText(
    `Phone Office ${version}`,
  );
  await page
    .getByRole("button", { name: "Samsung Notes importieren", exact: true })
    .click();
  await page.getByLabel("Samsung-Notizen auswählen").setInputFiles([
    {
      name: "Biologie.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(input.output("arraybuffer")),
    },
    {
      name: "Mathematik.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(input.output("arraybuffer")),
    },
    {
      name: "Nicht lesbar.sdocx",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("Samsung-private"),
    },
  ]);
  await expect(
    page.getByRole("heading", { name: "2 vorbereitet · 1 nicht importiert" }),
  ).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("dialog")).toContainText(
    "Diese Notiz in Samsung Notes als PDF exportieren",
  );
  await page
    .getByRole("button", { name: "2 Notizen übernehmen", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "2 Notizen als neue lokale Kopien übernommen",
  );
  await expect(page.locator(".document-card")).toHaveCount(2);
  await awaitSaved(page);
  await page.reload();
  await expect(page.locator(".document-card")).toHaveCount(2);
  const filters = page.getByRole("group", { name: "Bibliothek filtern" });
  await filters.getByRole("button", { name: /Office-Dokumente/ }).click();
  await expect(page.locator(".document-card")).toHaveCount(1);
  await filters.getByRole("button", { name: /Notizbücher/ }).click();
  await page.getByRole("button", { name: /Biologie.*1 Notizseiten/ }).click();
  await expect(page.locator(".ink-sheet image")).toHaveCount(1);
});

test("Datenbank erhält Änderungen auch wenn der kleine Browser-Speicher voll ist", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === "phone-office.documents.v1")
        throw new DOMException("Voll", "QuotaExceededError");
      return original.call(this, k, v);
    };
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Neues Dokument", exact: true })
    .last()
    .click();
  await page
    .getByRole("textbox", { name: "Dokument bearbeiten" })
    .fill("Über IndexedDB wiederherstellen");
  await expect(page.locator(".save-meta")).toContainText("Lokal gespeichert");
  await awaitSaved(page);
  await page.reload();
  await page
    .getByRole("button", { name: /Unbenanntes Dokument.*Wörter/ })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Dokument bearbeiten" }),
  ).toContainText("Über IndexedDB wiederherstellen");
});

test("Gerade Linien behalten zwei Punkte; Bibliothek findet Fach und Seitentitel", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Neues Notizbuch/ }).click();
  await page.getByRole("button", { name: "Gerade Linie", exact: true }).click();
  const svg = page.locator(".ink-sheet"),
    r = (await svg.boundingBox())!,
    clip = (await page.locator(".ink-scroll").boundingBox())!;
  const e = {
    pointerId: 401,
    pointerType: "pen",
    pressure: 0.5,
    buttons: 1,
    button: 0,
    bubbles: true,
    clientX: r.x + 40,
    clientY: clip.y + 80,
  };
  await svg.dispatchEvent("pointerdown", e);
  for (const d of [20, 50, 100])
    await svg.dispatchEvent("pointermove", {
      ...e,
      clientX: e.clientX + d,
      clientY: e.clientY + d / 3,
    });
  await svg.dispatchEvent("pointerup", e);
  await awaitSaved(page);
  const points = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("phone-office.documents.v1")!)[0].notebook
        .pages[0].strokes[0].points,
  );
  expect(points).toHaveLength(2);
  await page
    .getByRole("button", { name: "Notizeinstellungen", exact: true })
    .click();
  await page.getByLabel("Schulfach").fill("Chemie");
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  await page
    .getByRole("button", { name: "Seitenübersicht", exact: true })
    .click();
  await page.getByLabel("Titel Seite 1").fill("Atommodell");
  await page.keyboard.press("Escape");
  const back = page.getByRole("button", {
    name: "Zur Dokumentübersicht",
    exact: true,
  });
  if (await back.isVisible()) await back.click();
  else
    await page
      .getByRole("button", { name: "Zurück zu Dokumenten", exact: true })
      .click();
  await page.getByLabel("Dokumente suchen").fill("Chemie");
  await expect(page.locator(".document-card")).toHaveCount(1);
  await page.getByLabel("Dokumente suchen").fill("Atommodell");
  await expect(page.locator(".document-card")).toHaveCount(1);
  await page.getByLabel("Dokumente suchen").fill("Nicht vorhanden");
  await expect(page.locator(".document-card")).toHaveCount(0);
});
