import { X } from "lucide-react";
import { version } from "../../package.json";
import notices from "../../public/third-party-notices.txt?raw";
import { useDialog } from "../notes/useDialog";
export function AppInfo({ onClose }: { onClose: () => void }) {
  const panel = useDialog(onClose);
  return (
    <div
      className="note-settings-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={panel}
        className="note-settings-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-info-title"
      >
        <header>
          <div>
            <h2 id="app-info-title">Über Phone Office</h2>
            <p>Version {version} · Erstellt von Lyvt</p>
          </div>
          <button
            className="note-icon"
            aria-label="App-Info schließen"
            onClick={onClose}
          >
            <X />
          </button>
        </header>
        <h3>Deine Notizen und deine Daten</h3>
        <p>
          Notizbücher, Dokumente und Einstellungen werden im lokalen App-
          beziehungsweise Browserspeicher gespeichert. Phone Office hat keine
          Konten, Werbung, Analyse-SDKs oder automatische
          Cloud-Synchronisierung.
        </p>
        <p>
          Dateien werden erst nach deiner Auswahl geöffnet. Importierte
          Originaldateien werden nicht überschrieben. Beim Teilen oder Speichern
          bestimmst du die Ziel-App oder den Speicherort. Deren
          Datenschutzbedingungen gelten anschließend ebenfalls.
        </p>
        <p>
          Geräte- und Browserfunktionen, etwa Backups und Rechtschreibprüfung,
          können eigene Dienste nutzen. Bei einer gehosteten Webversion kann der
          Hosting-Anbieter Zugriffsdaten verarbeiten.
        </p>
        <h3>Sichere deine Arbeit</h3>
        <p>
          Exportiere wichtige Notizbücher regelmäßig als .pnote. Das Löschen der
          App, das Zurücksetzen des Browsers oder ein Geräteverlust kann lokale
          Daten entfernen. Ein PDF ist eine Ansichtskopie; .pnote bewahrt die
          bearbeitbaren Notizseiten.
        </p>
        <h3>Unterstützung</h3>
        <p>
          Probleme kannst du im Projekt melden. Poste keine privaten Notizen,
          Passwörter oder vertraulichen Dateien in öffentliche Meldungen.
        </p>
        <a
          href="https://github.com/Lyvt-Dev/Phone-Office/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          Projekt und Fehlermeldungen öffnen
        </a>
        <details>
          <summary>Drittanbieter und Open-Source-Lizenzen</summary>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              maxHeight: "40vh",
              overflow: "auto",
              fontSize: "0.8rem",
            }}
          >
            {notices}
          </pre>
        </details>
      </section>
    </div>
  );
}
