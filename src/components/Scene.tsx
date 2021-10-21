import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import GroundPlane from '@components/GroundPlane';
import InterfaceManager from '@components/InterfaceManager';
import World from '@components/World';
import { MapControls, OrbitControls, OrthographicCamera, Stats } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

// softShadows();

const Scene = () => {
  const light = useRef<THREE.DirectionalLight | null>(null);
  const [aspect, setAspect] = useState<number>(0);
  const frustumSize = 16;
  const camera = useThree((state) => state.camera as THREE.OrthographicCamera);

  useEffect(() => {
    console.log('🚀 ~ file: Scene.tsx ~ line 33 ~ useEffect ~ camera', camera);
    setAspect(window.innerWidth / window.innerHeight);

    const handleResize = () => {
      setAspect(window.innerWidth / window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    camera.left = (-aspect * frustumSize) / 2;
    camera.right = (aspect * frustumSize) / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;

    camera.updateProjectionMatrix();
  }, [aspect]);

  return (
    <>
      <Stats />
      <OrthographicCamera makeDefault position={[16, 16, 16]} near={0.1} far={128} zoom={0.25} />

      {/* <MapControls
        enableRotate={true}
        maxPolarAngle={Math.PI / 3}
        minPolarAngle={Math.PI / 3}
        maxZoom={2}
        minZoom={0.25}
      /> */}
      <OrbitControls maxPolarAngle={Math.PI / 2.5} minPolarAngle={0} maxZoom={2} minZoom={0.25} />

      <hemisphereLight color={new THREE.Color('#ffddaa')} groundColor={new THREE.Color('#8888ee')} intensity={0.5} />
      <directionalLight
        ref={light}
        color={'#ffeebb'}
        intensity={1.0}
        position={[-2, 10, 3]}
        castShadow
        shadow-bias={0.001}
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
