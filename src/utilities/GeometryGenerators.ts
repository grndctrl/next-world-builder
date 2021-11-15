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

function generateBlockSide(
  blockSize: number,
  segments: number,
  side: THREE.Vector3,
  color: THREE.Color = new THREE.Color('#fff')
): THREE.BufferGeometry {
  const plane = new THREE.PlaneBufferGeometry(blockSize, blockSize, segments, segments);
  const { position } = plane.attributes;
  const colors: number[] = [];

  for (let i = 0; i < position.count; i++) {
    position.setZ(i, blockSize * 0.5);
    colors.push(color.r, color.g, color.b);
  }

  if (side.x === -1) {
    plane.rotateY(Math.PI * -0.5);
  } else if (side.x === 1) {
    plane.rotateY(Math.PI * 0.5);
  } else if (side.y === -1) {
    plane.rotateX(Math.PI * 0.5);
  } else if (side.y === 1) {
    plane.rotateX(Math.PI * -0.5);
  } else if (side.z === -1) {
    plane.rotateY(Math.PI * 1);
  } else if (side.z === 1) {
    // do nothing
  }

  plane.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  plane.deleteAttribute('uv');

  return plane;
}

function generateBlockSideHalf(
  blockSize: number,
  segments: number,
  side: THREE.Vector3,
  half: THREE.Vector2,
  color: THREE.Color = new THREE.Color('#fff')
): THREE.BufferGeometry {
  let width = blockSize;
  let height = blockSize;

  if (half.y === 0) {
    width *= 0.5;
  } else if (half.x === 0) {
    height *= 0.5;
  }

  const plane = new THREE.PlaneBufferGeometry(width, height, segments, segments);
  const { position } = plane.attributes;
  const colors: number[] = [];

  for (let i = 0; i < position.count; i++) {
    if (half.x === -1) {
      position.setX(i, position.getX(i) - width * 0.5);
    } else if (half.x === 1) {
      position.setX(i, position.getX(i) + width * 0.5);
    } else if (half.y === -1) {
      position.setY(i, position.getY(i) - height * 0.5);
    } else if (half.y === 1) {
      position.setY(i, position.getY(i) + height * 0.5);
    }

    position.setZ(i, blockSize * 0.5);
    colors.push(color.r, color.g, color.b);
  }

  if (side.x === -1) {
    plane.rotateY(Math.PI * -0.5);
  } else if (side.x === 1) {
    plane.rotateY(Math.PI * 0.5);
  } else if (side.y === -1) {
    plane.rotateX(Math.PI * 0.5);
  } else if (side.y === 1) {
    plane.rotateX(Math.PI * -0.5);
  } else if (side.z === -1) {
    plane.rotateY(Math.PI * 1);
  } else if (side.z === 1) {
    // do nothing
  }

  plane.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  plane.deleteAttribute('uv');

  return plane;
}

function generateBlockSides(
  blockSize: number,
  segments: number,
  neighbours: boolean[],
  color: THREE.Color = new THREE.Color('#fff')
): THREE.BufferGeometry | null {
  const sides = [];

  // -X axis
  if (!neighbours[8]) {
    const side = generateBlockSide(blockSize, segments, new THREE.Vector3(-1, 0, 0), color);

    sides.push(side);
  }

  // +X axis
  if (!neighbours[9]) {
    const side = generateBlockSide(blockSize, segments, new THREE.Vector3(1, 0, 0), color);

    sides.push(side);
  }

  // -Y axis
  if (!neighbours[6]) {
    const plane = new THREE.PlaneBufferGeometry(blockSize, blockSize, 4, 4);
    const segment = blockSize / 4;
    const { position } = plane.attributes;
    const colors: number[] = [];

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
      colors.push(color.r, color.g, color.b);
    }

    plane.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    plane.deleteAttribute('uv');
    sides.push(plane);
  }

  // +Y axis
  if (!neighbours[11]) {
    const plane = new THREE.PlaneBufferGeometry(blockSize, blockSize, 4, 4);
    const segment = blockSize / 4;
    const { position } = plane.attributes;
    const colors: number[] = [];

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
      colors.push(color.r, color.g, color.b);
    }

    plane.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    plane.deleteAttribute('uv');
    sides.push(plane);
  }

  // -Z axis
  if (!neighbours[2]) {
    const side = generateBlockSide(blockSize, segments, new THREE.Vector3(0, 0, -1), color);

    sides.push(side);
  }

  // +Z axis
  if (!neighbours[15]) {
    const side = generateBlockSide(blockSize, segments, new THREE.Vector3(0, 0, 1), color);

    sides.push(side);
  }

  if (sides.length === 0) {
    return null;
  }

  return mergeBufferGeometries(sides);
}

export { generateBlockSides, generateBlockSide, generateBlockSideHalf };
