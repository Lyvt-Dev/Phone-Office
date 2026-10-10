import { describe, it, expect } from "vitest";
import { makeSticky, validStickies, stickySvg, stickyLines } from "./sticky";
import { newNotebook, isNotebook, pageSvg } from "./model";
import { duplicatePage } from "./operations";
import { duplicateNotebook, libraryItems } from "./library";
import { createDocument } from "../core/document";
import { exportNote, importNote } from "./format";
import {
  defaultAppearance,
  validAppearance,
  loadAppearance,
  applyAppearance,
} from "../ui/appearance";
async function blobText(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsText(blob);
  });
}
describe("Haftnotizen, Cover und Gestaltung", () => {
  it("bricht Text vollständig um, hält die Geometrie im Blatt und weist Überlänge zurück", () => {
    const n = makeSticky("Hausaufgaben für morgen", "#fff2a8", 180);
    expect(validStickies([n])).toBe(true);
    expect(stickyLines(n.text, n.width).join(" ")).toBe(n.text);
    const moved = makeSticky("Neue Erinnerung", n.color, 300, {
      ...n,
      x: 780,
      y: 1090,
    });
    expect(moved.x + moved.width).toBeLessThanOrEqual(800);
    expect(moved.y + moved.height).toBeLessThanOrEqual(1100);
    expect(() => makeSticky("a".repeat(301), n.color, 180)).toThrow();
    expect(() => makeSticky("a\n".repeat(22), n.color, 180)).toThrow();
    expect(() => makeSticky("a", "#000000", 180)).toThrow();
  });
  it("validiert Objektgrenzen, eindeutige IDs und Bilder ohne externe URLs", () => {
    const n = makeSticky("Erinnerung", "#d8edff", 240);
    for (const patch of [
      { x: NaN },
      { y: -1 },
      { width: 801 },
      { height: 90 },
      { text: "" },
      { color: "url(javascript:bad)" },
    ])
      expect(validStickies([{ ...n, ...patch }])).toBe(false);
    expect(validStickies([n, n])).toBe(false);
    const book = newNotebook();
    book.pages[0].stickies = [n];
    book.coverImage = "https://example.com/picture.jpg";
    expect(isNotebook(book)).toBe(false);
    book.coverImage = "data:image/jpeg;base64,Zm9v";
    expect(isNotebook(book)).toBe(true);
    book.coverImage = "data:image/jpeg;base64," + "a".repeat(600001);
    expect(isNotebook(book)).toBe(false);
  });
  it("gibt Haftnotiztext sicher in SVG/PDF-Seiten aus statt HTML auszuführen", () => {
    const n = makeSticky('<script>& "Test"</script>', "#ffd6df", 300);
    const svg = stickySvg(n);
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
    expect(svg).toContain("&amp;");
    const book = newNotebook();
    book.pages[0].stickies = [n];
    expect(pageSvg(book.pages[0])).toContain(svg);
    const xml = new DOMParser().parseFromString(
      pageSvg(book.pages[0]),
      "image/svg+xml",
    );
    expect(xml.querySelector("parsererror")).toBeNull();
    expect(xml.querySelector("text")?.textContent).toBe(n.text);
  });
  it("sichert neue Inhalte in Version 5, importiert Version 4 und sucht Haftnotiztext", async () => {
    const doc = { ...createDocument("Mein Buch"), notebook: newNotebook() };
    doc.notebook.coverImage = "data:image/jpeg;base64,Zm9v";
    doc.notebook.pages[0].stickies = [
      makeSticky("Geschichte wiederholen", "#e5dcff", 240),
    ];
    const data = await blobText(exportNote(doc));
    expect(JSON.parse(data).version).toBe(5);
    expect(importNote(data).notebook).toEqual(doc.notebook);
    expect(libraryItems([doc], "notes", "Geschichte wiederholen")).toEqual([
      doc,
    ]);
    const old = JSON.parse(data);
    old.version = 4;
    delete old.notebook.coverImage;
    delete old.notebook.pages[0].stickies;
    expect(isNotebook(importNote(JSON.stringify(old)).notebook)).toBe(true);
  });
  it("kopiert Haftnotizen unabhängig mit neuen IDs bei Seiten- und Buchkopien", () => {
    const doc = { ...createDocument(), notebook: newNotebook() };
    doc.notebook.pages[0].stickies = [makeSticky("Original", "#d8f3df", 240)];
    const n = duplicatePage(doc.notebook, doc.notebook.pages[0].id),
      copy = duplicateNotebook(doc);
    expect(n.pages[1].stickies![0].id).not.toBe(n.pages[0].stickies![0].id);
    expect(copy.notebook!.pages[0].stickies![0].id).not.toBe(
      n.pages[0].stickies![0].id,
    );
    n.pages[1].stickies![0].text = "Andere Seite";
    copy.notebook!.pages[0].stickies![0].text = "Anderes Buch";
    expect(doc.notebook.pages[0].stickies[0].text).toBe("Original");
  });
  it("hält Gestaltungseinstellungen validiert und getrennt von Dokumenten", () => {
    expect(validAppearance(defaultAppearance)).toBe(true);
    expect(validAppearance({ ...defaultAppearance, accent: "__proto__" })).toBe(
      false,
    );
    expect(validAppearance({ ...defaultAppearance, size: 999 })).toBe(false);
    localStorage.setItem("phone-office.appearance.v1", "broken");
    expect(loadAppearance()).toEqual(defaultAppearance);
    const pref = {
      ...defaultAppearance,
      accent: "violet" as const,
      font: "serif" as const,
      size: 120 as const,
    };
    localStorage.setItem("phone-office.appearance.v1", JSON.stringify(pref));
    expect(loadAppearance()).toEqual(pref);
    applyAppearance(pref);
    expect(document.documentElement.dataset.accent).toBe("violet");
    expect(
      document.documentElement.style.getPropertyValue("--ui-font"),
    ).toContain("Georgia");
    localStorage.removeItem("phone-office.appearance.v1");
    applyAppearance(defaultAppearance);
  });
});
