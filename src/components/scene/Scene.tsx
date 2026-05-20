import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Sun } from './Sun';
import { SolarSystem } from './SolarSystem';
import { AsteroidBelt } from './AsteroidBelt';
import { BackgroundUniverse } from './BackgroundUniverse';
import { OrbitTrails } from './OrbitTrails';
import { HoverLabel } from './HoverLabel';
import { CameraRig } from './CameraRig';
import { TimelineScene } from './TimelineScene';
import { useSceneStore } from '../../store/useSceneStore';
import { milestoneAt } from '../../data/timelineMilestones';

/** Root 3D scene: camera, lighting, the solar system / timeline and post-FX. */
export function Scene() {
  const deselect = useSceneStore((s) => s.deselect);
  const triggerToast = useSceneStore((s) => s.triggerToast);
  const highQuality = useSceneStore((s) => s.highQuality);
  const timelineOpen = useSceneStore((s) => s.timelineOpen);
  const timelinePosition = useSceneStore((s) => s.timelinePosition);

  const era = timelineOpen ? milestoneAt(timelinePosition).milestone.era : 'modern';
  // The detailed solar system shows for the modern, life and bombardment eras.
  const showRealSystem = era === 'modern' || era === 'life' || era === 'bombardment';

  return (
    <Canvas
      camera={{ position: [0, 90, 220], fov: 55, near: 0.1, far: 8000 }}
      gl={{ logarithmicDepthBuffer: true, antialias: true }}
      dpr={highQuality ? [1, 2] : [1, 1.25]}
      onPointerMissed={() => {
        deselect();
        triggerToast();
      }}
    >
      <color attach="background" args={['#05060a']} />
      <ambientLight intensity={0.14} />

      <BackgroundUniverse />

      <Suspense fallback={null}>
        {showRealSystem && (
          <>
            <Sun />
            <SolarSystem />
            <AsteroidBelt />
          </>
        )}
        {timelineOpen && era !== 'modern' && <TimelineScene era={era} />}
      </Suspense>

      {showRealSystem && <OrbitTrails />}
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
