export const STICKY_COLORS = [
  "#fff2a8",
  "#ffd6df",
  "#d8edff",
  "#d8f3df",
  "#e5dcff",
] as const;
export interface StickyNote {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
export function stickyLines(text: string, width: number): string[] {
  const columns = Math.max(10, Math.floor((width - 28) / 10));
  return text.split("\n").flatMap((paragraph) => {
    const chars = Array.from(paragraph);
    if (!chars.length) return [""];
    const lines: string[] = [];
    while (chars.length) {
      let length = Math.min(columns, chars.length);
      if (chars.length > columns) {
        const space = chars.slice(0, columns + 1).lastIndexOf(" ");
        if (space > columns / 2) length = space;
      }
      lines.push(chars.splice(0, length).join(""));
      if (chars[0] === " ") chars.shift();
    }
    return lines;
  });
}
export function makeSticky(
  text: string,
  color: string,
  width: number,
  previous?: StickyNote,
): StickyNote {
  const trimmed = text.trim(),
    lines = stickyLines(trimmed, width);
  if (!trimmed || trimmed.length > 300 || lines.length > 20)
    throw new Error(
      "Bitte 1–300 Zeichen und höchstens 20 angezeigte Zeilen verwenden.",
    );
  if (
    !STICKY_COLORS.includes(color as (typeof STICKY_COLORS)[number]) ||
    ![180, 240, 300].includes(width)
  )
    throw new Error("Ungültige Haftnotiz-Einstellungen.");
  const height = Math.max(140, 48 + lines.length * 23);
  return {
    id: previous?.id || crypto.randomUUID(),
    text: trimmed,
    color,
    width,
    height,
    x: Math.max(0, Math.min(800 - width, previous?.x ?? 80)),
    y: Math.max(0, Math.min(1100 - height, previous?.y ?? 80)),
  };
}
export function validStickies(value: unknown): value is StickyNote[] {
  if (
    !Array.isArray(value) ||
    value.length > 30 ||
    new Set(value.map((s) => s?.id)).size !== value.length
  )
    return false;
  return value.every(
    (s) =>
      s &&
      typeof s.id === "string" &&
      typeof s.text === "string" &&
      s.text.trim().length > 0 &&
      s.text.length <= 300 &&
      STICKY_COLORS.includes(s.color) &&
      [180, 240, 300].includes(s.width) &&
      Number.isFinite(s.height) &&
      s.height >=
        Math.max(140, 48 + stickyLines(s.text, s.width).length * 23) &&
      s.height <= 508 &&
      stickyLines(s.text, s.width).length <= 20 &&
      Number.isFinite(s.x) &&
      s.x >= 0 &&
      s.x + s.width <= 800 &&
      Number.isFinite(s.y) &&
      s.y >= 0 &&
      s.y + s.height <= 1100,
  );
}
export const escapeSvgText = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
export function stickySvg(note: StickyNote): string {
  return `<g transform="translate(${note.x} ${note.y})"><rect width="${note.width}" height="${note.height}" rx="8" fill="${note.color}"/><path d="M 0 28 H ${note.width}" stroke="#332f20" opacity=".12"/><text fill="#332f20" font-family="sans-serif" font-size="18">${stickyLines(
    note.text,
    note.width,
  )
    .map(
      (line, i) =>
        `<tspan x="14" y="${52 + i * 23}">${escapeSvgText(line)}</tspan>`,
    )
    .join("")}</text></g>`;
}
