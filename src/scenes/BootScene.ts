import { levelJsonKeys, textureKeys } from '../assets/assetKeys';

function makeRectTexture(scene: Phaser.Scene, key: string, width: number, height: number, color: number): void {
  const g = scene.add.graphics();
  g.fillStyle(color, 1);
  g.fillRoundedRect(0, 0, width, height, 2);
  g.generateTexture(key, width, height);
  g.destroy();
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.load.json(levelJsonKeys.moon, '/levels/moon.json');
    this.load.json(levelJsonKeys.mars, '/levels/mars.json');
    this.load.json(levelJsonKeys.europa, '/levels/europa.json');
  }

  create(): void {
    // Placeholder procedural textures so the game is playable before external assets are imported.
    makeRectTexture(this, textureKeys.player, 16, 20, 0x8fe9ff);
    makeRectTexture(this, textureKeys.platform, 32, 16, 0x6f7480);
    makeRectTexture(this, textureKeys.hazard, 20, 20, 0xff5d5d);
    makeRectTexture(this, textureKeys.collectible, 12, 12, 0x52ffc2);
    makeRectTexture(this, textureKeys.enemy, 18, 14, 0xffca55);
    makeRectTexture(this, textureKeys.checkpoint, 12, 28, 0x89adff);
    makeRectTexture(this, textureKeys.goal, 18, 32, 0xb587ff);

    makeRectTexture(this, textureKeys.bgMoon, 4, 4, 0x0f1629);
    makeRectTexture(this, textureKeys.bgMars, 4, 4, 0x261018);
    makeRectTexture(this, textureKeys.bgEuropa, 4, 4, 0x071827);

    this.scene.start('WorldScene', { levelIndex: 0, lives: 3, score: 0 });
    this.scene.launch('HudScene');
  }
}
