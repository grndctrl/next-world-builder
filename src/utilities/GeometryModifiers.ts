import * as THREE from 'three';
import {
  ConvexGeometry,
  EdgeSplitModifier,
  SimplifyModifier,
  TessellateModifier,
  mergeBufferGeometries,
  mergeVertices,
} from 'three-stdlib';

import * as GeometryUtilities from '@utilities/GeometryUtilities';
import SimplexNoise from '@utilities/SimplexNoise';

/**
 * @param {THREE.BufferGeometry} geometry
 * @return {*}  {THREE.BufferGeometry}
 */
function convex(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  let modifiedGeometry = geometry.clone();

  modifiedGeometry = new ConvexGeometry(GeometryUtilities.verticesFromGeometry(modifiedGeometry));

  smooth(modifiedGeometry);

  return modifiedGeometry;
}

/**
 * @param {THREE.BufferGeometry} geometry
 * @param {number} displacement
 * @return {*}  {THREE.BufferGeometry}
 */
function jitter(geometry: THREE.BufferGeometry, displacement: number): THREE.BufferGeometry {
  const modifiedGeometry = geometry.clone();

  const simplex = new SimplexNoise();
  const { position } = modifiedGeometry.attributes;

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);

    const noise = simplex.noise3(x, y, z);

    position.setX(i, x + noise * displacement);
    position.setY(i, y + noise * displacement);
    position.setZ(i, z + noise * displacement);
  }

  return modifiedGeometry;
}

/**
 * @param {THREE.BufferGeometry} geometry
 * @return {*}  {THREE.BufferGeometry}
 */
function smooth(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  let modifiedGeometry = geometry.clone();

  modifiedGeometry.deleteAttribute('normal');
  modifiedGeometry.deleteAttribute('uv');
  modifiedGeometry = mergeVertices(modifiedGeometry);
  modifiedGeometry.computeVertexNormals();

  return modifiedGeometry;
}

/**
 * @param {THREE.BufferGeometry} geometry
 * @param {THREE.Plane} plane
 * @param {boolean} [isNegative=false]
 * @return {*}  {THREE.BufferGeometry}
 */
function planeCut(geometry: THREE.BufferGeometry, plane: THREE.Plane, isNegative = false): THREE.BufferGeometry {
  let modifiedGeometry = geometry.clone();

  const intersections = GeometryUtilities.intersectPlane(modifiedGeometry, plane);

  if (intersections.length > 2) {
    const bisectGeometry = GeometryUtilities.bisect(modifiedGeometry, plane, isNegative);

    const intersectionGeometry = GeometryUtilities.stitchVertices(intersections, plane.normal, isNegative);

    const mergedGeometry = mergeBufferGeometries([bisectGeometry, intersectionGeometry]);

    modifiedGeometry = mergedGeometry ? mergedGeometry : modifiedGeometry;
    modifiedGeometry = smooth(modifiedGeometry);
  }

  return modifiedGeometry;
}

// forwarded modifiers

/**
 * @param {THREE.BufferGeometry} geometry
 * @param {number} cutOffAngle
 * @param {boolean} [keepNormals=false]
 * @return {*}  {THREE.BufferGeometry}
 */
function edgeSplit(geometry: THREE.BufferGeometry, cutOffAngle: number, keepNormals = false): THREE.BufferGeometry {
  let modifiedGeometry = geometry.clone();
  const modifier = new EdgeSplitModifier();

  modifiedGeometry = modifier.modify(modifiedGeometry, cutOffAngle, keepNormals);

  return modifiedGeometry;
}

function simplify(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  let modifiedGeometry = geometry.clone();
  const modifier = new SimplifyModifier();

  modifiedGeometry = modifier.modify(modifiedGeometry, 1);

  return modifiedGeometry;
}

function tesselate(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  let modifiedGeometry = geometry.clone();
  const modifier = new TessellateModifier();

  modifiedGeometry = modifier.modify(modifiedGeometry);

  return modifiedGeometry;
}

export { convex, jitter, planeCut, smooth, edgeSplit, simplify, tesselate };
