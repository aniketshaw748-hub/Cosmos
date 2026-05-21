import { useEffect, useRef } from 'react';
import { useSceneStore } from '../store/useSceneStore';
import { milestoneAt } from '../data/timelineMilestones';
import { fetchCuriosityQuestions, loadTaste } from '../lib/curiousAi';
import type { CuriosityContext } from '../lib/curiousAi';
import type { CuriosityTrigger, SceneObject } from '../types';

/**
 * The Curious AI orchestrator. Mounted once, it watches how the user behaves
 * and — when curiosity has gone quiet — proactively generates a question they
 * didn't know to ask. Six triggers, one gentle nudge at a time.
 */

const TICK_MS = 1000;
/** Quiet window after a question is resolved, before another may appear. */
const COOLDOWN_MS = 25_000;
const IDLE_MS = 12_000; // trigger 1
const DISSECT_MS = 8_000; // trigger 2
const TIMELINE_MS = 6_000; // trigger 3
const ZOOM_DWELL_MS = 2_500; // trigger 4
const POST_CHAT_MS = 20_000; // trigger 5
/** Don't nudge right after a chat message (point 11). */
const CHAT_RECENT_MS = 5_000;
/** Camera-distance / radius thresholds for "way in" and "way out". */
const ZOOM_IN_RATIO = 2.7;
const ZOOM_OUT_RATIO = 24;

type ZoomZone = 'in' | 'out' | 'normal';
type SceneSnapshot = ReturnType<typeof useSceneStore.getState>;

let idSeq = 0;
const nextId = () => `cq-${Date.now().toString(36)}-${(idSeq++).toString(36)}`;
const norm = (s: string) => s.trim().toLowerCase();

function isTextEntry(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
}

/** A compact facts string for the question generator. */
function objectFacts(o: SceneObject): string {
  const stats = o.stats
    .slice(0, 4)
    .map((st) => `${st.label}: ${st.value}`)
    .join('; ');
  return `${o.blurb} ${stats}`.trim();
}

/** Where the camera sits relative to the focused object. */
function computeZoomZone(s: SceneSnapshot): ZoomZone {
  if (!s.selected || s.cameraDistance <= 0) return 'normal';
  const ratio = s.cameraDistance / Math.max(s.selected.radius, 0.001);
  if (ratio < ZOOM_IN_RATIO) return 'in';
  if (ratio > ZOOM_OUT_RATIO) return 'out';
  return 'normal';
}

/** Build the generation context for the current scene + trigger. */
function buildContext(
  s: SceneSnapshot,
  trigger: CuriosityTrigger,
  zone: ZoomZone,
): CuriosityContext | null {
  if (trigger === 'timeline' && s.timelineOpen) {
    const { milestone } = milestoneAt(s.timelinePosition);
    return {
      objectName: milestone.label,
      objectKind: 'moment in solar-system history',
      objectFacts: `${milestone.date}. ${milestone.description}`,
      dissected: false,
      timelineEra: milestone.id,
      zoom: 'normal',
      askedQuestions: s.askedQuestions.slice(-8),
      recentObjects: s.recentObjects.slice(0, 6),
      trigger,
      contextLabel: milestone.date,
    };
  }
  if (!s.selected) return null;
  const o = s.selected;
  return {
    objectName: o.name,
    objectKind: o.kind,
    objectFacts: objectFacts(o),
    dissected: s.dissectMode,
    timelineEra: null,
    zoom: zone,
    askedQuestions: s.askedQuestions.slice(-8),
    recentObjects: s.recentObjects.slice(0, 6),
    trigger,
    contextLabel: s.dissectMode ? `${o.name} · interior` : o.name,
  };
}

/** Choose a question, favouring ones the user hasn't already seen. */
function pickQuestion(questions: string[], asked: string[]): string | null {
  if (questions.length === 0) return null;
  const taste = loadTaste();
  const seen = new Set([...asked, ...taste.tapped, ...taste.dismissed].map(norm));
  const fresh = questions.filter((q) => !seen.has(norm(q)));
  const pool = fresh.length > 0 ? fresh : questions;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function useCuriousAi(): void {
  const surpriseNonce = useSceneStore((s) => s.surpriseNonce);
  const pending = useSceneStore((s) => s.pendingCuriosityQuestion);
  const selectedId = useSceneStore((s) => s.selected?.id);
  const timelineOpen = useSceneStore((s) => s.timelineOpen);

  // Transient timing — refs so the 1s tick doesn't churn the component.
  const generating = useRef(false);
  const cooldownUntil = useRef(0);
  const dissectSince = useRef(0);
  const eraIndex = useRef(-1);
  const eraSince = useRef(0);
  const zoomZone = useRef<ZoomZone>('normal');
  const zoomSince = useRef(0);
  const typing = useRef(false);
  const firedKeys = useRef<Record<string, string>>({});
  const prevPending = useRef(false);

  // Generate a question and surface it. Reads all state fresh via getState().
  const fire = async (trigger: CuriosityTrigger, key: string) => {
    if (generating.current) return;
    const before = useSceneStore.getState();
    if (before.pendingCuriosityQuestion) return;
    if (Date.now() < before.curiosityBackoffUntil) return;

    generating.current = true;
    // Mark fired up-front so a slow request can't be re-triggered mid-flight.
    firedKeys.current[trigger] = key;
    try {
      const ctx = buildContext(before, trigger, zoomZone.current);
      if (!ctx) return;
      const questions = await fetchCuriosityQuestions(ctx);
      const text = pickQuestion(questions, before.askedQuestions);
      if (!text) return;

      // Re-check guards — the scene may have moved on during the request.
      const after = useSceneStore.getState();
      if (after.pendingCuriosityQuestion) return;
      if (Date.now() < after.curiosityBackoffUntil) return;
      after.showCuriosity({ id: nextId(), text, trigger, context: ctx.contextLabel });
    } finally {
      generating.current = false;
    }
  };
  const fireRef = useRef(fire);
  fireRef.current = fire;

  // Find the highest-priority trigger whose condition is currently satisfied.
  const pickTrigger = (
    s: SceneSnapshot,
    now: number,
  ): { trigger: CuriosityTrigger; key: string } | null => {
    // 2 — looking inside a dissected body
    if (
      s.selected &&
      s.dissectMode &&
      dissectSince.current > 0 &&
      now - dissectSince.current > DISSECT_MS
    ) {
      const key = `${s.selected.id}:${dissectSince.current}`;
      if (firedKeys.current.dissection !== key) return { trigger: 'dissection', key };
    }
    // 3 — paused on a timeline era
    if (s.timelineOpen && eraSince.current > 0 && now - eraSince.current > TIMELINE_MS) {
      const key = `era${eraIndex.current}:${eraSince.current}`;
      if (firedKeys.current.timeline !== key) return { trigger: 'timeline', key };
    }
    // 4 — zoomed way in or way out
    if (
      s.selected &&
      zoomZone.current !== 'normal' &&
      now - zoomSince.current > ZOOM_DWELL_MS
    ) {
      const key = `${s.selected.id}:${zoomZone.current}:${zoomSince.current}`;
      if (firedKeys.current.zoom !== key) return { trigger: 'zoom', key };
    }
    // 5 — a finished chat exchange gone quiet
    if (s.selected && s.lastChatAt > 0 && now - s.lastChatAt > POST_CHAT_MS) {
      const key = `${s.selected.id}:${s.lastChatAt}`;
      if (firedKeys.current['post-chat'] !== key) return { trigger: 'post-chat', key };
    }
    // 1 — selected and simply untouched
    if (s.selected && now - s.lastInteraction > IDLE_MS) {
      const key = `${s.selected.id}:${s.lastInteraction}`;
      if (firedKeys.current.idle !== key) return { trigger: 'idle', key };
    }
    return null;
  };

  // The 1-second evaluation loop.
  const evaluate = () => {
    const s = useSceneStore.getState();
    const now = Date.now();

    // --- maintain dwell timers (always, even while a question is up) ---
    if (s.dissectMode) {
      if (dissectSince.current === 0) dissectSince.current = now;
    } else {
      dissectSince.current = 0;
    }
    if (s.timelineOpen) {
      const { index } = milestoneAt(s.timelinePosition);
      if (index !== eraIndex.current) {
        eraIndex.current = index;
        eraSince.current = now;
      }
    } else {
      eraIndex.current = -1;
      eraSince.current = 0;
    }
    const zone = computeZoomZone(s);
    if (zone !== zoomZone.current) {
      zoomZone.current = zone;
      zoomSince.current = now;
    }

    // --- guards (point 11) ---
    if (generating.current) return;
    if (s.pendingCuriosityQuestion) return;
    if (now < cooldownUntil.current) return;
    if (now < s.curiosityBackoffUntil) return;
    if (typing.current) return;
    if (s.lastChatAt > 0 && now - s.lastChatAt < CHAT_RECENT_MS) return;

    const candidate = pickTrigger(s, now);
    if (candidate) void fireRef.current(candidate.trigger, candidate.key);
  };
  const evaluateRef = useRef(evaluate);
  evaluateRef.current = evaluate;

  // Track interaction (resets idle) and whether the user is typing.
  useEffect(() => {
    // Throttle — a fast scroll-zoom fires many wheel events a second.
    let lastReg = 0;
    const interact = () => {
      const now = Date.now();
      if (now - lastReg < 300) return;
      lastReg = now;
      useSceneStore.getState().registerInteraction();
    };
    const onFocusIn = (e: FocusEvent) => {
      typing.current = isTextEntry(e.target);
    };
    const onFocusOut = () => {
      typing.current = false;
    };
    window.addEventListener('pointerdown', interact);
    window.addEventListener('keydown', interact);
    window.addEventListener('wheel', interact, { passive: true });
    window.addEventListener('focusin', onFocusIn);
    window.addEventListener('focusout', onFocusOut);
    return () => {
      window.removeEventListener('pointerdown', interact);
      window.removeEventListener('keydown', interact);
      window.removeEventListener('wheel', interact);
      window.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  // The evaluation loop.
  useEffect(() => {
    const id = window.setInterval(() => evaluateRef.current(), TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  // Start the cooldown once a surfaced question has been resolved.
  useEffect(() => {
    const has = pending !== null;
    if (prevPending.current && !has) {
      cooldownUntil.current = Date.now() + COOLDOWN_MS;
    }
    prevPending.current = has;
  }, [pending]);

  // A context switch (new object / timeline) drops any stale nudge.
  useEffect(() => {
    const s = useSceneStore.getState();
    if (s.pendingCuriosityQuestion) s.resolveCuriosity('ignored');
  }, [selectedId, timelineOpen]);

  // Trigger 6 — "Surprise me" reveals a question with the new object.
  useEffect(() => {
    if (surpriseNonce === 0) return;
    const s = useSceneStore.getState();
    if (!s.selected) return;
    void fireRef.current('surprise', `${s.selected.id}:surprise:${surpriseNonce}`);
  }, [surpriseNonce]);
}
