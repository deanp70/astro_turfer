import { animationKeys, textureKeys } from '../assets/assetKeys';
import { PlayerController } from '../systems/PlayerController';

export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;

  readonly controller: PlayerController;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, textureKeys.playerIdle, 0).setOrigin(0.5, 0.6).setScale(0.72);
    this.sprite.setSize(20, 38);
    this.sprite.setOffset(22, 18);
    this.sprite.play(animationKeys.playerIdle);
    this.controller = new PlayerController(scene, this.sprite);
  }

  update(now: number): void {
    this.controller.update(now);
    this.syncAnimation();
  }

  private syncAnimation(): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body | null;
    if (!body) {
      return;
    }

    const grounded = body.blocked.down || body.touching.down;
    if (!grounded) {
      this.sprite.play(animationKeys.playerJump, true);
      return;
    }

    if (Math.abs(body.velocity.x) > 8) {
      this.sprite.play(animationKeys.playerWalk, true);
      return;
    }

    this.sprite.play(animationKeys.playerIdle, true);
  }
}
