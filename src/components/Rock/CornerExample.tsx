import { difference } from 'lodash';
import * as THREE from 'three';

import { edgeSplit, smooth } from '@utilities/GeometryModifiers';
import {
  geometryFromFaces,
  positionIndicesAtPosition,
  positionIndicesAtY,
  positionIndicesOnSideAtY,
} from '@utilities/GeometryUtilities';
import SimplexNoise from '@utilities/SimplexNoise';

function deform(
  geometry: THREE.BufferGeometry,
  size: number,
  segments: number,
  side: THREE.Vector3
): THREE.BufferGeometry {
  geometry = geometry.clone();
  side = side.clone();

  const direction = side.clone().multiplyScalar(-1);
  const half = size * 0.5;
  const segment = size / segments;
  const halfSegment = segment * 0.5;

  const indicesTopRow = positionIndicesOnSideAtY(geometry, size, side, half);
  const indicesSegmentRow = positionIndicesOnSideAtY(geometry, size, side, half - halfSegment);
  const indicesCenterRow = positionIndicesOnSideAtY(geometry, size, side, 0);

  let currentPosition: THREE.Vector3 = new THREE.Vector3();
  let indices = [...indicesTopRow, ...indicesSegmentRow];

  // Inset top and second top rows inwards
  const inset = direction.clone().multiplyScalar(halfSegment);
  indices.forEach((index) => {
    currentPosition = new THREE.Vector3(
      geometry.attributes.position.getX(index),
      geometry.attributes.position.getY(index),
      geometry.attributes.position.getZ(index)
    );

    currentPosition.add(inset);

    geometry.attributes.position.setXYZ(index, currentPosition.x, currentPosition.y, currentPosition.z);
  });

  //

  // filter outer vertices
  indices = indices.filter((index) => {
    currentPosition = new THREE.Vector3(
      geometry.attributes.position.getX(index),
      geometry.attributes.position.getY(index),
      geometry.attributes.position.getZ(index)
    );

    if (side.z === 0 && currentPosition.z > -half && currentPosition.z < half) {
      return true;
    } else if (side.x === 0 && currentPosition.x > -half && currentPosition.x < half) {
      return true;
    }

    return false;
  });

  //

  //distort inner vertices on X/Z direction
  const simplexNoise = new SimplexNoise(Math.random().toString());
  indices.forEach((index) => {
    currentPosition = new THREE.Vector3(
      geometry.attributes.position.getX(index),
      geometry.attributes.position.getY(index),
      geometry.attributes.position.getZ(index)
    );

    const noise = simplexNoise.noise2(currentPosition.x, currentPosition.z) * 0.5;
    const distortion = direction.clone().multiplyScalar(segment).multiplyScalar(noise);
    currentPosition.add(distortion);

    geometry.attributes.position.setXYZ(index, currentPosition.x, currentPosition.y, currentPosition.z);
  });

  //

  //distort segment row vertices on Y
  difference(indices, indicesTopRow).forEach((index) => {
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

  //distort center row vertices on Y
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

  // create a top dent
  indicesTopRow.forEach((index) => {
    let centerIndex: number | null = null;

    if (side.z === 0 && geometry.attributes.position.getZ(index) === 0) {
      centerIndex = index;
    } else if (side.x === 0 && geometry.attributes.position.getX(index) === 0) {
      centerIndex = index;
    }

    if (centerIndex) {
      const offset = geometry.attributes.position.getY(centerIndex) - halfSegment;
      geometry.attributes.position.setY(centerIndex, offset);
    }
  });

  //

  // create bottom dent
  indicesSegmentRow.forEach((index) => {
    let centerIndex: number | null = null;

    if (side.z === 0 && geometry.attributes.position.getZ(index) === 0) {
      centerIndex = index;
    } else if (side.x === 0 && geometry.attributes.position.getX(index) === 0) {
      centerIndex = index;
    }

    if (centerIndex) {
      geometry.attributes.position.setY(centerIndex, -halfSegment);
    }
  });

  indicesCenterRow.forEach((index) => {
    let centerIndex: number | null = null;

    if (side.z === 0 && geometry.attributes.position.getZ(index) === 0) {
      centerIndex = index;
    } else if (side.x === 0 && geometry.attributes.position.getX(index) === 0) {
      centerIndex = index;
    }

    if (centerIndex) {
      geometry.attributes.position.setY(centerIndex, -segment);
    }
  });

  return geometry;
}

function createRockPrimitive(size: number): THREE.BufferGeometry {
  const segments = 4;
  const half = size * 0.5;
  const segment = size / segments;
  const topSegment = half - segment * 0.5;

  const geometry = new THREE.BoxBufferGeometry(size, size, size, segments, segments, segments) as THREE.BufferGeometry;

  positionIndicesAtY(geometry.attributes.position as THREE.BufferAttribute, half - segment).forEach((index) => {
    geometry.attributes.position.setY(index, topSegment);
  });

  return geometry;
}

const CornerExample = () => {
  let geometry = createRockPrimitive(1);

  geometry = deform(geometry, 1, 4, new THREE.Vector3(1, 0, 0));
  // geometry = deform(geometry, 1, 4, new THREE.Vector3(0, 0, 1));

  geometry = smooth(geometry);
  geometry = edgeSplit(geometry, Math.PI / 6);

  return (
    <mesh geometry={geometry}>
      <meshNormalMaterial wireframe={false} />
      {/* <meshPhysicalMaterial color={'#ff8844'} /> */}
    </mesh>
  );
};

export default CornerExample;
