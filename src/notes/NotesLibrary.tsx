import {
  BookOpen,
  PenLine,
  Upload,
  Plus,
  Search,
  Grid2X2,
  List,
  Star,
  MoreHorizontal,
  FileText,
  FolderOpen,
  ArrowRight,
  Trash2,
} from "lucide-react";
import {
  coverInk,
  libraryItems,
  librarySubjects,
  type LibrarySort,
} from "./library";
import { wordCount, type OfficeDocument } from "../core/document";
interface Props {
  docs: OfficeDocument[];
  section: string;
  onSection: (s: string) => void;
  search: string;
  onSearch: (s: string) => void;
  view: "grid" | "list";
  onView: (s: "grid" | "list") => void;
  subject: string;
  onSubject: (s: string) => void;
  sort: LibrarySort;
  onSort: (s: LibrarySort) => void;
  onNew: () => void;
  onNewOffice: () => void;
  onImport: () => void;
  onSamsung: () => void;
  onOpen: (d: OfficeDocument) => void;
  onManage: (d: OfficeDocument) => void;
  onFavorite: (d: OfficeDocument) => void;
  saveStatus: string;
}
export function NotesLibrary(p: Props) {
  const subjects = librarySubjects(p.docs),
    items = libraryItems(p.docs, p.section, p.search, p.subject, p.sort),
    live = p.docs.filter((d) => !d.trashedAt),
    office = p.section === "text";
  const heading =
    p.section === "trash"
      ? "Papierkorb"
      : p.section === "favorites"
        ? "Deine Favoriten"
        : office
          ? "Office-Dokumente"
          : "Deine Notizbücher";
  return (
    <div
      className={"dashboard notes-library " + (office ? "office-library" : "")}
    >
      <div className="intro">
        <div>
          <span className="library-eyebrow">
            {office ? "DER OFFICE-ZUSATZ" : "DEIN DIGITALER SCHREIBTISCH"}
          </span>
          <h1>{heading}</h1>
          <p>
            {office
              ? "Word, Writer und Textdateien zusätzlich bearbeiten."
              : "Handschrift, Arbeitsblätter und Ideen · lokal auf deinem Gerät"}
          </p>
        </div>
      </div>
      {p.section !== "trash" && (
        <section className="notes-start-actions">
          <button
            className="primary new-note-action"
            onClick={office ? p.onNewOffice : p.onNew}
          >
            {office ? <FileText /> : <PenLine />}
            {office ? "Neues Dokument" : "Neues Notizbuch"}
            <Plus size={18} />
          </button>
          <button className="secondary" onClick={p.onImport}>
            <Upload />
            {office ? "Dokument öffnen" : "PDF / Bild / Notiz öffnen"}
          </button>
          {!office && (
            <button className="library-migrate" onClick={p.onSamsung}>
              Samsung Notes übernehmen <ArrowRight size={16} />
            </button>
          )}
        </section>
      )}
      <div
        className="library-tabs"
        role="group"
        aria-label="Bibliothek filtern"
      >
        {[
          ["notes", "Notizbücher", live.filter((d) => d.notebook).length],
          ["favorites", "Favoriten", live.filter((d) => d.favorite).length],
          ["text", "Office-Dokumente", live.filter((d) => !d.notebook).length],
          ["trash", "Papierkorb", p.docs.filter((d) => d.trashedAt).length],
        ].map(([id, label, count]) => (
          <button
            key={id}
            aria-pressed={p.section === id}
            onClick={() => {
              p.onSection(String(id));
              p.onSubject("");
            }}
          >
            {id === "favorites" && <Star size={15} />} {label}
            <span>{count}</span>
          </button>
        ))}
      </div>
      {!office && p.section !== "trash" && subjects.length > 0 && (
        <div className="subject-shelf" aria-label="Notizbuchordner">
          <button aria-pressed={!p.subject} onClick={() => p.onSubject("")}>
            <FolderOpen size={17} /> Alle Ordner
          </button>
          {subjects.map((s) => (
            <button
              key={s}
              aria-pressed={p.subject === s}
              onClick={() => p.onSubject(s)}
            >
              <FolderOpen size={17} />
              {s}
            </button>
          ))}
        </div>
      )}
      <section className="documents-section">
        <div className="section-head">
          <h2>
            {items.length}{" "}
            {office
              ? items.length === 1
                ? "Dokument"
                : "Dokumente"
              : items.length === 1
                ? "Eintrag"
                : "Einträge"}
          </h2>
          <div className="document-controls">
            <label className="search">
              <Search size={18} />
              <input
                type="search"
                aria-label="Dokumente suchen"
                placeholder="Titel, Fach oder getippter Text"
                value={p.search}
                onChange={(e) => p.onSearch(e.target.value)}
              />
            </label>
            <label className="library-sort">
              <span>Sortieren</span>
              <select
                aria-label="Bibliothek sortieren"
                value={p.sort}
                onChange={(e) => p.onSort(e.target.value as LibrarySort)}
              >
                <option value="updated">Zuletzt bearbeitet</option>
                <option value="title">Titel A–Z</option>
              </select>
            </label>
            <div className="view-switch">
              <button
                aria-label="Kachelansicht"
                className={p.view === "grid" ? "chosen" : ""}
                onClick={() => p.onView("grid")}
              >
                <Grid2X2 size={18} />
              </button>
              <button
                aria-label="Listenansicht"
                className={p.view === "list" ? "chosen" : ""}
                onClick={() => p.onView("list")}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
        {items.length ? (
          <div className={"document-grid " + p.view}>
            {items.map((d) => (
              <article
                className={
                  "document-card " +
                  (d.notebook ? "notebook-card" : "office-card")
                }
                key={d.id}
              >
                <button
                  className="document-open"
                  onClick={() => (d.trashedAt ? p.onManage(d) : p.onOpen(d))}
                >
                  <div className="document-preview">
                    {d.notebook ? (
                      <>
                        <div
                          className={
                            "notebook-cover" +
                            (d.notebook.coverImage ? " has-cover-image" : "")
                          }
                          aria-hidden="true"
                          style={
                            {
                              "--cover": d.notebook.coverColor || "#23634f",
                              "--cover-ink": d.notebook.coverImage
                                ? "#ffffff"
                                : coverInk(d.notebook.coverColor || "#23634f"),
                            } as React.CSSProperties
                          }
                        >
                          {d.notebook.coverImage && (
                            <img
                              className="cover-photo"
                              src={d.notebook.coverImage}
                              alt=""
                              loading="lazy"
                              draggable={false}
                            />
                          )}
                          <span className="cover-spine" />
                          <BookOpen className="cover-emblem" />
                          <strong>{d.title}</strong>
                          <small>{d.notebook.subject || "Notizbuch"}</small>
                        </div>
                      </>
                    ) : (
                      <div className="mini-paper">
                        <FileText />
                        <h3>{d.title}</h3>
                      </div>
                    )}
                    <span className="format-tag">
                      {d.notebook ? "NOTIZBUCH" : d.format}
                    </span>
                  </div>
                  <div className="document-details">
                    <strong>{d.title}</strong>
                    {d.notebook?.subject && (
                      <span className="subject-label">
                        {d.notebook.subject}
                      </span>
                    )}
                    <small>
                      {d.notebook
                        ? `${d.notebook.pages.length} Notizseiten · `
                        : `${wordCount(d.html)} Wörter · `}
                      {new Date(d.updatedAt).toLocaleDateString("de-DE", {
                        day: "numeric",
                        month: "short",
                      })}
                    </small>
                  </div>
                </button>
                {!d.trashedAt && (
                  <button
                    className="library-favorite icon-button"
                    aria-label={`${d.title} als Favorit`}
                    aria-pressed={d.favorite === true}
                    onClick={() => p.onFavorite(d)}
                  >
                    <Star
                      size={20}
                      fill={d.favorite ? "currentColor" : "none"}
                    />
                  </button>
                )}
                <button
                  className="card-menu icon-button"
                  aria-label={`${d.title} verwalten`}
                  onClick={() => p.onManage(d)}
                >
                  <MoreHorizontal size={22} />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span>
              {p.section === "trash" ? (
                <Trash2 size={30} />
              ) : (
                <BookOpen size={30} />
              )}
            </span>
            <h3>
              {p.search
                ? "Noch kein Treffer"
                : p.section === "trash"
                  ? "Der Papierkorb ist leer"
                  : p.section === "favorites"
                    ? "Noch keine Favoriten"
                    : office
                      ? "Noch keine Dokumente"
                      : "Platz für deine ersten Notizen"}
            </h3>
            <p>
              {p.search
                ? "Suche in Titeln, Ordnern, Seitentiteln und getipptem Text. Handschrift wird noch nicht durchsucht."
                : p.section === "trash"
                  ? "Gelöschte App-Kopien lassen sich hier wiederherstellen."
                  : p.section === "favorites"
                    ? "Markiere ein Notizbuch mit dem Stern."
                    : office
                      ? "Office-Dateien bleiben als zusätzlicher Arbeitsbereich verfügbar."
                      : "Erstelle ein Notizbuch oder öffne dein PDF-Arbeitsblatt oder Bild."}
            </p>
          </div>
        )}
      </section>
      {!office && p.section !== "trash" && (
        <aside className="office-addon">
          <FileText size={22} />
          <div>
            <strong>Auch Word & LibreOffice</strong>
            <p>Deine Notizen zuerst. Office-Dateien als Zusatz.</p>
          </div>
          <button className="text-button" onClick={p.onNewOffice}>
            Neues Dokument
          </button>
          <button
            className="text-button"
            onClick={() => {
              p.onSection("text");
              p.onSubject("");
            }}
          >
            Office öffnen <ArrowRight size={16} />
          </button>
        </aside>
      )}
      {office && (
        <aside className="office-addon">
          <BookOpen size={22} />
          <div>
            <strong>Zurück zu deinen Notizen</strong>
            <p>Notizbücher bleiben dein Hauptarbeitsbereich.</p>
          </div>
          <button className="text-button" onClick={p.onNew}>
            Neues Notizbuch
          </button>
          <button className="text-button" onClick={() => p.onSection("notes")}>
            Notizbücher öffnen <ArrowRight size={16} />
          </button>
        </aside>
      )}
      <footer>
        <span>{p.saveStatus}</span>
        <span>Notizen bleiben auf deinem Gerät.</span>
      </footer>
    </div>
  );
}
