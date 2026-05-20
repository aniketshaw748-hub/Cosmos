import { getMoonsByPlanet } from '../../data/moons';
import { Moon } from './Moon';

/** Feature 4 — renders every major moon orbiting a given planet. */
export function MoonSystem({ planetId }: { planetId: string }) {
  const moons = getMoonsByPlanet(planetId);
  if (moons.length === 0) return null;

  return (
    <>
      {moons.map((moon) => (
        <Moon key={moon.id} data={moon} />
      ))}
    </>
  );
}
