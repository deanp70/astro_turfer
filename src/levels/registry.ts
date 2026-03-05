import { levelOrder } from '../assets/assetKeys';
import type { LevelData } from '../types/level';

export function loadLevelByIndex(scene: Phaser.Scene, index: number): LevelData {
  const key = levelOrder[index];
  if (!key) {
    throw new Error(`No level found for index ${index}`);
  }

  const data = scene.cache.json.get(key) as LevelData | undefined;
  if (!data) {
    throw new Error(`Level JSON missing for key: ${key}`);
  }

  return data;
}

export function levelCount(): number {
  return levelOrder.length;
}
