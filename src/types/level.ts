export type LevelTheme = 'moon' | 'mars' | 'europa' | 'titan' | 'io' | 'custom';

export interface Vec2 {
  x: number;
  y: number;
}

export interface BackgroundLayer {
  key: string;
  scrollFactorX: number;
  tint?: number;
  alpha?: number;
}

export interface LevelHazard {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: 'spike' | 'laser' | 'lava';
}

export interface LevelCollectible {
  id: string;
  x: number;
  y: number;
  value: number;
  kind: 'crystal' | 'coin' | 'oxygen';
}

export interface LevelPlatform {
  x: number;
  y: number;
  width: number;
  height: number;
  oneWay?: boolean;
}

export interface LevelEnemy {
  id: string;
  x: number;
  y: number;
  patrolDistance: number;
  speed: number;
}

export interface LevelData {
  id: string;
  theme: LevelTheme;
  tilemapKey: string;
  backgroundLayers: BackgroundLayer[];
  musicKey: string;
  spawn: Vec2;
  goal: Vec2;
  hazards: LevelHazard[];
  collectibles: LevelCollectible[];
  platforms: LevelPlatform[];
  enemies: LevelEnemy[];
  checkpoints: Vec2[];
  timeLimitSeconds: number;
}
