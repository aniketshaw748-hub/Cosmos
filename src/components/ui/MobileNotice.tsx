import { useState } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';

/**
 * Portrait and landscape phones are fully supported, so this notice only
 * appears on extremely short viewports where the UI genuinely won't fit.
 */
export function MobileNotice() {
  const tooShort = useMediaQuery('(max-height: 340px)');
  const [dismissed, setDismissed] = useState(false);

  if (!tooShort || dismissed) return null;

  return (
    <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-[#05060a] px-8 text-center">
      <div className="text-4xl">🪐</div>
      <h2 className="mt-4 text-lg font-semibold text-white">A taller screen helps</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/55">
        Cosmos needs a little more vertical room. Rotate your device or use a
        larger screen for the full experience.
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="mt-6 rounded-full border border-white/20 px-6 py-2.5 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
      >
        Continue anyway
      </button>
    </div>
  );
}
