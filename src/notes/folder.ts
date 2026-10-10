import { Capacitor, registerPlugin } from "@capacitor/core";
interface FolderFile {
  id: string;
  name: string;
  size: number;
  modified: number;
}
interface FolderScan {
  connected: boolean;
  files: FolderFile[];
  truncated?: boolean;
  scope?: string;
}
export const folderAvailable = () => Capacitor.getPlatform() === "android";
export const NotesFolder = registerPlugin<{
  choose(): Promise<{ cancelled?: boolean }>;
  scan(): Promise<FolderScan>;
  read(options: { id: string }): Promise<{ data: string }>;
  disconnect(): Promise<void>;
}>("NotesFolder");
const historyKey = "phone-office.samsung-import-history.v1";
function readHistory(): Record<string, string> {
  try {
    const value = JSON.parse(localStorage.getItem(historyKey) || "{}");
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  } catch {
    return {};
  }
}
export function folderStamp(file: FolderFile): string {
  return `${file.id}|${file.size}|${file.modified}`;
}
export async function scanExports(onProgress: (text: string) => void): Promise<{
  files: File[];
  stamps: Map<string, string>;
  connected: boolean;
  remaining: number;
  warnings: string[];
}> {
  const scan = await NotesFolder.scan();
  const history = readHistory();
  const digests = new Set(
    Object.keys(history).filter((k) => k.startsWith("sha256:")),
  );
  const scoped = (f: FolderFile) =>
    `${scan.scope || "export"}|${folderStamp(f)}`;
  const candidates = scan.files.filter(
    (f) => f.modified <= 0 || !history[scoped(f)],
  );
  const files: File[] = [],
    stamps = new Map<string, string>(),
    warnings: string[] = [];
  let bytes = 0,
    checked = 0;
  candidates.sort((a, b) => a.id.localeCompare(b.id));
  const cursorKey = `${historyKey}.cursor.${scan.scope || "export"}`;
  let cursor = 0;
  try {
    cursor =
      Math.max(0, Number(localStorage.getItem(cursorKey)) || 0) %
      Math.max(1, candidates.length);
  } catch {
    /* scanning still works without an optional cursor */
  }
  const ordered = [...candidates.slice(cursor), ...candidates.slice(0, cursor)];
  for (const source of ordered.slice(0, 50)) {
    onProgress(
      `Exportordner: ${files.length + 1} / ${Math.min(50, candidates.length)} · ${source.name}`,
    );
    if (source.size > 20 * 1024 * 1024) {
      warnings.push(
        `${source.name}: größer als 20 MB, bitte separat aufteilen.`,
      );
      checked++;
      continue;
    }
    if (source.size > 0 && bytes + source.size > 50 * 1024 * 1024) break;
    let data: string;
    try {
      ({ data } = await NotesFolder.read({ id: source.id }));
    } catch (e) {
      warnings.push(`${source.name}: ${(e as Error).message}`);
      checked++;
      continue;
    }
    const raw = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    if (bytes + raw.length > 50 * 1024 * 1024) break;
    bytes += raw.length;
    checked++;
    const digest = Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", raw)),
      (x) => x.toString(16).padStart(2, "0"),
    ).join("");
    if (digests.has(`sha256:${digest}`)) continue;
    digests.add(`sha256:${digest}`);
    // Unique internal filename permits multiple exports sharing the same display name.
    const name = files.some((f) => f.name === source.name)
      ? `${files.length + 1}-${source.name}`
      : source.name;
    files.push(
      new File([raw], name, {
        type: source.name.toLowerCase().endsWith(".pdf")
          ? "application/pdf"
          : "application/json",
      }),
    );
    stamps.set(name, `${scoped(source)}\nsha256:${digest}`);
  }
  try {
    localStorage.setItem(
      cursorKey,
      String((cursor + checked) % Math.max(1, candidates.length)),
    );
  } catch {
    /* documents never depend on this optional scan cursor */
  }
  return {
    files,
    stamps,
    connected: scan.connected,
    remaining:
      Math.max(0, candidates.length - checked) + (scan.truncated ? 1 : 0),
    warnings,
  };
}
export function rememberExports(stamps: string[]): void {
  const history = readHistory(),
    now = new Date().toISOString();
  for (const stamp of stamps)
    for (const key of stamp.split("\n")) history[key] = now;
  const entries = Object.entries(history)
    .sort((a, b) => b[1].localeCompare(a[1]))
    .slice(0, 4000);
  localStorage.setItem(historyKey, JSON.stringify(Object.fromEntries(entries)));
}
