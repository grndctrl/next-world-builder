import { uniq } from 'lodash';
import * as THREE from 'three';

import { ClustersType, ClusterType, Material } from '@components/Cluster';
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

function clustersAtOrigin(clusterOrigin: THREE.Vector3): ClusterType[] {
  const rockClusters = blockStore.getState().clusters[Material.ROCK];
  const brickClusters = blockStore.getState().clusters[Material.BRICK];
  const clusters = [...rockClusters, ...brickClusters];

  let clustersAtOrigin: ClusterType[] = [];

  clusters.forEach((cluster) => {
    if (cluster.origin.equals(clusterOrigin)) {
      clustersAtOrigin.push(cluster);
    }
  });

  return clustersAtOrigin;
}

function clusterTypeIndexFromOrigin(type: Material, clusterOrigin: THREE.Vector3): number {
  const clusters = blockStore.getState().clusters[type];

  let clusterIndex = -1;

  for (let i = 0; i < clusters.length; i++) {
    if (clusters[i].origin.equals(clusterOrigin)) {
      clusterIndex = clusters[i].index;
    }
  }

  return clusterIndex;
}

function isBlockAtBottom(worldPosition: THREE.Vector3) {
  const { blockSize, clusterSize } = blockStore.getState();
  const bottom = clusterSize * -0.5 + blockSize * 0.5;

  return worldPosition.y === bottom;
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

function isTypeBlockAtWorldPosition(type: Material, worldPosition: THREE.Vector3): boolean {
  const clusters = blockStore.getState().clusters;

  const clusterOrigin = clusterOriginFromWorldPosition(worldPosition);
  const localPosition = worldPosition.clone().sub(clusterOrigin);
  const index = indexFromLocalPosition(localPosition);

  let block = false;

  clusters[type].forEach((cluster) => {
    if (cluster.origin.equals(clusterOrigin)) {
      block = block === false ? cluster.blocks[index] : true;
    }
  });

  return block;
}

function isBlockAtWorldPosition(worldPosition: THREE.Vector3): boolean {
  const clusters = blockStore.getState().clusters;
  const allClusters = [];

  const clusterOrigin = clusterOriginFromWorldPosition(worldPosition);
  const localPosition = worldPosition.clone().sub(clusterOrigin);
  const index = indexFromLocalPosition(localPosition);

  allClusters.push(...clusters[Material.ROCK]);
  allClusters.push(...clusters[Material.BRICK]);

  let block = false;

  allClusters.forEach((cluster) => {
    // console.log(cluster.origin);
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

      indexes.push(clusterTypeIndexFromOrigin(Material.BRICK, origin));
      indexes.push(clusterTypeIndexFromOrigin(Material.ROCK, origin));

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

function typeNeighboursForWorldPosition(type: Material, worldPosition: THREE.Vector3): boolean[] {
  const neighbourPositions = neighbourPositionsForWorldPosition(worldPosition);

  const neighbours = neighbourPositions.map((position, index) => {
    return isTypeBlockAtWorldPosition(type, position);
  });

  return neighbours;
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

function parseImportedClusters(importedClusters: string): ClustersType {
  const parsedClusters = JSON.parse(importedClusters);

  const rockClusters = parsedClusters[Material.ROCK].map(
    (parsedCluster: ClusterType) =>
      ({
        index: parsedCluster.index,
        type: parsedCluster.type as Material,
        origin: new THREE.Vector3(parsedCluster.origin.x, parsedCluster.origin.y, parsedCluster.origin.z),
        blocks: parsedCluster.blocks,
      } as ClusterType)
  );

  const brickClusters = parsedClusters[Material.BRICK].map(
    (parsedCluster: ClusterType) =>
      ({
        index: parsedCluster.index,
        type: parsedCluster.type as Material,
        origin: new THREE.Vector3(parsedCluster.origin.x, parsedCluster.origin.y, parsedCluster.origin.z),
        blocks: parsedCluster.blocks,
      } as ClusterType)
  );

  return {
    [Material.ROCK]: rockClusters,
    [Material.BRICK]: brickClusters,
  };
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
  clusterOriginFromWorldPosition,
  clusterTypeIndexFromOrigin,
  clustersAtOrigin,
  hashFromNeighbours,
  indexFromLocalPosition,
  isBlockAtBottom,
  isBlockAtWorldPosition,
  isTypeBlockAtWorldPosition,
  localPositionFromWorldPosition,
  neighbourClustersForWorldPosition,
  neighbourPositionsForWorldPosition,
  neighboursForWorldPosition,
  neighboursFromHash,
  parseImportedClusters,
  typeNeighboursForWorldPosition,
};
