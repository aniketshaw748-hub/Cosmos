import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { SUN } from '../../data/planets';
import { MAX_DELTA } from '../../lib/orbital';

/** The Sun: a self-lit textured sphere plus the scene's main light source. */
export function Sun() {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(SUN.textureUrl!);
  texture.colorSpace = THREE.SRGBColorSpace;

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += SUN.spinSpeed * Math.min(delta, MAX_DELTA);
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
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
      <mesh scale={1.22}>
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
