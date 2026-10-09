import { describe, expect, it } from "vitest";
import {
  duplicatePage,
  translateStrokes,
  intersectsSelection,
  clampZoom,
} from "./operations";
import { newNotebook, isNotebook, type InkStroke } from "./model";
import { createDocument } from "../core/document";
import { exportNote, importNote } from "./format";
const stroke: InkStroke = {
  id: "a",
  color: "#123456",
  width: 3,
  tool: "pen",
  points: [
    { x: 10, y: 20, pressure: 0.2 },
    { x: 600, y: 800, pressure: 0.9 },
  ],
};
describe("0.5 Notizoperationen", () => {
  it("dupliziert unabhängig mit neuen IDs und bewahrt Metadaten im Rundlauf", async () => {
    const n = newNotebook();
    n.pages[0] = {
      ...n.pages[0],
      title: "Geometrie",
      bookmarked: true,
      strokes: [stroke],
    };
    n.preferences = { color: "#123456", width: 3, finger: false, zoom: 173 };
    const copied = duplicatePage(n, n.pages[0].id);
    expect(copied.pages[1].id).not.toBe(copied.pages[0].id);
    expect(copied.pages[1].strokes[0].id).not.toBe(stroke.id);
    copied.pages[1].strokes[0].points[0].x = 30;
    expect(n.pages[0].strokes[0].points[0].x).toBe(10);
    const blob = exportNote({ ...createDocument(), notebook: copied });
    const text = await new Promise<string>((r) => {
      const f = new FileReader();
      f.onload = () => r(f.result as string);
      f.readAsText(blob);
    });
    expect(importNote(text).notebook).toEqual(copied);
  });
  it("verhindert Duplizierung oberhalb der Seiten- und Gesamtpunktgrenzen", () => {
    const n = newNotebook();
    n.pages = Array.from({ length: 50 }, (_, i) => ({
      ...n.pages[0],
      id: String(i),
    }));
    expect(() => duplicatePage(n, "0")).toThrow();
    const many = newNotebook();
    many.pages[0].strokes = Array.from({ length: 70 }, (_, i) => ({
      ...stroke,
      id: String(i),
      points: Array.from({ length: 2800 }, () => ({ ...stroke.points[0] })),
    }));
    expect(isNotebook(many)).toBe(true);
    expect(() => duplicatePage(many, many.pages[0].id)).toThrow();
  });
  it("verschiebt die gesamte Auswahl an den Seitenrand ohne Form oder Druck zu verändern", () => {
    const moved = translateStrokes([stroke], 1000, -1000)[0];
    expect(moved.points).toEqual([
      { x: 210, y: 0, pressure: 0.2 },
      { x: 800, y: 780, pressure: 0.9 },
    ]);
    expect(stroke.points[0].x).toBe(10);
  });
  it("erkennt kreuzende Striche auch ohne Messpunkt innerhalb der Auswahl", () => {
    expect(
      intersectsSelection(stroke, { x: 300, y: 400 }, { x: 320, y: 430 }),
    ).toBe(true);
    expect(
      intersectsSelection(stroke, { x: 700, y: 0 }, { x: 780, y: 100 }),
    ).toBe(false);
    expect(
      intersectsSelection(
        { ...stroke, points: [stroke.points[0]] },
        { x: 0, y: 0 },
        { x: 20, y: 30 },
      ),
    ).toBe(true);
  });
  it("validiert Zoom und Metadaten ohne ältere Notizbücher auszuschließen", () => {
    const n = newNotebook();
    expect(isNotebook(n)).toBe(true);
    expect(clampZoom(20)).toBe(50);
    expect(clampZoom(900)).toBe(300);
    expect(
      isNotebook({ ...n, pages: [{ ...n.pages[0], bookmarked: "yes" }] }),
    ).toBe(false);
    expect(
      isNotebook({ ...n, pages: [{ ...n.pages[0], title: "x".repeat(201) }] }),
    ).toBe(false);
  });
});

it("hält PDF-Bildhintergründe im SVG und verhindert aktive importierte Inhalte", () => {
  const n = newNotebook();
  n.pages[0].background = "data:image/png;base64,iVBORw0KGgo=";
  expect(isNotebook(n)).toBe(true);
  expect(
    isNotebook({
      ...n,
      pages: [
        { ...n.pages[0], background: "https://tracking.example/image.png" },
      ],
    }),
  ).toBe(false);
  expect(
    isNotebook({
      ...n,
      pages: [
        { ...n.pages[0], background: "data:image/svg+xml;base64,PHN2Zz4=" },
      ],
    }),
  ).toBe(false);
});
