/**
 * Deterministic Pseudo-Random Number Generator (Mulberry32)
 * Ensures 100% reproducible traffic simulation runs across scenarios and comparisons.
 */
export class SeededRandom {
  private state: number;
  private readonly initialSeed: number;

  constructor(seed: number = 42) {
    this.initialSeed = Math.floor(seed);
    this.state = this.initialSeed;
  }

  public reset(newSeed?: number): void {
    if (newSeed !== undefined) {
      this.state = Math.floor(newSeed);
    } else {
      this.state = this.initialSeed;
    }
  }

  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  public intRange(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  public choice<T>(items: T[]): T {
    const idx = Math.floor(this.next() * items.length);
    return items[idx];
  }

  public weightedChoice<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let randomVal = this.next() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      if (randomVal < weights[i]) {
        return items[i];
      }
      randomVal -= weights[i];
    }
    return items[items.length - 1];
  }

  public gaussian(mean: number = 0, stdDev: number = 1): number {
    // Box-Muller transform
    let u1 = this.next();
    let u2 = this.next();
    while (u1 <= 1e-7) u1 = this.next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
  }
}
