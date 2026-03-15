import { animationKeys, audioKeys, characterFrames, textureKeys } from '../assets/assetKeys';
import { Player } from '../entities/Player';
import { levelCount, loadLevelByIndex } from '../levels/registry';
import type { LevelCollectible, LevelData, LevelHazard, LevelTheme } from '../types/level';
import { shouldUseTouchControls } from '../utils/device';

interface WorldInitData {
  levelIndex: number;
  lives: number;
  score: number;
}

interface ThemePalette {
  sky: number;
  stars: number;
  platform: number;
  hazard: number;
  objective: string;
}

interface GroundGap {
  start: number;
  end: number;
}

const THEME_PALETTES: Record<LevelTheme, ThemePalette> = {
  moon: {
    sky: 0x081022,
    stars: 0xa6bcff,
    platform: 0xdce4f4,
    hazard: 0xb7c1d5,
    objective: '#e0eeff'
  },
  mars: {
    sky: 0x2a130f,
    stars: 0xffb88a,
    platform: 0xe8a074,
    hazard: 0xff7159,
    objective: '#ffd7c3'
  },
  europa: {
    sky: 0x072738,
    stars: 0x89e6ff,
    platform: 0x9fd4e5,
    hazard: 0xff7d66,
    objective: '#cbf6ff'
  },
  titan: {
    sky: 0x1e1624,
    stars: 0xe4b3ff,
    platform: 0xcaa5e4,
    hazard: 0xff926b,
    objective: '#f2dbff'
  },
  io: {
    sky: 0x31260d,
    stars: 0xffd27a,
    platform: 0xe9be6f,
    hazard: 0xff744b,
    objective: '#ffe7be'
  },
  custom: {
    sky: 0x0c1120,
    stars: 0xbad3ff,
    platform: 0xc8d4e8,
    hazard: 0xff7b6a,
    objective: '#dce8ff'
  }
};

const LENGTH_BOOST_BY_LEVEL = [0, 900, 1800] as const;
const GROUND_SEGMENT_WIDTH = 64;
const GROUND_THICKNESS = 80;
const GROUND_TOP_Y = 640;

export class WorldScene extends Phaser.Scene {
  private levelIndex = 0;

  private currentLevel!: LevelData;

  private palette!: ThemePalette;

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

  private oxygenDrainRate = 0.0024;

  private difficultyFactor = 1;

  private respawnPoint = { x: 80, y: 220 };

  private worldWidth = 3200;

  private invulnerableUntil = 0;

  private currentMusic?: Phaser.Sound.BaseSound;

  private pauseKey?: Phaser.Input.Keyboard.Key;

  private escapeKey?: Phaser.Input.Keyboard.Key;

  private isPaused = false;

  private touchPauseRequested = false;

  private touchControlsEnabled = false;

  private pauseOverlay!: Phaser.GameObjects.Container;

  private groundGaps: GroundGap[] = [];

  constructor() {
    super('WorldScene');
  }

  init(data: WorldInitData): void {
    this.levelIndex = data.levelIndex ?? 0;
    this.lives = data.lives ?? 3;
    this.score = data.score ?? 0;
    this.isPaused = false;
    this.touchPauseRequested = false;
  }

  create(): void {
    this.currentLevel = loadLevelByIndex(this, this.levelIndex);
    this.palette = THEME_PALETTES[this.currentLevel.theme] ?? THEME_PALETTES.custom;
    this.touchControlsEnabled = shouldUseTouchControls(this);

    const baseWidth = Math.max(2200, Math.max(...this.currentLevel.platforms.map((p) => p.x + p.width)) + 400);
    const lengthBoost = LENGTH_BOOST_BY_LEVEL[this.levelIndex] ?? this.levelIndex * 850;
    this.worldWidth = baseWidth + lengthBoost;

    this.difficultyFactor = 1 + this.levelIndex * 0.28;
    this.oxygenDrainRate = 0.0024 + this.levelIndex * 0.0007;
    this.timeLeft = Math.max(95, this.currentLevel.timeLimitSeconds - this.levelIndex * 8);
    this.groundGaps = this.buildGapPattern();

    this.physics.world.setBounds(0, 0, this.worldWidth, 920);
    this.cameras.main.setBounds(0, 0, this.worldWidth, 720);
    this.setBackground(this.currentLevel);

    this.platforms = this.physics.add.staticGroup();
    this.hazards = this.physics.add.staticGroup();
    this.collectibles = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group({ allowGravity: false, immovable: false });
    this.checkpoints = this.physics.add.staticGroup();

    this.buildGround();
    this.buildPlatforms();
    this.buildHazards();
    this.buildCollectibles();
    this.buildEnemies();
    this.buildCheckpoints();
    this.buildProceduralEncounters();

    this.player = new Player(this, this.currentLevel.spawn.x, this.currentLevel.spawn.y);
    this.respawnPoint = { ...this.currentLevel.spawn };

    const desiredGoalX = Math.max(this.currentLevel.goal.x, this.worldWidth - 220);
    const goalX = this.resolveSolidX(desiredGoalX);
    const goalSurface = this.surfaceTopAt(goalX, this.currentLevel.goal.y);

    this.add.image(goalX, goalSurface, textureKeys.goal).setOrigin(0.5, 1).setScale(0.3).setDepth(15);

    this.goal = this.physics.add
      .staticSprite(goalX, goalSurface, textureKeys.goalMenu)
      .setOrigin(0.5, 1)
      .setDisplaySize(58, 44)
      .setAlpha(0.001);
    this.goal.refreshBody();

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

    this.pauseKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.escapeKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.createPauseOverlay();
    this.showObjectiveBanner();

    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.08);
    this.cameras.main.setDeadzone(120, 80);

    this.playLevelMusic();

    this.events.on('player-jumped', this.playJumpSfx, this);
    this.game.events.on('controls:pause', this.queueTouchPauseToggle, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off('player-jumped', this.playJumpSfx, this);
      this.game.events.off('controls:pause', this.queueTouchPauseToggle, this);
      this.pauseKey?.destroy();
      this.escapeKey?.destroy();
      this.currentMusic?.stop();
      this.currentMusic = undefined;
    });

    this.pushHud();
    this.game.events.emit('hud:pause', { paused: false });
  }

  update(_: number, delta: number): void {
    if (this.didRequestPauseToggle()) {
      this.togglePause();
    }

    if (this.isPaused) {
      return;
    }

    const now = this.time.now;
    this.player.update(now);

    this.oxygen = Math.max(0, this.oxygen - delta * this.oxygenDrainRate);
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
    this.cameras.main.setBackgroundColor(this.palette.sky);

    this.add
      .tileSprite(0, 0, this.worldWidth + 720, 720, textureKeys.bgStars)
      .setOrigin(0, 0)
      .setScrollFactor(0.04, 0)
      .setAlpha(0.9)
      .setTint(this.palette.stars)
      .setDepth(-50);

    level.backgroundLayers.forEach((layer, index) => {
      this.add
        .image(860 + index * 560, 160 + index * 70, layer.key)
        .setScale(0.24 + index * 0.02)
        .setAlpha(layer.alpha ?? 1)
        .setScrollFactor(Math.max(0.03, layer.scrollFactorX), 0)
        .setDepth(-40 + index);
    });
  }

  private buildGround(): void {
    const segmentCount = Math.ceil(this.worldWidth / GROUND_SEGMENT_WIDTH) + 1;

    for (let i = 0; i < segmentCount; i += 1) {
      const segmentX = i * GROUND_SEGMENT_WIDTH + GROUND_SEGMENT_WIDTH / 2;
      if (this.isInsideGap(segmentX)) {
        continue;
      }

      const sprite = this.platforms.create(segmentX, GROUND_TOP_Y + GROUND_THICKNESS / 2, textureKeys.platform) as Phaser.Physics.Arcade.Sprite;
      sprite.setDisplaySize(GROUND_SEGMENT_WIDTH, GROUND_THICKNESS);
      sprite.setTint(this.palette.platform);
      sprite.refreshBody();
    }
  }

  private buildPlatforms(): void {
    this.currentLevel.platforms.forEach((platform) => {
      const segmentWidth = 64;
      const segmentCount = Math.max(1, Math.ceil(platform.width / segmentWidth));
      const platformY = platform.y + 14;

      for (let i = 0; i < segmentCount; i += 1) {
        const sprite = this.platforms.create(platform.x + i * segmentWidth + segmentWidth / 2, platformY, textureKeys.platform) as Phaser.Physics.Arcade.Sprite;
        sprite.setDisplaySize(segmentWidth, Math.max(20, platform.height + 12));
        sprite.setTint(this.palette.platform);
        sprite.refreshBody();
      }
    });
  }

  private buildHazards(): void {
    this.currentLevel.hazards.forEach((hazard: LevelHazard) => {
      this.spawnHazardCluster(hazard.x, hazard.y, Math.max(1, Math.ceil(hazard.width / 24)), hazard.kind);
    });
  }

  private buildCollectibles(): void {
    this.currentLevel.collectibles.forEach((collectible: LevelCollectible) => {
      const sprite = this.collectibles.create(collectible.x, collectible.y + 8, textureKeys.characters, characterFrames.collectible) as Phaser.Physics.Arcade.Sprite;
      sprite.setScale(1.05);
      sprite.setData('value', collectible.value);
      sprite.play(animationKeys.collectiblePulse);
      sprite.refreshBody();

      this.tweens.add({
        targets: sprite,
        y: sprite.y - 6,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    });
  }

  private buildEnemies(): void {
    this.currentLevel.enemies.forEach((enemy) => {
      this.spawnEnemyAt(enemy.x, enemy.y, enemy.patrolDistance, enemy.speed * this.difficultyFactor);
    });
  }

  private buildCheckpoints(): void {
    this.currentLevel.checkpoints.forEach((checkpoint) => {
      const x = this.resolveSolidX(checkpoint.x);
      const surface = this.surfaceTopAt(x, checkpoint.y);
      const sprite = this.checkpoints.create(x, surface, textureKeys.checkpoint) as Phaser.Physics.Arcade.Sprite;
      sprite.setOrigin(0.5, 1);
      sprite.setScale(2.1);
      sprite.setData('active', false);
      sprite.refreshBody();
    });
  }

  private buildProceduralEncounters(): void {
    if (this.levelIndex === 0) {
      return;
    }

    const encounterCount = this.levelIndex === 1 ? 4 : 7;
    const startX = Math.max(this.currentLevel.goal.x + 160, 2460);
    const endX = this.worldWidth - 320;

    if (endX <= startX) {
      return;
    }

    const step = (endX - startX) / encounterCount;

    for (let i = 0; i < encounterCount; i += 1) {
      const centerX = this.resolveSolidX(startX + i * step);
      const surface = this.surfaceTopAt(centerX, GROUND_TOP_Y);

      this.spawnEnemyAt(centerX + 36, surface - 8, 90 + i * 6, (95 + i * 8) * this.difficultyFactor);

      if (i % 2 === 0) {
        this.spawnHazardCluster(centerX + 110, surface, this.levelIndex >= 2 ? 3 : 2, 'spike');
      }

      const collectible = this.collectibles.create(centerX + 76, surface - 72, textureKeys.characters, characterFrames.collectible) as Phaser.Physics.Arcade.Sprite;
      collectible.setScale(1.05);
      collectible.setData('value', 90);
      collectible.play(animationKeys.collectiblePulse);
      collectible.refreshBody();

      if (this.levelIndex >= 2 && i % 2 === 1) {
        this.spawnEnemyAt(centerX + 170, surface - 8, 70 + i * 5, (110 + i * 5) * this.difficultyFactor);
      }
    }
  }

  private buildGapPattern(): GroundGap[] {
    const base: GroundGap[] = [
      { start: 980, end: 1070 },
      { start: 1760, end: 1860 }
    ];

    if (this.levelIndex >= 1) {
      base.push(
        { start: 2480, end: 2600 },
        { start: 3150, end: 3290 }
      );
    }

    if (this.levelIndex >= 2) {
      base.push(
        { start: 1180, end: 1320 },
        { start: 2120, end: 2260 },
        { start: 2860, end: 3040 },
        { start: 3620, end: 3780 }
      );
    }

    return base.filter((gap) => gap.start > 120 && gap.end < this.worldWidth - 180);
  }

  private isInsideGap(x: number): boolean {
    return this.groundGaps.some((gap) => x > gap.start && x < gap.end);
  }

  private resolveSolidX(x: number): number {
    let resolved = Phaser.Math.Clamp(x, 36, this.worldWidth - 36);

    for (const gap of this.groundGaps) {
      if (resolved <= gap.start || resolved >= gap.end) {
        continue;
      }

      const left = gap.start - 26;
      const right = gap.end + 26;
      resolved = resolved - gap.start < gap.end - resolved ? left : right;
    }

    return Phaser.Math.Clamp(resolved, 36, this.worldWidth - 36);
  }

  private surfaceTopAt(x: number, desiredY: number): number {
    const resolvedX = this.resolveSolidX(x);

    let bestSurface = GROUND_TOP_Y;
    let bestDistance = this.isInsideGap(resolvedX) ? Number.POSITIVE_INFINITY : Math.abs(GROUND_TOP_Y - desiredY);

    this.currentLevel.platforms.forEach((platform) => {
      const start = platform.x;
      const end = platform.x + platform.width;
      if (resolvedX < start || resolvedX > end) {
        return;
      }

      const distance = Math.abs(platform.y - desiredY);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestSurface = platform.y;
      }
    });

    return bestSurface;
  }

  private spawnHazardCluster(centerX: number, desiredY: number, count: number, kind: LevelHazard['kind']): void {
    const spacing = 22;
    const startX = centerX - ((count - 1) * spacing) / 2;

    for (let i = 0; i < count; i += 1) {
      const x = this.resolveSolidX(startX + i * spacing);
      const surface = this.surfaceTopAt(x, desiredY);
      const sprite = this.hazards.create(x, surface, textureKeys.hazard) as Phaser.Physics.Arcade.Sprite;
      sprite.setOrigin(0.5, 1);
      sprite.setScale(1.35);
      sprite.setTint(kind === 'lava' ? 0xff6954 : this.palette.hazard);
      sprite.refreshBody();
    }
  }

  private spawnEnemyAt(x: number, desiredY: number, patrolDistance: number, speed: number): void {
    const resolvedX = this.resolveSolidX(x);
    const surface = this.surfaceTopAt(resolvedX, desiredY);

    const sprite = this.enemies.create(resolvedX, surface - 8, textureKeys.characters, characterFrames.enemyFrames[0]) as Phaser.Physics.Arcade.Sprite;
    sprite.setScale(1.1);
    sprite.setData('originX', resolvedX);
    sprite.setData('patrolDistance', patrolDistance);
    sprite.setData('speed', speed);
    sprite.setData('direction', 1);
    sprite.play(animationKeys.enemyHover);

    const body = sprite.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      body.setSize(16, 14);
      body.setOffset(4, 6);
    }
  }

  private createPauseOverlay(): void {
    const dim = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7).setScrollFactor(0).setDepth(1200);
    const panel = this.add.image(640, 360, textureKeys.hudPanel).setDisplaySize(980, 430).setAlpha(0.96).setScrollFactor(0).setDepth(1201);
    const title = this.add
      .text(640, 182, 'PAUSED', {
        fontFamily: 'monospace',
        fontSize: '40px',
        color: '#f5f8ff',
        stroke: '#000000',
        strokeThickness: 7
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1202);
    const objective = this.add
      .text(
        185,
        245,
        'Objective\nReach the shuttle before oxygen or time expires.\n\nItems\nCrystal: score + oxygen\nFlag terminal: checkpoint\nDrones / spikes / lava: lose one life\nGround gaps: falling costs one life',
        {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#e5f0ff',
          stroke: '#000000',
          strokeThickness: 4,
          lineSpacing: 8,
          wordWrap: { width: 400 }
        }
      )
      .setScrollFactor(0)
      .setDepth(1202);
    const controls = this.add
      .text(
        690,
        245,
        this.touchControlsEnabled
          ? 'Controls\nBottom-left arrows: move\nBottom-right JUMP: jump\nTop-right PAUSE: pause / resume'
          : 'Controls\nLeft / Right: move\nUp or Space: jump\nP or Esc: resume\nH: toggle help',
        {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: '#d6ecff',
          stroke: '#000000',
          strokeThickness: 4,
          lineSpacing: 10,
          wordWrap: { width: 330 }
        }
      )
      .setScrollFactor(0)
      .setDepth(1202);
    const footer = this.add
      .text(640, 518, this.touchControlsEnabled ? 'Touch PAUSE in the top-right corner to continue' : 'Press P or Esc to continue', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#b7ffca',
        stroke: '#000000',
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1202);

    this.pauseOverlay = this.add.container(0, 0, [dim, panel, title, objective, controls, footer]);
    this.pauseOverlay.setVisible(false);
  }

  private showObjectiveBanner(): void {
    const banner = this.add
      .text(
        640,
        116,
        'Collect crystals, avoid hazards, clear longer routes, and reach the shuttle.\nMind the ground gaps: falling costs one life.',
        {
          fontFamily: 'monospace',
          fontSize: '22px',
          color: this.palette.objective,
          stroke: '#000000',
          strokeThickness: 5,
          align: 'center'
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1100);

    this.tweens.add({
      targets: banner,
      alpha: 0,
      duration: 700,
      delay: 5800,
      onComplete: () => {
        banner.destroy();
      }
    });
  }

  private collect(sprite: Phaser.Physics.Arcade.Sprite): void {
    if (!sprite.active) {
      return;
    }

    const value = (sprite.getData('value') as number) ?? 50;
    this.score += value;
    this.oxygen = Math.min(100, this.oxygen + 8);
    this.playSfx(audioKeys.collect, 0.35);
    sprite.disableBody(true, true);
  }

  private activateCheckpoint(sprite: Phaser.Physics.Arcade.Sprite): void {
    if (sprite.getData('active') as boolean) {
      return;
    }

    sprite.setData('active', true);
    sprite.setFlipX(!sprite.flipX);
    sprite.setTint(0x52ffc2);

    this.tweens.add({
      targets: sprite,
      angle: { from: -7, to: 7 },
      duration: 240,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    this.respawnPoint = { x: sprite.x, y: sprite.y - 44 };
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
      this.playSfx(audioKeys.stomp, 0.38);
      return;
    }

    this.hurtPlayer();
  }

  private onHazardHit(_: Phaser.Physics.Arcade.Sprite): void {
    this.hurtPlayer();
  }

  private hurtPlayer(): void {
    if (this.isPaused) {
      return;
    }

    const now = this.time.now;
    if (now < this.invulnerableUntil) {
      return;
    }

    this.lives -= 1;
    this.playSfx(audioKeys.hurt, 0.38);

    if (this.lives < 0) {
      this.currentMusic?.stop();
      this.currentMusic = undefined;
      this.game.events.emit('hud:pause', { paused: false });
      if (this.scene.isActive('HudScene')) {
        this.scene.stop('HudScene');
      }
      this.scene.start('MainMenuScene');
      return;
    }

    this.invulnerableUntil = now + 950;
    this.oxygen = 100;
    this.timeLeft = Math.max(95, this.currentLevel.timeLimitSeconds - this.levelIndex * 8);
    this.player.sprite.setPosition(this.respawnPoint.x, this.respawnPoint.y);
    this.player.sprite.setVelocity(0, 0);
    this.cameras.main.flash(220, 255, 120, 120);

    this.tweens.add({
      targets: this.player.sprite,
      alpha: 0.35,
      yoyo: true,
      repeat: 5,
      duration: 80,
      onComplete: () => {
        this.player.sprite.setAlpha(1);
      }
    });
  }

  private advanceLevel(): void {
    this.playSfx(audioKeys.levelClear, 0.35);

    const nextIndex = this.levelIndex + 1;
    if (nextIndex >= levelCount()) {
      this.currentMusic?.stop();
      this.currentMusic = undefined;

      this.add
        .text(this.cameras.main.worldView.x + 250, 250, 'MISSION COMPLETE\nReturning to menu...', {
          fontFamily: 'monospace',
          fontSize: '42px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 6,
          align: 'center'
        })
        .setDepth(500);

      this.physics.pause();
      this.time.delayedCall(2400, () => {
        this.game.events.emit('hud:pause', { paused: false });
        if (this.scene.isActive('HudScene')) {
          this.scene.stop('HudScene');
        }
        this.scene.start('MainMenuScene');
      });
      return;
    }

    this.currentMusic?.stop();
    this.currentMusic = undefined;
    this.scene.restart({ levelIndex: nextIndex, lives: this.lives, score: this.score });
  }

  private playJumpSfx(): void {
    this.playSfx(audioKeys.jump, 0.26);
  }

  private playLevelMusic(): void {
    if (!this.cache.audio.exists(this.currentLevel.musicKey)) {
      return;
    }

    this.currentMusic?.stop();
    this.currentMusic = this.sound.add(this.currentLevel.musicKey, {
      loop: true,
      volume: 0.16
    });

    this.currentMusic.play();
  }

  private playSfx(key: string, volume: number): void {
    if (!this.cache.audio.exists(key)) {
      return;
    }

    this.sound.play(key, { volume });
  }

  private didRequestPauseToggle(): boolean {
    if (this.touchPauseRequested) {
      this.touchPauseRequested = false;
      return true;
    }

    if (this.pauseKey && Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
      return true;
    }

    return Boolean(this.escapeKey && Phaser.Input.Keyboard.JustDown(this.escapeKey));
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    this.pauseOverlay.setVisible(this.isPaused);

    if (this.isPaused) {
      this.physics.world.pause();
      this.tweens.pauseAll();
      this.sound.pauseAll();
    } else {
      this.physics.world.resume();
      this.tweens.resumeAll();
      this.sound.resumeAll();
    }

    this.game.events.emit('hud:pause', { paused: this.isPaused });
  }

  private queueTouchPauseToggle(): void {
    this.touchPauseRequested = true;
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
