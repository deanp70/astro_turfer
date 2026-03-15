import { textureKeys } from '../assets/assetKeys';

interface HudState {
  levelId: string;
  lives: number;
  score: number;
  oxygen: number;
  timeLeft: number;
}

export class HudScene extends Phaser.Scene {
  private state: HudState = {
    levelId: 'moon-1',
    lives: 3,
    score: 0,
    oxygen: 100,
    timeLeft: 120
  };

  private statusPrimary!: Phaser.GameObjects.Text;

  private statusSecondary!: Phaser.GameObjects.Text;

  private helpPanel!: Phaser.GameObjects.Image;

  private helpText!: Phaser.GameObjects.Text;

  private helpHint!: Phaser.GameObjects.Text;

  private toggleHelpKey?: Phaser.Input.Keyboard.Key;

  private helpVisible = true;

  private paused = false;

  constructor() {
    super('HudScene');
  }

  create(): void {
    this.add
      .image(8, 8, textureKeys.hudPanel)
      .setOrigin(0, 0)
      .setDisplaySize(560, 80)
      .setAlpha(0.92)
      .setScrollFactor(0)
      .setDepth(999);

    this.statusPrimary = this.add
      .text(20, 18, '', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      })
      .setScrollFactor(0)
      .setDepth(1000);

    this.statusSecondary = this.add
      .text(20, 44, '', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#d9eeff',
        stroke: '#000000',
        strokeThickness: 3
      })
      .setScrollFactor(0)
      .setDepth(1000);

    this.helpPanel = this.add
      .image(1272, 8, textureKeys.hudPanel)
      .setOrigin(1, 0)
      .setDisplaySize(690, 108)
      .setAlpha(0.92)
      .setScrollFactor(0)
      .setDepth(999);

    this.helpText = this.add
      .text(
        598,
        18,
        'OBJECTIVE: collect crystals, avoid hazards, and reach the shuttle before O2 or time runs out.\nITEMS: blue crystal = score+oxygen, flag terminal = checkpoint, drones/spikes = lose one life, shuttle = exit.\nCONTROLS: left/right move, up or space jump, P or Esc pause, H toggle help.',
        {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#d9eeff',
          stroke: '#000000',
          strokeThickness: 2,
          wordWrap: { width: 660 }
        }
      )
      .setScrollFactor(0)
      .setDepth(1000);

    this.helpHint = this.add
      .text(1116, 122, 'H: HIDE HELP', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#9ad2ff',
        stroke: '#000000',
        strokeThickness: 3
      })
      .setScrollFactor(0)
      .setDepth(1000);

    this.toggleHelpKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.H);
    this.refresh();

    this.game.events.on('hud:update', this.handleHudUpdate, this);
    this.game.events.on('hud:pause', this.handlePauseUpdate, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('hud:update', this.handleHudUpdate, this);
      this.game.events.off('hud:pause', this.handlePauseUpdate, this);
      this.toggleHelpKey?.destroy();
    });
  }

  update(): void {
    if (this.toggleHelpKey && Phaser.Input.Keyboard.JustDown(this.toggleHelpKey)) {
      this.setHelpVisibility(!this.helpVisible);
    }
  }

  private handleHudUpdate(update: Partial<HudState>): void {
    this.state = { ...this.state, ...update };
    this.refresh();
  }

  private handlePauseUpdate(payload: { paused: boolean }): void {
    this.paused = payload.paused;
    this.refresh();
  }

  private setHelpVisibility(visible: boolean): void {
    this.helpVisible = visible;
    this.helpPanel.setVisible(visible);
    this.helpText.setVisible(visible);
    this.helpHint.setText(visible ? 'H: HIDE HELP' : 'H: SHOW HELP');
  }

  private refresh(): void {
    const scoreValue = this.state.score.toString().padStart(6, '0');
    const timeValue = Math.max(0, Math.ceil(this.state.timeLeft)).toString().padStart(3, '0');

    this.statusPrimary.setText(`LEVEL ${this.state.levelId.toUpperCase()}   SCORE ${scoreValue}   LIVES ${this.state.lives}`);
    this.statusSecondary.setText(`O2 ${this.state.oxygen}%   TIME ${timeValue}s${this.paused ? '   PAUSED (P/ESC TO RESUME)' : ''}`);
  }
}
