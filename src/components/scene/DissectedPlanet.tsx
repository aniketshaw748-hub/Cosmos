import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { PLANET_LAYERS } from '../../data/planetLayers';

/** 90-degree wedge removed from each shell so the interior is visible. */
const WEDGE = Math.PI * 1.5;

/**
 * Feature 3 — a cut-away view of a planet's interior: concentric shells, each
 * a different colour, with a floating legend naming every layer.
 */
export function DissectedPlanet({ planetId, radius }: { planetId: string; radius: number }) {
  const set = PLANET_LAYERS[planetId];
  const groupRef = useRef<THREE.Group>(null);
  const appear = useRef(0);

  useFrame((_, delta) => {
    appear.current = Math.min(1, appear.current + Math.min(delta, 0.1) * 3);
    if (groupRef.current) {
      const e = 1 - Math.pow(1 - appear.current, 3); // ease-out
      groupRef.current.scale.setScalar(0.78 + 0.22 * e);
    }
  });

  if (!set) return null;

  return (
    <group ref={groupRef}>
      {set.layers.map((layer) => (
        <mesh key={layer.name}>
          <sphereGeometry args={[radius * layer.outer, 56, 36, 0, WEDGE]} />
          <meshStandardMaterial
            color={layer.color}
            emissive={layer.color}
            emissiveIntensity={0.2}
            roughness={0.65}
            metalness={0.05}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Layer legend */}
      <Html
        position={[0, radius * 1.55, 0]}
        center
        zIndexRange={[14, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div className="w-64 rounded-xl border border-white/15 bg-[#0a0d16]/92 p-3 text-left shadow-xl backdrop-blur-sm">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            Interior structure
          </p>
          <ul className="flex flex-col gap-1.5">
            {set.layers.map((layer) => (
              <li key={layer.name} className="flex gap-2">
                <span
                  className="mt-0.5 h-3 w-3 shrink-0 rounded-sm"
                  style={{ background: layer.color }}
                />
                <span>
                  <span className="block text-[12px] font-semibold text-white">{layer.name}</span>
                  <span className="block text-[11px] leading-snug text-white/55">
                    {layer.description}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {set.estimated && (
            <p className="mt-2 border-t border-white/10 pt-2 text-[10px] italic text-amber-300/75">
              Estimated structure based on current scientific models.
            </p>
          )}
        </div>
      </Html>
    </group>
  );
}
