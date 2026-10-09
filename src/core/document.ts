export interface OfficeDocument {
  id: string;
  title: string;
  html: string;
  updatedAt: string;
  format: string;
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
  return (element.textContent || "").trim().split(/\s+/u).filter(Boolean)
    .length;
}
