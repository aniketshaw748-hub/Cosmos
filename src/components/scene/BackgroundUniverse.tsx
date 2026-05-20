import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Feature 8 — a layered cosmic backdrop. Stars are drawn in three depth tiers
 * so they vary in size and brightness (most are tiny and faint, a few are
 * close and bright), plus a tilted Milky Way band and a scatter of faint
 * distant galaxies. All procedural for 60fps.
 */
export function BackgroundUniverse() {
  return (
    <group>
      {/* far + tiny + dim → ... → near + large + bright */}
      <StarLayer count={9000} size={1.0} opacity={0.5} rMin={2300} rMax={3600} />
      <StarLayer count={3200} size={1.9} opacity={0.68} rMin={1750} rMax={2900} />
      <StarLayer count={520} size={3.6} opacity={0.95} rMin={1450} rMax={2400} bright />
      <MilkyWayBand />
      <Galaxies />
    </group>
  );
}

interface StarLayerProps {
  count: number;
  size: number;
  opacity: number;
  rMin: number;
  rMax: number;
  bright?: boolean;
}

/** One depth tier of stars. */
function StarLayer({ count, size, opacity, rMin, rMax, bright }: StarLayerProps) {
  const geometry = useMemo(() => {
    const palette = bright
      ? [
          [1, 1, 1],
          [0.68, 0.8, 1],
          [1, 0.85, 0.62],
          [1, 0.7, 0.58],
        ]
      : [
          [1, 1, 1],
          [0.85, 0.9, 1],
          [1, 0.93, 0.8],
        ];
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = rMin + Math.random() * (rMax - rMin);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      const c = palette[(Math.random() * palette.length) | 0];
      const b = bright ? 0.78 + Math.random() * 0.22 : 0.35 + Math.random() * 0.5;
      colors[i * 3] = c[0] * b;
      colors[i * 3 + 1] = c[1] * b;
      colors[i * 3 + 2] = c[2] * b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, [count, rMin, rMax, bright]);

  return (
    <points geometry={geometry} raycast={() => null}>
      <pointsMaterial
        size={size}
        vertexColors
        sizeAttenuation
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </points>
  );
}

/** A brighter, tilted band of stars — our galactic plane. */
function MilkyWayBand() {
  const geometry = useMemo(() => {
    const COUNT = 5000;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 1900 + Math.random() * 1400;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 320 * Math.random();
      positions[i * 3 + 2] = Math.sin(theta) * r;
      const b = 0.32 + Math.random() * 0.4;
      colors[i * 3] = b;
      colors[i * 3 + 1] = b * 0.95;
      colors[i * 3 + 2] = b * 0.82;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);

  return (
    <points geometry={geometry} rotation={[0.5, 0, 0.32]} raycast={() => null}>
      <pointsMaterial
        size={1.5}
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.6}
        depthWrite={false}
      />
    </points>
  );
}

/** A soft radial glow texture for the distant-galaxy billboards. */
function makeGalaxyTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(255,255,255,0.7)');
  g.addColorStop(0.5, 'rgba(210,220,255,0.22)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

/** ~24 faint, small distant galaxies as additive billboard sprites. */
function Galaxies() {
  const texture = useMemo(() => makeGalaxyTexture(), []);
  const items = useMemo(() => {
    const tints = ['#ffffff', '#cdd6ff', '#ffe6c4', '#cfe9ff'];
    return Array.from({ length: 24 }, () => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const dist = 1600 + Math.random() * 1700;
      const w = 20 + Math.random() * 44;
      return {
        position: [
          dist * Math.sin(phi) * Math.cos(theta),
          dist * Math.cos(phi),
          dist * Math.sin(phi) * Math.sin(theta),
        ] as [number, number, number],
        scale: [w, w * (0.42 + Math.random() * 0.5), 1] as [number, number, number],
        color: tints[(Math.random() * tints.length) | 0],
        rotation: Math.random() * Math.PI,
        opacity: 0.22 + Math.random() * 0.22,
      };
    });
  }, []);

  return (
    <>
      {items.map((it, i) => (
        <sprite key={i} position={it.position} scale={it.scale}>
          <spriteMaterial
            map={texture}
            color={it.color}
            rotation={it.rotation}
            opacity={it.opacity}
            blending={THREE.AdditiveBlending}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      ))}
    </>
  );
}
