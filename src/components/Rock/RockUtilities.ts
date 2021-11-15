import { difference } from 'lodash';
import * as THREE from 'three';
import { mergeBufferGeometries, mergeVertices } from 'three-stdlib';

import SimplexNoise from '@src/utilities/SimplexNoise';
import { blockStore } from '@utilities/BlockStore';
import { isBlockAtBottom, typeNeighboursForWorldPosition } from '@utilities/BlockUtilities';
import * as GeometryGenerators from '@utilities/GeometryGenerators';
import * as GeometryModifiers from '@utilities/GeometryModifiers';
import * as GeometryUtilities from '@utilities/GeometryUtilities';
import * as MathUtilities from '@utilities/MathUtilities';

import { ClusterType } from '../Cluster';

function pushTopSegment(geometry: THREE.BufferGeometry, blockSize: number, segments: number): THREE.BufferGeometry {
  geometry = geometry.clone();

  const half = blockSize * 0.5;
  const segment = blockSize / segments;
  const topSegment = half - segment * 0.5;

  const { position } = geometry.attributes;
  GeometryUtilities.positionIndicesAtY(position as THREE.BufferAttribute, half - segment).forEach((index) => {
    position.setY(index, topSegment);
  });

  return geometry;
}

function generateRockCluster(cluster: ClusterType): THREE.BufferGeometry | null {
  const { clusterSize, blocksPerClusterAxis, blockSize } = blockStore.getState();
  const blocks: THREE.BufferGeometry[] = [];

  for (let z = 0; z < blocksPerClusterAxis; z++) {
    for (let y = 0; y < blocksPerClusterAxis; y++) {
      for (let x = 0; x < blocksPerClusterAxis; x++) {
        const index = x + y * blocksPerClusterAxis + z * blocksPerClusterAxis * blocksPerClusterAxis;

        if (cluster.blocks[index]) {
          const localPosition = new THREE.Vector3(x, y, z);
          localPosition.subScalar((blocksPerClusterAxis - 1) * 0.5);
          localPosition.multiplyScalar(blockSize);

          const object = new THREE.Object3D();
          object.position.set(localPosition.x, localPosition.y, localPosition.z);
          object.updateMatrix();

          const worldPosition = localPosition.clone().add(cluster.origin);
          const neighbours = typeNeighboursForWorldPosition(cluster.type, worldPosition);

          let block = GeometryGenerators.generateBlockSides(blockSize, 4, neighbours, new THREE.Color('#656a71'));

          if (block) {
            if (isBlockAtBottom(worldPosition)) {
              block = GeometryModifiers.pushBottomFace(block);
            }

            // TODO: this needs its own function
            if (!neighbours[11]) {
              const { position, color } = block.attributes;
              const topColor = new THREE.Color('#6a7687');
              const indices = GeometryUtilities.positionIndicesAtY(position as THREE.BufferAttribute, blockSize * 0.5);
              indices.forEach((index) => {
                color.setXYZ(index, topColor.r, topColor.g, topColor.b);
              });
              // if (!neighbours[8] && !neighbours[10]) {
              if (!neighbours[8]) {
                block = deform(block, blockSize, 4, new THREE.Vector3(-1, 0, 0), neighbours, worldPosition);
              }

              // if (!neighbours[9] && !neighbours[12]) {
              if (!neighbours[9]) {
                block = deform(block, blockSize, 4, new THREE.Vector3(1, 0, 0), neighbours, worldPosition);
              }

              // if (!neighbours[2] && !neighbours[4]) {
              if (!neighbours[2]) {
                block = deform(block, blockSize, 4, new THREE.Vector3(0, 0, -1), neighbours, worldPosition);
              }

              // if (!neighbours[15] && !neighbours[17]) {
              if (!neighbours[15]) {
                block = deform(block, blockSize, 4, new THREE.Vector3(0, 0, 1), neighbours, worldPosition);
              }
            }

            block.applyMatrix4(object.matrix);
            blocks.push(block);
          }
        }
      }
    }
  }

  if (blocks.length > 0) {
    let geometry = mergeBufferGeometries(blocks, false);
    console.log('🚀 ~ file: RockUtilities.ts ~ line 91 ~ generateRockCluster ~ geometry', geometry);

    if (geometry) {
      geometry = GeometryModifiers.smooth(geometry);
      geometry = GeometryModifiers.edgeSplit(geometry, Math.PI / 8, false);
      geometry = mergeVertices(geometry, 0.1);
    }

    return geometry;
  } else {
    return null;
  }
}

function deform(
  geometry: THREE.BufferGeometry,
  blockSize: number,
  segments: number,
  side: THREE.Vector3,
  neighbours: boolean[],
  blockWorldPosition: THREE.Vector3
): THREE.BufferGeometry {
  geometry = geometry.clone();
  side = side.clone();

  const direction = side.clone().multiplyScalar(-1);
  const half = blockSize * 0.5;
  const segment = blockSize / segments;
  const halfSegment = segment * 0.5;
  const quarterSegment = segment * 0.25;
  const noiseScale = 4 / blockSize;

  const indicesTopRow = GeometryUtilities.positionIndicesOnSideAtY(geometry, blockSize, side, half);
  const indicesSegmentRow = GeometryUtilities.positionIndicesOnSideAtY(geometry, blockSize, side, half - segment);
  const indicesCenterRow = GeometryUtilities.positionIndicesOnSideAtY(geometry, blockSize, side, 0);

  let indices: number[] = [];
  let currentPosition: THREE.Vector3 = new THREE.Vector3();

  const neighboursFilter = (index: number): boolean => {
    currentPosition = new THREE.Vector3(
      geometry.attributes.position.getX(index),
      geometry.attributes.position.getY(index),
      geometry.attributes.position.getZ(index)
    );

    if (side.x === -1) {
      if (neighbours[2] && (neighbours[1] || neighbours[4]) && currentPosition.z === -half) {
        return false;
      }
      if (neighbours[15] && (neighbours[14] || neighbours[17]) && currentPosition.z === half) {
        return false;
      }
    } else if (side.x === 1) {
      if (neighbours[2] && (neighbours[3] || neighbours[4]) && currentPosition.z === -half) {
        return false;
      }
      if (neighbours[15] && (neighbours[16] || neighbours[17]) && currentPosition.z === half) {
        return false;
      }
    } else if (side.z === -1) {
      if (neighbours[8] && (neighbours[1] || neighbours[10]) && currentPosition.x === -half) {
        return false;
      }
      if (neighbours[9] && (neighbours[3] || neighbours[12]) && currentPosition.x === half) {
        return false;
      }
    } else if (side.z === 1) {
      if (neighbours[8] && (neighbours[14] || neighbours[10]) && currentPosition.x === -half) {
        return false;
      }
      if (neighbours[9] && (neighbours[16] || neighbours[12]) && currentPosition.x === half) {
        return false;
      }
    }

    return true;
  };

  // offset second to top row up
  indices = [...indicesSegmentRow];
  const offset = half - quarterSegment;
  indices.forEach((index) => {
    geometry.attributes.position.setY(index, offset);
  });

  //

  // Inset top rows inwards
  indices = [...indicesTopRow];
  indices = indices.filter((index) => neighboursFilter(index));
  const inset = direction.clone().multiplyScalar(halfSegment);
  indices.forEach((index) => {
    currentPosition = new THREE.Vector3(
      geometry.attributes.position.getX(index),
      geometry.attributes.position.getY(index),
      geometry.attributes.position.getZ(index)
    );

    currentPosition.add(inset);
    geometry.attributes.position.setXYZ(index, currentPosition.x, currentPosition.y, currentPosition.z);
  });

  //

  //distort inner vertices on X/Z direction
  indices = [...indicesTopRow];
  indices = indices.filter((index) => neighboursFilter(index));
  const simplexNoise = new SimplexNoise('seed');
  indices.forEach((index) => {
    currentPosition = new THREE.Vector3(
      geometry.attributes.position.getX(index),
      geometry.attributes.position.getY(index),
      geometry.attributes.position.getZ(index)
    );

    const noisePosition = currentPosition.clone().add(blockWorldPosition).multiplyScalar(noiseScale);
    // const noise = simplexNoise.noise3(noisePosition.x, noisePosition.y, noisePosition.z) * 0.5 + 0.5;
    const noise = simplexNoise.noise2(noisePosition.x, noisePosition.z) * 0.5;
    const distortion = direction.clone().multiplyScalar(halfSegment).multiplyScalar(noise);
    currentPosition.add(distortion);

    geometry.attributes.position.setXYZ(index, currentPosition.x, currentPosition.y, currentPosition.z);
  });

  //

  // //distort segment row vertices on Y
  indices = [...indicesSegmentRow];
  indices = indices.filter((index) => neighboursFilter(index));
  indices.forEach((index) => {
    currentPosition = new THREE.Vector3(
      geometry.attributes.position.getX(index),
      geometry.attributes.position.getY(index),
      geometry.attributes.position.getZ(index)
    );

    const noisePosition = currentPosition.clone().add(blockWorldPosition).multiplyScalar(noiseScale);
    // const noise = simplexNoise.noise3(noisePosition.x, noisePosition.y, noisePosition.z) * 0.5 + 0.5;
    const noise = simplexNoise.noise3(noisePosition.x, noisePosition.y, noisePosition.z) * 0.5 + 0.5;
    const distortionY = new THREE.Vector3(0, -1, 0).multiplyScalar(segment).multiplyScalar(noise);
    const distortionDirection = direction.clone().multiplyScalar(quarterSegment).multiplyScalar(noise);
    currentPosition.add(distortionY);
    currentPosition.add(distortionDirection);
    geometry.attributes.position.setXYZ(index, currentPosition.x, currentPosition.y, currentPosition.z);
  });

  //

  // //distort center row vertices on Y
  // indicesCenterRow.forEach((index) => {
  //   currentPosition = new THREE.Vector3(
  //     geometry.attributes.position.getX(index),
  //     geometry.attributes.position.getY(index),
  //     geometry.attributes.position.getZ(index)
  //   );

  //   const noisePosition = currentPosition.clone().add(blockWorldPosition).multiplyScalar(noiseScale);
  //   // const noise = simplexNoise.noise3(noisePosition.x, noisePosition.y, noisePosition.z) * 0.5 + 0.5;
  //   const noise = simplexNoise.noise2(noisePosition.x, noisePosition.z) * 0.5 + 0.5;
  //   const distortion = new THREE.Vector3(0, -1, 0).multiplyScalar(halfSegment).multiplyScalar(noise);
  //   currentPosition.add(distortion);

  //   geometry.attributes.position.setY(index, currentPosition.y);
  // });

  //

  // TODO: create top dent when conditions are good.
  // FIXME: glitches on high insets value
  // create a top dent
  // indicesTopRow.forEach((index) => {
  //   let centerIndex: number | null = null;

  //   if (side.z === 0 && geometry.attributes.position.getZ(index) === 0) {
  //     centerIndex = index;
  //   } else if (side.x === 0 && geometry.attributes.position.getX(index) === 0) {
  //     centerIndex = index;
  //   }

  //   if (centerIndex) {
  //     const offset = geometry.attributes.position.getY(centerIndex) - halfSegment;
  //     geometry.attributes.position.setY(centerIndex, offset);
  //   }
  // });

  //

  // // create bottom dent
  // indicesSegmentRow.forEach((index) => {
  //   let centerIndex: number | null = null;

  //   if (side.z === 0 && geometry.attributes.position.getZ(index) === 0) {
  //     centerIndex = index;
  //   } else if (side.x === 0 && geometry.attributes.position.getX(index) === 0) {
  //     centerIndex = index;
  //   }

  //   if (centerIndex) {
  //     geometry.attributes.position.setY(centerIndex, -halfSegment);
  //   }
  // });

  // indicesCenterRow.forEach((index) => {
  //   let centerIndex: number | null = null;

  //   if (side.z === 0 && geometry.attributes.position.getZ(index) === 0) {
  //     centerIndex = index;
  //   } else if (side.x === 0 && geometry.attributes.position.getX(index) === 0) {
  //     centerIndex = index;
  //   }

  //   if (centerIndex) {
  //     geometry.attributes.position.setY(centerIndex, -segment);
  //   }
  // });

  return geometry;
}

export { generateRockCluster };
