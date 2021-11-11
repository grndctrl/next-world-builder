import { difference, merge } from 'lodash';
import * as THREE from 'three';
import { mergeBufferGeometries, mergeVertices } from 'three-stdlib';

import SimplexNoise from '@src/utilities/SimplexNoise';
import { blockStore } from '@utilities/BlockStore';
import * as BlockUtilities from '@utilities/BlockUtilities';
import * as GeometryGenerators from '@utilities/GeometryGenerators';
import * as GeometryModifiers from '@utilities/GeometryModifiers';
import * as GeometryUtilities from '@utilities/GeometryUtilities';
import * as MathUtilities from '@utilities/MathUtilities';

import { useBlockStore } from '@src/utilities/BlockStore';

import { ClusterType } from '../Cluster';

function generateBrickCluster(cluster: ClusterType): THREE.BufferGeometry | null {
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
          const neighbours = BlockUtilities.typeNeighboursForWorldPosition(cluster.type, worldPosition);

          let block = GeometryGenerators.generateBlockSides(blockSize, 8, neighbours, new THREE.Color('#cb9278'));

          if (block) {
            block = GeometryModifiers.smooth(block);
            if (BlockUtilities.isBlockAtBottom(worldPosition)) {
              block = GeometryModifiers.pushBottomFace(block);
            }

            // TODO: this needs its own function

            // const { position, color } = block.attributes;
            // const grass = new THREE.Color('#4f5566');
            // const indices = GeometryUtilities.positionIndicesAtY(position as THREE.BufferAttribute, blockSize * 0.5);
            // indices.forEach((index) => {
            //   color.setXYZ(index, grass.r, grass.g, grass.b);
            // });

            if (!neighbours[8]) {
              block = generateBricks(block, blockSize, new THREE.Vector3(-1, 0, 0), worldPosition);
            }

            if (!neighbours[9]) {
              block = generateBricks(block, blockSize, new THREE.Vector3(1, 0, 0), worldPosition);
              // block = deform(block, blockSize, 4, new THREE.Vector3(1, 0, 0), neighbours, worldPosition);
            }

            if (!neighbours[2]) {
              block = generateBricks(block, blockSize, new THREE.Vector3(0, 0, -1), worldPosition);
              // block = deform(block, blockSize, 4, new THREE.Vector3(0, 0, -1), neighbours, worldPosition);
            }

            // if (!neighbours[15] && !neighbours[17]) {
            if (!neighbours[15]) {
              block = generateBricks(block, blockSize, new THREE.Vector3(0, 0, 1), worldPosition);
              // block = deform(block, blockSize, 4, new THREE.Vector3(0, 0, 1), neighbours, worldPosition);
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
      geometry = GeometryModifiers.edgeSplit(geometry, Math.PI / 8, false);
      geometry = mergeVertices(geometry, 0.1);
    }

    return geometry;
  } else {
    return null;
  }
}

function segmentShape(size: number, segments: number): THREE.Shape {
  const shape = new THREE.Shape();

  shape.moveTo(-size * 0.5, -size * 0.5);
  shape.lineTo(-size * 0.5, size * 0.5);
  shape.lineTo(size * 0.5, size * 0.5);
  shape.lineTo(size * 0.5, -size * 0.5);
  shape.lineTo(-size * 0.5, -size * 0.5);

  return shape;
}

function generateBrick(
  location: THREE.Vector3,
  size: number,
  side: THREE.Vector3,
  color: THREE.Color
): THREE.BufferGeometry {
  const shape = segmentShape(size, 4);
  const curve = new THREE.LineCurve3(location, location.clone().add(side.clone().multiplyScalar(size * 0.25)));
  const geometry = new THREE.ExtrudeBufferGeometry(shape, { bevelEnabled: false, extrudePath: curve });

  const { position } = geometry.attributes;
  const colors: number[] = [];

  for (let i = 0; i < position.count; i++) {
    colors.push(color.r, color.g, color.b);
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
  // const blockNoise = Math.random() + 1 * 2.5;

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

      let brick = generateBrick(position, blockSize / 4, side, new THREE.Color('#cb9278'));
      brick = GeometryModifiers.smooth(brick);
      brick = GeometryModifiers.edgeSplit(brick, Math.PI / 6);
      brickGeometry.push(brick);
    }
  });

  console.log('geometry', geometry);
  console.log('brickGeometry', brickGeometry[0]);
  const merge = mergeBufferGeometries([geometry, ...brickGeometry]);

  geometry = merge ? merge : geometry;

  return geometry;
}

export { generateBrickCluster };
