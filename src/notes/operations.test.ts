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

it("wählt mit einem Lasso auch kreuzende Segmente zwischen Messpunkten aus", async () => {
  const { intersectsLasso } = await import("./operations");
  const polygon = [
    { x: 100, y: 100 },
    { x: 200, y: 100 },
    { x: 200, y: 200 },
    { x: 100, y: 200 },
  ];
  const s = {
    id: "cross",
    color: "#123456",
    width: 3,
    tool: "pen" as const,
    points: [
      { x: 50, y: 150, pressure: 0.5 },
      { x: 250, y: 150, pressure: 0.5 },
    ],
  };
  expect(intersectsLasso(s, polygon)).toBe(true);
  expect(
    intersectsLasso(
      { ...s, points: s.points.map((p) => ({ ...p, y: 50 })) },
      polygon,
    ),
  ).toBe(false);
  expect(intersectsLasso(s, polygon.slice(0, 2))).toBe(false);
});

import { eraseStrokePart } from "./operations";
it("Teilradierer trennt lange Segmente exakt, ohne die Lücke zu verbinden", () => {
  const s = {
    ...stroke,
    points: [
      { x: 0, y: 100, pressure: 0.2 },
      { x: 200, y: 100, pressure: 0.8 },
    ],
  };
  const pieces = eraseStrokePart(s, { x: 100, y: 100 }, 16);
  expect(pieces).toHaveLength(2);
  expect(pieces[0].points.at(-1)!.x).toBeCloseTo(82.5);
  expect(pieces[1].points[0].x).toBeCloseTo(117.5);
  expect(pieces[0].points.at(-1)!.pressure).toBeCloseTo(0.4475);
  expect(new Set(pieces.map((p) => p.id)).size).toBe(2);
  expect(s.points).toHaveLength(2);
  expect(eraseStrokePart(s, { x: 100, y: 300 }, 16)).toEqual([s]);
});
it("Teilradierer entfernt Punkte und volle Segmente, bewahrt Metadaten und gültige Speicherung", () => {
  const dot = { ...stroke, points: [{ x: 100, y: 100, pressure: 0.7 }] };
  expect(eraseStrokePart(dot, { x: 100, y: 100 }, 8)).toEqual([]);
  const small = {
    ...dot,
    points: [
      { x: 99, y: 100, pressure: 0.7 },
      { x: 101, y: 100, pressure: 0.7 },
    ],
  };
  expect(eraseStrokePart(small, { x: 100, y: 100 }, 8)).toEqual([]);
  const n = newNotebook();
  n.preferences = {
    color: "#123456",
    width: 3,
    finger: false,
    zoom: 100,
    eraserMode: "partial",
    eraserSize: 32,
  };
  n.pages[0].strokes = eraseStrokePart(stroke, { x: 300, y: 400 }, 32);
  expect(isNotebook(n)).toBe(true);
  expect(
    isNotebook({ ...n, preferences: { ...n.preferences, eraserSize: NaN } }),
  ).toBe(false);
  expect(
    isNotebook({ ...n, preferences: { ...n.preferences, eraserMode: "fake" } }),
  ).toBe(false);
});
