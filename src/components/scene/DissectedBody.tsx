import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { LayerSet } from '../../data/planetLayers';

// A 90° wedge is removed; the opening is centred on local +Z so the group can
// simply billboard around Y to keep the cut-away facing the camera.
const WEDGE_START = Math.PI * 0.75;
const WEDGE_LENGTH = Math.PI * 1.5;

const bodyPos = new THREE.Vector3();

/**
 * Feature 3 — a cut-away view of any body's interior: concentric coloured
 * shells with a floating legend. The cut-away always faces the camera.
 */
export function DissectedBody({ layers, radius }: { layers: LayerSet; radius: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const appear = useRef(0);

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    // Appear animation.
    appear.current = Math.min(1, appear.current + Math.min(delta, 0.1) * 3);
    const e = 1 - Math.pow(1 - appear.current, 3);
    g.scale.setScalar(0.8 + 0.2 * e);
    // Billboard: rotate so the cut-away opening (local +Z) faces the camera.
    g.getWorldPosition(bodyPos);
    g.rotation.y = Math.atan2(
      state.camera.position.x - bodyPos.x,
      state.camera.position.z - bodyPos.z,
    );
  });

  return (
    <group ref={groupRef}>
      {layers.layers.map((layer) => (
        <mesh key={layer.name}>
          <sphereGeometry
            args={[radius * layer.outer, 56, 36, WEDGE_START, WEDGE_LENGTH]}
          />
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

      <Html
        position={[0, radius * 1.6, 0]}
        center
        zIndexRange={[14, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div className="w-64 rounded-xl border border-white/15 bg-[#0a0d16]/92 p-3 text-left shadow-xl backdrop-blur-sm">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            Interior structure
          </p>
          <ul className="flex flex-col gap-1.5">
            {layers.layers.map((layer) => (
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
          {layers.estimated && (
            <p className="mt-2 border-t border-white/10 pt-2 text-[10px] italic text-amber-300/75">
              Estimated structure based on current scientific models.
            </p>
          )}
        </div>
      </Html>
    </group>
  );
}
