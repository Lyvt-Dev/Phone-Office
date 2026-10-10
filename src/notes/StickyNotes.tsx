import { useRef, useState, type PointerEvent } from "react";
import { X, Plus, Trash2, StickyNote as StickyIcon } from "lucide-react";
import { useDialog } from "./useDialog";
import {
  makeSticky,
  STICKY_COLORS,
  stickyLines,
  type StickyNote,
} from "./sticky";
export function StickyManager({
  notes,
  onSave,
  onDelete,
  onClose,
}: {
  notes: StickyNote[];
  onSave: (n: StickyNote) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const panel = useDialog(onClose),
    [selected, setSelected] = useState<StickyNote | undefined>(),
    [text, setText] = useState(""),
    [color, setColor] = useState<string>(STICKY_COLORS[0]),
    [width, setWidth] = useState(240),
    [error, setError] = useState("");
  const pick = (note?: StickyNote) => {
    setSelected(note);
    setText(note?.text || "");
    setColor(note?.color || STICKY_COLORS[0]);
    setWidth(note?.width || 240);
    setError("");
  };
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
        aria-labelledby="sticky-title"
        className="note-settings-panel sticky-manager"
      >
        <header>
          <div>
            <h2 id="sticky-title">
              <StickyIcon size={22} /> Haftnotizen
            </h2>
            <p>Erinnerungen auf dieser Seite · {notes.length}/30</p>
          </div>
          <button
            className="note-icon"
            aria-label="Haftnotizen schließen"
            onClick={onClose}
          >
            <X />
          </button>
        </header>
        <div className="sticky-list">
          <button className={!selected ? "active" : ""} onClick={() => pick()}>
            <Plus size={18} /> Neue Haftnotiz
          </button>
          {notes.map((n, i) => (
            <button
              key={n.id}
              aria-label={`Haftnotiz ${i + 1} bearbeiten`}
              aria-pressed={selected?.id === n.id}
              onClick={() => pick(n)}
            >
              <span style={{ background: n.color }} />
              {n.text.slice(0, 55)}
            </button>
          ))}
        </div>
        <label>
          Text
          <textarea
            aria-label="Haftnotiztext"
            maxLength={300}
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Deine Erinnerung …"
          />
        </label>
        <fieldset>
          <legend>Farbe</legend>
          <div className="sticky-swatches">
            {STICKY_COLORS.map((c) => (
              <button
                key={c}
                style={{ background: c }}
                aria-label={`Haftnotizfarbe ${c}`}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </fieldset>
        <label>
          Breite
          <select
            aria-label="Haftnotizbreite"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
          >
            <option value={180}>Klein</option>
            <option value={240}>Mittel</option>
            <option value={300}>Groß</option>
          </select>
        </label>
        {error && <p role="alert">{error}</p>}
        <button
          className="primary"
          disabled={!text.trim() || (!selected && notes.length >= 30)}
          onClick={() => {
            try {
              onSave(makeSticky(text, color, width, selected));
              onClose();
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          Haftnotiz speichern
        </button>
        {selected && (
          <button
            className="note-setting-action danger"
            onClick={() => {
              onDelete(selected.id);
              pick();
            }}
          >
            <Trash2 size={18} /> Haftnotiz löschen
          </button>
        )}
        <p className="setting-hint">
          Nach dem Schließen lässt sich die Haftnotiz auf dem Blatt ziehen.
          Wähle anschließend wieder deinen Stift. Rückgängig gilt auch für
          Haftnotizen.
        </p>
      </section>
    </div>
  );
}
export function StickyLayer({
  notes,
  interactive,
  onMove,
}: {
  notes: StickyNote[];
  interactive: boolean;
  onMove: (note: StickyNote) => void;
}) {
  const drag = useRef<{
      pointer: number;
      note: StickyNote;
      x: number;
      y: number;
      next: StickyNote;
    } | null>(null),
    [preview, setPreview] = useState<StickyNote | null>(null);
  function point(e: PointerEvent<SVGGElement>) {
    const matrix = e.currentTarget.ownerSVGElement?.getScreenCTM();
    return matrix
      ? new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse())
      : new DOMPoint(0, 0);
  }
  function finish(e: PointerEvent<SVGGElement>, cancel = false) {
    if (!interactive) return;
    e.stopPropagation();
    const current = drag.current;
    if (!current || current.pointer !== e.pointerId) return;
    drag.current = null;
    setPreview(null);
    if (
      !cancel &&
      (current.next.x !== current.note.x || current.next.y !== current.note.y)
    )
      onMove(current.next);
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  }
  return (
    <g
      className="sticky-note-layer"
      pointerEvents={interactive ? "auto" : "none"}
    >
      {notes.map((original, i) => {
        const n = preview?.id === original.id ? preview : original;
        return (
          <g
            key={n.id}
            data-sticky-id={n.id}
            className={interactive ? "sticky-draggable" : ""}
            transform={`translate(${n.x} ${n.y})`}
            aria-label={`Haftnotiz ${i + 1}`}
            onPointerDown={(e) => {
              if (!interactive) return;
              e.stopPropagation();
              e.preventDefault();
              if (drag.current || (e.pointerType === "mouse" && e.button !== 0))
                return;
              const p = point(e);
              drag.current = {
                pointer: e.pointerId,
                note: original,
                x: p.x,
                y: p.y,
                next: original,
              };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!interactive) return;
              e.stopPropagation();
              const cur = drag.current;
              if (!cur || cur.pointer !== e.pointerId) return;
              e.preventDefault();
              const p = point(e);
              cur.next = {
                ...cur.note,
                x: Math.max(
                  0,
                  Math.min(800 - cur.note.width, cur.note.x + p.x - cur.x),
                ),
                y: Math.max(
                  0,
                  Math.min(1100 - cur.note.height, cur.note.y + p.y - cur.y),
                ),
              };
              setPreview(cur.next);
            }}
            onPointerUp={(e) => finish(e)}
            onPointerCancel={(e) => finish(e, true)}
            onLostPointerCapture={(e) => finish(e, true)}
          >
            <rect
              width={n.width}
              height={n.height}
              rx={8}
              fill={n.color}
              stroke={interactive ? "#756b37" : "none"}
              strokeDasharray={interactive ? "5 4" : undefined}
            />
            <path d={`M 0 28 H ${n.width}`} stroke="#332f20" opacity={0.12} />
            <text
              fill="#332f20"
              fontFamily="sans-serif"
              fontSize={18}
              pointerEvents="none"
            >
              {stickyLines(n.text, n.width).map((line, j) => (
                <tspan key={j} x={14} y={52 + j * 23}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </g>
  );
}
