import Noise from 'simplex-noise';

export default class SimplexNoise {
  seed: string;
  simplex: Noise;

  constructor(seed = 'seed') {
    this.seed = seed;
    this.simplex = new Noise(seed);
  }

  noise3(x: number, y: number, z: number): number {
    return this.simplex.noise3D(x, y, z);
  }

  noise2(x: number, y: number): number {
    return this.simplex.noise2D(x, y);
  }
}
