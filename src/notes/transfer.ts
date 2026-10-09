import { createDocument, type OfficeDocument } from "../core/document";
import { importNote } from "./format";
export interface TransferItem {
  name: string;
  document?: OfficeDocument;
  error?: string;
  warning?: string;
}
export async function prepareSamsungTransfer(
  files: File[],
  onProgress: (name: string, completed: number) => void,
): Promise<TransferItem[]> {
  if (files.length > 50)
    throw new Error(
      "Bitte höchstens 50 Dateien pro Übertragung auswählen. Weitere Notizen anschließend importieren.",
    );
  if (files.reduce((n, f) => n + f.size, 0) > 50 * 1024 * 1024)
    throw new Error("Bitte höchstens 50 MB pro Übertragung auswählen.");
  const results: TransferItem[] = [];
  let size = 0;
  for (const [i, file] of files.entries()) {
    onProgress(file.name, i);
    try {
      const extension = file.name.split(".").at(-1)?.toLowerCase();
      let document: OfficeDocument;
      if (extension === "pdf") {
        const { importPdf } = await import("./pdf");
        document = {
          ...createDocument(file.name.replace(/\.pdf$/i, "").slice(0, 500)),
          format: "NOTIZ",
          notebook: await importPdf(file),
        };
      } else if (extension === "pnote") {
        if (file.size > 20 * 1024 * 1024)
          throw new Error("Notizdatei ist zu groß.");
        document = importNote(await file.text());
      } else if (extension === "sdoc" || extension === "sdocx")
        throw new Error(
          "Samsung-Format nicht zuverlässig lesbar. Diese Notiz in Samsung Notes als PDF exportieren.",
        );
      else
        throw new Error(
          "Bitte PDF-Exporte auswählen; .pnote-Sicherungen werden ebenfalls unterstützt. ZIP vorher entpacken.",
        );
      const bytes = JSON.stringify(document).length;
      if (size + bytes > 30 * 1024 * 1024)
        throw new Error(
          "Diese Übertragung ist zu groß. Datei in einer weiteren Übertragung importieren.",
        );
      size += bytes;
      results.push({
        name: file.name,
        document,
        warning:
          extension === "pdf"
            ? "PDF-Bildseiten: sichtbarer Inhalt bleibt erhalten; ursprüngliche Handschriftstriche, Formulare, Links und Audio sind nicht separat bearbeitbar. Darstellung bitte vergleichen."
            : undefined,
      });
    } catch (e) {
      results.push({ name: file.name, error: (e as Error).message });
    }
  }
  onProgress("", files.length);
  return results;
}
