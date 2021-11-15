import { useEffect } from 'react';
import * as THREE from 'three';

import Pointer from '@components/Pointer';
import PointerIndicator from '@components/PointerIndicator';
import { useFrame } from '@react-three/fiber';
import { useBlockStore } from '@utilities/BlockStore';
import {
  clusterTypeIndexFromOrigin,
  clusterOriginFromWorldPosition,
  neighbourClustersForWorldPosition,
  clustersAtOrigin,
} from '@utilities/BlockUtilities';
import { interfaceStore, useInterfaceStore } from '@utilities/InterfaceStore';
import { intersectionWorldPosition, isWorldPositionWithinBounds } from '@utilities/InterfaceUtilities';
import { roundedVector3 } from '@utilities/MathUtilities';
import { Material } from './Cluster';

const InterfaceManager = () => {
  const { intersection, setIntersection, setMaterial, isWorldInteractive } = useInterfaceStore();
  const { blockSize, clusterRefs, groundPlaneRef, addBlock, removeBlock, addClusterWithBlock, addClusterNeedUpdate } =
    useBlockStore();

  const raycaster = new THREE.Raycaster();

  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const handlePointerUp = ({ button, preventDefault }: PointerEvent) => {
    const currentMaterial = interfaceStore.getState().currentMaterial;
    const isPointerDragging = interfaceStore.getState().isPointerDragging;
    const intersection = interfaceStore.getState().intersection;
    const isWorldInteractive = interfaceStore.getState().isWorldInteractive;

    if (intersection && !isPointerDragging && intersection.face && isWorldInteractive) {
      const normal = intersection.face.normal.clone().multiplyScalar(blockSize);
      const worldPosition = intersectionWorldPosition(intersection);

      // get block at worldposition
      console.log('🚀 ~ file: InterfaceManager.tsx ~ line 42 ~ handlePointerUp ~ worldPosition', worldPosition);

      if (button === 2) {
        // right click: delete block
        const clusterOrigin = clusterOriginFromWorldPosition(worldPosition);
        const localPosition = roundedVector3(worldPosition.clone().sub(clusterOrigin), 1e-6);
        const clusters = clustersAtOrigin(clusterOrigin);

        if (clusters.length > 0) {
          clusters.forEach((cluster) => {
            removeBlock(cluster.type, cluster.index, localPosition);
            neighbourClustersForWorldPosition(worldPosition).forEach((clusterIndex) => {
              addClusterNeedUpdate(clusterIndex);
            });
          });
        }
      } else {
        worldPosition.add(normal);

        if (isWorldPositionWithinBounds(worldPosition)) {
          const clusterOrigin = clusterOriginFromWorldPosition(worldPosition);
          const clusterIndex = clusterTypeIndexFromOrigin(currentMaterial, clusterOrigin);
          const localPosition = roundedVector3(worldPosition.clone().sub(clusterOrigin), 1e-6);

          if (clusterIndex > -1) {
            console.log('worldPosition', worldPosition);
            addBlock(currentMaterial, clusterIndex, localPosition);
            neighbourClustersForWorldPosition(worldPosition).forEach((clusterIndex) => {
              addClusterNeedUpdate(clusterIndex);
            });
          } else {
            addClusterWithBlock(currentMaterial, clusterOrigin, localPosition);
            neighbourClustersForWorldPosition(worldPosition).forEach((clusterIndex) => {
              addClusterNeedUpdate(clusterIndex);
            });
          }
        }
      }
    }
  };

  const handleKeyUp = ({ key }: KeyboardEvent) => {
    if (key === '1') {
      setMaterial(Material.ROCK);
    } else if (key === '2') {
      setMaterial(Material.BRICK);
    }
  };

  let once = true;

  useFrame(({ camera, mouse }) => {
    raycaster.setFromCamera(mouse, camera);
    let distance = -1;
    let closestIntersection: THREE.Intersection | null = null;

    clusterRefs.forEach((cluster) => {
      if (cluster.clusterColliderRef.current !== null) {
        const clusterIntersections = raycaster.intersectObject(cluster.clusterColliderRef.current, false);

        if (clusterIntersections.length > 0) {
          const blocks = clusterIntersections[0].object.parent?.children.find(
            (child) => child.name === 'blockColliders'
          );
          const currIntersection = blocks ? raycaster.intersectObject(blocks) : [];
          const instanceId = currIntersection[0]?.instanceId;

          if (instanceId !== undefined) {
            if (currIntersection[0].distance < distance || distance === -1) {
              distance = currIntersection[0].distance;
              closestIntersection = currIntersection[0];
            }
          }
        }
      }
    });

    if (closestIntersection === null && groundPlaneRef?.planeColliderRef.current) {
      const intersections = raycaster.intersectObject(groundPlaneRef.planeColliderRef.current, true);
      if (intersections.length > 0) {
        closestIntersection = intersections[0];
      }
    }

    if (closestIntersection) {
      setIntersection(closestIntersection);
    } else {
      if (intersection) {
        setIntersection(null);
      }
    }
  });

  return (
    <>
      <Pointer />
      {intersection && isWorldInteractive && <PointerIndicator intersection={intersection} />}
    </>
  );
};

export default InterfaceManager;
