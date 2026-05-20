import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { BodyDef } from '../../types';
import { MAX_DELTA, ORBIT_SPEED_SCALE, SPIN_SCALE } from '../../lib/orbital';
import { useSceneStore } from '../../store/useSceneStore';
import { bodyToSceneObject } from '../../lib/sceneObject';
import { registerObject, unregisterObject } from '../../lib/registry';
import { PlanetRings } from './PlanetRings';

/** A textured planet that revolves around the Sun, spins on its tilted axis,
 *  and can be clicked to inspect. */
export function Planet({ data }: { data: BodyDef }) {
  const orbitRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const angle = useRef(data.phase);

  const select = useSceneStore((s) => s.select);
  const setHovered = useSceneStore((s) => s.setHovered);
  const paused = useSceneStore((s) => s.paused);
  const isHovered = useSceneStore((s) => s.hovered?.id === data.id);
  const isSelected = useSceneStore((s) => s.selected?.id === data.id);
  const active = isHovered || isSelected;

  // Register the orbit node so the camera rig can follow this planet live.
  useEffect(() => {
    if (orbitRef.current) registerObject(data.id, orbitRef.current);
    return () => unregisterObject(data.id);
  }, [data.id]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, MAX_DELTA);
    if (!paused) {
      angle.current += data.orbitSpeed * ORBIT_SPEED_SCALE * dt;
      if (spinRef.current) {
        spinRef.current.rotation.y += data.spinSpeed * SPIN_SCALE * dt;
      }
    }
    const orbit = orbitRef.current;
    if (orbit) {
      orbit.position.x = Math.cos(angle.current) * data.orbitRadius;
      orbit.position.z = Math.sin(angle.current) * data.orbitRadius;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    select(bodyToSceneObject(data));
  };
  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered({ id: data.id, name: data.name });
    document.body.style.cursor = 'pointer';
  };
  const handleOut = () => {
    setHovered(null);
    document.body.style.cursor = 'auto';
  };

  return (
    <group ref={orbitRef}>
      {active && <GlowShell radius={data.radius} color={data.color} strong={isSelected} />}
      <group rotation={[0, 0, data.tilt]}>
        <group ref={spinRef}>
          <mesh onClick={handleClick} onPointerOver={handleOver} onPointerOut={handleOut}>
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

/** Translucent back-side shell that reads as a rim glow on hover / selection. */
function GlowShell({ radius, color, strong }: { radius: number; color: string; strong: boolean }) {
  return (
    <mesh scale={1.12} raycast={() => null}>
      <sphereGeometry args={[radius, 48, 48]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={strong ? 0.34 : 0.18}
        side={THREE.BackSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
