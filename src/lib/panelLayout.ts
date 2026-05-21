/**
 * Sizing rules and persistence for the resizable InfoPanel. Horizontal modes
 * (desktop, landscape) resize the panel's WIDTH; portrait resizes its HEIGHT.
 */

const WIDTH_KEY = 'cosmos_panel_width';
const HEIGHT_KEY = 'cosmos_panel_height_mobile';

/** Width bounds for desktop / landscape, in px. */
export const PANEL_MIN_WIDTH = 320;
export const panelMaxWidth = (): number =>
  Math.round((typeof window !== 'undefined' ? window.innerWidth : 1280) * 0.6);

/** Height bounds for portrait phones, in px. */
export const panelMinHeight = (): number =>
  Math.round((typeof window !== 'undefined' ? window.innerHeight : 800) * 0.3);
export const panelMaxHeight = (): number =>
  Math.round((typeof window !== 'undefined' ? window.innerHeight : 800) * 0.85);

/** Reset defaults — see spec points 10 and 16. */
export const DEFAULT_WIDTH_DESKTOP = 400;
export const defaultWidthLandscape = (): number =>
  Math.round((typeof window !== 'undefined' ? window.innerWidth : 900) * 0.55);
export const defaultHeightMobile = (): number =>
  Math.round((typeof window !== 'undefined' ? window.innerHeight : 800) * 0.6);

export const clamp = (n: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, n));

/** Snap a portrait height to 40 / 60 / 80% of the viewport if within 5%. */
const SNAP_FRACTIONS = [0.4, 0.6, 0.8];
export function snapHeight(px: number): number {
  if (typeof window === 'undefined') return px;
  const vh = window.innerHeight;
  const frac = px / vh;
  for (const s of SNAP_FRACTIONS) {
    if (Math.abs(frac - s) <= 0.05) return Math.round(s * vh);
  }
  return px;
}

function readNumber(key: string): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    const n = raw ? parseFloat(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeNumber(key: string, value: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, String(Math.round(value)));
  } catch {
    /* storage unavailable (private mode) — fall back to in-memory only */
  }
}

/** Initial panel width (desktop / landscape), restored from localStorage. */
export function loadPanelWidth(): number {
  return readNumber(WIDTH_KEY) ?? DEFAULT_WIDTH_DESKTOP;
}
export function savePanelWidth(n: number): void {
  writeNumber(WIDTH_KEY, n);
}

/** Initial panel height (portrait), restored from localStorage. */
export function loadPanelHeight(): number {
  return readNumber(HEIGHT_KEY) ?? defaultHeightMobile();
}
export function savePanelHeight(n: number): void {
  writeNumber(HEIGHT_KEY, n);
}
