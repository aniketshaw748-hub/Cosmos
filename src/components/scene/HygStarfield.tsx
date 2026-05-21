import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import hygStars from '../../data/hygStars.json';

/** Radius of the celestial sphere the stars are projected onto. */
const STAR_SPHERE_RADIUS = 5000;

/** B–V colour index → RGB (cool blue → white → yellow → orange → red). */
const BV_STOPS: Array<[number, [number, number, number]]> = [
  [-0.4, [180, 200, 255]],
  [0.0, [180, 200, 255]],
  [0.3, [255, 255, 255]],
  [0.6, [255, 240, 200]],
  [1.0, [255, 205, 150]],
  [1.4, [255, 180, 120]],
  [1.8, [255, 140, 100]],
  [3.0, [255, 140, 100]],
];

function bvToRgb(bvRaw: number): [number, number, number] {
  const bv = Math.min(3.0, Math.max(-0.4, bvRaw));
  let lo = BV_STOPS[0];
  let hi = BV_STOPS[BV_STOPS.length - 1];
  for (let i = 0; i < BV_STOPS.length - 1; i++) {
    if (bv >= BV_STOPS[i][0] && bv <= BV_STOPS[i + 1][0]) {
      lo = BV_STOPS[i];
      hi = BV_STOPS[i + 1];
      break;
    }
  }
  const t = hi[0] === lo[0] ? 0 : (bv - lo[0]) / (hi[0] - lo[0]);
  return [
    (lo[1][0] + (hi[1][0] - lo[1][0]) * t) / 255,
    (lo[1][1] + (hi[1][1] - lo[1][1]) * t) / 255,
    (lo[1][2] + (hi[1][2] - lo[1][2]) * t) / 255,
  ];
}

const VERTEX_SHADER = `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  void main() {
    float twinkle = 0.88 + 0.12 * sin(uTime * (0.5 + aSeed * 0.17) + aSeed);
    vColor = aColor * twinkle;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio;
  }
`;

const FRAGMENT_SHADER = `
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float glow = smoothstep(0.5, 0.0, d);
    glow *= glow;
    gl_FragColor = vec4(vColor * glow, 1.0);
  }
`;

/**
 * A realistic starfield from the HYG database: ~5000 real stars, each placed
 * by true RA/Dec with size, brightness and colour driven by its apparent
 * magnitude and B–V colour index. One BufferGeometry + one shader = one draw
 * call, and point sizes are pixel-ratio scaled so it renders identically on
 * desktop and mobile.
 */
export function HygStarfield() {
  const gl = useThree((s) => s.gl);

  const geometry = useMemo(() => {
    const data = hygStars.stars;
    const n = hygStars.count;
    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);
    const sizes = new Float32Array(n);
    const seeds = new Float32Array(n);

    for (let i = 0; i < n; i++) {
      const ra = data[i * 4];
      const dec = data[i * 4 + 1];
      const mag = data[i * 4 + 2];
      const ci = data[i * 4 + 3];

      // RA/Dec → a point on the celestial sphere.
      const cosDec = Math.cos(dec);
      positions[i * 3] = STAR_SPHERE_RADIUS * cosDec * Math.cos(ra);
      positions[i * 3 + 1] = STAR_SPHERE_RADIUS * Math.sin(dec);
      positions[i * 3 + 2] = STAR_SPHERE_RADIUS * cosDec * Math.sin(ra);

      // Size from apparent magnitude — brighter (lower mag) → larger point.
      sizes[i] = Math.min(8, Math.max(0.6, 4.2 * Math.pow(2.512, -mag / 2)));

      // Brightness from magnitude, baked into the additive colour.
      const brightness = Math.min(1.2, Math.max(0.28, 1.15 - ((mag + 1.5) / 7.5) * 0.87));
      const [r, g, b] = bvToRgb(ci);
      colors[i * 3] = r * brightness;
      colors[i * 3 + 1] = g * brightness;
      colors[i * 3 + 2] = b * brightness;

      seeds[i] = Math.random() * 6.283;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geo.computeBoundingSphere();
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  // Device-consistent point sizes: scale by the clamped pixel ratio, and never
  // exceed the GPU's maximum supported point size.
  useEffect(() => {
    const ctx = gl.getContext();
    const range = ctx.getParameter(ctx.ALIASED_POINT_SIZE_RANGE) as Float32Array | null;
    const maxPointSize = range && range[1] ? range[1] : 64;
    material.uniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), maxPointSize / 8);
  }, [gl, material]);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <points geometry={geometry} material={material} frustumCulled={false} raycast={() => null} />
  );
}
