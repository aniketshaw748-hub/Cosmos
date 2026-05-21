import { useSceneStore } from '../../store/useSceneStore';
import type { CuriosityTrigger, CuriosityOutcome } from '../../types';

/** What the AI noticed, in the user's words — the proof it's watching. */
const TRIGGER_LABEL: Record<CuriosityTrigger, string> = {
  idle: 'Noticed you paused',
  dissection: 'Saw you looking inside',
  timeline: 'Saw you pause in history',
  zoom: 'Noticed your zoom',
  'post-chat': 'After your last question',
  surprise: 'On a surprise reveal',
};

const OUTCOME_STYLE: Record<CuriosityOutcome, { label: string; cls: string }> = {
  shown: { label: 'Shown', cls: 'border-white/15 text-white/45' },
  tapped: { label: 'Explored', cls: 'border-emerald-400/40 text-emerald-300' },
  dismissed: { label: 'Dismissed', cls: 'border-rose-400/30 text-rose-300/80' },
  ignored: { label: 'Faded', cls: 'border-white/10 text-white/35' },
};

function timeAgo(ts: number): string {
  const secs = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (secs < 60) return `${secs}s ago`;
  return `${Math.round(secs / 60)}m ago`;
}

/**
 * The demo session history — every question the Curious AI surfaced, with the
 * behaviour that triggered it. The pitch moment: "I didn't ask it; it asked me."
 */
export function CuriosityLog() {
  const open = useSceneStore((s) => s.curiosityLogOpen);
  const log = useSceneStore((s) => s.curiosityLog);
  const toggle = useSceneStore((s) => s.toggleCuriosityLog);

  if (!open) return null;

  const entries = [...log].reverse();
  const tapped = log.filter((e) => e.outcome === 'tapped').length;

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={toggle}
    >
      <div
        className="flex max-h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#0b0e17] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-white">
              <span className="text-sky-300">✦</span> Curiosity Log
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-white/50">
              {log.length === 0
                ? 'Questions Cosmos asks you — unprompted — will appear here.'
                : `Cosmos noticed what you were doing and asked you ${log.length} question${
                    log.length === 1 ? '' : 's'
                  } you didn’t think to ask${tapped ? ` — you explored ${tapped}` : ''}.`}
            </p>
          </div>
          <button
            onClick={toggle}
            aria-label="Close curiosity log"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-lg text-white/60 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="cosmos-scroll min-h-0 flex-1 overflow-y-auto px-5 py-3">
          {entries.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-white/40">
              Nothing yet — keep exploring, and the AI will start to wonder out loud.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {entries.map((e) => {
                const outcome = OUTCOME_STYLE[e.outcome];
                return (
                  <li
                    key={e.id}
                    className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5"
                  >
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300/70">
                        {TRIGGER_LABEL[e.trigger]}
                      </span>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${outcome.cls}`}
                      >
                        {outcome.label}
                      </span>
                    </div>
                    <p className="text-[13px] font-medium leading-snug text-white/90">
                      {e.question}
                    </p>
                    <p className="mt-1 text-[11px] text-white/35">
                      {e.context} · {timeAgo(e.at)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
