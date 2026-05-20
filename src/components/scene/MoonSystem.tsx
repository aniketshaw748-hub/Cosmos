import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { getMoonsByPlanet } from '../../data/moons';
import { useSceneStore } from '../../store/useSceneStore';
import { Moon } from './Moon';

/** Feature 4 — renders every major moon orbiting a planet, plus their orbit
 *  paths while the planet (or one of its moons) is in focus. */
export function MoonSystem({ planetId }: { planetId: string }) {
  const moons = getMoonsByPlanet(planetId);
  const showOrbits = useSceneStore(
    (s) =>
      s.selected?.id === planetId ||
      (s.selected?.kind === 'moon' && s.selected?.parentId === planetId),
  );

  if (moons.length === 0) return null;

  return (
    <>
      {showOrbits &&
        moons.map((moon) => <MoonOrbitRing key={`ring-${moon.id}`} radius={moon.orbitRadius} />)}
      {moons.map((moon) => (
        <Moon key={moon.id} data={moon} />
      ))}
    </>
  );
}

/** A faint circular guide ring for one moon's orbit. */
function MoonOrbitRing({ radius }: { radius: number }) {
  const points = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      out.push([Math.cos(a) * radius, 0, Math.sin(a) * radius]);
    }
    return out;
  }, [radius]);

  return (
    <Line
      points={points}
      color="#8fa6cf"
      lineWidth={1}
      transparent
      opacity={0.4}
      depthWrite={false}
    />
  );
}
