import { useState } from "react";
import { X, Star, Copy, Trash2, RotateCcw, Download } from "lucide-react";
import type { OfficeDocument } from "../core/document";
import type { Paper } from "./model";
import { useDialog } from "./useDialog";
interface Props {
  doc: OfficeDocument;
  subjects: string[];
  onClose: () => void;
  onSave: (d: OfficeDocument) => void;
  onDuplicate: () => void;
  onTrash: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onExport: () => void;
}
export function NotebookDetails(p: Props) {
  const panel = useDialog(p.onClose),
    [title, setTitle] = useState(p.doc.title),
    [subject, setSubject] = useState(p.doc.notebook?.subject || ""),
    [color, setColor] = useState(p.doc.notebook?.coverColor || "#23634f"),
    [favorite, setFavorite] = useState(p.doc.favorite || false),
    [paper, setPaper] = useState<Paper>(
      p.doc.notebook?.pages[0].paper || "grid",
    );
  return (
    <div
      className="note-settings-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) p.onClose();
      }}
    >
      <section
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notebook-details-title"
        className="note-settings-panel notebook-details"
      >
        <header>
          <div>
            <h2 id="notebook-details-title">
              {p.doc.notebook ? "Notizbuch verwalten" : "Dokument verwalten"}
            </h2>
            <p>
              {p.doc.trashedAt
                ? "Im Papierkorb · bleibt bis zur endgültigen Löschung erhalten"
                : "Titel, Organisation und Sicherung"}
            </p>
          </div>
          <button
            className="note-icon"
            aria-label="Verwaltung schließen"
            onClick={p.onClose}
          >
            <X />
          </button>
        </header>
        {p.doc.trashedAt ? (
          <>
            <button className="primary" onClick={p.onRestore}>
              <RotateCcw /> Wiederherstellen
            </button>
            <button className="note-setting-action danger" onClick={p.onDelete}>
              <Trash2 /> Endgültig löschen
            </button>
            <p>
              Nur die lokale App-Kopie wird gelöscht. Eine importierte
              Originaldatei bleibt erhalten.
            </p>
          </>
        ) : (
          <>
            <label>
              Titel
              <input
                aria-label="Bibliothekstitel"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={500}
              />
            </label>
            {p.doc.notebook && (
              <>
                <label>
                  Ordner / Fach
                  <input
                    aria-label="Notizbuchordner"
                    list="notebook-subjects"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={200}
                    placeholder="Zum Beispiel dein Schulfach"
                  />
                </label>
                <datalist id="notebook-subjects">
                  {p.subjects.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                <fieldset>
                  <legend>Notizbuch-Cover</legend>
                  <div className="cover-swatches">
                    {[
                      "#23634f",
                      "#2563eb",
                      "#7c3aed",
                      "#b45309",
                      "#be185d",
                      "#334155",
                    ].map((c) => (
                      <button
                        key={c}
                        aria-label={`Cover ${c}`}
                        aria-pressed={color === c}
                        style={{ background: c }}
                        onClick={() => setColor(c)}
                      />
                    ))}
                  </div>
                  <label>
                    Eigene Coverfarbe
                    <input
                      type="color"
                      aria-label="Coverfarbe"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                    />
                  </label>
                </fieldset>
                <label>
                  Papier der ersten Seite
                  <select
                    aria-label="Notizbuchpapier"
                    value={paper}
                    disabled={!!p.doc.notebook.pages[0].background}
                    onChange={(e) => setPaper(e.target.value as Paper)}
                  >
                    <option value="grid">Kariert</option>
                    <option value="ruled">Liniert</option>
                    <option value="dots">Punktpapier</option>
                    <option value="plain">Leer</option>
                  </select>
                </label>
              </>
            )}
            <label className="note-toggle">
              <span>
                <Star size={18} /> Favorit
              </span>
              <input
                aria-label={
                  p.doc.notebook
                    ? "Notizbuch als Favorit"
                    : "Dokument als Favorit"
                }
                type="checkbox"
                checked={favorite}
                onChange={(e) => setFavorite(e.target.checked)}
              />
            </label>
            <button
              className="primary note-settings-done"
              disabled={!title.trim()}
              onClick={() =>
                p.onSave({
                  ...p.doc,
                  title: title.trim(),
                  favorite,
                  updatedAt: new Date().toISOString(),
                  ...(p.doc.notebook
                    ? {
                        notebook: {
                          ...p.doc.notebook,
                          subject: subject.trim(),
                          coverColor: color,
                          pages: p.doc.notebook.pages.map((pg, i) =>
                            i === 0 && !pg.background ? { ...pg, paper } : pg,
                          ),
                        },
                      }
                    : {}),
                })
              }
            >
              Änderungen speichern
            </button>
            <fieldset>
              <legend>Sicherung und Organisation</legend>
              <button className="note-setting-action" onClick={p.onExport}>
                <Download /> Sichern / Exportieren
              </button>
              {p.doc.notebook && (
                <button className="note-setting-action" onClick={p.onDuplicate}>
                  <Copy /> Notizbuch duplizieren
                </button>
              )}
              <button className="note-setting-action" onClick={p.onTrash}>
                <Trash2 /> In den Papierkorb
              </button>
            </fieldset>
          </>
        )}
      </section>
    </div>
  );
}
