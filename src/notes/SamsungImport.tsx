import { useRef, useState } from "react";
import {
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  FileOutput,
} from "lucide-react";
import type { OfficeDocument } from "../core/document";
import { prepareSamsungTransfer, type TransferItem } from "./transfer";
import { useDialog } from "./useDialog";
interface Props {
  onClose: () => void;
  onImport: (docs: OfficeDocument[]) => Promise<void>;
}
export function SamsungImport({ onClose, onImport }: Props) {
  const [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(""),
    [error, setError] = useState("");
  const [items, setItems] = useState<TransferItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const liveBusy = useRef(busy);
  liveBusy.current = busy;
  const panel = useDialog(() => {
    if (!liveBusy.current) onClose();
  });
  const picker = useRef<HTMLInputElement>(null);
  const documents = items
    .filter((i) => i.document && selected.has(i.document.id))
    .map((i) => i.document!);
  return (
    <div className="note-settings-backdrop">
      <section
        ref={panel}
        className="samsung-import-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="samsung-title"
      >
        <header>
          <div>
            <h2 id="samsung-title">Von Samsung Notes umziehen</h2>
            <p>Deine Notizen bleiben auf deinem Gerät.</p>
          </div>
          <button
            className="note-icon"
            aria-label="Samsung-Import schließen"
            disabled={busy}
            onClick={onClose}
          >
            <X />
          </button>
        </header>
        <ol className="migration-steps">
          <li>
            <strong>In Samsung Notes exportieren</strong>
            <p>
              Notizen auswählen und über „Als Datei speichern“ oder Teilen als{" "}
              <b>PDF</b> ausgeben. Die genaue Menübezeichnung hängt von deiner
              Samsung-Notes-Version ab.
            </p>
          </li>
          <li>
            <strong>PDF-Dateien auswählen</strong>
            <p>
              Mehrere Dateien gleichzeitig auswählen. ZIP-Dateien zuerst
              entpacken. Maximal 50 Dateien / 50 MB pro Übertragung; weitere
              Notizen in der nächsten Übertragung.
            </p>
          </li>
          <li>
            <strong>Prüfen und übernehmen</strong>
            <p>
              Jede Datei wird ein eigenes Notizbuch. Bestehende Dokumente und
              Originaldateien bleiben erhalten. PDF-Seiten können mit neuer
              Handschrift ergänzt werden.
            </p>
          </li>
        </ol>
        <div className="migration-limit">
          <AlertTriangle size={20} />
          <p>
            PDF erhält die sichtbaren Seiten, aber keine einzeln bearbeitbaren
            Samsung-Striche, Audioaufnahmen oder interaktiven Links. Direkter
            .sdoc/.sdocx-Import ist noch nicht zuverlässig unterstützt.
            .pnote-Sicherungen sind ebenfalls importierbar.
          </p>
        </div>
        <input
          ref={picker}
          type="file"
          multiple
          hidden
          accept=".pdf,.pnote,.sdoc,.sdocx,.zip"
          aria-label="Samsung-Notizen auswählen"
          onChange={async (e) => {
            const files = Array.from(e.target.files || []);
            if (!files.length) return;
            setBusy(true);
            setError("");
            setItems([]);
            try {
              const result = await prepareSamsungTransfer(files, (name, n) =>
                setProgress(`${n} / ${files.length} · ${name}`),
              );
              setItems(result);
              setSelected(
                new Set(
                  result.flatMap((i) => (i.document ? [i.document.id] : [])),
                ),
              );
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
              setProgress("");
              if (picker.current) picker.current.value = "";
            }
          }}
        />
        <button
          className="primary"
          disabled={busy}
          onClick={() => picker.current?.click()}
        >
          <Upload size={20} />
          {items.length ? "Andere Dateien auswählen" : "PDF-Dateien auswählen"}
        </button>
        {busy && (
          <p role="status">
            {progress || "Notizen werden lokal gespeichert …"}
          </p>
        )}
        {error && (
          <p role="alert" className="migration-error">
            {error}
          </p>
        )}
        {!!items.length && (
          <div className="migration-results">
            <h3>
              {items.filter((i) => i.document).length} vorbereitet ·{" "}
              {items.filter((i) => i.error).length} nicht importiert
            </h3>
            {items.map((item, i) => (
              <article key={i}>
                {item.document ? (
                  <label>
                    <input
                      type="checkbox"
                      aria-label={`${item.name} übernehmen`}
                      checked={selected.has(item.document.id)}
                      onChange={(e) => {
                        const next = new Set(selected);
                        if (e.target.checked) next.add(item.document!.id);
                        else next.delete(item.document!.id);
                        setSelected(next);
                      }}
                    />
                    <CheckCircle2 size={20} />
                    <span>
                      <strong>{item.name}</strong>
                      <small>
                        {item.document.notebook?.pages.length} Seiten
                        {item.warning ? ` · ${item.warning}` : ""}
                      </small>
                    </span>
                  </label>
                ) : (
                  <div>
                    <AlertTriangle size={20} />
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.error}</small>
                    </span>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
        <footer>
          <button className="secondary" disabled={busy} onClick={onClose}>
            Abbrechen
          </button>
          <button
            className="primary"
            disabled={busy || !documents.length}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await onImport(documents);
              } catch (e) {
                setError(
                  "Nicht übernommen: " +
                    (e as Error).message +
                    " Bitte Auswahl verkleinern.",
                );
                setBusy(false);
              }
            }}
          >
            <FileOutput size={20} />
            {documents.length} Notizen übernehmen
          </button>
        </footer>
      </section>
    </div>
  );
}
