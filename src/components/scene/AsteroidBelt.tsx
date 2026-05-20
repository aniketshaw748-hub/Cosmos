import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { NeoData } from '../../types';
import { fetchNeoFeed } from '../../lib/nasa';
import { useSceneStore } from '../../store/useSceneStore';
import { neoToSceneObject } from '../../lib/sceneObject';
import { registerObject, unregisterObject } from '../../lib/registry';
import { MAX_DELTA, ORBIT_SPEED_SCALE } from '../../lib/orbital';
import { ASTEROID_LAYERS } from '../../data/planetLayers';
import { DissectedBody } from './DissectedBody';

const BELT_COUNT = 2200;
const BELT_INNER = 50;
const BELT_OUTER = 76;

/** Decorative main-belt asteroids plus the live near-Earth object field. */
export function AsteroidBelt() {
  const [neos, setNeos] = useState<NeoData[]>([]);

  useEffect(() => {
    let alive = true;
    fetchNeoFeed()
      .then((feed) => alive && setNeos(feed.asteroids))
      .catch((err) => console.warn('NEO feed unavailable:', err));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <DecorativeBelt />
      <NeoField neos={neos} />
    </>
  );
}

/** ~2,200 instanced rocks drifting between the Mars and Jupiter orbits. */
function DecorativeBelt() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const paused = useSceneStore((s) => s.paused);

  const geometry = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#8b8175',
        roughness: 1,
        metalness: 0,
        flatShading: true,
      }),
    [],
  );

  const matrices = useMemo(() => {
    const dummy = new THREE.Object3D();
    const out: THREE.Matrix4[] = [];
    for (let i = 0; i < BELT_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = BELT_INNER + Math.random() * (BELT_OUTER - BELT_INNER);
      dummy.position.set(Math.cos(angle) * r, (Math.random() - 0.5) * 5, Math.sin(angle) * r);
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );
      dummy.scale.setScalar(0.05 + Math.random() * 0.22);
      dummy.updateMatrix();
      out.push(dummy.matrix.clone());
    }
    return out;
  }, []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices]);

  useFrame((_, delta) => {
    if (!paused && groupRef.current) {
      groupRef.current.rotation.y += 0.008 * Math.min(delta, MAX_DELTA);
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, BELT_COUNT]}
        raycast={() => null}
      />
    </group>
  );
}

/** Places each live near-Earth object on its own slow orbit near Earth. */
function NeoField({ neos }: { neos: NeoData[] }) {
  const placed = useMemo(
    () =>
      neos.map((neo, i) => ({
        neo,
        angle: i * 2.39996 + 0.5, // golden-angle spread
        radius: 23 + ((i * 6.7) % 17),
        y: ((i * 4.3) % 13) - 6.5,
        speed: 0.3 + ((i * 3) % 5) * 0.12,
      })),
    [neos],
  );

  return (
    <>
      {placed.map((p) => (
        <NearEarthObject key={p.neo.id} {...p} />
      ))}
    </>
  );
}

interface NeoProps {
  neo: NeoData;
  angle: number;
  radius: number;
  y: number;
  speed: number;
}

/** A single clickable, slowly-orbiting near-Earth asteroid with real data. */
function NearEarthObject({ neo, angle, radius, y, speed }: NeoProps) {
  const orbitRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const theta = useRef(angle);

  const select = useSceneStore((s) => s.select);
  const setHovered = useSceneStore((s) => s.setHovered);
  const paused = useSceneStore((s) => s.paused);
  const id = `neo-${neo.id}`;
  const isHovered = useSceneStore((s) => s.hovered?.id === id);
  const isSelected = useSceneStore((s) => s.selected?.id === id);
  const dissectMode = useSceneStore((s) => s.dissectMode);
  const dissecting = isSelected && dissectMode;
  const active = isHovered || isSelected;

  const size = useMemo(() => {
    const d = neo.diameterMeters || 60;
    return THREE.MathUtils.clamp(0.13 + Math.log10(d) * 0.12, 0.14, 0.62);
  }, [neo.diameterMeters]);

  const color = neo.hazardous ? '#ff6a45' : '#b9ad9b';

  useEffect(() => {
    if (orbitRef.current) registerObject(id, orbitRef.current);
    return () => unregisterObject(id);
  }, [id]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, MAX_DELTA);
    // Orbit freezes when this asteroid is focused (Feature 1) or globally paused.
    if (!paused && !isSelected) {
      theta.current += speed * ORBIT_SPEED_SCALE * dt;
    }
    if (!paused && meshRef.current) {
      meshRef.current.rotation.x += 0.4 * dt;
      meshRef.current.rotation.y += 0.3 * dt;
    }
    if (orbitRef.current) {
      orbitRef.current.position.set(
        Math.cos(theta.current) * radius,
        y,
        Math.sin(theta.current) * radius,
      );
    }
    if (matRef.current) {
      const base = neo.hazardous ? 0.4 : 0.16;
      const pulse = neo.hazardous
        ? 0.22 * (0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 3))
        : 0;
      matRef.current.emissiveIntensity = base + pulse + (active ? 0.4 : 0);
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const p = orbitRef.current?.position ?? new THREE.Vector3();
    select(neoToSceneObject(neo, size, [p.x, p.y, p.z]));
  };

  return (
    <group ref={orbitRef}>
      {dissecting ? (
        <DissectedBody layers={ASTEROID_LAYERS} radius={size} />
      ) : (
        <>
          {active && (
            <mesh scale={size * 2.2} raycast={() => null}>
              <sphereGeometry args={[1, 24, 24]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={isSelected ? 0.3 : 0.16}
                side={THREE.BackSide}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
          )}
          <mesh
            ref={meshRef}
            onClick={handleClick}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              setHovered({ id, name: neo.name });
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHovered(null);
              document.body.style.cursor = 'auto';
            }}
          >
            <icosahedronGeometry args={[size, 0]} />
            <meshStandardMaterial
              ref={matRef}
              color={color}
              emissive={color}
              emissiveIntensity={0.16}
              roughness={0.95}
              metalness={0.05}
              flatShading
            />
          </mesh>
        </>
      )}
    </group>
  );
}
