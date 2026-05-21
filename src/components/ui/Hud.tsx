import { useSceneStore } from '../../store/useSceneStore';
import { ALL_BODIES } from '../../data/planets';
import { bodyToSceneObject } from '../../lib/sceneObject';
import { useViewportMode } from '../../hooks/useMobileLayout';

/** On-screen overlay: wordmark plus the control bar (responsive). */
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
  const mode = useViewportMode();

  if (landingVisible) return null;

  const isPortrait = mode === 'mobile-portrait';
  const isLandscape = mode === 'mobile-landscape';

  const surpriseMe = () => {
    const pool = ALL_BODIES.filter((b) => b.id !== selectedId);
    const body = pool[Math.floor(Math.random() * pool.length)];
    select(bodyToSceneObject(body));
  };
  const openTimeline = () => {
    deselect();
    setTimelineOpen(true);
  };

  // Hide the bar when the timeline owns the bottom, or a portrait panel covers it.
  const showBar = !timelineOpen && !(isPortrait && selectedId);

  const btn = isLandscape
    ? 'rounded-full px-2.5 py-1 text-[10px] font-medium'
    : 'rounded-full px-4 py-1.5 text-xs font-medium';
  const primaryBtn = isLandscape
    ? 'rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-[#05060a]'
    : 'rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold text-[#05060a]';
  const ghost = 'text-white/75 transition hover:bg-white/10 hover:text-white';

  return (
    <>
      {/* Wordmark */}
      <div className="pointer-events-none absolute left-5 top-4 z-20 flex items-center gap-2 sm:left-6 sm:top-5">
        <span className="text-base text-white/80">✦</span>
        <span className="text-sm font-semibold tracking-[0.22em] text-white/85">COSMOS</span>
      </div>

      {/* Control bar */}
      {showBar && (
        <div
          className={`pointer-events-auto absolute z-20 flex items-center backdrop-blur-md ${
            isLandscape
              ? 'bottom-2 left-3 gap-1 rounded-full border border-white/10 bg-[#0a0d16]/85 p-1'
              : 'bottom-6 left-1/2 -translate-x-1/2 gap-1.5 rounded-full border border-white/10 bg-[#0a0d16]/80 p-1.5'
          }`}
        >
          <button onClick={surpriseMe} className={`${primaryBtn} transition hover:bg-white`}>
            Surprise me
          </button>
          <button onClick={viewOverview} className={`${btn} ${ghost}`}>
            Overview
          </button>
          <button onClick={openTimeline} className={`${btn} ${ghost}`}>
            Timeline
          </button>
          <button onClick={togglePaused} className={`${btn} ${ghost}`}>
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={toggleHighQuality}
            aria-pressed={highQuality}
            title="Toggle high-quality rendering"
            className={`rounded-full font-semibold transition ${
              isLandscape ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
            } ${
              highQuality
                ? 'bg-sky-400/20 text-sky-200'
                : 'text-white/55 hover:bg-white/10 hover:text-white'
            }`}
          >
            HD
          </button>
          {mode === 'desktop' && (
            <span className="hidden px-2 text-[11px] text-white/35 lg:inline">
              Drag to orbit · Scroll to zoom · Space to pause
            </span>
          )}
        </div>
      )}
    </>
  );
}
