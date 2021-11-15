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
  const size = 32 * blockSize;
  useEffect(() => {
    setGroundPlaneRef({ planeColliderRef: planeCollider });
  });

  return (
    <Plane
      ref={planeCollider}
      visible={false}
      name={'groundPlane'}
      args={[size, size, size / blockSize, size / blockSize]}
      rotation={[Math.PI * -0.5, 0, 0]}
      position={[0, clusterSize * -0.5, 0]}
      receiveShadow
    >
      <meshStandardMaterial wireframe={true} color={'#888'} />
    </Plane>
  );
};

export default GroundPlane;
