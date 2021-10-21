import { useEffect, useRef } from 'react';

import { Plane } from '@react-three/drei';
import { useBlockStore } from '@utilities/BlockStore';

export interface GroundPlaneRef {
  planeColliderRef: React.MutableRefObject<THREE.Mesh | null>;
}

const GroundPlane = () => {
  const planeCollider = useRef<THREE.Mesh | null>(null);
  const setGroundPlaneRef = useBlockStore((state) => state.setGroundPlaneRef);
  const blockSize = useBlockStore((state) => state.blockSize);
  const clusterSize = useBlockStore((state) => state.clusterSize);

  useEffect(() => {
    setGroundPlaneRef({ planeColliderRef: planeCollider });
  });

  return (
    <Plane
      ref={planeCollider}
      visible={false}
      name={'groundPlane'}
      args={[32, 32, 32 / blockSize, 32 / blockSize]}
      rotation={[Math.PI * -0.5, 0, 0]}
      position={[0, clusterSize * -0.5, 0]}
      receiveShadow
    >
      <meshStandardMaterial wireframe={false} color={'#888'} />
    </Plane>
  );
};

export default GroundPlane;
