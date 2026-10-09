import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { saveDocuments, loadDocuments } from "./database";
import { createDocument } from "../core/document";
import { localStorageAdapter } from "./local";
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("indexedDB", new IDBFactory());
});
afterEach(() => vi.unstubAllGlobals());
it("übernimmt bestehende Dokumente und lädt anschließend den aktuellen Datenbankstand", async () => {
  const old = createDocument("Alt", "<p>Vorher</p>");
  localStorageAdapter.save([old]);
  expect(await loadDocuments()).toEqual([old]);
  const next = { ...old, html: "<p>Nachher</p>" };
  await saveDocuments([next]);
  localStorageAdapter.save([old]);
  expect(await loadDocuments()).toEqual([next]);
});
it("speichert auch bei erschöpftem Legacy-Speicher und erhält die zuletzt abgeschlossene Änderung", async () => {
  const write = vi
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new DOMException("Voll", "QuotaExceededError");
    });
  const a = createDocument("Erste Änderung"),
    b = { ...a, html: "<p>Letzte Änderung</p>" };
  await Promise.all([saveDocuments([a]), saveDocuments([b])]);
  expect(await loadDocuments()).toEqual([b]);
  write.mockRestore();
});
it("verwirft ungültige Snapshots vor dem Schreiben und bewahrt vorhandene Dokumente", async () => {
  const old = createDocument();
  await saveDocuments([old]);
  expect(() =>
    saveDocuments([{ ...old, notebook: { version: 2 } } as never]),
  ).toThrow();
  expect(await loadDocuments()).toEqual([old]);
});
it("blockiert Recovery bei nicht lesbarer Datenbank anstatt mit einer leeren Liste zu überschreiben", async () => {
  const old = createDocument();
  localStorageAdapter.save([old]);
  vi.stubGlobal("indexedDB", {
    open: () => {
      throw new Error("Gesperrt");
    },
  });
  await expect(loadDocuments()).rejects.toThrow("Gesperrt");
  expect(localStorageAdapter.load()).toEqual([old]);
});
