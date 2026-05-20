import { useSceneStore } from '../../store/useSceneStore';

/**
 * Feature 1 — dims the scene around a focused object. A radial gradient that
 * stays clear over the left-side subject and darkens toward the edges, so the
 * background planets and stars recede without touching the focused object.
 */
export function FocusVignette() {
  const focused = useSceneStore((s) => s.selected !== null);

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-10 transition-opacity duration-700 ${
        focused ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        background:
          'radial-gradient(ellipse 48% 62% at 33% 48%, rgba(5,6,10,0) 0%, rgba(5,6,10,0) 44%, rgba(5,6,10,0.62) 100%)',
      }}
    />
  );
}
