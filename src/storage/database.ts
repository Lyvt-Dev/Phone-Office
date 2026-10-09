import type { OfficeDocument } from "../core/document";
import { isNotebook } from "../notes/model";
import { localStorageAdapter } from "./local";
const NAME = "phone-office.documents",
  STORE = "snapshots";
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(
        new Error(
          "Dokumentspeicher ist durch eine andere App-Ansicht blockiert.",
        ),
      );
  });
}
function validate(value: unknown): OfficeDocument[] {
  if (
    !Array.isArray(value) ||
    !value.every(
      (d) =>
        d &&
        typeof d.id === "string" &&
        typeof d.title === "string" &&
        typeof d.html === "string" &&
        typeof d.updatedAt === "string" &&
        typeof d.format === "string" &&
        (d.notebook === undefined || isNotebook(d.notebook)),
    )
  )
    throw new Error(
      "Lokale Wiederherstellungsdaten sind beschädigt. Sie wurden nicht überschrieben.",
    );
  return value;
}
export async function loadDocuments(): Promise<OfficeDocument[]> {
  if (typeof indexedDB === "undefined") return localStorageAdapter.load();
  const db = await open();
  try {
    const value = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly"),
        r = tx.objectStore(STORE).get("current");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    return value === undefined ? localStorageAdapter.load() : validate(value);
  } finally {
    db.close();
  }
}
// Coalesce pending edits. At most one transaction and one newer snapshot are retained.
interface Pending {
  snapshot: OfficeDocument[];
  resolve: (() => void)[];
  reject: ((e: unknown) => void)[];
}
let pending: Pending | null = null;
let writing = false;
async function writeSnapshot(snapshot: OfficeDocument[]) {
  if (typeof indexedDB === "undefined") {
    localStorageAdapter.save(snapshot);
    return;
  }
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(snapshot, "current");
      tx.oncomplete = () => resolve();
      tx.onabort = () =>
        reject(tx.error || new Error("Speichern fehlgeschlagen."));
      tx.onerror = () => reject(tx.error);
    });
    try {
      localStorageAdapter.save(snapshot);
    } catch {}
  } finally {
    db.close();
  }
}
async function drain() {
  if (writing) return;
  writing = true;
  while (pending) {
    const next = pending;
    pending = null;
    try {
      await writeSnapshot(next.snapshot);
      next.resolve.forEach((r) => r());
    } catch (e) {
      next.reject.forEach((r) => r(e));
    }
  }
  writing = false;
}
export function saveDocuments(documents: OfficeDocument[]): Promise<void> {
  const snapshot = validate(structuredClone(documents));
  return new Promise((resolve, reject) => {
    if (pending) {
      pending.snapshot = snapshot;
      pending.resolve.push(resolve);
      pending.reject.push(reject);
    } else pending = { snapshot, resolve: [resolve], reject: [reject] };
    queueMicrotask(() => void drain());
  });
}
