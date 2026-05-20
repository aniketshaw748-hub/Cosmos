import { useEffect, useState } from 'react';
import { useSceneStore } from '../../store/useSceneStore';
import { fetchApod } from '../../lib/nasa';
import type { ApodData } from '../../types';

type Status = 'loading' | 'ready' | 'error';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/** Full-screen landing splash featuring NASA's Astronomy Picture of the Day. */
export function DailyHero() {
  const landingVisible = useSceneStore((s) => s.landingVisible);
  const dismissLanding = useSceneStore((s) => s.dismissLanding);
  const [apod, setApod] = useState<ApodData | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let alive = true;
    fetchApod()
      .then((data) => {
        if (!alive) return;
        setApod(data);
        setStatus('ready');
      })
      .catch(() => alive && setStatus('error'));
    return () => {
      alive = false;
    };
  }, []);

  if (!landingVisible) return null;

  const background =
    apod?.mediaType === 'image' ? apod.url : (apod?.thumbnailUrl ?? null);
  const explanation =
    apod && apod.explanation.length > 230
      ? `${apod.explanation.slice(0, 230).trimEnd()}…`
      : apod?.explanation;

  return (
    <div className="absolute inset-0 z-50 overflow-hidden bg-[#05060a]">
      {/* APOD backdrop */}
      {background && (
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-70 blur-[1px]"
          style={{ backgroundImage: `url(${background})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#05060a] via-[#05060a]/85 to-[#05060a]/55" />

      {/* Content */}
      <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-300/80">
          {status === 'ready' && apod
            ? `NASA Picture of the Day · ${formatDate(apod.date)}`
            : 'A 3D AI Space Explorer'}
        </p>

        <h1 className="bg-gradient-to-b from-white via-white to-indigo-200/70 bg-clip-text text-7xl font-bold tracking-tight text-transparent sm:text-8xl">
          Cosmos
        </h1>

        <p className="mt-4 max-w-md text-base leading-relaxed text-white/65">
          Explore the solar system in 3D. Click any world, the Sun, or a real
          asteroid — and ask an AI tutor anything.
        </p>

        {/* APOD card */}
        <div className="mt-9 min-h-[112px] w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left backdrop-blur-md">
          {status === 'loading' && (
            <div className="flex items-center gap-3 text-sm text-white/55">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white/80" />
              Pulling today’s view of the cosmos from NASA…
            </div>
          )}
          {status === 'error' && (
            <p className="text-sm text-white/55">
              Live NASA imagery is taking a moment — the system is still ready to
              explore.
            </p>
          )}
          {status === 'ready' && apod && (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/70">
                Today’s sky
              </p>
              <h2 className="mt-1 text-lg font-semibold leading-snug text-white">
                {apod.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-white/55">{explanation}</p>
              {apod.copyright && (
                <p className="mt-2 text-[11px] text-white/35">© {apod.copyright}</p>
              )}
            </>
          )}
        </div>

        <button
          onClick={dismissLanding}
          className="group mt-9 flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-[#05060a] shadow-[0_0_40px_-8px_rgba(255,255,255,0.6)] transition hover:scale-[1.04] hover:shadow-[0_0_55px_-6px_rgba(255,255,255,0.8)]"
        >
          Explore the system
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>

        <p className="mt-5 text-xs text-white/35">Best experienced on desktop</p>
      </div>
    </div>
  );
}
