import DOMPurify from "dompurify";
export const formatSupport = [
  {
    name: "Phone Office Notizbuch (.pnote)",
    status: "Import & Export",
    detail:
      "Alle Handschriftseiten, Fach und getippter Text bleiben als bearbeitbare Notizkopie erhalten. SVG gibt eine einzelne Schreibseite aus; Office-/Textformate enthalten nur getippten Text. Keine Handschrifterkennung.",
  },
  {
    name: "HTML / HTM",
    status: "Import & Export",
    detail:
      "Text, grundlegende Formatierung, Listen und Tabellen. Skripte, externe Bilder und aktive Inhalte werden entfernt.",
  },
  {
    name: "TXT",
    status: "Import & Export",
    detail:
      "Nur Text. Formatierung, Tabellenstruktur und Bilder gehen beim Export verloren.",
  },
  {
    name: "DOCX",
    status: "Import (eingeschränkt)",
    detail:
      "Text und grundlegende Struktur via Mammoth. Seitenlayout, Änderungsverfolgung und weitere Office-Funktionen werden nicht zuverlässig erhalten. Kein DOCX-Export.",
  },
  {
    name: "PDF",
    status: "Notiz-Hintergrund & PDF-Ausgabe",
    detail:
      "In der App lokal als Bildseiten einer neuen Schulnotiz öffnen (maximal 20 MB / 30 Seiten) und mit Handschrift ergänzen. PDF-Handschriftseiten als flache Bilder ausgeben; getippter Text separat. Keine direkte Text-/Formularbearbeitung, keine durchsuchbare Handschrift. Office-Druck/PDF weiterhin über Browser-Druckdialog.",
  },
  {
    name: "ODT · OTT · FODT",
    status: "Import & Export (eingeschränkt)",
    detail:
      "Writer-Text, Überschriften, Grundformatierung, Listen, Tabellen, Links und eingebettete PNG/JPEG/GIF/WebP-Bilder. Seitenlayout, Bildgrößen, Kopf-/Fußzeilen, Kommentare und Änderungsverfolgung werden nicht originalgetreu erhalten.",
  },
  {
    name: "SXW · STW",
    status: "Import (Legacy)",
    detail:
      "Alte Writer-Dokumente und Vorlagen werden als Textkopie importiert. Export in modernes ODT/OTT/FODT; keine Garantie für Legacy-Layout.",
  },
  {
    name: "DOC · RTF · ODS · ODP",
    status: "Nicht unterstützt",
    detail:
      "DOC/RTF benötigen eigene Adapter. Calc-/Impress-Dateien benötigen Tabellen- und Präsentationseditoren. Für Text bitte eine Kopie als ODT, DOCX, HTML oder TXT verwenden.",
  },
];
export function sanitize(html: string) {
  const safe = DOMPurify.sanitize(html, {
    FORBID_TAGS: ["style", "iframe", "form", "svg", "video", "audio"],
  });
  const node = document.createElement("div");
  node.innerHTML = safe;
  node.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
    const kept: [string, string][] = [];
    for (const key of [
      "color",
      "font-family",
      "font-size",
      "text-align",
      "line-height",
    ]) {
      const value = el.style.getPropertyValue(key);
      if (
        value &&
        /^[a-zA-Z0-9\s#.,%()'"-]+$/.test(value) &&
        !/url|expression|var\(/i.test(value)
      )
        kept.push([key, value]);
    }
    el.removeAttribute("style");
    kept.forEach(([key, value]) => el.style.setProperty(key, value));
  });
  node.querySelectorAll("img").forEach((img) => {
    if (
      !/^data:image\/(png|jpeg|gif|webp);base64,/i.test(
        img.getAttribute("src") || "",
      )
    )
      img.remove();
  });
  return node.innerHTML;
}
export function textToHtml(text: string) {
  return text
    .split(/\r?\n/)
    .map(
      (line) =>
        "<p>" +
        line
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;") +
        "</p>",
    )
    .join("");
}
export async function importFile(
  file: File,
): Promise<{ html: string; warnings: string[]; format: string }> {
  if (file.size > 20 * 1024 * 1024)
    throw new Error(
      "Diese erste Version öffnet Dateien bis 20 MB. Bitte eine kleinere Kopie verwenden.",
    );
  const ext = file.name.split(".").pop()?.toLowerCase();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const zip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (zip) {
    const { readOfficeArchive, importWriter } = await import("./odf");
    const archive = await readOfficeArchive(bytes);
    if (archive.kind !== "docx") {
      const result = await importWriter(bytes, archive);
      return { ...result, html: sanitize(result.html) };
    }
    const { default: mammoth } = await import("mammoth/mammoth.browser");
    const result = await mammoth.convertToHtml({
      arrayBuffer: new window.Uint8Array(bytes).buffer,
    });
    return {
      html: sanitize(result.value),
      format: "DOCX",
      warnings: [
        "DOCX wird in eine bearbeitbare HTML-Kopie umgewandelt. Seitenlayout, Kommentare und Änderungen können verloren gehen.",
        ...result.messages.map((m) => m.message),
      ],
    };
  }
  if (ext === "docx")
    throw new Error("Die Datei ist kein gültiges DOCX-Archiv.");
  if (["odt", "ott", "sxw", "stw"].includes(ext || ""))
    throw new Error("Die Datei ist kein gültiges Writer-ZIP-Archiv.");
  if (["doc", "rtf", "pdf", "ods", "odp", "ots", "otp"].includes(ext || ""))
    throw new Error(
      "Dieses Format wird noch nicht importiert. Bitte eine Textkopie als ODT, DOCX, HTML oder TXT verwenden.",
    );
  const text = new TextDecoder().decode(bytes);
  if (
    ext === "fodt" ||
    (/<office:document[\s>]/.test(text) &&
      text.includes("urn:oasis:names:tc:opendocument:xmlns:office:1.0"))
  ) {
    const { importWriter } = await import("./odf");
    const result = await importWriter(bytes);
    return { ...result, html: sanitize(result.html) };
  }
  if (zip || bytes.includes(0))
    throw new Error("Binärdatei erkannt. Bitte TXT, HTML oder DOCX wählen.");
  if (
    ["html", "htm"].includes(ext || "") ||
    /^\s*(<!doctype html|<html[\s>])/i.test(text)
  )
    return {
      html: sanitize(text),
      format: "HTML",
      warnings: [
        "HTML wird bereinigt. Externe Bilder, Skripte und Stylesheets werden nicht übernommen. Nur grundlegende Textformatierung bleibt erhalten.",
      ],
    };
  if (ext === "txt")
    return { html: textToHtml(text), format: "TXT", warnings: [] };
  throw new Error(
    "Unbekannter Dateityp. Unterstützt werden ODT, OTT, FODT, SXW, STW, TXT, HTML, HTM und DOCX.",
  );
}
export function exportContent(html: string, format: "html" | "txt") {
  if (format === "html")
    return (
      '<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Phone Office Dokument</title></head><body>' +
      html +
      "</body></html>"
    );
  const node = document.createElement("div");
  node.innerHTML = html;
  node.querySelectorAll("p,h1,h2,h3,li,tr").forEach((el) => el.append("\n"));
  return node.textContent || "";
}
