import { test, expect, type Page } from "@playwright/test";
import { awaitSaved } from "./persistence";
const surface = (page: Page) =>
  page.getByRole("img", { name: "Schreibfläche Seite 1" });
async function pointer(
  page: Page,
  type: string,
  x: number,
  y: number,
  pressure = 0.5,
) {
  const pos = await surface(page).evaluate(
    (svg, p) => {
      const matrix = (svg as SVGSVGElement).getScreenCTM()!;
      const q = new DOMPoint(p.x, p.y).matrixTransform(matrix);
      return { x: q.x, y: q.y };
    },
    { x, y },
  );
  await surface(page).dispatchEvent(type, {
    pointerType: "pen",
    pointerId: 25,
    clientX: pos.x,
    clientY: pos.y,
    pressure,
    button: 0,
    buttons: type === "pointerup" ? 0 : 1,
    bubbles: true,
  });
}
async function saved(page: Page) {
  await awaitSaved(page);
  return page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("phone-office.documents.v1")!)[0].notebook
        .pages[0].strokes,
  );
}
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Neue Schulnotiz/ }).click();
});
test("Stiftarten, Halten zum Begradigen und erneutes Öffnen", async ({
  page,
}) => {
  await page.getByLabel("Stiftart", { exact: true }).selectOption("pencil");
  await pointer(page, "pointerdown", 40, 70, 0.2);
  await pointer(page, "pointermove", 70, 90, 0.4);
  await pointer(page, "pointermove", 120, 75, 0.8);
  await expect
    .poll(async () =>
      surface(page).locator("[data-ink-stroke]").getAttribute("d"),
    )
    .toBeTruthy();
  await page.waitForTimeout(720);
  await pointer(page, "pointerup", 120, 75, 0.8);
  const strokes = await saved(page);
  expect(strokes[0].points).toHaveLength(2);
  expect(strokes[0].penStyle).toBe("pencil");
  await expect(surface(page).locator("[data-ink-stroke]")).toHaveAttribute(
    "opacity",
    "0.65",
  );
  await page.getByLabel("Stiftart", { exact: true }).selectOption("ballpoint");
  await pointer(page, "pointerdown", 40, 130, 0.2);
  await pointer(page, "pointermove", 120, 135, 0.9);
  await pointer(page, "pointerup", 120, 135);
  expect((await saved(page))[1].penStyle).toBe("ballpoint");
  await page.reload();
  await page
    .locator(".document-card button, .document-list-item button")
    .first()
    .click();
  await expect(surface(page).locator("[data-ink-stroke]")).toHaveCount(2);
});
test("Verschieben zeigt eine Live-Vorschau, Abbruch bewahrt die gespeicherte Auswahl", async ({
  page,
}) => {
  await pointer(page, "pointerdown", 50, 60);
  await pointer(page, "pointermove", 130, 65);
  await pointer(page, "pointerup", 130, 65);
  const before = await saved(page);
  const path = surface(page).locator("[data-ink-stroke]");
  const original = await path.getAttribute("d");
  await page
    .getByRole("button", { name: "Handschrift auswählen", exact: true })
    .click();
  await pointer(page, "pointerdown", 30, 40);
  await pointer(page, "pointermove", 150, 85);
  await pointer(page, "pointerup", 150, 85);
  await page.getByRole("button", { name: "Verschieben", exact: true }).click();
  await pointer(page, "pointerdown", 60, 60);
  await pointer(page, "pointermove", 100, 100);
  await expect(path).not.toHaveAttribute("d", original!);
  expect(await saved(page)).toEqual(before);
  await pointer(page, "pointercancel", 100, 100);
  await expect(path).toHaveAttribute("d", original!);
  await pointer(page, "pointerdown", 60, 60);
  await pointer(page, "pointermove", 100, 100);
  const preview = await path.getAttribute("d");
  await pointer(page, "pointerup", 100, 100);
  expect((await saved(page))[0].points[0].x).toBeCloseTo(90);
  await expect(path).toHaveAttribute("d", preview!);
  await page
    .getByRole("button", { name: "Strich rückgängig", exact: true })
    .click();
  await expect(path).toHaveAttribute("d", original!);
});
test("Lasso und kompakte Leiste lassen Platz fürs Blatt, Fokusmodus bleibt bedienbar", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await pointer(page, "pointerdown", 60, 60);
  await pointer(page, "pointermove", 120, 65);
  await pointer(page, "pointerup", 120, 65);
  await saved(page);
  await page
    .getByRole("button", { name: "Lasso-Auswahl", exact: true })
    .click();
  await pointer(page, "pointerdown", 40, 40);
  await pointer(page, "pointermove", 140, 40);
  await pointer(page, "pointermove", 140, 90);
  await pointer(page, "pointermove", 40, 90);
  await pointer(page, "pointerup", 40, 40);
  await expect(page.locator(".selected-ink")).toHaveCount(1);
  const top = (await page.locator(".editor-top").boundingBox())!,
    tools = (await page.locator(".note-commandbar").boundingBox())!;
  expect(top.height + tools.height).toBeLessThanOrEqual(105);
  const prior = (await page.locator(".ink-scroll").boundingBox())!.height;
  await page.getByRole("button", { name: "Fokusmodus", exact: true }).click();
  await expect(page.locator(".editor-top")).toBeHidden();
  expect(
    (await page.locator(".ink-scroll").boundingBox())!.height,
  ).toBeGreaterThan(prior);
  await page
    .getByRole("button", { name: "Fokusmodus beenden", exact: true })
    .click();
  await expect(page.locator(".editor-top")).toBeVisible();
});
