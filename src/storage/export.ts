import { Capacitor } from "@capacitor/core";
/** Local native cache write followed by an explicit, user-controlled share/save sheet. */
export async function saveExport(blob: Blob, filename: string) {
  if (Capacitor.isNativePlatform()) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([
      import("@capacitor/filesystem"),
      import("@capacitor/share"),
    ]);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 32768)
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
    const result = await Filesystem.writeFile({
      path: `exports/${crypto.randomUUID()}/${filename}`,
      data: btoa(binary),
      directory: Directory.Cache,
      recursive: true,
    });
    await Share.share({
      title: filename,
      files: [result.uri],
      dialogTitle: "Datei speichern oder teilen",
    });
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
