import type { Paper } from "../notes/model";
export const accents = {
  forest: { name: "Wald", color: "#23634f", soft: "#eaf2ee" },
  ocean: { name: "Ozean", color: "#245fb5", soft: "#eaf1fb" },
  violet: { name: "Violett", color: "#7142b5", soft: "#f1ebfa" },
  rose: { name: "Rose", color: "#a73360", soft: "#fbeaf0" },
  amber: { name: "Bernstein", color: "#925613", soft: "#fbf1e2" },
} as const;
export interface Appearance {
  accent: keyof typeof accents;
  font: "manrope" | "system" | "serif";
  size: 100 | 110 | 120;
  density: "comfortable" | "compact";
  workspace: "neutral" | "warm" | "cool";
  defaultPaper: Paper;
}
export const defaultAppearance: Appearance = {
  accent: "forest",
  font: "manrope",
  size: 100,
  density: "comfortable",
  workspace: "neutral",
  defaultPaper: "grid",
};
export function validAppearance(v: unknown): v is Appearance {
  const p = v as Appearance;
  return (
    !!p &&
    Object.hasOwn(accents, p.accent) &&
    ["manrope", "system", "serif"].includes(p.font) &&
    [100, 110, 120].includes(p.size) &&
    ["comfortable", "compact"].includes(p.density) &&
    ["neutral", "warm", "cool"].includes(p.workspace) &&
    ["plain", "grid", "ruled", "dots"].includes(p.defaultPaper)
  );
}
export function loadAppearance(): Appearance {
  try {
    const value = JSON.parse(
      localStorage.getItem("phone-office.appearance.v1") || "null",
    );
    return validAppearance(value) ? value : { ...defaultAppearance };
  } catch {
    return { ...defaultAppearance };
  }
}
export function applyAppearance(p: Appearance) {
  const root = document.documentElement;
  root.dataset.accent = p.accent;
  root.dataset.density = p.density;
  root.dataset.workspace = p.workspace;
  root.style.setProperty(
    "--ui-font",
    p.font === "manrope"
      ? '"Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      : p.font === "serif"
        ? 'Georgia, "Times New Roman", serif'
        : '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  );
  root.style.setProperty("--ui-scale", String(p.size / 100));
}
