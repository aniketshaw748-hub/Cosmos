import { Stars } from '@react-three/drei';

/** Procedural starfield backdrop. Radius exceeds the camera's max distance so
 *  the stars always surround the viewer. */
export function Starfield() {
  return (
    <Stars radius={2600} depth={700} count={6000} factor={5} saturation={0} fade speed={0.3} />
  );
}
