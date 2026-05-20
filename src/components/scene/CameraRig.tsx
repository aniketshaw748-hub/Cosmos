import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '../../store/useSceneStore';
import { getObject } from '../../lib/registry';

type OrbitLike = {
  target: THREE.Vector3;
  update: () => void;
  addEventListener: (type: string, handler: () => void) => void;
  removeEventListener: (type: string, handler: () => void) => void;
};

const ORIGIN = new THREE.Vector3(0, 0, 0);

/**
 * Feature 1 — Click-to-Focus. On selection the camera eases in to the object.
 * The object itself is the OrbitControls anchor (so orbit / pan / zoom are
 * intuitive), and a projection view-offset frames it in the left of the
 * screen, leaving room for the info panel. Any manual interaction cancels the
 * auto-fly; deselecting eases back to a free view.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls) as OrbitLike | null;
  const selected = useSceneStore((s) => s.selected);
  const dissectMode = useSceneStore((s) => s.dissectMode);

  const desiredCam = useRef(new THREE.Vector3());
  const desiredTarget = useRef(new THREE.Vector3());
  const flying = useRef(false);
  const homing = useRef(false);

  /** World position of the selected object (or the origin). */
  const resolvePos = (out: THREE.Vector3): THREE.Vector3 => {
    if (selected) {
      const obj = getObject(selected.id);
      if (obj) return obj.getWorldPosition(out);
      if (selected.position) return out.set(...selected.position);
    }
    return out.copy(ORIGIN);
  };

  useEffect(() => {
    if (!controls) return;

    if (selected) {
      const focus = resolvePos(new THREE.Vector3());
      // Keep the current viewing angle so it feels like a pull-in, not a cut.
      const viewDir = new THREE.Vector3().subVectors(camera.position, focus);
      if (viewDir.lengthSq() < 1e-4) viewDir.set(0.55, 0.4, 1);
      viewDir.normalize();

      // Zoom in closer when dissecting so the cross-section reads clearly.
      const distance = dissectMode
        ? Math.max(selected.radius * 4, 8)
        : Math.max(selected.radius * 5, 7);

      // The object itself is the orbit anchor.
      desiredTarget.current.copy(focus);
      desiredCam.current
        .copy(focus)
        .addScaledVector(viewDir, distance)
        .addScaledVector(camera.up, selected.radius * 1.1);

      // A projection offset frames the object in the left of the screen
      // without moving the orbit anchor off the object.
      const shiftFrac = dissectMode ? 0.26 : 0.18;
      camera.setViewOffset(
        size.width,
        size.height,
        shiftFrac * size.width,
        0,
        size.width,
        size.height,
      );

      flying.current = true;
      homing.current = false;
    } else {
      camera.clearViewOffset();
      flying.current = false;
      homing.current = true;
    }
  }, [selected, dissectMode, controls, camera, size.width, size.height]);

  // Any manual camera interaction (orbit / pan / zoom) cancels the auto-fly.
  useEffect(() => {
    if (!controls) return;
    const cancel = () => {
      flying.current = false;
      homing.current = false;
    };
    controls.addEventListener('start', cancel);
    return () => controls.removeEventListener('start', cancel);
  }, [controls]);

  useFrame((_, delta) => {
    if (!controls) return;
    const dt = Math.min(delta, 0.1);

    // Feature 9 — hint at the wider universe once the camera is far out.
    if (camera.position.lengthSq() > 1_000_000) {
      useSceneStore.getState().triggerToast();
    }

    if (selected && flying.current) {
      const a = 1 - Math.pow(0.004, dt); // frame-rate-independent ~1.2s ease
      camera.position.lerp(desiredCam.current, a);
      controls.target.lerp(desiredTarget.current, a);
      controls.update();
      if (camera.position.distanceTo(desiredCam.current) < 0.06) {
        camera.position.copy(desiredCam.current);
        controls.target.copy(desiredTarget.current);
        controls.update();
        flying.current = false;
      }
    } else if (homing.current) {
      const a = 1 - Math.pow(0.02, dt);
      controls.target.lerp(ORIGIN, a);
      controls.update();
      if (controls.target.lengthSq() < 0.4) homing.current = false;
    }
  });

  return null;
}
