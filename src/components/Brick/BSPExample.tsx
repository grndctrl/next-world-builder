import { useEffect, useRef } from 'react';
import { Area, BSP, contour } from '@utilities/BSP';
import * as THREE from 'three';
import { Sphere } from '@react-three/drei';
import { geometryFromFaces } from '@utilities/GeometryUtilities';
import { useBlockStore } from '@utilities/BlockStore';
import * as GeometryModifiers from '@utilities/GeometryModifiers';
import SimplexNoise from '@utilities/SimplexNoise';

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

function splitPercentage(position: THREE.Vector3, deviation: number, offset: number): number {
  const simplex = new SimplexNoise();
  const random = simplex.random3(position.x + deviation, position.y + deviation, position.z + deviation);
  return random * offset + (1 - offset) * 0.5;
}

const BSPExample = () => {
  const blockSize = useBlockStore((state) => state.blockSize);
  const vertices: THREE.Vector3[] = [];
  const faces: THREE.Triangle[] = [];

  let bsp = new BSP(new Area(0, 0, blockSize, blockSize));
  let horizontal = Math.random() > 0.5;
  const bsps: BSP[] = [];
  const depth = 0.05;

  bsp.split(horizontal, splitPercentage(new THREE.Vector3(), -1, 0.33333));
  bsps.push(bsp);

  let currentAreaPart = Math.random() > 0.5;
  let currentArea = currentAreaPart ? bsp.a : bsp.b;
  let nextArea = currentAreaPart ? bsp.b : bsp.a;
  let repeat = 3;
  let index = 0;
  let currentZ = index * blockSize * depth;
  let nextZ = (index + 1) * blockSize * depth;

  // part A (simple)
  bsp = new BSP(currentArea);
  bsp.split(!horizontal, splitPercentage(new THREE.Vector3(), repeat, 0.5));
  currentAreaPart = Math.random() > 0.5;
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
    bsp.split(horizontal, splitPercentage(new THREE.Vector3(), repeat, 0.33333));

    currentAreaPart = Math.random() > 0.5;
    currentArea = currentAreaPart ? bsp.a : bsp.b;
    bsps.push(new BSP(currentArea));

    nextArea = currentAreaPart ? bsp.b : bsp.a;

    currentZ = index * blockSize * depth;
    nextZ = (index + 1) * blockSize * depth;
    faces.push(...frontFaces(currentArea, currentZ));
    faces.push(...sideFaces(nextArea, currentZ, nextZ));

    if (repeat === 1) {
      index++;
      const lastZ = index * blockSize * depth;
      bsps.push(new BSP(nextArea));

      faces.push(...frontFaces(nextArea, lastZ));
    }
  }

  let geometry = geometryFromFaces(faces);
  geometry = GeometryModifiers.edgeSplit(geometry, Math.PI / 6);

  return (
    <>
      <mesh geometry={geometry}>
        <meshStandardMaterial />
      </mesh>
      <mesh geometry={geometry}>
        <meshBasicMaterial color={'black'} wireframe={true} />
      </mesh>
      {/* {vertices.map((vertex, index) => (
        <Sphere key={index} position={vertex} args={[0.1]}>
          <meshBasicMaterial />
        </Sphere>
      ))} */}
    </>
  );
};

export default BSPExample;
