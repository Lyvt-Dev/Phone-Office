import { expect, it } from "vitest";
import { prepareSamsungTransfer } from "./transfer";
import { newNotebook } from "./model";
const file = (name: string, text: string) =>
  ({ name, size: text.length, text: async () => text }) as File;
it("übernimmt eine neue Notizkopie und meldet nicht unterstützte Samsung-Dateien einzeln", async () => {
  const source = {
    type: "phone-office-notebook",
    version: 1,
    title: "Meine Notiz",
    html: "<p>Inhalt</p>",
    notebook: newNotebook(),
  };
  const result = await prepareSamsungTransfer(
    [
      file("Meine Notiz.pnote", JSON.stringify(source)),
      file("Alt.sdocx", "data"),
      file("Export.zip", "zip"),
    ],
    () => {},
  );
  expect(result[0].document?.title).toBe("Meine Notiz");
  expect(result[0].document?.notebook).toEqual(source.notebook);
  expect(result[1].error).toContain("als PDF exportieren");
  expect(result[2].error).toContain("ZIP vorher entpacken");
  expect(result[1].document).toBeUndefined();
});
it("stoppt zu große Übertragungen vor dem Lesen von Datei-Inhalten", async () => {
  await expect(
    prepareSamsungTransfer(
      Array.from({ length: 51 }, () => file("x.pdf", "")),
      () => {},
    ),
  ).rejects.toThrow("50 Dateien");
  await expect(
    prepareSamsungTransfer(
      [{ name: "x.pdf", size: 51 * 1024 * 1024 } as File],
      () => {},
    ),
  ).rejects.toThrow("50 MB");
});
