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

  private label!: Phaser.GameObjects.Text;

  constructor() {
    super('HudScene');
  }

  create(): void {
    this.label = this.add
      .text(16, 12, '', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
      })
      .setScrollFactor(0)
      .setDepth(1000);

    this.refresh();

    this.game.events.on('hud:update', this.handleHudUpdate, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('hud:update', this.handleHudUpdate, this);
    });
  }

  private handleHudUpdate(update: Partial<HudState>): void {
    this.state = { ...this.state, ...update };
    this.refresh();
  }

  private refresh(): void {
    this.label.setText(
      `LEVEL ${this.state.levelId.toUpperCase()}  LIVES ${this.state.lives}  SCORE ${this.state.score}  O2 ${this.state.oxygen}%  TIME ${Math.max(0, Math.ceil(this.state.timeLeft))}`
    );
  }
}
