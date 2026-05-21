import { useEffect } from 'react';
import { useSceneStore } from '../../store/useSceneStore';
import { recordTaste } from '../../lib/curiousAi';
import type { CuriosityTrigger } from '../../types';

/** Auto-dismiss an ignored nudge after this long (point 8). */
const AUTO_DISMISS_MS = 20_000;

/** A soft "leaning in to whisper" intro, tuned to what the user was doing. */
const WHISPER: Record<CuriosityTrigger, string> = {
  idle: 'You went quiet — so here’s a thought',
  dissection: 'Since you’re looking inside',
  timeline: 'About this moment in history',
  zoom: 'A thought from this view',
  'post-chat': 'One more rabbit hole',
  surprise: 'While this one is here',
};

/**
 * The Curious AI nudge — a small, non-intrusive bubble near the chat input
 * that surfaces a question the user didn't know to ask. Tapping it sends the
 * question on; the × dismisses it; it fades itself out after 20s if ignored.
 */
export function CuriosityNudge({
  accent = '#7cc4ff',
  onAccept,
}: {
  accent?: string;
  onAccept: (question: string) => void;
}) {
  const pending = useSceneStore((s) => s.pendingCuriosityQuestion);
  const resolveCuriosity = useSceneStore((s) => s.resolveCuriosity);

  // Fade out on its own if the user simply ignores it.
  useEffect(() => {
    if (!pending) return;
    const t = window.setTimeout(() => resolveCuriosity('ignored'), AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [pending, resolveCuriosity]);

  if (!pending) return null;

  const accept = () => {
    recordTaste('tapped', pending.text);
    resolveCuriosity('tapped');
    onAccept(pending.text);
  };
  const dismiss = () => {
    recordTaste('dismissed', pending.text);
    resolveCuriosity('dismissed');
  };

  return (
    <div
      key={pending.id}
      className="shrink-0 px-3 pt-2"
      style={{ animation: 'cosmos-nudge-in 0.45s cubic-bezier(0.22, 1, 0.36, 1)' }}
    >
      <div
        className="flex items-start gap-2 rounded-xl border px-3 py-2"
        style={{ borderColor: `${accent}55`, background: `${accent}14` }}
      >
        <span className="mt-0.5 shrink-0 text-sm" style={{ color: accent }} aria-hidden>
          ✦
        </span>
        <button onClick={accept} className="min-w-0 flex-1 text-left">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
            {WHISPER[pending.trigger]}
          </span>
          <span className="mt-0.5 block text-[13px] font-medium leading-snug text-white/90">
            {pending.text}
          </span>
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss suggestion"
          title="Dismiss"
          className="-mr-1 -mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-sm leading-none text-white/35 transition hover:bg-white/10 hover:text-white/80"
        >
          ×
        </button>
      </div>
    </div>
  );
}
