import { X, Palette, RotateCcw } from "lucide-react";
import { useDialog } from "../notes/useDialog";
import { accents, defaultAppearance, type Appearance } from "./appearance";
export function AppearanceSettings({
  value,
  onChange,
  dark,
  onTheme,
  onClose,
}: {
  value: Appearance;
  onChange: (p: Appearance) => void;
  dark: boolean;
  onTheme: () => void;
  onClose: () => void;
}) {
  const panel = useDialog(onClose);
  const update = (p: Partial<Appearance>) => onChange({ ...value, ...p });
  return (
    <div
      className="note-settings-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="appearance-title"
        className="note-settings-panel appearance-panel"
      >
        <header>
          <div>
            <h2 id="appearance-title">
              <Palette size={22} /> Dein Arbeitsbereich
            </h2>
            <p>Live-Vorschau · lokal auf diesem Gerät</p>
          </div>
          <button
            className="note-icon"
            aria-label="Anpassungen schließen"
            onClick={onClose}
          >
            <X />
          </button>
        </header>
        <fieldset>
          <legend>Akzentfarbe</legend>
          <div className="appearance-accents">
            {Object.entries(accents).map(([id, a]) => (
              <button
                key={id}
                aria-label={`Akzent ${a.name}`}
                aria-pressed={value.accent === id}
                onClick={() => update({ accent: id as Appearance["accent"] })}
              >
                <span style={{ background: a.color }} />
                {a.name}
              </button>
            ))}
          </div>
        </fieldset>
        <label>
          Schrift der Oberfläche
          <select
            aria-label="Oberflächenschrift"
            value={value.font}
            onChange={(e) =>
              update({ font: e.target.value as Appearance["font"] })
            }
          >
            <option value="manrope">Manrope · modern</option>
            <option value="system">Geräteschrift</option>
            <option value="serif">Serif · klassisch</option>
          </select>
        </label>
        <label>
          Größe der Oberfläche
          <select
            aria-label="Oberflächenschriftgröße"
            value={value.size}
            onChange={(e) =>
              update({ size: Number(e.target.value) as Appearance["size"] })
            }
          >
            <option value={100}>Standard</option>
            <option value={110}>Größer · 110 %</option>
            <option value={120}>Groß · 120 %</option>
          </select>
        </label>
        <label>
          Bibliotheksansicht
          <select
            aria-label="Bibliotheksdichte"
            value={value.density}
            onChange={(e) =>
              update({ density: e.target.value as Appearance["density"] })
            }
          >
            <option value="comfortable">Großzügig</option>
            <option value="compact">Kompakt</option>
          </select>
        </label>
        <label>
          Hintergrund im Hellmodus
          <select
            aria-label="Arbeitsbereich-Hintergrund"
            value={value.workspace}
            onChange={(e) =>
              update({ workspace: e.target.value as Appearance["workspace"] })
            }
          >
            <option value="neutral">Neutral</option>
            <option value="warm">Warm · Papier</option>
            <option value="cool">Kühl · Himmel</option>
          </select>
        </label>
        <label>
          Papier für neue Notizbücher
          <select
            aria-label="Standardpapier"
            value={value.defaultPaper}
            onChange={(e) =>
              update({
                defaultPaper: e.target.value as Appearance["defaultPaper"],
              })
            }
          >
            <option value="grid">Kariert</option>
            <option value="ruled">Liniert</option>
            <option value="dots">Punktpapier</option>
            <option value="plain">Leer</option>
          </select>
        </label>
        <label className="note-toggle">
          <span>Dunkelmodus</span>
          <input
            type="checkbox"
            aria-label="Anpassung Dunkelmodus"
            checked={dark}
            onChange={onTheme}
          />
        </label>
        <button
          className="note-setting-action"
          onClick={() => onChange({ ...defaultAppearance })}
        >
          <RotateCcw size={18} /> Gestaltung zurücksetzen
        </button>
        <p className="setting-hint">
          Diese Einstellungen ändern die Oberfläche. Dokument-Schriften und
          vorhandene Papierarten bleiben erhalten. Neue Notizbücher erhalten
          deine Akzentfarbe als Cover.
        </p>
        <button className="primary" onClick={onClose}>
          Fertig
        </button>
      </section>
    </div>
  );
}
