import { memo, useEffect, useState } from 'react';
import * as THREE from 'three';

import Cluster, { ClusterType } from '@components/Cluster';
import { generateRockCluster } from '@components/Rock/RockUtilities';
import { useBlockStore } from '@utilities/BlockStore';

import RockMaterial from './Rock/RockMaterial';

const generateClusterGeometry = (cluster: ClusterType): Promise<THREE.BufferGeometry> => {
  return new Promise((resolve, reject) => {
    const geometry = generateRockCluster(cluster);

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
    // material: THREE.Material;
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
    console.log('clusters hook update');
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
              // material: new THREE.MeshPhysicalMaterial({
              //   color: '#678',
              //   metalness: 0,
              //   roughness: 1,
              //   reflectivity: 0,
              //   vertexColors: true,
              // }),
            };

            setClusters((clusters) => {
              const clone = clusters.slice();
              clone[index] = updatedCluster;

              return clone;
            });

            setClustersNeedUpdate(clustersNeedUpdate.splice(1));
          },
          (e) => {
            // Rejected, no blocks left
            console.log(e);
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

export default memo(World);
