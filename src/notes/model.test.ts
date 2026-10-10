import { beforeEach, describe, expect, it } from "vitest";
import {
  newNotebook,
  inkPoint,
  strokePath,
  touchesStroke,
  pageSvg,
  isNotebook,
  type InkStroke,
} from "./model";
import { exportNote, importNote } from "./format";
import { createDocument } from "../core/document";
import { localStorageAdapter } from "../storage/local";
const stroke = (): InkStroke => ({
  id: "stroke",
  tool: "pen",
  width: 3,
  color: "#123456",
  points: [inkPoint(10, 20, 0.2), inkPoint(600, 800, 0.9)],
});
beforeEach(() => localStorage.clear());
describe("Notizbuch und Handschrift", () => {
  it("öffnet alle Seiten, Papier, Druckwerte und Text nach Speichern unverändert", () => {
    const notebook = newNotebook();
    notebook.subject = "Mathematik";
    notebook.pages[0].strokes = [stroke()];
    notebook.pages.push({ ...notebook.pages[0], id: "second", paper: "ruled" });
    const doc = { ...createDocument("Schulnotiz", "<p>Formeln</p>"), notebook };
    localStorageAdapter.save([doc]);
    expect(localStorageAdapter.load()).toEqual([doc]);
  });
  it("exportiert und importiert eine unabhängige bearbeitbare Kopie", async () => {
    const notebook = newNotebook();
    notebook.pages[0].strokes = [stroke()];
    const doc = { ...createDocument("Bio", "<p>Zelle</p>"), notebook };
    const blob = exportNote(doc);
    const text = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsText(blob);
    });
    const opened = importNote(text);
    expect(opened.id).not.toBe(doc.id);
    expect(opened.notebook).toEqual(notebook);
    expect(opened.html).toBe(doc.html);
    opened.notebook!.pages[0].strokes = [];
    localStorageAdapter.save([opened]);
    expect(localStorageAdapter.load()[0].notebook?.pages[0].strokes).toEqual(
      [],
    );
  });
  it("radiert auch zwischen weit auseinanderliegenden Messpunkten", () => {
    expect(touchesStroke(stroke(), inkPoint(305, 410, 0.5))).toBe(true);
    expect(touchesStroke(stroke(), inkPoint(780, 20, 0.5))).toBe(false);
  });
  it("begrenzt Koordinaten und erhält unterschiedliche Druckstärken im Vektorpfad", () => {
    expect(inkPoint(-20, 1200, 2)).toEqual({ x: 0, y: 1100, pressure: 1 });
    const s = stroke();
    expect(strokePath(s)).not.toBe(
      strokePath({
        ...s,
        points: s.points.map((p) => ({ ...p, pressure: 0.5 })),
      }),
    );
    expect(strokePath({ ...s, points: [s.points[0]] })).toContain(" a ");
  });
  it("exportiert unabhängiges SVG mit Papier und Handschrift", () => {
    const n = newNotebook();
    n.pages[0].strokes = [stroke()];
    const svg = pageSvg(n.pages[0]);
    const parsed = new DOMParser().parseFromString(svg, "image/svg+xml");
    expect(parsed.querySelector("parsererror")).toBeNull();
    expect(parsed.querySelector('[fill="#123456"]')).not.toBeNull();
    expect(svg).toContain('viewBox="0 0 800 1100"');
  });
  it("lehnt ungültige Daten und zu viele Seiten ab, ohne Recovery zu überschreiben", () => {
    const n = newNotebook();
    n.pages[0].strokes = [{ ...stroke(), color: '" onload="alert(1)' }];
    expect(isNotebook(n)).toBe(false);
    const doc = { ...createDocument(), notebook: n };
    const raw = JSON.stringify([doc]);
    localStorage.setItem("phone-office.documents.v1", raw);
    expect(() => localStorageAdapter.load()).toThrow();
    expect(localStorage.getItem("phone-office.documents.v1")).toBe(raw);
    const many = newNotebook();
    many.pages = Array.from({ length: 51 }, (_, i) => ({
      ...many.pages[0],
      id: String(i),
    }));
    expect(isNotebook(many)).toBe(false);
  });
  it("lehnt nicht-finite Koordinaten und überlange Striche ab", () => {
    const n = newNotebook();
    n.pages[0].strokes = [stroke()];
    n.pages[0].strokes[0].points[0].x = NaN;
    expect(isNotebook(n)).toBe(false);
    n.pages[0].strokes = [
      {
        ...stroke(),
        points: Array.from({ length: 3001 }, () => inkPoint(1, 1, 0.5)),
      },
    ];
    expect(isNotebook(n)).toBe(false);
  });
  it("bereinigt aktive Inhalte im Text importierter Notizen und prüft die Version", () => {
    const json = {
      type: "phone-office-notebook",
      version: 1,
      title: "Test",
      html: "<p>Text</p><script>alert(1)</script>",
      notebook: newNotebook(),
    };
    expect(importNote(JSON.stringify(json)).html).toBe("<p>Text</p>");
    expect(() =>
      importNote(JSON.stringify({ ...json, version: 999 })),
    ).toThrow();
    expect(() => importNote("{")).toThrow();
  });
});

it("speichert Notizeinstellungen und validiert importierte Einstellungswerte", () => {
  const n = newNotebook();
  n.preferences = { color: "#2563eb", width: 6, finger: true, zoom: 125 };
  const doc = { ...createDocument(), notebook: n };
  localStorageAdapter.save([doc]);
  expect(localStorageAdapter.load()[0].notebook?.preferences).toEqual(
    n.preferences,
  );
  expect(
    isNotebook({ ...n, preferences: { ...n.preferences, zoom: 999 } }),
  ).toBe(false);
  expect(
    isNotebook({ ...n, preferences: { ...n.preferences, color: "invalid" } }),
  ).toBe(false);
  expect(
    isNotebook({ ...n, preferences: { ...n.preferences, finger: "yes" } }),
  ).toBe(false);
});

it("erhält Stiftarten in Sicherungen und unterscheidet Druckverhalten und Deckkraft", async () => {
  const { strokeOpacity } = await import("./model");
  const s = stroke();
  const fixed = { ...s, penStyle: "ballpoint" as const };
  expect(strokePath(fixed)).toBe(
    strokePath({
      ...fixed,
      points: fixed.points.map((p) => ({ ...p, pressure: 1 })),
    }),
  );
  expect(strokePath({ ...s, penStyle: "fountain" })).not.toBe(
    strokePath({ ...s, penStyle: "pencil" }),
  );
  expect(strokeOpacity({ ...s, penStyle: "pencil" })).toBe(0.65);
  const notebook = newNotebook();
  notebook.pages[0].strokes = [fixed];
  const doc = { ...createDocument(), notebook };
  const blob = exportNote(doc);
  const text = await new Promise<string>((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.readAsText(blob);
  });
  expect(JSON.parse(text).version).toBe(4);
  expect(importNote(text).notebook?.pages[0].strokes[0].penStyle).toBe(
    "ballpoint",
  );
  expect(
    isNotebook({
      ...notebook,
      pages: [{ ...notebook.pages[0], strokes: [{ ...s, penStyle: "fake" }] }],
    }),
  ).toBe(false);
});
it("begradigt einen gehaltenen Strich ohne Endpunkte oder Druckwerte zu verschieben", async () => {
  const { straightenStroke } = await import("./model");
  const s = {
    ...stroke(),
    points: [
      inkPoint(10, 10, 0.2),
      inkPoint(30, 50, 0.6),
      inkPoint(100, 80, 0.9),
    ],
  };
  expect(straightenStroke(s).points).toEqual([s.points[0], s.points[2]]);
  expect(s.points).toHaveLength(3);
  const dot = { ...s, points: [inkPoint(1, 1, 0.5)] };
  expect(straightenStroke(dot)).toBe(dot);
});
