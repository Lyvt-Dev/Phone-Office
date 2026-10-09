import { NotebookEditor } from "./notes/NotebookEditor";
import { newNotebook, pageSvg, type NotePage } from "./notes/model";
import { exportNote, importNote } from "./notes/format";
import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  TextStyle,
  Color,
  FontFamily,
  FontSize,
} from "@tiptap/extension-text-style";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import { Extension } from "@tiptap/react";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Search,
  Upload,
  FileText,
  MoreHorizontal,
  Grid2X2,
  List,
  Clock3,
  FolderOpen,
  ShieldCheck,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Undo2,
  Redo2,
  ListOrdered,
  List as ListIcon,
  ImagePlus,
  Table2,
  Link2,
  Download,
  Eye,
  X,
  Moon,
  Sun,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Check,
  Settings2,
  Menu,
  PenLine,
  Type,
} from "lucide-react";
import {
  createDocument,
  wordCount,
  type OfficeDocument,
} from "./core/document";
import { exportContent, formatSupport, importFile } from "./formats";
import { localStorageAdapter } from "./storage/local";
import { saveExport } from "./storage/export";
import type { WriterFormat } from "./formats/odf";
const ParagraphLayout = Extension.create({
  name: "paragraphLayout",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          textAlign: {
            default: null,
            parseHTML: (el) => el.style.textAlign,
            renderHTML: (attrs) =>
              attrs.textAlign
                ? { style: `text-align: ${attrs.textAlign}` }
                : {},
          },
          lineHeight: {
            default: null,
            parseHTML: (el) => el.style.lineHeight,
            renderHTML: (attrs) =>
              attrs.lineHeight
                ? { style: `line-height: ${attrs.lineHeight}` }
                : {},
          },
        },
      },
    ];
  },
});
const initial = () => {
  try {
    return { docs: localStorageAdapter.load(), error: "" };
  } catch (e) {
    return { docs: [], error: (e as Error).message };
  }
};
export default function App() {
  const native = Capacitor.isNativePlatform();
  const [boot] = useState(initial);
  const [docs, setDocs] = useState<OfficeDocument[]>(boot.docs);
  const [active, setActive] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("list");
  const [section, setSection] = useState("recent");
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("phone-office.theme") === "dark";
    } catch {
      return false;
    }
  });
  const [modal, setModal] = useState<
    "formats" | "export" | "find" | "layout" | "preview" | null
  >(null);
  const [noteMode, setNoteMode] = useState<"ink" | "text">("ink");
  const [toolGroup, setToolGroup] = useState("text");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(boot.error);
  const [saveStatus, setSaveStatus] = useState("Lokal gespeichert");
  const [sidebar, setSidebar] = useState(false);
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [page, setPage] = useState("A4");
  const [margin, setMargin] = useState("normal");
  const [, refresh] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const doc = docs.find((d) => d.id === active);
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      TableKit.configure({ table: { resizable: false } }),
      Image.configure({ allowBase64: true }),
      ParagraphLayout,
    ],
    content: "",
    editorProps: {
      attributes: { "aria-label": "Dokument bearbeiten", spellcheck: "true" },
    },
    onUpdate: ({ editor }) => {
      if (active)
        setDocs((prev) =>
          prev.map((d) =>
            d.id === active
              ? {
                  ...d,
                  html: editor.getHTML(),
                  updatedAt: new Date().toISOString(),
                }
              : d,
          ),
        );
    },
    onSelectionUpdate: () => refresh((n) => n + 1),
  });
  useEffect(() => {
    if (boot.error) return;
    try {
      localStorageAdapter.save(docs);
      setSaveStatus("Lokal gespeichert");
    } catch {
      setSaveStatus("Speichern fehlgeschlagen");
      setNotice(
        "Der lokale Speicher ist voll oder gesperrt. Bitte das Dokument jetzt exportieren.",
      );
    }
  }, [docs, boot.error]);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      localStorage.setItem(
        "phone-office.theme",
        String(dark ? "dark" : "light"),
      );
    } catch {}
  }, [dark]);
  useEffect(() => {
    if (active && editor) {
      const selected = docs.find((d) => d.id === active);
      if (selected)
        editor.commands.setContent(selected.html, { emitUpdate: false });
    }
  }, [active, editor]);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input,select,a[href]",
        ) || [],
      );
    focusable()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModal(null);
        return;
      }
      if (event.key === "Tab") {
        const items = focusable();
        const first = items[0],
          last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [modal]);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const resize = () => {
      document.documentElement.style.setProperty(
        "--keyboard-height",
        `${Math.max(0, window.innerHeight - viewport.height)}px`,
      );
      if (editor?.isFocused) editor.commands.scrollIntoView();
    };
    viewport.addEventListener("resize", resize);
    return () => viewport.removeEventListener("resize", resize);
  }, [editor]);
  const open = (d: OfficeDocument) => {
    setActive(d.id);
    setNoteMode("ink");
    setSidebar(false);
  };
  const newDoc = (title?: string, html?: string) => {
    if (boot.error) {
      setNotice(boot.error);
      return;
    }
    const d = createDocument(title, html);
    setDocs((prev) => [d, ...prev]);
    open(d);
  };
  function newNote() {
    if (boot.error) {
      setNotice(boot.error);
      return;
    }
    const d = {
      ...createDocument("Unbenannte Notiz"),
      format: "NOTIZ",
      notebook: newNotebook(),
    };
    setDocs((prev) => [d, ...prev]);
    open(d);
  }
  async function noteExport(page?: NotePage) {
    if (!doc || busy) return;
    setBusy(true);
    try {
      const name = (doc.title.trim() || "Notiz")
        .replace(/[/\\:*?"<>|]/g, "_")
        .slice(0, 120);
      await saveExport(
        page
          ? new Blob([pageSvg(page)], { type: "image/svg+xml" })
          : exportNote(doc),
        name + (page ? "-seite.svg" : ".pnote"),
      );
      setModal(null);
    } catch (e) {
      setNotice("Notizexport fehlgeschlagen: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function importDocument(file?: File) {
    if (!file) return;
    if (boot.error) {
      setNotice(boot.error);
      return;
    }
    try {
      if (file.name.toLowerCase().endsWith(".pnote")) {
        if (file.size > 20 * 1024 * 1024)
          throw new Error("Notizdatei ist zu groß (maximal 20 MB).");
        const d = importNote(await file.text());
        setDocs((prev) => [d, ...prev]);
        open(d);
        setNotice("Notizbuch als neue lokale Kopie geöffnet.");
        if (fileInput.current) fileInput.current.value = "";
        return;
      }
      const result = await importFile(file);
      if (
        result.warnings.length &&
        !window.confirm(
          result.warnings.join("\n") + "\n\nAls neue Kopie öffnen?",
        )
      )
        return;
      const d = {
        ...createDocument(file.name.replace(/\.[^.]+$/, ""), result.html),
        format: result.format,
      };
      setDocs((prev) => [d, ...prev]);
      open(d);
      setNotice(
        "Neue lokale Kopie geöffnet. Die Originaldatei bleibt erhalten.",
      );
    } catch (e) {
      setNotice((e as Error).message);
    }
    if (fileInput.current) fileInput.current.value = "";
  }
  async function download(format: "html" | "txt" | WriterFormat) {
    if (!doc || !editor || busy) return;
    if (
      doc.notebook &&
      !window.confirm(
        "Dieser Export enthält nur getippten Text. Handschrift und Notizseiten fehlen. Für eine vollständige Sicherung bitte Notizbuch (.pnote) wählen. Trotzdem Text exportieren?",
      )
    )
      return;
    setBusy(true);
    try {
      let blob: Blob;
      if (format === "html" || format === "txt")
        blob = new Blob([exportContent(editor.getHTML(), format)], {
          type:
            format === "html"
              ? "text/html;charset=utf-8"
              : "text/plain;charset=utf-8",
        });
      else {
        if (
          !window.confirm(
            "Writer-Export erhält Text, Grundformatierung, Listen, Tabellen und eingebettete Bilder. Seitenlayout, Bildgrößen, Kommentare, Noten und Änderungsverfolgung sind nicht originalgetreu. Als neue Datei exportieren?",
          )
        )
          return;
        const { exportWriter } = await import("./formats/odf");
        blob = await exportWriter(editor.getHTML(), format, doc.title);
      }
      await saveExport(
        blob,
        (doc.title.trim() || "Dokument")
          .replace(/[/\\:*?"<>|]/g, "_")
          .slice(0, 120) +
          "." +
          format,
      );
      setModal(null);
    } catch (e) {
      setNotice("Export nicht abgeschlossen: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function replaceAll() {
    if (!editor || !find) return;
    const replacements: { from: number; to: number }[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        let start = 0,
          index;
        while ((index = node.text.indexOf(find, start)) !== -1) {
          replacements.push({
            from: pos + index,
            to: pos + index + find.length,
          });
          start = index + find.length;
        }
      }
    });
    if (!replacements.length) {
      setNotice("Kein Treffer im Dokument.");
      return;
    }
    const tr = editor.state.tr;
    replacements.reverse().forEach((r) => {
      if (replace) tr.insertText(replace, r.from, r.to);
      else tr.delete(r.from, r.to);
    });
    editor.view.dispatch(tr);
    setNotice(
      `${replacements.length} Treffer ersetzt. Rückgängig ist möglich.`,
    );
    setModal(null);
  }
  const filtered = docs
    .filter((d) =>
      d.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const tool = (
    label: string,
    icon: React.ReactNode,
    action: () => void,
    on = false,
  ) => (
    <button
      title={label}
      aria-label={label}
      aria-pressed={on}
      className={"tool " + (on ? "selected" : "")}
      data-toolgroup={
        ["Rückgängig", "Wiederholen"].includes(label)
          ? "history"
          : ["Fett", "Kursiv", "Unterstrichen", "Durchgestrichen"].includes(
                label,
              )
            ? "text"
            : [
                  "Linksbündig",
                  "Zentriert",
                  "Rechtsbündig",
                  "Aufzählung",
                  "Nummerierte Liste",
                  "Listeneinzug vergrößern",
                  "Listeneinzug verkleinern",
                ].includes(label)
              ? "paragraph"
              : [
                    "Tabelle einfügen",
                    "Bild vom Gerät einfügen",
                    "Link einfügen",
                  ].includes(label)
                ? "insert"
                : "more"
      }
      onMouseDown={(event) => event.preventDefault()}
      onClick={action}
    >
      {icon}
    </button>
  );
  return (
    <div
      className={
        "app " +
        (active ? "editing " : "") +
        (doc?.notebook
          ? "notes-active " + (noteMode === "ink" ? "notes-ink" : "")
          : "")
      }
    >
      <input
        ref={fileInput}
        type="file"
        hidden
        accept=".pnote,.odt,.ott,.fodt,.sxw,.stw,.txt,.html,.htm,.docx,.doc,.rtf,.pdf"
        onChange={(e) => void importDocument(e.target.files?.[0])}
      />
      <input
        ref={imageInput}
        type="file"
        hidden
        accept="image/png,image/jpeg,image/webp"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f && f.size < 5 * 1024 * 1024) {
            const reader = new FileReader();
            reader.onload = () =>
              editor
                ?.chain()
                .focus()
                .setImage({ src: String(reader.result), alt: f.name })
                .run();
            reader.readAsDataURL(f);
          } else if (f) setNotice("Bitte ein Bild unter 5 MB wählen.");
          e.target.value = "";
        }}
      />
      {sidebar && (
        <div
          className="sidebar-scrim"
          aria-hidden="true"
          onClick={() => setSidebar(false)}
        />
      )}
      <aside className={"sidebar " + (sidebar ? "mobile-open" : "")}>
        <button
          className="sidebar-close icon-button"
          aria-label="Menü schließen"
          onClick={() => setSidebar(false)}
        >
          <X size={24} />
        </button>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActive(null);
          }}
        >
          <span className="brand-icon">
            <FileText size={22} />
          </span>
          phone<span className="brand-light">office</span>
          <span className="beta">BETA</span>
        </a>
        <button className="primary new-button" onClick={() => newDoc()}>
          <Plus size={19} /> Neues Dokument
        </button>
        <div className="nav-label">DEIN ARBEITSPLATZ</div>
        <nav>
          <button
            className={section === "recent" ? "nav-item active" : "nav-item"}
            onClick={() => {
              setSection("recent");
              setActive(null);
              setSidebar(false);
            }}
          >
            <Clock3 size={19} /> Zuletzt geöffnet <span>{docs.length}</span>
          </button>
          <button
            className={section === "all" ? "nav-item active" : "nav-item"}
            onClick={() => {
              setSection("all");
              setActive(null);
              setSidebar(false);
            }}
          >
            <FolderOpen size={19} /> Alle Dokumente
          </button>
          <button
            className="nav-item"
            onClick={() => fileInput.current?.click()}
          >
            <Upload size={19} /> Datei importieren
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-card">
            <span className="privacy-icon">
              <ShieldCheck size={21} />
            </span>
            <strong>Deine Worte. Dein Gerät.</strong>
            <p>
              Dokumente bleiben lokal.
              <br />
              Ganz ohne Cloud-Upload.
            </p>
          </div>
          <button className="nav-item" onClick={() => setModal("formats")}>
            <Settings2 size={18} /> Formate & App-Info
          </button>
          <button className="nav-item" onClick={() => setDark(!dark)}>
            {dark ? <Sun size={22} /> : <Moon size={22} />}{" "}
            {dark ? "Hellmodus" : "Dunkelmodus"}
          </button>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              aria-label="Menü öffnen"
              onClick={() => setSidebar(!sidebar)}
            >
              <Menu size={21} />
            </button>
            {active ? (
              <>
                <button
                  className="icon-button"
                  aria-label="Zurück zu Dokumenten"
                  onClick={() => setActive(null)}
                >
                  <ArrowLeft size={19} />
                </button>
                <span>Dokumente</span>
                <span className="slash">/</span>
                <strong>{doc?.title}</strong>
              </>
            ) : (
              <>
                <span>Arbeitsplatz</span>
                <span className="slash">/</span>
                <strong>Dokumente</strong>
              </>
            )}
          </div>
          <div className="top-actions">
            <span className="local-pill">
              <span /> Lokal & privat
            </span>
            <button
              className="icon-button theme"
              aria-label="Farbschema wechseln"
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
          </div>
        </header>
        {!active ? (
          <div className="dashboard">
            <div className="intro">
              <div>
                <h1>Deine Dokumente</h1>
                <p>Lokal öffnen, bearbeiten und als neue Datei speichern.</p>
              </div>
            </div>
            <section className="quick-actions">
              <button className="quick-card create" onClick={newNote}>
                <span className="quick-icon">
                  <FileText size={25} />
                </span>
                <div>
                  <strong>Neue Schulnotiz</strong>
                  <p>Handschrift, Zeichnungen und getippter Text</p>
                </div>
                <ArrowRight size={20} />
              </button>
              <button
                className="quick-card create"
                aria-label="Neues Dokument"
                onClick={() => newDoc()}
              >
                <span className="quick-icon">
                  <Plus size={25} />
                </span>
                <div>
                  <strong>Neues Dokument</strong>
                  <p>Ohne Vorlage oder Beispieltext</p>
                </div>
                <ArrowRight size={20} />
              </button>
              <button
                className="quick-card import"
                onClick={() => fileInput.current?.click()}
              >
                <span className="quick-icon">
                  <Upload size={24} />
                </span>
                <div>
                  <strong>Dokument öffnen</strong>
                  <p>Eine Datei von deinem Gerät importieren</p>
                </div>
                <ArrowRight size={20} />
              </button>
            </section>
            <section className="documents-section">
              <div className="section-head">
                <div>
                  <h2>
                    {section === "recent"
                      ? "Deine Dokumente"
                      : "Alle Dokumente"}{" "}
                    <span>{docs.length}</span>
                  </h2>
                  <p>Nur deine erstellten und importierten Dateien.</p>
                </div>
                <div className="document-controls">
                  <label className="search">
                    <Search size={17} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Dokumente suchen"
                      aria-label="Dokumente suchen"
                    />
                    <kbd>⌕</kbd>
                  </label>
                  <div className="view-switch">
                    <button
                      className={view === "grid" ? "chosen" : ""}
                      aria-label="Kachelansicht"
                      onClick={() => setView("grid")}
                    >
                      <Grid2X2 size={18} />
                    </button>
                    <button
                      className={view === "list" ? "chosen" : ""}
                      aria-label="Listenansicht"
                      onClick={() => setView("list")}
                    >
                      <List size={19} />
                    </button>
                  </div>
                </div>
              </div>
              {filtered.length ? (
                <div className={"document-grid " + view}>
                  {filtered.map((d) => (
                    <article className="document-card" key={d.id}>
                      <button className="document-open" onClick={() => open(d)}>
                        <div className="document-preview">
                          <div className="mini-paper">
                            <h3>{d.title}</h3>
                            <div>
                              {new DOMParser()
                                .parseFromString(d.html, "text/html")
                                .body.textContent?.slice(0, 210)}
                            </div>
                          </div>
                          <span className="format-tag">{d.format}</span>
                        </div>
                        <div className="document-details">
                          <strong>{d.title}</strong>
                          <small>
                            <Clock3 size={12} />
                            {new Date(d.updatedAt).toLocaleDateString("de-DE", {
                              day: "numeric",
                              month: "short",
                            })}{" "}
                            · {wordCount(d.html)} Wörter{" "}
                            {d.notebook
                              ? `· ${d.notebook.pages.length} Notizseiten`
                              : ""}
                          </small>
                        </div>
                      </button>
                      <button
                        className="card-menu icon-button"
                        aria-label={`${d.title} exportieren`}
                        onClick={() => {
                          open(d);
                          setModal("export");
                        }}
                      >
                        <MoreHorizontal size={19} />
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <span>
                    <FileText size={29} />
                  </span>
                  <h3>
                    {search ? "Noch kein Treffer" : "Noch keine Dokumente"}
                  </h3>
                  <p>
                    {search
                      ? "Versuche einen anderen Suchbegriff."
                      : "Erstelle dein erstes Dokument oder öffne eine Datei."}
                  </p>
                  <button className="text-button" onClick={() => newDoc()}>
                    Neues Dokument erstellen <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </section>
            <footer>
              <span>
                <ShieldCheck size={18} /> {saveStatus}
              </span>
              <button onClick={() => setModal("formats")}>
                Formatunterstützung ansehen <ArrowRight size={14} />
              </button>
            </footer>
          </div>
        ) : (
          <div className="editor-layout">
            <div className="editor-top">
              {doc?.notebook && (
                <button
                  className="note-back note-icon"
                  aria-label="Zur Dokumentübersicht"
                  onClick={() => setActive(null)}
                >
                  <ArrowLeft aria-hidden="true" />
                </button>
              )}
              <div>
                <input
                  className="document-title"
                  aria-label="Dokumenttitel"
                  maxLength={500}
                  value={doc?.title || ""}
                  onChange={(e) =>
                    setDocs((prev) =>
                      prev.map((d) =>
                        d.id === active
                          ? {
                              ...d,
                              title: e.target.value,
                              updatedAt: new Date().toISOString(),
                            }
                          : d,
                      ),
                    )
                  }
                />
                <div className="save-meta">
                  <Check size={13} />
                  {saveStatus} · Quelle: {doc?.format}
                </div>
              </div>
              {doc?.notebook && (
                <div
                  className="note-mode"
                  role="tablist"
                  aria-label="Notizmodus"
                >
                  <button
                    role="tab"
                    aria-label="Handschrift"
                    aria-selected={noteMode === "ink"}
                    onClick={() => setNoteMode("ink")}
                  >
                    <PenLine aria-hidden="true" />
                    <span>Handschrift</span>
                  </button>
                  <button
                    role="tab"
                    aria-label="Text"
                    aria-selected={noteMode === "text"}
                    onClick={() => setNoteMode("text")}
                  >
                    <Type aria-hidden="true" />
                    <span>Text</span>
                  </button>
                </div>
              )}
              <div className="editor-actions">
                <button
                  className="secondary"
                  aria-label="Vorschau"
                  onClick={() => setModal("preview")}
                >
                  <Eye size={17} />
                  <span>Vorschau</span>
                </button>
                <button
                  className="primary"
                  aria-label={
                    doc?.notebook ? "Notizbuch sichern" : "Exportieren"
                  }
                  disabled={busy}
                  onClick={() =>
                    doc?.notebook ? void noteExport() : setModal("export")
                  }
                >
                  <Download size={17} />
                  <span>{doc?.notebook ? "Sichern" : "Exportieren"}</span>
                </button>
              </div>
            </div>
            {doc?.notebook && noteMode === "ink" ? (
              <NotebookEditor
                key={doc.id}
                notebook={doc.notebook}
                saveStatus={saveStatus}
                dark={dark}
                onTheme={() => setDark(!dark)}
                onPreview={() => setModal("preview")}
                onMoreExports={() => setModal("export")}
                onNotice={setNotice}
                onExportPage={(p) => void noteExport(p)}
                onChange={(notebook) =>
                  setDocs((prev) =>
                    prev.map((d) =>
                      d.id === active
                        ? {
                            ...d,
                            notebook,
                            updatedAt: new Date().toISOString(),
                          }
                        : d,
                    ),
                  )
                }
              />
            ) : (
              <>
                <div
                  className="tool-tabs"
                  role="tablist"
                  aria-label="Werkzeugbereich"
                >
                  {[
                    ["text", "Text"],
                    ["paragraph", "Absatz"],
                    ["insert", "Einfügen"],
                    ["more", "Mehr"],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      role="tab"
                      aria-selected={toolGroup === id}
                      aria-controls="editor-tools"
                      onClick={() =>
                        setToolGroup(toolGroup === id ? "none" : id)
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div
                  className={"toolbar group-" + toolGroup}
                  role="toolbar"
                  aria-label="Textformatierung"
                  id="editor-tools"
                >
                  {tool("Rückgängig", <Undo2 size={18} />, () => {
                    editor?.chain().focus().undo().run();
                  })}
                  {tool("Wiederholen", <Redo2 size={18} />, () => {
                    editor?.chain().focus().redo().run();
                  })}
                  <span className="separator" />
                  <select
                    aria-label="Formatvorlage"
                    data-toolgroup="text"
                    value={
                      editor?.isActive("heading", { level: 1 })
                        ? "h1"
                        : editor?.isActive("heading", { level: 2 })
                          ? "h2"
                          : "p"
                    }
                    onChange={(e) => {
                      e.target.value === "p"
                        ? editor?.chain().focus().setParagraph().run()
                        : editor
                            ?.chain()
                            .focus()
                            .toggleHeading({
                              level: e.target.value === "h1" ? 1 : 2,
                            })
                            .run();
                      refresh((n) => n + 1);
                    }}
                  >
                    <option value="p">Normaler Text</option>
                    <option value="h1">Überschrift 1</option>
                    <option value="h2">Überschrift 2</option>
                  </select>
                  <select
                    aria-label="Schriftart"
                    data-toolgroup="text"
                    onChange={(e) =>
                      editor
                        ?.chain()
                        .focus()
                        .setFontFamily(e.target.value)
                        .run()
                    }
                  >
                    <option value="Arial">Arial</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="monospace">Monospace</option>
                  </select>
                  <select
                    aria-label="Schriftgröße"
                    data-toolgroup="text"
                    defaultValue="16px"
                    onChange={(e) =>
                      editor?.chain().focus().setFontSize(e.target.value).run()
                    }
                  >
                    {[12, 14, 16, 18, 24, 32].map((n) => (
                      <option key={n} value={n + "px"}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <span className="separator" />
                  {tool(
                    "Fett",
                    <Bold size={18} />,
                    () => {
                      editor?.chain().focus().toggleBold().run();
                      refresh((n) => n + 1);
                    },
                    editor?.isActive("bold"),
                  )}
                  {tool(
                    "Kursiv",
                    <Italic size={18} />,
                    () => {
                      editor?.chain().focus().toggleItalic().run();
                      refresh((n) => n + 1);
                    },
                    editor?.isActive("italic"),
                  )}
                  {tool(
                    "Unterstrichen",
                    <Underline size={18} />,
                    () => {
                      editor?.chain().focus().toggleUnderline().run();
                      refresh((n) => n + 1);
                    },
                    editor?.isActive("underline"),
                  )}
                  {tool("Durchgestrichen", <Strikethrough size={18} />, () => {
                    editor?.chain().focus().toggleStrike().run();
                    refresh((n) => n + 1);
                  })}
                  <label
                    data-toolgroup="text"
                    className="color-tool"
                    title="Textfarbe"
                  >
                    A
                    <input
                      type="color"
                      aria-label="Textfarbe"
                      defaultValue="#334155"
                      onChange={(e) =>
                        editor?.chain().focus().setColor(e.target.value).run()
                      }
                    />
                  </label>
                  <span className="separator" />
                  {tool("Linksbündig", <AlignLeft size={18} />, () => {
                    editor
                      ?.chain()
                      .focus()
                      .updateAttributes("paragraph", { textAlign: "left" })
                      .updateAttributes("heading", { textAlign: "left" })
                      .run();
                  })}
                  {tool("Zentriert", <AlignCenter size={18} />, () => {
                    editor
                      ?.chain()
                      .focus()
                      .updateAttributes("paragraph", { textAlign: "center" })
                      .updateAttributes("heading", { textAlign: "center" })
                      .run();
                  })}
                  {tool("Rechtsbündig", <AlignRight size={18} />, () => {
                    editor
                      ?.chain()
                      .focus()
                      .updateAttributes("paragraph", { textAlign: "right" })
                      .updateAttributes("heading", { textAlign: "right" })
                      .run();
                  })}
                  {tool("Aufzählung", <ListIcon size={18} />, () => {
                    editor?.chain().focus().toggleBulletList().run();
                  })}
                  {tool("Nummerierte Liste", <ListOrdered size={18} />, () => {
                    editor?.chain().focus().toggleOrderedList().run();
                  })}
                  {editor?.isActive("listItem") &&
                    tool(
                      "Listeneinzug vergrößern",
                      <ArrowRight size={18} />,
                      () => {
                        editor?.chain().focus().sinkListItem("listItem").run();
                      },
                    )}
                  {editor?.isActive("listItem") &&
                    tool(
                      "Listeneinzug verkleinern",
                      <ArrowLeft size={18} />,
                      () => {
                        editor?.chain().focus().liftListItem("listItem").run();
                      },
                    )}
                  <span className="separator" />
                  {tool("Tabelle einfügen", <Table2 size={18} />, () => {
                    editor
                      ?.chain()
                      .focus()
                      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                      .run();
                  })}
                  {tool(
                    "Bild vom Gerät einfügen",
                    <ImagePlus size={18} />,
                    () => imageInput.current?.click(),
                  )}
                  {tool("Link einfügen", <Link2 size={18} />, () => {
                    const url = window.prompt("Link (https://…)");
                    if (url && /^https?:\/\//i.test(url))
                      editor?.chain().focus().setLink({ href: url }).run();
                  })}
                  {tool("Suchen und Ersetzen", <Search size={18} />, () =>
                    setModal("find"),
                  )}
                  {tool("Seitenlayout", <Settings2 size={18} />, () =>
                    setModal("layout"),
                  )}
                </div>
                <div className="writing-space">
                  <div
                    className={"paper " + (margin === "narrow" ? "narrow" : "")}
                    style={{ maxWidth: page === "A5" ? 560 : 800 }}
                  >
                    <EditorContent editor={editor} />
                  </div>
                </div>
              </>
            )}
            <div className="editor-status">
              <span>
                {wordCount(doc?.html || "")} Wörter · Rechtschreibung durch
                Gerätebrowser
              </span>
              <span>
                {doc?.notebook ? "Notizbuch" : page} · {saveStatus}
              </span>
            </div>
          </div>
        )}
      </main>
      {notice && (
        <div className="toast" role="status">
          <ShieldCheck size={20} />
          <span>{notice}</span>
          <button
            className="icon-button"
            aria-label="Meldung schließen"
            onClick={() => setNotice("")}
          >
            <X size={17} />
          </button>
        </div>
      )}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            className={"modal " + (modal === "preview" ? "preview-modal" : "")}
            role="dialog"
            aria-modal="true"
            aria-label={
              modal === "formats" ? "Formatunterstützung" : "Dokumentwerkzeuge"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close icon-button"
              aria-label="Dialog schließen"
              onClick={() => setModal(null)}
            >
              <X size={20} />
            </button>
            {modal === "formats" && (
              <>
                <div className="eyebrow">TRANSPARENT VON ANFANG AN</div>
                <h2>Deine Dateien. Klare Grenzen.</h2>
                <p>
                  Phone Office verarbeitet Dokumente lokal. Der
                  Android-Testbuild verwendet denselben Editor wie die
                  Web-Version. Die Formatunterstützung hat folgende Grenzen.
                </p>
                <div className="format-list">
                  {formatSupport.map((f) => (
                    <div key={f.name}>
                      <strong>{f.name}</strong>
                      <span>{f.status}</span>
                      <p>{f.detail}</p>
                    </div>
                  ))}
                </div>
                <p className="hint">
                  Noch nicht implementiert: Kopf-/Fußzeilen, Seitenumbrüche,
                  Fuß-/Endnoten, Formen, Diagramme, Kommentare,
                  Änderungsverfolgung, Cloud-Anbindung und native
                  Dateiverknüpfung. Daten liegen im Browserspeicher; regelmäßige
                  Dateiexporte sichern sie zusätzlich.
                </p>
              </>
            )}
            {modal === "export" && (
              <>
                <div className="eyebrow">ALS NEUE DATEI SPEICHERN</div>
                <h2>Dein Dokument mitnehmen</h2>
                {doc?.notebook && (
                  <>
                    <button
                      className="export-option"
                      disabled={busy}
                      onClick={() => void noteExport()}
                    >
                      <Download />
                      <div>
                        <strong>Notizbuch (.pnote)</strong>
                        <small>
                          Alle Seiten, Handschrift und getippter Text. Wieder
                          bearbeitbar in Phone Office.
                        </small>
                      </div>
                    </button>
                    <p className="hint">
                      Office-/Textformate enthalten nur den getippten Text.
                      Handschrift bleibt ausschließlich in der
                      Notizbuch-Sicherung; einzelne Seiten lassen sich als SVG
                      ausgeben.
                    </p>
                  </>
                )}
                <p>
                  Jeder Export erzeugt eine neue Kopie. Auf Android öffnet sich
                  die Auswahl zum Speichern oder Teilen. Wähle den Speicherort
                  selbst; deine Originaldatei wird nicht verändert.
                </p>
                {(["odt", "ott", "fodt"] as WriterFormat[]).map((format) => (
                  <button
                    key={format}
                    className="export-option"
                    disabled={busy}
                    onClick={() => void download(format)}
                  >
                    <FileText />
                    <div>
                      <strong>
                        {format === "odt"
                          ? "LibreOffice-Dokument (.odt)"
                          : format === "ott"
                            ? "LibreOffice-Vorlage (.ott)"
                            : "Writer-XML (.fodt)"}
                      </strong>
                      <small>
                        Text und grundlegende Formatierung. Formatgrenzen werden
                        vor dem Export angezeigt.
                      </small>
                    </div>
                    <Download size={22} />
                  </button>
                ))}
                <button
                  className="export-option"
                  disabled={busy}
                  onClick={() => void download("html")}
                >
                  <FileText />
                  <div>
                    <strong>HTML-Dokument</strong>
                    <small>
                      Text, einfache Formatierung, Tabellen und lokale Bilder.
                      Kein originalgetreues Office-Seitenlayout.
                    </small>
                  </div>
                  <Download size={19} />
                </button>
                <button
                  className="export-option"
                  onClick={() => {
                    if (
                      window.confirm(
                        "TXT enthält nur Text. Formatierung und Bilder gehen in der exportierten Kopie verloren. Fortfahren?",
                      )
                    )
                      download("txt");
                  }}
                >
                  <FileText />
                  <div>
                    <strong>Nur Text (.txt)</strong>
                    <small>
                      Ohne Formatierung, Bilder und Tabellenstruktur.
                    </small>
                  </div>
                  <Download size={19} />
                </button>
                {!native && (
                  <button
                    className="export-option"
                    onClick={() => {
                      setModal("preview");
                    }}
                  >
                    <Eye />
                    <div>
                      <strong>Drucken / als PDF ausgeben</strong>
                      <small>
                        Über den Druckdialog deines Browsers; PDF-Ausgabe
                        abhängig vom Gerät.
                      </small>
                    </div>
                    <ArrowRight size={19} />
                  </button>
                )}
                {native && (
                  <p className="hint">
                    PDF- und Druckausgabe sind in diesem Android-Testbuild noch
                    nicht verfügbar.
                  </p>
                )}
              </>
            )}
            {modal === "find" && (
              <>
                <h2>Suchen & Ersetzen</h2>
                <label className="field">
                  Suchen
                  <input
                    value={find}
                    onChange={(e) => setFind(e.target.value)}
                  />
                </label>
                <label className="field">
                  Ersetzen durch
                  <input
                    value={replace}
                    onChange={(e) => setReplace(e.target.value)}
                  />
                </label>
                <p className="hint">
                  Groß-/Kleinschreibung beachten. Suche innerhalb
                  zusammenhängender Textabschnitte; keine Treffer über
                  Formatgrenzen.
                </p>
                <button
                  className="primary"
                  disabled={!find}
                  onClick={replaceAll}
                >
                  Alle Treffer ersetzen
                </button>
              </>
            )}
            {modal === "layout" && (
              <>
                <h2>Seitenansicht</h2>
                <p>
                  Diese Einstellungen steuern die Ansicht dieser Sitzung. Der
                  Browser-Druckdialog bestimmt das tatsächliche Druckformat.
                </p>
                <label className="field">
                  Papieransicht
                  <select
                    value={page}
                    onChange={(e) => setPage(e.target.value)}
                  >
                    <option>A4</option>
                    <option>A5</option>
                    <option>Letter</option>
                  </select>
                </label>
                <label className="field">
                  Ansichtsrand
                  <select
                    value={margin}
                    onChange={(e) => setMargin(e.target.value)}
                  >
                    <option value="normal">Normal</option>
                    <option value="narrow">Schmal</option>
                  </select>
                </label>
                <label className="field">
                  Zeilenabstand des ausgewählten Absatzes
                  <select
                    defaultValue="1.6"
                    onChange={(e) =>
                      editor
                        ?.chain()
                        .focus()
                        .updateAttributes("paragraph", {
                          lineHeight: e.target.value,
                        })
                        .run()
                    }
                  >
                    <option value="1">Einfach</option>
                    <option value="1.6">1,6-fach</option>
                    <option value="2">Doppelt</option>
                  </select>
                </label>
              </>
            )}
            {modal === "preview" && (
              <>
                <h2 className="no-print">Dokumentvorschau</h2>
                <p className="no-print">
                  Kontrolliere das Ergebnis im Druckdialog. Seitenumbrüche
                  können je nach Gerät abweichen.
                </p>
                <div
                  className="print-content"
                  dangerouslySetInnerHTML={{
                    __html:
                      (doc?.notebook
                        ? doc.notebook.pages
                            .map(
                              (p) =>
                                `<div class="note-preview-page">${pageSvg(p)}</div>`,
                            )
                            .join("")
                        : "") + (editor?.getHTML() || ""),
                  }}
                />
                {!native && (
                  <button
                    className="primary no-print"
                    onClick={() => window.print()}
                  >
                    Drucken / PDF
                  </button>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
