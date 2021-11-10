import { difference, merge } from 'lodash';
import * as THREE from 'three';

import { edgeSplit, smooth } from '@utilities/GeometryModifiers';
import {
  facesFromGeometry,
  geometryFromFaces,
  positionIndicesAtPosition,
  positionIndicesAtY,
  positionIndicesOnSideAtY,
} from '@utilities/GeometryUtilities';
import SimplexNoise from '@utilities/SimplexNoise';
import { generateBlockSides } from '@src/utilities/GeometryGenerators';
import { useBlockStore } from '@src/utilities/BlockStore';
import { mergeBufferGeometries } from 'three-stdlib';

function segmentShape(size: number, segments: number): THREE.Shape {
  console.log('🚀 ~ file: Example.tsx ~ line 18 ~ segmentShape ~ size', size);
  const shape = new THREE.Shape();

  shape.moveTo(-size * 0.5, -size * 0.5);
  shape.lineTo(-size * 0.5, size * 0.5);
  shape.lineTo(size * 0.5, size * 0.5);
  shape.lineTo(size * 0.5, -size * 0.5);
  shape.lineTo(-size * 0.5, -size * 0.5);

  return shape;
}

function generateBrick(location: THREE.Vector3, size: number, side: THREE.Vector3): THREE.BufferGeometry {
  const shape = segmentShape(size, 4);
  const curve = new THREE.LineCurve3(location, location.clone().add(side.clone().multiplyScalar(size * 0.25)));
  const geometry = new THREE.ExtrudeBufferGeometry(shape, { bevelEnabled: false, extrudePath: curve });

  const { position } = geometry.attributes;
  const colors: number[] = [];

  for (let i = 0; i < position.count; i++) {
    colors.push(0, 0, 0);
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  return geometry;
}

function generateBricks(
  geometry: THREE.BufferGeometry,
  blockSize: number,
  side: THREE.Vector3,
  blockWorldPosition: THREE.Vector3
): THREE.BufferGeometry {
  geometry = geometry.clone();

  const grid = Array.from({ length: 16 }).map(() => false);
  const simplexNoise = new SimplexNoise();
  const seed = blockWorldPosition.clone().add(side);
  const blockNoise = simplexNoise.noise3(seed.x, seed.y, seed.z) + 1 * 2.5;

  if (blockNoise > 4) {
    grid[0] = true;
    grid[1] = true;
    grid[4] = true;
    grid[5] = true;
  } else if (blockNoise > 3) {
    grid[2] = true;
    grid[3] = true;
    grid[6] = true;
    grid[7] = true;
  } else if (blockNoise > 2) {
    grid[8] = true;
    grid[9] = true;
    grid[12] = true;
    grid[13] = true;
  } else if (blockNoise > 1) {
    grid[10] = true;
    grid[11] = true;
    grid[14] = true;
    grid[15] = true;
  } else {
    grid[5] = true;
    grid[6] = true;
    grid[9] = true;
    grid[10] = true;
  }

  const fraction = blockNoise % 1;
  let brickGeometry: THREE.BufferGeometry[] = [];

  grid.forEach((cell, index) => {
    const x = index % 4;
    const y = Math.floor(index / 4);

    const cellNoise = simplexNoise.noise3(x, y, fraction);

    if (cellNoise > 0.5 || cell) {
      let position: THREE.Vector3;

      const _x = (x / 4 - 0.5) * blockSize + blockSize / 8;
      const _y = (y / 4 - 0.5) * blockSize + blockSize / 8;

      if (side.y === 0 && side.z === 0) {
        position = new THREE.Vector3(side.x, _y, _x);
      } else {
        position = new THREE.Vector3(_x, _y, side.z);
      }

      let brick = generateBrick(position, blockSize / 4, side);
      brick = smooth(brick);
      brick = edgeSplit(brick, Math.PI / 6);
      brickGeometry.push(brick);
    }
  });

  const merge = mergeBufferGeometries(brickGeometry);

  geometry = merge ? merge : geometry;

  return geometry;
}

const Example = () => {
  const { blockSize } = useBlockStore();

  let block = generateBlockSides(
    blockSize,
    4,
    Array.from({ length: 18 }).map(() => false)
  );

  if (block) {
    block = smooth(block);
    block = edgeSplit(block, Math.PI / 6);

    let bricks = generateBricks(block, blockSize, new THREE.Vector3(1, 0, 0), new THREE.Vector3(1, 1, 1));

    const merge = mergeBufferGeometries([bricks, block]);
    block = merge ? merge : bricks;
  }

  return (
    block && (
      <mesh geometry={block}>
        <meshStandardMaterial />
      </mesh>
    )
  );
};

export default Example;
