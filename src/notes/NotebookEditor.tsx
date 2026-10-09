import { memo, useRef, useState, type PointerEvent } from "react";
import {
  PenLine,
  Highlighter,
  Eraser,
  Undo2,
  Redo2,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { NoteSettings } from "./NoteSettings";
import {
  newPage,
  defaultNotePreferences,
  type NotePreferences,
  inkPoint,
  strokePath,
  touchesStroke,
  PAGE_WIDTH,
  PAGE_HEIGHT,
  type Notebook,
  type InkStroke,
  type NotePage,
  type Paper,
} from "./model";
interface Props {
  notebook: Notebook;
  onChange: (n: Notebook) => void;
  onExportPage: (p: NotePage) => void;
  onNotice: (s: string) => void;
  saveStatus: string;
  dark: boolean;
  onTheme: () => void;
  onPreview: () => void;
  onMoreExports: () => void;
}
export function NotebookEditor({
  notebook,
  onChange,
  onExportPage,
  onNotice,
  saveStatus,
  dark,
  onTheme,
  onPreview,
  onMoreExports,
}: Props) {
  const [index, setIndex] = useState(0),
    [tool, setTool] = useState<"pen" | "marker" | "eraser">("pen");
  const prefs = notebook.preferences || defaultNotePreferences;
  const { color, width, finger, zoom } = prefs;
  const [settings, setSettings] = useState(false);
  const updatePreferences = (change: Partial<NotePreferences>) =>
    onChange({ ...notebook, preferences: { ...prefs, ...change } });
  const [erasedPage, setErasedPage] = useState<NotePage | null>(null);
  const [draft, setDraft] = useState<InkStroke | null>(null);
  const [past, setPast] = useState<NotePage[]>([]),
    [future, setFuture] = useState<NotePage[]>([]);
  const pending = useRef<{
    pointer: number;
    stroke: InkStroke | null;
    page: NotePage;
    before: NotePage;
    erase: boolean;
  } | null>(null);
  const touch = useRef<{ pointer: number; x: number; y: number } | null>(null),
    scroller = useRef<HTMLDivElement>(null);
  const page = notebook.pages[Math.min(index, notebook.pages.length - 1)];
  function commit(next: NotePage) {
    setPast((prev) => [...prev.slice(-29), page]);
    setFuture([]);
    onChange({
      ...notebook,
      pages: notebook.pages.map((p) => (p.id === page.id ? next : p)),
    });
  }
  function position(
    e: PointerEvent<SVGSVGElement>,
    ev: globalThis.PointerEvent = e.nativeEvent,
  ) {
    const matrix = e.currentTarget.getScreenCTM();
    if (!matrix) return inkPoint(0, 0, ev.pressure);
    const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(
      matrix.inverse(),
    );
    return inkPoint(p.x, p.y, ev.pointerType === "pen" ? ev.pressure : 0.5);
  }
  function capture(e: PointerEvent<SVGSVGElement>) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (error) {
      // A cancelled/system-released pointer (or synthetic test input) is no longer capturable.
      if (!(error instanceof DOMException && error.name === "NotFoundError"))
        throw error;
    }
  }
  function down(e: PointerEvent<SVGSVGElement>) {
    if (pending.current) return; // Ignore palms and other pointers while a stroke is active.
    if (e.pointerType === "touch" && !finger) {
      touch.current = { pointer: e.pointerId, x: e.clientX, y: e.clientY };
      capture(e);
      return;
    }
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    touch.current = null;
    if (
      page.strokes.length >= 2000 ||
      notebook.pages.reduce(
        (sum, p) => sum + p.strokes.reduce((a, s) => a + s.points.length, 0),
        0,
      ) >= 197000
    ) {
      onNotice(
        "Notizgrenze erreicht. Bitte sichern und ein weiteres Notizbuch anlegen.",
      );
      return;
    }
    const erase = tool === "eraser" || e.button === 5 || (e.buttons & 32) !== 0;
    const stroke: InkStroke | null = erase
      ? null
      : {
          id: crypto.randomUUID(),
          color,
          width: tool === "marker" ? width * 4 : width,
          tool: tool === "marker" ? "marker" : "pen",
          points: [position(e)],
        };
    pending.current = {
      pointer: e.pointerId,
      stroke,
      page,
      before: page,
      erase,
    };
    capture(e);
    setDraft(stroke);
    if (erase) eraseAt(position(e));
  }
  function eraseAt(p: ReturnType<typeof inkPoint>) {
    const current = pending.current!;
    current.page = {
      ...current.page,
      strokes: current.page.strokes.filter((s) => !touchesStroke(s, p)),
    };
    setErasedPage(current.page);
  }
  function move(e: PointerEvent<SVGSVGElement>) {
    const cur = pending.current;
    if (!cur) {
      if (touch.current?.pointer === e.pointerId) {
        scroller.current?.scrollBy(
          touch.current.x - e.clientX,
          touch.current.y - e.clientY,
        );
        touch.current.x = e.clientX;
        touch.current.y = e.clientY;
      }
      return;
    }
    if (cur.pointer !== e.pointerId) return;
    e.preventDefault();
    const samples = e.nativeEvent.getCoalescedEvents?.() || [];
    for (const ev of samples.length ? samples : [e.nativeEvent]) {
      const p = position(e, ev);
      if (cur.erase) eraseAt(p);
      else if (cur.stroke && cur.stroke.points.length < 3000) {
        const last = cur.stroke.points.at(-1)!;
        if (Math.hypot(p.x - last.x, p.y - last.y) > 0.5)
          cur.stroke = { ...cur.stroke, points: [...cur.stroke.points, p] };
      }
    }
    if (cur.stroke) setDraft(cur.stroke);
  }
  function end(e: PointerEvent<SVGSVGElement>, cancel = false) {
    if (touch.current?.pointer === e.pointerId) touch.current = null;
    const cur = pending.current;
    if (!cur || cur.pointer !== e.pointerId) return;
    pending.current = null;
    setDraft(null);
    setErasedPage(null);
    if (cancel) {
      onChange({
        ...notebook,
        pages: notebook.pages.map((p) => (p.id === page.id ? cur.before : p)),
      });
      return;
    }
    const next = cur.stroke
      ? { ...cur.page, strokes: [...cur.page.strokes, cur.stroke] }
      : cur.page;
    setPast((prev) => [...prev.slice(-29), cur.before]);
    setFuture([]);
    onChange({
      ...notebook,
      pages: notebook.pages.map((p) => (p.id === page.id ? next : p)),
    });
  }
  function history(undo: boolean) {
    const stack = undo ? past : future,
      target = stack.at(-1);
    if (!target) return;
    if (undo) {
      setPast(past.slice(0, -1));
      setFuture([...future, page]);
    } else {
      setFuture(future.slice(0, -1));
      setPast([...past, page]);
    }
    onChange({
      ...notebook,
      pages: notebook.pages.map((p) => (p.id === page.id ? target : p)),
    });
  }
  return (
    <section className="notebook-editor" aria-label="Handschrift-Notizbuch">
      <div className="note-commandbar">
        <div
          className="ink-toolbar"
          role="toolbar"
          aria-label="Schreibwerkzeuge"
        >
          {(["pen", "marker", "eraser"] as const).map((t, i) => {
            const Icon = [PenLine, Highlighter, Eraser][i];
            const label = ["Stift", "Textmarker", "Radierer"][i];
            return (
              <button
                key={t}
                className="note-icon"
                aria-label={label}
                title={label}
                aria-pressed={tool === t}
                onClick={() => setTool(t)}
              >
                <Icon aria-hidden="true" />
                {t !== "eraser" && (
                  <i
                    className="ink-color-dot"
                    aria-hidden="true"
                    style={{ background: color }}
                  />
                )}
                <span>{label}</span>
              </button>
            );
          })}
          <span className="ink-tool-divider" />
          <button
            className="note-icon"
            aria-label="Strich rückgängig"
            title="Rückgängig"
            disabled={!past.length}
            onClick={() => history(true)}
          >
            <Undo2 aria-hidden="true" />
          </button>
          <button
            className="note-icon"
            aria-label="Strich wiederholen"
            title="Wiederholen"
            disabled={!future.length}
            onClick={() => history(false)}
          >
            <Redo2 aria-hidden="true" />
          </button>
          <button
            className="note-icon ink-settings-trigger"
            aria-label="Notizeinstellungen"
            title="Notizeinstellungen"
            onClick={() => setSettings(true)}
          >
            <Settings aria-hidden="true" />
            <span>Einstellungen</span>
          </button>
        </div>
        <div className="note-pages" aria-label="Notizseiten">
          <button
            className="note-icon"
            aria-label="Vorherige Notizseite"
            disabled={index === 0}
            onClick={() => {
              setIndex(index - 1);
              setPast([]);
              setFuture([]);
            }}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <select
            aria-label="Notizseite"
            value={index}
            onChange={(e) => {
              setIndex(+e.target.value);
              setPast([]);
              setFuture([]);
            }}
          >
            {notebook.pages.map((p, i) => (
              <option key={p.id} value={i}>
                Seite {i + 1} / {notebook.pages.length}
              </option>
            ))}
          </select>
          <button
            className="note-icon"
            aria-label="Nächste Notizseite"
            disabled={index === notebook.pages.length - 1}
            onClick={() => {
              setIndex(index + 1);
              setPast([]);
              setFuture([]);
            }}
          >
            <ChevronRight aria-hidden="true" />
          </button>
          <button
            className="note-icon"
            aria-label="Seite hinzufügen"
            title="Seite hinzufügen"
            disabled={notebook.pages.length >= 50}
            onClick={() => {
              onChange({ ...notebook, pages: [...notebook.pages, newPage()] });
              setIndex(notebook.pages.length);
              setPast([]);
              setFuture([]);
            }}
          >
            <Plus aria-hidden="true" />
          </button>
        </div>
      </div>
      {settings && (
        <NoteSettings
          notebook={notebook}
          page={page}
          preferences={prefs}
          dark={dark}
          onPreferences={updatePreferences}
          onSubject={(subject) => onChange({ ...notebook, subject })}
          onPaper={(paper) => commit({ ...page, paper })}
          onClose={() => setSettings(false)}
          onExportPage={() => onExportPage(page)}
          onPreview={onPreview}
          onMoreExports={onMoreExports}
          onTheme={onTheme}
        />
      )}
      <div className="ink-scroll" ref={scroller}>
        <svg
          className="ink-sheet"
          role="img"
          aria-label={`Schreibfläche Seite ${index + 1}`}
          viewBox={`0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}`}
          style={{ width: `${zoom}%` }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={(e) => end(e)}
          onPointerCancel={(e) => end(e, true)}
          onLostPointerCapture={(e) => end(e, true)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <defs>
            <pattern
              id={`paper-${page.id}`}
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path
                d={page.paper === "grid" ? "M 32 0 H 0 V 32" : "M 0 32 H 32"}
                fill="none"
                stroke="#d8e4ec"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width={PAGE_WIDTH} height={PAGE_HEIGHT} fill="white" />
          {page.paper !== "plain" && (
            <rect
              width={PAGE_WIDTH}
              height={PAGE_HEIGHT}
              fill={`url(#paper-${page.id})`}
            />
          )}
          {[
            ...(erasedPage?.strokes || page.strokes),
            ...(draft ? [draft] : []),
          ].map((s) => (
            <InkPath key={s.id} stroke={s} />
          ))}
        </svg>
      </div>
      <div className="note-status">
        <span>
          {notebook.subject || "Notizbuch"} · Seite {index + 1} /{" "}
          {notebook.pages.length} · {page.strokes.length} Striche
        </span>
        <span>{saveStatus}</span>
      </div>
    </section>
  );
}
const InkPath = memo(({ stroke: s }: { stroke: InkStroke }) => (
  <path
    data-ink-stroke={s.id}
    d={strokePath(s)}
    fill={s.color}
    opacity={s.tool === "marker" ? 0.3 : 1}
  />
));
