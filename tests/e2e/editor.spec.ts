import { test, expect, type Page } from "@playwright/test";
async function selectTools(page: Page, label: string) {
  const tab = page.getByRole("tab", { name: label, exact: true });
  if (
    (await tab.isVisible()) &&
    (await tab.getAttribute("aria-selected")) !== "true"
  )
    await tab.click();
}
test("Dokument bearbeiten, speichern und erneut öffnen", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Deine Dokumente", exact: true }).first(),
  ).toBeVisible();
  await page.screenshot({
    path: `/tmp/phone-office-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Neues Dokument", exact: true })
    .last()
    .click();
  await page
    .getByRole("textbox", { name: "Dokumenttitel" })
    .fill("Projektübersicht");
  const editor = page.getByRole("textbox", { name: "Dokument bearbeiten" });
  await expect(editor).toHaveText("");
  await editor.click();
  await page.keyboard.press("ControlOrMeta+End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Mein neuer Gedanke");
  await expect(editor).toContainText("Mein neuer Gedanke");
  await selectTools(page, "Mehr");
  await page
    .getByRole("button", { name: "Suchen und Ersetzen", exact: true })
    .click();
  await page.getByLabel("Suchen", { exact: true }).fill("Gedanke");
  await page.getByLabel("Ersetzen durch").fill("Plan");
  await page.getByRole("button", { name: "Alle Treffer ersetzen" }).click();
  await expect(editor).toContainText("Mein neuer Plan");
  await page.getByRole("button", { name: "Meldung schließen" }).click();
  await page.reload();
  await page.getByRole("button", { name: /Projektübersicht.*Wörter/ }).click();
  await expect(editor).toContainText("Mein neuer Plan");
  await selectTools(page, "Einfügen");
  await page.getByRole("button", { name: "Tabelle einfügen" }).click();
  await expect(editor.locator("table")).toHaveCount(1);
  await page.getByRole("button", { name: "Exportieren", exact: true }).click();
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: /HTML-Dokument/ }).click();
  expect((await dl).suggestedFilename()).toBe("Projektübersicht.html");
  await page.screenshot({
    path: `/tmp/phone-office-editor-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("DOCX wird im Browser nach Verlustwarnung als Kopie geöffnet", async ({
  page,
}) => {
  await page.goto("/");
  page.on("dialog", (dialog) => dialog.accept());
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles("tests/fixtures/simple.docx");
  await expect(
    page.getByRole("textbox", { name: "Dokument bearbeiten" }),
  ).toContainText("Hallo Office");
  await expect(page.locator(".tiptap strong")).toHaveText("Hallo Office");
  await expect(
    page.getByRole("textbox", { name: "Dokument bearbeiten" }),
  ).toContainText("Zweite Zeile");
  await expect(page.locator(".save-meta")).toContainText("Quelle: DOCX");
});
test("HTML Download nach Bearbeitung erneut importieren", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Neues Dokument", exact: true })
    .last()
    .click();
  const editor = page.getByRole("textbox", { name: "Dokument bearbeiten" });
  await editor.fill("Rundlauf funktioniert");
  await page.getByRole("textbox", { name: "Dokumenttitel" }).fill("Rundlauf");
  await page.getByRole("button", { name: "Exportieren", exact: true }).click();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: /HTML-Dokument/ }).click();
  const download = await pending;
  const path = await download.path();
  page.on("dialog", (d) => d.accept());
  await page.locator("input[type=file]").first().setInputFiles(path!);
  await expect(page.getByRole("status")).toContainText(
    "Neue lokale Kopie geöffnet",
  );
  await expect(editor).toContainText("Rundlauf funktioniert");
  await page.reload();
  await expect(page.locator(".documents-section h2")).toContainText("2");
});

test("Auszeichnung, Rückgängig und Vorschau funktionieren", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Neues Dokument", exact: true })
    .last()
    .click();
  const editor = page.getByRole("textbox", { name: "Dokument bearbeiten" });
  await editor.fill("Formatierter Text");
  await editor.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element.querySelector("p")!);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
  });
  await expect
    .poll(() => page.evaluate(() => window.getSelection()?.toString()))
    .toBe("Formatierter Text");
  await page.getByRole("button", { name: "Fett", exact: true }).click();
  await expect(editor.locator("strong")).toHaveText("Formatierter Text");
  await page.getByRole("button", { name: "Rückgängig", exact: true }).click();
  await expect(editor.locator("strong")).toHaveCount(0);
  await page.getByRole("button", { name: "Wiederholen", exact: true }).click();
  await expect(editor.locator("strong")).toHaveText("Formatierter Text");
  await page.getByRole("button", { name: "Vorschau", exact: true }).click();
  await expect(page.getByRole("dialog").locator("strong")).toHaveText(
    "Formatierter Text",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("Speicherfehler bleiben sichtbar und Datei-Export ist weiterhin möglich", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Speicher voll", "QuotaExceededError");
    };
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Neues Dokument", exact: true })
    .last()
    .click();
  await page
    .getByRole("textbox", { name: "Dokument bearbeiten" })
    .fill("Wichtiger ungespeicherter Text");
  await expect(page.getByRole("status")).toContainText(
    "Bitte das Dokument jetzt exportieren",
  );
  await expect(page.locator(".save-meta")).toContainText(
    "Speichern fehlgeschlagen",
  );
  await page.getByRole("button", { name: "Meldung schließen" }).click();
  await page.getByRole("button", { name: "Exportieren", exact: true }).click();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: /HTML-Dokument/ }).click();
  expect((await pending).suggestedFilename()).toBe("Unbenanntes Dokument.html");
});

for (const format of ["odt", "ott", "fodt"] as const) {
  test(`${format.toUpperCase()} auf Handy/Desktop bearbeiten, exportieren und wieder öffnen`, async ({
    page,
  }, info) => {
    await page.goto("/");
    page.on("dialog", (d) => d.accept());
    await page
      .getByRole("button", { name: "Neues Dokument", exact: true })
      .last()
      .click();
    const editor = page.getByRole("textbox", { name: "Dokument bearbeiten" });
    await editor.fill("Mein echter Dokumentinhalt");
    await page
      .getByRole("textbox", { name: "Dokumenttitel" })
      .fill("Formatprüfung");
    await selectTools(page, "Einfügen");
    await page
      .getByRole("button", { name: "Tabelle einfügen", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Exportieren", exact: true })
      .click();
    const pending = page.waitForEvent("download");
    await page
      .getByRole("button", {
        name:
          format === "odt"
            ? /LibreOffice-Dokument/
            : format === "ott"
              ? /LibreOffice-Vorlage/
              : /Writer-XML/,
      })
      .click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe("Formatprüfung." + format);
    if (info.project.name === "desktop")
      await download.saveAs(
        "/tmp/phone-office-odf-validation/document." + format,
      );
    await page
      .locator("input[type=file]")
      .first()
      .setInputFiles((await download.path())!);
    await expect(page.getByRole("status")).toContainText(
      "Neue lokale Kopie geöffnet",
    );
    await expect(page.locator(".save-meta")).toContainText(
      "Quelle: " + format.toUpperCase(),
    );
    await expect(editor).toContainText("Mein echter Dokumentinhalt");
    await expect(editor.locator("table")).toHaveCount(1);
    await page
      .getByRole("textbox", { name: "Dokumenttitel" })
      .fill("Weiterbearbeitet");
    await editor.click();
    await editor.press("ControlOrMeta+End");
    await editor.press("Enter");
    await page.keyboard.type("Weitere Bearbeitung");
    await page.reload();
    await page
      .getByRole("button", { name: /Weiterbearbeitet.*Wörter/ })
      .first()
      .click();
    await expect(editor).toContainText("Weitere Bearbeitung");
  });
}

test("Keine Beispiel-Dokumente und große mobile Bedienelemente", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(page.locator(".document-card")).toHaveCount(0);
  await expect(page.locator(".template-card")).toHaveCount(0);
  await expect(page.getByText("Projektübersicht", { exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByText("DU", { exact: true })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Neues Dokument", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("textbox", { name: "Dokument bearbeiten" }),
  ).toHaveText("");
  if (info.project.name === "mobile") {
    const bold = page.getByRole("button", { name: "Fett", exact: true });
    const box = await bold.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(48);
    expect(box?.height).toBeGreaterThanOrEqual(48);
    expect(
      await page
        .getByRole("textbox", { name: "Dokumenttitel" })
        .evaluate((e) => getComputedStyle(e).fontSize),
    ).toBe("22px");
    await selectTools(page, "Einfügen");
    await expect(
      page.getByRole("button", { name: "Tabelle einfügen" }),
    ).toBeVisible();
    await expect(bold).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Exportieren", exact: true }),
    ).toBeVisible();
  }
});
