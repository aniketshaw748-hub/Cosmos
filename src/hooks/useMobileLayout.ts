import { useEffect, useState } from 'react';

/** Three-way responsive mode. Tablets (768–1024px portrait) use desktop. */
export type ViewportMode = 'desktop' | 'mobile-portrait' | 'mobile-landscape';

function computeMode(): ViewportMode {
  if (typeof window === 'undefined') return 'desktop';
  const portrait = window.matchMedia('(orientation: portrait)').matches;
  const w = window.innerWidth;
  if (w < 768 && portrait) return 'mobile-portrait';
  if (w < 1024 && !portrait) return 'mobile-landscape';
  return 'desktop';
}

/** Resolves the current responsive layout mode, updating on resize / rotate. */
export function useViewportMode(): ViewportMode {
  const [mode, setMode] = useState<ViewportMode>(computeMode);

  useEffect(() => {
    const handler = () => setMode(computeMode());
    handler();
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
    };
  }, []);

  return mode;
}

interface ViewportState {
  /** visible viewport height in px (shrinks when the keyboard is open) */
  height: number;
  /** height of the on-screen keyboard in px (0 when closed) */
  keyboard: number;
}

/**
 * Tracks the visual viewport so UI can stay above the on-screen keyboard.
 * Falls back to the layout viewport where the API is unavailable.
 */
export function useVisualViewport(): ViewportState {
  const [state, setState] = useState<ViewportState>(() => ({
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    keyboard: 0,
  }));

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const keyboard = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setState({ height: vv.height, keyboard });
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return state;
}
