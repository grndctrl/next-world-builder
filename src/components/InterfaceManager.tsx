import { useEffect } from 'react';
import * as THREE from 'three';

import Pointer from '@components/Pointer';
import PointerIndicator from '@components/PointerIndicator';
import { useFrame } from '@react-three/fiber';
import { useBlockStore } from '@utilities/BlockStore';
import {
  clusterIndexFromOrigin,
  clusterOriginFromWorldPosition,
  neighbourClustersForWorldPosition,
} from '@utilities/BlockUtilities';
import { interfaceStore, useInterfaceStore } from '@utilities/InterfaceStore';
import { intersectionWorldPosition, isWorldPositionWithinBounds } from '@utilities/InterfaceUtilities';
import { roundedVector3 } from '@utilities/MathUtilities';

const InterfaceManager = () => {
  const { intersection, setIntersection } = useInterfaceStore();
  const { blockSize, clusterRefs, groundPlaneRef, addBlock, removeBlock, addClusterWithBlock, addClusterNeedUpdate } =
    useBlockStore();

  const raycaster = new THREE.Raycaster();

  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const handlePointerUp = ({ button, preventDefault }: PointerEvent) => {
    const type = 0;
    const isPointerDragging = interfaceStore.getState().isPointerDragging;
    const intersection = interfaceStore.getState().intersection;

    if (intersection && !isPointerDragging && intersection.face) {
      const normal = intersection.face.normal.clone().multiplyScalar(blockSize);
      const worldPosition = intersectionWorldPosition(intersection);

      if (button === 2) {
        const clusterOrigin = clusterOriginFromWorldPosition(worldPosition);
        const clusterIndex = clusterIndexFromOrigin(type, clusterOrigin);
        const localPosition = roundedVector3(worldPosition.clone().sub(clusterOrigin), 1e-6);

        if (clusterIndex > -1) {
          removeBlock(type, clusterIndex, localPosition);
          neighbourClustersForWorldPosition(worldPosition).forEach((clusterIndex) => {
            addClusterNeedUpdate(clusterIndex);
          });
        }
      } else {
        worldPosition.add(normal);

        if (isWorldPositionWithinBounds(worldPosition)) {
          const clusterOrigin = clusterOriginFromWorldPosition(worldPosition);
          const clusterIndex = clusterIndexFromOrigin(type, clusterOrigin);
          const localPosition = roundedVector3(worldPosition.clone().sub(clusterOrigin), 1e-6);

          if (clusterIndex > -1) {
            addBlock(type, clusterIndex, localPosition);
            neighbourClustersForWorldPosition(worldPosition).forEach((clusterIndex) => {
              addClusterNeedUpdate(clusterIndex);
            });
          } else {
            addClusterWithBlock(type, clusterOrigin, localPosition);
            neighbourClustersForWorldPosition(worldPosition).forEach((clusterIndex) => {
              addClusterNeedUpdate(clusterIndex);
            });
          }
        }
      }
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
      {intersection && <PointerIndicator intersection={intersection} />}
    </>
  );
};

export default InterfaceManager;
