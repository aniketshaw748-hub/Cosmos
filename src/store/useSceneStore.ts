import { create } from 'zustand';
import type { SceneObject } from '../types';

/** Lightweight identity of the object under the cursor. */
export interface HoverTarget {
  id: string;
  name: string;
}

interface SceneState {
  /** the object currently being inspected, or null */
  selected: SceneObject | null;
  /** the object under the cursor, or null */
  hovered: HoverTarget | null;
  /** are orbital animations paused? */
  paused: boolean;
  /** is the APOD landing splash showing? */
  landingVisible: boolean;
  /** is the focused planet opened up to show its interior? (Feature 3) */
  dissectMode: boolean;
  /** high-quality textures toggle (Feature 5) */
  highQuality: boolean;
  /** is the NASA image gallery modal open? (Feature 6) */
  galleryOpen: boolean;
  /** is the timeline scrubber open? (Feature 7) */
  timelineOpen: boolean;
  /** timeline position, 0 = 4.6 billion years ago, 1 = today (Feature 7) */
  timelinePosition: number;
  /** is the "beyond the solar system" toast showing? (Feature 9) */
  toastVisible: boolean;

  select: (object: SceneObject) => void;
  deselect: () => void;
  setHovered: (target: HoverTarget | null) => void;
  togglePaused: () => void;
  dismissLanding: () => void;
  toggleDissect: () => void;
  toggleHighQuality: () => void;
  setGalleryOpen: (open: boolean) => void;
  setTimelineOpen: (open: boolean) => void;
  setTimelinePosition: (pos: number) => void;
  setToastVisible: (visible: boolean) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  selected: null,
  hovered: null,
  paused: false,
  landingVisible: true,
  dissectMode: false,
  highQuality: false,
  galleryOpen: false,
  timelineOpen: false,
  timelinePosition: 1,
  toastVisible: false,

  select: (object) => set({ selected: object, dissectMode: false, galleryOpen: false }),
  deselect: () => set({ selected: null, dissectMode: false, galleryOpen: false }),
  setHovered: (target) => set({ hovered: target }),
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  dismissLanding: () => set({ landingVisible: false }),
  toggleDissect: () => set((s) => ({ dissectMode: !s.dissectMode })),
  toggleHighQuality: () => set((s) => ({ highQuality: !s.highQuality })),
  setGalleryOpen: (open) => set({ galleryOpen: open }),
  setTimelineOpen: (open) => set({ timelineOpen: open }),
  setTimelinePosition: (pos) => set({ timelinePosition: pos }),
  setToastVisible: (visible) => set({ toastVisible: visible }),
}));
