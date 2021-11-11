import { useEffect, useRef } from 'react';
import { Area, BSP, contour, splitPercentage } from '@utilities/BSP';
import * as THREE from 'three';
import { Sphere } from '@react-three/drei';
import { geometryFromFaces } from '@src/utilities/GeometryUtilities';
import { useBlockStore } from '@src/utilities/BlockStore';
import * as GeometryModifiers from '@utilities/GeometryModifiers';

function currentFaces(area: Area, z: number): THREE.Triangle[] {
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

function nextFaces(area: Area, currZ: number, nextZ: number): THREE.Triangle[] {
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

const BSPExample = () => {
  const blockSize = useBlockStore((state) => state.blockSize);
  const vertices: THREE.Vector3[] = [];
  const faces: THREE.Triangle[] = [];

  let bsp = new BSP(new Area(0, 0, blockSize, blockSize));
  let horizontal = Math.random() > 0.5;
  const bsps: BSP[] = [];

  bsp.split(horizontal, splitPercentage(0.33333));
  bsps.push(bsp);

  let currentAreaPart = Math.random() > 0.5;
  let currentArea = currentAreaPart ? bsp.a : bsp.b;
  let nextArea = currentAreaPart ? bsp.b : bsp.a;
  let repeat = 3;
  let index = 0;
  let currentZ = index * blockSize * 0.1;
  let nextZ = (index + 1) * blockSize * 0.1;

  // faces.push(...currentFaces(currentArea, currentZ));

  // part A (simple)
  bsp = new BSP(currentArea);
  bsp.split(!horizontal, splitPercentage(0.5));
  currentAreaPart = Math.random() > 0.5;
  let lowerZ = index * blockSize * 0.1;
  let highgerZ = (index + 2) * blockSize * 0.1;
  let lowerPart = currentAreaPart ? bsp.a : bsp.b;
  let higherPart = currentAreaPart ? bsp.b : bsp.a;
  faces.push(...currentFaces(lowerPart, lowerZ));
  faces.push(...nextFaces(higherPart, lowerZ, highgerZ));
  faces.push(...currentFaces(higherPart, highgerZ));

  // part B (complex)
  faces.push(...nextFaces(nextArea, currentZ, nextZ));
  while (repeat > 1) {
    index++;
    repeat--;
    horizontal = !horizontal;

    bsp = new BSP(nextArea);
    bsp.split(horizontal, splitPercentage(0.33333));

    currentAreaPart = Math.random() > 0.5;
    currentArea = currentAreaPart ? bsp.a : bsp.b;
    bsps.push(new BSP(currentArea));

    nextArea = currentAreaPart ? bsp.b : bsp.a;

    currentZ = index * blockSize * 0.1;
    nextZ = (index + 1) * blockSize * 0.1;
    faces.push(...currentFaces(currentArea, currentZ));
    faces.push(...nextFaces(nextArea, currentZ, nextZ));

    if (repeat === 1) {
      index++;
      const lastZ = index * blockSize * 0.1;
      bsps.push(new BSP(nextArea));

      faces.push(...currentFaces(nextArea, lastZ));
    }
  }

  console.log(faces);

  // for (let i = areas.length; i > 0; i--) {
  //   const currentAreas: Area[] = [];

  //   for (let j = 0; j < i; j++) {
  //     currentAreas.push(areas[areas.length - 1 - j]);
  //   }

  //   const contourArea = contour(currentAreas);

  //   vertices.push(new THREE.Vector3(contourArea.x, contourArea.y, i));
  //   vertices.push(new THREE.Vector3(contourArea.x + contourArea.width, contourArea.y, i));
  //   vertices.push(new THREE.Vector3(contourArea.x, contourArea.y + contourArea.height, i));
  //   vertices.push(new THREE.Vector3(contourArea.x + contourArea.width, contourArea.y + contourArea.height, i));
  // }

  let geometry = geometryFromFaces(faces);
  geometry = GeometryModifiers.edgeSplit(geometry, Math.PI / 6);

  return (
    <>
      <mesh geometry={geometry}>
        <meshStandardMaterial />
      </mesh>
      {/* {vertices.map((vertex, index) => (
        <Sphere key={index} position={vertex} args={[0.1]}>
          <meshBasicMaterial />
        </Sphere>
      ))} */}
    </>
  );
};

// const BSPExample = () => {
//   const vertices: THREE.Vector3[] = [];

//   let bsp = new BSP(new Area(0, 0, 4, 4));
//   let horizontal = Math.random() > 0.5;
//   const areas: Area[] = [];
//   const bsps: BSP[] = [];
//   const currentAreas = bsp.split(horizontal, splitPercentage(0.33333));
//   let currentAreaIndex = Math.random() > 0.5 ? 0 : 1;
//   let currentArea = currentAreaIndex === 1 ? currentAreas[0] : currentAreas[1];

//   areas.push(currentArea);
//   bsps.push(bsp);

//   let nextArea = currentAreaIndex === 1 ? currentAreas[0] : currentAreas[1];

//   let repeat = 2;
//   while (repeat > 0) {
//     repeat--;
//     horizontal = !horizontal;

//     bsp = new BSP(nextArea);
//     const currentAreas = bsp.split(horizontal, splitPercentage(0.33333));

//     currentAreaIndex = Math.random() > 0.5 ? 0 : 1;
//     currentArea = currentAreas[currentAreaIndex];
//     areas.push(currentArea);

//     nextArea = currentAreaIndex === 1 ? currentAreas[0] : currentAreas[1];

//     if (repeat === 0) {
//       areas.push(nextArea);
//     }
//   }

//   console.log(areas);

//   for (let i = areas.length; i > 0; i--) {
//     const currentAreas: Area[] = [];

//     for (let j = 0; j < i; j++) {
//       currentAreas.push(areas[areas.length - 1 - j]);
//     }

//     const contourArea = contour(currentAreas);

//     vertices.push(new THREE.Vector3(contourArea.x, contourArea.y, i));
//     vertices.push(new THREE.Vector3(contourArea.x + contourArea.width, contourArea.y, i));
//     vertices.push(new THREE.Vector3(contourArea.x, contourArea.y + contourArea.height, i));
//     vertices.push(new THREE.Vector3(contourArea.x + contourArea.width, contourArea.y + contourArea.height, i));
//   }

//   return (
//     <>
//       {vertices.map((vertex, index) => (
//         <Sphere key={index} position={vertex} args={[0.1]}>
//           <meshBasicMaterial />
//         </Sphere>
//       ))}
//     </>
//   );
// };

// const BSPExample = () => {
//   const canvas = useRef<HTMLCanvasElement | null>(null);
//   const context = useRef<CanvasRenderingContext2D | null>(null);
//   let repeat = 2;

//   useEffect(() => {
//     if (canvas.current) {
//       context.current = canvas.current.getContext('2d');
//       if (context.current) {
//         let bsp = new BSP(new Area(0, 0, canvas.current.width, canvas.current.height));
//         let horizontal = Math.random() > 0.5;
//         const areas: Area[] = [];
//         const currentAreas = bsp.split(horizontal, splitPercentage(0.33333));

//         let currentAreaIndex = Math.random() > 0.5 ? 0 : 1;
//         let currentArea = currentAreas[currentAreaIndex];
//         currentArea.depth = repeat + 1;
//         areas.push(currentArea);

//         let nextArea = currentAreaIndex === 1 ? currentAreas[0] : currentAreas[1];
//         nextArea.depth = repeat;

//         while (repeat > 0) {
//           repeat--;
//           horizontal = !horizontal;

//           bsp = new BSP(nextArea);
//           const currentAreas = bsp.split(horizontal, splitPercentage(0.33333));

//           currentAreaIndex = Math.random() > 0.5 ? 0 : 1;
//           currentArea = currentAreas[currentAreaIndex];
//           areas.push(currentArea);

//           nextArea = currentAreaIndex === 1 ? currentAreas[0] : currentAreas[1];
//           nextArea.depth = repeat;

//           if (repeat === 0) {
//             areas.push(nextArea);
//           }
//         }

//         console.log(areas);

//         areas.forEach((area) => {
//           context.current!.fillStyle = `rgba(0, 0, 0, ${1 - area.depth * 0.1})`;
//           context.current!.fillRect(area.x, area.y, area.width, area.height);
//         });
//       }
//     }
//   }, []);

//   return <canvas width={100} height={100} ref={canvas}></canvas>;
// };

export default BSPExample;
