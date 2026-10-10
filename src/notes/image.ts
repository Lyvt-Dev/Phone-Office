import { newNotebook, PAGE_WIDTH, PAGE_HEIGHT, type Notebook } from "./model";
export function imageDimensions(bytes: Uint8Array): {
  width: number;
  height: number;
} {
  let width = 0,
    height = 0;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (
    bytes.length >= 24 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b)
  ) {
    if (String.fromCharCode(...bytes.slice(12, 16)) !== "IHDR")
      throw new Error("Ungültiger PNG-Bildkopf.");
    width = view.getUint32(16);
    height = view.getUint32(20);
  } else if (bytes[0] === 255 && bytes[1] === 216) {
    let offset = 2;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset++] !== 255) throw new Error("Ungültiger JPEG-Bildkopf.");
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) continue;
      if (offset + 2 > bytes.length) break;
      const size = view.getUint16(offset);
      if (size < 2 || offset + size > bytes.length)
        throw new Error("Beschädigtes JPEG-Bild.");
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        ![0xc4, 0xc8, 0xcc].includes(marker)
      ) {
        if (size < 8) throw new Error("Ungültige JPEG-Bildgröße.");
        height = view.getUint16(offset + 3);
        width = view.getUint16(offset + 5);
        break;
      }
      offset += size;
    }
  } else
    throw new Error(
      "Bildformat nicht unterstützt. Bitte als PNG oder JPEG öffnen.",
    );
  if (
    !width ||
    !height ||
    width * height > 24000000 ||
    width > 16000 ||
    height > 16000
  )
    throw new Error(
      "Bild zu groß oder beschädigt. Maximal 24 Megapixel; bitte vorher verkleinern.",
    );
  return { width, height };
}
export async function importImage(file: File): Promise<Notebook> {
  if (file.size > 20 * 1024 * 1024)
    throw new Error("Bild zu groß (maximal 20 MB).");
  imageDimensions(new Uint8Array(await file.arrayBuffer()));
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(
          new Error(
            "Bild lässt sich nicht lokal öffnen. Bitte als PNG oder JPEG exportieren.",
          ),
        );
      img.src = url;
    });
    if (image.naturalWidth * image.naturalHeight > 24000000)
      throw new Error("Bild zu groß (maximal 24 Megapixel).");
    const canvas = document.createElement("canvas");
    canvas.width = PAGE_WIDTH;
    canvas.height = PAGE_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx)
      throw new Error("Bilddarstellung ist auf diesem Gerät nicht verfügbar.");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    const ratio = Math.min(
      PAGE_WIDTH / image.naturalWidth,
      PAGE_HEIGHT / image.naturalHeight,
    );
    const w = image.naturalWidth * ratio,
      h = image.naturalHeight * ratio;
    ctx.drawImage(image, (PAGE_WIDTH - w) / 2, (PAGE_HEIGHT - h) / 2, w, h);
    const background = canvas.toDataURL("image/jpeg", 0.9);
    if (
      background.length > 2000000 ||
      !background.startsWith("data:image/jpeg;base64,")
    )
      throw new Error(
        "Bildseite konnte nicht sicher gespeichert werden. Bitte Bild verkleinern.",
      );
    const notebook = newNotebook();
    notebook.pages[0] = { ...notebook.pages[0], paper: "plain", background };
    return notebook;
  } finally {
    URL.revokeObjectURL(url);
  }
}
