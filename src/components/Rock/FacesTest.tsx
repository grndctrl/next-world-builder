import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';

import { useBlockStore } from '@utilities/BlockStore';
import { neighboursForWorldPosition } from '@utilities/BlockUtilities';
import { positionIndicesAtY } from '@utilities/GeometryUtilities';

import { Material } from '../Cluster';

function generateBlockSides(blockSize: number, segments: number, neighbours: boolean[]): THREE.BufferGeometry | null {
  const sides = [];
  const half = blockSize * 0.5;
  const segment = blockSize / segments;
  const topSegment = half - segment * 0.5;

  neighbours.forEach((n, i) => {
    if (n) console.log(i);
  });

  // check each side, generate a face if there is no neighbour
  // -X axis
  if (!neighbours[2]) {
    const plane = new THREE.PlaneBufferGeometry(blockSize, blockSize, 4, 4);
    plane.rotateY(Math.PI * -0.5);
    const { position } = plane.attributes;
    for (let i = 0; i < position.count; i++) {
      position.setX(i, -blockSize * 0.5);
    }
    sides.push(plane);
  }

  // +X axis
  if (!neighbours[15]) {
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
    console.log('🚀 ~ file: FacesTest.tsx ~ line 51 ~ generateRockBlock ~ plane', plane);
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
  if (!neighbours[8]) {
    const plane = new THREE.PlaneBufferGeometry(blockSize, blockSize, 4, 4);
    plane.rotateY(Math.PI);
    const { position } = plane.attributes;
    for (let i = 0; i < position.count; i++) {
      position.setZ(i, -blockSize * 0.5);
    }
    sides.push(plane);
  }

  // +Z axis
  if (!neighbours[9]) {
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

const FacesTest = () => {
  const { clusterSize, blockSize, clusters, getClusterByIndex } = useBlockStore();
  const cluster = getClusterByIndex(0);
  let blocks: THREE.BufferGeometry[] = [];

  cluster?.blocks.forEach((b, i) => {
    if (b) console.log(i);
  });

  if (cluster?.blocks[25]) {
    const position = new THREE.Vector3(2, 2, 2);

    position.subScalar((clusterSize - 1) * 0.5);
    position.multiplyScalar(blockSize);
    position.add(cluster.origin);

    const neighbours = neighboursForWorldPosition(position);
    let block = generateBlockSides(blockSize, 4, neighbours);

    if (block) {
      if (!neighbours[11]) {
        block = pushTopSegment(block, blockSize, 4);
      }

      blocks.push(block);
    }
  }

  console.log('🚀 ~ file: FacesTest.tsx ~ line 67 ~ FacesTest ~ blocks', blocks);

  const plane = new THREE.PlaneBufferGeometry(blockSize, blockSize, 4, 4);
  plane.rotateY(Math.PI * -0.5);
  const { position } = plane.attributes;
  for (let i = 0; i < position.count; i++) {
    position.setX(i, -blockSize * 0.5);
  }
  const geometry = mergeBufferGeometries(blocks);

  return (
    geometry && (
      <mesh geometry={geometry}>
        <axesHelper />
        <meshNormalMaterial wireframe={true} />
      </mesh>
    )
  );
};

export default FacesTest;
