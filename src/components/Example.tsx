import { memo, useEffect, useState } from 'react';
import * as THREE from 'three';

import { Box } from '@react-three/drei';

interface Thing {
  geometry: THREE.BufferGeometry;
  position: THREE.Vector3;
}

const Thing = memo(({ geometry, position }: Thing) => {
  const randomColor = () => new THREE.Color().setHSL(Math.random(), 0.5, 0.5);

  return (
    <mesh geometry={geometry} position={position}>
      <meshBasicMaterial color={randomColor()} />
    </mesh>
  );
});

const doSomeCalculation = (): Promise<Thing> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const thing: Thing = {
        geometry: new THREE.BoxBufferGeometry(),
        position: new THREE.Vector3().random().multiplyScalar(4),
      };

      resolve(thing);
    }, 1000);
  });
};

const Example = () => {
  const [things, setThings] = useState<Thing[]>([]);

  const calculateThing = async () => {
    const thing = await doSomeCalculation();

    setThings((things) => [...things, thing]);
  };

  useEffect(() => {
    calculateThing();
  }, []);

  useEffect(() => {
    calculateThing();
  }, [things]);

  return (
    <>
      {things.map((thing, index) => (
        <Thing key={`thing-${index}`} geometry={thing.geometry} position={thing.position} />
      ))}
    </>
  );
};

// const Example = () => {
//   const [things, setThings] = useState<Thing[]>([]);

//   const calculateThing = () => {
//     const thing: Thing = {
//       geometry: new THREE.BoxBufferGeometry(),
//       position: new THREE.Vector3().random().multiplyScalar(4),
//     };

//     setThings((things) => [...things, thing]);
//   };
//   useEffect(() => {
//     setInterval(() => {
//       calculateThing();
//     }, 1000);
//   }, []);

//   useEffect(() => {
//     console.log(things);
//   }, [things]);

//   return (
//     <>
//       {things.map((thing, index) => (
//         <Thing key={`thing-${index}`} geometry={thing.geometry} position={thing.position} />
//       ))}
//     </>
//   );
// };

export default Example;
