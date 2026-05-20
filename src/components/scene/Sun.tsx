import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { SUN } from '../../data/planets';
import { MAX_DELTA } from '../../lib/orbital';
import { useSceneStore } from '../../store/useSceneStore';
import { bodyToSceneObject } from '../../lib/sceneObject';
import { registerObject, unregisterObject } from '../../lib/registry';

/** The Sun: a self-lit textured sphere, the scene's main light, and selectable. */
export function Sun() {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(SUN.textureUrl!);
  texture.colorSpace = THREE.SRGBColorSpace;

  const select = useSceneStore((s) => s.select);
  const setHovered = useSceneStore((s) => s.setHovered);
  const paused = useSceneStore((s) => s.paused);

  useEffect(() => {
    if (meshRef.current) registerObject(SUN.id, meshRef.current);
    return () => unregisterObject(SUN.id);
  }, []);

  useFrame((_, delta) => {
    if (!paused && meshRef.current) {
      meshRef.current.rotation.y += SUN.spinSpeed * Math.min(delta, MAX_DELTA);
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          select(bodyToSceneObject(SUN));
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHovered({ id: SUN.id, name: SUN.name });
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[SUN.radius, 64, 64]} />
        {/* Emissive map keeps the Sun bright above 1.0 so the bloom pass catches it. */}
        <meshStandardMaterial
          emissiveMap={texture}
          emissive="#ffffff"
          emissiveIntensity={2.2}
          color="#000000"
          toneMapped={false}
        />
      </mesh>

      {/* Soft corona halo. */}
      <mesh scale={1.22} raycast={() => null}>
        <sphereGeometry args={[SUN.radius, 32, 32]} />
        <meshBasicMaterial
          color="#ff9d2f"
          transparent
          opacity={0.16}
          side={THREE.BackSide}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* Main light. decay 0 so even Neptune is lit in this stylised scene. */}
      <pointLight intensity={3} distance={0} decay={0} color="#fff6e0" />
    </group>
  );
}
