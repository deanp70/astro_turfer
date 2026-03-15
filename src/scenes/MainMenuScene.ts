import { characterFrames, textureKeys } from '../assets/assetKeys';
import { shouldUseTouchControls } from '../utils/device';

export class MainMenuScene extends Phaser.Scene {
  private started = false;

  constructor() {
    super('MainMenuScene');
  }

  create(): void {
    this.started = false;
    const touchControlsEnabled = shouldUseTouchControls(this);
    this.cameras.main.setBackgroundColor(0x03050c);

    this.add
      .tileSprite(0, 0, 1280, 720, textureKeys.bgStars)
      .setOrigin(0, 0)
      .setAlpha(0.95)
      .setTint(0x92a4ff);

    this.add.image(170, 120, textureKeys.bgMoon).setScale(0.14).setAlpha(0.75);
    this.add.image(1090, 170, textureKeys.bgMars).setScale(0.16).setAlpha(0.7);
    this.add.image(980, 500, textureKeys.bgEuropa).setScale(0.12).setAlpha(0.65);

    this.add.rectangle(640, 360, 1040, 560, 0x0a1020, 0.86);

    this.add
      .text(640, 110, 'ASTRO TURFER', {
        fontFamily: 'monospace',
        fontSize: '56px',
        color: '#f5f7ff',
        stroke: '#000000',
        strokeThickness: 8
      })
      .setOrigin(0.5);

    this.add
      .text(
        640,
        184,
        'Objective: survive each planet course, collect crystals, and reach the shuttle exit\nbefore your oxygen and timer run out.',
        {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: '#d2ebff',
          stroke: '#000000',
          strokeThickness: 5,
          align: 'center'
        }
      )
      .setOrigin(0.5);

    this.add
      .text(220, 252, 'ITEM LEGEND', {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: '#ffe59a',
        stroke: '#000000',
        strokeThickness: 5
      })
      .setOrigin(0, 0.5);

    this.add.sprite(250, 312, textureKeys.characters, characterFrames.collectible).setScale(2);
    this.add.text(294, 298, 'Crystal: +score and +oxygen', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5
    });

    this.add.image(250, 360, textureKeys.checkpoint).setScale(1.8);
    this.add.text(294, 346, 'Flag terminal: checkpoint', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5
    });

    this.add.image(250, 408, textureKeys.hazard).setScale(1.8);
    this.add.text(294, 394, 'Spikes/lava: lose one life', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5
    });

    this.add.sprite(250, 458, textureKeys.characters, characterFrames.enemyFrames[1]).setScale(2);
    this.add.text(294, 444, 'Drone: lose one life on hit', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5
    });

    this.add.image(250, 526, textureKeys.goalMenu).setOrigin(0.5, 0.5).setDisplaySize(70, 54);
    this.add.text(294, 514, 'Shuttle: level exit', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5
    });

    this.add
      .text(
        748,
        300,
        touchControlsEnabled
          ? 'PHONE CONTROLS\nBottom-left arrows: Move\nBottom-right JUMP: Jump\nTop-right PAUSE: Pause\nTap anywhere: Start'
          : 'CONTROLS\nLeft / Right: Move\nUp or Space: Jump\nP or Esc: Pause\nH: Toggle help panel',
        {
          fontFamily: 'monospace',
          fontSize: '26px',
          color: '#d9eeff',
          stroke: '#000000',
          strokeThickness: 6,
          lineSpacing: 8
        }
      )
      .setOrigin(0, 0);

    const startText = this.add
      .text(640, 620, touchControlsEnabled ? 'Tap anywhere to start' : 'Press Enter / Space or click to start', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#b6ffbf',
        stroke: '#000000',
        strokeThickness: 6
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.35,
      yoyo: true,
      repeat: -1,
      duration: 720
    });

    this.input.keyboard?.on('keydown-ENTER', this.startGame, this);
    this.input.keyboard?.on('keydown-SPACE', this.startGame, this);
    this.input.on('pointerdown', this.startGame, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-ENTER', this.startGame, this);
      this.input.keyboard?.off('keydown-SPACE', this.startGame, this);
      this.input.off('pointerdown', this.startGame, this);
    });
  }

  private startGame(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    if (this.scene.isActive('HudScene')) {
      this.scene.stop('HudScene');
    }

    this.scene.start('WorldScene', { levelIndex: 0, lives: 3, score: 0 });
    this.scene.launch('HudScene');
  }
}
