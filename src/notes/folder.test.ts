import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
const native = vi.hoisted(() => ({ scan: vi.fn(), read: vi.fn() }));
vi.mock("@capacitor/core", () => ({
  Capacitor: { getPlatform: () => "android" },
  registerPlugin: () => native,
}));
import { scanExports, rememberExports } from "./folder";
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.stubGlobal("crypto", webcrypto);
});
afterEach(() => vi.unstubAllGlobals());
it("erkennt freigegebene Exporte und überspringt erst erfolgreich übernommene Inhalte", async () => {
  const metadata = { id: "a", name: "Mathe.pdf", size: 5, modified: 100 };
  native.scan.mockResolvedValue({
    connected: true,
    scope: "tree1",
    files: [metadata],
  });
  native.read.mockResolvedValue({ data: btoa("hello") });
  const first = await scanExports(() => {});
  expect(first.files.map((f) => f.name)).toEqual(["Mathe.pdf"]);
  // Preparing or cancelling must never record an import as completed.
  expect((await scanExports(() => {})).files).toHaveLength(1);
  rememberExports([...first.stamps.values()]);
  native.read.mockClear();
  expect((await scanExports(() => {})).files).toHaveLength(0);
  expect(native.read).not.toHaveBeenCalled();
  // Providers without modification time are deduplicated by actual content.
  native.scan.mockResolvedValue({
    connected: true,
    scope: "tree2",
    files: [{ ...metadata, modified: 0 }],
  });
  expect((await scanExports(() => {})).files).toHaveLength(0);
  native.read.mockResolvedValue({ data: btoa("other") });
  expect((await scanExports(() => {})).files).toHaveLength(1);
});
it("öffnet ohne Ordnerfreigabe keine Dateien und begrenzt übergroße Exporte", async () => {
  native.scan.mockResolvedValue({ connected: false, files: [] });
  expect((await scanExports(() => {})).connected).toBe(false);
  expect(native.read).not.toHaveBeenCalled();
  native.scan.mockResolvedValue({
    connected: true,
    files: [
      { id: "huge", name: "huge.pdf", size: 21 * 1024 * 1024, modified: 1 },
    ],
  });
  expect((await scanExports(() => {})).files).toHaveLength(0);
  expect(native.read).not.toHaveBeenCalled();
});

it("kommt auch bei fehlenden Änderungszeiten über die ersten 50 bereits bekannten Dateien hinaus", async () => {
  native.scan.mockResolvedValue({
    connected: true,
    scope: "many",
    files: Array.from({ length: 51 }, (_, i) => ({
      id: String(i).padStart(3, "0"),
      name: `${i}.pdf`,
      size: 5,
      modified: 0,
    })),
  });
  native.read.mockResolvedValue({ data: btoa("hello") });
  const first = await scanExports(() => {});
  rememberExports([...first.stamps.values()]);
  native.read.mockImplementation(async ({ id }: { id: string }) => ({
    data: btoa(id === "050" ? "new!!" : "hello"),
  }));
  const next = await scanExports(() => {});
  expect(next.files.some((f) => f.name === "50.pdf")).toBe(true);
});
