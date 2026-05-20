import { useSceneStore } from '../../store/useSceneStore';
import { ALL_BODIES } from '../../data/planets';
import { bodyToSceneObject } from '../../lib/sceneObject';

/** On-screen overlay: wordmark, "surprise me", pause toggle and a hint. */
export function Hud() {
  const paused = useSceneStore((s) => s.paused);
  const togglePaused = useSceneStore((s) => s.togglePaused);
  const select = useSceneStore((s) => s.select);
  const selectedId = useSceneStore((s) => s.selected?.id);
  const landingVisible = useSceneStore((s) => s.landingVisible);

  if (landingVisible) return null;

  const surpriseMe = () => {
    const pool = ALL_BODIES.filter((b) => b.id !== selectedId);
    const body = pool[Math.floor(Math.random() * pool.length)];
    select(bodyToSceneObject(body));
  };

  return (
    <>
      {/* Wordmark */}
      <div className="pointer-events-none absolute left-6 top-5 z-20 flex items-center gap-2">
        <span className="text-base text-white/80">✦</span>
        <span className="text-sm font-semibold tracking-[0.22em] text-white/85">COSMOS</span>
      </div>

      {/* Control bar */}
      <div className="pointer-events-auto absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-[#0a0d16]/80 p-1.5 backdrop-blur-md">
        <button
          onClick={surpriseMe}
          className="rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold text-[#05060a] transition hover:bg-white"
        >
          Surprise me
        </button>
        <button
          onClick={togglePaused}
          className="rounded-full px-4 py-1.5 text-xs font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          {paused ? 'Resume' : 'Pause'}
        </button>
        <span className="hidden px-2 text-[11px] text-white/35 md:inline">
          Drag to orbit · Scroll to zoom · Space to pause
        </span>
      </div>
    </>
  );
}
