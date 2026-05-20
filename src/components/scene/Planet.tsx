import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { BodyDef } from '../../types';
import { MAX_DELTA, ORBIT_SPEED_SCALE, SPIN_SCALE } from '../../lib/orbital';
import { PlanetRings } from './PlanetRings';

interface PlanetProps {
  data: BodyDef;
}

/** A textured planet that revolves around the Sun and spins on its tilted axis. */
export function Planet({ data }: PlanetProps) {
  const orbitRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const angle = useRef(data.phase);

  useFrame((_, delta) => {
    const dt = Math.min(delta, MAX_DELTA);
    angle.current += data.orbitSpeed * ORBIT_SPEED_SCALE * dt;
    const orbit = orbitRef.current;
    if (orbit) {
      orbit.position.x = Math.cos(angle.current) * data.orbitRadius;
      orbit.position.z = Math.sin(angle.current) * data.orbitRadius;
    }
    if (spinRef.current) {
      spinRef.current.rotation.y += data.spinSpeed * SPIN_SCALE * dt;
    }
  });

  return (
    <group ref={orbitRef}>
      <group rotation={[0, 0, data.tilt]}>
        <group ref={spinRef}>
          <mesh>
            <sphereGeometry args={[data.radius, 64, 64]} />
            {data.textureUrl ? (
              <TexturedSurface url={data.textureUrl} />
            ) : (
              <meshStandardMaterial color={data.color} roughness={0.9} metalness={0.05} />
            )}
          </mesh>
        </group>
        {data.rings && <PlanetRings rings={data.rings} />}
      </group>
    </group>
  );
}

/** Loads the equirectangular surface map; suspends until the texture is ready. */
function TexturedSurface({ url }: { url: string }) {
  const texture = useTexture(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return <meshStandardMaterial map={texture} roughness={0.92} metalness={0.04} />;
}
