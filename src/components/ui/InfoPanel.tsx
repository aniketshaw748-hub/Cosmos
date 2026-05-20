import { useEffect, useState } from 'react';
import { useSceneStore } from '../../store/useSceneStore';
import type { SceneObject } from '../../types';
import { ChatBox } from './ChatBox';
import { DissectButton } from './DissectButton';

/** Accent colour per object kind. */
const ACCENT: Record<SceneObject['kind'], string> = {
  star: '#ffb74d',
  planet: '#5b8cff',
  asteroid: '#9aa7bd',
  moon: '#bcccdc',
};

/**
 * Slide-in panel for the selected object: real-world stats plus the AI tutor.
 * Stays mounted and translates off screen when nothing is selected, retaining
 * the last object so the slide-out animation has content to show.
 */
export function InfoPanel() {
  const selected = useSceneStore((s) => s.selected);
  const deselect = useSceneStore((s) => s.deselect);
  const setGalleryOpen = useSceneStore((s) => s.setGalleryOpen);
  const [shown, setShown] = useState<SceneObject | null>(selected);

  useEffect(() => {
    if (selected) setShown(selected);
  }, [selected]);

  const open = selected !== null;
  const accent = shown ? ACCENT[shown.kind] : ACCENT.planet;

  return (
    <aside
      aria-hidden={!open}
      className={`pointer-events-auto absolute right-0 top-0 z-20 flex h-full w-[clamp(380px,38vw,560px)] max-w-[94vw] flex-col border-l border-white/10 bg-[#0a0d16]/90 shadow-2xl backdrop-blur-xl transition-transform duration-[420ms] ease-out ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {shown && (
        <>
          {/* Header */}
          <header className="relative shrink-0 px-6 pb-4 pt-6">
            <div
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
            />
            <button
              onClick={deselect}
              aria-label="Close panel"
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-lg leading-none text-white/60 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
            >
              ×
            </button>
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: accent }}
            >
              {shown.kind}
            </span>
            <h2 className="mt-1.5 text-3xl font-semibold tracking-tight text-white">
              {shown.name}
            </h2>
            <p className="mt-2 max-w-[310px] text-sm leading-relaxed text-white/55">
              {shown.blurb}
            </p>
          </header>

          {/* Actions */}
          <div className="flex shrink-0 flex-wrap gap-2 px-6 pb-3">
            {shown.kind === 'planet' && <DissectButton />}
            <button
              onClick={() => setGalleryOpen(true)}
              className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/75 transition hover:border-white/30 hover:text-white"
            >
              View NASA Photos
            </button>
          </div>

          {/* Quick facts */}
          <div className="shrink-0 border-b border-white/[0.06] px-6 pb-4">
            <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
              Quick facts
            </h3>
            <dl className="grid grid-cols-2 gap-x-5">
              {shown.stats.map((stat) => (
                <div key={stat.label} className="flex flex-col border-b border-white/[0.05] py-1.5">
                  <dt className="text-[10px] uppercase tracking-wider text-white/35">
                    {stat.label}
                  </dt>
                  <dd className="text-[13px] font-medium text-white/90">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* AI tutor */}
          <ChatBox key={shown.id} object={shown} accent={accent} />
        </>
      )}
    </aside>
  );
}
