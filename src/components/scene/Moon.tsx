import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { MoonData } from '../../types';
import { MAX_DELTA, MOON_SPEED_SCALE } from '../../lib/orbital';
import { useSceneStore } from '../../store/useSceneStore';
import { moonToSceneObject } from '../../lib/sceneObject';
import { registerObject, unregisterObject } from '../../lib/registry';
import { moonLayers } from '../../data/planetLayers';
import { DissectedBody } from './DissectedBody';

/** A single clickable, dissectable moon orbiting its parent planet (Feature 4). */
export function Moon({ data }: { data: MoonData }) {
  const orbitRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const angle = useRef(data.phase);
  const sceneId = `moon-${data.id}`;

  const texture = useTexture('/textures/moon.jpg');
  texture.colorSpace = THREE.SRGBColorSpace;

  const select = useSceneStore((s) => s.select);
  const setHovered = useSceneStore((s) => s.setHovered);
  const paused = useSceneStore((s) => s.paused);
  const isHovered = useSceneStore((s) => s.hovered?.id === sceneId);
  const isSelected = useSceneStore((s) => s.selected?.id === sceneId);
  const parentSelected = useSceneStore((s) => s.selected?.id === data.parentId);
  const dissectMode = useSceneStore((s) => s.dissectMode);
  const dissecting = isSelected && dissectMode;
  const frozen = paused || isSelected || parentSelected;
  const active = isHovered || isSelected;

  useEffect(() => {
    if (orbitRef.current) registerObject(sceneId, orbitRef.current);
    return () => unregisterObject(sceneId);
  }, [sceneId]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, MAX_DELTA);
    if (!frozen) {
      const dir = data.retrograde ? -1 : 1;
      angle.current += (dir / data.periodDays) * MOON_SPEED_SCALE * dt;
    }
    if (!paused && meshRef.current) {
      meshRef.current.rotation.y += 0.25 * dt;
    }
    if (orbitRef.current) {
      orbitRef.current.position.set(
        Math.cos(angle.current) * data.orbitRadius,
        0,
        Math.sin(angle.current) * data.orbitRadius,
      );
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const p = orbitRef.current
      ? orbitRef.current.getWorldPosition(new THREE.Vector3())
      : new THREE.Vector3();
    select(moonToSceneObject(data, [p.x, p.y, p.z]));
  };

  return (
    <group ref={orbitRef}>
      {dissecting ? (
        <DissectedBody layers={moonLayers(data)} radius={data.displayRadius} />
      ) : (
        <>
          {active && (
            <mesh scale={1.55} raycast={() => null}>
              <sphereGeometry args={[data.displayRadius, 20, 20]} />
              <meshBasicMaterial
                color="#cdd8ff"
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
              setHovered({ id: sceneId, name: data.name });
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHovered(null);
              document.body.style.cursor = 'auto';
            }}
          >
            <sphereGeometry args={[data.displayRadius, 32, 32]} />
            {data.surface === 'haze' ? (
              <meshStandardMaterial
                color={data.color}
                emissive={data.color}
                emissiveIntensity={0.16}
                roughness={0.85}
                metalness={0}
              />
            ) : (
              <meshStandardMaterial
                map={texture}
                color={data.color}
                roughness={data.surface === 'icy' ? 0.55 : 0.95}
                metalness={0.04}
              />
            )}
          </mesh>
        </>
      )}
    </group>
  );
}
