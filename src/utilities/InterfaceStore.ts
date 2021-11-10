import * as THREE from 'three';
import createHook, { State, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import create from 'zustand/vanilla';

import { ClusterRef, ClusterType, Material } from '@components/Cluster';

interface InterfaceStore extends State {
  isPointerDown: boolean;

  pointerDownStart: THREE.Vector2;

  isPointerDragging: boolean;

  togglePointerDown: (toggle: boolean) => void;

  togglePointerDragging: (toggle: boolean) => void;

  setPointerDownStart: (x: number, y: number) => void;

  //

  intersection: THREE.Intersection | null;

  setIntersection: (intersection: THREE.Intersection | null) => void;

  //

  pointerBlockPosition: THREE.Vector3 | null;

  setPointerBlockPosition: (position: THREE.Vector3) => void;

  //

  currentMaterial: Material;

  setMaterial: (material: Material) => void;
}

const state: StateCreator<InterfaceStore> = (set, get) => ({
  isPointerDown: false,

  pointerDownStart: new THREE.Vector2(0, 0),

  isPointerDragging: false,

  togglePointerDown: (toggle) => set(() => ({ isPointerDown: toggle })),

  togglePointerDragging: (toggle) => set(() => ({ isPointerDragging: toggle })),

  setPointerDownStart: (x, y) => set(() => ({ pointerDownStart: new THREE.Vector2(x, y) })),

  //

  intersection: null,

  setIntersection: (intersection) => set(() => ({ intersection: intersection })),

  //

  pointerBlockPosition: null,

  setPointerBlockPosition: (position) => set(() => ({ pointerBlockPosition: position })),

  //

  currentMaterial: Material.ROCK,

  setMaterial: (material) => set(() => ({ currentMaterial: material })),
});

const interfaceStore =
  process.env.NODE_ENV === 'development' ? create(devtools(state, 'Interface Store')) : create(state);

const useInterfaceStore = createHook(interfaceStore);

export { interfaceStore, useInterfaceStore };
