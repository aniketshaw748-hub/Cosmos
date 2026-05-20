import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Feature 8 — a layered cosmic backdrop: a dense starfield, a tilted Milky Way
 * band, a field of distant galaxies, drifting nebulae and cosmic dust. All of
 * it is procedural (instanced points + billboard sprites) so it stays at 60fps
 * and needs no external image assets.
 */
export function BackgroundUniverse() {
  return (
    <group>
      <DeepStarfield />
      <MilkyWayBand />
      <CosmicDust />
      <Galaxies />
      <Nebulae />
    </group>
  );
}

/** Builds a soft radial glow texture for galaxy / nebula billboards. */
function makeGlowTexture(kind: 'galaxy' | 'nebula'): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  if (kind === 'galaxy') {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.16, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.45, 'rgba(205,215,255,0.32)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  } else {
    for (let i = 0; i < 6; i++) {
      const x = size / 2 + (Math.random() - 0.5) * size * 0.5;
      const y = size / 2 + (Math.random() - 0.5) * size * 0.5;
      const r = size * (0.22 + Math.random() * 0.26);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,0.42)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
  }

  return new THREE.CanvasTexture(canvas);
}

/** A coloured shell of ~14,000 distant stars. */
function DeepStarfield() {
  const geometry = useMemo(() => {
    const COUNT = 14000;
    const palette = [
      [1, 1, 1],
      [0.72, 0.82, 1],
      [1, 0.92, 0.74],
      [1, 0.78, 0.64],
    ];
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1500 + Math.random() * 1900;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      const c = palette[(Math.random() * palette.length) | 0];
      const b = 0.45 + Math.random() * 0.55;
      colors[i * 3] = c[0] * b;
      colors[i * 3 + 1] = c[1] * b;
      colors[i * 3 + 2] = c[2] * b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);

  return (
    <points geometry={geometry} raycast={() => null}>
      <pointsMaterial size={2.1} vertexColors sizeAttenuation transparent depthWrite={false} />
    </points>
  );
}

/** A brighter, tilted band of stars — our galactic plane. */
function MilkyWayBand() {
  const geometry = useMemo(() => {
    const COUNT = 6500;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 1700 + Math.random() * 1500;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 360 * Math.random();
      positions[i * 3 + 2] = Math.sin(theta) * r;
      const b = 0.4 + Math.random() * 0.5;
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
      <pointsMaterial size={1.7} vertexColors sizeAttenuation transparent opacity={0.9} depthWrite={false} />
    </points>
  );
}

/** A subtle mid-distance dust field that adds depth. */
function CosmicDust() {
  const geometry = useMemo(() => {
    const COUNT = 1400;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 420 + Math.random() * 620;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  return (
    <points geometry={geometry} raycast={() => null}>
      <pointsMaterial
        size={1.3}
        color="#5a6a8c"
        sizeAttenuation
        transparent
        opacity={0.32}
        depthWrite={false}
      />
    </points>
  );
}

/** ~40 distant galaxies as additive billboard sprites. */
function Galaxies() {
  const texture = useMemo(() => makeGlowTexture('galaxy'), []);
  const items = useMemo(() => {
    const tints = ['#ffffff', '#cdd6ff', '#ffe6c4', '#ffd2e0', '#cfe9ff'];
    return Array.from({ length: 40 }, () => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const dist = 950 + Math.random() * 2150;
      const w = 34 + Math.random() * 130;
      return {
        position: [
          dist * Math.sin(phi) * Math.cos(theta),
          dist * Math.cos(phi),
          dist * Math.sin(phi) * Math.sin(theta),
        ] as [number, number, number],
        scale: [w, w * (0.45 + Math.random() * 0.5), 1] as [number, number, number],
        color: tints[(Math.random() * tints.length) | 0],
        rotation: Math.random() * Math.PI,
        opacity: Math.max(0.3, 0.85 - ((dist - 950) / 2150) * 0.5),
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

/** A few large, soft nebulae scattered in the deep background. */
function Nebulae() {
  const texture = useMemo(() => makeGlowTexture('nebula'), []);
  const items = useMemo(() => {
    const tints = ['#7b5bd8', '#3f9fd6', '#d8694f', '#c14fa0', '#4fc7a8'];
    return Array.from({ length: 7 }, (_, i) => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const dist = 1100 + Math.random() * 1700;
      const w = 320 + Math.random() * 460;
      return {
        position: [
          dist * Math.sin(phi) * Math.cos(theta),
          dist * Math.cos(phi),
          dist * Math.sin(phi) * Math.sin(theta),
        ] as [number, number, number],
        scale: [w, w * (0.6 + Math.random() * 0.5), 1] as [number, number, number],
        color: tints[i % tints.length],
        rotation: Math.random() * Math.PI,
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
            opacity={0.22}
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
