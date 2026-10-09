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
}
test("Handschrift, mehrere Seiten und Text über Sicherung wieder öffnen", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Neue Schulnotiz/ }).click();
  await page.getByLabel("Dokumenttitel").fill("Mathe Notizen");
  await page
    .getByRole("button", { name: "Notizeinstellungen", exact: true })
    .click();
  await page.getByLabel("Schulfach").fill("Mathematik");
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  await draw(page);
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(1);
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
  await page.getByRole("button", { name: /Neue Schulnotiz/ }).click();
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
  await page.getByRole("button", { name: /Neue Schulnotiz/ }).click();
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
  await page.getByRole("button", { name: /Neue Schulnotiz/ }).click();
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
  await page.getByRole("button", { name: /Neue Schulnotiz/ }).click();
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
  await page.getByRole("button", { name: "Blau", exact: true }).click();
  await page.getByLabel("Strichstärke").selectOption("6");
  await page.getByLabel("Notizzoom").selectOption("125");
  await page.getByRole("checkbox", { name: "Mit Finger zeichnen" }).check();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await draw(page);
  await expect(page.locator("[data-ink-stroke]")).toHaveAttribute(
    "fill",
    "#2563eb",
  );
  await page.reload();
  await page
    .getByRole("button", { name: /Unbenannte Notiz.*Notizseiten/ })
    .click();
  await trigger.click();
  await expect(page.getByLabel("Stiftfarbe", { exact: true })).toHaveValue(
    "#2563eb",
  );
  await expect(page.getByLabel("Strichstärke")).toHaveValue("6");
  await expect(page.getByLabel("Notizzoom")).toHaveValue("125");
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
  await page.getByRole("button", { name: /Neue Schulnotiz/ }).click();
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
