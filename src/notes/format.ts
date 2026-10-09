import { createDocument, type OfficeDocument } from "../core/document";
import { sanitize } from "../formats";
import { isNotebook } from "./model";
export function exportNote(doc: OfficeDocument): Blob {
  if (!isNotebook(doc.notebook)) throw new Error("Ungültiges Notizbuch.");
  const blob = new Blob(
    [
      JSON.stringify({
        type: "phone-office-notebook",
        version: 1,
        title: doc.title,
        html: doc.html,
        notebook: doc.notebook,
      }),
    ],
    { type: "application/json;charset=utf-8" },
  );
  if (blob.size > 20 * 1024 * 1024)
    throw new Error(
      "Notizbuch ist zu groß für eine einzelne Sicherung. Text separat sichern und ein weiteres Notizbuch verwenden.",
    );
  return blob;
}
export function importNote(text: string): OfficeDocument {
  if (text.length > 20 * 1024 * 1024)
    throw new Error("Notizdatei ist zu groß (maximal 20 MB).");
  let n;
  try {
    n = JSON.parse(text);
  } catch {
    throw new Error("Notizdatei ist kein gültiges JSON.");
  }
  if (
    !n ||
    n.type !== "phone-office-notebook" ||
    n.version !== 1 ||
    typeof n.title !== "string" ||
    n.title.length > 500 ||
    typeof n.html !== "string" ||
    !isNotebook(n.notebook)
  )
    throw new Error(
      "Notizdatei ist beschädigt oder ihre Version wird nicht unterstützt.",
    );
  return {
    ...createDocument(n.title, sanitize(n.html)),
    format: "NOTIZ",
    notebook: n.notebook,
  };
}
