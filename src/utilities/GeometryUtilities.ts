import * as THREE from 'three';
import { mergeVertices } from 'three-stdlib';

import * as MathUtilities from '@utilities/MathUtilities';

/**
 * @param {THREE.BufferGeometry} geometry
 * @param {THREE.Plane} plane
 * @param {boolean} [isNegative=false]
 * @return {*}  {THREE.BufferGeometry}
 */
function bisect(geometry: THREE.BufferGeometry, plane: THREE.Plane, isNegative = false): THREE.BufferGeometry {
  const utilityGeometry = geometry.clone();

  if (isNegative) {
    plane = plane.clone();
    plane.negate();
  }

  const slicedFaces: THREE.Triangle[] = [];
  const intersectedFaces: THREE.Triangle[] = [];

  facesFromGeometry(utilityGeometry).forEach((face) => {
    // Add face if it is completely on the right side of clipping plane
    if (
      plane.distanceToPoint(face.a) >= 0 &&
      plane.distanceToPoint(face.b) >= 0 &&
      plane.distanceToPoint(face.c) >= 0
    ) {
      slicedFaces.push(face);
      return;
    }

    // Check for intersections and add those faces to a seperate array
    const lineAB = new THREE.Line3(face.a, face.b);
    const lineBC = new THREE.Line3(face.b, face.c);
    const lineCA = new THREE.Line3(face.c, face.a);

    if (plane.intersectsLine(lineAB) || plane.intersectsLine(lineBC) || plane.intersectsLine(lineCA)) {
      intersectedFaces.push(face);
      return;
    }
  });

  const adjustedFaces: THREE.Triangle[] = [];
  intersectedFaces.forEach((face) => {
    const vertices = [face.a, face.b, face.c];
    // find vertices that are being cut off, on the negative side of the plane
    let slicedVertices = MathUtilities.sliceTriangle(face, plane, true);

    if (slicedVertices.length === 1) {
      // if there is 1 vertex that is cut off, create two new triangles
      // between the two remaining vertices and the two intersection points
      for (let i = 0; i < 3; i++) {
        if (vertices[i].equals(slicedVertices[0])) {
          const intersections = [
            plane.intersectLine(new THREE.Line3(vertices[i], vertices[(i + 1) % 3]), new THREE.Vector3()),
            plane.intersectLine(new THREE.Line3(vertices[(i + 2) % 3], vertices[i]), new THREE.Vector3()),
          ];

          if (intersections[0] && intersections[1]) {
            if (
              !intersections[0].equals(intersections[1]) &&
              !vertices[(i + 1) % 3].equals(intersections[0]) &&
              !vertices[(i + 1) % 3].equals(intersections[1]) &&
              !vertices[(i + 2) % 3].equals(intersections[1]) &&
              !vertices[(i + 2) % 3].equals(vertices[(i + 1) % 3])
            ) {
              adjustedFaces.push(new THREE.Triangle(intersections[0], vertices[(i + 1) % 3], intersections[1]));

              adjustedFaces.push(new THREE.Triangle(intersections[1], vertices[(i + 1) % 3], vertices[(i + 2) % 3]));
            }
          }
        }

        // find which vertex
      }
    } else if (slicedVertices.length === 2) {
      // find remaining vertex on positive side instead
      slicedVertices = MathUtilities.sliceTriangle(face.clone(), plane.clone(), false);

      if (slicedVertices.length === 1) {
        for (let i = 0; i < 3; i++) {
          if (vertices[i].equals(slicedVertices[0])) {
            const intersections = [
              plane.intersectLine(new THREE.Line3(vertices[i], vertices[(i + 1) % 3]), new THREE.Vector3()),
              plane.intersectLine(new THREE.Line3(vertices[(i + 2) % 3], vertices[i]), new THREE.Vector3()),
            ];

            if (intersections[0] && intersections[1]) {
              if (
                !intersections[0].equals(intersections[1]) &&
                !vertices[i].equals(intersections[0]) &&
                !vertices[i].equals(intersections[1])
              ) {
                adjustedFaces.push(new THREE.Triangle(vertices[i], intersections[0], intersections[1]));
              }
            }
          }
        }
      } else {
        slicedVertices = MathUtilities.sliceTriangle(face.clone(), plane.clone(), true);

        for (let i = 0; i < 3; i++) {
          if (!vertices[i].equals(slicedVertices[0]) && !vertices[i].equals(slicedVertices[1])) {
            const intersections = [
              plane.intersectLine(new THREE.Line3(vertices[i], vertices[(i + 1) % 3]), new THREE.Vector3()),
              plane.intersectLine(new THREE.Line3(vertices[(i + 2) % 3], vertices[i]), new THREE.Vector3()),
            ];

            if (intersections[0] && intersections[1]) {
              if (
                !intersections[0].equals(intersections[1]) &&
                !vertices[i].equals(intersections[0]) &&
                !vertices[i].equals(intersections[1])
              ) {
                adjustedFaces.push(new THREE.Triangle(vertices[i], intersections[0], intersections[1]));
              }
            }
          }
        }
      }
    }
  });
  return geometryFromFaces([...slicedFaces, ...adjustedFaces]);
}

function positionIndicesAtY(positionAttribute: THREE.BufferAttribute, y: number): number[] {
  const indices: number[] = [];

  for (let i = 0; i < positionAttribute.count; i++) {
    if (positionAttribute.getY(i) === y) {
      indices.push(i);
    }
  }

  return indices;
}

function positionIndicesOnSideAtY(
  geometry: THREE.BufferGeometry,
  size: number,
  side: THREE.Vector3,
  y: number
): number[] {
  const positionAttribute = geometry.clone().attributes.position;
  const half = size * 0.5;
  side = side.clone().multiplyScalar(half);

  const indices: number[] = [];

  for (let i = 0; i < positionAttribute.count; i++) {
    const currentPosition = new THREE.Vector3(
      positionAttribute.getX(i),
      positionAttribute.getY(i),
      positionAttribute.getZ(i)
    );

    if (side.z === 0) {
      // Looking for a position on side left / right
      if (currentPosition.x === side.x && currentPosition.y === y) {
        indices.push(i);
      }
    } else if (side.x === 0) {
      // Looking for a position on side front / back
      if (currentPosition.z === side.z && currentPosition.y === y) {
        indices.push(i);
      }
    }
  }

  return indices;
}

/**
 * @param {THREE.BufferAttribute} positionAttribute
 * @param {THREE.Vector3} position
 * @return {*}  {number[]}
 */
function positionIndicesAtPosition(positionAttribute: THREE.BufferAttribute, position: THREE.Vector3): number[] {
  const indices: number[] = [];

  for (let i = 0; i < positionAttribute.count; i++) {
    const currentPosition = new THREE.Vector3(
      positionAttribute.getX(i),
      positionAttribute.getY(i),
      positionAttribute.getZ(i)
    );

    if (currentPosition.equals(position)) {
      indices.push(i);
    }
  }

  return indices;
}

/**
 * @param {THREE.BufferGeometry} geometry
 * @return {*}  {THREE.Triangle[]}
 */
function facesFromGeometry(geometry: THREE.BufferGeometry): THREE.Triangle[] {
  const utilityGeometry = geometry.clone().toNonIndexed();
  const faces: THREE.Triangle[] = [];

  const { position } = utilityGeometry.attributes;

  for (let i = 0; i < position.count; i += 3) {
    const a = new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i));

    const b = new THREE.Vector3(position.getX(i + 1), position.getY(i + 1), position.getZ(i + 1));

    const c = new THREE.Vector3(position.getX(i + 2), position.getY(i + 2), position.getZ(i + 2));

    const face = new THREE.Triangle(a, b, c);

    faces.push(face);
  }

  return faces;
}

/**
 * @param {THREE.Triangle[]} faces
 * @return {*}  {THREE.BufferGeometry}
 */
function geometryFromFaces(faces: THREE.Triangle[]): THREE.BufferGeometry {
  let utilityGeometry = new THREE.BufferGeometry();

  const vertices = [];

  for (let i = 0; i < faces.length; i++) {
    vertices.push(faces[i].a);
    vertices.push(faces[i].b);
    vertices.push(faces[i].c);
  }

  const positions = [];

  for (let i = 0; i < vertices.length; i++) {
    positions.push(vertices[i].x);
    positions.push(vertices[i].y);
    positions.push(vertices[i].z);
  }

  const positionAttribute = new THREE.BufferAttribute(new Float32Array(positions), 3);

  utilityGeometry.setAttribute('position', positionAttribute);
  utilityGeometry = mergeVertices(utilityGeometry);
  utilityGeometry.computeVertexNormals();

  return utilityGeometry;
}

/**
 * @param {THREE.BufferGeometry} geometry
 * @param {THREE.Plane} plane
 * @return {*}  {THREE.Vector3[]}
 */
function intersectPlane(geometry: THREE.BufferGeometry, plane: THREE.Plane): THREE.Vector3[] {
  const utilityGeometry = geometry.clone();
  const pointsOfIntersection: THREE.Vector3[] = [];
  const faces = facesFromGeometry(utilityGeometry);

  faces.forEach((face) => {
    const lines = [new THREE.Line3(face.a, face.b), new THREE.Line3(face.b, face.c), new THREE.Line3(face.c, face.a)];

    lines.forEach((line) => {
      const intersection = plane.intersectLine(line, new THREE.Vector3());

      if (intersection) {
        const roundedIntersection = MathUtilities.roundedVector3(intersection, 1e-6);

        if (pointsOfIntersection.find((point) => point.equals(roundedIntersection)) === undefined) {
          pointsOfIntersection.push(roundedIntersection);
        }
      }
    });
  });

  return pointsOfIntersection;
}

/**
 * @param {THREE.Vector3[]} vertices
 * @param {THREE.Vector3} normal
 * @return {*}  {THREE.BufferGeometry}
 */
function stitchVertices(vertices: THREE.Vector3[], normal: THREE.Vector3, isNegative = false): THREE.BufferGeometry {
  const faces: THREE.Triangle[] = [];
  if (isNegative) {
    normal = normal.clone();
    normal.negate();
  }
  const sortedVertices = MathUtilities.sortPointsClockWise(vertices, normal);
  const center = MathUtilities.centerPoint(sortedVertices);

  for (let i = 0; i < sortedVertices.length; i++) {
    faces.push(new THREE.Triangle(center, sortedVertices[i], sortedVertices[(i + 1) % sortedVertices.length]));
  }

  const utilityGeometry = geometryFromFaces(faces);

  return utilityGeometry;
}

/**
 * @param {THREE.BufferGeometry} geometry
 * @return {*}  {THREE.Vector3[]}
 */
function verticesFromGeometry(geometry: THREE.BufferGeometry): THREE.Vector3[] {
  const utilityGeometry = geometry.clone();
  const vertices: THREE.Vector3[] = [];

  const { position } = utilityGeometry.attributes;

  for (let i = 0; i < position.count; i++) {
    const vertex = new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i));

    vertices.push(vertex);
  }

  return vertices;
}

export {
  bisect,
  facesFromGeometry,
  geometryFromFaces,
  intersectPlane,
  positionIndicesAtPosition,
  positionIndicesAtY,
  positionIndicesOnSideAtY,
  stitchVertices,
  verticesFromGeometry,
};
