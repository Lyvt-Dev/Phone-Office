import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createDocument, wordCount } from "./document";
import { exportContent, importFile, sanitize, textToHtml } from "../formats";
import { localStorageAdapter } from "../storage/local";
function file(name: string, data: string | Uint8Array) {
  const bytes =
    typeof data === "string" ? new TextEncoder().encode(data) : data;
  return {
    name,
    size: bytes.length,
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as File;
}
beforeEach(() => localStorage.clear());
describe("Dokumente und lokale Wiederherstellung", () => {
  it("zählt echte Wörter über Absatz- und Zellgrenzen hinweg", () => {
    expect(
      wordCount(
        "<p>Hallo</p><p>Welt</p><table><tr><td>Eins</td><td>Zwei</td></tr></table><p>!</p>",
      ),
    ).toBe(4);
  });
  it("speichert eine Bearbeitung und öffnet sie mit Identität erneut", () => {
    const doc = createDocument("Test", "<p>Erster Satz</p>");
    localStorageAdapter.save([doc]);
    doc.html = "<p>Bearbeiteter <strong>Text</strong></p>";
    localStorageAdapter.save([doc]);
    expect(localStorageAdapter.load()).toEqual([doc]);
    expect(wordCount(doc.html)).toBe(2);
  });
  it("überschreibt beschädigte Wiederherstellung nicht", () => {
    localStorage.setItem("phone-office.documents.v1", "invalid");
    expect(() => localStorageAdapter.load()).toThrow();
    expect(localStorage.getItem("phone-office.documents.v1")).toBe("invalid");
  });
  it("unterscheidet leere Dokumente", () => {
    expect(wordCount("<p></p>")).toBe(0);
    expect(createDocument().id).not.toBe(createDocument().id);
  });
});
describe("Format-Rundläufe und Grenzen", () => {
  it("TXT importieren, bearbeiten, exportieren und wieder öffnen", async () => {
    const imported = await importFile(file("test.txt", "Hallo <Welt>\nÄÖÜ"));
    const edited = imported.html + "<p>Neu</p>";
    const exported = exportContent(edited, "txt");
    const reopened = await importFile(file("neu.txt", exported));
    expect(exportContent(reopened.html, "txt").trim()).toBe(exported.trim());
    expect(reopened.html).toContain("&lt;Welt&gt;");
  });
  it("HTML erhält Grundformatierung, Tabellen, Links und sichere Inline-Stile", async () => {
    const html =
      '<h1>Titel</h1><p><strong>Fett</strong><em>Kursiv</em><u>Linie</u><span style="color: rgb(255, 0, 0); font-size: 24px">Rot</span></p><table><tbody><tr><td>Zelle</td></tr></tbody></table><p><a href="https://example.org">Link</a></p>';
    const first = await importFile(file("test.html", html));
    const second = await importFile(
      file("kopie.html", exportContent(first.html, "html")),
    );
    expect(second.html).toBe(first.html);
    expect(second.html).toContain("font-size: 24px");
  });
  it("DOCX-Fixture importiert Text und Fettformatierung mit Warnung", async () => {
    const data = readFileSync("tests/fixtures/simple.docx");
    const result = await importFile(file("test.docx", data));
    expect(result.html).toContain("<strong>Hallo Office</strong>");
    expect(result.html).toContain("Zweite Zeile");
    expect(result.warnings.length).toBeGreaterThan(0);
  });
  it("DOCX nach HTML exportieren und wieder öffnen", async () => {
    const first = await importFile(
      file("a.docx", readFileSync("tests/fixtures/simple.docx")),
    );
    const second = await importFile(
      file("b.html", exportContent(first.html + "<p>Bearbeitung</p>", "html")),
    );
    expect(second.html).toContain("<strong>Hallo Office</strong>");
    expect(second.html).toContain("Bearbeitung");
  });
  it("entfernt aktive Inhalte und externe Bilder", () => {
    const result = sanitize(
      '<script>alert(1)</script><img src="https://server.test/track"><p onclick="alert(1)" style="background:url(https://server.test/a);color:red">Sicher</p><a href="javascript:alert(1)">Link</a>',
    );
    expect(result).not.toMatch(/script|onclick|https:\/\/server|background/);
    expect(result).toContain("color: red");
  });
  it("erkennt HTML-Inhalt trotz TXT-Endung", async () => {
    expect(
      (
        await importFile(
          file(
            "a.txt",
            "<!doctype html><html><body><h1>Test</h1></body></html>",
          ),
        )
      ).format,
    ).toBe("HTML");
  });
  it.each(["doc", "rtf", "pdf", "ods", "odp"])(
    "lehnt %s ohne stillen Formatverlust ab",
    async (ext) => {
      await expect(importFile(file(`test.${ext}`, "text"))).rejects.toThrow(
        "noch nicht",
      );
    },
  );
  it("lehnt falsches DOCX und Binärdateien ab", async () => {
    await expect(importFile(file("a.docx", "fake"))).rejects.toThrow(
      "gültiges",
    );
    await expect(
      importFile(file("a.txt", new Uint8Array([1, 0, 4]))),
    ).rejects.toThrow("Binärdatei");
  });
  it("escapet Text-Markup", () =>
    expect(textToHtml("<script>&")).toBe("<p>&lt;script&gt;&amp;</p>"));
});
