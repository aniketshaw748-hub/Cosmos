import { useSceneStore } from '../../store/useSceneStore';
import { useViewportMode } from '../../hooks/useMobileLayout';

/**
 * Feature 1 — dims the scene around a focused object so it stands out. The
 * clear area follows the object: top-centre on portrait phones, left
 * otherwise.
 */
export function FocusVignette() {
  const focused = useSceneStore((s) => s.selected !== null);
  const mode = useViewportMode();

  const gradient =
    mode === 'mobile-portrait'
      ? 'radial-gradient(ellipse 82% 36% at 50% 21%, rgba(5,6,10,0) 0%, rgba(5,6,10,0) 46%, rgba(5,6,10,0.6) 100%)'
      : 'radial-gradient(ellipse 48% 64% at 30% 48%, rgba(5,6,10,0) 0%, rgba(5,6,10,0) 44%, rgba(5,6,10,0.62) 100%)';

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-10 transition-opacity duration-700 ${
        focused ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ background: gradient }}
    />
  );
}
