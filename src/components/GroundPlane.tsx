import { useEffect, useRef } from 'react';

import { Plane } from '@react-three/drei';
import { useBlockStore } from '@utilities/BlockStore';

export interface GroundPlaneRef {
  planeColliderRef: React.MutableRefObject<THREE.Mesh | null>;
}

const GroundPlane = () => {
  const planeCollider = useRef<THREE.Mesh | null>(null);
  const setGroundPlaneRef = useBlockStore((state) => state.setGroundPlaneRef);

  useEffect(() => {
    setGroundPlaneRef({ planeColliderRef: planeCollider });
  });

  return (
    <Plane
      ref={planeCollider}
      visible={true}
      name={'groundPlane'}
      args={[32, 32, 32, 32]}
      rotation={[Math.PI * -0.5, 0, 0]}
      position={[0, -2, 0]}
      receiveShadow
    >
      <meshStandardMaterial wireframe={false} color={'#888'} />
    </Plane>
  );
};

export default GroundPlane;
