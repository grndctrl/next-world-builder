import * as THREE from 'three';
import { mergeBufferGeometries, mergeVertices } from 'three-stdlib';

import { blockStore } from '@utilities/BlockStore';
import { neighboursForWorldPosition } from '@utilities/BlockUtilities';
import { generateBlockSides } from '@utilities/GeometryGenerators';
import * as GeometryModifiers from '@utilities/GeometryModifiers';
import { positionIndicesAtY } from '@utilities/GeometryUtilities';
import * as MathUtilities from '@utilities/MathUtilities';

import { ClusterType } from '../Cluster';

function pushTopSegment(geometry: THREE.BufferGeometry, blockSize: number, segments: number): THREE.BufferGeometry {
  geometry = geometry.clone();

  const half = blockSize * 0.5;
  const segment = blockSize / segments;
  const topSegment = half - segment * 0.5;

  const { position } = geometry.attributes;
  positionIndicesAtY(position as THREE.BufferAttribute, half - segment).forEach((index) => {
    position.setY(index, topSegment);
  });

  return geometry;
}

function generateRockCluster(cluster: ClusterType): THREE.BufferGeometry | null {
  const { clusterSize, blockSize } = blockStore.getState();
  const blocks: THREE.BufferGeometry[] = [];

  for (let z = 0; z < clusterSize; z++) {
    for (let y = 0; y < clusterSize; y++) {
      for (let x = 0; x < clusterSize; x++) {
        const index = x + y * clusterSize + z * clusterSize * clusterSize;

        if (cluster.blocks[index]) {
          const localPosition = new THREE.Vector3(x, y, z);
          localPosition.subScalar((clusterSize - 1) * 0.5);
          localPosition.multiplyScalar(blockSize);

          const object = new THREE.Object3D();
          object.position.set(localPosition.x, localPosition.y, localPosition.z);
          object.updateMatrix();

          const worldPosition = localPosition.clone().add(cluster.origin);
          const neighbours = neighboursForWorldPosition(worldPosition);

          const block = generateBlockSides(blockSize, 4, neighbours);

          if (block) {
            block.applyMatrix4(object.matrix);
            blocks.push(block);
          }
        }
      }
    }
  }

  if (blocks.length > 0) {
    let geometry = mergeBufferGeometries(blocks, false);
    console.log('🚀 ~ file: RockUtilities.ts ~ line 61 ~ generateRockCluster ~ geometry', geometry);

    if (geometry) {
      geometry = GeometryModifiers.smooth(geometry);
      geometry = GeometryModifiers.edgeSplit(geometry, Math.PI / 8, false);
      geometry = mergeVertices(geometry, 0.1);
    }

    // geometry = geometry ? GeometryModifiers.smooth(geometry) : geometry;
    // geometry = geometry ? GeometryModifiers.edgeSplit(geometry, Math.PI / 8) : geometry;
    console.log('🚀 ~ file: RockUtilities.ts ~ line 62 ~ generateRockCluster ~ geometry', geometry);
    // if (geometry) {
    //   const { position } = geometry.attributes;

    //   for (let i = 0; i < position.count; i++) {
    //     if (position.getX(i) === 0 && position.getY(i) === 1 && position.getZ(i) === 0) {
    //       geometry.attributes.position.setXYZ(i, 0, 2, 0);
    //     }
    //   }
    // }

    return geometry;
  } else {
    return null;
  }
}

function generateRockBlock(blockSize: number, neighbours: boolean[]): THREE.BufferGeometry {
  let block: THREE.BufferGeometry = new THREE.BoxBufferGeometry(blockSize, blockSize, blockSize);
  const halfSize = blockSize * 0.5;

  if (!neighbours[0] && !neighbours[2] && !neighbours[1] && !neighbours[6] && !neighbours[5] && !neighbours[8]) {
    const corner = new THREE.Vector3(-halfSize, -halfSize, -halfSize);

    const lineX = new THREE.Line3(corner, new THREE.Vector3(corner.x / 2, corner.y, corner.z));
    const lineY = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y / 2, corner.z));
    const lineZ = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y, corner.z / 2));
    // const plane = MathUtilities.randomPlaneOnLines(lineX, lineY, lineZ);
    const plane = new THREE.Plane().setFromCoplanarPoints(lineX.end, lineY.end, lineZ.end);

    block = GeometryModifiers.planeCut(block.clone(), plane, false);
  }

  if (!neighbours[0] && !neighbours[2] && !neighbours[3] && !neighbours[6] && !neighbours[7] && !neighbours[9]) {
    const corner = new THREE.Vector3(halfSize, -halfSize, -halfSize);

    const lineX = new THREE.Line3(corner, new THREE.Vector3(corner.x / 2, corner.y, corner.z));
    const lineY = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y / 2, corner.z));
    const lineZ = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y, corner.z / 2));
    // const plane = MathUtilities.randomPlaneOnLines(lineX, lineY, lineZ);
    const plane = new THREE.Plane().setFromCoplanarPoints(lineX.end, lineY.end, lineZ.end);
    plane.negate();
    block = GeometryModifiers.planeCut(block.clone(), plane, false);
  }

  if (!neighbours[4] && !neighbours[2] && !neighbours[1] && !neighbours[11] && !neighbours[10] && !neighbours[8]) {
    const corner = new THREE.Vector3(-halfSize, halfSize, -halfSize);

    const lineX = new THREE.Line3(corner, new THREE.Vector3(corner.x / 2, corner.y, corner.z));
    const lineY = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y / 2, corner.z));
    const lineZ = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y, corner.z / 2));
    // const plane = MathUtilities.randomPlaneOnLines(lineX, lineY, lineZ);
    const plane = new THREE.Plane().setFromCoplanarPoints(lineX.end, lineY.end, lineZ.end);
    plane.negate();
    block = GeometryModifiers.planeCut(block.clone(), plane, false);
  }

  if (!neighbours[4] && !neighbours[2] && !neighbours[3] && !neighbours[11] && !neighbours[12] && !neighbours[9]) {
    const corner = new THREE.Vector3(halfSize, halfSize, -halfSize);

    const lineX = new THREE.Line3(corner, new THREE.Vector3(corner.x / 2, corner.y, corner.z));
    const lineY = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y / 2, corner.z));
    const lineZ = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y, corner.z / 2));
    // const plane = MathUtilities.randomPlaneOnLines(lineX, lineY, lineZ);
    const plane = new THREE.Plane().setFromCoplanarPoints(lineX.end, lineY.end, lineZ.end);
    // plane.negate();

    block = GeometryModifiers.planeCut(block.clone(), plane, false);
  }

  if (!neighbours[13] && !neighbours[15] && !neighbours[14] && !neighbours[6] && !neighbours[5] && !neighbours[8]) {
    const corner = new THREE.Vector3(-halfSize, -halfSize, halfSize);

    const lineX = new THREE.Line3(corner, new THREE.Vector3(corner.x / 2, corner.y, corner.z));
    const lineY = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y / 2, corner.z));
    const lineZ = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y, corner.z / 2));
    // const plane = MathUtilities.randomPlaneOnLines(lineX, lineY, lineZ);
    const plane = new THREE.Plane().setFromCoplanarPoints(lineX.end, lineY.end, lineZ.end);
    plane.negate();
    block = GeometryModifiers.planeCut(block.clone(), plane, false);
  }

  if (!neighbours[13] && !neighbours[15] && !neighbours[16] && !neighbours[6] && !neighbours[7] && !neighbours[9]) {
    const corner = new THREE.Vector3(halfSize, -halfSize, halfSize);

    const lineX = new THREE.Line3(corner, new THREE.Vector3(corner.x / 2, corner.y, corner.z));
    const lineY = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y / 2, corner.z));
    const lineZ = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y, corner.z / 2));
    // const plane = MathUtilities.randomPlaneOnLines(lineX, lineY, lineZ);
    const plane = new THREE.Plane().setFromCoplanarPoints(lineX.end, lineY.end, lineZ.end);
    // plane.negate();
    block = GeometryModifiers.planeCut(block.clone(), plane, false);
  }

  if (!neighbours[17] && !neighbours[15] && !neighbours[14] && !neighbours[11] && !neighbours[10] && !neighbours[8]) {
    const corner = new THREE.Vector3(-halfSize, halfSize, halfSize);

    const lineX = new THREE.Line3(corner, new THREE.Vector3(corner.x / 2, corner.y, corner.z));
    const lineY = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y / 2, corner.z));
    const lineZ = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y, corner.z / 2));
    // const plane = MathUtilities.randomPlaneOnLines(lineX, lineY, lineZ);
    const plane = new THREE.Plane().setFromCoplanarPoints(lineX.end, lineY.end, lineZ.end);
    // plane.negate();
    block = GeometryModifiers.planeCut(block.clone(), plane, false);
  }

  if (!neighbours[17] && !neighbours[15] && !neighbours[16] && !neighbours[11] && !neighbours[12] && !neighbours[9]) {
    const corner = new THREE.Vector3(halfSize, halfSize, halfSize);

    const lineX = new THREE.Line3(corner, new THREE.Vector3(corner.x / 2, corner.y, corner.z));
    const lineY = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y / 2, corner.z));
    const lineZ = new THREE.Line3(corner, new THREE.Vector3(corner.x, corner.y, corner.z / 2));
    // const plane = MathUtilities.randomPlaneOnLines(lineX, lineY, lineZ);
    const plane = new THREE.Plane().setFromCoplanarPoints(lineX.end, lineY.end, lineZ.end);
    plane.negate();
    block = GeometryModifiers.planeCut(block.clone(), plane, false);
  }

  block = GeometryModifiers.smooth(block.clone());
  // block = GeometryModifiers.edgeSplit(block.clone(), Math.PI / 8);

  return block;
}

export { generateRockBlock, generateRockCluster };
