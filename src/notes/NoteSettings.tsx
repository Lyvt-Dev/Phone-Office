import { version } from "../../package.json";
import { useEffect, useRef } from "react";
import {
  X,
  Palette,
  SlidersHorizontal,
  BookOpen,
  FileText,
  ZoomIn,
  Hand,
  Download,
  Eye,
  Moon,
  FileOutput,
} from "lucide-react";
import type {
  Notebook,
  NotePage,
  NotePreferences,
  Paper,
  PenStyle,
} from "./model";
interface Props {
  mode?: "page" | "pen" | "marker" | "eraser";
  notebook: Notebook;
  page: NotePage;
  preferences: NotePreferences;
  dark: boolean;
  onPreferences: (p: Partial<NotePreferences>) => void;
  onSubject: (s: string) => void;
  onPaper: (p: Paper) => void;
  onClose: () => void;
  onExportPage: () => void;
  onPreview: () => void;
  onMoreExports: () => void;
  onExportPdf: () => void;
  onTheme: () => void;
}
export function NoteSettings(p: Props) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const items = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input,select",
        ) || [],
      );
    items()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        p.onClose();
      }
      if (e.key === "Tab") {
        const list = items(),
          first = list[0],
          last = list.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", key);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  const mode = p.mode || "page";
  const title =
    mode === "pen"
      ? "Stifteinstellungen"
      : mode === "marker"
        ? "Textmarkereinstellungen"
        : mode === "eraser"
          ? "Radiereinstellungen"
          : "Notizeinstellungen";
  return (
    <div
      className="note-settings-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) p.onClose();
      }}
    >
      <section
        ref={panel}
        className="note-settings-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-settings-title"
      >
        <header>
          <div>
            <h2 id="note-settings-title">{title}</h2>
            <p>
              {mode === "page"
                ? "Papier, Ansicht und Notizbuch"
                : "Optionen für dein gewähltes Werkzeug"}
            </p>
          </div>
          <button
            aria-label={`${title} schließen`}
            className="note-icon"
            onClick={p.onClose}
          >
            <X aria-hidden="true" />
          </button>
        </header>
        {(mode === "pen" || mode === "marker") && (
          <fieldset>
            <legend>
              <Palette aria-hidden="true" />
              Stift
            </legend>
            {mode === "pen" && (
              <>
                <label>
                  Stiftart
                  <select
                    aria-label="Stiftart in Einstellungen"
                    value={p.preferences.penStyle || "fountain"}
                    onChange={(e) =>
                      p.onPreferences({ penStyle: e.target.value as PenStyle })
                    }
                  >
                    <option value="ballpoint">Kugelschreiber</option>
                    <option value="fountain">Füller</option>
                    <option value="pencil">Bleistift</option>
                  </select>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={p.preferences.holdStraight !== false}
                    onChange={(e) =>
                      p.onPreferences({ holdStraight: e.target.checked })
                    }
                  />
                  Halten zum Begradigen (650 ms)
                </label>
              </>
            )}
            <div className="ink-swatches" aria-label="Stiftfarben">
              {[
                ["#26322f", "Schwarz"],
                ["#2563eb", "Blau"],
                ["#dc2626", "Rot"],
                ["#16a34a", "Grün"],
                ["#9333ea", "Violett"],
                ["#facc15", "Gelb"],
              ].map(([color, name]) => (
                <button
                  key={color}
                  aria-label={name}
                  aria-pressed={p.preferences.color === color}
                  style={{ "--swatch": color } as React.CSSProperties}
                  onClick={() => p.onPreferences({ color })}
                >
                  <span />
                </button>
              ))}
            </div>
            <label>
              Eigene Farbe
              <input
                type="color"
                aria-label="Stiftfarbe"
                value={p.preferences.color}
                onChange={(e) => p.onPreferences({ color: e.target.value })}
              />
            </label>
            <label>
              <SlidersHorizontal aria-hidden="true" />
              Strichstärke
              <select
                aria-label="Strichstärke"
                value={p.preferences.width}
                onChange={(e) => p.onPreferences({ width: +e.target.value })}
              >
                <option value={2}>Fein</option>
                <option value={3}>Normal</option>
                <option value={6}>Dick</option>
              </select>
            </label>
          </fieldset>
        )}
        {mode === "eraser" && (
          <fieldset>
            <legend>Radierer</legend>
            <label>
              Radiermodus
              <select
                aria-label="Radiermodus"
                value={p.preferences.eraserMode || "stroke"}
                onChange={(e) =>
                  p.onPreferences({
                    eraserMode: e.target.value as "stroke" | "partial",
                  })
                }
              >
                <option value="stroke">Ganze Striche</option>
                <option value="partial">Nur berührte Stellen</option>
              </select>
            </label>
            <label>
              Radierergröße
              <select
                aria-label="Radierergröße"
                value={p.preferences.eraserSize || 16}
                onChange={(e) =>
                  p.onPreferences({ eraserSize: +e.target.value })
                }
              >
                <option value={8}>Klein</option>
                <option value={16}>Mittel</option>
                <option value={32}>Groß</option>
              </select>
            </label>
            <p>
              Den Stiftknopf beim Berühren des Blatts gedrückt halten:
              vorübergehend radieren. Unterstützung hängt vom Gerät und dessen
              Stiftsignalen ab.
            </p>
          </fieldset>
        )}
        {mode === "page" && (
          <>
            <fieldset>
              <legend>
                <FileText aria-hidden="true" />
                Diese Seite
              </legend>
              <label>
                Papier
                <select
                  aria-label="Notizpapier"
                  disabled={!!p.page.background}
                  value={p.page.paper}
                  onChange={(e) => p.onPaper(e.target.value as Paper)}
                >
                  <option value="grid">Kariert</option>
                  <option value="ruled">Liniert</option>
                  <option value="plain">Leer</option>
                </select>
              </label>
              {p.page.background && (
                <p>
                  Der PDF-Hintergrund bleibt unverändert. Papierwahl gilt für
                  leere Notizseiten.
                </p>
              )}
              <label>
                <ZoomIn aria-hidden="true" />
                Zoom
                <select
                  aria-label="Notizzoom"
                  value={p.preferences.zoom}
                  onChange={(e) => p.onPreferences({ zoom: +e.target.value })}
                >
                  {[
                    ...new Set([
                      50,
                      80,
                      100,
                      125,
                      150,
                      200,
                      300,
                      p.preferences.zoom,
                    ]),
                  ]
                    .sort((a, b) => a - b)
                    .map((n) => (
                      <option key={n} value={n}>
                        {n}%
                      </option>
                    ))}
                </select>
              </label>
            </fieldset>
            <fieldset>
              <legend>
                <Hand aria-hidden="true" />
                Eingabe
              </legend>
              <label className="note-toggle">
                <span>Mit Finger zeichnen</span>
                <input
                  type="checkbox"
                  checked={p.preferences.finger}
                  onChange={(e) =>
                    p.onPreferences({ finger: e.target.checked })
                  }
                />
              </label>
              <p>
                Zwei Finger zoomen und verschieben die Seite. Ausgeschaltet
                verschiebt ein Finger die Seite. Der Stift schreibt weiterhin.
                Der Radierer verwendet den gewählten Modus.
              </p>
            </fieldset>
            <fieldset>
              <legend>
                <BookOpen aria-hidden="true" />
                Notizbuch
              </legend>
              <label>
                Schulfach
                <input
                  aria-label="Schulfach"
                  placeholder="Fach eintragen"
                  maxLength={200}
                  value={p.notebook.subject}
                  onChange={(e) => p.onSubject(e.target.value)}
                />
              </label>
              <button className="note-setting-action" onClick={p.onTheme}>
                <Moon aria-hidden="true" />
                {p.dark ? "Hellmodus einschalten" : "Dunkelmodus einschalten"}
              </button>
            </fieldset>
            <fieldset>
              <legend>
                <FileOutput aria-hidden="true" />
                Ansicht und Ausgabe
              </legend>
              <button
                className="note-setting-action"
                onClick={() => {
                  p.onClose();
                  p.onPreview();
                }}
              >
                <Eye aria-hidden="true" />
                Vorschau
              </button>
              <button
                className="note-setting-action"
                onClick={() => {
                  p.onClose();
                  p.onExportPage();
                }}
              >
                <Download aria-hidden="true" />
                Seite als SVG exportieren
              </button>
              <button
                className="note-setting-action"
                onClick={() => {
                  p.onClose();
                  p.onExportPdf();
                }}
              >
                <FileOutput aria-hidden="true" />
                Handschriftseiten als PDF
              </button>
              <button
                className="note-setting-action"
                onClick={() => {
                  p.onClose();
                  p.onMoreExports();
                }}
              >
                <FileOutput aria-hidden="true" />
                Weitere Exportformate
              </button>
              <p>
                „Sichern“ speichert alle Seiten und Text als bearbeitbares
                Notizbuch. SVG enthält nur diese Seite. Keine
                Handschrifterkennung.
              </p>
            </fieldset>
          </>
        )}
        <p className="note-build-version">Phone Office {version}</p>
        <button className="primary note-settings-done" onClick={p.onClose}>
          Fertig
        </button>
      </section>
    </div>
  );
}
