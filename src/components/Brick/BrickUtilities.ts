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
import { BSP, Area } from '@utilities/BSP';

import { useBlockStore } from '@src/utilities/BlockStore';

import { ClusterType } from '../Cluster';
import { Triangle } from 'three';

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

          let block = generateBlockSides(worldPosition, blockSize, neighbours, new THREE.Color('#9e917a'));

          if (block) {
            block = GeometryModifiers.smooth(block);
            if (BlockUtilities.isBlockAtBottom(worldPosition)) {
              block = GeometryModifiers.pushBottomFace(block);
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

function generateBlockSides(
  worldPosition: THREE.Vector3,
  blockSize: number,
  neighbours: boolean[],
  color: THREE.Color
): THREE.BufferGeometry | null {
  const sides: THREE.BufferGeometry[] = [];
  let side: THREE.Vector3;

  // -X axis
  if (!neighbours[8]) {
    side = new THREE.Vector3(-1, 0, 0);
    const area = areaForSide(side, neighbours, blockSize);
    const geometry = generateBricks(worldPosition, side, area, blockSize);

    geometry.rotateY(Math.PI * -0.5);

    const { position } = geometry.attributes;
    const colors: number[] = [];

    for (let i = 0; i < position.count; i++) {
      position.setX(i, position.getX(i) - blockSize * 0.35);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    sides.push(geometry);
  } else {
    if (neighbours[2]) {
      const side = GeometryGenerators.generateBlockSideHalf(
        blockSize,
        1,
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector2(-1, 0),
        color
      );

      sides.push(side);
    }
    if (neighbours[15]) {
      const side = GeometryGenerators.generateBlockSideHalf(
        blockSize,
        1,
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector2(1, 0),
        color
      );

      sides.push(side);
    }
  }

  // X axis
  if (!neighbours[9]) {
    side = new THREE.Vector3(1, 0, 0);
    const area = areaForSide(side, neighbours, blockSize);
    let geometry = generateBricks(worldPosition, side, area, blockSize);

    geometry.rotateY(Math.PI * 0.5);

    const { position } = geometry.attributes;
    const colors: number[] = [];

    for (let i = 0; i < position.count; i++) {
      position.setX(i, position.getX(i) + blockSize * 0.35);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    sides.push(geometry);
  } else {
    if (neighbours[2]) {
      const side = GeometryGenerators.generateBlockSideHalf(
        blockSize,
        1,
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector2(1, 0),
        color
      );

      sides.push(side);
    }
    if (neighbours[15]) {
      const side = GeometryGenerators.generateBlockSideHalf(
        blockSize,
        1,
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector2(-1, 0),
        color
      );

      sides.push(side);
    }
  }

  // -Y axis
  if (!neighbours[6]) {
    const geometry = new THREE.PlaneBufferGeometry(blockSize, blockSize, 4, 4);
    const { position } = geometry.attributes;
    const colors: number[] = [];

    geometry.rotateX(Math.PI * 0.5);

    for (let i = 0; i < position.count; i++) {
      position.setY(i, -blockSize * 0.5);
      colors.push(color.r, color.g, color.b);
    }
    geometry.deleteAttribute('uv');
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    sides.push(geometry);
  }

  // +Y axis
  if (
    !neighbours[11] ||
    (neighbours[11] && (!neighbours[4] || !neighbours[10] || !neighbours[12] || !neighbours[17]))
  ) {
    const faces: Triangle[] = [];
    let x = -blockSize * 0.5;
    const y = blockSize * 0.5;
    let z = -blockSize * 0.5;
    let width = blockSize;
    let height = blockSize;
    let inset = blockSize * 0.15;

    if (!neighbours[8]) {
      x += inset;
      width -= inset;
    }
    if (!neighbours[9]) {
      width -= inset;
    }
    if (!neighbours[2]) {
      z += inset;
      height -= inset;
    }
    if (!neighbours[15]) {
      height -= inset;
    }

    faces.push(
      new THREE.Triangle(
        new THREE.Vector3(x, y, z),
        new THREE.Vector3(x + width, y, z + height),
        new THREE.Vector3(x + width, y, z)
      ),
      new THREE.Triangle(
        new THREE.Vector3(x + width, y, z + height),
        new THREE.Vector3(x, y, z),
        new THREE.Vector3(x, y, z + height)
      )
    );

    let geometry = GeometryUtilities.geometryFromFaces(faces);
    const { position } = geometry.attributes;
    const colors: number[] = [];

    for (let i = 0; i < position.count; i++) {
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    sides.push(geometry);
  }

  // -Z axis
  if (!neighbours[2]) {
    side = new THREE.Vector3(0, 0, -1);
    const area = areaForSide(side, neighbours, blockSize);
    const geometry = generateBricks(worldPosition, side, area, blockSize);

    geometry.rotateY(Math.PI * -1);

    const { position } = geometry.attributes;
    const colors: number[] = [];

    for (let i = 0; i < position.count; i++) {
      position.setZ(i, position.getZ(i) - blockSize * 0.35);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    sides.push(geometry);
  } else {
    if (neighbours[8]) {
      const side = GeometryGenerators.generateBlockSideHalf(
        blockSize,
        1,
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector2(1, 0),
        color
      );

      sides.push(side);
    }
    if (neighbours[9]) {
      const side = GeometryGenerators.generateBlockSideHalf(
        blockSize,
        1,
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector2(-1, 0),
        color
      );

      sides.push(side);
    }
  }

  // Z axis
  if (!neighbours[15]) {
    side = new THREE.Vector3(0, 0, 1);
    const area = areaForSide(side, neighbours, blockSize);
    const geometry = generateBricks(worldPosition, side, area, blockSize);

    const { position } = geometry.attributes;
    const colors: number[] = [];

    for (let i = 0; i < position.count; i++) {
      position.setZ(i, position.getZ(i) + blockSize * 0.35);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    sides.push(geometry);
  } else {
    if (neighbours[8]) {
      const side = GeometryGenerators.generateBlockSideHalf(
        blockSize,
        1,
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector2(-1, 0),
        color
      );

      sides.push(side);
    }
    if (neighbours[9]) {
      const side = GeometryGenerators.generateBlockSideHalf(
        blockSize,
        1,
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector2(1, 0),
        color
      );

      sides.push(side);
    }
  }

  if (sides.length === 0) {
    return null;
  }

  return mergeBufferGeometries(sides);
}

function areaForSide(side: THREE.Vector3, neighbours: boolean[], blockSize: number): Area {
  let leftInset = 0;
  let rightInset = 0;
  let x = blockSize * -0.5;
  let y = blockSize * -0.5;
  let width = blockSize;
  let height = blockSize;

  if (side.equals(new THREE.Vector3(-1, 0, 0))) {
    if (!neighbours[2]) {
      leftInset = blockSize * 0.15;
    }
    if (!neighbours[15]) {
      rightInset = blockSize * 0.15;
    }
  } else if (side.equals(new THREE.Vector3(1, 0, 0))) {
    if (!neighbours[15]) {
      leftInset = blockSize * 0.15;
    }
    if (!neighbours[2]) {
      rightInset = blockSize * 0.15;
    }
  } else if (side.equals(new THREE.Vector3(0, 0, -1))) {
    if (!neighbours[9]) {
      leftInset = blockSize * 0.15;
    }
    if (!neighbours[8]) {
      rightInset = blockSize * 0.15;
    }
  } else if (side.equals(new THREE.Vector3(0, 0, 1))) {
    if (!neighbours[8]) {
      leftInset = blockSize * 0.15;
    }
    if (!neighbours[9]) {
      rightInset = blockSize * 0.15;
    }
  }

  return new Area(x + leftInset, y, width - leftInset - rightInset, height);
}

function splitPercentage(position: THREE.Vector3, deviation: number, offset: number): number {
  const simplex = new SimplexNoise();
  const random = simplex.random3(position.x + deviation, position.y + deviation, position.z + deviation);
  return random * offset + (1 - offset) * 0.5;
}

function generateBricks(
  position: THREE.Vector3,
  side: THREE.Vector3,
  area: Area,
  blockSize: number
): THREE.BufferGeometry {
  const faces: THREE.Triangle[] = [];
  const simplex = new SimplexNoise();

  let bsp = new BSP(area);
  let horizontal = simplex.random3(position.x, position.y, position.z) > 0.5;
  const depth = 0.05;

  bsp.split(horizontal, splitPercentage(position, 0, 0.33333));

  let currentAreaPart = simplex.random3(position.x, position.y, position.z) > 0.5;
  let currentArea = currentAreaPart ? bsp.a : bsp.b;
  let nextArea = currentAreaPart ? bsp.b : bsp.a;
  let repeat = 3;
  let index = 0;
  let currentZ = index * blockSize * depth;
  let nextZ = (index + 1) * blockSize * depth;

  // part A (simple)
  bsp = new BSP(currentArea);
  bsp.split(!horizontal, splitPercentage(position, repeat, 0.5));
  currentAreaPart = simplex.random3(position.x + repeat, position.y + repeat, position.z + repeat) > 0.5;

  let lowerZ = index * blockSize * depth;
  let highgerZ = (index + 2) * blockSize * depth;
  let lowerPart = currentAreaPart ? bsp.a : bsp.b;
  let higherPart = currentAreaPart ? bsp.b : bsp.a;

  faces.push(...frontFaces(lowerPart, lowerZ));
  faces.push(...sideFaces(higherPart, lowerZ, highgerZ));
  faces.push(...frontFaces(higherPart, highgerZ));

  // part B (complex)
  faces.push(...sideFaces(nextArea, currentZ, nextZ));
  while (repeat > 1) {
    index++;
    repeat--;
    horizontal = !horizontal;

    bsp = new BSP(nextArea);
    bsp.split(horizontal, splitPercentage(position, repeat, 0.33333));

    currentAreaPart = simplex.random3(position.x + repeat, position.y + repeat, position.z + repeat) > 0.5;
    currentArea = currentAreaPart ? bsp.a : bsp.b;

    nextArea = currentAreaPart ? bsp.b : bsp.a;

    currentZ = index * blockSize * depth;
    nextZ = (index + 1) * blockSize * depth;
    faces.push(...frontFaces(currentArea, currentZ));
    faces.push(...sideFaces(nextArea, currentZ, nextZ));

    if (repeat === 1) {
      index++;
      const lastZ = index * blockSize * depth;
      faces.push(...frontFaces(nextArea, lastZ));
    }
  }

  let geometry = GeometryUtilities.geometryFromFaces(faces);
  geometry = GeometryModifiers.edgeSplit(geometry, Math.PI / 6);

  return geometry;
}

function frontFaces(area: Area, z: number): THREE.Triangle[] {
  return [
    new THREE.Triangle(
      new THREE.Vector3(area.x, area.y, z),
      new THREE.Vector3(area.x + area.width, area.y, z),
      new THREE.Vector3(area.x + area.width, area.y + area.height, z)
    ),
    new THREE.Triangle(
      new THREE.Vector3(area.x + area.width, area.y + area.height, z),
      new THREE.Vector3(area.x, area.y + area.height, z),
      new THREE.Vector3(area.x, area.y, z)
    ),
  ];
}

function sideFaces(area: Area, currZ: number, nextZ: number): THREE.Triangle[] {
  return [
    new THREE.Triangle(
      new THREE.Vector3(area.x, area.y, currZ),
      new THREE.Vector3(area.x + area.width, area.y, currZ),
      new THREE.Vector3(area.x + area.width, area.y, nextZ)
    ),
    new THREE.Triangle(
      new THREE.Vector3(area.x + area.width, area.y, nextZ),
      new THREE.Vector3(area.x, area.y, nextZ),
      new THREE.Vector3(area.x, area.y, currZ)
    ),

    new THREE.Triangle(
      new THREE.Vector3(area.x + area.width, area.y + area.height, currZ),
      new THREE.Vector3(area.x, area.y + area.height, currZ),
      new THREE.Vector3(area.x + area.width, area.y + area.height, nextZ)
    ),
    new THREE.Triangle(
      new THREE.Vector3(area.x + area.width, area.y + area.height, nextZ),
      new THREE.Vector3(area.x, area.y + area.height, currZ),
      new THREE.Vector3(area.x, area.y + area.height, nextZ)
    ),

    new THREE.Triangle(
      new THREE.Vector3(area.x, area.y + area.height, currZ),
      new THREE.Vector3(area.x, area.y, currZ),
      new THREE.Vector3(area.x, area.y + area.height, nextZ)
    ),
    new THREE.Triangle(
      new THREE.Vector3(area.x, area.y + area.height, nextZ),
      new THREE.Vector3(area.x, area.y, currZ),
      new THREE.Vector3(area.x, area.y, nextZ)
    ),

    new THREE.Triangle(
      new THREE.Vector3(area.x + area.width, area.y + area.height, currZ),
      new THREE.Vector3(area.x + area.width, area.y + area.height, nextZ),
      new THREE.Vector3(area.x + area.width, area.y, currZ)
    ),
    new THREE.Triangle(
      new THREE.Vector3(area.x + area.width, area.y + area.height, nextZ),
      new THREE.Vector3(area.x + area.width, area.y, nextZ),
      new THREE.Vector3(area.x + area.width, area.y, currZ)
    ),
  ];
}

// function segmentShape(size: number, segments: number): THREE.Shape {
//   const shape = new THREE.Shape();

//   shape.moveTo(-size * 0.5, -size * 0.5);
//   shape.lineTo(-size * 0.5, size * 0.5);
//   shape.lineTo(size * 0.5, size * 0.5);
//   shape.lineTo(size * 0.5, -size * 0.5);
//   shape.lineTo(-size * 0.5, -size * 0.5);

//   return shape;
// }

// function generateBrick(
//   location: THREE.Vector3,
//   size: number,
//   side: THREE.Vector3,
//   color: THREE.Color
// ): THREE.BufferGeometry {
//   const shape = segmentShape(size, 4);
//   const curve = new THREE.LineCurve3(location, location.clone().add(side.clone().multiplyScalar(size * 0.25)));
//   const geometry = new THREE.ExtrudeBufferGeometry(shape, { bevelEnabled: false, extrudePath: curve });

//   const { position } = geometry.attributes;
//   const colors: number[] = [];

//   for (let i = 0; i < position.count; i++) {
//     colors.push(color.r, color.g, color.b);
//   }

//   geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

//   return geometry;
// }

// function generateBricks(
//   geometry: THREE.BufferGeometry,
//   blockSize: number,
//   side: THREE.Vector3,
//   blockWorldPosition: THREE.Vector3
// ): THREE.BufferGeometry {
//   geometry = geometry.clone();

//   const grid = Array.from({ length: 16 }).map(() => false);
//   const simplexNoise = new SimplexNoise();
//   const seed = blockWorldPosition.clone().add(side);
//   const blockNoise = simplexNoise.noise3(seed.x, seed.y, seed.z) + 1 * 2.5;
//   // const blockNoise = Math.random() + 1 * 2.5;

//   if (blockNoise > 4) {
//     grid[0] = true;
//     grid[1] = true;
//     grid[4] = true;
//     grid[5] = true;
//   } else if (blockNoise > 3) {
//     grid[2] = true;
//     grid[3] = true;
//     grid[6] = true;
//     grid[7] = true;
//   } else if (blockNoise > 2) {
//     grid[8] = true;
//     grid[9] = true;
//     grid[12] = true;
//     grid[13] = true;
//   } else if (blockNoise > 1) {
//     grid[10] = true;
//     grid[11] = true;
//     grid[14] = true;
//     grid[15] = true;
//   } else {
//     grid[5] = true;
//     grid[6] = true;
//     grid[9] = true;
//     grid[10] = true;
//   }

//   const fraction = blockNoise % 1;
//   let brickGeometry: THREE.BufferGeometry[] = [];

//   grid.forEach((cell, index) => {
//     const x = index % 4;
//     const y = Math.floor(index / 4);

//     const cellNoise = simplexNoise.noise3(x, y, fraction);

//     if (cellNoise > 0.5 || cell) {
//       let position: THREE.Vector3;

//       const _x = (x / 4 - 0.5) * blockSize + blockSize / 8;
//       const _y = (y / 4 - 0.5) * blockSize + blockSize / 8;

//       if (side.y === 0 && side.z === 0) {
//         position = new THREE.Vector3(side.x, _y, _x);
//       } else {
//         position = new THREE.Vector3(_x, _y, side.z);
//       }

//       let brick = generateBrick(position, blockSize / 4, side, new THREE.Color('#cb9278'));
//       brick = GeometryModifiers.smooth(brick);
//       brick = GeometryModifiers.edgeSplit(brick, Math.PI / 6);
//       brickGeometry.push(brick);
//     }
//   });

//   console.log('geometry', geometry);
//   console.log('brickGeometry', brickGeometry[0]);
//   const merge = mergeBufferGeometries([geometry, ...brickGeometry]);

//   geometry = merge ? merge : geometry;

//   return geometry;
// }

export { generateBrickCluster };
