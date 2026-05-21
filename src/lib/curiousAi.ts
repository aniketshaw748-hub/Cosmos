import type { CuriosityTrigger } from '../types';

/**
 * Client for the Curious AI endpoint. Generated questions are cached per
 * (object × scene state) for 24 hours so idle exploration never hammers the
 * API, and the user's taste (tapped vs dismissed) is remembered so questions
 * drift toward what they like.
 */

export interface CuriosityContext {
  objectName: string;
  objectKind: string;
  objectFacts: string;
  dissected: boolean;
  /** timeline milestone id, or null when not in timeline mode */
  timelineEra: string | null;
  zoom: 'in' | 'out' | 'normal';
  askedQuestions: string[];
  recentObjects: string[];
  trigger: CuriosityTrigger;
  /** short human label of the context, for the session log */
  contextLabel: string;
}

interface Taste {
  tapped: string[];
  dismissed: string[];
}

const CACHE_KEY = 'cosmos_curiosity_cache';
const TASTE_KEY = 'cosmos_curiosity_taste';
const CACHE_TTL = 24 * 60 * 60 * 1000;

interface CacheEntry {
  questions: string[];
  ts: number;
}

/** Cache signature — questions vary by object and the relevant scene state. */
function cacheSig(c: CuriosityContext): string {
  return [c.objectName, c.dissected ? 'dissected' : 'whole', c.timelineEra ?? '', c.zoom].join('|');
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — caching is best-effort */
  }
}

/** The user's remembered taste — which questions they tapped vs dismissed. */
export function loadTaste(): Taste {
  const t = readJson<Partial<Taste>>(TASTE_KEY, {});
  return { tapped: t.tapped ?? [], dismissed: t.dismissed ?? [] };
}

/** Record that the user tapped or dismissed a question, to learn their taste. */
export function recordTaste(kind: 'tapped' | 'dismissed', question: string): void {
  const taste = loadTaste();
  const list = taste[kind];
  if (!list.some((q) => q.toLowerCase() === question.toLowerCase())) {
    list.push(question);
  }
  // Keep the lists bounded so the prompt stays small.
  writeJson(TASTE_KEY, {
    tapped: taste.tapped.slice(-12),
    dismissed: taste.dismissed.slice(-12),
  });
}

/**
 * Fetch curiosity questions for the given context — served from the 24-hour
 * cache when possible. Returns [] on any failure (a missing nudge is harmless).
 */
export async function fetchCuriosityQuestions(c: CuriosityContext): Promise<string[]> {
  const sig = cacheSig(c);
  const cache = readJson<Record<string, CacheEntry>>(CACHE_KEY, {});
  const hit = cache[sig];
  if (hit && Date.now() - hit.ts < CACHE_TTL && hit.questions.length > 0) {
    return hit.questions;
  }

  try {
    const res = await fetch('/api/curious', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        objectName: c.objectName,
        objectKind: c.objectKind,
        objectFacts: c.objectFacts,
        dissected: c.dissected,
        zoom: c.zoom,
        trigger: c.trigger,
        askedQuestions: c.askedQuestions,
        recentObjects: c.recentObjects,
        taste: loadTaste(),
      }),
    });
    if (!res.ok) return hit?.questions ?? [];

    const data = (await res.json()) as { questions?: string[] };
    const questions = (data.questions ?? []).filter((q) => typeof q === 'string' && q.length > 0);
    if (questions.length > 0) {
      cache[sig] = { questions, ts: Date.now() };
      writeJson(CACHE_KEY, cache);
    }
    return questions.length > 0 ? questions : (hit?.questions ?? []);
  } catch {
    return hit?.questions ?? [];
  }
}
