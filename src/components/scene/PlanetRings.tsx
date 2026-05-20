import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { RingConfig } from '../../types';

/**
 * A flat ring system (Saturn). The default RingGeometry UVs project the
 * texture as a square, which smears a radial strip — so we remap every UV so
 * the strip samples cleanly from the inner edge to the outer edge.
 */
export function PlanetRings({ rings }: { rings: RingConfig }) {
  const [colorMap, alphaMap] = useTexture([rings.colorMap, rings.alphaMap]);
  colorMap.colorSpace = THREE.SRGBColorSpace;

  const geometry = useMemo(() => {
    const geo = new THREE.RingGeometry(rings.innerRadius, rings.outerRadius, 160, 1);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const radial = (v.length() - rings.innerRadius) / (rings.outerRadius - rings.innerRadius);
      uv.setXY(i, radial, 0.5);
    }
    uv.needsUpdate = true;
    return geo;
  }, [rings.innerRadius, rings.outerRadius]);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial
        map={colorMap}
        alphaMap={alphaMap}
        transparent
        side={THREE.DoubleSide}
        roughness={0.8}
        metalness={0}
        depthWrite={false}
      />
    </mesh>
  );
}
