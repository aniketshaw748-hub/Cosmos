import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useSceneStore } from '../../store/useSceneStore';
import type { SceneObject } from '../../types';
import { useViewportMode, useVisualViewport } from '../../hooks/useMobileLayout';
import { usePanelResize } from '../../hooks/usePanelResize';
import type { PanelResizeHandlers } from '../../hooks/usePanelResize';
import { PanelContent } from './PanelContent';
import {
  PANEL_MIN_WIDTH,
  clamp,
  panelMaxWidth,
  panelMinHeight,
  panelMaxHeight,
  DEFAULT_WIDTH_DESKTOP,
  defaultWidthLandscape,
  defaultHeightMobile,
  snapHeight,
  savePanelWidth,
  savePanelHeight,
} from '../../lib/panelLayout';

/** Accent colour per object kind. */
const ACCENT: Record<SceneObject['kind'], string> = {
  star: '#ffb74d',
  planet: '#5b8cff',
  asteroid: '#9aa7bd',
  moon: '#bcccdc',
};

/**
 * Slide-in panel for the selected object. Three responsive layouts — docked
 * right (desktop / landscape) or docked bottom (portrait) — each resizable by
 * dragging the panel's leading edge. The size persists per orientation.
 */
export function InfoPanel() {
  const selected = useSceneStore((s) => s.selected);
  const chatExpanded = useSceneStore((s) => s.chatExpanded);
  const panelWidth = useSceneStore((s) => s.panelWidth);
  const panelHeightMobile = useSceneStore((s) => s.panelHeightMobile);
  const setPanelWidth = useSceneStore((s) => s.setPanelWidth);
  const setPanelHeightMobile = useSceneStore((s) => s.setPanelHeightMobile);
  const setViewportMode = useSceneStore((s) => s.setViewportMode);

  const [shown, setShown] = useState<SceneObject | null>(selected);
  // Live size while a drag is in progress (null when settled).
  const [liveSize, setLiveSize] = useState<number | null>(null);

  const mode = useViewportMode();
  const { height: vvHeight, keyboard } = useVisualViewport();

  useEffect(() => {
    if (selected) setShown(selected);
  }, [selected]);

  // Mirror the layout mode into the store for CameraRig and friends.
  useEffect(() => {
    setViewportMode(mode);
  }, [mode, setViewportMode]);

  const open = selected !== null;
  const accent = shown ? ACCENT[shown.kind] : ACCENT.planet;
  const isPortrait = mode === 'mobile-portrait';
  const isLandscape = mode === 'mobile-landscape';
  const horizontal = !isPortrait;

  const clampSize = useCallback(
    (raw: number) =>
      horizontal
        ? clamp(raw, PANEL_MIN_WIDTH, panelMaxWidth())
        : clamp(raw, panelMinHeight(), panelMaxHeight()),
    [horizontal],
  );

  const resize = usePanelResize({
    axis: horizontal ? 'x' : 'y',
    value: horizontal ? panelWidth : panelHeightMobile,
    clampValue: clampSize,
    snap: horizontal ? undefined : snapHeight,
    resetValue: () =>
      mode === 'desktop'
        ? DEFAULT_WIDTH_DESKTOP
        : mode === 'mobile-landscape'
          ? defaultWidthLandscape()
          : defaultHeightMobile(),
    onResize: (s) => setLiveSize(s),
    onCommit: (s) => {
      setLiveSize(null);
      if (horizontal) {
        setPanelWidth(s);
        savePanelWidth(s);
      } else {
        setPanelHeightMobile(s);
        savePanelHeight(s);
      }
    },
  });

  // Panel size — the live value mid-drag, else the committed store value.
  let panelStyle: CSSProperties;
  if (isPortrait) {
    const h = clampSize(liveSize ?? panelHeightMobile);
    panelStyle = {
      bottom: keyboard,
      height:
        keyboard > 0
          ? Math.max(vvHeight - 12, 240)
          : chatExpanded
            ? Math.round(vvHeight * 0.85)
            : h,
    };
  } else {
    panelStyle = { width: clampSize(liveSize ?? panelWidth) };
    if (isLandscape && keyboard > 0) panelStyle.height = vvHeight;
  }

  const base = 'pointer-events-auto absolute z-20 flex flex-col border-white/10 shadow-2xl';
  // Disable transitions during a drag so resizing tracks the pointer in real time.
  const motion = resize.dragging ? '' : 'transition-all ease-out';
  let layout: string;
  if (isPortrait) {
    layout = `inset-x-0 bottom-0 w-full border-t bg-[#0b0e17] duration-[360ms] ${
      open ? 'translate-y-0' : 'translate-y-full'
    }`;
  } else if (isLandscape) {
    layout = `right-0 top-0 h-full border-l bg-[#0b0e17] duration-300 ${
      open ? 'translate-x-0' : 'translate-x-full'
    }`;
  } else {
    layout = `right-0 top-0 h-full border-l bg-[#0a0d16]/90 backdrop-blur-xl duration-[420ms] ${
      open ? 'translate-x-0' : 'translate-x-full'
    }`;
  }

  return (
    <aside aria-hidden={!open} className={`${base} ${motion} ${layout}`} style={panelStyle}>
      {open && <ResizeHandle portrait={isPortrait} dragging={resize.dragging} resize={resize} />}
      {shown && <PanelContent key={shown.id} object={shown} accent={accent} mode={mode} />}
    </aside>
  );
}

/** The drag-to-resize grip on the panel's leading edge. */
function ResizeHandle({
  portrait,
  dragging,
  resize,
}: {
  portrait: boolean;
  dragging: boolean;
  resize: PanelResizeHandlers;
}) {
  if (portrait) {
    return (
      <div
        onPointerDown={resize.onPointerDown}
        onDoubleClick={resize.onDoubleClick}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Drag to resize panel — double-tap to reset"
        title="Drag to resize · double-tap to reset"
        className="absolute inset-x-0 top-0 z-30 flex h-6 -translate-y-1/2 touch-none cursor-row-resize items-center justify-center"
      >
        <div
          className={`h-1 w-10 rounded-full transition-colors ${
            dragging ? 'bg-white/60' : 'bg-white/25'
          }`}
        />
      </div>
    );
  }
  return (
    <div
      onPointerDown={resize.onPointerDown}
      onDoubleClick={resize.onDoubleClick}
      role="separator"
      aria-orientation="vertical"
      aria-label="Drag to resize panel — double-click to reset"
      title="Drag to resize · double-click to reset"
      className="group absolute inset-y-0 left-0 z-30 flex w-2 -translate-x-1/2 touch-none cursor-col-resize justify-center"
    >
      <div
        className={`h-full w-px transition-colors ${
          dragging ? 'bg-white/55' : 'bg-transparent group-hover:bg-white/35'
        }`}
      />
    </div>
  );
}
