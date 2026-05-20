import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { LayerSet } from '../../data/planetLayers';

const bodyPos = new THREE.Vector3();

// A hemisphere: the +X half of a sphere, so its flat cut is a vertical plane.
// Viewed side-on it reads as a semi-circle.
const PHI_START = Math.PI / 2;
const PHI_LENGTH = Math.PI;

/**
 * Feature 3 — an exploded cut-away. Each interior layer is a flat-cut
 * hemisphere (a semi-circle when viewed side-on); the layers are pulled apart
 * along an axis, outermost to innermost, each with a leader-line label. The
 * whole assembly billboards to keep facing the camera.
 */
export function DissectedBody({ layers, radius }: { layers: LayerSet; radius: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const appear = useRef(0);

  const pieces = useMemo(() => {
    let x = 0;
    const raw = layers.layers.map((layer) => {
      const r = layer.outer * radius;
      const piece = { layer, r, x };
      x += r * 0.72; // overlap a little, like nested shells pulled apart
      return piece;
    });
    const last = raw[raw.length - 1];
    const shift = (last.x + last.r) / 2; // centre the row on the origin
    return raw.map((p) => ({ ...p, x: p.x - shift }));
  }, [layers, radius]);

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    appear.current = Math.min(1, appear.current + Math.min(delta, 0.1) * 2.6);
    const e = 1 - Math.pow(1 - appear.current, 3);
    g.scale.setScalar(0.82 + 0.18 * e);
    g.getWorldPosition(bodyPos);
    g.rotation.y = Math.atan2(
      state.camera.position.x - bodyPos.x,
      state.camera.position.z - bodyPos.z,
    );
  });

  const labelX = (pieces[pieces.length - 1]?.x ?? 0) + radius * 1.5;
  const labelTop = radius * 1.0;
  const labelStep = radius * 0.52;

  return (
    <group ref={groupRef}>
      {pieces.map((p, i) => {
        const labelY = labelTop - i * labelStep;
        return (
          <group key={p.layer.name}>
            <mesh position={[p.x, 0, 0]}>
              <sphereGeometry args={[p.r, 56, 40, PHI_START, PHI_LENGTH]} />
              <meshStandardMaterial
                color={p.layer.color}
                emissive={p.layer.color}
                emissiveIntensity={0.22}
                roughness={0.6}
                metalness={0.06}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* leader line from the layer out to its label */}
            <Line
              points={[
                [p.x + p.r * 0.45, p.r * 0.5, p.r * 0.55],
                [labelX - radius * 0.12, labelY, 0],
              ]}
              color="#ffffff"
              lineWidth={1}
              transparent
              opacity={0.35}
            />

            <Html
              position={[labelX, labelY, 0]}
              zIndexRange={[14, 0]}
              style={{ pointerEvents: 'none' }}
            >
              <div className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-white/15 bg-[#0a0d16]/90 px-2 py-1 shadow-lg">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ background: p.layer.color }}
                />
                <span className="text-[12px] font-semibold text-white">{p.layer.name}</span>
              </div>
            </Html>
          </group>
        );
      })}

      {layers.estimated && (
        <Html
          position={[0, -radius * 1.35, 0]}
          center
          zIndexRange={[14, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <p className="whitespace-nowrap text-[10px] italic text-amber-300/75">
            Estimated structure based on current scientific models.
          </p>
        </Html>
      )}
    </group>
  );
}
