import { createDocument, type OfficeDocument } from "../core/document";
export type LibrarySection =
  "notes" | "text" | "favorites" | "trash" | "recent" | "all";
export type LibrarySort = "updated" | "title";
export function libraryItems(
  docs: OfficeDocument[],
  section: string,
  query = "",
  subject = "",
  sort: LibrarySort = "updated",
) {
  const needle = query.trim().toLocaleLowerCase();
  return docs
    .filter((d) => (section === "trash" ? !!d.trashedAt : !d.trashedAt))
    .filter((d) => section !== "notes" || !!d.notebook)
    .filter((d) => section !== "text" || !d.notebook)
    .filter((d) => section !== "favorites" || d.favorite === true)
    .filter((d) => !subject || d.notebook?.subject === subject)
    .filter((d) => {
      if (!needle) return true;
      const body = new DOMParser().parseFromString(d.html, "text/html").body;
      body
        .querySelectorAll("p,h1,h2,h3,h4,h5,h6,li,td,th,br")
        .forEach((el) => el.append(" "));
      return [
        d.title,
        d.notebook?.subject || "",
        ...(d.notebook?.pages.flatMap((p) => [
          p.title || "",
          ...(p.stickies || []).map((s) => s.text),
        ]) || []),
        body.textContent || "",
      ]
        .join(" ")
        .replace(/\s+/g, " ")
        .toLocaleLowerCase()
        .includes(needle);
    })
    .sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title, "de")
        : b.updatedAt.localeCompare(a.updatedAt),
    );
}
export function librarySubjects(docs: OfficeDocument[]) {
  return [
    ...new Set(
      docs
        .filter((d) => !d.trashedAt && d.notebook?.subject)
        .map((d) => d.notebook!.subject),
    ),
  ].sort((a, b) => a.localeCompare(b, "de"));
}
export function duplicateNotebook(doc: OfficeDocument): OfficeDocument {
  if (!doc.notebook)
    throw new Error("Nur Notizbücher können hier dupliziert werden.");
  const notebook = structuredClone(doc.notebook);
  for (const page of notebook.pages) {
    page.id = crypto.randomUUID();
    for (const sticky of page.stickies || []) sticky.id = crypto.randomUUID();
    for (const stroke of page.strokes) stroke.id = crypto.randomUUID();
  }
  return {
    ...createDocument(`${doc.title.slice(0, 490)} (Kopie)`, doc.html),
    format: "NOTIZ",
    notebook,
  };
}
export function trashDocument(doc: OfficeDocument): OfficeDocument {
  return { ...doc, trashedAt: new Date().toISOString() };
}
export function restoreDocument(doc: OfficeDocument): OfficeDocument {
  const next = { ...doc };
  delete next.trashedAt;
  return next;
}
export function coverInk(color: string): string {
  const channel = (offset: number) => {
    const value = parseInt(color.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance =
    0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return luminance > 0.23 ? "#26322f" : "#ffffff";
}
