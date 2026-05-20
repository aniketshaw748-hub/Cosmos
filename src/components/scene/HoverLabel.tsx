import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore } from '../../store/useSceneStore';
import { getObject } from '../../lib/registry';

/** A floating name label that tracks whichever object is under the cursor. */
export function HoverLabel() {
  const hovered = useSceneStore((s) => s.hovered);
  const selectedId = useSceneStore((s) => s.selected?.id);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (hovered && groupRef.current) {
      const obj = getObject(hovered.id);
      if (obj) obj.getWorldPosition(groupRef.current.position);
    }
  });

  // Hide it for the already-selected object — the panel already names it.
  const visible = !!hovered && hovered.id !== selectedId;

  return (
    <group ref={groupRef}>
      <Html center zIndexRange={[15, 0]} style={{ pointerEvents: 'none' }}>
        <div
          className={`select-none whitespace-nowrap rounded-full border border-white/15 bg-[#0a0d16]/90 px-3 py-1 text-xs font-medium text-white/90 shadow-lg backdrop-blur-sm transition-opacity duration-150 ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transform: 'translateY(-220%)' }}
        >
          {hovered?.name ?? ''}
        </div>
      </Html>
    </group>
  );
}
