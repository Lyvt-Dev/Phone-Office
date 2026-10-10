import { test, expect, type Page } from "@playwright/test";
import { awaitSaved } from "./persistence";
async function pen(
  page: Page,
  type: string,
  x: number,
  y: number,
  buttons = 1,
) {
  const svg = page.getByRole("img", { name: "Schreibfläche Seite 1" });
  const q = await svg.evaluate(
    (el, p) => {
      const q = new DOMPoint(p.x, p.y).matrixTransform(
        (el as SVGSVGElement).getScreenCTM()!,
      );
      return { x: q.x, y: q.y };
    },
    { x, y },
  );
  await svg.dispatchEvent(type, {
    pointerType: "pen",
    pointerId: 70,
    clientX: q.x,
    clientY: q.y,
    pressure: 0.5,
    button: 0,
    buttons: type === "pointerup" ? 0 : buttons,
    bubbles: true,
  });
}
async function strokes(page: Page) {
  await awaitSaved(page);
  return page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("phone-office.documents.v1")!)[0].notebook
        .pages[0].strokes,
  );
}
test("Werkzeugdialoge, Teilradieren, Rückgängig und erneutes Öffnen", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Neues Notizbuch/ }).click();
  await page.getByRole("button", { name: "Stift", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Stifteinstellungen" }),
  ).toBeVisible();
  await expect(page.getByLabel("Notizpapier")).toHaveCount(0);
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  await pen(page, "pointerdown", 40, 100);
  await pen(page, "pointermove", 260, 100);
  await pen(page, "pointerup", 260, 100);
  const original = await strokes(page);
  await page.getByRole("button", { name: "Radierer", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Radierer", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Radiereinstellungen" }),
  ).toBeVisible();
  await expect(page.getByLabel("Stiftart in Einstellungen")).toHaveCount(0);
  await page.getByLabel("Radiermodus").selectOption("partial");
  await page.getByLabel("Radierergröße").selectOption("8");
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  await pen(page, "pointerdown", 150, 100);
  await pen(page, "pointerup", 150, 100);
  const split = await strokes(page);
  expect(split).toHaveLength(2);
  expect(split[0].points.at(-1).x).toBeLessThan(150);
  expect(split[1].points[0].x).toBeGreaterThan(150);
  await page
    .getByRole("button", { name: "Strich rückgängig", exact: true })
    .click();
  expect(await strokes(page)).toEqual(original);
  await page
    .getByRole("button", { name: "Strich wiederholen", exact: true })
    .click();
  expect(await strokes(page)).toEqual(split);
  await page.reload();
  await page.locator(".document-card .document-open").first().click();
  expect(await strokes(page)).toEqual(split);
  await page.getByRole("button", { name: "Radierer", exact: true }).click();
  await page.getByRole("button", { name: "Radierer", exact: true }).click();
  await expect(page.getByLabel("Radiermodus")).toHaveValue("partial");
  await expect(page.getByLabel("Radierergröße")).toHaveValue("8");
});
test("Stiftknopf radiert vorübergehend und lässt das Schreibwerkzeug ausgewählt", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Neues Notizbuch/ }).click();
  await pen(page, "pointerdown", 40, 100);
  await pen(page, "pointermove", 200, 100);
  await pen(page, "pointerup", 200, 100);
  expect(await strokes(page)).toHaveLength(1);
  await pen(page, "pointerdown", 100, 100, 2);
  await pen(page, "pointerup", 100, 100);
  expect(await strokes(page)).toHaveLength(0);
  await expect(
    page.getByRole("button", { name: "Stift", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await pen(page, "pointerdown", 40, 100);
  await pen(page, "pointermove", 200, 100);
  await pen(page, "pointerup", 200, 100);
  await page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent("phone-office-stylus-button", { detail: true }),
    ),
  );
  await pen(page, "pointerdown", 100, 100);
  await pen(page, "pointerup", 100, 100);
  expect(await strokes(page)).toHaveLength(0);
  await page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent("phone-office-stylus-button", { detail: false }),
    ),
  );
  await pen(page, "pointerdown", 40, 180);
  await pen(page, "pointermove", 200, 180);
  await pen(page, "pointerup", 200, 180);
  expect(await strokes(page)).toHaveLength(1);
});
test("Bibliothek filtert echte Notizen und Textdokumente ohne Beispieldaten", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".document-card")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Neues Dokument", exact: true })
    .last()
    .click();
  await awaitSaved(page);
  await page
    .getByRole("button", { name: "Zurück zu Dokumenten", exact: true })
    .click();
  await page.getByRole("button", { name: /Neues Notizbuch/ }).click();
  await awaitSaved(page);
  await page
    .getByRole("button", { name: "Zur Dokumentübersicht", exact: true })
    .click();
  const filters = page.getByRole("group", { name: "Bibliothek filtern" });
  await filters.getByRole("button", { name: /Notizbücher/ }).click();
  await expect(page.locator(".document-card")).toHaveCount(1);
  await expect(page.locator(".notebook-cover")).toHaveCount(1);
  await filters.getByRole("button", { name: /Office-Dokumente/ }).click();
  await expect(page.locator(".document-card")).toHaveCount(1);
  await expect(page.locator(".notebook-cover")).toHaveCount(0);
  await filters.getByRole("button", { name: /Notizbücher/ }).click();
  await expect(page.locator(".document-card")).toHaveCount(1);
});
