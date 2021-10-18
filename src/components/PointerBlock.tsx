import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { Box } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useBlockStore } from '@utilities/BlockStore';
import { useInterfaceStore } from '@utilities/InterfaceStore';

interface PointerBlockProps {
  intersection: THREE.Intersection;
}

const PointerBlock = ({ intersection }: PointerBlockProps): JSX.Element => {
  const wrapper = useRef<THREE.Group | null>(null);
  const position = new THREE.Vector3();
  const blockSize = useBlockStore((state) => state.blockSize);
  const { pointerBlockPosition, setPointerBlockPosition } = useInterfaceStore();

  const matrix = new THREE.Matrix4();
  if (intersection.instanceId !== undefined) {
    const mesh = intersection.object as THREE.InstancedMesh;
    mesh.getMatrixAt(intersection.instanceId, matrix);
  }

  const origin = new THREE.Vector3().setFromMatrixPosition(matrix);
  const faceNormal = intersection.face?.normal;

  if (intersection.object.name === 'groundPlane') {
    origin.set(
      Math.floor(intersection.point.x) + 0.5 * blockSize,
      -2.5,
      Math.floor(intersection.point.z) + 0.5 * blockSize
    );

    faceNormal?.set(0, 1, 0);
  }

  if (faceNormal) {
    position.addVectors(faceNormal.clone().multiplyScalar(blockSize), origin);
  }

  useEffect(() => {
    if (position !== pointerBlockPosition) {
      setPointerBlockPosition(position);
    }
  }, []);

  return (
    <group ref={wrapper} position={position}>
      <Box args={[blockSize * 0.8, blockSize * 0.8, blockSize * 0.8]}>
        <meshStandardMaterial opacity={0.5} color={'#ffffff'} />
      </Box>
    </group>
  );
};

export default PointerBlock;
