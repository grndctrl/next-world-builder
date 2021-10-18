import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';

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

  // -Y axis
  if (!neighbours[6]) {
    const plane = new THREE.PlaneBufferGeometry(blockSize, blockSize, 4, 4);
    plane.rotateX(Math.PI * 0.5);
    const { position } = plane.attributes;
    for (let i = 0; i < position.count; i++) {
      position.setY(i, -blockSize * 0.5);
    }
    sides.push(plane);
  }

  // +Y axis
  if (!neighbours[11]) {
    const plane = new THREE.PlaneBufferGeometry(blockSize, blockSize, 4, 4);
    plane.rotateX(Math.PI * -0.5);
    const { position } = plane.attributes;
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
