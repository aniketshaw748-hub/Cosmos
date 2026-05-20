import { PLANETS } from '../../data/planets';
import { Planet } from './Planet';

/** Maps the planet data to orbiting <Planet> instances. */
export function SolarSystem() {
  return (
    <>
      {PLANETS.map((planet) => (
        <Planet key={planet.id} data={planet} />
      ))}
    </>
  );
}
