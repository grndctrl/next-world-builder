import { uniq } from 'lodash';
import * as THREE from 'three';

import { Material } from '@components/Cluster';
import { blockStore } from '@utilities/BlockStore';
import { roundedVector3 } from '@utilities/MathUtilities';

function localPositionFromWorldPosition(worldPosition: THREE.Vector3): THREE.Vector3 {
  const clusterOrigin = clusterOriginFromWorldPosition(worldPosition);
  const localPosition = worldPosition.clone().sub(clusterOrigin);

  return localPosition;
}

function clusterOriginFromWorldPosition(worldPosition: THREE.Vector3): THREE.Vector3 {
  const { clusterSize, blockSize } = blockStore.getState();
  const offset = clusterSize * 0.5 - 0.5;
  const clusterOrigin = worldPosition
    .clone()
    .addScalar(offset)
    .divideScalar(clusterSize)
    .floor()
    .multiplyScalar(clusterSize);

  return clusterOrigin;
}

function clusterIndexFromOrigin(type: Material, clusterOrigin: THREE.Vector3): number {
  const clusters = blockStore.getState().clusters[type];

  let clusterIndex = -1;

  for (let i = 0; i < clusters.length; i++) {
    if (clusters[i].origin.equals(clusterOrigin)) {
      clusterIndex = i;
    }
  }

  return clusterIndex;
}

function indexFromLocalPosition(localPosition: THREE.Vector3): number {
  const { blockSize, clusterSize, blocksPerClusterAxis } = blockStore.getState();
  const offset = blocksPerClusterAxis * 0.5 - 0.5;
  const arrayPosition = localPosition.clone().divideScalar(blockSize).addScalar(offset);

  const x = arrayPosition.x;
  const y = arrayPosition.y * blocksPerClusterAxis;
  const z = arrayPosition.z * blocksPerClusterAxis * blocksPerClusterAxis;

  const index = x + y + z;

  return index;
}

function isBlockAtWorldPosition(worldPosition: THREE.Vector3): boolean {
  const clusters = blockStore.getState().clusters;
  const allClusters = [];

  const clusterOrigin = clusterOriginFromWorldPosition(worldPosition);
  const localPosition = worldPosition.clone().sub(clusterOrigin);
  const index = indexFromLocalPosition(localPosition);

  allClusters.push(...clusters[Material.ROCK]);
  allClusters.push(...clusters[Material.DIRT]);

  let block = false;

  allClusters.forEach((cluster) => {
    if (cluster.origin.equals(clusterOrigin)) {
      block = block === false ? cluster.blocks[index] : true;
    }
  });

  return block;
}

function neighbourClustersForWorldPosition(worldPosition: THREE.Vector3): number[] {
  const neighbourPositions = neighbourPositionsForWorldPosition(worldPosition);

  const clusters: number[] = [];
  neighbourPositions.forEach((position, index) => {
    if (isBlockAtWorldPosition(position)) {
      const origin = clusterOriginFromWorldPosition(position);

      const indexes = [];

      indexes.push(clusterIndexFromOrigin(Material.DIRT, origin));
      indexes.push(clusterIndexFromOrigin(Material.ROCK, origin));

      indexes.forEach((index) => {
        if (index > -1) {
          clusters.push(index);
        }
      });
    }
  });

  return uniq(clusters);
}

function neighbourPositionsForWorldPosition(worldPosition: THREE.Vector3): THREE.Vector3[] {
  const blockSize = blockStore.getState().blockSize;

  const neighbourPositions = [];
  for (let z = -1; z < 2; z++) {
    for (let y = -1; y < 2; y++) {
      for (let x = -1; x < 2; x++) {
        if (
          !(
            (x === 0 && y === 0 && z === 0) ||
            (x === -1 && y === -1 && z === -1) ||
            (x === 1 && y === -1 && z === -1) ||
            (x === -1 && y === 1 && z === -1) ||
            (x === 1 && y === 1 && z === -1) ||
            (x === -1 && y === -1 && z === 1) ||
            (x === 1 && y === -1 && z === 1) ||
            (x === -1 && y === 1 && z === 1) ||
            (x === 1 && y === 1 && z === 1)
          )
        ) {
          const position = new THREE.Vector3(blockSize * x, blockSize * y, blockSize * z);
          position.add(worldPosition);
          neighbourPositions.push(roundedVector3(position, 1e-6));
        }
      }
    }
  }

  return neighbourPositions;
}

function neighboursForWorldPosition(worldPosition: THREE.Vector3): boolean[] {
  const neighbourPositions = neighbourPositionsForWorldPosition(worldPosition);

  const neighbours = neighbourPositions.map((position, index) => {
    return isBlockAtWorldPosition(position);
  });

  return neighbours;
}

function hashFromNeighbours(neighbours: boolean[]): number {
  let hash = 0;

  for (let i = 0; i < neighbours.length; i++) {
    hash = neighbours[i] ? hash + Math.pow(2, i) : hash;
  }

  return hash;
}

function neighboursFromHash(hash: number): boolean[] {
  let neighbours = Array.from({ length: 18 }).map(() => false);

  for (let i = 0; i < neighbours.length; i++) {
    const index = neighbours.length - 1 - i;

    if (hash - Math.pow(2, index) > -1) {
      neighbours[index] = true;
      hash = hash - Math.pow(2, index);
    }
  }

  return neighbours;
}

export {
  clusterIndexFromOrigin,
  clusterOriginFromWorldPosition,
  hashFromNeighbours,
  indexFromLocalPosition,
  isBlockAtWorldPosition,
  localPositionFromWorldPosition,
  neighbourClustersForWorldPosition,
  neighbourPositionsForWorldPosition,
  neighboursForWorldPosition,
  neighboursFromHash,
};
