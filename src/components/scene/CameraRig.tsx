import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '../../store/useSceneStore';
import { getObject } from '../../lib/registry';

type OrbitLike = {
  target: THREE.Vector3;
  update: () => void;
  enableRotate: boolean;
  enablePan: boolean;
};

const ORIGIN = new THREE.Vector3(0, 0, 0);

/** How far left of screen-centre the focused object sits (0 = centre, 1 = edge). */
const FOCUS_OFFSET = 0.42;

/**
 * Feature 1 — Click-to-Focus. On selection the camera eases in and frames the
 * (now frozen) object in the left part of the screen, leaving room for the
 * info panel on the right. Camera rotation is locked while focused so the
 * object stays put; deselecting releases free orbit again.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls) as OrbitLike | null;
  const selected = useSceneStore((s) => s.selected);

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

      const distance = Math.max(selected.radius * 5, 7);

      // Shift the look-at point right so the object renders on the left.
      const vFov = ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 180;
      const aspect = size.width / Math.max(size.height, 1);
      const hHalf = Math.atan(Math.tan(vFov / 2) * aspect);
      const shift = FOCUS_OFFSET * distance * Math.tan(hHalf);
      const right = new THREE.Vector3().crossVectors(camera.up, viewDir).normalize();

      desiredCam.current
        .copy(focus)
        .addScaledVector(viewDir, distance)
        .addScaledVector(camera.up, selected.radius * 1.1);
      desiredTarget.current.copy(focus).addScaledVector(right, shift);

      flying.current = true;
      homing.current = false;
      controls.enableRotate = false;
      controls.enablePan = false;
    } else {
      flying.current = false;
      homing.current = true;
      controls.enableRotate = true;
      controls.enablePan = true;
    }
  }, [selected, controls, camera, size.width, size.height]);

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
