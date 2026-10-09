import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import {
  newNotebook,
  newPage,
  pageSvg,
  PAGE_WIDTH,
  PAGE_HEIGHT,
  type Notebook,
} from "./model";

// PDF pages are local, flattened backgrounds. The original PDF is never changed.
export async function importPdf(file: File): Promise<Notebook> {
  if (file.size > 20 * 1024 * 1024)
    throw new Error("PDF ist zu groß (maximal 20 MB).");
  const { getDocument, GlobalWorkerOptions } =
    await import("pdfjs-dist/legacy/build/pdf.mjs");
  GlobalWorkerOptions.workerSrc = workerUrl;
  const task = getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    useSystemFonts: true,
    cMapUrl: new URL("./pdfjs/cmaps/", document.baseURI).href,
    cMapPacked: true,
    standardFontDataUrl: new URL("./pdfjs/standard_fonts/", document.baseURI)
      .href,
    wasmUrl: new URL("./pdfjs/wasm/", document.baseURI).href,
    maxImageSize: 16000000,
    canvasMaxAreaInBytes: 64000000,
  });
  try {
    const pdf = await task.promise;
    if (pdf.numPages > 30)
      throw new Error(
        "Bitte eine PDF-Kopie mit höchstens 30 Seiten auswählen.",
      );
    const notebook = newNotebook();
    notebook.pages = [];
    let size = 0;
    for (let i = 1; i <= pdf.numPages; i++) {
      const source = await pdf.getPage(i),
        original = source.getViewport({ scale: 1 });
      const viewport = source.getViewport({
        scale: Math.min(
          PAGE_WIDTH / original.width,
          PAGE_HEIGHT / original.height,
        ),
      });
      const canvas = document.createElement("canvas");
      canvas.width = PAGE_WIDTH;
      canvas.height = PAGE_HEIGHT;
      const context = canvas.getContext("2d")!;
      context.fillStyle = "white";
      context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
      await source.render({
        canvas,
        canvasContext: context,
        viewport,
        transform: [
          1,
          0,
          0,
          1,
          (PAGE_WIDTH - viewport.width) / 2,
          (PAGE_HEIGHT - viewport.height) / 2,
        ],
      }).promise;
      const background = canvas.toDataURL("image/jpeg", 0.9);
      size += background.length;
      if (background.length > 2_000_000 || size > 12_000_000)
        throw new Error(
          "PDF-Bildseiten sind zu groß. Bitte eine kleinere PDF-Kopie verwenden.",
        );
      notebook.pages.push({
        ...newPage(),
        paper: "plain",
        title: `PDF-Seite ${i}`,
        background,
      });
      canvas.width = canvas.height = 0;
      source.cleanup();
    }
    return notebook;
  } finally {
    await task.destroy();
  }
}

export async function exportNotebookPdf(notebook: Notebook): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: [PAGE_WIDTH, PAGE_HEIGHT],
    compress: true,
  });
  for (let i = 0; i < notebook.pages.length; i++) {
    if (i) pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const url = URL.createObjectURL(
      new Blob([pageSvg(notebook.pages[i])], { type: "image/svg+xml" }),
    );
    try {
      const image = new window.Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = PAGE_WIDTH;
      canvas.height = PAGE_HEIGHT;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Bildausgabe nicht verfügbar.");
      ctx.drawImage(image, 0, 0);
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.94),
        "JPEG",
        0,
        0,
        PAGE_WIDTH,
        PAGE_HEIGHT,
      );
      canvas.width = canvas.height = 0;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return pdf.output("blob");
}
