import { textureKeys } from '../assets/assetKeys';
import { Player } from '../entities/Player';
import { levelCount, loadLevelByIndex } from '../levels/registry';
import type { LevelCollectible, LevelData, LevelHazard } from '../types/level';

interface WorldInitData {
  levelIndex: number;
  lives: number;
  score: number;
}

export class WorldScene extends Phaser.Scene {
  private levelIndex = 0;

  private currentLevel!: LevelData;

  private player!: Player;

  private platforms!: Phaser.Physics.Arcade.StaticGroup;

  private hazards!: Phaser.Physics.Arcade.StaticGroup;

  private collectibles!: Phaser.Physics.Arcade.StaticGroup;

  private enemies!: Phaser.Physics.Arcade.Group;

  private checkpoints!: Phaser.Physics.Arcade.StaticGroup;

  private goal!: Phaser.Physics.Arcade.Sprite;

  private lives = 3;

  private score = 0;

  private oxygen = 100;

  private timeLeft = 120;

  private respawnPoint = { x: 80, y: 220 };

  private worldWidth = 3200;

  constructor() {
    super('WorldScene');
  }

  init(data: WorldInitData): void {
    this.levelIndex = data.levelIndex ?? 0;
    this.lives = data.lives ?? 3;
    this.score = data.score ?? 0;
  }

  create(): void {
    this.currentLevel = loadLevelByIndex(this, this.levelIndex);
    this.worldWidth = Math.max(2200, Math.max(...this.currentLevel.platforms.map((p) => p.x + p.width)) + 400);
    this.timeLeft = this.currentLevel.timeLimitSeconds;

    this.physics.world.setBounds(0, 0, this.worldWidth, 720);
    this.cameras.main.setBounds(0, 0, this.worldWidth, 720);
    this.setBackground(this.currentLevel);

    this.platforms = this.physics.add.staticGroup();
    this.hazards = this.physics.add.staticGroup();
    this.collectibles = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group({ allowGravity: false, immovable: false });
    this.checkpoints = this.physics.add.staticGroup();

    this.buildPlatforms();
    this.buildHazards();
    this.buildCollectibles();
    this.buildEnemies();
    this.buildCheckpoints();

    this.player = new Player(this, this.currentLevel.spawn.x, this.currentLevel.spawn.y);
    this.respawnPoint = { ...this.currentLevel.spawn };

    this.goal = this.physics.add.staticSprite(this.currentLevel.goal.x, this.currentLevel.goal.y, textureKeys.goal);

    this.physics.add.collider(this.player.sprite, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);

    this.physics.add.overlap(this.player.sprite, this.hazards, (_, hazardObj) => {
      this.onHazardHit(hazardObj as Phaser.Physics.Arcade.Sprite);
    });

    this.physics.add.overlap(this.player.sprite, this.collectibles, (_, collectibleObj) => {
      this.collect(collectibleObj as Phaser.Physics.Arcade.Sprite);
    });

    this.physics.add.overlap(this.player.sprite, this.checkpoints, (_, checkpointObj) => {
      this.activateCheckpoint(checkpointObj as Phaser.Physics.Arcade.Sprite);
    });

    this.physics.add.overlap(this.player.sprite, this.goal, () => {
      this.advanceLevel();
    });

    this.physics.add.overlap(this.player.sprite, this.enemies, (_, enemyObj) => {
      this.resolveEnemyCollision(enemyObj as Phaser.Physics.Arcade.Sprite);
    });

    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.08);
    this.cameras.main.setDeadzone(120, 80);

    this.events.on('player-jumped', this.playJumpSfx, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off('player-jumped', this.playJumpSfx, this);
    });

    this.pushHud();
  }

  update(_: number, delta: number): void {
    const now = this.time.now;
    this.player.controller.update(now);

    this.oxygen = Math.max(0, this.oxygen - delta * 0.005);
    this.timeLeft = Math.max(0, this.timeLeft - delta / 1000);

    if (this.oxygen <= 0 || this.timeLeft <= 0 || this.player.sprite.y > 760) {
      this.hurtPlayer();
    }

    this.enemies.getChildren().forEach((enemyObj) => {
      const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
      const originX = enemy.getData('originX') as number;
      const patrolDistance = enemy.getData('patrolDistance') as number;
      const speed = enemy.getData('speed') as number;
      const minX = originX - patrolDistance;
      const maxX = originX + patrolDistance;

      if (enemy.x <= minX) {
        enemy.setData('direction', 1);
      } else if (enemy.x >= maxX) {
        enemy.setData('direction', -1);
      }

      enemy.setVelocityX(speed * (enemy.getData('direction') as number));
      enemy.setFlipX((enemy.getData('direction') as number) < 0);
    });

    this.pushHud();
  }

  private setBackground(level: LevelData): void {
    this.cameras.main.setBackgroundColor(0x07090f);
    level.backgroundLayers.forEach((layer, index) => {
      const tint = layer.tint ?? 0xffffff;
      this.add
        .tileSprite(0, 0, 3600, 720, layer.key)
        .setOrigin(0, 0)
        .setAlpha(layer.alpha ?? 1)
        .setScrollFactor(layer.scrollFactorX, 0)
        .setTint(tint)
        .setDepth(-10 + index);
    });
  }

  private buildPlatforms(): void {
    this.currentLevel.platforms.forEach((platform) => {
      const tileCount = Math.max(1, Math.floor(platform.width / 32));
      for (let i = 0; i < tileCount; i += 1) {
        const sprite = this.platforms.create(platform.x + i * 32 + 16, platform.y, textureKeys.platform) as Phaser.Physics.Arcade.Sprite;
        sprite.setDisplaySize(32, platform.height);
        sprite.refreshBody();
      }
    });
  }

  private buildHazards(): void {
    this.currentLevel.hazards.forEach((hazard: LevelHazard) => {
      const sprite = this.hazards.create(hazard.x, hazard.y, textureKeys.hazard) as Phaser.Physics.Arcade.Sprite;
      sprite.setDisplaySize(hazard.width, hazard.height);
      sprite.setTint(hazard.kind === 'lava' ? 0xff3b30 : 0xff6b6b);
      sprite.refreshBody();
    });
  }

  private buildCollectibles(): void {
    this.currentLevel.collectibles.forEach((collectible: LevelCollectible) => {
      const sprite = this.collectibles.create(collectible.x, collectible.y, textureKeys.collectible) as Phaser.Physics.Arcade.Sprite;
      sprite.setData('value', collectible.value);
      sprite.refreshBody();
    });
  }

  private buildEnemies(): void {
    this.currentLevel.enemies.forEach((enemy) => {
      const sprite = this.enemies.create(enemy.x, enemy.y, textureKeys.enemy) as Phaser.Physics.Arcade.Sprite;
      sprite.setData('originX', enemy.x);
      sprite.setData('patrolDistance', enemy.patrolDistance);
      sprite.setData('speed', enemy.speed);
      sprite.setData('direction', 1);
      const body = sprite.body as Phaser.Physics.Arcade.Body | null;
      if (body) {
        body.setSize(14, 12);
        body.setOffset(2, 2);
      }
    });
  }

  private buildCheckpoints(): void {
    this.currentLevel.checkpoints.forEach((checkpoint) => {
      const sprite = this.checkpoints.create(checkpoint.x, checkpoint.y, textureKeys.checkpoint) as Phaser.Physics.Arcade.Sprite;
      sprite.setData('active', false);
      sprite.refreshBody();
    });
  }

  private collect(sprite: Phaser.Physics.Arcade.Sprite): void {
    if (!sprite.active) {
      return;
    }

    const value = (sprite.getData('value') as number) ?? 50;
    this.score += value;
    this.oxygen = Math.min(100, this.oxygen + 8);
    sprite.disableBody(true, true);
  }

  private activateCheckpoint(sprite: Phaser.Physics.Arcade.Sprite): void {
    if (sprite.getData('active') as boolean) {
      return;
    }

    sprite.setData('active', true);
    sprite.setTint(0x52ffc2);
    this.respawnPoint = { x: sprite.x, y: sprite.y - 28 };
  }

  private resolveEnemyCollision(enemy: Phaser.Physics.Arcade.Sprite): void {
    if (!enemy.active) {
      return;
    }

    const playerBody = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
    const isStomp = playerBody.velocity.y > 0 && playerBody.bottom <= enemyBody.top + 12;

    if (isStomp) {
      enemy.disableBody(true, true);
      this.player.controller.bounceOffEnemy();
      this.score += 120;
      return;
    }

    this.hurtPlayer();
  }

  private onHazardHit(_: Phaser.Physics.Arcade.Sprite): void {
    this.hurtPlayer();
  }

  private hurtPlayer(): void {
    this.lives -= 1;

    if (this.lives < 0) {
      this.lives = 3;
      this.score = 0;
      this.scene.restart({ levelIndex: 0, lives: this.lives, score: this.score });
      return;
    }

    this.oxygen = 100;
    this.timeLeft = this.currentLevel.timeLimitSeconds;
    this.player.sprite.setPosition(this.respawnPoint.x, this.respawnPoint.y);
    this.player.sprite.setVelocity(0, 0);
    this.cameras.main.flash(220, 255, 120, 120);
  }

  private advanceLevel(): void {
    const nextIndex = this.levelIndex + 1;
    if (nextIndex >= levelCount()) {
      this.add
        .text(this.cameras.main.worldView.x + 280, 260, 'MISSION COMPLETE', {
          fontFamily: 'monospace',
          fontSize: '42px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 6
        })
        .setDepth(500);
      this.physics.pause();
      return;
    }

    this.scene.restart({ levelIndex: nextIndex, lives: this.lives, score: this.score });
  }

  private playJumpSfx(): void {
    // Placeholder audio hook. Replace with loaded SFX keys during asset integration.
  }

  private pushHud(): void {
    this.game.events.emit('hud:update', {
      levelId: this.currentLevel.id,
      lives: this.lives,
      score: this.score,
      oxygen: Math.round(this.oxygen),
      timeLeft: this.timeLeft
    });
  }
}
