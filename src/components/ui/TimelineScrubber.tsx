import { useEffect, useState } from 'react';
import { useSceneStore } from '../../store/useSceneStore';
import { MILESTONES, milestoneAt, positionForIndex } from '../../data/timelineMilestones';
import { askTutor } from '../../lib/ai';
import { CuriosityNudge } from './CuriosityNudge';

/** Seconds for the Play button to traverse the whole 4.6-billion-year timeline. */
const PLAY_DURATION = 60;

/**
 * Feature 7 — a scrubbable timeline of solar-system history. Each of the 14
 * milestones gets equal scrubber space (a piecewise scale, so deep-past and
 * recent events are equally reachable). The scene state and an AI-written
 * explanation update as the user scrubs.
 */
export function TimelineScrubber() {
  const open = useSceneStore((s) => s.timelineOpen);
  const position = useSceneStore((s) => s.timelinePosition);
  const setPosition = useSceneStore((s) => s.setTimelinePosition);
  const setOpen = useSceneStore((s) => s.setTimelineOpen);

  const [playing, setPlaying] = useState(false);
  const [aiText, setAiText] = useState<Record<string, string>>({});
  const [curiousQA, setCuriousQA] = useState<{ question: string; answer: string | null } | null>(
    null,
  );

  const { milestone, index } = milestoneAt(position);

  // Play — auto-advance the scrubber.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const next = Math.min(1, useSceneStore.getState().timelinePosition + dt / PLAY_DURATION);
      setPosition(next);
      if (next >= 1) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, setPosition]);

  // Fetch a vivid AI explanation for the current milestone (debounced, cached).
  useEffect(() => {
    if (!open || aiText[milestone.id]) return;
    const t = setTimeout(() => {
      askTutor(
        milestone.label,
        { date: milestone.date, summary: milestone.description },
        'In two short, vivid paragraphs, explain what is happening at this moment in the solar system’s history and why it matters.',
        [],
      )
        .then((text) => setAiText((prev) => ({ ...prev, [milestone.id]: text })))
        .catch(() => undefined);
    }, 650);
    return () => clearTimeout(t);
  }, [open, milestone.id, milestone.label, milestone.date, milestone.description, aiText]);

  // Scrubbing to a new era clears any curiosity Q&A from the previous one.
  useEffect(() => {
    setCuriousQA(null);
  }, [milestone.id]);

  /** Answer a tapped curiosity question inline, inside the era card. */
  const askCurious = (question: string) => {
    setCuriousQA({ question, answer: null });
    askTutor(milestone.label, { date: milestone.date, summary: milestone.description }, question, [])
      .then((text) => setCuriousQA({ question, answer: text }))
      .catch(() =>
        setCuriousQA({
          question,
          answer: 'The tutor could not answer that just now — please try again.',
        }),
      );
  };

  if (!open) return null;

  const explanation = aiText[milestone.id];

  return (
    <div className="pointer-events-auto absolute bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#0a0d16]/92 backdrop-blur-xl">
      <div className="mx-auto max-w-4xl px-6 py-4">
        {/* Era card */}
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/70">
              {milestone.date}
            </p>
            <h3 className="text-lg font-semibold text-white">{milestone.label}</h3>
            <p className="mt-1 max-h-24 overflow-y-auto text-[13px] leading-relaxed text-white/60">
              {explanation ?? milestone.description}
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close timeline"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-lg text-white/60 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        </div>

        {/* Curiosity Q&A — a tapped curiosity question, answered inline. */}
        {curiousQA && (
          <div className="mb-3 rounded-xl border border-sky-400/25 bg-sky-400/[0.07] px-4 py-2.5">
            <p className="text-[12px] font-semibold text-sky-200">{curiousQA.question}</p>
            {curiousQA.answer === null ? (
              <p className="mt-1 text-[12px] italic text-white/45">Cosmos is thinking…</p>
            ) : (
              <p className="mt-1 max-h-28 overflow-y-auto whitespace-pre-wrap text-[12.5px] leading-relaxed text-white/75">
                {curiousQA.answer}
              </p>
            )}
          </div>
        )}

        {/* Curious AI nudge — a question about the era the user paused on. */}
        <CuriosityNudge accent="#7cc4ff" onAccept={askCurious} />

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="shrink-0 rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold text-[#05060a] transition hover:bg-white"
          >
            {playing ? 'Pause' : 'Play'}
          </button>

          <div className="relative flex-1 py-2">
            {/* Milestone notches */}
            {MILESTONES.map((m, i) => {
              const isCurrent = i === index;
              return (
                <button
                  key={m.id}
                  title={`${m.label} — ${m.date}`}
                  onClick={() => {
                    setPlaying(false);
                    setPosition(positionForIndex(i));
                  }}
                  className="absolute top-1/2 z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border transition"
                  style={{
                    left: `${positionForIndex(i) * 100}%`,
                    background: isCurrent ? '#7cc4ff' : '#1a2233',
                    borderColor: isCurrent ? '#7cc4ff' : 'rgba(255,255,255,0.25)',
                  }}
                />
              );
            })}
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={position}
              onChange={(e) => {
                setPlaying(false);
                setPosition(Number(e.target.value));
              }}
              aria-label="Timeline position"
              className="relative w-full cursor-pointer accent-sky-400"
            />
          </div>

          <button
            onClick={() => {
              setPlaying(false);
              setPosition(1);
            }}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Reset to today
          </button>
        </div>
      </div>
    </div>
  );
}
