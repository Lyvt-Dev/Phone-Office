import { AppearanceSettings } from "./ui/AppearanceSettings";
import { applyAppearance, loadAppearance, accents } from "./ui/appearance";
import { NotesLibrary } from "./notes/NotesLibrary";
import { NotebookDetails } from "./notes/NotebookDetails";
import {
  librarySubjects,
  duplicateNotebook,
  trashDocument,
  restoreDocument,
  type LibrarySort,
} from "./notes/library";
import { version } from "../package.json";
import { loadDocuments, saveDocuments } from "./storage/database";
import { SamsungImport } from "./notes/SamsungImport";
import { NotebookEditor } from "./notes/NotebookEditor";
import { newNotebook, pageSvg, type NotePage } from "./notes/model";
import { exportNote, importNote } from "./notes/format";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
const AppInfo = lazy(() =>
  import("./ui/AppInfo").then((m) => ({ default: m.AppInfo })),
);
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
  Palette,
  ArrowLeft,
  ArrowRight,
  Plus,
  Search,
  Upload,
  FileText,
  List,
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
  Star,
  Trash2,
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
  const [boot, setBoot] = useState(initial);
  const [storageReady, setStorageReady] = useState(false);
  const [migration, setMigration] = useState(false);
  const [docs, setDocs] = useState<OfficeDocument[]>(boot.docs);
  const [active, setActive] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [section, setSection] = useState(() => {
    try {
      const value = localStorage.getItem("phone-office.library-section");
      return value && ["notes", "text", "favorites", "trash"].includes(value)
        ? value
        : "notes";
    } catch {
      return "notes";
    }
  });
  const [subjectFilter, setSubjectFilter] = useState("");
  const [librarySort, setLibrarySort] = useState<LibrarySort>("updated");
  const [managing, setManaging] = useState<OfficeDocument | null>(null);
  useEffect(() => {
    try {
      localStorage.setItem("phone-office.library-section", section);
    } catch {}
  }, [section]);
  const [appearance, setAppearance] = useState(loadAppearance);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
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
  const [storedSaveStatus, setSaveStatus] = useState("Lokal gespeichert");
  useEffect(() => {
    applyAppearance(appearance);
    try {
      localStorage.setItem(
        "phone-office.appearance.v1",
        JSON.stringify(appearance),
      );
    } catch {
      setNotice(
        "Gestaltung konnte nicht dauerhaft gespeichert werden. Der lokale Einstellungsspeicher ist voll oder gesperrt.",
      );
    }
  }, [appearance]);
  const [lastSaved, setLastSaved] = useState<OfficeDocument[] | null>(null);
  const saveStatus =
    storedSaveStatus === "Lokal gespeichert" && lastSaved !== docs
      ? "Wird lokal gespeichert …"
      : storedSaveStatus;
  const [sidebar, setSidebar] = useState(false);
  const [appInfoOpen, setAppInfoOpen] = useState(false);
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
    let cancelled = false;
    loadDocuments()
      .then((d) => {
        if (!cancelled) {
          setDocs(d);
          setBoot({ docs: d, error: "" });
          setStorageReady(true);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setBoot({ docs: [], error: (e as Error).message });
          setNotice((e as Error).message);
          setSaveStatus("Wiederherstellung blockiert");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!storageReady || boot.error) return;
    let cancelled = false;
    setSaveStatus("Wird lokal gespeichert …");
    saveDocuments(docs)
      .then(() => {
        if (!cancelled) {
          setLastSaved(docs);
          setSaveStatus("Lokal gespeichert");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setSaveStatus("Speichern fehlgeschlagen");
        setNotice(
          "Der lokale Speicher ist voll oder gesperrt. Bitte das Dokument jetzt exportieren.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [docs, boot.error, storageReady]);
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
    if (d.trashedAt) {
      setManaging(d);
      return;
    }
    setSection(d.notebook ? "notes" : "text");
    setSubjectFilter("");
    setActive(d.id);
    setNoteMode("ink");
    setSidebar(false);
  };
  const newDoc = (title?: string, html?: string) => {
    if (!storageReady || boot.error) {
      setNotice(boot.error || "Dokumentspeicher wird noch geöffnet.");
      return;
    }
    const d = createDocument(title, html);
    setDocs((prev) => [d, ...prev]);
    open(d);
  };
  function newNote() {
    if (!storageReady || boot.error) {
      setNotice(boot.error || "Dokumentspeicher wird noch geöffnet.");
      return;
    }
    const notebook = newNotebook();
    notebook.coverColor = accents[appearance.accent].color;
    notebook.pages[0].paper = appearance.defaultPaper;
    const d = {
      ...createDocument("Unbenannte Notiz"),
      format: "NOTIZ",
      notebook,
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
  async function notePdfExport() {
    if (!doc?.notebook || busy) return;
    const extra = wordCount(doc.html)
      ? " Getippter Text ist separat und fehlt in dieser PDF."
      : "";
    if (
      !window.confirm(
        "PDF enthält alle Notizseiten als Bilder, inklusive Haftnotizen und PDF-Hintergründen. Handschrift und Haftnotizen sind darin nicht mehr einzeln bearbeitbar oder durchsuchbar." +
          extra +
          " Für eine bearbeitbare Sicherung .pnote verwenden. Als neue PDF ausgeben?",
      )
    )
      return;
    setBusy(true);
    try {
      const { exportNotebookPdf } = await import("./notes/pdf");
      await saveExport(
        await exportNotebookPdf(doc.notebook),
        (doc.title || "Notiz").replace(/[/\\:*?"<>|]/g, "_").slice(0, 120) +
          ".pdf",
      );
    } catch (e) {
      setNotice("PDF-Ausgabe fehlgeschlagen: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function importDocument(file?: File) {
    if (!file || busy) return;
    if (!storageReady || boot.error) {
      setNotice(boot.error || "Dokumentspeicher wird noch geöffnet.");
      return;
    }
    try {
      if (
        /\.(png|jpe?g)$/i.test(file.name) ||
        ["image/png", "image/jpeg"].includes(file.type)
      ) {
        if (
          !window.confirm(
            "Bild als neue Notizseite öffnen? Es wird lokal passend auf die Seite verkleinert und als JPEG-Hintergrund gespeichert. Handschrift kann ergänzt werden; das Bild selbst bleibt in dieser Notiz unbeweglich. Originaldatei bleibt erhalten.",
          )
        )
          return;
        setBusy(true);
        const { importImage } = await import("./notes/image");
        const notebook = await importImage(file);
        const d = {
          ...createDocument(file.name.replace(/\.[^.]+$/, "")),
          format: "NOTIZ",
          notebook,
        };
        setDocs((prev) => [d, ...prev]);
        open(d);
        setNotice(
          "Bild als neue lokale Notizseite geöffnet. Originaldatei bleibt erhalten.",
        );
        return;
      }
      if (file.name.toLowerCase().endsWith(".pdf")) {
        if (
          !window.confirm(
            "PDF als neue Schulnotiz öffnen? Seiten werden lokal als Bildhintergründe gerendert und können mit Handschrift ergänzt werden. PDF-Text, Formulare und Links sind nicht direkt bearbeitbar. Darstellung oder Schriftarten können abweichen; Originaldatei bleibt erhalten.",
          )
        )
          return;
        setBusy(true);
        setNotice("PDF wird lokal geöffnet …");
        const { importPdf } = await import("./notes/pdf");
        const notebook = await importPdf(file);
        const d = {
          ...createDocument(file.name.replace(/\.pdf$/i, "")),
          format: "NOTIZ",
          notebook,
        };
        setDocs((prev) => [d, ...prev]);
        open(d);
        setNotice(
          "PDF als neue Notizkopie geöffnet. Bitte Darstellung mit dem Original vergleichen.",
        );
        return;
      }
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
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
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
        accept=".png,.jpg,.jpeg,.pnote,.odt,.ott,.fodt,.sxw,.stw,.txt,.html,.htm,.docx,.doc,.rtf,.pdf"
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
      {appearanceOpen && (
        <AppearanceSettings
          value={appearance}
          onChange={setAppearance}
          dark={dark}
          onTheme={() => setDark(!dark)}
          onClose={() => setAppearanceOpen(false)}
        />
      )}
      {managing && (
        <NotebookDetails
          key={managing.id}
          doc={managing}
          subjects={librarySubjects(docs)}
          onClose={() => setManaging(null)}
          onSave={(next) => {
            setDocs((prev) => prev.map((d) => (d.id === next.id ? next : d)));
            setManaging(null);
          }}
          onDuplicate={() => {
            try {
              const copy = duplicateNotebook(managing);
              setDocs((prev) => [copy, ...prev]);
              setManaging(null);
              setNotice("Notizbuch als unabhängige Kopie dupliziert.");
            } catch (e) {
              setNotice((e as Error).message);
            }
          }}
          onTrash={() => {
            setDocs((prev) =>
              prev.map((d) => (d.id === managing.id ? trashDocument(d) : d)),
            );
            setManaging(null);
            setNotice(
              "In den Papierkorb verschoben. Wiederherstellen ist jederzeit möglich.",
            );
          }}
          onRestore={() => {
            setDocs((prev) =>
              prev.map((d) => (d.id === managing.id ? restoreDocument(d) : d)),
            );
            setManaging(null);
            setNotice("Lokale Kopie wiederhergestellt.");
          }}
          onDelete={() => {
            if (
              window.confirm(
                `„${managing.title}“ endgültig aus der App löschen? Alle Seiten und getippter Text dieser lokalen Kopie werden entfernt. Eine importierte Originaldatei bleibt erhalten.`,
              )
            ) {
              setDocs((prev) => prev.filter((d) => d.id !== managing.id));
              setManaging(null);
              setNotice("Lokale Kopie endgültig gelöscht.");
            }
          }}
          onExport={() => {
            open(managing);
            setManaging(null);
            setModal("export");
          }}
        />
      )}
      {migration && (
        <SamsungImport
          onClose={() => setMigration(false)}
          onImport={async (imported) => {
            if (!storageReady || boot.error)
              throw new Error(
                boot.error || "Dokumentspeicher wird noch geöffnet.",
              );
            const next = [...imported, ...docs];
            await saveDocuments(next);
            setDocs(next);
            setMigration(false);
            setActive(null);
            setSection("notes");
            setSidebar(false);
            setNotice(
              `${imported.length} Notizen als neue lokale Kopien übernommen.`,
            );
          }}
        />
      )}
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
          <img className="app-logo" src="./icons/icon-192.png" alt="" />
          phone<span className="brand-light">office</span>
        </a>
        <button
          className="primary new-button"
          onClick={newNote}
          aria-label="Notizbuch im Menü erstellen"
        >
          <PenLine size={21} /> Neues Notizbuch
        </button>
        <div className="nav-label">DEINE NOTIZEN</div>
        <nav>
          {[
            ["notes", "Notizbücher", PenLine],
            ["favorites", "Favoriten", Star],
            ["trash", "Papierkorb", Trash2],
          ].map(([id, label, Icon]) => {
            const NavIcon = Icon as typeof PenLine;
            return (
              <button
                key={String(id)}
                className={section === id ? "nav-item active" : "nav-item"}
                onClick={() => {
                  setSection(String(id));
                  setSubjectFilter("");
                  setActive(null);
                  setSidebar(false);
                }}
              >
                <NavIcon size={20} />
                {String(label)}
                <span>
                  {
                    docs.filter((d) =>
                      id === "trash"
                        ? !!d.trashedAt
                        : !d.trashedAt &&
                          (id === "favorites" ? d.favorite : !!d.notebook),
                    ).length
                  }
                </span>
              </button>
            );
          })}
          <button
            className="nav-item"
            onClick={() => fileInput.current?.click()}
          >
            <Upload size={20} /> PDF / Notiz importieren
          </button>
        </nav>
        <div className="nav-label">OFFICE-ZUSATZ</div>
        <button
          className={section === "text" ? "nav-item active" : "nav-item"}
          onClick={() => {
            setSection("text");
            setSubjectFilter("");
            setActive(null);
            setSidebar(false);
          }}
        >
          <FileText size={20} /> Word & LibreOffice
        </button>
        <button className="nav-item office-new" onClick={() => newDoc()}>
          <Plus size={19} /> Neues Dokument
        </button>
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
          <button className="nav-item" onClick={() => setMigration(true)}>
            <Upload size={20} />
            Samsung Notes importieren
          </button>
          <p className="sidebar-version">
            Phone Office {version}
            <br />
            <span>Erstellt von Lyvt</span>
            <br />
            <span>
              {native
                ? Capacitor.getPlatform() === "ios"
                  ? "iPhone / iPad"
                  : "Android"
                : "Browser-App"}
            </span>
          </p>
          <button
            className="nav-item"
            onClick={() => {
              setAppearanceOpen(true);
              setSidebar(false);
            }}
          >
            <Palette size={22} /> App anpassen
          </button>
          <button className="nav-item" onClick={() => setModal("formats")}>
            <Settings2 size={18} /> Dateiformate
          </button>
          <button
            className="nav-item"
            onClick={() => {
              setAppInfoOpen(true);
              setSidebar(false);
            }}
          >
            <ShieldCheck size={18} /> Über Phone Office
          </button>
          <button className="nav-item" onClick={() => setDark(!dark)}>
            {dark ? <Sun size={22} /> : <Moon size={22} />}{" "}
            {dark ? "Hellmodus" : "Dunkelmodus"}
          </button>
        </div>
      </aside>
      <main inert={!storageReady && !boot.error}>
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
                <strong>Phone Office</strong>
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
          <NotesLibrary
            docs={docs}
            section={section}
            onSection={setSection}
            search={search}
            onSearch={setSearch}
            view={view}
            onView={setView}
            subject={subjectFilter}
            onSubject={setSubjectFilter}
            sort={librarySort}
            onSort={setLibrarySort}
            onNew={newNote}
            onNewOffice={() => newDoc()}
            onImport={() => fileInput.current?.click()}
            onSamsung={() => setMigration(true)}
            onOpen={open}
            onManage={setManaging}
            onFavorite={(d) =>
              setDocs((prev) =>
                prev.map((item) =>
                  item.id === d.id
                    ? { ...item, favorite: !item.favorite }
                    : item,
                ),
              )
            }
            saveStatus={saveStatus}
          />
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
                onExportPdf={() => void notePdfExport()}
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
      {appInfoOpen && (
        <Suspense fallback={<div role="status">App-Info wird geladen …</div>}>
          <AppInfo onClose={() => setAppInfoOpen(false)} />
        </Suspense>
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
                  Phone Office verarbeitet Dokumente lokal. Der Android-Build
                  verwendet denselben Editor wie die Web-Version. Die
                  Formatunterstützung hat folgende Grenzen.
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
