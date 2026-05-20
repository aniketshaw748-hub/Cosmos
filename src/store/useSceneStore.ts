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

  select: (object: SceneObject) => void;
  deselect: () => void;
  setHovered: (target: HoverTarget | null) => void;
  togglePaused: () => void;
  dismissLanding: () => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  selected: null,
  hovered: null,
  paused: false,
  landingVisible: true,

  select: (object) => set({ selected: object }),
  deselect: () => set({ selected: null }),
  setHovered: (target) => set({ hovered: target }),
  togglePaused: () => set((state) => ({ paused: !state.paused })),
  dismissLanding: () => set({ landingVisible: false }),
}));
