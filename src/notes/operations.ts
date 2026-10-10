import {
  PAGE_HEIGHT,
  PAGE_WIDTH,
  type InkStroke,
  type Notebook,
  type NotePage,
} from "./model";

export const clampZoom = (zoom: number) =>
  Math.max(50, Math.min(300, Math.round(zoom)));
export function duplicatePage(notebook: Notebook, id: string): Notebook {
  const index = notebook.pages.findIndex((p) => p.id === id);
  if (index < 0 || notebook.pages.length >= 50)
    throw new Error("Maximal 50 Seiten pro Notizbuch.");
  const original = notebook.pages[index];
  if (
    notebook.pages.reduce((n, p) => n + (p.background?.length || 0), 0) +
      (original.background?.length || 0) >
    12000000
  )
    throw new Error(
      "PDF-Bildgrenze erreicht. Bitte ein weiteres Notizbuch anlegen.",
    );
  const total = notebook.pages
    .flatMap((p) => p.strokes)
    .reduce((n, s) => n + s.points.length, 0);
  if (
    total + original.strokes.reduce((n, s) => n + s.points.length, 0) >
    200000
  )
    throw new Error(
      "Notizgrenze erreicht. Bitte ein weiteres Notizbuch anlegen.",
    );
  const copy: NotePage = {
    ...original,
    id: crypto.randomUUID(),
    title: original.title
      ? `${original.title.slice(0, 190)} (Kopie)`
      : undefined,
    strokes: original.strokes.map((s) => ({
      ...s,
      id: crypto.randomUUID(),
      points: s.points.map((p) => ({ ...p })),
    })),
  };
  const pages = [...notebook.pages];
  pages.splice(index + 1, 0, copy);
  return { ...notebook, pages };
}
export function translateStrokes(
  strokes: InkStroke[],
  dx: number,
  dy: number,
): InkStroke[] {
  if (!strokes.length) return [];
  let minX = PAGE_WIDTH,
    maxX = 0,
    minY = PAGE_HEIGHT,
    maxY = 0;
  for (const s of strokes)
    for (const p of s.points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
  dx = Math.max(-minX, Math.min(PAGE_WIDTH - maxX, dx));
  dy = Math.max(-minY, Math.min(PAGE_HEIGHT - maxY, dy));
  return strokes.map((s) => ({
    ...s,
    points: s.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy })),
  }));
}
// Liang–Barsky clipping also selects strokes that cross a rectangle between samples.
export function intersectsSelection(
  s: InkStroke,
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  const left = Math.min(a.x, b.x),
    right = Math.max(a.x, b.x),
    top = Math.min(a.y, b.y),
    bottom = Math.max(a.y, b.y);
  return s.points.some((p, i) => {
    const q = s.points[Math.max(0, i - 1)],
      dx = p.x - q.x,
      dy = p.y - q.y;
    let start = 0,
      end = 1;
    for (const [direction, distance] of [
      [-dx, q.x - left],
      [dx, right - q.x],
      [-dy, q.y - top],
      [dy, bottom - q.y],
    ]) {
      if (direction === 0) {
        if (distance < 0) return false;
      } else if (direction < 0) start = Math.max(start, distance / direction);
      else end = Math.min(end, distance / direction);
    }
    return start <= end;
  });
}

export function intersectsLasso(
  s: InkStroke,
  polygon: { x: number; y: number }[],
): boolean {
  if (polygon.length < 3) return false;
  const inside = (p: { x: number; y: number }) => {
    let hit = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i],
        b = polygon[j];
      if (
        a.y > p.y !== b.y > p.y &&
        p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
      )
        hit = !hit;
    }
    return hit;
  };
  const cross = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number },
  ) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const between = (a: number, b: number, c: number, d: number) =>
    Math.max(Math.min(a, b), Math.min(c, d)) <=
    Math.min(Math.max(a, b), Math.max(c, d));
  return s.points.some((p, i) => {
    if (inside(p)) return true;
    const q = s.points[Math.max(0, i - 1)];
    return polygon.some((a, j) => {
      const b = polygon[(j + 1) % polygon.length];
      return (
        between(p.x, q.x, a.x, b.x) &&
        between(p.y, q.y, a.y, b.y) &&
        cross(p, q, a) * cross(p, q, b) <= 0 &&
        cross(a, b, p) * cross(a, b, q) <= 0
      );
    });
  });
}
