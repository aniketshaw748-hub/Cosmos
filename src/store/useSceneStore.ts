import { create } from 'zustand';
import type {
  SceneObject,
  CuriosityQuestion,
  CuriosityLogEntry,
  CuriosityOutcome,
} from '../types';
import type { ViewportMode } from '../hooks/useMobileLayout';
import { computeMode } from '../hooks/useMobileLayout';
import { loadPanelWidth, loadPanelHeight } from '../lib/panelLayout';

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
  /** is the AI chat expanded to fill the panel? */
  chatExpanded: boolean;
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
  /** timestamp (ms) of the last toast, used to debounce it */
  lastToastAt: number;
  /** bumped to request a zoom-out to the whole-system overview */
  overviewNonce: number;
  /** InfoPanel width for desktop / landscape, px (user-resizable) */
  panelWidth: number;
  /** InfoPanel height for portrait phones, px (user-resizable) */
  panelHeightMobile: number;
  /** current responsive layout mode, mirrored from useViewportMode() */
  viewportMode: ViewportMode;

  // --- Curious AI (proactive question system) ---
  /** timestamp (ms) of the user's last click / keypress / zoom */
  lastInteraction: number;
  /** consecutive curiosity-question dismissals (drives the back-off) */
  dismissCount: number;
  /** until this timestamp the Curious AI stays quiet (3-dismissal back-off) */
  curiosityBackoffUntil: number;
  /** the curiosity question currently surfaced to the user, or null */
  pendingCuriosityQuestion: CuriosityQuestion | null;
  /** every curiosity question triggered this session — the demo history */
  curiosityLog: CuriosityLogEntry[];
  /** is the curiosity-log viewer open? */
  curiosityLogOpen: boolean;
  /** timestamp (ms) of the last chat message, either side */
  lastChatAt: number;
  /** questions the user has typed / tapped this session */
  askedQuestions: string[];
  /** names of recently-selected objects, most recent first */
  recentObjects: string[];
  /** camera distance to the focused object (written by CameraRig) */
  cameraDistance: number;
  /** bumped each time "Surprise me" reveals a random object */
  surpriseNonce: number;

  select: (object: SceneObject) => void;
  deselect: () => void;
  setHovered: (target: HoverTarget | null) => void;
  togglePaused: () => void;
  dismissLanding: () => void;
  toggleDissect: () => void;
  toggleChatExpanded: () => void;
  toggleHighQuality: () => void;
  setGalleryOpen: (open: boolean) => void;
  setTimelineOpen: (open: boolean) => void;
  setTimelinePosition: (pos: number) => void;
  triggerToast: () => void;
  dismissToast: () => void;
  viewOverview: () => void;
  setPanelWidth: (n: number) => void;
  setPanelHeightMobile: (n: number) => void;
  setViewportMode: (mode: ViewportMode) => void;
  registerInteraction: () => void;
  showCuriosity: (question: CuriosityQuestion) => void;
  resolveCuriosity: (outcome: CuriosityOutcome) => void;
  toggleCuriosityLog: () => void;
  noteChatActivity: () => void;
  noteAskedQuestion: (question: string) => void;
  setCameraDistance: (distance: number) => void;
  bumpSurprise: () => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  selected: null,
  hovered: null,
  paused: false,
  landingVisible: true,
  dissectMode: false,
  chatExpanded: false,
  highQuality: false,
  galleryOpen: false,
  timelineOpen: false,
  timelinePosition: 1,
  toastVisible: false,
  lastToastAt: 0,
  overviewNonce: 0,
  panelWidth: loadPanelWidth(),
  panelHeightMobile: loadPanelHeight(),
  viewportMode: computeMode(),
  lastInteraction: Date.now(),
  dismissCount: 0,
  curiosityBackoffUntil: 0,
  pendingCuriosityQuestion: null,
  curiosityLog: [],
  curiosityLogOpen: false,
  lastChatAt: 0,
  askedQuestions: [],
  recentObjects: [],
  cameraDistance: 0,
  surpriseNonce: 0,

  select: (object) =>
    set((s) => ({
      selected: object,
      dissectMode: false,
      galleryOpen: false,
      chatExpanded: false,
      recentObjects: [object.name, ...s.recentObjects.filter((n) => n !== object.name)].slice(0, 6),
    })),
  deselect: () =>
    set({ selected: null, dissectMode: false, galleryOpen: false, chatExpanded: false }),
  setHovered: (target) => set({ hovered: target }),
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  dismissLanding: () => set({ landingVisible: false }),
  toggleDissect: () => set((s) => ({ dissectMode: !s.dissectMode })),
  toggleChatExpanded: () => set((s) => ({ chatExpanded: !s.chatExpanded })),
  toggleHighQuality: () => set((s) => ({ highQuality: !s.highQuality })),
  setGalleryOpen: (open) => set({ galleryOpen: open }),
  setTimelineOpen: (open) => set({ timelineOpen: open }),
  setTimelinePosition: (pos) => set({ timelinePosition: pos }),
  triggerToast: () =>
    set((s) => {
      // Debounced: not while another modal owns the scene, and not within 10s.
      if (s.toastVisible || s.landingVisible || s.timelineOpen) return {};
      if (Date.now() - s.lastToastAt < 10000) return {};
      return { toastVisible: true, lastToastAt: Date.now() };
    }),
  dismissToast: () => set({ toastVisible: false }),
  viewOverview: () =>
    set((s) => ({
      selected: null,
      dissectMode: false,
      galleryOpen: false,
      timelineOpen: false,
      overviewNonce: s.overviewNonce + 1,
    })),
  setPanelWidth: (n) => set({ panelWidth: n }),
  setPanelHeightMobile: (n) => set({ panelHeightMobile: n }),
  setViewportMode: (mode) =>
    set((s) => (s.viewportMode === mode ? {} : { viewportMode: mode })),

  registerInteraction: () => set({ lastInteraction: Date.now() }),

  showCuriosity: (question) =>
    set((s) => ({
      pendingCuriosityQuestion: question,
      curiosityLog: [
        ...s.curiosityLog,
        {
          id: question.id,
          question: question.text,
          trigger: question.trigger,
          context: question.context,
          at: Date.now(),
          outcome: 'shown' as CuriosityOutcome,
        },
      ].slice(-60),
    })),

  resolveCuriosity: (outcome) =>
    set((s) => {
      const q = s.pendingCuriosityQuestion;
      if (!q) return {};
      const curiosityLog = s.curiosityLog.map((e) =>
        e.id === q.id ? { ...e, outcome } : e,
      );
      let dismissCount = s.dismissCount;
      let curiosityBackoffUntil = s.curiosityBackoffUntil;
      if (outcome === 'tapped') {
        dismissCount = 0;
      } else if (outcome === 'dismissed') {
        dismissCount += 1;
        // Three dismissals in a row — back off for two minutes.
        if (dismissCount >= 3) {
          curiosityBackoffUntil = Date.now() + 120_000;
          dismissCount = 0;
        }
      }
      return { pendingCuriosityQuestion: null, curiosityLog, dismissCount, curiosityBackoffUntil };
    }),

  toggleCuriosityLog: () => set((s) => ({ curiosityLogOpen: !s.curiosityLogOpen })),
  noteChatActivity: () => set({ lastChatAt: Date.now() }),
  noteAskedQuestion: (question) =>
    set((s) => ({ askedQuestions: [...s.askedQuestions, question].slice(-20) })),
  setCameraDistance: (distance) => set({ cameraDistance: distance }),
  bumpSurprise: () => set((s) => ({ surpriseNonce: s.surpriseNonce + 1 })),
}));
