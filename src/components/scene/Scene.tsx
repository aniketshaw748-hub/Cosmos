import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Sun } from './Sun';
import { SolarSystem } from './SolarSystem';
import { AsteroidBelt } from './AsteroidBelt';
import { Starfield } from './Starfield';
import { OrbitTrails } from './OrbitTrails';
import { HoverLabel } from './HoverLabel';
import { CameraRig } from './CameraRig';
import { useSceneStore } from '../../store/useSceneStore';

/** Root 3D scene: camera, lighting, the solar system and post-processing. */
export function Scene() {
  const deselect = useSceneStore((s) => s.deselect);

  return (
    <Canvas
      camera={{ position: [0, 90, 220], fov: 55, near: 0.1, far: 8000 }}
      gl={{ logarithmicDepthBuffer: true, antialias: true }}
      dpr={[1, 2]}
      onPointerMissed={() => deselect()}
    >
      <color attach="background" args={['#05060a']} />
      <ambientLight intensity={0.14} />

      <Suspense fallback={null}>
        <Starfield />
        <Sun />
        <SolarSystem />
        <AsteroidBelt />
      </Suspense>

      <OrbitTrails />
      <HoverLabel />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={2.5}
        maxDistance={1400}
      />
      <CameraRig />

      <EffectComposer>
        <Bloom
          intensity={1.1}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.3}
          mipmapBlur
          radius={0.7}
        />
      </EffectComposer>
    </Canvas>
  );
}
