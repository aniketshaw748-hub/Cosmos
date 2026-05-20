import { useSceneStore } from '../../store/useSceneStore';
import { ALL_BODIES } from '../../data/planets';
import { bodyToSceneObject } from '../../lib/sceneObject';

/** On-screen overlay: wordmark, "surprise me", timeline, pause and quality. */
export function Hud() {
  const paused = useSceneStore((s) => s.paused);
  const togglePaused = useSceneStore((s) => s.togglePaused);
  const select = useSceneStore((s) => s.select);
  const deselect = useSceneStore((s) => s.deselect);
  const selectedId = useSceneStore((s) => s.selected?.id);
  const landingVisible = useSceneStore((s) => s.landingVisible);
  const highQuality = useSceneStore((s) => s.highQuality);
  const toggleHighQuality = useSceneStore((s) => s.toggleHighQuality);
  const timelineOpen = useSceneStore((s) => s.timelineOpen);
  const setTimelineOpen = useSceneStore((s) => s.setTimelineOpen);
  const viewOverview = useSceneStore((s) => s.viewOverview);

  if (landingVisible) return null;

  const surpriseMe = () => {
    const pool = ALL_BODIES.filter((b) => b.id !== selectedId);
    const body = pool[Math.floor(Math.random() * pool.length)];
    select(bodyToSceneObject(body));
  };

  const openTimeline = () => {
    deselect();
    setTimelineOpen(true);
  };

  return (
    <>
      {/* Wordmark */}
      <div className="pointer-events-none absolute left-6 top-5 z-20 flex items-center gap-2">
        <span className="text-base text-white/80">✦</span>
        <span className="text-sm font-semibold tracking-[0.22em] text-white/85">COSMOS</span>
      </div>

      {/* Control bar — hidden while the timeline panel occupies the bottom. */}
      {!timelineOpen && (
        <div className="pointer-events-auto absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-[#0a0d16]/80 p-1.5 backdrop-blur-md">
          <button
            onClick={surpriseMe}
            className="rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold text-[#05060a] transition hover:bg-white"
          >
            Surprise me
          </button>
          <button
            onClick={viewOverview}
            className="rounded-full px-4 py-1.5 text-xs font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            Overview
          </button>
          <button
            onClick={openTimeline}
            className="rounded-full px-4 py-1.5 text-xs font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            Timeline
          </button>
          <button
            onClick={togglePaused}
            className="rounded-full px-4 py-1.5 text-xs font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={toggleHighQuality}
            aria-pressed={highQuality}
            title="Toggle high-quality rendering"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              highQuality
                ? 'bg-sky-400/20 text-sky-200'
                : 'text-white/55 hover:bg-white/10 hover:text-white'
            }`}
          >
            HD
          </button>
          <span className="hidden px-2 text-[11px] text-white/35 lg:inline">
            Drag to orbit · Scroll to zoom · Space to pause
          </span>
        </div>
      )}
    </>
  );
}
