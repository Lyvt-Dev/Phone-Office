import {
  memo,
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  type PointerEvent,
} from "react";
import {
  StickyNote as StickyIcon,
  RectangleHorizontal,
  Circle,
  PenLine,
  Highlighter,
  Eraser,
  Undo2,
  Redo2,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  MousePointer2,
  Copy,
  ClipboardPaste,
  Trash2,
  Move,
  Minus,
  ZoomIn,
  Ruler,
  Maximize2,
  Minimize2,
  Lasso,
  Palette,
} from "lucide-react";
import { StickyManager, StickyLayer } from "./StickyNotes";
import { PageOverview } from "./PageOverview";
import {
  shapePoints,
  eraseStrokePart,
  clampZoom,
  intersectsSelection,
  intersectsLasso,
  translateStrokes,
} from "./operations";
import { NoteSettings } from "./NoteSettings";
import {
  newPage,
  defaultNotePreferences,
  type NotePreferences,
  inkPoint,
  strokePath,
  strokeOpacity,
  straightenStroke,
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
  onExportPdf: () => void;
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
  onExportPdf,
}: Props) {
  const [index, setIndex] = useState(0),
    [tool, setTool] = useState<
      | "pen"
      | "marker"
      | "eraser"
      | "select"
      | "line"
      | "move"
      | "lasso"
      | "rectangle"
      | "ellipse"
      | "sticky"
    >("pen");
  const prefs = notebook.preferences || defaultNotePreferences;
  const { color, width, finger } = prefs;
  const [zoom, setZoom] = useState(prefs.zoom);
  const [stickyManager, setStickyManager] = useState(false);
  const [overview, setOverview] = useState(false);
  const [focus, setFocus] = useState(false);
  const [movePreview, setMovePreview] = useState<InkStroke[] | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function clearHold() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
  }
  function armHold() {
    clearHold();
    if (tool !== "pen" || prefs.holdStraight === false) return;
    holdTimer.current = setTimeout(() => {
      const cur = pending.current;
      if (cur?.stroke) {
        cur.stroke = straightenStroke(cur.stroke);
        cur.straight = cur.stroke.points.length === 2;
        setDraft(cur.stroke);
      }
      holdTimer.current = null;
    }, 650);
  }
  useEffect(() => {
    document.body.classList.toggle("note-focus", focus);
    return () => document.body.classList.remove("note-focus");
  }, [focus]);
  useEffect(() => () => clearHold(), []);
  const [selected, setSelected] = useState<string[]>([]);
  const [clipboard, setClipboard] = useState<InkStroke[]>([]);
  const [rectangle, setRectangle] = useState<{
    a: ReturnType<typeof inkPoint>;
    b: ReturnType<typeof inkPoint>;
  } | null>(null);
  const [lassoPath, setLassoPath] = useState<ReturnType<typeof inkPoint>[]>([]);
  const selecting = useRef<{
    pointer: number;
    pointerType: string;
    a: ReturnType<typeof inkPoint>;
    b: ReturnType<typeof inkPoint>;
    move: boolean;
    polygon?: ReturnType<typeof inkPoint>[];
  } | null>(null);
  const latest = useRef(notebook);
  latest.current = notebook;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const fingers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    distance: number;
    zoom: number;
    anchorX: number;
    anchorY: number;
  } | null>(null);
  const anchor = useRef<{
    x: number;
    y: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  const sheet = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!fingers.current.size) setZoom(prefs.zoom);
  }, [prefs.zoom]);
  useLayoutEffect(() => {
    const a = anchor.current,
      r = sheet.current?.getBoundingClientRect();
    if (a && r && scroller.current) {
      scroller.current.scrollLeft += r.left + a.x * r.width - a.clientX;
      scroller.current.scrollTop += r.top + a.y * r.height - a.clientY;
      anchor.current = null;
    }
  }, [zoom]);
  const saveZoom = (value: number) => {
    const n = latest.current;
    onChange({
      ...n,
      preferences: {
        ...(n.preferences || defaultNotePreferences),
        zoom: value,
      },
    });
  };
  const setViewZoom = (value: number) => {
    const z = clampZoom(value);
    setZoom(z);
    zoomRef.current = z;
    saveZoom(z);
  };
  const [settings, setSettings] = useState(false);
  const [toolSettings, setToolSettings] = useState<
    "pen" | "marker" | "eraser" | null
  >(null);
  const barrel = useRef(false);
  useEffect(() => {
    const listener = (event: Event) => {
      barrel.current = (event as CustomEvent).detail === true;
    };
    window.addEventListener("phone-office-stylus-button", listener);
    return () =>
      window.removeEventListener("phone-office-stylus-button", listener);
  }, []);
  const updatePreferences = (change: Partial<NotePreferences>) =>
    onChange({ ...notebook, preferences: { ...prefs, ...change } });
  const [erasedPage, setErasedPage] = useState<NotePage | null>(null);
  const [draft, setDraft] = useState<InkStroke | null>(null);
  const [eraserCursor, setEraserCursor] = useState<ReturnType<
    typeof inkPoint
  > | null>(null);
  const [past, setPast] = useState<NotePage[]>([]),
    [future, setFuture] = useState<NotePage[]>([]);
  const pending = useRef<{
    pointer: number;
    pointerType: string;
    stroke: InkStroke | null;
    page: NotePage;
    before: NotePage;
    erase: boolean;
    straight?: boolean;
    shapeStart?: ReturnType<typeof inkPoint>;
    lastErase?: ReturnType<typeof inkPoint>;
  } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const page = notebook.pages[Math.min(index, notebook.pages.length - 1)];
  useEffect(() => {
    clearHold();
    pending.current = null;
    selecting.current = null;
    setDraft(null);
    setEraserCursor(null);
    setErasedPage(null);
    setMovePreview(null);
    setRectangle(null);
    setLassoPath([]);
    fingers.current.clear();
    gesture.current = null;
  }, [page.id]);
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
    if (e.pointerType !== "touch" && gesture.current) return;
    if (e.pointerType === "touch") {
      if (
        (pending.current && pending.current.pointerType !== "touch") ||
        (selecting.current && selecting.current.pointerType !== "touch")
      )
        return;
      e.preventDefault();
      capture(e);
      fingers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (fingers.current.size >= 2) {
        // The second finger converts finger drawing into a gesture, discarding only its unfinished draft.
        clearHold();
        setMovePreview(null);
        pending.current = null;
        selecting.current = null;
        setDraft(null);
        setErasedPage(null);
        setRectangle(null);
        setLassoPath([]);
        const [a, b] = [...fingers.current.values()],
          r = sheet.current!.getBoundingClientRect();
        gesture.current = {
          distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
          zoom: zoomRef.current,
          anchorX: ((a.x + b.x) / 2 - r.left) / r.width,
          anchorY: ((a.y + b.y) / 2 - r.top) / r.height,
        };
        return;
      }
      if (!finger || gesture.current) return;
    }
    if (tool === "sticky") return;
    if (pending.current) return; // Ignore palms and other pointers while a stroke is active.
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    const temporaryErase =
      e.pointerType === "pen" &&
      (barrel.current || e.button === 5 || (e.buttons & (2 | 32)) !== 0);
    if (
      !temporaryErase &&
      (tool === "select" || tool === "move" || tool === "lasso")
    ) {
      selecting.current = {
        pointer: e.pointerId,
        pointerType: e.pointerType,
        a: position(e),
        b: position(e),
        move: tool === "move",
        polygon: tool === "lasso" ? [position(e)] : undefined,
      };
      capture(e);
      if (tool === "lasso") {
        setSelected([]);
        setLassoPath([position(e)]);
      }
      if (tool === "select") {
        setSelected([]);
        setRectangle({ a: position(e), b: position(e) });
      }
      return;
    }
    if (
      tool !== "eraser" &&
      !temporaryErase &&
      (page.strokes.length >= 2000 ||
        notebook.pages.reduce(
          (sum, p) => sum + p.strokes.reduce((a, s) => a + s.points.length, 0),
          0,
        ) >= 197000)
    ) {
      onNotice(
        "Notizgrenze erreicht. Bitte sichern und ein weiteres Notizbuch anlegen.",
      );
      return;
    }
    const erase = tool === "eraser" || temporaryErase;
    const stroke: InkStroke | null = erase
      ? null
      : {
          id: crypto.randomUUID(),
          color,
          width: tool === "marker" ? width * 4 : width,
          tool: tool === "marker" ? "marker" : "pen",
          penStyle: prefs.penStyle || "fountain",
          points: [position(e)],
        };
    pending.current = {
      pointer: e.pointerId,
      pointerType: e.pointerType,
      stroke,
      page,
      before: page,
      erase,
      shapeStart:
        tool === "rectangle" || tool === "ellipse" ? position(e) : undefined,
    };
    capture(e);
    setDraft(stroke);
    armHold();
    if (erase) eraseAt(position(e));
  }
  function eraseAt(p: ReturnType<typeof inkPoint>) {
    const current = pending.current!;
    const radius = prefs.eraserSize || 16;
    const previous = current.lastErase || p;
    const steps = Math.max(
      1,
      Math.ceil(Math.hypot(p.x - previous.x, p.y - previous.y) / (radius / 2)),
    );
    let strokes = current.page.strokes;
    for (let i = 1; i <= steps; i++) {
      const center = inkPoint(
        previous.x + ((p.x - previous.x) * i) / steps,
        previous.y + ((p.y - previous.y) * i) / steps,
        0.5,
      );
      strokes =
        prefs.eraserMode === "partial"
          ? strokes.flatMap((s) => eraseStrokePart(s, center, radius))
          : strokes.filter((s) => !touchesStroke(s, center, radius));
    }
    const otherPoints = notebook.pages
      .filter((p) => p.id !== page.id)
      .reduce(
        (n, p) => n + p.strokes.reduce((n, s) => n + s.points.length, 0),
        0,
      );
    if (
      strokes.length > 2000 ||
      strokes.some((s) => s.points.length > 3000) ||
      otherPoints + strokes.reduce((n, s) => n + s.points.length, 0) > 200000
    ) {
      onNotice(
        "Teilradierer hat die Notizgrenze erreicht. Bitte ganze Striche radieren oder eine neue Seite verwenden.",
      );
      return;
    }
    current.lastErase = p;
    current.page = { ...current.page, strokes };
    setErasedPage(current.page);
  }
  function move(e: PointerEvent<SVGSVGElement>) {
    if (e.pointerType !== "touch")
      setEraserCursor(
        tool === "eraser" ||
          barrel.current ||
          (e.pointerType === "pen" && (e.buttons & (2 | 32)) !== 0) ||
          pending.current?.erase
          ? position(e)
          : null,
      );
    const prior = fingers.current.get(e.pointerId);
    if (prior) {
      fingers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (gesture.current && fingers.current.size >= 2) {
        e.preventDefault();
        const [a, b] = [...fingers.current.values()],
          g = gesture.current;
        const z = clampZoom(
          (g.zoom * Math.hypot(a.x - b.x, a.y - b.y)) / g.distance,
        );
        const midX = (a.x + b.x) / 2,
          midY = (a.y + b.y) / 2;
        anchor.current = {
          x: g.anchorX,
          y: g.anchorY,
          clientX: midX,
          clientY: midY,
        };
        if (z === zoomRef.current) {
          const r = sheet.current!.getBoundingClientRect();
          scroller.current?.scrollBy(
            r.left + g.anchorX * r.width - midX,
            r.top + g.anchorY * r.height - midY,
          );
          anchor.current = null;
        } else {
          zoomRef.current = z;
          setZoom(z);
        }
        return;
      }
      if (!pending.current && !selecting.current) {
        scroller.current?.scrollBy(prior.x - e.clientX, prior.y - e.clientY);
        return;
      }
    }
    const selection = selecting.current;
    if (selection?.pointer === e.pointerId) {
      e.preventDefault();
      selection.b = position(e);
      if (selection.polygon) {
        if (selection.polygon.length < 3000)
          selection.polygon.push(selection.b);
        setLassoPath([...selection.polygon]);
      } else if (!selection.move)
        setRectangle({ a: selection.a, b: selection.b });
      else
        setMovePreview(
          translateStrokes(
            page.strokes.filter((s) => selected.includes(s.id)),
            selection.b.x - selection.a.x,
            selection.b.y - selection.a.y,
          ),
        );
      return;
    }
    const cur = pending.current;
    if (!cur) return;
    if (cur.pointer !== e.pointerId) return;
    e.preventDefault();
    const samples = e.nativeEvent.getCoalescedEvents?.() || [];
    for (const ev of samples.length ? samples : [e.nativeEvent]) {
      const p = position(e, ev);
      if (
        !cur.erase &&
        e.pointerType === "pen" &&
        (barrel.current || (e.buttons & (2 | 32)) !== 0)
      ) {
        if (cur.stroke)
          cur.page = {
            ...cur.page,
            strokes: [...cur.page.strokes, cur.stroke],
          };
        cur.stroke = null;
        cur.erase = true;
        clearHold();
        setDraft(null);
      }
      if (cur.erase) eraseAt(p);
      else if (cur.stroke && cur.stroke.points.length < 3000) {
        const last = cur.stroke.points.at(-1)!;
        if (Math.hypot(p.x - last.x, p.y - last.y) > 0.5) {
          armHold();
          cur.stroke = {
            ...cur.stroke,
            points:
              cur.shapeStart && (tool === "rectangle" || tool === "ellipse")
                ? shapePoints(tool, cur.shapeStart, p)
                : tool === "line" || cur.straight
                  ? [cur.stroke.points[0], p]
                  : [...cur.stroke.points, p],
          };
        }
      }
    }
    if (cur.stroke) setDraft(cur.stroke);
  }
  function end(e: PointerEvent<SVGSVGElement>, cancel = false) {
    if (fingers.current.has(e.pointerId)) {
      fingers.current.delete(e.pointerId);
      if (gesture.current) {
        saveZoom(zoomRef.current);
        if (!fingers.current.size) gesture.current = null;
        return;
      }
    }
    const selection = selecting.current;
    if (selection?.pointer === e.pointerId) {
      selecting.current = null;
      setMovePreview(null);
      setLassoPath([]);
      setRectangle(null);
      if (!cancel) {
        if (selection.move) {
          const moved = translateStrokes(
            page.strokes.filter((s) => selected.includes(s.id)),
            selection.b.x - selection.a.x,
            selection.b.y - selection.a.y,
          );
          if (moved.length)
            commit({
              ...page,
              strokes: page.strokes.map(
                (s) => moved.find((m) => m.id === s.id) || s,
              ),
            });
        } else
          setSelected(
            page.strokes
              .filter((s) =>
                selection.polygon
                  ? intersectsLasso(s, selection.polygon)
                  : intersectsSelection(s, selection.a, selection.b),
              )
              .map((s) => s.id),
          );
      }
      return;
    }
    const cur = pending.current;
    if (!cur || cur.pointer !== e.pointerId) return;
    clearHold();
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
  function pasteClipboard() {
    const count =
      notebook.pages
        .flatMap((p) => p.strokes)
        .reduce((n, s) => n + s.points.length, 0) +
      clipboard.reduce((n, s) => n + s.points.length, 0);
    if (page.strokes.length + clipboard.length > 2000 || count > 200000) {
      onNotice("Notizgrenze erreicht.");
      return;
    }
    const copied = translateStrokes(clipboard, 20, 20).map((s) => ({
      ...s,
      id: crypto.randomUUID(),
    }));
    commit({ ...page, strokes: [...page.strokes, ...copied] });
    setSelected(copied.map((s) => s.id));
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
        <button
          className="note-icon focus-toggle"
          aria-label={focus ? "Fokusmodus beenden" : "Fokusmodus"}
          aria-pressed={focus}
          onClick={() => setFocus(!focus)}
        >
          {focus ? <Minimize2 /> : <Maximize2 />}
        </button>
        <div
          className="ink-toolbar"
          role="toolbar"
          aria-label="Schreibwerkzeuge"
        >
          <button
            className={tool === "sticky" ? "note-icon active" : "note-icon"}
            aria-label="Haftnotizen"
            aria-pressed={tool === "sticky"}
            onClick={() => {
              setTool("sticky");
              setStickyManager(true);
            }}
          >
            <StickyIcon />
          </button>
          {(
            [
              "pen",
              "marker",
              "eraser",
              "select",
              "lasso",
              "line",
              "rectangle",
              "ellipse",
            ] as const
          ).map((t, i) => {
            const Icon = [
              PenLine,
              Highlighter,
              Eraser,
              MousePointer2,
              Lasso,
              Ruler,
              RectangleHorizontal,
              Circle,
            ][i];
            const label = [
              "Stift",
              "Textmarker",
              "Radierer",
              "Handschrift auswählen",
              "Lasso-Auswahl",
              "Gerade Linie",
              "Rechteck zeichnen",
              "Ellipse zeichnen",
            ][i];
            return (
              <button
                key={t}
                className="note-icon"
                aria-label={label}
                title={
                  t === "pen" || t === "marker" || t === "eraser"
                    ? `${label} · erneut tippen für Optionen`
                    : label
                }
                aria-pressed={tool === t}
                onClick={() => {
                  if (
                    tool === t &&
                    (t === "pen" || t === "marker" || t === "eraser")
                  )
                    setToolSettings(t);
                  else {
                    setTool(t);
                    setToolSettings(null);
                  }
                }}
              >
                <Icon aria-hidden="true" />
                {(t === "pen" || t === "marker") && (
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
          {(tool === "pen" || tool === "marker" || tool === "line") && (
            <div
              className="pen-quickbar"
              role="toolbar"
              aria-label="Stiftoptionen"
            >
              {["#26322f", "#2563eb", "#ef4444", "#16a34a", "#8b5cf6"].map(
                (c) => (
                  <button
                    key={c}
                    className="note-icon color-choice"
                    aria-label={`Stiftfarbe ${c}`}
                    aria-pressed={color === c}
                    onClick={() => updatePreferences({ color: c })}
                  >
                    <i style={{ background: c }} />
                  </button>
                ),
              )}
              <label className="custom-ink" title="Eigene Stiftfarbe">
                <input
                  aria-label="Eigene Stiftfarbe"
                  type="color"
                  value={color}
                  onChange={(e) => updatePreferences({ color: e.target.value })}
                />
              </label>
            </div>
          )}
        </div>
        <button
          className="note-icon ink-settings-trigger"
          aria-label="Notizeinstellungen"
          title="Notizeinstellungen"
          onClick={() => setSettings(true)}
        >
          <Settings aria-hidden="true" />
          <span>Einstellungen</span>
        </button>
        <div className="note-pages" aria-label="Notizseiten">
          <button
            className="note-icon"
            aria-label="Seitenübersicht"
            title="Seitenübersicht"
            onClick={() => setOverview(true)}
          >
            <LayoutGrid />
          </button>
          <button
            className="note-icon"
            aria-label="Vorherige Notizseite"
            disabled={index === 0}
            onClick={() => {
              setIndex(index - 1);
              setPast([]);
              setFuture([]);
              setSelected([]);
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
              setSelected([]);
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
              setSelected([]);
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
              onChange({
                ...notebook,
                pages: [...notebook.pages, newPage(page.paper)],
              });
              setIndex(notebook.pages.length);
              setPast([]);
              setFuture([]);
              setSelected([]);
            }}
          >
            <Plus aria-hidden="true" />
          </button>
        </div>
      </div>
      {selected.length > 0 && (
        <div
          className="selection-actions"
          role="toolbar"
          aria-label="Handschrift-Auswahl"
        >
          <span>{selected.length} Striche</span>
          <button
            onClick={() =>
              commit({
                ...page,
                strokes: page.strokes.map((s) =>
                  selected.includes(s.id) ? { ...s, color } : s,
                ),
              })
            }
          >
            <Palette size={20} />
            Auswahl einfärben
          </button>
          <button
            onClick={() => {
              setTool("move");
            }}
            aria-pressed={tool === "move"}
          >
            <Move size={20} />
            Verschieben
          </button>
          <button
            onClick={() =>
              setClipboard(page.strokes.filter((s) => selected.includes(s.id)))
            }
          >
            <Copy size={20} />
            Kopieren
          </button>
          {clipboard.length > 0 && (
            <button onClick={pasteClipboard}>
              <ClipboardPaste size={20} />
              Handschrift einfügen
            </button>
          )}
          <button
            onClick={() => {
              commit({
                ...page,
                strokes: page.strokes.filter((s) => !selected.includes(s.id)),
              });
              setSelected([]);
            }}
          >
            <Trash2 size={20} />
            Auswahl löschen
          </button>
          <button
            onClick={() => {
              setSelected([]);
              setTool("pen");
            }}
          >
            Fertig
          </button>
        </div>
      )}
      {clipboard.length > 0 && selected.length === 0 && (
        <div className="selection-actions">
          <button onClick={pasteClipboard}>
            <ClipboardPaste size={20} />
            Handschrift einfügen
          </button>
        </div>
      )}
      {stickyManager && (
        <StickyManager
          notes={page.stickies || []}
          onClose={() => setStickyManager(false)}
          onSave={(n) =>
            commit({
              ...page,
              stickies: [
                ...(page.stickies || []).filter((s) => s.id !== n.id),
                n,
              ],
            })
          }
          onDelete={(id) =>
            commit({
              ...page,
              stickies: (page.stickies || []).filter((s) => s.id !== id),
            })
          }
        />
      )}
      {tool === "sticky" && !stickyManager && (
        <div className="sticky-mode-hint">
          <StickyIcon size={16} /> Haftnotizen ziehen ·{" "}
          <button onClick={() => setStickyManager(true)}>Bearbeiten</button>
          <button onClick={() => setTool("pen")}>Fertig</button>
        </div>
      )}
      {overview && (
        <PageOverview
          notebook={notebook}
          current={page.id}
          onNotice={onNotice}
          onClose={() => setOverview(false)}
          onChange={(n, id) => {
            onChange(n);
            setIndex(
              Math.max(
                0,
                n.pages.findIndex((p) => p.id === id),
              ),
            );
            setPast([]);
            setFuture([]);
            setSelected([]);
          }}
        />
      )}
      {(settings || toolSettings) && (
        <NoteSettings
          mode={toolSettings || "page"}
          notebook={notebook}
          page={page}
          preferences={prefs}
          dark={dark}
          onPreferences={(p) => {
            if (p.zoom !== undefined) setZoom(p.zoom);
            updatePreferences(p);
          }}
          onSubject={(subject) => onChange({ ...notebook, subject })}
          onPaper={(paper) => commit({ ...page, paper })}
          onClose={() => {
            setSettings(false);
            setToolSettings(null);
          }}
          onExportPage={() => onExportPage(page)}
          onPreview={onPreview}
          onMoreExports={onMoreExports}
          onExportPdf={onExportPdf}
          onTheme={onTheme}
        />
      )}
      <div className="ink-scroll" ref={scroller}>
        <svg
          ref={sheet}
          className="ink-sheet"
          role="img"
          aria-label={`Schreibfläche Seite ${index + 1}`}
          viewBox={`0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}`}
          style={{ width: `${zoom}%` }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerLeave={() => setEraserCursor(null)}
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
              {page.paper === "dots" ? (
                <circle cx="16" cy="16" r="1.5" fill="#b9cbd8" />
              ) : (
                <path
                  d={page.paper === "grid" ? "M 32 0 H 0 V 32" : "M 0 32 H 32"}
                  fill="none"
                  stroke="#d8e4ec"
                  strokeWidth="1"
                />
              )}
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
          {page.background && (
            <image
              href={page.background}
              width={PAGE_WIDTH}
              height={PAGE_HEIGHT}
              pointerEvents="none"
            />
          )}
          <StickyLayer
            key={page.id + (tool === "sticky" ? "edit" : "view")}
            notes={page.stickies || []}
            interactive={tool === "sticky"}
            onMove={(n) =>
              commit({
                ...page,
                stickies: (page.stickies || []).map((s) =>
                  s.id === n.id ? n : s,
                ),
              })
            }
          />
          {[
            ...(erasedPage?.strokes || page.strokes).map(
              (s) => movePreview?.find((m) => m.id === s.id) || s,
            ),
            ...(draft ? [draft] : []),
          ].map((s) => (
            <g
              key={s.id}
              pointerEvents={tool === "sticky" ? "none" : undefined}
              className={selected.includes(s.id) ? "selected-ink" : ""}
            >
              <InkPath stroke={s} />
            </g>
          ))}
          {lassoPath.length > 1 && (
            <path
              d={`M ${lassoPath.map((p) => `${p.x} ${p.y}`).join(" L ")} Z`}
              fill="#2563eb18"
              stroke="#2563eb"
              strokeDasharray="8 5"
              pointerEvents="none"
            />
          )}
          {rectangle && (
            <rect
              x={Math.min(rectangle.a.x, rectangle.b.x)}
              y={Math.min(rectangle.a.y, rectangle.b.y)}
              width={Math.abs(rectangle.a.x - rectangle.b.x)}
              height={Math.abs(rectangle.a.y - rectangle.b.y)}
              fill="#2563eb18"
              stroke="#2563eb"
              strokeDasharray="8 5"
              pointerEvents="none"
            />
          )}
          {eraserCursor && (
            <circle
              cx={eraserCursor.x}
              cy={eraserCursor.y}
              r={prefs.eraserSize || 16}
              fill="rgba(255,255,255,.3)"
              stroke="#174e43"
              strokeWidth={1.5}
              pointerEvents="none"
            />
          )}
        </svg>
      </div>
      <div className="note-status">
        <span>
          {notebook.subject || "Notizbuch"} · Seite {index + 1} /{" "}
          {notebook.pages.length} · {page.strokes.length} Striche
        </span>
        <div className="note-zoom">
          <button
            aria-label="Notiz verkleinern"
            disabled={zoom <= 50}
            onClick={() => setViewZoom(zoom - 25)}
          >
            <Minus size={18} />
          </button>
          <button
            aria-label="Notizzoom zurücksetzen"
            onClick={() => setViewZoom(100)}
          >
            {zoom}%
          </button>
          <button
            aria-label="Notiz vergrößern"
            disabled={zoom >= 300}
            onClick={() => setViewZoom(zoom + 25)}
          >
            <ZoomIn size={18} />
          </button>
        </div>
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
    opacity={strokeOpacity(s)}
  />
));
