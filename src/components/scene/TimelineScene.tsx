import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Era } from '../../data/timelineMilestones';

const scratch = new THREE.Object3D();

/**
 * Feature 7 — era dioramas. Renders the appropriate scene state for a point in
 * solar-system history. The real solar system is shown by Scene.tsx for the
 * modern / life / bombardment eras; this component handles the rest plus the
 * bombardment swarm.
 */
export function TimelineScene({ era }: { era: Era }) {
  switch (era) {
    case 'nebula':
      return <ParticleCloud count={5200} radius={130} color="#9a8fd0" flatten={0.75} />;
    case 'ignition':
      return (
        <>
          <ParticleCloud count={3600} radius={115} color="#b6a0e4" flatten={0.7} />
          <EmberSun radius={4} />
        </>
      );
    case 'disk':
      return (
        <>
          <EmberSun radius={5} />
          <ParticleDisk count={4200} inner={12} outer={120} thickness={5} color="#c7a98f" />
        </>
      );
    case 'forming':
      return (
        <>
          <EmberSun radius={6} />
          <ParticleDisk count={2600} inner={16} outer={120} thickness={9} color="#b89a7e" />
          <FormingPlanets />
        </>
      );
    case 'collision':
      return <TheiaCollision />;
    case 'bombardment':
      return <BombardmentSwarm />;
    default:
      return null;
  }
}

/** A glowing young star. */
function EmberSun({ radius }: { radius: number }) {
  return (
    <group>
      <mesh raycast={() => null}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          emissive="#ffcf6a"
          emissiveIntensity={2.2}
          color="#000000"
          toneMapped={false}
        />
      </mesh>
      <pointLight intensity={2.4} distance={0} decay={0} color="#fff2d0" />
    </group>
  );
}

/** A roughly spherical cloud of drifting dust points. */
function ParticleCloud({
  count,
  radius,
  color,
  flatten,
}: {
  count: number;
  radius: number;
  color: string;
  flatten: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = radius * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * flatten;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [count, radius, flatten]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += 0.02 * Math.min(delta, 0.1);
  });

  return (
    <points ref={ref} geometry={geometry} raycast={() => null}>
      <pointsMaterial
        size={1.5}
        color={color}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/** A flat rotating disk of debris points. */
function ParticleDisk({
  count,
  inner,
  outer,
  thickness,
  color,
}: {
  count: number;
  inner: number;
  outer: number;
  thickness: number;
  color: string;
}) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = inner + Math.random() * (outer - inner);
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * thickness;
      positions[i * 3 + 2] = Math.sin(angle) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [count, inner, outer, thickness]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += 0.06 * Math.min(delta, 0.1);
  });

  return (
    <points ref={ref} geometry={geometry} raycast={() => null}>
      <pointsMaterial
        size={1.1}
        color={color}
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/** A handful of half-formed planets among the debris. */
function FormingPlanets() {
  const blobs = [
    { r: 22, s: 0.5, c: '#9a8f86' },
    { r: 38, s: 0.8, c: '#c1440e' },
    { r: 58, s: 1.4, c: '#d9a066' },
    { r: 82, s: 1.1, c: '#e3c98f' },
  ];
  return (
    <>
      {blobs.map((b, i) => (
        <mesh
          key={i}
          position={[Math.cos(i * 1.9) * b.r, (i % 2 ? 1 : -1) * 3, Math.sin(i * 1.9) * b.r]}
          raycast={() => null}
        >
          <icosahedronGeometry args={[b.s, 1]} />
          <meshStandardMaterial color={b.c} roughness={1} flatShading />
        </mesh>
      ))}
    </>
  );
}

/** The Theia impact tableau — proto-Earth, the impactor, and a pulsing flash. */
function TheiaCollision() {
  const flashRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (flashRef.current) {
      const p = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 4);
      flashRef.current.scale.setScalar(2.2 + p * 2.8);
      (flashRef.current.material as THREE.MeshBasicMaterial).opacity = 0.35 + p * 0.45;
    }
  });

  return (
    <group>
      <EmberSun radius={5} />
      <mesh position={[34, 0, 0]} raycast={() => null}>
        <sphereGeometry args={[2.6, 40, 40]} />
        <meshStandardMaterial
          color="#3a5fa8"
          roughness={0.85}
          emissive="#16243f"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh position={[41, 3, 6]} raycast={() => null}>
        <icosahedronGeometry args={[1.6, 1]} />
        <meshStandardMaterial
          color="#b5482a"
          roughness={0.95}
          emissive="#5a1c0e"
          emissiveIntensity={0.6}
          flatShading
        />
      </mesh>
      <mesh ref={flashRef} position={[37, 1.4, 3]} raycast={() => null}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#ffd98a"
          transparent
          opacity={0.6}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/** A dense swarm of asteroids on planet-crossing orbits (~10x normal). */
function BombardmentSwarm() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const COUNT = 900;

  const geometry = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#b06a4a',
        roughness: 1,
        emissive: '#3a160c',
        emissiveIntensity: 0.45,
        flatShading: true,
      }),
    [],
  );

  const rocks = useMemo(
    () =>
      Array.from({ length: COUNT }, () => ({
        radius: 12 + Math.random() * 80,
        angle: Math.random() * Math.PI * 2,
        y: (Math.random() - 0.5) * 64,
        scale: 0.15 + Math.random() * 0.55,
        speed: (0.1 + Math.random() * 0.35) * (Math.random() < 0.5 ? -1 : 1),
      })),
    [],
  );

  useFrame((_, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    const dt = Math.min(delta, 0.1);
    rocks.forEach((rock, i) => {
      rock.angle += rock.speed * dt;
      scratch.position.set(
        Math.cos(rock.angle) * rock.radius,
        rock.y,
        Math.sin(rock.angle) * rock.radius,
      );
      scratch.rotation.set(rock.angle, rock.angle * 1.3, 0);
      scratch.scale.setScalar(rock.scale);
      scratch.updateMatrix();
      mesh.setMatrixAt(i, scratch.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={ref} args={[geometry, material, COUNT]} raycast={() => null} />;
}
