import { useState } from "react";
import {
  Bookmark,
  Copy,
  ArrowUp,
  ArrowDown,
  Trash2,
  X,
  Plus,
} from "lucide-react";
import { pageSvg, newPage, type Notebook } from "./model";
import { duplicatePage } from "./operations";
import { useDialog } from "./useDialog";
interface Props {
  notebook: Notebook;
  current: string;
  onChange: (n: Notebook, id: string) => void;
  onClose: () => void;
  onNotice: (s: string) => void;
}
export function PageOverview({
  notebook,
  current,
  onChange,
  onClose,
  onNotice,
}: Props) {
  const [bookmarks, setBookmarks] = useState(false);
  const [search, setSearch] = useState("");
  const panel = useDialog(onClose);
  return (
    <div
      className="note-settings-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="page-overview-panel"
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pages-title"
      >
        <header>
          <div>
            <h2 id="pages-title">Seitenübersicht</h2>
            <p>{notebook.pages.length} Seiten · Antippen zum Öffnen</p>
          </div>
          <button
            className="note-icon"
            aria-label="Seitenübersicht schließen"
            onClick={onClose}
          >
            <X />
          </button>
        </header>
        <div className="page-overview-filters">
          <button
            aria-pressed={bookmarks}
            onClick={() => setBookmarks(!bookmarks)}
          >
            <Bookmark size={20} />
            {bookmarks ? "Alle Seiten zeigen" : "Nur Lesezeichen"}
          </button>
          <button
            disabled={notebook.pages.length >= 50}
            onClick={() => {
              const p = newPage(
                notebook.pages.find((p) => p.id === current)?.paper,
              );
              onChange({ ...notebook, pages: [...notebook.pages, p] }, p.id);
              onClose();
            }}
          >
            <Plus size={20} />
            Neue Seite
          </button>
        </div>
        <label className="page-search">
          Seiten suchen
          <input
            aria-label="Seitentitel suchen"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nach Seitentitel suchen"
          />
        </label>
        <div className="page-overview-grid">
          {notebook.pages.map(
            (p, i) =>
              (!bookmarks || p.bookmarked) &&
              (!search ||
                (p.title || `Seite ${i + 1}`)
                  .toLocaleLowerCase()
                  .includes(search.toLocaleLowerCase())) && (
                <article
                  key={p.id}
                  className={p.id === current ? "current" : ""}
                >
                  <button
                    className="page-thumbnail"
                    aria-label={`Seite ${i + 1} öffnen`}
                    onClick={() => {
                      onChange(notebook, p.id);
                      onClose();
                    }}
                    dangerouslySetInnerHTML={{ __html: pageSvg(p) }}
                  />
                  <label>
                    Seite {i + 1}
                    <input
                      aria-label={`Titel Seite ${i + 1}`}
                      value={p.title || ""}
                      placeholder="Seitentitel"
                      maxLength={200}
                      onChange={(e) =>
                        onChange(
                          {
                            ...notebook,
                            pages: notebook.pages.map((q) =>
                              q.id === p.id
                                ? { ...q, title: e.target.value }
                                : q,
                            ),
                          },
                          current,
                        )
                      }
                    />
                  </label>
                  <div className="page-thumbnail-actions">
                    <button
                      className="note-icon"
                      aria-label={`Lesezeichen Seite ${i + 1}`}
                      aria-pressed={!!p.bookmarked}
                      onClick={() =>
                        onChange(
                          {
                            ...notebook,
                            pages: notebook.pages.map((q) =>
                              q.id === p.id
                                ? { ...q, bookmarked: !q.bookmarked }
                                : q,
                            ),
                          },
                          current,
                        )
                      }
                    >
                      <Bookmark />
                    </button>
                    <button
                      className="note-icon"
                      aria-label={`Seite ${i + 1} duplizieren`}
                      disabled={notebook.pages.length >= 50}
                      onClick={() => {
                        try {
                          const n = duplicatePage(notebook, p.id);
                          onChange(n, current);
                        } catch (e) {
                          onNotice((e as Error).message);
                        }
                      }}
                    >
                      <Copy />
                    </button>
                    {[
                      [-1, ArrowUp, "nach vorne"],
                      [1, ArrowDown, "nach hinten"],
                    ].map(([delta, Icon, label]) => {
                      const d = delta as number,
                        I = Icon as typeof ArrowUp;
                      return (
                        <button
                          key={d}
                          className="note-icon"
                          aria-label={`Seite ${i + 1} ${label}`}
                          disabled={i + d < 0 || i + d >= notebook.pages.length}
                          onClick={() => {
                            const pages = [...notebook.pages];
                            [pages[i], pages[i + d]] = [pages[i + d], pages[i]];
                            onChange({ ...notebook, pages }, current);
                          }}
                        >
                          <I />
                        </button>
                      );
                    })}
                    <button
                      className="note-icon"
                      aria-label={`Seite ${i + 1} löschen`}
                      disabled={notebook.pages.length === 1}
                      onClick={() => {
                        if (
                          !window.confirm(
                            `Seite ${i + 1} mit allen Strichen löschen? Dies lässt sich nicht rückgängig machen.`,
                          )
                        )
                          return;
                        const pages = notebook.pages.filter(
                          (q) => q.id !== p.id,
                        );
                        onChange(
                          { ...notebook, pages },
                          p.id === current
                            ? pages[Math.min(i, pages.length - 1)].id
                            : current,
                        );
                      }}
                    >
                      <Trash2 />
                    </button>
                  </div>
                </article>
              ),
          )}
        </div>
        {bookmarks && !notebook.pages.some((p) => p.bookmarked) && (
          <p>
            Noch keine Lesezeichen. Markiere wichtige Seiten mit dem
            Lesezeichen-Symbol.
          </p>
        )}
      </section>
    </div>
  );
}
