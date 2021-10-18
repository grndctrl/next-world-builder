import * as THREE from 'three';

import { blockStore } from '@utilities/BlockStore';

function intersectionWorldPosition(intersection: THREE.Intersection): THREE.Vector3 {
  const blockSize = blockStore.getState().blockSize;
  let worldPosition: THREE.Vector3 = new THREE.Vector3();

  const matrix = new THREE.Matrix4();

  if (intersection.object.name === 'groundPlane') {
    worldPosition.set(
      Math.floor(intersection.point.x) + 0.5 * blockSize,
      -2.5,
      Math.floor(intersection.point.z) + 0.5 * blockSize
    );
  } else if (intersection.object.name === 'blockColliders' && intersection.instanceId !== undefined) {
    const mesh = intersection.object as THREE.InstancedMesh;
    mesh.getMatrixAt(intersection.instanceId, matrix);
    worldPosition = new THREE.Vector3().setFromMatrixPosition(matrix);
  }

  return worldPosition;
}

export { intersectionWorldPosition };
