import { useEffect } from 'react';
import { useSceneStore } from '../../store/useSceneStore';

/**
 * Feature 9 — a gentle toast shown when the user clicks empty space or zooms
 * far out, hinting at exploration beyond the solar system. Auto-dismisses
 * after 4 seconds or on any click; debounced in the store to ~once per 10s.
 */
export function ComingSoonToast() {
  const visible = useSceneStore((s) => s.toastVisible);
  const dismiss = useSceneStore((s) => s.dismissToast);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(dismiss, 4000);
    const onClick = () => dismiss();
    window.addEventListener('pointerdown', onClick);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', onClick);
    };
  }, [visible, dismiss]);

  return (
    <div
      role="alert"
      aria-hidden={!visible}
      className={`pointer-events-none absolute left-1/2 top-[15%] z-40 -translate-x-1/2 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      }`}
    >
      <div className="flex max-w-md items-center gap-3 rounded-xl border border-sky-400/30 bg-[#0a0d16]/92 px-4 py-3 shadow-[0_0_34px_-8px_rgba(124,196,255,0.55)] backdrop-blur-md">
        <span className="text-lg" aria-hidden>
          🔭
        </span>
        <p className="text-[13px] leading-snug text-white/75">
          <span className="font-semibold text-white">Beyond the solar system — coming soon.</span>{' '}
          We’re working on bringing you the Milky Way, distant exoplanets, and the wider universe.
        </p>
      </div>
    </div>
  );
}
