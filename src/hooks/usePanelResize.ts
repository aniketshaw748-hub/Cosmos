import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

export interface PanelResizeOptions {
  /** drag axis: 'x' for width (desktop / landscape), 'y' for height (portrait) */
  axis: 'x' | 'y';
  /** current committed size, px — captured when a drag begins */
  value: number;
  /** clamp a raw size to its min / max bounds */
  clampValue: (raw: number) => number;
  /** optional snap applied once on release (portrait snap points) */
  snap?: (size: number) => number;
  /** size to restore on double-click / double-tap */
  resetValue: () => number;
  /** called continuously during a drag with the live size */
  onResize: (size: number) => void;
  /** called once when a drag (or reset) settles */
  onCommit: (size: number) => void;
}

export interface PanelResizeHandlers {
  onPointerDown: (e: ReactPointerEvent) => void;
  onDoubleClick: () => void;
  dragging: boolean;
}

/**
 * Drag-to-resize for an edge handle. Pointer events cover mouse, touch and pen
 * with one code path; move / up listeners live on `window` so the drag keeps
 * tracking even when the cursor leaves the thin handle.
 */
export function usePanelResize(opts: PanelResizeOptions): PanelResizeHandlers {
  const [dragging, setDragging] = useState(false);
  // Keep the latest callbacks reachable from the window listeners.
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const startPos = useRef(0);
  const startValue = useRef(0);
  const liveValue = useRef(0);

  const onPointerDown = useCallback((e: ReactPointerEvent) => {
    // Left button / touch / pen only.
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();

    const o = optsRef.current;
    startPos.current = o.axis === 'x' ? e.clientX : e.clientY;
    startValue.current = o.value;
    liveValue.current = o.value;
    setDragging(true);

    // Lock the page so a drag never scrolls or selects text underneath.
    const body = document.body.style;
    const prev = {
      userSelect: body.userSelect,
      touchAction: body.touchAction,
      overflow: body.overflow,
      cursor: body.cursor,
    };
    body.userSelect = 'none';
    body.touchAction = 'none';
    body.overflow = 'hidden';
    body.cursor = o.axis === 'x' ? 'col-resize' : 'row-resize';

    const move = (ev: PointerEvent) => {
      const oo = optsRef.current;
      const pos = oo.axis === 'x' ? ev.clientX : ev.clientY;
      // The handle is on the panel's leading edge: dragging away from the
      // panel body (left / up) grows it, toward it (right / down) shrinks it.
      const raw = startValue.current - (pos - startPos.current);
      const next = oo.clampValue(raw);
      liveValue.current = next;
      oo.onResize(next);
    };

    const finish = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      body.userSelect = prev.userSelect;
      body.touchAction = prev.touchAction;
      body.overflow = prev.overflow;
      body.cursor = prev.cursor;
      setDragging(false);

      const oo = optsRef.current;
      const snapped = oo.snap ? oo.snap(liveValue.current) : liveValue.current;
      const final = oo.clampValue(snapped);
      oo.onResize(final);
      oo.onCommit(final);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  }, []);

  const onDoubleClick = useCallback(() => {
    const o = optsRef.current;
    const v = o.clampValue(o.resetValue());
    o.onResize(v);
    o.onCommit(v);
  }, []);

  return { onPointerDown, onDoubleClick, dragging };
}
