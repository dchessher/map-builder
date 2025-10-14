export type TileType = 'water' | 'sand' | 'grass' | 'forest' | 'mountain';

export type TerrainWeights = Record<TileType, number>;

export interface Tile {
  type: TileType;
  elevation: number;
}

const DEFAULT_WIDTH = 40;
const DEFAULT_HEIGHT = 24;

export const DEFAULT_TERRAIN_WEIGHTS: TerrainWeights = {
  water: 25,
  sand: 10,
  grass: 30,
  forest: 20,
  mountain: 15,
};

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function valueNoise(x: number, y: number, base: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + base * 0.1) * 43758.5453;
  return n - Math.floor(n);
}

function layeredNoise(x: number, y: number, base: number): number {
  let amplitude = 1;
  let frequency = 1;
  let total = 0;
  let normalization = 0;

  for (let octave = 0; octave < 4; octave += 1) {
    const sampleX = (x / DEFAULT_WIDTH) * frequency;
    const sampleY = (y / DEFAULT_HEIGHT) * frequency;
    const noiseValue = valueNoise(sampleX, sampleY, base + octave * 13.37);
    total += noiseValue * amplitude;
    normalization += amplitude;
    amplitude *= 0.55;
    frequency *= 2.1;
  }

  return total / normalization;
}

export interface GenerateMapOptions {
  width?: number;
  height?: number;
  weights?: TerrainWeights;
}

function normaliseWeights(weights: TerrainWeights | undefined): TerrainWeights {
  if (!weights) {
    return { ...DEFAULT_TERRAIN_WEIGHTS };
  }

  const entries = Object.entries(weights) as [TileType, number][];
  const total = entries.reduce((sum, [, value]) => sum + Math.max(value, 0), 0);

  if (total <= 0) {
    return { ...DEFAULT_TERRAIN_WEIGHTS };
  }

  const normalised: TerrainWeights = {
    water: 0,
    sand: 0,
    grass: 0,
    forest: 0,
    mountain: 0,
  };

  entries.forEach(([type, value]) => {
    normalised[type] = Math.max(value, 0) / total;
  });

  return normalised;
}

export function generateMap(seed: string, options: GenerateMapOptions = {}): Tile[][] {
  const width = options.width ?? DEFAULT_WIDTH;
  const height = options.height ?? DEFAULT_HEIGHT;
  const baseSeed = seed.trim() || 'default';

  const seedFn = xmur3(baseSeed.toLowerCase());
  const base = seedFn();
  const weights = normaliseWeights(options.weights);
  const cumulativeThresholds: Array<{ type: TileType; threshold: number }> = [];
  let cumulative = 0;
  (['water', 'sand', 'grass', 'forest', 'mountain'] as TileType[]).forEach((type) => {
    cumulative += weights[type];
    cumulativeThresholds.push({ type, threshold: cumulative });
  });

  const map: Tile[][] = [];

  for (let y = 0; y < height; y += 1) {
    const row: Tile[] = [];
    for (let x = 0; x < width; x += 1) {
      const elevation = layeredNoise(x, y, base);
      let type: TileType = 'mountain';
      for (let index = 0; index < cumulativeThresholds.length; index += 1) {
        if (elevation < cumulativeThresholds[index].threshold) {
          type = cumulativeThresholds[index].type;
          break;
        }
      }
      row.push({ type, elevation });
    }
    map.push(row);
  }

  return map;
}
