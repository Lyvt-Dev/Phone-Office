export const PAGE_WIDTH = 800;
export const PAGE_HEIGHT = 1100;
export type Paper = "plain" | "ruled" | "grid";
export interface InkPoint {
  x: number;
  y: number;
  pressure: number;
}
export type PenStyle = "ballpoint" | "fountain" | "pencil";
export interface InkStroke {
  id: string;
  color: string;
  width: number;
  tool: "pen" | "marker";
  penStyle?: PenStyle;
  points: InkPoint[];
}
export interface NotePage {
  id: string;
  paper: Paper;
  title?: string;
  bookmarked?: boolean;
  background?: string;
  strokes: InkStroke[];
}
export interface NotePreferences {
  color: string;
  width: number;
  finger: boolean;
  zoom: number;
  penStyle?: PenStyle;
  holdStraight?: boolean;
}
export const defaultNotePreferences: NotePreferences = {
  color: "#26322f",
  width: 3,
  finger: false,
  zoom: 100,
  penStyle: "fountain",
  holdStraight: true,
};
export interface Notebook {
  version: 1;
  subject: string;
  pages: NotePage[];
  preferences?: NotePreferences;
}
export const newPage = (): NotePage => ({
  id: crypto.randomUUID(),
  paper: "grid",
  strokes: [],
});
export const newNotebook = (): Notebook => ({
  version: 1,
  subject: "",
  pages: [newPage()],
});
export function isNotebook(value: unknown): value is Notebook {
  const n = value as Notebook;
  let total = 0;
  let imageSize = 0;
  return (
    !!n &&
    n.version === 1 &&
    (n.preferences === undefined ||
      (!!n.preferences &&
        /^#[0-9a-f]{6}$/i.test(n.preferences.color) &&
        [2, 3, 6].includes(n.preferences.width) &&
        typeof n.preferences.finger === "boolean" &&
        Number.isFinite(n.preferences.zoom) &&
        n.preferences.zoom >= 50 &&
        n.preferences.zoom <= 300 &&
        (n.preferences.penStyle === undefined ||
          ["ballpoint", "fountain", "pencil"].includes(
            n.preferences.penStyle,
          )) &&
        (n.preferences.holdStraight === undefined ||
          typeof n.preferences.holdStraight === "boolean"))) &&
    typeof n.subject === "string" &&
    n.subject.length <= 200 &&
    Array.isArray(n.pages) &&
    n.pages.length > 0 &&
    n.pages.length <= 50 &&
    new Set(n.pages.map((p) => p?.id)).size === n.pages.length &&
    n.pages.every(
      (p) =>
        !!p &&
        typeof p.id === "string" &&
        (p.background === undefined ||
          (typeof p.background === "string" &&
            p.background.length <= 2000000 &&
            (imageSize += p.background.length) <= 12000000 &&
            /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(
              p.background,
            ))) &&
        (p.title === undefined ||
          (typeof p.title === "string" && p.title.length <= 200)) &&
        (p.bookmarked === undefined || typeof p.bookmarked === "boolean") &&
        ["plain", "ruled", "grid"].includes(p.paper) &&
        Array.isArray(p.strokes) &&
        p.strokes.length <= 2000 &&
        new Set(p.strokes.map((s) => s?.id)).size === p.strokes.length &&
        p.strokes.every(
          (s) =>
            !!s &&
            typeof s.id === "string" &&
            /^#[0-9a-f]{6}$/i.test(s.color) &&
            Number.isFinite(s.width) &&
            s.width >= 1 &&
            s.width <= 24 &&
            ["pen", "marker"].includes(s.tool) &&
            (s.penStyle === undefined ||
              ["ballpoint", "fountain", "pencil"].includes(s.penStyle)) &&
            Array.isArray(s.points) &&
            s.points.length > 0 &&
            s.points.length <= 3000 &&
            (total += s.points.length) <= 200000 &&
            s.points.every(
              (q) =>
                !!q &&
                Number.isFinite(q.x) &&
                q.x >= 0 &&
                q.x <= PAGE_WIDTH &&
                Number.isFinite(q.y) &&
                q.y >= 0 &&
                q.y <= PAGE_HEIGHT &&
                Number.isFinite(q.pressure) &&
                q.pressure >= 0 &&
                q.pressure <= 1,
            ),
        ),
    )
  );
}
export function inkPoint(x: number, y: number, pressure: number): InkPoint {
  return {
    x: Math.max(0, Math.min(PAGE_WIDTH, x)),
    y: Math.max(0, Math.min(PAGE_HEIGHT, y)),
    pressure:
      Number.isFinite(pressure) && pressure > 0 ? Math.min(1, pressure) : 0.5,
  };
}
// A single filled outline per stroke keeps vector output compact and preserves pressure.
export function strokePath(s: InkStroke): string {
  const radius = (p: InkPoint) =>
    s.width *
    (s.tool === "marker"
      ? 0.5
      : s.penStyle === "ballpoint"
        ? 0.42
        : s.penStyle === "pencil"
          ? 0.12 + p.pressure * 0.38
          : 0.15 + p.pressure * 0.7);
  const pts = s.points;
  if (pts.length === 1) {
    const p = pts[0],
      r = radius(p);
    return `M ${p.x - r} ${p.y} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;
  }
  const left: string[] = [],
    right: string[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)],
      b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b.x - a.x,
      dy = b.y - a.y,
      len = Math.hypot(dx, dy) || 1,
      r = radius(p);
    left.push(
      `${(p.x - (dy / len) * r).toFixed(2)} ${(p.y + (dx / len) * r).toFixed(2)}`,
    );
    right.push(
      `${(p.x + (dy / len) * r).toFixed(2)} ${(p.y - (dx / len) * r).toFixed(2)}`,
    );
  });
  return `M ${left.join(" L ")} L ${right.reverse().join(" L ")} Z`;
}
export function touchesStroke(s: InkStroke, p: InkPoint, radius = 16): boolean {
  return s.points.some((b, i) => {
    const a = s.points[Math.max(0, i - 1)],
      dx = b.x - a.x,
      dy = b.y - a.y;
    const t = Math.max(
      0,
      Math.min(
        1,
        ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1),
      ),
    );
    return (
      Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy) <= radius + s.width / 2
    );
  });
}
export function strokeOpacity(s: InkStroke): number {
  return s.tool === "marker" ? 0.3 : s.penStyle === "pencil" ? 0.65 : 1;
}
export function straightenStroke(s: InkStroke): InkStroke {
  const first = s.points[0],
    last = s.points.at(-1)!;
  return Math.hypot(last.x - first.x, last.y - first.y) >= 12
    ? { ...s, points: [first, last] }
    : s;
}
export function pageSvg(page: NotePage): string {
  const lines =
    page.paper === "plain"
      ? ""
      : Array.from(
          { length: Math.floor(PAGE_HEIGHT / 32) },
          (_, i) => `<path d="M 0 ${(i + 1) * 32} H ${PAGE_WIDTH}"/>`,
        ).join("") +
        (page.paper === "grid"
          ? Array.from(
              { length: PAGE_WIDTH / 32 },
              (_, i) => `<path d="M ${(i + 1) * 32} 0 V ${PAGE_HEIGHT}"/>`,
            ).join("")
          : "");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" viewBox="0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}"><rect width="100%" height="100%" fill="white"/><g fill="none" stroke="#d8e4ec" stroke-width="1">${lines}</g>${page.background ? `<image href="${page.background}" width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}"/>` : ""}${page.strokes.map((s) => `<path d="${strokePath(s)}" fill="${s.color}" opacity="${strokeOpacity(s)}"/>`).join("")}</svg>`;
}
