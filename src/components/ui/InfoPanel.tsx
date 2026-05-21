import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useSceneStore } from '../../store/useSceneStore';
import type { SceneObject } from '../../types';
import { ChatBox } from './ChatBox';
import { DissectButton } from './DissectButton';
import { getMoonsByPlanet } from '../../data/moons';
import { moonToSceneObject } from '../../lib/sceneObject';
import { useViewportMode, useVisualViewport } from '../../hooks/useMobileLayout';

/** Accent colour per object kind. */
const ACCENT: Record<SceneObject['kind'], string> = {
  star: '#ffb74d',
  planet: '#5b8cff',
  asteroid: '#9aa7bd',
  moon: '#bcccdc',
};

/**
 * Slide-in panel for the selected object: stats, actions and the AI tutor.
 * Three responsive layouts — docked right (desktop), docked bottom (portrait
 * phones), docked right and compact (landscape phones).
 */
export function InfoPanel() {
  const selected = useSceneStore((s) => s.selected);
  const deselect = useSceneStore((s) => s.deselect);
  const select = useSceneStore((s) => s.select);
  const setGalleryOpen = useSceneStore((s) => s.setGalleryOpen);
  const chatExpanded = useSceneStore((s) => s.chatExpanded);
  const [shown, setShown] = useState<SceneObject | null>(selected);

  const mode = useViewportMode();
  const { height: vvHeight, keyboard } = useVisualViewport();

  useEffect(() => {
    if (selected) setShown(selected);
  }, [selected]);

  const open = selected !== null;
  const accent = shown ? ACCENT[shown.kind] : ACCENT.planet;
  const moons = shown?.kind === 'planet' ? getMoonsByPlanet(shown.id) : [];

  const isPortrait = mode === 'mobile-portrait';
  const isLandscape = mode === 'mobile-landscape';
  const compact = isLandscape;
  // Hide the stat / action sections when the chat is expanded, or when the
  // keyboard is open on a portrait phone (so the chat + input stay visible).
  const hideSections = chatExpanded || (isPortrait && keyboard > 0);

  let panelStyle: CSSProperties | undefined;
  if (isPortrait) {
    panelStyle = {
      bottom: keyboard,
      height:
        keyboard > 0
          ? Math.max(vvHeight - 12, 240)
          : Math.round(vvHeight * (chatExpanded ? 0.86 : 0.58)),
    };
  } else if (isLandscape && keyboard > 0) {
    panelStyle = { height: vvHeight };
  }

  const base =
    'pointer-events-auto absolute z-20 flex flex-col border-white/10 shadow-2xl transition-all ease-out';
  let layout: string;
  if (isPortrait) {
    layout = `inset-x-0 bottom-0 w-full border-t bg-[#0b0e17] duration-[360ms] ${
      open ? 'translate-y-0' : 'translate-y-full'
    }`;
  } else if (isLandscape) {
    layout = `right-0 top-0 h-full w-[56vw] min-w-[320px] border-l bg-[#0b0e17] duration-300 ${
      open ? 'translate-x-0' : 'translate-x-full'
    }`;
  } else {
    layout = `right-0 top-0 h-full w-[clamp(380px,38vw,560px)] max-w-[94vw] border-l bg-[#0a0d16]/90 backdrop-blur-xl duration-[420ms] ${
      open ? 'translate-x-0' : 'translate-x-full'
    }`;
  }

  return (
    <aside aria-hidden={!open} className={`${base} ${layout}`} style={panelStyle}>
      {shown && (
        <>
          <header
            className={`relative shrink-0 ${compact ? 'px-4 pb-2 pt-3' : 'px-6 pb-4 pt-6'}`}
          >
            <div
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
            />
            <button
              onClick={deselect}
              aria-label="Close panel"
              className={`absolute flex items-center justify-center rounded-full border border-white/10 leading-none text-white/60 transition hover:border-white/30 hover:bg-white/10 hover:text-white ${
                compact ? 'right-3 top-2.5 h-7 w-7 text-base' : 'right-5 top-5 h-8 w-8 text-lg'
              }`}
            >
              ×
            </button>
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: accent }}
            >
              {shown.kind}
            </span>
            <h2
              className={`mt-1 font-semibold tracking-tight text-white ${
                compact ? 'text-xl' : 'text-2xl sm:text-3xl'
              }`}
            >
              {shown.name}
            </h2>
            {!compact && (
              <p className="mt-2 max-w-[320px] text-sm leading-relaxed text-white/55">
                {shown.blurb}
              </p>
            )}
          </header>

          {!hideSections && (
            <>
              {/* Actions */}
              <div
                className={`flex shrink-0 flex-wrap gap-2 ${compact ? 'px-4 pb-2' : 'px-6 pb-3'}`}
              >
                <DissectButton />
                <button
                  onClick={() => setGalleryOpen(true)}
                  className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/75 transition hover:border-white/30 hover:text-white"
                >
                  View NASA Photos
                </button>
              </div>

              {/* Quick facts */}
              <div
                className={`shrink-0 border-b border-white/[0.06] ${
                  compact ? 'px-4 pb-2' : 'px-6 pb-4'
                }`}
              >
                {!compact && (
                  <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
                    Quick facts
                  </h3>
                )}
                {compact ? (
                  <div className="flex gap-4 overflow-x-auto pb-1">
                    {shown.stats.map((stat) => (
                      <div key={stat.label} className="shrink-0">
                        <dt className="text-[9px] uppercase tracking-wider text-white/35">
                          {stat.label}
                        </dt>
                        <dd className="text-[12px] font-medium text-white/90">{stat.value}</dd>
                      </div>
                    ))}
                  </div>
                ) : (
                  <dl className="grid grid-cols-2 gap-x-5">
                    {shown.stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="flex flex-col border-b border-white/[0.05] py-1.5"
                      >
                        <dt className="text-[10px] uppercase tracking-wider text-white/35">
                          {stat.label}
                        </dt>
                        <dd className="text-[13px] font-medium text-white/90">{stat.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>

              {/* Moons */}
              {moons.length > 0 && (
                <div
                  className={`shrink-0 border-b border-white/[0.06] ${
                    compact ? 'px-4 py-2' : 'px-6 py-3'
                  }`}
                >
                  <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
                    Moons · {moons.length}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {moons.map((moon) => (
                      <button
                        key={moon.id}
                        onClick={() => select(moonToSceneObject(moon, [0, 0, 0]))}
                        className="rounded-md border border-white/12 bg-white/[0.04] px-2 py-1 text-xs text-white/75 transition hover:border-white/30 hover:text-white"
                      >
                        {moon.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* AI tutor */}
          <ChatBox key={shown.id} object={shown} accent={accent} />
        </>
      )}
    </aside>
  );
}
