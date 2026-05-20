import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { LayerSet } from '../../data/planetLayers';

const bodyPos = new THREE.Vector3();

/** Builds a hollow hemisphere shell (lathe profile) between two radii. */
function makeShell(rInner: number, rOuter: number): THREE.LatheGeometry {
  const points: THREE.Vector2[] = [];
  const SEG = 24;
  // inner arc: equator -> pole
  for (let i = 0; i <= SEG; i++) {
    const a = (i / SEG) * (Math.PI / 2);
    points.push(new THREE.Vector2(Math.cos(a) * rInner, Math.sin(a) * rInner));
  }
  // across the pole thickness
  points.push(new THREE.Vector2(0, rOuter));
  // outer arc: pole -> equator
  for (let i = 0; i <= SEG; i++) {
    const a = (Math.PI / 2) * (1 - i / SEG);
    points.push(new THREE.Vector2(Math.cos(a) * rOuter, Math.sin(a) * rOuter));
  }
  // rim, closing the profile
  points.push(new THREE.Vector2(rInner, 0));
  return new THREE.LatheGeometry(points, 56);
}

/**
 * Feature 3 — an exploded cut-away: the body's interior shells are pulled
 * apart along an axis, outermost to innermost, each labelled. The whole
 * assembly billboards to keep facing the camera.
 */
export function DissectedBody({ layers, radius }: { layers: LayerSet; radius: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const appear = useRef(0);

  const STEP = radius * 0.74;

  const pieces = useMemo(() => {
    const list = layers.layers;
    const n = list.length;
    const minThick = radius * 0.07;
    return list.map((layer, i) => {
      const rOuter = layer.outer * radius;
      const isCore = i === n - 1;
      let rInner = isCore ? 0 : list[i + 1].outer * radius;
      if (!isCore) rInner = Math.max(0, Math.min(rInner, rOuter - minThick));
      return {
        layer,
        rOuter,
        isCore,
        x: i * STEP - ((n - 1) * STEP) / 2,
        geometry: isCore ? null : makeShell(rInner, rOuter),
      };
    });
  }, [layers, radius, STEP]);

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

  const n = pieces.length;
  const labelX = ((n - 1) * STEP) / 2 + radius * 1.5;
  const labelTop = radius * 1.05;
  const labelStep = radius * 0.54;

  return (
    <group ref={groupRef}>
      {pieces.map((p, i) => {
        const labelY = labelTop - i * labelStep;
        return (
          <group key={p.layer.name}>
            <mesh
              position={[p.x, 0, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              geometry={p.geometry ?? undefined}
            >
              {p.isCore && <sphereGeometry args={[p.rOuter, 48, 32]} />}
              <meshStandardMaterial
                color={p.layer.color}
                emissive={p.layer.color}
                emissiveIntensity={0.24}
                roughness={0.6}
                metalness={0.08}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* leader line from the layer out to its label */}
            <Line
              points={[
                [p.x, p.rOuter * 0.6, p.rOuter * 0.34],
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
          position={[0, -radius * 1.5, 0]}
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
