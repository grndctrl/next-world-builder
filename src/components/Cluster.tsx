import { useEffect, useRef } from 'react';
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
  material: THREE.Material;
}

const Cluster = ({ cluster, geometry, material }: ClusterProps) => {
  const meshRef = useRef<THREE.Mesh | null>(null);
  const blockCollidersRef = useRef<THREE.InstancedMesh | null>(null);
  const clusterColliderRef = useRef<THREE.Mesh | null>(null);

  const { clusterSize, blockSize, setClusterRef } = useBlockStore();
  const instances: THREE.Object3D[] = [];

  for (let z = 0; z < clusterSize; z++) {
    for (let y = 0; y < clusterSize; y++) {
      for (let x = 0; x < clusterSize; x++) {
        const index = x + y * clusterSize + z * clusterSize * clusterSize;
        if (cluster.blocks[index]) {
          const position = new THREE.Vector3(x, y, z);

          position.subScalar((clusterSize - 1) * 0.5);
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
      <mesh castShadow receiveShadow ref={meshRef} position={cluster.origin} geometry={geometry} material={material} />
      <mesh
        visible={false}
        name="clusterCollider"
        ref={clusterColliderRef}
        position={cluster.origin}
        geometry={new THREE.BoxBufferGeometry(clusterSize, clusterSize, clusterSize)}
      />
      <instancedMesh
        castShadow
        name="blockColliders"
        ref={blockCollidersRef}
        args={[new THREE.BoxBufferGeometry(1 - 0.1, 1, 1 - 0.1), undefined, instances.length]}
      >
        <shadowMaterial />
      </instancedMesh>
    </group>
  );
};

export default Cluster;
