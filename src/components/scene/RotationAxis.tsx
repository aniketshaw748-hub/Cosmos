import { Html } from '@react-three/drei';

/**
 * Feature 2 — a thin glowing pole-to-pole axis line. It is rendered inside a
 * body's tilt group (already at the correct axial tilt) but outside its spin
 * group, so the body visibly rotates around a fixed axis.
 */
export function RotationAxis({ radius }: { radius: number }) {
  const length = radius * 2.7;
  const core = Math.max(radius * 0.025, 0.015);

  return (
    <group>
      {/* Solid core line. */}
      <mesh raycast={() => null}>
        <cylinderGeometry args={[core, core, length, 12]} />
        <meshBasicMaterial color="#bdecff" toneMapped={false} transparent opacity={0.9} />
      </mesh>
      {/* Soft glow sheath. */}
      <mesh raycast={() => null}>
        <cylinderGeometry args={[core * 2.6, core * 2.6, length, 12]} />
        <meshBasicMaterial
          color="#7fd1ff"
          toneMapped={false}
          transparent
          opacity={0.16}
          depthWrite={false}
        />
      </mesh>

      <Html
        position={[0, length / 2 + radius * 0.24, 0]}
        center
        zIndexRange={[12, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <span className="select-none rounded-full border border-cyan-300/30 bg-[#0a0d16]/85 px-1.5 py-0.5 text-[10px] font-bold text-cyan-200">
          N
        </span>
      </Html>
      <Html
        position={[0, -length / 2 - radius * 0.24, 0]}
        center
        zIndexRange={[12, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <span className="select-none rounded-full border border-cyan-300/30 bg-[#0a0d16]/85 px-1.5 py-0.5 text-[10px] font-bold text-cyan-200">
          S
        </span>
      </Html>
    </group>
  );
}
