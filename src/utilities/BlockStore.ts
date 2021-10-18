import * as THREE from 'three';
import createHook, { State, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import create from 'zustand/vanilla';

import { ClusterRef, ClusterType, Material } from '@components/Cluster';
import { GroundPlaneRef } from '@components/GroundPlane';
import { indexFromLocalPosition } from '@utilities/BlockUtilities';

interface BlockStore extends State {
  clusterSize: number;

  blockSize: number;

  //

  clusters: {
    [Material.ROCK]: ClusterType[];
    [Material.DIRT]: ClusterType[];
  };

  getAllClusters: () => ClusterType[];

  getClusterByIndex: (index: number) => ClusterType | null;

  clusterRefs: ClusterRef[];

  setClusterRef: (ref: ClusterRef) => void;

  clustersNeedUpdate: number[];

  setClustersNeedUpdate: (clusters: number[]) => void;

  addClusterNeedUpdate: (cluster: number) => void;

  //

  addBlock: (type: Material, clusterIndex: number, localPosition: THREE.Vector3) => void;

  removeBlock: (type: Material, clusterIndex: number, localPosition: THREE.Vector3) => void;

  addClusterWithBlock: (type: Material, worldPosition: THREE.Vector3, localPosition: THREE.Vector3) => void;

  //

  groundPlaneRef: GroundPlaneRef | null;

  setGroundPlaneRef: (ref: GroundPlaneRef) => void;
}

const clusterSize = 4;
const blockSize = 1;
const initialBlocks = Array.from({ length: clusterSize * clusterSize * clusterSize }).map((block) => true);

const state: StateCreator<BlockStore> = (set, get) => ({
  clusterSize: clusterSize,

  blockSize: blockSize,

  //

  clusters: {
    [Material.ROCK]: [
      {
        index: 0,
        type: 0,
        origin: new THREE.Vector3(),
        blocks: initialBlocks,
      },
    ],

    [Material.DIRT]: [],
  },

  getAllClusters: () => {
    const allClusters: ClusterType[] = [];

    allClusters.push(...get().clusters[Material.ROCK]);
    allClusters.push(...get().clusters[Material.DIRT]);
    return allClusters;
  },

  getClusterByIndex: (index) => {
    const allClusters = get().getAllClusters();

    let clusterByIndex = null;

    allClusters.forEach((cluster) => {
      if (cluster.index === index) {
        clusterByIndex = cluster;
      }
    });

    return clusterByIndex;
  },

  clusterRefs: [],

  setClusterRef: (ref) =>
    set((state) => {
      const clusterRefs = get().clusterRefs.slice();
      clusterRefs[ref.index] = ref;
      return { clusterRefs: clusterRefs };
    }),

  clustersNeedUpdate: [],

  setClustersNeedUpdate: (clusters) => set((state) => ({ clustersNeedUpdate: clusters })),

  addClusterNeedUpdate: (clusterIndex) => {
    set(() => {
      const clustersNeedUpdate = get().clustersNeedUpdate;

      if (clustersNeedUpdate.findIndex((cluster) => cluster === clusterIndex) === -1) {
        return { clustersNeedUpdate: [...clustersNeedUpdate, clusterIndex] };
      }

      return { clustersNeedUpdate: clustersNeedUpdate };
    });
  },

  //

  addBlock: (type, clusterIndex, localPosition) => {
    const index = indexFromLocalPosition(localPosition);

    set(() => {
      const clusters = get().clusters;
      const materialsClusters = clusters[type].slice();

      materialsClusters[clusterIndex].blocks[index] = true;

      return { clusters: { ...clusters, [Material.ROCK]: materialsClusters } };
    });

    get().addClusterNeedUpdate(clusterIndex);
  },

  removeBlock: (type, clusterIndex, localPosition) => {
    const index = indexFromLocalPosition(localPosition);

    set(() => {
      const clusters = get().clusters;
      const materialsClusters = clusters[type].slice();

      materialsClusters[clusterIndex].blocks[index] = false;

      return { clusters: { ...clusters, [Material.ROCK]: materialsClusters } };
    });

    get().addClusterNeedUpdate(clusterIndex);
  },

  addClusterWithBlock: (type, worldPosition, localPosition) => {
    const clusters = get().clusters;
    const materialsClusters = clusters[type].slice();
    const allClusters = get().getAllClusters();
    const clusterIndex = allClusters.length;

    const blocks = Array.from({ length: clusterSize * clusterSize * clusterSize }).map((block) => false);
    const index = indexFromLocalPosition(localPosition);
    blocks[index] = true;

    materialsClusters.push({
      index: clusterIndex,
      type: type,
      origin: worldPosition,
      blocks: blocks,
    });

    set(() => {
      return { clusters: { ...clusters, [Material.ROCK]: materialsClusters } };
    });

    get().addClusterNeedUpdate(clusterIndex);
  },

  //

  groundPlaneRef: null,

  setGroundPlaneRef: (ref) => set((state) => ({ groundPlaneRef: ref })),
});

const blockStore =
  process.env.NODE_ENV === 'development' ? create<BlockStore>(devtools(state, 'Block Store')) : create(state);

const useBlockStore = createHook(blockStore);

export { blockStore, useBlockStore };
