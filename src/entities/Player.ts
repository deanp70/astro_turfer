import { textureKeys } from '../assets/assetKeys';
import { PlayerController } from '../systems/PlayerController';

export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;

  readonly controller: PlayerController;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, textureKeys.player).setOrigin(0.5, 0.5);
    this.sprite.setSize(14, 18);
    this.sprite.setOffset(1, 2);
    this.controller = new PlayerController(scene, this.sprite);
  }
}
