import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';

/**
 * Asset loading screen. Sits behind the landing splash, so it only becomes
 * visible if the scene is revealed before its textures finish loading.
 */
export function Loader() {
  const { progress, active } = useProgress();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 12000);
    return () => clearTimeout(t);
  }, []);

  const done = timedOut || (!active && progress >= 100);

  return (
    <div
      className={`absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#05060a] transition-opacity duration-700 ${
        done ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Cosmos</p>
      <div className="mt-4 h-[3px] w-56 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-white/80 transition-[width] duration-300 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-white/40">
        {progress < 100 ? `Loading the solar system… ${Math.round(progress)}%` : 'Ready'}
      </p>
    </div>
  );
}
