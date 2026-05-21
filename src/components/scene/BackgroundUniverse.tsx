import { useMemo } from 'react';
import * as THREE from 'three';
import { HygStarfield } from './HygStarfield';

/**
 * Feature 8 — the cosmic backdrop: a realistic data-driven starfield (real
 * stars from the HYG catalogue, accurate magnitude + colour) plus a scatter
 * of faint distant galaxies for depth.
 */
export function BackgroundUniverse() {
  return (
    <group>
      <HygStarfield />
      <Galaxies />
    </group>
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
