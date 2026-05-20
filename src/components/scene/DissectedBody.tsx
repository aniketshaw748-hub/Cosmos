import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Line, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { LayerSet } from '../../data/planetLayers';

/** Visual description of a body's outer surface for the dissection. */
export interface DissectionSurface {
  textureUrl?: string;
  color: string;
  /** multiply tint applied over the texture (moons) */
  tint?: string;
  /** self-lit surface (the Sun) */
  emissive?: boolean;
}

const OPEN_ANGLE = Math.PI / 4; // 45° half-width → a 90° wedge
const _c = new THREE.Vector3();

interface LabelInfo {
  name: string;
  color: string;
  anchor: [number, number, number];
  target: [number, number, number];
}

/**
 * Feature 3 — a geological cross-section. The whole body stays in place; two
 * clipping planes carve a ~90° wedge out of it (and every nested interior
 * layer) to reveal the structure. The wedge animates open, the planes track
 * the camera, and the labels billboard so they stay readable while the user
 * orbits, pans or zooms.
 */
export function DissectedBody({
  layers,
  radius,
  open,
  surface,
}: {
  layers: LayerSet;
  radius: number;
  open: boolean;
  surface: DissectionSurface;
}) {
  const gl = useThree((s) => s.gl);
  const groupRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const labelGroupRef = useRef<THREE.Group>(null);
  const alpha = useRef(0);
  const [labelsVisible, setLabelsVisible] = useState(false);

  useEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);

  // Two world-space clipping planes, shared by every layer and mutated per frame.
  const planes = useMemo(
    () => [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0),
    ],
    [],
  );

  const list = layers.layers;

  // Label positions in the label group's LOCAL space (+X right, +Y up,
  // +Z toward camera). The group billboards, so these stay correct.
  const labelInfos = useMemo<LabelInfo[]>(
    () =>
      list.map((layer, i) => {
        const innerFrac = list[i + 1]?.outer ?? 0;
        const midR = ((layer.outer + innerFrac) / 2) * radius;
        const colY = radius * 1.0 - i * radius * 0.46;
        return {
          name: layer.name,
          color: layer.color,
          target: [0, midR, radius * 0.28],
          anchor: [radius * 1.6, colY, radius * 0.12],
        };
      }),
    [list, radius],
  );

  // Labels fade in once the wedge has opened.
  useEffect(() => {
    if (!open) {
      setLabelsVisible(false);
      return;
    }
    const timer = setTimeout(() => setLabelsVisible(true), 950);
    return () => clearTimeout(timer);
  }, [open]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);

    // Animate the wedge half-angle open / closed (~1s).
    const targetA = open ? OPEN_ANGLE : 0;
    alpha.current += (targetA - alpha.current) * (1 - Math.pow(0.04, dt));
    if (Math.abs(alpha.current - targetA) < 0.0004) alpha.current = targetA;

    const g = groupRef.current;
    if (!g) return;
    g.getWorldPosition(_c);

    // Orient the wedge toward the camera; planes stay fixed in world space.
    const theta = Math.atan2(
      state.camera.position.x - _c.x,
      state.camera.position.z - _c.z,
    );
    const a = alpha.current;

    const phiA = theta - a;
    planes[0].normal.set(-Math.cos(phiA), 0, Math.sin(phiA));
    planes[0].constant = -planes[0].normal.dot(_c);

    const phiB = theta + a;
    planes[1].normal.set(Math.cos(phiB), 0, -Math.sin(phiB));
    planes[1].constant = -planes[1].normal.dot(_c);

    // The body keeps rotating on its axis; the planes stay world-fixed.
    if (spinRef.current) spinRef.current.rotation.y += 0.22 * dt;

    // Keep the labels facing the camera as the user orbits.
    if (labelGroupRef.current) labelGroupRef.current.lookAt(state.camera.position);
  });

  return (
    <group ref={groupRef}>
      {/* Outer surface (crust) — whole sphere, spinning, wedge-clipped. */}
      <group ref={spinRef}>
        {surface.textureUrl ? (
          <TexturedShell
            url={surface.textureUrl}
            radius={radius * list[0].outer}
            planes={planes}
            tint={surface.tint}
            emissive={surface.emissive}
          />
        ) : (
          <mesh>
            <sphereGeometry args={[radius * list[0].outer, 64, 48]} />
            <meshStandardMaterial
              color={surface.color}
              roughness={0.85}
              metalness={0.05}
              clippingPlanes={planes}
              clipIntersection
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>

      {/* Nested interior layers — same wedge clip, all the way to the core. */}
      {list.slice(1).map((layer) => (
        <mesh key={layer.name}>
          <sphereGeometry args={[radius * layer.outer, 56, 40]} />
          <meshStandardMaterial
            color={layer.color}
            emissive={layer.color}
            emissiveIntensity={0.35}
            roughness={0.55}
            metalness={0.05}
            clippingPlanes={planes}
            clipIntersection
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Billboarded labels with leader lines. */}
      {labelsVisible && (
        <group ref={labelGroupRef}>
          {labelInfos.map((l) => (
            <group key={l.name}>
              <Line
                points={[l.target, l.anchor]}
                color="#ffffff"
                lineWidth={1}
                transparent
                opacity={0.42}
              />
              <Html
                position={l.anchor}
                center
                zIndexRange={[14, 0]}
                style={{ pointerEvents: 'none' }}
              >
                <div
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-white/15 bg-[#0a0d16]/90 px-2 py-1 shadow-lg"
                  style={{ animation: 'cosmos-fade-in 0.4s ease-out' }}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ background: l.color }}
                  />
                  <span className="text-[12px] font-semibold text-white">{l.name}</span>
                </div>
              </Html>
            </group>
          ))}

          {layers.estimated && (
            <Html
              position={[0, -radius * 1.6, radius * 0.12]}
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
      )}
    </group>
  );
}

/** Textured outer shell of the body, wedge-clipped. */
function TexturedShell({
  url,
  radius,
  planes,
  tint,
  emissive,
}: {
  url: string;
  radius: number;
  planes: THREE.Plane[];
  tint?: string;
  emissive?: boolean;
}) {
  const texture = useTexture(url);
  texture.colorSpace = THREE.SRGBColorSpace;

  return (
    <mesh>
      <sphereGeometry args={[radius, 64, 48]} />
      <meshStandardMaterial
        map={emissive ? undefined : texture}
        color={tint ?? '#ffffff'}
        emissiveMap={emissive ? texture : undefined}
        emissive={emissive ? '#ffffff' : '#000000'}
        emissiveIntensity={emissive ? 1.7 : 0}
        roughness={0.9}
        metalness={0.04}
        toneMapped={!emissive}
        clippingPlanes={planes}
        clipIntersection
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
