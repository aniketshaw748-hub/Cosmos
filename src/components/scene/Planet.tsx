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
import { RotationAxis } from './RotationAxis';
import { DissectedPlanet } from './DissectedPlanet';
import { MoonSystem } from './MoonSystem';

/** A textured planet that revolves around the Sun, spins on its tilted axis,
 *  and can be clicked to inspect, dissect, and explore its moons. */
export function Planet({ data }: { data: BodyDef }) {
  const orbitRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const angle = useRef(data.phase);

  const select = useSceneStore((s) => s.select);
  const setHovered = useSceneStore((s) => s.setHovered);
  const paused = useSceneStore((s) => s.paused);
  const isHovered = useSceneStore((s) => s.hovered?.id === data.id);
  const isSelected = useSceneStore((s) => s.selected?.id === data.id);
  const dissectMode = useSceneStore((s) => s.dissectMode);
  const childMoonSelected = useSceneStore(
    (s) => s.selected?.kind === 'moon' && s.selected?.parentId === data.id,
  );
  const dissecting = isSelected && dissectMode;
  const frozenOrbit = isSelected || childMoonSelected;
  const active = isHovered || isSelected;

  // Register the orbit node so the camera rig can follow this planet live.
  useEffect(() => {
    if (orbitRef.current) registerObject(data.id, orbitRef.current);
    return () => unregisterObject(data.id);
  }, [data.id]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, MAX_DELTA);
    // Orbit freezes when this planet (or one of its moons) is focused.
    if (!paused && !frozenOrbit) {
      angle.current += data.orbitSpeed * ORBIT_SPEED_SCALE * dt;
    }
    // Axial spin continues even while focused — only a global pause stops it.
    if (!paused && spinRef.current) {
      spinRef.current.rotation.y += data.spinSpeed * SPIN_SCALE * dt;
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
      {active && !dissecting && (
        <GlowShell radius={data.radius} color={data.color} strong={isSelected} />
      )}

      <group rotation={[0, 0, data.tilt]}>
        {dissecting ? (
          <DissectedPlanet planetId={data.id} radius={data.radius} />
        ) : (
          <>
            <group ref={spinRef}>
              <mesh onClick={handleClick} onPointerOver={handleOver} onPointerOut={handleOut}>
                <sphereGeometry args={[data.radius, 64, 64]} />
                {data.textureUrl ? (
                  data.nightUrl ? (
                    <RichSurface dayUrl={data.textureUrl} nightUrl={data.nightUrl} />
                  ) : (
                    <TexturedSurface url={data.textureUrl} />
                  )
                ) : (
                  <meshStandardMaterial color={data.color} roughness={0.9} metalness={0.05} />
                )}
              </mesh>
            </group>
            {data.cloudUrl && <CloudLayer url={data.cloudUrl} radius={data.radius} />}
            {data.rings && <PlanetRings rings={data.rings} />}
            {isSelected && <RotationAxis radius={data.radius} />}
          </>
        )}
      </group>

      {/* Moons orbit the planet (Feature 4). */}
      {!dissecting && <MoonSystem planetId={data.id} />}
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

/** Earth-style surface: a day map plus a night-side city-lights emissive map. */
function RichSurface({ dayUrl, nightUrl }: { dayUrl: string; nightUrl: string }) {
  const [day, night] = useTexture([dayUrl, nightUrl]);
  day.colorSpace = THREE.SRGBColorSpace;
  night.colorSpace = THREE.SRGBColorSpace;
  day.anisotropy = 8;
  return (
    <meshStandardMaterial
      map={day}
      emissiveMap={night}
      emissive="#ffffff"
      emissiveIntensity={0.6}
      roughness={0.9}
      metalness={0.04}
    />
  );
}

/** A transparent cloud shell that rotates slightly faster than the surface. */
function CloudLayer({ url, radius }: { url: string; radius: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const texture = useTexture(url);
  const paused = useSceneStore((s) => s.paused);
  useFrame((_, delta) => {
    if (!paused && ref.current) {
      ref.current.rotation.y += 1.15 * SPIN_SCALE * Math.min(delta, MAX_DELTA);
    }
  });
  return (
    <mesh ref={ref} raycast={() => null}>
      <sphereGeometry args={[radius * 1.015, 48, 48]} />
      <meshStandardMaterial
        color="#ffffff"
        alphaMap={texture}
        transparent
        depthWrite={false}
        roughness={1}
      />
    </mesh>
  );
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
