import { isNotebook } from "../notes/model";
import { validLibraryMetadata, type OfficeDocument } from "../core/document";
const KEY = "phone-office.documents.v1";
export interface DocumentStorage {
  load(): OfficeDocument[];
  save(documents: OfficeDocument[]): void;
}
export const localStorageAdapter: DocumentStorage = {
  load() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    if (
      !Array.isArray(data) ||
      !data.every(
        (d) =>
          d &&
          typeof d.id === "string" &&
          typeof d.title === "string" &&
          typeof d.html === "string" &&
          typeof d.updatedAt === "string" &&
          typeof d.format === "string" &&
          validLibraryMetadata(d) &&
          (d.notebook === undefined || isNotebook(d.notebook)),
      )
    )
      throw new Error(
        "Lokale Wiederherstellungsdaten sind beschädigt. Sie wurden nicht überschrieben.",
      );
    return data;
  },
  save(documents) {
    localStorage.setItem(KEY, JSON.stringify(documents));
  },
};
