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

  random2(x: number, y: number): number {
    let r = this.simplex.noise2D(x, y);

    let p = this.simplex.noise2D(x + 1000, y + 1000);
    let q = this.simplex.noise2D(x - 100, y - 100);

    return (r + p + q) / 6 + 0.5;
  }

  random3(x: number, y: number, z: number): number {
    let r = this.simplex.noise3D(x, y, z);

    let p = this.simplex.noise3D(x + 1000, y + 1000, z + 1000);
    let q = this.simplex.noise3D(x - 100, y - 100, z - 100);

    return (r + p + q) / 6 + 0.5;
  }
}
