import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '../../store/useSceneStore';
import { getObject } from '../../lib/registry';

type OrbitLike = { target: THREE.Vector3; update: () => void };

const ORIGIN = new THREE.Vector3(0, 0, 0);

/**
 * Smoothly flies the camera to the selected object, then locks on and follows
 * it as it orbits — so the user can still orbit around a moving planet. With
 * nothing selected, it eases the look-at point back to the Sun, then releases
 * full control back to OrbitControls.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as OrbitLike | null;
  const selected = useSceneStore((s) => s.selected);

  const lastObjPos = useRef(new THREE.Vector3());
  const desiredCam = useRef(new THREE.Vector3());
  const objDelta = useRef(new THREE.Vector3());
  const scratch = useRef(new THREE.Vector3());
  const flying = useRef(false);
  const homing = useRef(false);

  /** Current world position of the selected object (or the Sun at origin). */
  const resolvePos = (out: THREE.Vector3): THREE.Vector3 => {
    if (selected) {
      const obj = getObject(selected.id);
      if (obj) return obj.getWorldPosition(out);
      if (selected.position) return out.set(...selected.position);
    }
    return out.copy(ORIGIN);
  };

  useEffect(() => {
    if (selected) {
      const pos = resolvePos(new THREE.Vector3());
      lastObjPos.current.copy(pos);
      // Keep the current viewing angle, just move in close.
      const dir = new THREE.Vector3().subVectors(camera.position, pos);
      if (dir.lengthSq() < 1e-4) dir.set(0, 0.45, 1);
      dir.normalize();
      const distance = Math.max(selected.radius * 4.5, 6);
      desiredCam.current.copy(pos).addScaledVector(dir, distance);
      desiredCam.current.y += selected.radius * 1.4 + 1;
      flying.current = true;
      homing.current = false;
    } else {
      flying.current = false;
      homing.current = true;
    }
  }, [selected, camera]);

  useFrame((_, delta) => {
    if (!controls) return;
    const dt = Math.min(delta, 0.1);

    if (selected) {
      const pos = resolvePos(scratch.current);
      objDelta.current.subVectors(pos, lastObjPos.current);
      lastObjPos.current.copy(pos);

      if (flying.current) {
        const a = 1 - Math.pow(0.0009, dt); // frame-rate-independent easing
        camera.position.lerp(desiredCam.current, a);
        controls.target.lerp(pos, a);
        desiredCam.current.add(objDelta.current); // keep approach point glued on
        if (camera.position.distanceTo(desiredCam.current) < 0.4) flying.current = false;
      } else {
        // Locked on: track the planet 1:1 so the user can orbit around it.
        camera.position.add(objDelta.current);
        controls.target.copy(pos);
      }
      controls.update();
    } else if (homing.current) {
      const a = 1 - Math.pow(0.02, dt);
      controls.target.lerp(ORIGIN, a);
      controls.update();
      if (controls.target.lengthSq() < 0.4) homing.current = false;
    }
  });

  return null;
}
