import { animationKeys, audioKeys, characterFrames, levelJsonKeys, textureKeys } from '../assets/assetKeys';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    const assetPath = (path: string): string => `${import.meta.env.BASE_URL}${path}`;

    this.load.json(levelJsonKeys.moon, assetPath('levels/moon.json'));
    this.load.json(levelJsonKeys.mars, assetPath('levels/mars.json'));
    this.load.json(levelJsonKeys.europa, assetPath('levels/europa.json'));

    this.load.spritesheet(textureKeys.playerWalk, assetPath('assets/2d_astronaut_moon_pack/Astronaut_Walk-Sheet.png'), {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet(textureKeys.playerIdle, assetPath('assets/2d_astronaut_moon_pack/Astronaut_Idle-Sheet.png'), {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet(textureKeys.playerJump, assetPath('assets/2d_astronaut_moon_pack/Astro_Jump-Sheet.png'), {
      frameWidth: 64,
      frameHeight: 64
    });

    this.load.image(textureKeys.platform, assetPath('assets/2d_astronaut_moon_pack/Ground_Rocks.png'));
    this.load.image(textureKeys.checkpoint, assetPath('assets/kenney_pixel-platformer/Tiles/tile_0064.png'));
    this.load.image(textureKeys.hazard, assetPath('assets/kenney_pixel-platformer/Tiles/tile_0068.png'));
    this.load.image(textureKeys.goal, assetPath('assets/2d_astronaut_moon_pack/Space_Shuttle.png'));

    this.load.spritesheet(textureKeys.characters, assetPath('assets/kenney_pixel-platformer/Tilemap/tilemap-characters.png'), {
      frameWidth: 24,
      frameHeight: 24,
      spacing: 1
    });

    this.load.image(textureKeys.bgStars, assetPath('assets/2d_astronaut_moon_pack/Stars.png'));
    this.load.image(textureKeys.bgMoon, assetPath('assets/kenney_planets/Planets/planet00.png'));
    this.load.image(textureKeys.bgMars, assetPath('assets/kenney_planets/Planets/planet02.png'));
    this.load.image(textureKeys.bgEuropa, assetPath('assets/kenney_planets/Planets/planet01.png'));
    this.load.image(textureKeys.hudPanel, assetPath('assets/kenney_ui-pack-space-expansion/PNG/Extra/Default/panel_rectangle.png'));

    this.load.audio(audioKeys.jump, assetPath('assets/kenney_sci_fi_sounds/Audio/thrusterFire_001.ogg'));
    this.load.audio(audioKeys.collect, assetPath('assets/kenney_interface_sounds/Audio/confirmation_001.ogg'));
    this.load.audio(audioKeys.hurt, assetPath('assets/kenney_interface_sounds/Audio/error_003.ogg'));
    this.load.audio(audioKeys.stomp, assetPath('assets/kenney_sci_fi_sounds/Audio/impactMetal_001.ogg'));
    this.load.audio(audioKeys.levelClear, assetPath('assets/kenney_interface_sounds/Audio/tick_004.ogg'));
    this.load.audio(audioKeys.musicMoon, assetPath('assets/kenney_sci_fi_sounds/Audio/spaceEngineLow_000.ogg'));
    this.load.audio(audioKeys.musicMars, assetPath('assets/kenney_sci_fi_sounds/Audio/spaceEngineLow_002.ogg'));
    this.load.audio(audioKeys.musicEuropa, assetPath('assets/kenney_sci_fi_sounds/Audio/spaceEngineLow_004.ogg'));
  }

  create(): void {
    if (!this.anims.exists(animationKeys.playerIdle)) {
      this.anims.create({
        key: animationKeys.playerIdle,
        frames: this.anims.generateFrameNumbers(textureKeys.playerIdle, { start: 0, end: 11 }),
        frameRate: 12,
        repeat: -1
      });
    }

    if (!this.anims.exists(animationKeys.playerWalk)) {
      this.anims.create({
        key: animationKeys.playerWalk,
        frames: this.anims.generateFrameNumbers(textureKeys.playerWalk, { start: 0, end: 7 }),
        frameRate: 14,
        repeat: -1
      });
    }

    if (!this.anims.exists(animationKeys.playerJump)) {
      this.anims.create({
        key: animationKeys.playerJump,
        frames: this.anims.generateFrameNumbers(textureKeys.playerJump, { start: 0, end: 9 }),
        frameRate: 18,
        repeat: -1
      });
    }

    if (!this.anims.exists(animationKeys.enemyFly)) {
      this.anims.create({
        key: animationKeys.enemyFly,
        frames: characterFrames.enemyFlyingFrames.map((frame) => ({ key: textureKeys.characters, frame })),
        frameRate: 10,
        repeat: -1
      });
    }

    if (!this.anims.exists(animationKeys.enemyGround)) {
      this.anims.create({
        key: animationKeys.enemyGround,
        frames: characterFrames.enemyGroundFrames.map((frame) => ({ key: textureKeys.characters, frame })),
        frameRate: 10,
        repeat: -1
      });
    }

    if (!this.anims.exists(animationKeys.collectiblePulse)) {
      this.anims.create({
        key: animationKeys.collectiblePulse,
        frames: [
          { key: textureKeys.characters, frame: characterFrames.collectible },
          { key: textureKeys.characters, frame: characterFrames.collectible + 1 },
          { key: textureKeys.characters, frame: characterFrames.collectible }
        ],
        frameRate: 6,
        repeat: -1
      });
    }

    this.createMenuShuttleTexture();
    this.scene.start('MainMenuScene');
  }

  private createMenuShuttleTexture(): void {
    if (this.textures.exists(textureKeys.goalMenu)) {
      return;
    }

    const sourceImage = this.textures.get(textureKeys.goal).getSourceImage() as CanvasImageSource;
    const canvasTexture = this.textures.createCanvas(textureKeys.goalMenu, 84, 64);
    if (!canvasTexture) {
      return;
    }

    const context = canvasTexture.context;

    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, 84, 64);
    context.drawImage(sourceImage, 46, 344, 220, 168, 0, 0, 84, 64);
    canvasTexture.refresh();
  }
}
