import { useState } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';

/** Full-screen notice on small screens — v1 targets desktop only. */
export function MobileNotice() {
  const isSmall = useMediaQuery('(max-width: 820px)');
  const [dismissed, setDismissed] = useState(false);

  if (!isSmall || dismissed) return null;

  return (
    <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-[#05060a] px-8 text-center">
      <div className="text-5xl">🪐</div>
      <h2 className="mt-5 text-2xl font-semibold text-white">Best on a bigger screen</h2>
      <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-white/55">
        Cosmos renders a full 3D solar system — it needs the room and the
        horsepower of a desktop or laptop to really shine.
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="mt-7 rounded-full border border-white/20 px-6 py-2.5 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
      >
        Continue anyway
      </button>
    </div>
  );
}
