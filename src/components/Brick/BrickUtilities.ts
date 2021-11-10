import { difference } from 'lodash';
import * as THREE from 'three';
import { mergeBufferGeometries, mergeVertices } from 'three-stdlib';

import SimplexNoise from '@src/utilities/SimplexNoise';
import { blockStore } from '@utilities/BlockStore';
import * as BlockUtilities from '@utilities/BlockUtilities';
import * as GeometryGenerators from '@utilities/GeometryGenerators';
import * as GeometryModifiers from '@utilities/GeometryModifiers';
import * as GeometryUtilities from '@utilities/GeometryUtilities';
import * as MathUtilities from '@utilities/MathUtilities';

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

          let block = GeometryGenerators.generateBlockSides(blockSize, 8, neighbours, new THREE.Color('#345'));

          if (block) {
            if (BlockUtilities.isBlockAtBottom(worldPosition)) {
              block = GeometryModifiers.pushBottomFace(block);
            }

            // TODO: this needs its own function
            // if (!neighbours[11]) {
            //   const { position, color } = block.attributes;
            //   const grass = new THREE.Color('#4f5566');
            //   const indices = GeometryUtilities.positionIndicesAtY(position as THREE.BufferAttribute, blockSize * 0.5);
            //   indices.forEach((index) => {
            //     color.setXYZ(index, grass.r, grass.g, grass.b);
            //   });
            //   // if (!neighbours[8] && !neighbours[10]) {
            //   if (!neighbours[8]) {
            //     block = deform(block, blockSize, 4, new THREE.Vector3(-1, 0, 0), neighbours, worldPosition);
            //   }

            //   // if (!neighbours[9] && !neighbours[12]) {
            //   if (!neighbours[9]) {
            //     block = deform(block, blockSize, 4, new THREE.Vector3(1, 0, 0), neighbours, worldPosition);
            //   }

            //   // if (!neighbours[2] && !neighbours[4]) {
            //   if (!neighbours[2]) {
            //     block = deform(block, blockSize, 4, new THREE.Vector3(0, 0, -1), neighbours, worldPosition);
            //   }

            //   // if (!neighbours[15] && !neighbours[17]) {
            //   if (!neighbours[15]) {
            //     block = deform(block, blockSize, 4, new THREE.Vector3(0, 0, 1), neighbours, worldPosition);
            //   }
            // }

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

export { generateBrickCluster };
