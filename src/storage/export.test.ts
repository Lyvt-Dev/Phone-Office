import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ write: vi.fn(), share: vi.fn() }));
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => true },
}));
vi.mock("@capacitor/filesystem", () => ({
  Filesystem: { writeFile: mocks.write },
  Directory: { Cache: "CACHE" },
}));
vi.mock("@capacitor/share", () => ({ Share: { share: mocks.share } }));
import { saveExport } from "./export";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.write.mockResolvedValue({ uri: "file:///cache/document.odt" });
  mocks.share.mockResolvedValue({});
});
const blob = () =>
  ({
    arrayBuffer: async () => new TextEncoder().encode("ÄÖÜ Dokument").buffer,
  }) as Blob;
describe("Native Dateiausgabe", () => {
  it("schreibt UTF-8 lokal in Cache und öffnet ausdrücklich die Dateiauswahl", async () => {
    await saveExport(blob(), "Dokument.odt");
    const saved = mocks.write.mock.calls[0][0];
    expect(saved.directory).toBe("CACHE");
    expect(saved.path).toMatch(/^exports\/[^/]+\/Dokument\.odt$/);
    const decoded = new TextDecoder().decode(
      Uint8Array.from(atob(saved.data), (c) => c.charCodeAt(0)),
    );
    expect(decoded).toBe("ÄÖÜ Dokument");
    expect(mocks.share).toHaveBeenCalledWith({
      title: "Dokument.odt",
      files: ["file:///cache/document.odt"],
      dialogTitle: "Datei speichern oder teilen",
    });
  });
  it("meldet Schreibfehler ohne eine leere oder falsche Datei weiterzugeben", async () => {
    mocks.write.mockRejectedValue(new Error("Cache voll"));
    await expect(saveExport(blob(), "Dokument.odt")).rejects.toThrow(
      "Cache voll",
    );
    expect(mocks.share).not.toHaveBeenCalled();
  });
});
