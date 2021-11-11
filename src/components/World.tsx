import { memo, useEffect, useState } from 'react';
import * as THREE from 'three';

import Cluster, { ClusterType, Material } from '@components/Cluster';
import { generateRockCluster } from '@components/Rock/RockUtilities';
import { generateBrickCluster } from '@components/Brick/BrickUtilities';
import { useBlockStore } from '@utilities/BlockStore';

import RockMaterial from './Rock/RockMaterial';

const generateClusterGeometry = (cluster: ClusterType): Promise<THREE.BufferGeometry> => {
  return new Promise((resolve, reject) => {
    let geometry: THREE.BufferGeometry | null = null;

    if (cluster.type === Material.ROCK) {
      geometry = generateRockCluster(cluster);
    } else if (cluster.type === Material.BRICK) {
      geometry = generateBrickCluster(cluster);
    }

    if (geometry) {
      resolve(geometry);
    } else {
      reject();
    }
  });
};

const World = () => {
  interface ClusterState {
    cluster: ClusterType;
    geometry: THREE.BufferGeometry;
    material: React.FC;
  }

  const clustersNeedUpdate = useBlockStore((state) => state.clustersNeedUpdate);
  const setClustersNeedUpdate = useBlockStore((state) => state.setClustersNeedUpdate);
  const getClusterByIndex = useBlockStore((state) => state.getClusterByIndex);

  const [clusters, setClusters] = useState<ClusterState[]>([]);

  // trigger initial cluster render
  useEffect(() => {
    setClustersNeedUpdate([0]);
  }, []);

  useEffect(() => {
    // console.log('clusters hook update');
  }, [clusters]);

  // TODO: instead of rerendering complete material. Rerender specific block.
  useEffect(() => {
    // find clusters to update
    if (clustersNeedUpdate.length > 0) {
      const index = clustersNeedUpdate[0];
      const clusterByIndex = getClusterByIndex(index);

      if (clusterByIndex !== null) {
        generateClusterGeometry(clusterByIndex).then(
          (geometry) => {
            // Resolved with blocks geometry
            const updatedCluster: ClusterState = {
              cluster: clusterByIndex,
              geometry: geometry,
              material: RockMaterial,
            };

            setClusters((clusters) => {
              const clone = clusters.slice();
              clone[index] = updatedCluster;

              return clone;
            });

            setClustersNeedUpdate(clustersNeedUpdate.splice(1));
          },
          () => {
            // Rejected, no blocks left
            const updatedCluster: ClusterState = {
              cluster: clusterByIndex,
              geometry: new THREE.BufferGeometry(),
              material: RockMaterial,
            };

            setClusters((clusters) => {
              const clone = clusters.slice();
              clone[index] = updatedCluster;

              return clone;
            });

            setClustersNeedUpdate(clustersNeedUpdate.splice(1));
          }
        );
      }
    }
  }, [clustersNeedUpdate]);

  return (
    <>
      {clusters.map((cluster, index) => (
        <Cluster
          key={`cluster-${index}`}
          geometry={cluster.geometry}
          material={cluster.material}
          cluster={cluster.cluster}
        />
      ))}
    </>
  );
};

export default World;
