import * as THREE from 'three';

/**
 * @param {THREE.Triangle} a
 * @param {THREE.Triangle} b
 * @return {*}  {boolean}
 */
function areTrianglesEqual(a: THREE.Triangle, b: THREE.Triangle): boolean {
  if (a.equals(b)) {
    return true;
  } else {
    const ba = b.a;
    const bb = b.b;
    const bc = b.c;

    if (a.equals(new THREE.Triangle(bc, ba, bb))) {
      return true;
    }
    if (a.equals(new THREE.Triangle(bb, bc, ba))) {
      return true;
    }
  }

  return false;
}

/**
 * @param {THREE.Vector3[]} points
 * @return {*}  {THREE.Vector3}
 */
function centerPoint(points: THREE.Vector3[]): THREE.Vector3 {
  const center = new THREE.Vector3();

  points.forEach((point) => {
    center.add(point);
  });

  center.divideScalar(points.length);

  return center;
}

/**
 * @param {THREE.Triangle} triangle
 * @return {*}  {boolean}
 */
function isTriangleSharingCorners(triangle: THREE.Triangle): boolean {
  if (triangle.a.equals(triangle.b)) return true;
  if (triangle.a.equals(triangle.c)) return true;
  if (triangle.b.equals(triangle.c)) return true;

  return false;
}

/**
 * @param {THREE.Line3} a
 * @param {THREE.Line3} b
 * @param {THREE.Line3} c
 * @return {*}  {THREE.Plane}
 */
function randomPlaneOnLines(a: THREE.Line3, b: THREE.Line3, c: THREE.Line3): THREE.Plane {
  const randomPointA = randomPointOnLine(a);
  const randomPointB = randomPointOnLine(b);
  const randomPointC = randomPointOnLine(c);

  return new THREE.Plane().setFromCoplanarPoints(randomPointA, randomPointB, randomPointC);
}

/**
 * @param {THREE.Line3} line
 * @return {*}  {THREE.Vector3}
 */
function randomPointOnLine(line: THREE.Line3): THREE.Vector3 {
  const difference = new THREE.Vector3().subVectors(line.end, line.start);
  // const randomNumber = new SimplexNoise(Math.random().toString()).noise3(
  //   difference.x,
  //   difference.y,
  //   difference.z
  // ) *
  //   0.5 +
  //   0.5
  const randomNumber = Math.random();
  difference.multiplyScalar(randomNumber);

  return new THREE.Vector3().addVectors(line.start, difference);
}

function roundedVector3(point: THREE.Vector3, precision: number): THREE.Vector3 {
  const roundedVector3 = point.clone();

  // roundedVector3.x = Math.round(roundedVector3.x / precision) * precision;
  // roundedVector3.y = Math.round(roundedVector3.y / precision) * precision;
  // roundedVector3.z = Math.round(roundedVector3.z / precision) * precision;
  precision = 1 / precision;
  roundedVector3.x = Math.round(roundedVector3.x * precision) / precision;
  roundedVector3.y = Math.round(roundedVector3.y * precision) / precision;
  roundedVector3.z = Math.round(roundedVector3.z * precision) / precision;

  return roundedVector3;
}

/**
 * @param {THREE.Triangle} triangle
 * @param {THREE.Plane} plane
 * @param {boolean} [isNegative=false]
 * @return {*}  {THREE.Vector3[]}
 */
function sliceTriangle(triangle: THREE.Triangle, plane: THREE.Plane, isNegative = false): THREE.Vector3[] {
  const slicedPoints: THREE.Vector3[] = [];
  const points = [triangle.a.clone(), triangle.b.clone(), triangle.c.clone()];

  if (isNegative) {
    plane = plane.clone();
    plane.negate();
  }
  points.forEach((point) => {
    if (plane.distanceToPoint(point) >= 0) {
      slicedPoints.push(point);
    }
  });

  return slicedPoints;
}

/**
 * @param {THREE.Vector3[]} points
 * @param {THREE.Vector3} normal
 * @return {*}  {THREE.Vector3[]}
 */
function sortPointsClockWise(points: THREE.Vector3[], normal: THREE.Vector3): THREE.Vector3[] {
  const utilityPoints = points.slice();
  const center = centerPoint(points);
  const first = utilityPoints.sort((a, b) => b.distanceTo(center) - a.distanceTo(center))[0];

  const toCrossA = first.clone();
  const toCrossB = center.clone();
  const up = new THREE.Vector3().crossVectors(toCrossA, toCrossB);

  const zAxis = toCrossB.clone().normalize();
  const xAxis = new THREE.Vector3().crossVectors(up, zAxis).normalize();
  const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis);

  const sortedPoints = utilityPoints.sort(
    (a, b) => Math.atan2(a.dot(yAxis), a.dot(xAxis)) - Math.atan2(b.dot(yAxis), b.dot(xAxis))
  );

  return sortedPoints;
}

export {
  areTrianglesEqual,
  centerPoint,
  isTriangleSharingCorners,
  randomPlaneOnLines,
  randomPointOnLine,
  roundedVector3,
  sliceTriangle,
  sortPointsClockWise,
};
