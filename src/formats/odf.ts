import JSZip from "jszip";

export type WriterFormat = "odt" | "ott" | "fodt";
const MIME = {
  odt: "application/vnd.oasis.opendocument.text",
  ott: "application/vnd.oasis.opendocument.text-template",
  sxw: "application/vnd.sun.xml.writer",
  stw: "application/vnd.sun.xml.writer.template",
};
const NS =
  'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:dc="http://purl.org/dc/elements/1.1/"';
const escape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
const canonicalName = (a: Attr) => {
  const pairs: Record<string, string> = {
    office: "office",
    text: "text",
    style: "style",
    table: "table",
    draw: "drawing",
    svg: "svg-compatible",
    fo: "xsl-fo-compatible",
  };
  for (const [prefix, part] of Object.entries(pairs))
    if (
      a.namespaceURI ===
      "urn:oasis:names:tc:opendocument:xmlns:" + part + ":1.0"
    )
      return prefix + ":" + a.localName;
  if (a.namespaceURI === "http://www.w3.org/1999/xlink")
    return "xlink:" + a.localName;
  return a.name;
};
const attr = (el: Element, name: string) =>
  Array.from(el.attributes).find((a) => canonicalName(a) === name)?.value || "";
const descendants = (el: Document | Element, name: string) =>
  Array.from(el.getElementsByTagName("*")).filter((e) => e.localName === name);
function xml(text: string) {
  if (/<!DOCTYPE|<!ENTITY/i.test(text))
    throw new Error(
      "XML mit DTD oder Entitäten wird aus Sicherheitsgründen nicht geöffnet.",
    );
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (descendants(doc, "parsererror").length)
    throw new Error("Die LibreOffice-Datei enthält ungültiges XML.");
  if (doc.getElementsByTagName("*").length > 50000)
    throw new Error("Dieses Dokument ist für den mobilen Import zu komplex.");
  return doc;
}
/** Check ZIP central directory before inflation, including declared expansion limits. */
export function checkArchiveLimits(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--)
    if (
      view.getUint32(i, true) === 0x06054b50 &&
      i + 22 + view.getUint16(i + 20, true) === bytes.length
    ) {
      end = i;
      break;
    }
  if (end < 0) throw new Error("Ungültiges Office-ZIP-Archiv.");
  const count = view.getUint16(end + 10, true),
    offset = view.getUint32(end + 16, true),
    size = view.getUint32(end + 12, true);
  if (
    view.getUint16(end + 4, true) ||
    view.getUint16(end + 6, true) ||
    count === 65535 ||
    count > 2000 ||
    offset + size > end
  )
    throw new Error(
      "Mehrteilige, ZIP64- oder zu große Office-Archive werden nicht unterstützt.",
    );
  let pos = offset,
    total = 0;
  for (let i = 0; i < count; i++) {
    if (pos + 46 > end || view.getUint32(pos, true) !== 0x02014b50)
      throw new Error("Beschädigtes Office-ZIP-Verzeichnis.");
    if (view.getUint16(pos + 8, true) & 1)
      throw new Error(
        "Verschlüsselte Dokumente bitte zuerst in LibreOffice als unverschlüsselte Kopie speichern.",
      );
    const length = view.getUint32(pos + 24, true);
    total += length;
    if (length > 16 * 1024 * 1024 || total > 64 * 1024 * 1024)
      throw new Error(
        "Entpackte Dokumentdaten überschreiten das mobile Limit (16 MB je Eintrag, 64 MB insgesamt).",
      );
    pos +=
      46 +
      view.getUint16(pos + 28, true) +
      view.getUint16(pos + 30, true) +
      view.getUint16(pos + 32, true);
  }
  if (pos !== offset + size) throw new Error("Ungültige Office-ZIP-Größe.");
}
export async function readOfficeArchive(bytes: Uint8Array) {
  checkArchiveLimits(bytes);
  const zip = await JSZip.loadAsync(bytes, { checkCRC32: true });
  const mime = (await zip.file("mimetype")?.async("string"))?.trim();
  const kind = Object.entries(MIME).find(([, m]) => m === mime)?.[0];
  if (kind) return { zip, kind };
  if (zip.file("word/document.xml")) return { zip, kind: "docx" };
  throw new Error(
    "Kein unterstütztes Writer-Dokument. Calc (.ods) und Impress (.odp) benötigen einen Tabellen- bzw. Präsentationseditor.",
  );
}
export async function importWriter(
  bytes: Uint8Array,
  archive?: { zip: JSZip; kind: string },
) {
  const content = archive
    ? await archive.zip.file("content.xml")?.async("string")
    : new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (!content) throw new Error("content.xml fehlt in der Writer-Datei.");
  const doc = xml(content);
  const styles = archive
    ? await archive.zip.file("styles.xml")?.async("string")
    : undefined;
  const styleDoc = styles ? xml(styles) : undefined;
  if (
    !/^(document|document-content)$/.test(doc.documentElement.localName) ||
    ![
      "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
      "http://openoffice.org/2000/office",
    ].includes(doc.documentElement.namespaceURI || "")
  )
    throw new Error("Kein gültiges Writer-XML.");
  const body = descendants(doc, "body")[0];
  const text =
    body && Array.from(body.children).find((e) => e.localName === "text");
  // Legacy Writer has paragraphs directly in office:body.
  const legacy = archive?.kind === "sxw" || archive?.kind === "stw";
  if (!body || (!text && !legacy))
    throw new Error("Das Dokument enthält keinen Writer-Textbereich.");
  const warnings = new Set<string>([
    "Writer-Datei wird als neue bearbeitbare Kopie geöffnet. Seitenlayout, Kopf-/Fußzeilen, Bildpositionen und weitere Office-Funktionen werden nicht originalgetreu erhalten.",
  ]);
  if (legacy)
    warnings.add(
      "Altes Writer-Format: Export erfolgt als modernes ODT, OTT oder FODT.",
    );
  const all = [
    ...(styleDoc ? descendants(styleDoc, "style") : []),
    ...descendants(doc, "style"),
  ];
  const styleMap = new Map(all.map((e) => [attr(e, "style:name"), e]));
  const listMap = new Map(
    [
      ...(styleDoc ? descendants(styleDoc, "list-style") : []),
      ...descendants(doc, "list-style"),
    ].map((e) => [attr(e, "style:name"), e]),
  );
  const fonts = new Map(
    [
      ...(styleDoc ? descendants(styleDoc, "font-face") : []),
      ...descendants(doc, "font-face"),
    ].map((e) => [attr(e, "style:name"), attr(e, "svg:font-family")]),
  );
  const defaultStyles = [
    ...(styleDoc ? descendants(styleDoc, "default-style") : []),
    ...descendants(doc, "default-style"),
  ];
  type Properties = Record<string, string>;
  function properties(el: Element) {
    const out: Properties = {};
    for (const child of Array.from(el.children))
      if (["text-properties", "paragraph-properties"].includes(child.localName))
        for (const a of Array.from(child.attributes))
          out[canonicalName(a)] = a.value;
    return out;
  }
  function resolve(name: string, seen = new Set<string>()): Properties {
    if (!name || seen.has(name)) return {};
    seen.add(name);
    const style = styleMap.get(name);
    if (!style) return {};
    return {
      ...resolve(attr(style, "style:parent-style-name"), seen),
      ...properties(style),
    };
  }
  const defaults = defaultStyles.reduce(
    (p, e) => ({ ...p, ...properties(e) }),
    {} as Properties,
  );
  function styled(html: string, p: Properties, block = false) {
    let result = html;
    if (p["fo:font-weight"] === "bold" || Number(p["fo:font-weight"]) >= 600)
      result = "<strong>" + result + "</strong>";
    if (p["fo:font-style"] === "italic") result = "<em>" + result + "</em>";
    if (
      p["style:text-underline-style"] &&
      p["style:text-underline-style"] !== "none"
    )
      result = "<u>" + result + "</u>";
    if (
      p["style:text-line-through-style"] &&
      p["style:text-line-through-style"] !== "none"
    )
      result = "<s>" + result + "</s>";
    const css: string[] = [];
    const family = p["fo:font-family"] || fonts.get(p["style:font-name"]);
    if (family) css.push("font-family:" + family);
    if (p["fo:font-size"]) css.push("font-size:" + p["fo:font-size"]);
    if (p["fo:color"]) css.push("color:" + p["fo:color"]);
    if (css.length)
      result =
        '<span style="' + escape(css.join(";")) + '">' + result + "</span>";
    return {
      html: result,
      css: block
        ? [
            p["fo:text-align"]
              ? "text-align:" +
                p["fo:text-align"]
                  .replace(/^start$/, "left")
                  .replace(/^end$/, "right")
              : "",
            p["fo:line-height"] ? "line-height:" + p["fo:line-height"] : "",
          ]
            .filter(Boolean)
            .join(";")
        : "",
    };
  }
  const images = new Map<Element, string>();
  for (const image of descendants(doc, "image")) {
    const href = attr(image, "xlink:href").replace(/^\.\//, "");
    const embedded = descendants(image, "binary-data")[0]?.textContent?.replace(
      /\s/g,
      "",
    );
    if (embedded) {
      const type = attr(image, "draw:mime-type");
      if (
        /^image\/(png|jpeg|gif|webp)$/.test(type) &&
        /^[a-zA-Z0-9+/]*={0,2}$/.test(embedded)
      )
        images.set(image, `data:${type};base64,${embedded}`);
      else
        warnings.add(
          "Ein eingebettetes Bildformat konnte nicht übernommen werden.",
        );
    } else if (
      archive &&
      href &&
      !/^[a-z]+:|^\/|(?:^|\/)\.\.(?:\/|$)/i.test(href)
    ) {
      const entry = archive.zip.file(href);
      const ext = href.split(".").pop()?.toLowerCase();
      const type = ext === "jpg" ? "jpeg" : ext;
      if (entry && ["png", "jpeg", "gif", "webp"].includes(type || ""))
        images.set(
          image,
          `data:image/${type};base64,${await entry.async("base64")}`,
        );
      else
        warnings.add(
          "Ein Bild oder eingebettetes Objekt konnte nicht übernommen werden.",
        );
    } else warnings.add("Extern verknüpfte Bilder werden nicht geladen.");
  }
  for (const [name, message] of [
    [
      "note",
      "Fuß-/Endnoten werden als beschrifteter Text übernommen; Notenverweise gehen verloren.",
    ],
    [
      "annotation",
      "Kommentare werden als beschrifteter Text übernommen; Kommentar-Funktionen gehen verloren.",
    ],
    ["tracked-changes", "Änderungsverfolgung wird nicht erhalten."],
    ["object", "Eingebettete Objekte und Diagramme werden nicht erhalten."],
    ["custom-shape", "Formen werden nicht erhalten."],
    ["rect", "Formen werden nicht erhalten."],
    ["header", "Kopf-/Fußzeilen werden nicht übernommen."],
    ["footer", "Kopf-/Fußzeilen werden nicht übernommen."],
  ] as const)
    if (
      descendants(doc, name).length ||
      (styleDoc && descendants(styleDoc, name).length)
    )
      warnings.add(message);
  let budget = 60000;
  function repeated(el: Element, name: string) {
    const raw = attr(el, name);
    const n = raw ? Number(raw) : 1;
    if (!Number.isInteger(n) || n < 1 || n > 1000)
      throw new Error(
        "Wiederholte Tabellenzellen oder Zeilen überschreiten das mobile Limit.",
      );
    return n;
  }
  function render(
    node: Node,
    depth = 0,
    listType = "ul",
    header = false,
  ): string {
    if (--budget < 0 || depth > 100)
      throw new Error("Das Dokument ist für den mobilen Import zu komplex.");
    if (node.nodeType === 3) return escape(node.textContent || "");
    if (node.nodeType !== 1) return "";
    const el = node as Element;
    const children = (kind = listType, head = header) =>
      Array.from(el.childNodes)
        .map((n) => render(n, depth + 1, kind, head))
        .join("");
    switch (el.localName) {
      case "p":
      case "h": {
        const h = el.localName === "h";
        const level = Math.min(
          6,
          Math.max(1, Number(attr(el, "text:outline-level")) || 1),
        );
        const tag = h ? "h" + level : "p";
        const result = styled(
          children(),
          { ...defaults, ...resolve(attr(el, "text:style-name")) },
          true,
        );
        return `<${tag}${result.css ? ' style="' + escape(result.css) + '"' : ""}>${result.html}</${tag}>`;
      }
      case "span":
        return styled(children(), resolve(attr(el, "text:style-name"))).html;
      case "s": {
        const n = Number(attr(el, "text:c")) || 1;
        if (n < 1 || n > 1000)
          throw new Error("Ungültige Anzahl von Leerzeichen.");
        return "&#160;".repeat(n);
      }
      case "tab":
        warnings.add("Tabulatoren werden als vier Leerzeichen dargestellt.");
        return "&#160;".repeat(4);
      case "line-break":
        return "<br/>";
      case "a": {
        const href = attr(el, "xlink:href");
        return /^https?:\/\/|^mailto:|^#/i.test(href)
          ? '<a href="' + escape(href) + '">' + children() + "</a>"
          : children();
      }
      case "list":
      case "ordered-list":
      case "unordered-list": {
        const style = listMap.get(attr(el, "text:style-name"));
        const kind =
          el.localName === "ordered-list" ||
          (style && descendants(style, "list-level-style-number").length)
            ? "ol"
            : el.localName === "unordered-list"
              ? "ul"
              : style
                ? "ul"
                : listType;
        return `<${kind}>${children(kind)}</${kind}>`;
      }
      case "list-item":
        return "<li>" + children() + "</li>";
      case "list-header":
        return children();
      case "table":
        return "<table><tbody>" + children() + "</tbody></table>";
      case "table-header-rows":
        return children(listType, true);
      case "table-row":
        return Array.from(
          { length: repeated(el, "table:number-rows-repeated") },
          () => "<tr>" + children() + "</tr>",
        ).join("");
      case "table-cell": {
        const tag = header ? "th" : "td";
        const cols = repeated(el, "table:number-columns-spanned"),
          rows = repeated(el, "table:number-rows-spanned");
        return Array.from(
          { length: repeated(el, "table:number-columns-repeated") },
          () =>
            `<${tag} colspan="${cols}" rowspan="${rows}">${children() || "<p></p>"}</${tag}>`,
        ).join("");
      }
      case "covered-table-cell":
        return "";
      case "image":
        return images.has(el)
          ? '<img src="' +
              images.get(el) +
              '" alt="' +
              escape(attr(el, "draw:name")) +
              '"/>'
          : "<p>[Bild nicht übernommen]</p>";
      case "note":
        return (
          "<span>[Notiz " +
          escape(descendants(el, "note-citation")[0]?.textContent || "") +
          ": " +
          escape(descendants(el, "note-body")[0]?.textContent || "") +
          "]</span>"
        );
      case "annotation":
        return "<p>[Kommentar: " + escape(el.textContent || "") + "]</p>";
      case "tracked-changes":
      case "scripts":
      case "forms":
      case "binary-data":
      case "table-column":
        return "";
      case "object":
      case "object-ole":
      case "custom-shape":
      case "rect":
      case "ellipse":
        return "<p>[Objekt nicht übernommen]</p>";
      default:
        return children();
    }
  }
  const html = Array.from((text || body).childNodes)
    .map((n) => render(n))
    .join("");
  return {
    html,
    warnings: [...warnings],
    format: (archive?.kind || "fodt").toUpperCase(),
  };
}

export async function exportWriter(
  html: string,
  format: WriterFormat,
  title: string,
) {
  const dom = new DOMParser().parseFromString(html, "text/html");
  const automatic: string[] = [];
  const pictures: { path: string; mime: string; base64: string }[] = [];
  let serial = 0;
  function style(properties: string, family = "text") {
    const name = "S" + ++serial;
    automatic.push(
      `<style:style style:name="${name}" style:family="${family}">${properties}</style:style>`,
    );
    return name;
  }
  function render(node: Node, depth = 0): string {
    if (depth > 100)
      throw new Error("Dokumentstruktur zu tief für den Writer-Export.");
    if (node.nodeType === 3) {
      return escape(node.textContent || "")
        .replace(/\u00a0/g, "<text:s/>")
        .replace(/ {2,}/g, (s) => `<text:s text:c="${s.length}"/>`);
    }
    if (node.nodeType !== 1) return "";
    const el = node as HTMLElement;
    const children = () =>
      Array.from(el.childNodes)
        .map((n) => render(n, depth + 1))
        .join("");
    const tag = el.tagName.toLowerCase();
    if (tag === "p" || /^h[1-6]$/.test(tag)) {
      const props = [
        el.style.textAlign
          ? 'fo:text-align="' + escape(el.style.textAlign) + '"'
          : "",
        el.style.lineHeight
          ? 'fo:line-height="' +
            escape(
              /^[\d.]+$/.test(el.style.lineHeight)
                ? String(Number(el.style.lineHeight) * 100) + "%"
                : el.style.lineHeight,
            ) +
            '"'
          : "",
      ]
        .filter(Boolean)
        .join(" ");
      const name = props
        ? style("<style:paragraph-properties " + props + "/>", "paragraph")
        : "";
      const h = tag !== "p";
      return `<text:${h ? "h" : "p"}${h ? ' text:outline-level="' + tag[1] + '"' : ""}${name ? ' text:style-name="' + name + '"' : ""}>${children()}</text:${h ? "h" : "p"}>`;
    }
    if (["strong", "b", "em", "i", "u", "s", "strike", "span"].includes(tag)) {
      const p: string[] = [];
      if (["strong", "b"].includes(tag)) p.push('fo:font-weight="bold"');
      if (["em", "i"].includes(tag)) p.push('fo:font-style="italic"');
      if (tag === "u")
        p.push(
          'style:text-underline-style="solid" style:text-underline-width="auto"',
        );
      if (["s", "strike"].includes(tag))
        p.push('style:text-line-through-style="solid"');
      if (el.style.color)
        p.push(
          'fo:color="' +
            escape(
              el.style.color.startsWith("rgb")
                ? rgbHex(el.style.color)
                : el.style.color,
            ) +
            '"',
        );
      if (el.style.fontSize)
        p.push(
          'fo:font-size="' +
            escape(
              el.style.fontSize.replace(
                /([\d.]+)px/g,
                (_, n) => Number(n) * 0.75 + "pt",
              ),
            ) +
            '"',
        );
      if (el.style.fontFamily)
        p.push('fo:font-family="' + escape(el.style.fontFamily) + '"');
      return p.length
        ? '<text:span text:style-name="' +
            style("<style:text-properties " + p.join(" ") + "/>") +
            '">' +
            children() +
            "</text:span>"
        : children();
    }
    if (tag === "br") return "<text:line-break/>";
    if (tag === "a")
      return (
        '<text:a xlink:type="simple" xlink:href="' +
        escape(el.getAttribute("href") || "") +
        '">' +
        children() +
        "</text:a>"
      );
    if (tag === "ul" || tag === "ol")
      return (
        '<text:list text:style-name="' +
        (tag === "ol" ? "Numbered" : "Bullets") +
        '">' +
        children() +
        "</text:list>"
      );
    if (tag === "li")
      return (
        "<text:list-item>" +
        (el.children.length
          ? children()
          : "<text:p>" + children() + "</text:p>") +
        "</text:list-item>"
      );
    if (tag === "table") {
      const rows = Array.from((el as HTMLTableElement).rows);
      const occupied = new Set<string>();
      let maxColumns = 0;
      const output = rows
        .map((row, rowIndex) => {
          let col = 0;
          let content = "";
          for (const cell of Array.from(row.cells)) {
            while (occupied.has(rowIndex + ":" + col)) {
              content += "<table:covered-table-cell/>";
              col++;
            }
            const width = Math.max(1, cell.colSpan),
              height = Math.max(1, cell.rowSpan);
            if (width > 1000 || height > 1000)
              throw new Error(
                "Verbundene Tabellenzellen überschreiten das mobile Exportlimit.",
              );
            for (let r = 1; r < height; r++)
              for (let c = 0; c < width; c++)
                occupied.add(rowIndex + r + ":" + (col + c));
            content += render(cell, depth + 1);
            col += width;
          }
          while (occupied.has(rowIndex + ":" + col)) {
            content += "<table:covered-table-cell/>";
            col++;
          }
          maxColumns = Math.max(maxColumns, col);
          const rowXml = "<table:table-row>" + content + "</table:table-row>";
          return Array.from(row.cells).every((c) => c.tagName === "TH")
            ? "<table:table-header-rows>" +
                rowXml +
                "</table:table-header-rows>"
            : rowXml;
        })
        .join("");
      return (
        '<table:table table:name="Table' +
        ++serial +
        '"><table:table-column table:number-columns-repeated="' +
        Math.max(1, maxColumns) +
        '"/>' +
        output +
        "</table:table>"
      );
    }
    if (tag === "tr")
      return "<table:table-row>" + children() + "</table:table-row>";
    if (tag === "td" || tag === "th") {
      const cols = Math.max(1, Number(el.getAttribute("colspan")) || 1),
        rows = Math.max(1, Number(el.getAttribute("rowspan")) || 1);
      const text = el.querySelector("p,h1,h2,h3,h4,h5,h6")
        ? children()
        : "<text:p>" + children() + "</text:p>";
      return (
        `<table:table-cell office:value-type="string"${cols > 1 ? ' table:number-columns-spanned="' + cols + '"' : ""}${rows > 1 ? ' table:number-rows-spanned="' + rows + '"' : ""}>${text}</table:table-cell>` +
        "<table:covered-table-cell/>".repeat(cols - 1)
      );
    }
    if (tag === "img") {
      const match =
        /^data:(image\/(png|jpeg|gif|webp));base64,([A-Za-z0-9+/]*={0,2})$/.exec(
          el.getAttribute("src") || "",
        );
      if (!match) return "<text:p>[Bild nicht exportiert]</text:p>";
      const path = "Pictures/Image" + ++serial + "." + match[2];
      pictures.push({ path, mime: match[1], base64: match[3] });
      const image =
        format === "fodt"
          ? `<draw:image draw:mime-type="${match[1]}"><office:binary-data>${match[3]}</office:binary-data></draw:image>`
          : `<draw:image xlink:href="${path}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>`;
      const frame = `<draw:frame draw:name="Image${serial}" text:anchor-type="as-char" svg:width="12cm" svg:height="8cm">${image}</draw:frame>`;
      return el.parentElement && /^(P|H[1-6])$/.test(el.parentElement.tagName)
        ? frame
        : "<text:p>" + frame + "</text:p>";
    }
    return children();
  }
  const body = Array.from(dom.body.childNodes)
    .map((n) => render(n))
    .join("");
  const lists = ["Bullets", "Numbered"]
    .map(
      (name) =>
        `<text:list-style style:name="${name}">` +
        Array.from({ length: 10 }, (_, i) =>
          name === "Bullets"
            ? `<text:list-level-style-bullet text:level="${i + 1}" text:bullet-char="•"/>`
            : `<text:list-level-style-number text:level="${i + 1}" style:num-format="1" style:num-suffix="."/>`,
        ).join("") +
        "</text:list-style>",
    )
    .join("");
  const meta =
    "<office:meta><dc:title>" + escape(title) + "</dc:title></office:meta>";
  const root = format === "fodt" ? "document" : "document-content";
  const mime = format === "ott" ? MIME.ott : MIME.odt;
  const content = `<?xml version="1.0" encoding="UTF-8"?><office:${root} ${NS} office:version="1.3"${format === "fodt" ? ' office:mimetype="' + mime + '"' : ""}>${format === "fodt" ? meta : ""}<office:automatic-styles>${automatic.join("")}${lists}</office:automatic-styles><office:body><office:text>${body}</office:text></office:body></office:${root}>`;
  if (format === "fodt")
    return new Blob([content], {
      type: "application/vnd.oasis.opendocument.text-flat-xml",
    });
  const zip = new JSZip();
  zip.file("mimetype", mime, { compression: "STORE" });
  zip.file("content.xml", content);
  zip.file(
    "styles.xml",
    `<?xml version="1.0"?><office:document-styles ${NS} office:version="1.3"><office:styles/></office:document-styles>`,
  );
  zip.file(
    "meta.xml",
    `<?xml version="1.0"?><office:document-meta ${NS} office:version="1.3">${meta}</office:document-meta>`,
  );
  pictures.forEach((p) => zip.file(p.path, p.base64, { base64: true }));
  zip.file(
    "META-INF/manifest.xml",
    '<?xml version="1.0"?><manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.3">' +
      [
        ["/", mime],
        ["content.xml", "text/xml"],
        ["styles.xml", "text/xml"],
        ["meta.xml", "text/xml"],
        ...pictures.map((p) => [p.path, p.mime]),
      ]
        .map(
          ([path, type]) =>
            `<manifest:file-entry manifest:full-path="${path}" manifest:media-type="${type}"/>`,
        )
        .join("") +
      "</manifest:manifest>",
  );
  return new Blob(
    [await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" })],
    { type: mime },
  );
}
function rgbHex(value: string) {
  const parts = value.match(/[\d.]+/g);
  return parts && parts.length >= 3
    ? "#" +
        parts
          .slice(0, 3)
          .map((n) => Math.round(Number(n)).toString(16).padStart(2, "0"))
          .join("")
    : value;
}
