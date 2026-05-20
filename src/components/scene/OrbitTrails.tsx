import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { PLANETS } from '../../data/planets';
import type { BodyDef } from '../../types';
import { useSceneStore } from '../../store/useSceneStore';

/** Builds a closed circle of points in the XZ plane. */
function circlePoints(radius: number, segments = 160): [number, number, number][] {
  const points: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    points.push([Math.cos(a) * radius, 0, Math.sin(a) * radius]);
  }
  return points;
}

/** Faint guide rings tracing each planet's orbit; the active one lights up. */
export function OrbitTrails() {
  return (
    <>
      {PLANETS.map((planet) => (
        <OrbitRing key={planet.id} planet={planet} />
      ))}
    </>
  );
}

function OrbitRing({ planet }: { planet: BodyDef }) {
  const points = useMemo(() => circlePoints(planet.orbitRadius), [planet.orbitRadius]);
  const active = useSceneStore(
    (s) => s.hovered?.id === planet.id || s.selected?.id === planet.id,
  );

  return (
    <Line
      points={points}
      color={active ? planet.color : '#6981b0'}
      lineWidth={active ? 1.7 : 0.8}
      transparent
      opacity={active ? 0.75 : 0.14}
      depthWrite={false}
    />
  );
}
