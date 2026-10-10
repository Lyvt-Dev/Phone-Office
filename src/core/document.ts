import type { Notebook } from "../notes/model";
export interface OfficeDocument {
  id: string;
  title: string;
  html: string;
  updatedAt: string;
  format: string;
  notebook?: Notebook;
  favorite?: boolean;
  trashedAt?: string;
}
export const createDocument = (
  title = "Unbenanntes Dokument",
  html = "<p></p>",
): OfficeDocument => ({
  id: crypto.randomUUID(),
  title,
  html,
  updatedAt: new Date().toISOString(),
  format: "HTML",
});
export function wordCount(html: string): number {
  const element = document.createElement("div");
  element.innerHTML = html;
  element
    .querySelectorAll("p,h1,h2,h3,h4,h5,h6,li,td,th,br")
    .forEach((el) => el.append(" "));
  const text = element.textContent || "";
  if (typeof Intl.Segmenter === "function")
    return Array.from(
      new Intl.Segmenter("de", { granularity: "word" }).segment(text),
    ).filter((part) => part.isWordLike).length;
  return (text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || []).length;
}

export function validLibraryMetadata(d: {
  favorite?: unknown;
  trashedAt?: unknown;
}): boolean {
  return (
    (d.favorite === undefined || typeof d.favorite === "boolean") &&
    (d.trashedAt === undefined ||
      (typeof d.trashedAt === "string" &&
        /^\d{4}-\d{2}-\d{2}T/.test(d.trashedAt) &&
        Number.isFinite(Date.parse(d.trashedAt))))
  );
}
