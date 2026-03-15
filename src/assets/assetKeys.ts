export const textureKeys = {
  playerWalk: 'player-astronaut-walk',
  playerIdle: 'player-astronaut-idle',
  playerJump: 'player-astronaut-jump',
  platform: 'platform-rock',
  checkpoint: 'checkpoint-flag',
  hazard: 'hazard-spike',
  characters: 'pixel-characters',
  goal: 'goal-shuttle',
  goalMenu: 'goal-shuttle-menu',
  bgStars: 'bg-stars',
  bgMoon: 'bg-moon',
  bgMars: 'bg-mars',
  bgEuropa: 'bg-europa',
  hudPanel: 'hud-panel'
} as const;

export const animationKeys = {
  playerIdle: 'player-idle',
  playerWalk: 'player-walk',
  playerJump: 'player-jump',
  enemyHover: 'enemy-hover',
  collectiblePulse: 'collectible-pulse'
} as const;

export const characterFrames = {
  collectible: 13,
  enemyFrames: [23, 24, 25, 26] as const
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
