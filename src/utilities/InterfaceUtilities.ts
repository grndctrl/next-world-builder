import * as THREE from 'three';

import { blockStore } from '@utilities/BlockStore';

function intersectionWorldPosition(intersection: THREE.Intersection): THREE.Vector3 {
  const blockSize = blockStore.getState().blockSize;
  const clusterSize = blockStore.getState().clusterSize;
  let worldPosition: THREE.Vector3 = new THREE.Vector3();

  const matrix = new THREE.Matrix4();

  if (intersection.object.name === 'groundPlane') {
    const x = Math.floor(intersection.point.x / blockSize) * blockSize + 0.5 * blockSize;
    const y = clusterSize * -0.5 - blockSize * 0.5;
    const z = Math.floor(intersection.point.z / blockSize) * blockSize + 0.5 * blockSize;

    worldPosition.set(x, y, z);
  } else if (intersection.object.name === 'blockColliders' && intersection.instanceId !== undefined) {
    const mesh = intersection.object as THREE.InstancedMesh;
    mesh.getMatrixAt(intersection.instanceId, matrix);
    worldPosition = new THREE.Vector3().setFromMatrixPosition(matrix);
  }

  return worldPosition;
}

function isWorldPositionWithinBounds(position: THREE.Vector3): boolean {
  if (
    position.x < -16 ||
    position.x > 16 ||
    position.z < -16 ||
    position.z > 16 ||
    position.y < -4 ||
    position.y > 27
  ) {
    return false;
  }
  return true;
}

export { intersectionWorldPosition, isWorldPositionWithinBounds };
