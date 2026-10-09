import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
function artifact(name: string, data: Uint8Array) {
  const dir = process.env.PHONE_OFFICE_ODF_VALIDATION_DIR;
  if (dir) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, name), data);
  }
}
import {
  checkArchiveLimits,
  exportWriter,
  importWriter,
  readOfficeArchive,
} from "./odf";
import { importFile, sanitize } from "./index";
function bytes(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(new Uint8Array(r.result as ArrayBuffer));
    r.onerror = reject;
    r.readAsArrayBuffer(blob);
  });
}
const file = (name: string, data: Uint8Array) =>
  ({
    name,
    size: data.length,
    arrayBuffer: async () =>
      data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
  }) as File;
const sample =
  '<h1>Titel &amp; Inhalt</h1><p style="text-align: center;line-height:1.5"><strong>Fett</strong> <em>Kursiv</em> <u>Linie</u> <s>Alt</s><span style="color:rgb(255, 0, 0);font-size:24px;font-family:Georgia">Rot</span></p><ul><li><p>Eins</p><ol><li><p>Zwei</p></li></ol></li></ul><table><tbody><tr><td><p>A</p></td><td><p>B</p></td></tr></tbody></table><p><a href="https://example.org">Link</a></p>';
const ns =
  'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:xlink="http://www.w3.org/1999/xlink"';
const flat = (body: string, styles = "") =>
  new TextEncoder().encode(
    `<office:document ${ns}><office:automatic-styles>${styles}</office:automatic-styles><office:body><office:text>${body}</office:text></office:body></office:document>`,
  );
describe("Writer-Rundläufe", () => {
  it.each(["odt", "ott", "fodt"] as const)(
    "%s exportieren, öffnen, bearbeiten und erneut öffnen",
    async (format) => {
      const data = await bytes(
        await exportWriter(sample, format, "Mein Titel"),
      );
      artifact("rich." + format, data);
      const first = await importFile(file("test." + format, data));
      const edited = first.html + "<p>Neue Bearbeitung</p>";
      const reopened = await importFile(
        file(
          "kopie." + format,
          await bytes(await exportWriter(edited, format, "Kopie")),
        ),
      );
      const dom = new DOMParser().parseFromString(reopened.html, "text/html");
      expect(dom.querySelector("h1")?.textContent).toBe("Titel & Inhalt");
      expect(dom.querySelector("strong")?.textContent).toBe("Fett");
      expect(dom.querySelector("em")?.textContent).toBe("Kursiv");
      expect(dom.querySelector("u")?.textContent).toBe("Linie");
      expect(dom.querySelector("s")?.textContent).toBe("Alt");
      expect(dom.querySelector("table")?.textContent).toContain("AB");
      expect(dom.querySelector("ul ol li")?.textContent).toBe("Zwei");
      expect(dom.querySelector("a")?.getAttribute("href")).toBe(
        "https://example.org",
      );
      expect(dom.body.textContent).toContain("Neue Bearbeitung");
      expect(reopened.html).toContain("text-align: center");
      expect(reopened.html).toContain("line-height: 150%");
      expect(reopened.html).toContain("font-size: 18pt");
      expect(reopened.warnings.length).toBeGreaterThan(0);
    },
  );
  it.each(["odt", "ott"] as const)(
    "ODF-Paket %s hat erstes unkomprimiertes mimetype und Manifest",
    async (format) => {
      const data = await bytes(
        await exportWriter("<p>Test</p>", format, "Test"),
      );
      const view = new DataView(data.buffer);
      const nameLength = view.getUint16(26, true);
      expect(new TextDecoder().decode(data.slice(30, 30 + nameLength))).toBe(
        "mimetype",
      );
      expect(view.getUint16(8, true)).toBe(0);
      const zip = await JSZip.loadAsync(data);
      expect(await zip.file("mimetype")?.async("string")).toBe(
        "application/vnd.oasis.opendocument." +
          (format === "odt" ? "text" : "text-template"),
      );
      expect(
        await zip.file("META-INF/manifest.xml")?.async("string"),
      ).toContain("content.xml");
    },
  );
  it.each(["odt", "ott", "fodt"] as const)(
    "%s erhält eingebettete Bildbytes",
    async (format) => {
      const image =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII=";
      const first = await importFile(
        file(
          "bild." + format,
          await bytes(
            await exportWriter(
              '<p>Bild</p><img src="' + image + '">',
              format,
              "Bild",
            ),
          ),
        ),
      );
      artifact(
        "image." + format,
        await bytes(
          await exportWriter(
            '<p>Bild</p><img src="' + image + '">',
            format,
            "Bild",
          ),
        ),
      );
      expect(sanitize(first.html)).toContain(image);
    },
  );
  it("erkennt Writer-Paket nach MIME statt nur Endung", async () => {
    const result = await importFile(
      file(
        "umbenannt.zip",
        await bytes(await exportWriter("<p>Erkannt</p>", "odt", "Test")),
      ),
    );
    expect(result.format).toBe("ODT");
  });
});
describe("ODF-Import aus unabhängigem XML", () => {
  it("erhält benannte und geerbte LibreOffice-Stile", async () => {
    const data = flat(
      '<text:h text:outline-level="2">Abschnitt</text:h><text:p text:style-name="P1"><text:span text:style-name="T1">Text</text:span></text:p>',
      '<style:style style:name="Base" style:family="paragraph"><style:paragraph-properties fo:text-align="right"/></style:style><style:style style:name="P1" style:family="paragraph" style:parent-style-name="Base"><style:text-properties fo:font-weight="bold"/></style:style><style:style style:name="T1" style:family="text"><style:text-properties fo:font-style="italic"/></style:style>',
    );
    const result = await importWriter(data);
    expect(result.html).toContain("<h2>Abschnitt</h2>");
    expect(result.html).toContain("text-align:right");
    expect(result.html).toContain("<strong><em>Text</em></strong>");
  });
  it("meldet Noten, Kommentare und Änderungen statt Vollkompatibilität", async () => {
    const result = await importWriter(
      flat(
        "<text:p>Wort<text:note><text:note-citation>1</text:note-citation><text:note-body><text:p>Fußnote</text:p></text:note-body></text:note></text:p><office:annotation><text:p>Kommentar</text:p></office:annotation><text:tracked-changes/>",
      ),
    );
    expect(result.html).toContain("Fußnote");
    expect(result.html).toContain("Kommentar");
    expect(result.warnings.join(" ")).toMatch(/Fuß-\/Endnoten/);
    expect(result.warnings.join(" ")).toContain("Änderungsverfolgung");
  });
  it("ruft keine externen Bilder auf und entfernt gefährliche Links", async () => {
    const result = await importWriter(
      flat(
        '<text:p><text:a xlink:href="javascript:alert(1)">Text</text:a></text:p><draw:frame><draw:image xlink:href="https://external.test/tracker.png"/></draw:frame>',
      ),
    );
    expect(result.html).not.toContain("javascript:");
    expect(result.html).not.toContain("https://external");
    expect(result.warnings.join(" ")).toContain("Extern");
  });
  it("lehnt XML-Entitäten und fehlerhaftes XML ab", async () => {
    await expect(
      importWriter(
        new TextEncoder().encode(
          '<!DOCTYPE doc [<!ENTITY x SYSTEM "https://external.test">]><doc>&x;</doc>',
        ),
      ),
    ).rejects.toThrow("Entitäten");
    await expect(
      importWriter(new TextEncoder().encode("<broken>")),
    ).rejects.toThrow("ungültiges XML");
  });
  it("begrenzt wiederholte Tabellenzellen", async () => {
    await expect(
      importWriter(
        flat(
          '<table:table><table:table-row><table:table-cell table:number-columns-repeated="99999999"/></table:table-row></table:table>',
        ),
      ),
    ).rejects.toThrow("mobile Limit");
  });
  it("lehnt manipulierte ZIP-Entpackgröße vor dem Entpacken ab", async () => {
    const data = await bytes(await exportWriter("<p>Test</p>", "odt", "Test"));
    const copy = data.slice();
    const view = new DataView(copy.buffer);
    for (let i = 0; i < copy.length - 46; i++)
      if (view.getUint32(i, true) === 0x02014b50) {
        view.setUint32(i + 24, 100 * 1024 * 1024, true);
        break;
      }
    expect(() => checkArchiveLimits(copy)).toThrow("mobile Limit");
  });
  it("lehnt falsches Writer-ZIP ab", async () => {
    await expect(
      importFile(file("a.odt", new TextEncoder().encode("Text"))),
    ).rejects.toThrow("gültiges Writer");
    expect(() => checkArchiveLimits(new Uint8Array([0x50, 0x4b]))).toThrow(
      "Ungültiges",
    );
  });
  it.each(["sxw", "stw"])(
    "importiert altes %s und meldet Grenzen",
    async (kind) => {
      const zip = new JSZip();
      zip.file(
        "mimetype",
        kind === "sxw"
          ? "application/vnd.sun.xml.writer"
          : "application/vnd.sun.xml.writer.template",
      );
      zip.file(
        "content.xml",
        '<office:document-content xmlns:office="http://openoffice.org/2000/office" xmlns:text="http://openoffice.org/2000/text"><office:body><text:p>Alter Text</text:p></office:body></office:document-content>',
      );
      const data = await zip.generateAsync({ type: "uint8array" });
      const result = await importWriter(data, await readOfficeArchive(data));
      expect(result.html).toContain("Alter Text");
      expect(result.format).toBe(kind.toUpperCase());
      expect(result.warnings.join(" ")).toContain("Altes Writer");
    },
  );
});
