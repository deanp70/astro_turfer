export const textureKeys = {
  player: 'player-astronaut',
  platform: 'platform-tile',
  hazard: 'hazard-spike',
  collectible: 'collectible-crystal',
  enemy: 'enemy-drone',
  checkpoint: 'checkpoint-flag',
  goal: 'goal-beacon',
  bgMoon: 'bg-moon',
  bgMars: 'bg-mars',
  bgEuropa: 'bg-europa'
} as const;

export const levelJsonKeys = {
  moon: 'level-moon',
  mars: 'level-mars',
  europa: 'level-europa'
} as const;

export const levelOrder = [levelJsonKeys.moon, levelJsonKeys.mars, levelJsonKeys.europa] as const;

export const audioKeys = {
  jump: 'sfx-jump',
  collect: 'sfx-collect',
  hurt: 'sfx-hurt',
  stomp: 'sfx-stomp',
  levelClear: 'sfx-level-clear',
  musicMoon: 'music-moon',
  musicMars: 'music-mars',
  musicEuropa: 'music-europa'
} as const;
