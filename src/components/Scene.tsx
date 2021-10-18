import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AxesHelper } from 'three';

import GroundPlane from '@components/GroundPlane';
import InterfaceManager from '@components/InterfaceManager';
import World from '@components/World';
import { MapControls, OrthographicCamera } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

// softShadows();

const Scene = () => {
  const light = useRef<THREE.DirectionalLight | null>(null);
  const aspect = window.innerWidth / window.innerHeight;
  const frustumSize = 16;

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[16, 16, 16]}
        near={0.1}
        far={128}
        left={(-aspect * frustumSize) / 2}
        right={(aspect * frustumSize) / 2}
        top={frustumSize / 2}
        bottom={-frustumSize / 2}
        zoom={0.25}
      />
      {/* <OrbitControls makeDefault maxPolarAngle={Math.PI * 0.5} /> */}

      {/* <OrbitControls makeDefault /> */}
      <MapControls
        enableRotate={true}
        maxPolarAngle={Math.PI / 3}
        minPolarAngle={Math.PI / 3}
        maxZoom={2}
        minZoom={0.25}
      />

      <hemisphereLight color={new THREE.Color('#ffddaa')} groundColor={new THREE.Color('#8888ee')} intensity={0.5} />
      <directionalLight
        ref={light}
        color={'#ffffaa'}
        intensity={1.5}
        position={[-2, 10, 3]}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={1}
        shadow-camera-far={32}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />

      <InterfaceManager />
      <World />
      {/* <CornerExample /> */}
      {/* <FacesTest /> */}
      <GroundPlane />
    </>
  );
};

export default Scene;
