import { describe, it, expect } from "vitest";
import { createDocument, validLibraryMetadata } from "../core/document";
import { newNotebook, isNotebook, pageSvg } from "./model";
import {
  libraryItems,
  librarySubjects,
  duplicateNotebook,
  trashDocument,
  restoreDocument,
} from "./library";
import { exportNote, importNote } from "./format";
const note = () => ({
  ...createDocument("Physik", "<h1>Energie</h1><p>und Kräfte</p>"),
  format: "NOTIZ",
  notebook: newNotebook(),
});
async function blobText(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
}
describe("Notizbibliothek 0.7.5", () => {
  it("trennt Notizen und Office, favorisiert echte Einträge und hält Papierkorb getrennt", () => {
    const n = note(),
      office = createDocument(),
      deleted = trashDocument({ ...note(), favorite: true });
    expect(libraryItems([n, office, deleted], "notes")).toEqual([n]);
    expect(libraryItems([n, office, deleted], "text")).toEqual([office]);
    expect(libraryItems([n, office, deleted], "favorites")).toEqual([]);
    expect(libraryItems([n, office, deleted], "trash")).toEqual([deleted]);
    expect(restoreDocument(deleted).trashedAt).toBeUndefined();
    expect(deleted.trashedAt).toBeTruthy();
  });
  it("sucht getippten Text über Absatzgrenzen sowie Fach und Seitentitel ohne OCR zu behaupten", () => {
    const n = note();
    n.notebook.subject = "Naturwissenschaft";
    n.notebook.pages[0].title = "Mechanik";
    for (const query of ["Energie und Kräfte", "naturwissenschaft", "mechanik"])
      expect(libraryItems([n], "notes", query)).toEqual([n]);
    expect(libraryItems([n], "notes", "unsichtbare Handschrift")).toEqual([]);
    expect(libraryItems([n], "notes", "", "Mathe")).toEqual([]);
    expect(
      librarySubjects([
        n,
        trashDocument({
          ...note(),
          notebook: { ...newNotebook(), subject: "Versteckt" },
        }),
      ]),
    ).toEqual(["Naturwissenschaft"]);
  });
  it("sortiert Titel und dupliziert alle Seiten/Striche unabhängig ohne Trash oder Favorit zu übernehmen", () => {
    const n = note();
    n.notebook.coverColor = "#2563eb";
    n.notebook.pages[0].strokes = [
      {
        id: "stroke",
        color: "#123456",
        width: 3,
        tool: "pen",
        points: [{ x: 20, y: 20, pressure: 0.5 }],
      },
    ];
    const copy = duplicateNotebook({ ...n, favorite: true });
    expect(copy.id).not.toBe(n.id);
    expect(copy.notebook!.pages[0].id).not.toBe(n.notebook.pages[0].id);
    expect(copy.notebook!.pages[0].strokes[0].id).not.toBe("stroke");
    copy.notebook!.pages[0].strokes[0].points[0].x = 100;
    expect(n.notebook.pages[0].strokes[0].points[0].x).toBe(20);
    expect(copy.notebook!.coverColor).toBe("#2563eb");
    expect(copy.favorite).toBeUndefined();
    const alpha = { ...note(), title: "Alpha" };
    expect(libraryItems([n, alpha], "notes", "", "", "title")[0]).toBe(alpha);
  });
  it("bewahrt Cover, Ordner, Punktpapier und Favorit in Sicherung und erneutem Import", async () => {
    const n = { ...note(), favorite: true };
    n.notebook.coverColor = "#7c3aed";
    n.notebook.subject = "Physik";
    n.notebook.pages[0].paper = "dots";
    const text = await blobText(exportNote(n)),
      reopened = importNote(text);
    expect(JSON.parse(text).version).toBe(4);
    expect(reopened.notebook).toEqual(n.notebook);
    expect(reopened.favorite).toBe(true);
    expect(reopened.id).not.toBe(n.id);
    expect(pageSvg(n.notebook.pages[0])).toContain("<circle");
    const legacy = JSON.parse(text);
    legacy.version = 3;
    delete legacy.favorite;
    delete legacy.notebook.coverColor;
    legacy.notebook.pages[0].paper = "grid";
    expect(isNotebook(importNote(JSON.stringify(legacy)).notebook)).toBe(true);
  });
  it("weist beschädigte Organisationsdaten zurück und exportiert keine Löschmarkierung", async () => {
    expect(validLibraryMetadata({ favorite: "true" })).toBe(false);
    expect(validLibraryMetadata({ trashedAt: "broken" })).toBe(false);
    expect(validLibraryMetadata({})).toBe(true);
    const n = note();
    expect(
      isNotebook({ ...n.notebook, coverColor: "url(javascript:evil)" }),
    ).toBe(false);
    const text = await blobText(exportNote(trashDocument(n)));
    expect(JSON.parse(text).trashedAt).toBeUndefined();
    const bad = JSON.parse(text);
    bad.favorite = "fake";
    expect(() => importNote(JSON.stringify(bad))).toThrow();
  });
});

import { shapePoints } from "./operations";
it("geometrische Formen schließen sich, bleiben innerhalb des Bereichs und sind als Striche speicherbar", () => {
  const a = { x: 200, y: 300 },
    b = { x: 40, y: 60 };
  for (const kind of ["rectangle", "ellipse"] as const) {
    const points = shapePoints(kind, a, b);
    expect(points[0]).toEqual(points.at(-1));
    expect(
      points.every((p) => p.x >= 40 && p.x <= 200 && p.y >= 60 && p.y <= 300),
    ).toBe(true);
    const n = newNotebook();
    n.pages[0].strokes = [
      { id: "form", tool: "pen", color: "#123456", width: 3, points },
    ];
    expect(isNotebook(n)).toBe(true);
  }
});
import { imageDimensions } from "./image";
it("prüft Bildabmessungen vor dem Dekodieren und weist Dekompressionsbomben/andere Formate zurück", () => {
  const png = new Uint8Array(24);
  png.set([137, 80, 78, 71, 13, 10, 26, 10]);
  png.set([73, 72, 68, 82], 12);
  const view = new DataView(png.buffer);
  view.setUint32(16, 800);
  view.setUint32(20, 1100);
  expect(imageDimensions(png)).toEqual({ width: 800, height: 1100 });
  view.setUint32(16, 500000);
  expect(() => imageDimensions(png)).toThrow();
  const jpg = new Uint8Array([
    255, 216, 255, 192, 0, 11, 8, 0, 100, 0, 200, 1, 1, 17, 0,
  ]);
  expect(imageDimensions(jpg)).toEqual({ width: 200, height: 100 });
  expect(() => imageDimensions(new Uint8Array([1, 2, 3]))).toThrow();
});
import { coverInk } from "./library";
it("hält Cover-Titel auch bei selbst gewählten hellen Farben lesbar", () => {
  expect(coverInk("#ffffff")).toBe("#26322f");
  expect(coverInk("#ffff00")).toBe("#26322f");
  expect(coverInk("#23634f")).toBe("#ffffff");
});
