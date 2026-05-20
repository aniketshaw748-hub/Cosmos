import { create } from 'zustand';
import type { SceneObject } from '../types';

interface SceneState {
  /** the object currently being inspected, or null */
  selected: SceneObject | null;
  /** id of the object under the cursor, or null */
  hoveredId: string | null;
  /** are orbital animations paused? */
  paused: boolean;

  select: (object: SceneObject) => void;
  deselect: () => void;
  setHovered: (id: string | null) => void;
  togglePaused: () => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  selected: null,
  hoveredId: null,
  paused: false,

  select: (object) => set({ selected: object }),
  deselect: () => set({ selected: null }),
  setHovered: (id) => set({ hoveredId: id }),
  togglePaused: () => set((state) => ({ paused: !state.paused })),
}));
