import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';

import * as GeometryUtilities from '@utilities/GeometryUtilities';

/**
 * Check each side, generate a segmented face if there is no neighbour.
 * Returns null when all sides have neighbours.
 *
 * @param {number} blockSize
 * @param {number} segments
 * @param {boolean[]} neighbours
 * @return {*}  {(THREE.BufferGeometry | null)}
 */
function generateBlockSides(blockSize: number, segments: number, neighbours: boolean[]): THREE.BufferGeometry | null {
  const sides = [];

  // check each side, generate a face if there is no neighbour
  // -X axis
  if (!neighbours[8]) {
    const plane = new THREE.PlaneBufferGeometry(blockSize, blockSize, 4, 4);
    plane.rotateY(Math.PI * -0.5);
    const { position } = plane.attributes;
    for (let i = 0; i < position.count; i++) {
      position.setX(i, -blockSize * 0.5);
    }
    sides.push(plane);
  }

  // +X axis
  if (!neighbours[9]) {
    const plane = new THREE.PlaneBufferGeometry(blockSize, blockSize, 4, 4);
    plane.rotateY(Math.PI * 0.5);
    const { position } = plane.attributes;
    for (let i = 0; i < position.count; i++) {
      position.setX(i, blockSize * 0.5);
    }
    sides.push(plane);
  }

  // const indicesTopSideInner =
  //   side.z === 0
  //     ? [
  //         ...GeometryUtilities.positionIndicesAtPosition(geometry, new THREE.Vector3(segment * side.x, half, -segment)),
  //         ...GeometryUtilities.positionIndicesAtPosition(geometry, new THREE.Vector3(segment * side.x, half, 0)),
  //         ...GeometryUtilities.positionIndicesAtPosition(geometry, new THREE.Vector3(segment * side.x, half, segment)),
  //       ]
  //     : [
  //         ...GeometryUtilities.positionIndicesAtPosition(geometry, new THREE.Vector3(-segment, half, segment * side.z)),
  //         ...GeometryUtilities.positionIndicesAtPosition(geometry, new THREE.Vector3(0, half, segment * side.z)),
  //         ...GeometryUtilities.positionIndicesAtPosition(geometry, new THREE.Vector3(segment, half, segment * side.z)),
  //       ];

  // -Y axis
  if (!neighbours[6]) {
    const plane = new THREE.PlaneBufferGeometry(blockSize, blockSize, 4, 4);
    const segment = blockSize / 4;
    const { position } = plane.attributes;

    const innerIndices = [
      ...GeometryUtilities.positionIndicesAtPosition(plane, new THREE.Vector3(-segment, -segment, 0)),
      ...GeometryUtilities.positionIndicesAtPosition(plane, new THREE.Vector3(0, -segment, 0)),
      ...GeometryUtilities.positionIndicesAtPosition(plane, new THREE.Vector3(segment, -segment, 0)),
      ...GeometryUtilities.positionIndicesAtPosition(plane, new THREE.Vector3(-segment, 0, 0)),
      ...GeometryUtilities.positionIndicesAtPosition(plane, new THREE.Vector3(0, 0, 0)),
      ...GeometryUtilities.positionIndicesAtPosition(plane, new THREE.Vector3(segment, 0, 0)),
      ...GeometryUtilities.positionIndicesAtPosition(plane, new THREE.Vector3(-segment, segment, 0)),
      ...GeometryUtilities.positionIndicesAtPosition(plane, new THREE.Vector3(0, segment, 0)),
      ...GeometryUtilities.positionIndicesAtPosition(plane, new THREE.Vector3(segment, segment, 0)),
    ];

    innerIndices.forEach((index) => {
      const { position } = plane.attributes;

      position.setXYZ(index, position.getX(index) * 0.5, position.getY(index) * 0.5, position.getZ(index) * 0.5);
    });

    plane.rotateX(Math.PI * 0.5);
    for (let i = 0; i < position.count; i++) {
      position.setY(i, -blockSize * 0.5);
    }

    sides.push(plane);
  }

  // +Y axis
  if (!neighbours[11]) {
    const plane = new THREE.PlaneBufferGeometry(blockSize, blockSize, 4, 4);
    const segment = blockSize / 4;
    const { position } = plane.attributes;

    const innerIndices = [
      ...GeometryUtilities.positionIndicesAtPosition(plane, new THREE.Vector3(-segment, -segment, 0)),
      ...GeometryUtilities.positionIndicesAtPosition(plane, new THREE.Vector3(0, -segment, 0)),
      ...GeometryUtilities.positionIndicesAtPosition(plane, new THREE.Vector3(segment, -segment, 0)),
      ...GeometryUtilities.positionIndicesAtPosition(plane, new THREE.Vector3(-segment, 0, 0)),
      ...GeometryUtilities.positionIndicesAtPosition(plane, new THREE.Vector3(0, 0, 0)),
      ...GeometryUtilities.positionIndicesAtPosition(plane, new THREE.Vector3(segment, 0, 0)),
      ...GeometryUtilities.positionIndicesAtPosition(plane, new THREE.Vector3(-segment, segment, 0)),
      ...GeometryUtilities.positionIndicesAtPosition(plane, new THREE.Vector3(0, segment, 0)),
      ...GeometryUtilities.positionIndicesAtPosition(plane, new THREE.Vector3(segment, segment, 0)),
    ];

    innerIndices.forEach((index) => {
      const { position } = plane.attributes;

      position.setXYZ(index, position.getX(index) * 0.5, position.getY(index) * 0.5, position.getZ(index) * 0.5);
    });
    plane.rotateX(Math.PI * -0.5);
    for (let i = 0; i < position.count; i++) {
      position.setY(i, blockSize * 0.5);
    }
    sides.push(plane);
  }

  // -Z axis
  if (!neighbours[2]) {
    const plane = new THREE.PlaneBufferGeometry(blockSize, blockSize, 4, 4);
    plane.rotateY(-Math.PI);
    const { position } = plane.attributes;
    for (let i = 0; i < position.count; i++) {
      position.setZ(i, -blockSize * 0.5);
    }
    sides.push(plane);
  }

  // +Z axis
  if (!neighbours[15]) {
    const plane = new THREE.PlaneBufferGeometry(blockSize, blockSize, 4, 4);

    const { position } = plane.attributes;
    for (let i = 0; i < position.count; i++) {
      position.setZ(i, blockSize * 0.5);
    }
    sides.push(plane);
  }

  if (sides.length === 0) {
    return null;
  }

  return mergeBufferGeometries(sides);
}

export { generateBlockSides };
