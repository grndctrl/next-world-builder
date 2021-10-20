import { difference } from 'lodash';
import * as THREE from 'three';
import { mergeBufferGeometries, mergeVertices } from 'three-stdlib';

import SimplexNoise from '@src/utilities/SimplexNoise';
import { blockStore } from '@utilities/BlockStore';
import { neighboursForWorldPosition } from '@utilities/BlockUtilities';
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
          const neighbours = neighboursForWorldPosition(worldPosition);

          let block = GeometryGenerators.generateBlockSides(blockSize, 8, neighbours);

          if (block) {
            // TODO: this needs its own function
            if (!neighbours[11]) {
              if (!neighbours[8] && !neighbours[10]) {
                block = deform(block, blockSize, 4, new THREE.Vector3(-1, 0, 0), neighbours, worldPosition);
              }

              if (!neighbours[9] && !neighbours[12]) {
                block = deform(block, blockSize, 4, new THREE.Vector3(1, 0, 0), neighbours, worldPosition);
              }

              if (!neighbours[2] && !neighbours[4]) {
                block = deform(block, blockSize, 4, new THREE.Vector3(0, 0, -1), neighbours, worldPosition);
              }

              if (!neighbours[15] && !neighbours[17]) {
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

    if (geometry) {
      geometry = GeometryModifiers.smooth(geometry);
      geometry = GeometryModifiers.edgeSplit(geometry, Math.PI / 6, false);
      geometry = mergeVertices(geometry, 0.1);
    }

    return geometry;
  } else {
    return null;
  }
}

// function generateRockBlock(blockSize: number, neighbours: boolean[]): THREE.BufferGeometry {
//   let block: THREE.BufferGeometry = new THREE.BoxBufferGeometry(blockSize, blockSize, blockSize);
//   const halfSize = blockSize * 0.5;

//   if (!neighbours[0] && !neighbours[2] && !neighbours[1] && !neighbours[6] && !neighbours[5] && !neighbours[8]) {
//     const corner = new THREE.Vector3(-halfSize, -halfSize, -halfSize);

//     const lineX = new THREE.Line3(corner, new THREE.Vector3(corner.x / 2, corner.y, corner.z));
//     const lineY = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y / 2, corner.z));
//     const lineZ = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y, corner.z / 2));
//     // const plane = MathUtilities.randomPlaneOnLines(lineX, lineY, lineZ);
//     const plane = new THREE.Plane().setFromCoplanarPoints(lineX.end, lineY.end, lineZ.end);

//     block = GeometryModifiers.planeCut(block.clone(), plane, false);
//   }

//   if (!neighbours[0] && !neighbours[2] && !neighbours[3] && !neighbours[6] && !neighbours[7] && !neighbours[9]) {
//     const corner = new THREE.Vector3(halfSize, -halfSize, -halfSize);

//     const lineX = new THREE.Line3(corner, new THREE.Vector3(corner.x / 2, corner.y, corner.z));
//     const lineY = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y / 2, corner.z));
//     const lineZ = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y, corner.z / 2));
//     // const plane = MathUtilities.randomPlaneOnLines(lineX, lineY, lineZ);
//     const plane = new THREE.Plane().setFromCoplanarPoints(lineX.end, lineY.end, lineZ.end);
//     plane.negate();
//     block = GeometryModifiers.planeCut(block.clone(), plane, false);
//   }

//   if (!neighbours[4] && !neighbours[2] && !neighbours[1] && !neighbours[11] && !neighbours[10] && !neighbours[8]) {
//     const corner = new THREE.Vector3(-halfSize, halfSize, -halfSize);

//     const lineX = new THREE.Line3(corner, new THREE.Vector3(corner.x / 2, corner.y, corner.z));
//     const lineY = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y / 2, corner.z));
//     const lineZ = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y, corner.z / 2));
//     // const plane = MathUtilities.randomPlaneOnLines(lineX, lineY, lineZ);
//     const plane = new THREE.Plane().setFromCoplanarPoints(lineX.end, lineY.end, lineZ.end);
//     plane.negate();
//     block = GeometryModifiers.planeCut(block.clone(), plane, false);
//   }

//   if (!neighbours[4] && !neighbours[2] && !neighbours[3] && !neighbours[11] && !neighbours[12] && !neighbours[9]) {
//     const corner = new THREE.Vector3(halfSize, halfSize, -halfSize);

//     const lineX = new THREE.Line3(corner, new THREE.Vector3(corner.x / 2, corner.y, corner.z));
//     const lineY = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y / 2, corner.z));
//     const lineZ = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y, corner.z / 2));
//     // const plane = MathUtilities.randomPlaneOnLines(lineX, lineY, lineZ);
//     const plane = new THREE.Plane().setFromCoplanarPoints(lineX.end, lineY.end, lineZ.end);
//     // plane.negate();

//     block = GeometryModifiers.planeCut(block.clone(), plane, false);
//   }

//   if (!neighbours[13] && !neighbours[15] && !neighbours[14] && !neighbours[6] && !neighbours[5] && !neighbours[8]) {
//     const corner = new THREE.Vector3(-halfSize, -halfSize, halfSize);

//     const lineX = new THREE.Line3(corner, new THREE.Vector3(corner.x / 2, corner.y, corner.z));
//     const lineY = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y / 2, corner.z));
//     const lineZ = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y, corner.z / 2));
//     // const plane = MathUtilities.randomPlaneOnLines(lineX, lineY, lineZ);
//     const plane = new THREE.Plane().setFromCoplanarPoints(lineX.end, lineY.end, lineZ.end);
//     plane.negate();
//     block = GeometryModifiers.planeCut(block.clone(), plane, false);
//   }

//   if (!neighbours[13] && !neighbours[15] && !neighbours[16] && !neighbours[6] && !neighbours[7] && !neighbours[9]) {
//     const corner = new THREE.Vector3(halfSize, -halfSize, halfSize);

//     const lineX = new THREE.Line3(corner, new THREE.Vector3(corner.x / 2, corner.y, corner.z));
//     const lineY = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y / 2, corner.z));
//     const lineZ = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y, corner.z / 2));
//     // const plane = MathUtilities.randomPlaneOnLines(lineX, lineY, lineZ);
//     const plane = new THREE.Plane().setFromCoplanarPoints(lineX.end, lineY.end, lineZ.end);
//     // plane.negate();
//     block = GeometryModifiers.planeCut(block.clone(), plane, false);
//   }

//   if (!neighbours[17] && !neighbours[15] && !neighbours[14] && !neighbours[11] && !neighbours[10] && !neighbours[8]) {
//     const corner = new THREE.Vector3(-halfSize, halfSize, halfSize);

//     const lineX = new THREE.Line3(corner, new THREE.Vector3(corner.x / 2, corner.y, corner.z));
//     const lineY = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y / 2, corner.z));
//     const lineZ = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y, corner.z / 2));
//     // const plane = MathUtilities.randomPlaneOnLines(lineX, lineY, lineZ);
//     const plane = new THREE.Plane().setFromCoplanarPoints(lineX.end, lineY.end, lineZ.end);
//     // plane.negate();
//     block = GeometryModifiers.planeCut(block.clone(), plane, false);
//   }

//   if (!neighbours[17] && !neighbours[15] && !neighbours[16] && !neighbours[11] && !neighbours[12] && !neighbours[9]) {
//     const corner = new THREE.Vector3(halfSize, halfSize, halfSize);

//     const lineX = new THREE.Line3(corner, new THREE.Vector3(corner.x / 2, corner.y, corner.z));
//     const lineY = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y / 2, corner.z));
//     const lineZ = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y, corner.z / 2));
//     // const plane = MathUtilities.randomPlaneOnLines(lineX, lineY, lineZ);
//     const plane = new THREE.Plane().setFromCoplanarPoints(lineX.end, lineY.end, lineZ.end);
//     plane.negate();
//     block = GeometryModifiers.planeCut(block.clone(), plane, false);
//   }

//   block = GeometryModifiers.smooth(block.clone());
//   // block = GeometryModifiers.edgeSplit(block.clone(), Math.PI / 8);

//   return block;
// }

function deform(
  geometry: THREE.BufferGeometry,
  size: number,
  segments: number,
  side: THREE.Vector3,
  neighbours: boolean[],
  blockWorldPosition: THREE.Vector3
): THREE.BufferGeometry {
  geometry = geometry.clone();
  side = side.clone();

  const direction = side.clone().multiplyScalar(-1);
  const half = size * 0.5;
  const segment = size / segments;
  console.log('🚀 ~ file: RockUtilities.ts ~ line 215 ~ segment', segment);
  const halfSegment = segment * 0.5;
  const quarterSegment = segment * 0.25;

  const indicesTopRow = GeometryUtilities.positionIndicesOnSideAtY(geometry, size, side, half);
  const indicesSegmentRow = GeometryUtilities.positionIndicesOnSideAtY(geometry, size, side, half - segment);
  console.log('🚀 ~ file: RockUtilities.ts ~ line 220 ~ indicesSegmentRow', indicesSegmentRow);
  const indicesCenterRow = GeometryUtilities.positionIndicesOnSideAtY(geometry, size, side, 0);

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

  // Inset top rows inwards
  let indices = [...indicesTopRow];
  indices = indices.filter((index) => neighboursFilter(index));
  const inset = direction.clone().multiplyScalar(quarterSegment);
  indices.forEach((index) => {
    currentPosition = new THREE.Vector3(
      geometry.attributes.position.getX(index),
      geometry.attributes.position.getY(index),
      geometry.attributes.position.getZ(index)
    );

    currentPosition.add(inset);
    geometry.attributes.position.setXYZ(index, currentPosition.x, currentPosition.y, currentPosition.z);
  });

  // offset second to top row up
  indices = [...indicesSegmentRow];
  console.log('🚀 ~ file: RockUtilities.ts ~ line 291 ~ indices', indices);
  const offset = half - quarterSegment;
  indices.forEach((index) => {
    geometry.attributes.position.setY(index, offset);
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

    // TODO: Still glitches around the sides (between top / segment row)
    const noisePosition = currentPosition.clone().add(blockWorldPosition).multiplyScalar(0.5);

    const noise = simplexNoise.noise2(noisePosition.x, noisePosition.z) * 0.5;
    const distortion = direction.clone().multiplyScalar(segment).multiplyScalar(noise);
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

    const noise = simplexNoise.noise2(currentPosition.x, currentPosition.z) * 0.5 + 0.5;
    const distortion = new THREE.Vector3(0, -1, 0).multiplyScalar(halfSegment).multiplyScalar(noise);
    currentPosition.add(distortion);

    geometry.attributes.position.setY(index, currentPosition.y);
  });

  //

  // //distort center row vertices on Y
  indicesCenterRow.forEach((index) => {
    currentPosition = new THREE.Vector3(
      geometry.attributes.position.getX(index),
      geometry.attributes.position.getY(index),
      geometry.attributes.position.getZ(index)
    );

    const noise = simplexNoise.noise2(currentPosition.x, currentPosition.z) * 0.5 + 0.5;
    const distortion = new THREE.Vector3(0, -1, 0).multiplyScalar(halfSegment).multiplyScalar(noise);
    currentPosition.add(distortion);

    geometry.attributes.position.setY(index, currentPosition.y);
  });

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
