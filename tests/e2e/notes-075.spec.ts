import { test, expect } from "@playwright/test";
import { awaitSaved } from "./persistence";
test("Notizbuch-Cover, Ordner, Favorit und Punktpapier überleben Neustart und neue Seiten", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Deine Notizbücher", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".document-card")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Neues Notizbuch", exact: true })
    .click();
  await awaitSaved(page);
  await page
    .getByRole("button", { name: "Zur Dokumentübersicht", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Unbenannte Notiz verwalten", exact: true })
    .click();
  await page.getByLabel("Bibliothekstitel").fill("Mein Physikbuch");
  await page.getByLabel("Notizbuchordner").fill("Physik");
  await page
    .getByRole("button", { name: "Cover #7c3aed", exact: true })
    .click();
  await page.getByLabel("Notizbuchpapier").selectOption("dots");
  await page.getByRole("checkbox", { name: "Notizbuch als Favorit" }).check();
  await page
    .getByRole("button", { name: "Änderungen speichern", exact: true })
    .click();
  await awaitSaved(page);
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Mein Physikbuch als Favorit",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Physik", exact: true }).click();
  await expect(page.locator(".document-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Alle Ordner", exact: true }).click();
  await page
    .getByRole("group", { name: "Bibliothek filtern" })
    .getByRole("button", { name: /Favoriten/ })
    .click();
  await expect(page.locator(".document-card")).toHaveCount(1);
  await page.locator(".document-card .document-open").click();
  await expect(page.locator(".ink-sheet pattern circle")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Seite hinzufügen", exact: true })
    .click();
  await awaitSaved(page);
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("phone-office.documents.v1")!)[0],
  );
  expect(saved.notebook.pages.map((p: { paper: string }) => p.paper)).toEqual([
    "dots",
    "dots",
  ]);
  expect(saved.notebook.coverColor).toBe("#7c3aed");
});
test("Papierkorb bewahrt Notizen, Wiederherstellung funktioniert, endgültiges Löschen braucht Bestätigung", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Neues Notizbuch", exact: true })
    .click();
  await awaitSaved(page);
  await page
    .getByRole("button", { name: "Zur Dokumentübersicht", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Unbenannte Notiz verwalten", exact: true })
    .click();
  await page
    .getByRole("button", { name: "In den Papierkorb", exact: true })
    .click();
  await awaitSaved(page);
  await expect(page.locator(".document-card")).toHaveCount(0);
  const filters = page.getByRole("group", { name: "Bibliothek filtern" });
  await filters.getByRole("button", { name: /Papierkorb/ }).click();
  await expect(page.locator(".document-card")).toHaveCount(1);
  await page.reload();
  await page
    .getByRole("button", { name: "Unbenannte Notiz verwalten", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Wiederherstellen", exact: true })
    .click();
  await awaitSaved(page);
  await expect(page.locator(".document-card")).toHaveCount(0);
  await filters.getByRole("button", { name: /Notizbücher/ }).click();
  await expect(page.locator(".document-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Unbenannte Notiz verwalten", exact: true })
    .click();
  await page
    .getByRole("button", { name: "In den Papierkorb", exact: true })
    .click();
  await awaitSaved(page);
  await filters.getByRole("button", { name: /Papierkorb/ }).click();
  await page
    .getByRole("button", { name: "Unbenannte Notiz verwalten", exact: true })
    .click();
  page.once("dialog", (d) => d.dismiss());
  await page
    .getByRole("button", { name: "Endgültig löschen", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Notizbuch verwalten" }),
  ).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Endgültig löschen", exact: true })
    .click();
  await awaitSaved(page);
  await page.reload();
  await expect(page.locator(".document-card")).toHaveCount(0);
});
test("Notizbuch duplizieren, getippten Text suchen und Office als Zusatz getrennt halten", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Neues Notizbuch", exact: true })
    .click();
  await page.getByRole("tab", { name: "Text", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Dokument bearbeiten" })
    .fill("Meine Gedanken zur Energie");
  await awaitSaved(page);
  await page
    .getByRole("button", { name: "Zur Dokumentübersicht", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Unbenannte Notiz verwalten", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Notizbuch duplizieren", exact: true })
    .click();
  await awaitSaved(page);
  await expect(page.locator(".document-card")).toHaveCount(2);
  await page
    .getByRole("searchbox", { name: "Dokumente suchen" })
    .fill("Gedanken zur Energie");
  await expect(page.locator(".document-card")).toHaveCount(2);
  await page.getByRole("searchbox", { name: "Dokumente suchen" }).fill("");
  await page
    .getByRole("button", { name: "Neues Dokument", exact: true })
    .last()
    .click();
  await awaitSaved(page);
  await page
    .getByRole("button", { name: "Zurück zu Dokumenten", exact: true })
    .click();
  const filters = page.getByRole("group", { name: "Bibliothek filtern" });
  await filters.getByRole("button", { name: /Office-Dokumente/ }).click();
  await expect(page.locator(".document-card")).toHaveCount(1);
  await expect(page.locator(".notebook-cover")).toHaveCount(0);
  await filters.getByRole("button", { name: /Notizbücher/ }).click();
  await expect(page.locator(".document-card")).toHaveCount(2);
});
test("Rechteck und Ellipse sind gespeicherte, rückgängig machbare Handschriftformen", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Neues Notizbuch", exact: true })
    .click();
  const svg = page.getByRole("img", { name: "Schreibfläche Seite 1" });
  const pointer = async (type: string, x: number, y: number) => {
    const q = await svg.evaluate(
      (s, p) => {
        const q = new DOMPoint(p.x, p.y).matrixTransform(
          (s as SVGSVGElement).getScreenCTM()!,
        );
        return { x: q.x, y: q.y };
      },
      { x, y },
    );
    await svg.dispatchEvent(type, {
      pointerType: "pen",
      pointerId: 75,
      button: 0,
      buttons: type === "pointerup" ? 0 : 1,
      pressure: 0.5,
      clientX: q.x,
      clientY: q.y,
      bubbles: true,
    });
  };
  for (const name of ["Rechteck zeichnen", "Ellipse zeichnen"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await pointer("pointerdown", 100, 100);
    await pointer("pointermove", 240, 200);
    await pointer("pointerup", 240, 200);
    await awaitSaved(page);
  }
  const strokes = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("phone-office.documents.v1")!)[0].notebook
        .pages[0].strokes,
  );
  expect(strokes[0].points).toHaveLength(5);
  expect(strokes[1].points).toHaveLength(65);
  expect(strokes[1].points[0]).toEqual(strokes[1].points.at(-1));
  await page
    .getByRole("button", { name: "Strich rückgängig", exact: true })
    .click();
  await awaitSaved(page);
  await expect(svg.locator("[data-ink-stroke]")).toHaveCount(1);
  await page.reload();
  await page.locator(".document-card .document-open").click();
  await expect(page.locator("[data-ink-stroke]")).toHaveCount(1);
});
test("PNG wird lokal zur beschriftbaren Notizseite und bleibt nach Neustart erhalten", async ({
  page,
}) => {
  await page.goto("/");
  const image = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 80;
    c.height = 100;
    const x = c.getContext("2d")!;
    x.fillStyle = "#ef4444";
    x.fillRect(0, 0, 80, 100);
    return c.toDataURL("image/png").split(",")[1];
  });
  page.once("dialog", (d) => d.accept());
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "Arbeitsblatt.png",
      mimeType: "image/png",
      buffer: Buffer.from(image, "base64"),
    });
  await expect(page.getByRole("status")).toContainText(
    "Bild als neue lokale Notizseite geöffnet",
  );
  await expect(page.locator(".ink-sheet image")).toHaveCount(1);
  await awaitSaved(page);
  await page.reload();
  await page.locator(".document-card .document-open").click();
  await expect(page.locator(".ink-sheet image")).toHaveCount(1);
});
