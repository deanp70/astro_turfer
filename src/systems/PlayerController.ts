interface PlayerConfig {
  runSpeed: number;
  jumpVelocity: number;
  coyoteTimeMs: number;
  jumpBufferMs: number;
  gravityScale: number;
  maxFallSpeed: number;
}

const DEFAULT_CONFIG: PlayerConfig = {
  runSpeed: 240,
  jumpVelocity: 560,
  coyoteTimeMs: 140,
  jumpBufferMs: 140,
  gravityScale: 1.0,
  maxFallSpeed: 760
};

export class PlayerController {
  private readonly body: Phaser.Physics.Arcade.Body;

  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;

  private readonly config: PlayerConfig;

  private lastGroundedTime = -Infinity;

  private lastJumpPressedTime = -Infinity;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly sprite: Phaser.Physics.Arcade.Sprite,
    configOverrides?: Partial<PlayerConfig>
  ) {
    this.body = sprite.body as Phaser.Physics.Arcade.Body;
    this.cursors = scene.input.keyboard?.createCursorKeys() ?? ({} as Phaser.Types.Input.Keyboard.CursorKeys);
    this.config = { ...DEFAULT_CONFIG, ...configOverrides };

    this.body.setCollideWorldBounds(true);
    this.body.setGravityY(this.scene.physics.world.gravity.y * (this.config.gravityScale - 1));
  }

  update(now: number): void {
    this.applyHorizontalMovement();

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
      this.lastJumpPressedTime = now;
    }

    if (this.body.blocked.down || this.body.touching.down) {
      this.lastGroundedTime = now;
    }

    const canUseCoyote = now - this.lastGroundedTime <= this.config.coyoteTimeMs;
    const jumpBuffered = now - this.lastJumpPressedTime <= this.config.jumpBufferMs;

    if (canUseCoyote && jumpBuffered) {
      this.body.setVelocityY(-this.config.jumpVelocity);
      this.lastJumpPressedTime = -Infinity;
      this.scene.events.emit('player-jumped');
    }

    if (this.body.velocity.y > this.config.maxFallSpeed) {
      this.body.setVelocityY(this.config.maxFallSpeed);
    }

    if ((Phaser.Input.Keyboard.JustUp(this.cursors.up) || Phaser.Input.Keyboard.JustUp(this.cursors.space)) && this.body.velocity.y < -90) {
      this.body.setVelocityY(this.body.velocity.y * 0.5);
    }
  }

  bounceOffEnemy(): void {
    this.body.setVelocityY(-this.config.jumpVelocity * 0.55);
  }

  private applyHorizontalMovement(): void {
    const leftDown = this.cursors.left?.isDown;
    const rightDown = this.cursors.right?.isDown;

    if (leftDown && !rightDown) {
      this.body.setVelocityX(-this.config.runSpeed);
      this.sprite.setFlipX(true);
      return;
    }

    if (rightDown && !leftDown) {
      this.body.setVelocityX(this.config.runSpeed);
      this.sprite.setFlipX(false);
      return;
    }

    this.body.setVelocityX(0);
  }
}
