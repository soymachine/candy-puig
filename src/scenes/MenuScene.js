import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GEM_KEYS } from '../config.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    // Initialize sound settings in registry (persists across scenes)
    if (this.registry.get('musicOn') === undefined) this.registry.set('musicOn', true);
    if (this.registry.get('sfxOn') === undefined) this.registry.set('sfxOn', true);

    this.drawBackground();
    this.drawClouds();
    this.drawScenery();
    this.drawBorder();
    this.drawTitle();
    this.drawPlayButton();
    this.drawBottomButtons();
  }

  // ── Background: purple-to-sky-blue gradient ──
  drawBackground() {
    const bg = this.add.graphics();
    const strips = 60;
    const stripH = GAME_HEIGHT / strips;
    for (let i = 0; i < strips; i++) {
      const t = i / strips;
      // Top: purple (0x6633aa) → Mid: sky blue (0x88ccee) → Bottom: light cyan (0xaaddee)
      let r, g, b;
      if (t < 0.35) {
        const s = t / 0.35;
        r = Phaser.Math.Interpolation.Linear([0x66, 0x55], s);
        g = Phaser.Math.Interpolation.Linear([0x33, 0x88], s);
        b = Phaser.Math.Interpolation.Linear([0xaa, 0xdd], s);
      } else {
        const s = (t - 0.35) / 0.65;
        r = Phaser.Math.Interpolation.Linear([0x55, 0x88], s);
        g = Phaser.Math.Interpolation.Linear([0x88, 0xdd], s);
        b = Phaser.Math.Interpolation.Linear([0xdd, 0xf0], s);
      }
      const color = (r << 16) | (g << 8) | b;
      bg.fillStyle(color, 1);
      bg.fillRect(0, i * stripH, GAME_WIDTH, stripH + 1);
    }
  }

  // ── Decorative clouds ──
  drawClouds() {
    const cloudData = [
      { x: 180, y: 440, w: 200, h: 60, alpha: 0.7 },
      { x: 500, y: 380, w: 150, h: 45, alpha: 0.5 },
      { x: 100, y: 340, w: 120, h: 35, alpha: 0.4 },
      { x: 600, y: 500, w: 170, h: 50, alpha: 0.6 },
      { x: 350, y: 550, w: 130, h: 40, alpha: 0.35 },
      { x: 50, y: 600, w: 100, h: 30, alpha: 0.3 },
    ];

    cloudData.forEach((c) => {
      const cloud = this.add.graphics();
      cloud.fillStyle(0xffffff, c.alpha);
      // Main body
      cloud.fillEllipse(c.x, c.y, c.w, c.h);
      // Bumps
      cloud.fillEllipse(c.x - c.w * 0.25, c.y - c.h * 0.3, c.w * 0.5, c.h * 0.7);
      cloud.fillEllipse(c.x + c.w * 0.2, c.y - c.h * 0.4, c.w * 0.6, c.h * 0.8);

      // Gentle drift animation
      this.tweens.add({
        targets: cloud,
        x: Phaser.Math.Between(-15, 15),
        duration: Phaser.Math.Between(4000, 7000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  // ── Lower scenery: gentle hills / decorative shapes ──
  drawScenery() {
    const scenery = this.add.graphics();

    // Back hill
    scenery.fillStyle(0x99ccdd, 0.4);
    scenery.fillEllipse(GAME_WIDTH * 0.7, GAME_HEIGHT * 0.88, 500, 300);

    // Front hill
    scenery.fillStyle(0xaaddee, 0.5);
    scenery.fillEllipse(GAME_WIDTH * 0.25, GAME_HEIGHT * 0.92, 600, 280);

    // Ground strip
    scenery.fillStyle(0x88ccdd, 0.35);
    scenery.fillRect(0, GAME_HEIGHT * 0.9, GAME_WIDTH, GAME_HEIGHT * 0.1);

    // Floating decorative gems in the background (subtle)
    const gemPositions = [
      { x: 100, y: 700, key: 0, scale: 0.2, alpha: 0.12 },
      { x: 620, y: 660, key: 1, scale: 0.18, alpha: 0.1 },
      { x: 160, y: 1000, key: 2, scale: 0.22, alpha: 0.12 },
      { x: 560, y: 950, key: 3, scale: 0.2, alpha: 0.1 },
      { x: 360, y: 1100, key: 4, scale: 0.16, alpha: 0.08 },
    ];

    gemPositions.forEach(({ x, y, key, scale, alpha }) => {
      const gem = this.add.image(x, y, GEM_KEYS[key])
        .setScale(scale)
        .setAlpha(alpha);
      this.tweens.add({
        targets: gem,
        y: y - 20,
        duration: Phaser.Math.Between(2500, 4000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 1000),
      });
    });
  }

  // ── Rounded border ──
  drawBorder() {
    const border = this.add.graphics();
    border.lineStyle(4, 0xffffff, 0.5);
    border.strokeRoundedRect(16, 16, GAME_WIDTH - 32, GAME_HEIGHT - 32, 30);
  }

  // ── Title ──
  drawTitle() {
    // "CANDY" text
    const candy = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.12, 'CANDY', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '100px',
      color: '#ff6b9d',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 6,
      shadow: {
        offsetX: 0,
        offsetY: 4,
        color: '#00000044',
        blur: 8,
        fill: true,
      },
    }).setOrigin(0.5);

    // "PUIG" text
    const puig = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.12 + 105, 'PUIG', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '100px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#ff6b9d',
      strokeThickness: 6,
      shadow: {
        offsetX: 0,
        offsetY: 4,
        color: '#00000044',
        blur: 8,
        fill: true,
      },
    }).setOrigin(0.5);

    // Subtle float on title
    this.tweens.add({
      targets: [candy, puig],
      y: '-=8',
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ── Circular play button ──
  drawPlayButton() {
    const btnX = GAME_WIDTH / 2;
    const btnY = GAME_HEIGHT * 0.48;
    const radius = 75;

    // Outer glow
    const glow = this.add.graphics();
    glow.fillStyle(0xcc44aa, 0.25);
    glow.fillCircle(btnX, btnY, radius + 18);

    // White border ring
    const ring = this.add.graphics();
    ring.fillStyle(0xffffff, 1);
    ring.fillCircle(btnX, btnY, radius + 8);

    // Main button circle (purple-magenta gradient effect)
    const btn = this.add.graphics();
    // Base purple
    btn.fillStyle(0xaa33aa, 1);
    btn.fillCircle(btnX, btnY, radius);
    // Lighter overlay on top half for 3D/glossy effect
    btn.fillStyle(0xcc55cc, 0.6);
    btn.fillEllipse(btnX, btnY - radius * 0.2, radius * 1.6, radius * 1.2);
    // Highlight spot
    btn.fillStyle(0xffffff, 0.25);
    btn.fillEllipse(btnX - 10, btnY - radius * 0.35, radius * 0.6, radius * 0.35);

    // Play triangle icon
    const triangle = this.add.graphics();
    triangle.fillStyle(0xffffff, 0.95);
    const triSize = 36;
    const triX = btnX + 5; // Slight offset right for visual centering
    triangle.fillTriangle(
      triX - triSize * 0.8, btnY - triSize,
      triX - triSize * 0.8, btnY + triSize,
      triX + triSize, btnY
    );

    // Interactive zone
    const btnZone = this.add.zone(btnX, btnY, radius * 2, radius * 2)
      .setInteractive({ useHandCursor: true });

    // Hover effect
    btnZone.on('pointerover', () => {
      btn.clear();
      btn.fillStyle(0xcc44cc, 1);
      btn.fillCircle(btnX, btnY, radius);
      btn.fillStyle(0xdd66dd, 0.6);
      btn.fillEllipse(btnX, btnY - radius * 0.2, radius * 1.6, radius * 1.2);
      btn.fillStyle(0xffffff, 0.3);
      btn.fillEllipse(btnX - 10, btnY - radius * 0.35, radius * 0.6, radius * 0.35);
    });

    btnZone.on('pointerout', () => {
      btn.clear();
      btn.fillStyle(0xaa33aa, 1);
      btn.fillCircle(btnX, btnY, radius);
      btn.fillStyle(0xcc55cc, 0.6);
      btn.fillEllipse(btnX, btnY - radius * 0.2, radius * 1.6, radius * 1.2);
      btn.fillStyle(0xffffff, 0.25);
      btn.fillEllipse(btnX - 10, btnY - radius * 0.35, radius * 0.6, radius * 0.35);
    });

    btnZone.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // Pulsing glow
    this.tweens.add({
      targets: glow,
      alpha: { from: 1, to: 0.3 },
      scaleX: { from: 1, to: 1.08 },
      scaleY: { from: 1, to: 1.08 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ── Bottom toggle buttons ──
  drawBottomButtons() {
    const btnY = GAME_HEIGHT - 85;
    const btnSize = 68;
    const cornerR = 16;

    // ─ Music toggle (left) ─
    this.musicBtn = this.add.graphics();
    this.musicIconShadow = this.add.text(82, btnY + 2, '♪', {
      fontFamily: 'Arial',
      fontSize: '34px',
      color: '#996600',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.5);
    this.musicIcon = this.add.text(80, btnY, '♪', {
      fontFamily: 'Arial',
      fontSize: '34px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.drawToggleButton(this.musicBtn, 80, btnY, btnSize, cornerR, this.registry.get('musicOn'));
    this.updateMusicIcon();

    const musicZone = this.add.zone(80, btnY, btnSize, btnSize)
      .setInteractive({ useHandCursor: true });
    musicZone.on('pointerdown', () => {
      const on = !this.registry.get('musicOn');
      this.registry.set('musicOn', on);
      this.drawToggleButton(this.musicBtn, 80, btnY, btnSize, cornerR, on);
      this.updateMusicIcon();
    });

    // ─ SFX toggle (next to music) ─
    this.sfxBtn = this.add.graphics();
    this.sfxIconShadow = this.add.text(172, btnY + 2, '🔊', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#996600',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.4);
    this.sfxIcon = this.add.text(170, btnY, '🔊', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.drawToggleButton(this.sfxBtn, 170, btnY, btnSize, cornerR, this.registry.get('sfxOn'));
    this.updateSfxIcon();

    const sfxZone = this.add.zone(170, btnY, btnSize, btnSize)
      .setInteractive({ useHandCursor: true });
    sfxZone.on('pointerdown', () => {
      const on = !this.registry.get('sfxOn');
      this.registry.set('sfxOn', on);
      this.drawToggleButton(this.sfxBtn, 170, btnY, btnSize, cornerR, on);
      this.updateSfxIcon();
      // Mute/unmute all game sounds
      this.sound.mute = !on;
    });

    // ─ Info / Credits button (right side) ─
    this.drawInfoButton(GAME_WIDTH - 80, btnY, btnSize);
  }

  drawInfoButton(x, y, size) {
    const cornerR = 16;
    const g = this.add.graphics();

    // Drop shadow
    g.fillStyle(0x000000, 0.2);
    g.fillRoundedRect(x - size / 2 + 2, y - size / 2 + 3, size, size, cornerR);

    // White border
    g.fillStyle(0xffffff, 0.85);
    g.fillRoundedRect(x - size / 2 - 3, y - size / 2 - 3, size + 6, size + 6, cornerR + 3);

    // Dark base
    g.fillStyle(0x445566, 0.85);
    g.fillRoundedRect(x - size / 2, y - size / 2, size, size, cornerR);

    // Subtle glossy highlight
    g.fillStyle(0x88aacc, 0.25);
    g.fillRoundedRect(x - size / 2 + 4, y - size / 2 + 4, size - 8, size * 0.4, cornerR / 2);

    this.add.text(x, y, 'i', {
      fontFamily: 'Georgia, serif',
      fontSize: '30px',
      color: '#ffffff',
      fontStyle: 'italic bold',
      shadow: { offsetX: 1, offsetY: 2, color: '#00000066', blur: 2, fill: true },
    }).setOrigin(0.5).setAlpha(0.8);
  }

  drawToggleButton(graphics, x, y, size, cornerR, isOn) {
    graphics.clear();

    const left = x - size / 2;
    const top = y - size / 2;

    // ── Drop shadow (dark, offset down-right) ──
    graphics.fillStyle(0x000000, 0.25);
    graphics.fillRoundedRect(left + 2, top + 4, size, size, cornerR);

    // ── White border (slightly larger rounded rect behind) ──
    graphics.fillStyle(0xffffff, 0.9);
    graphics.fillRoundedRect(left - 4, top - 4, size + 8, size + 8, cornerR + 4);

    if (isOn) {
      // ── Bottom edge (darker orange for depth) ──
      graphics.fillStyle(0xcc6600, 1);
      graphics.fillRoundedRect(left, top + 4, size, size, cornerR);

      // ── Main orange body ──
      graphics.fillStyle(0xee8822, 1);
      graphics.fillRoundedRect(left, top, size, size - 3, cornerR);

      // ── Upper gradient zone (lighter amber) ──
      graphics.fillStyle(0xffaa33, 0.7);
      graphics.fillRoundedRect(left + 3, top + 3, size - 6, size * 0.45, cornerR - 2);

      // ── Top glossy highlight (bright, narrow) ──
      graphics.fillStyle(0xffdd88, 0.6);
      graphics.fillRoundedRect(left + 8, top + 6, size - 16, size * 0.22, cornerR / 2);

      // ── Tiny specular dot ──
      graphics.fillStyle(0xffffff, 0.5);
      graphics.fillEllipse(x - 6, top + 14, 12, 6);
    } else {
      // ── Off state ──
      graphics.fillStyle(0x556677, 0.85);
      graphics.fillRoundedRect(left, top, size, size, cornerR);
      // Subtle highlight even when off
      graphics.fillStyle(0x778899, 0.3);
      graphics.fillRoundedRect(left + 4, top + 4, size - 8, size * 0.4, cornerR / 2);
    }
  }

  updateMusicIcon() {
    const on = this.registry.get('musicOn');
    this.musicIcon.setText('♪');
    this.musicIcon.setAlpha(on ? 1 : 0.35);
    this.musicIconShadow.setText('♪');
    this.musicIconShadow.setAlpha(on ? 0.5 : 0);
  }

  updateSfxIcon() {
    const on = this.registry.get('sfxOn');
    this.sfxIcon.setText(on ? '🔊' : '🔇');
    this.sfxIcon.setAlpha(on ? 1 : 0.4);
    this.sfxIconShadow.setText(on ? '🔊' : '🔇');
    this.sfxIconShadow.setAlpha(on ? 0.4 : 0);
  }
}
