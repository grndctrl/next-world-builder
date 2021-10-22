import { memo, useEffect, useRef } from 'react';
import * as THREE from 'three';

import { useFrame } from '@react-three/fiber';
import { useBlockStore } from '@utilities/BlockStore';
import { neighboursForWorldPosition } from '@utilities/BlockUtilities';

export enum Material {
  ROCK,
  DIRT,
}

export interface ClusterType {
  index: number;
  type: Material;
  origin: THREE.Vector3;
  blocks: boolean[];
}

export interface ClusterRef {
  index: number;
  type: Material;
  origin: THREE.Vector3;
  clusterColliderRef: React.MutableRefObject<THREE.Mesh | null>;
}

interface ClusterProps {
  cluster: ClusterType;
  geometry: THREE.BufferGeometry;
  material: React.FC;
}

const Cluster = ({ cluster, geometry, material }: ClusterProps) => {
  const meshRef = useRef<THREE.Mesh | null>(null);
  const blockCollidersRef = useRef<THREE.InstancedMesh | null>(null);
  const clusterColliderRef = useRef<THREE.Mesh | null>(null);

  const { clusterSize, blocksPerClusterAxis, blockSize, setClusterRef } = useBlockStore();
  const instances: THREE.Object3D[] = [];

  for (let z = 0; z < blocksPerClusterAxis; z++) {
    for (let y = 0; y < blocksPerClusterAxis; y++) {
      for (let x = 0; x < blocksPerClusterAxis; x++) {
        const index = x + y * blocksPerClusterAxis + z * blocksPerClusterAxis * blocksPerClusterAxis;
        if (cluster.blocks[index]) {
          const position = new THREE.Vector3(x, y, z);

          position.subScalar((blocksPerClusterAxis - 1) * 0.5);
          position.multiplyScalar(blockSize);
          position.add(cluster.origin);

          const neighbours = neighboursForWorldPosition(position);

          if (
            !neighbours[8] ||
            !neighbours[9] ||
            !neighbours[6] ||
            !neighbours[11] ||
            !neighbours[2] ||
            !neighbours[15]
          ) {
            const object = new THREE.Object3D();
            object.position.set(position.x, position.y, position.z);
            object.updateMatrix();
            instances.push(object);
          }
        }
      }
    }
  }

  useEffect(() => {
    console.log('🚀 ~ file: Cluster.tsx ~ line 74 ~ useEffect ~ cluster.origin', cluster.origin);

    setClusterRef({
      index: cluster.index,
      origin: cluster.origin,
      type: cluster.type,
      clusterColliderRef: clusterColliderRef,
    });
  }, []);

  // TODO: Only push outer colliders (skip with all 6 neighbours)
  let isInitializing = true;
  useFrame(() => {
    if (isInitializing) {
      instances.forEach((instance, index) => {
        if (blockCollidersRef.current) {
          blockCollidersRef.current.setMatrixAt(index, instance.matrix);
        }
      });

      if (blockCollidersRef.current) {
        blockCollidersRef.current.instanceMatrix.needsUpdate = true;
      }

      isInitializing = false;
    }
  });

  return (
    <group>
      <axesHelper />
      <mesh castShadow receiveShadow ref={meshRef} position={cluster.origin} geometry={geometry}>
        {material({})}
      </mesh>
      <mesh
        visible={false}
        position={cluster.origin}
        geometry={geometry}
        material={new THREE.MeshBasicMaterial({ color: 'black', wireframe: true })}
      />
      <mesh
        visible={false}
        name="clusterCollider"
        ref={clusterColliderRef}
        position={cluster.origin}
        geometry={new THREE.BoxBufferGeometry(clusterSize, clusterSize, clusterSize)}
      >
        <meshBasicMaterial color={'#4488ff'} wireframe={true} />
      </mesh>
      <instancedMesh
        visible={false}
        name="blockColliders"
        ref={blockCollidersRef}
        args={[new THREE.BoxBufferGeometry(blockSize, blockSize, blockSize), undefined, instances.length]}
      >
        <meshBasicMaterial color={'#44ff88'} wireframe={true} />
      </instancedMesh>
      <instancedMesh
        castShadow
        name="blockShadows"
        args={[
          new THREE.BoxBufferGeometry(blockSize - 0.1 * blockSize, blockSize, blockSize - 0.1 * blockSize),
          undefined,
          instances.length,
        ]}
      >
        <shadowMaterial />
      </instancedMesh>
    </group>
  );
};

export default Cluster;
