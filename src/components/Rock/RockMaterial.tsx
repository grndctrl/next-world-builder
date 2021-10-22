import Material, { GenericMaterial } from 'component-material';
import * as THREE from 'three';

import { useFrame } from '@react-three/fiber';

const RockMaterial: React.FC = () => {
  const globalPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), -4);
  const fogPlane = new THREE.Vector4();
  const fogDepth = 20;
  const fogColor = 0x82b9e9;
  const viewNormalMatrix = new THREE.Matrix3();
  const plane = new THREE.Plane();

  useFrame(({ camera, clock }) => {
    viewNormalMatrix.getNormalMatrix(camera.matrixWorldInverse);
    plane.copy(globalPlane).applyMatrix4(camera.matrixWorldInverse, viewNormalMatrix);
    fogPlane.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
  });

  return (
    /* // eslint-disable-next-line @typescript-eslint/ban-ts-comment
       // @ts-ignore */
    <Material
      // 1️⃣ declare uniforms with the correct type
      vertexColors={true}
      uniforms={{
        fogPlane: { value: fogPlane, type: 'vec4' },
        fogPlaneDepth: { value: fogDepth, type: 'float' },
        fogPlaneColor: { value: new THREE.Color(fogColor), type: 'vec3' },
      }}
    >
      {/* eslint-disable-next-line */}
      {/* <Material.Vert.Head children={`varying vec3 vPosition;`} /> */}
      {/* eslint-disable-next-line */}
      {/* <Material.Vert.Body children={`vPosition = position.xyz;`} /> */}

      <Material.Frag.clipping_planes_fragment
        // eslint-disable-next-line
        children={`
          // my code
          float planeFog = 0.0;
          planeFog = smoothstep(0.0, -fogPlaneDepth, dot( vViewPosition, fogPlane.xyz) - fogPlane.w);
        `}
      />
      <Material.Frag.fog_fragment
        // eslint-disable-next-line
        children={`
          // my code
          gl_FragColor.rgb = mix( gl_FragColor.rgb, fogPlaneColor, planeFog );
        `}
      />
    </Material>
  );
};

export default RockMaterial;
