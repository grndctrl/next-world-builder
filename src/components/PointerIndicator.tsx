import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useBlockStore } from '@utilities/BlockStore';

interface PointerBlockProps {
  intersection: THREE.Intersection;
}

const PointerIndicator = ({ intersection }: PointerBlockProps): JSX.Element => {
  const wrapper = useRef<THREE.Group | null>(null);
  let position = new THREE.Vector3();
  const rotation = new THREE.Euler(0, 0, 0);
  const points = [];
  const blockSize = useBlockStore((state) => state.blockSize);
  const clusterSize = useBlockStore((state) => state.clusterSize);

  points.push(new THREE.Vector3(blockSize * -0.5, blockSize * 0.01, blockSize * -0.5));
  points.push(new THREE.Vector3(blockSize * 0.5, blockSize * 0.01, blockSize * -0.5));
  points.push(new THREE.Vector3(blockSize * 0.5, blockSize * 0.01, blockSize * 0.5));
  points.push(new THREE.Vector3(blockSize * -0.5, blockSize * 0.01, blockSize * 0.5));
  points.push(new THREE.Vector3(blockSize * -0.5, blockSize * 0.01, blockSize * -0.5));

  const matrix = new THREE.Matrix4();
  if (intersection.instanceId !== undefined) {
    const mesh = intersection.object as THREE.InstancedMesh;
    mesh.getMatrixAt(intersection.instanceId, matrix);
  }

  const origin = new THREE.Vector3().setFromMatrixPosition(matrix);
  const faceNormal = intersection.face?.normal;

  if (intersection.object.name === 'groundPlane') {
    const x = Math.floor(intersection.point.x / blockSize) * blockSize + 0.5 * blockSize;
    const y = clusterSize * -0.5 - blockSize * 0.5;
    const z = Math.floor(intersection.point.z / blockSize) * blockSize + 0.5 * blockSize;

    origin.set(x, y, z);
    faceNormal?.set(0, 1, 0);
  }

  if (faceNormal) {
    position = new THREE.Vector3().addVectors(faceNormal.clone().multiplyScalar(blockSize * 0.5), origin);

    rotation.x = faceNormal.z * Math.PI * 0.5 + (faceNormal.y < 0 ? -1 * Math.PI : 0);
    rotation.y = faceNormal.y * Math.PI * 0.5;
    rotation.z = faceNormal.x * Math.PI * -0.5;
  }

  useFrame(({ clock }) => {
    if (wrapper.current && faceNormal) {
      const offset = new THREE.Vector3(faceNormal.x, faceNormal.y, faceNormal.z).multiplyScalar(
        (Math.sin(clock.elapsedTime * 4) + 1) * blockSize * 0.05
      );
      const offsetPosition = new THREE.Vector3().addVectors(position, offset);
      wrapper.current.position.set(offsetPosition.x, offsetPosition.y, offsetPosition.z);
    }
  });

  return (
    <group ref={wrapper} position={position} rotation={rotation}>
      <Line
        blending={THREE.AdditiveBlending}
        clipIntersection={false}
        scale={0.9}
        points={points}
        toneMapped={false}
        color={'#ffffff'}
        linewidth={1}
        opacity={0.8}
      />
    </group>
  );
};

export default PointerIndicator;
