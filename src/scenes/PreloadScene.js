import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GEM_KEYS } from '../config.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // ── Background ──
    // Cyan-to-blue gradient background
    const bg = this.add.graphics();

    // Base gradient - light cyan at edges, deeper blue in center
    const strips = 40;
    const stripW = GAME_WIDTH / strips;
    for (let i = 0; i < strips; i++) {
      const t = Math.abs((i / strips) - 0.5) * 2; // 0 at center, 1 at edges
      const r = Phaser.Math.Interpolation.Linear([0x40, 0x70], t);
      const g = Phaser.Math.Interpolation.Linear([0xb0, 0xe8], t);
      const b = Phaser.Math.Interpolation.Linear([0xf0, 0xf8], t);
      const color = (r << 16) | (g << 8) | b;
      bg.fillStyle(color, 1);
      bg.fillRect(i * stripW, 0, stripW + 1, GAME_HEIGHT);
    }

    // Subtle vertical stripe overlay in center area
    const centerStripes = this.add.graphics();
    for (let i = 0; i < 12; i++) {
      const x = GAME_WIDTH * 0.3 + (i * GAME_WIDTH * 0.04);
      const alpha = 0.03 + Math.random() * 0.05;
      centerStripes.fillStyle(0x2080cc, alpha);
      centerStripes.fillRect(x, 0, GAME_WIDTH * 0.025, GAME_HEIGHT);
    }

    // ── Rounded border container ──
    const border = this.add.graphics();
    border.lineStyle(4, 0xffffff, 0.5);
    border.strokeRoundedRect(16, 16, GAME_WIDTH - 32, GAME_HEIGHT - 32, 30);

    // ── Floating white squares ──
    const squares = [];
    const squareData = [
      { x: 70, y: 80, size: 28, alpha: 0.5 },
      { x: 50, y: 200, size: 16, alpha: 0.8 },
      { x: 200, y: 160, size: 20, alpha: 1.0 },
      { x: 340, y: 50, size: 40, alpha: 0.35 },
      { x: 400, y: 120, size: 24, alpha: 0.45 },
      { x: 580, y: 60, size: 28, alpha: 1.0 },
      { x: 650, y: 100, size: 24, alpha: 0.9 },
      { x: 500, y: 270, size: 16, alpha: 0.6 },
      { x: 590, y: 340, size: 30, alpha: 1.0 },
      { x: 650, y: 380, size: 20, alpha: 0.9 },
      { x: 60, y: 680, size: 18, alpha: 0.7 },
      { x: 110, y: 750, size: 12, alpha: 0.5 },
      { x: 580, y: 780, size: 22, alpha: 0.4 },
      { x: 350, y: 900, size: 14, alpha: 0.3 },
      { x: 150, y: 1050, size: 10, alpha: 0.5 },
      { x: 500, y: 1000, size: 16, alpha: 0.7 },
      { x: 400, y: 1150, size: 12, alpha: 0.4 },
    ];

    squareData.forEach((sq) => {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, sq.alpha);
      g.fillRect(sq.x - sq.size / 2, sq.y - sq.size / 2, sq.size, sq.size);
      // Gentle floating animation
      this.tweens.add({
        targets: g,
        y: Phaser.Math.Between(-10, 10),
        x: Phaser.Math.Between(-5, 5),
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      squares.push(g);
    });

    // ── Loading bar (centered, slightly above middle) ──
    const barWidth = GAME_WIDTH * 0.55;
    const barHeight = 50;
    const barX = (GAME_WIDTH - barWidth) / 2;
    const barY = GAME_HEIGHT * 0.47;

    // Bar background (white outline, rounded pill shape)
    const barBg = this.add.graphics();
    barBg.lineStyle(4, 0xffffff, 0.9);
    barBg.strokeRoundedRect(barX, barY, barWidth, barHeight, barHeight / 2);
    // Subtle inner fill
    barBg.fillStyle(0x3080c0, 0.3);
    barBg.fillRoundedRect(barX + 2, barY + 2, barWidth - 4, barHeight - 4, (barHeight - 4) / 2);

    // Progress bar fill (purple-to-pink gradient)
    const progressBar = this.add.graphics();

    // Rounded mask to clip the gradient strips inside the pill shape
    const maskShape = this.make.graphics({ add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRoundedRect(barX + 5, barY + 5, barWidth - 10, barHeight - 10, (barHeight - 10) / 2);
    const barMask = maskShape.createGeometryMask();
    progressBar.setMask(barMask);

    // ── "Loading..." text ──
    const loadingText = this.add.text(GAME_WIDTH / 2, barY + barHeight + 30, 'Loading...', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '38px',
      fontStyle: 'bold',
      color: '#ffffff',
      shadow: {
        offsetX: 0,
        offsetY: 2,
        color: '#00000033',
        blur: 4,
        fill: true,
      },
    }).setOrigin(0.5);

    // ── Progress handler ──
    this.load.on('progress', (value) => {
      progressBar.clear();

      const fillWidth = (barWidth - 10) * value;
      const fillHeight = barHeight - 10;
      const fillX = barX + 5;
      const fillY = barY + 5;
      const radius = fillHeight / 2;

      if (fillWidth > 0) {
        // Purple-to-pink gradient bar
        // First pass: purple base
        progressBar.fillStyle(0x8833cc, 1);
        progressBar.fillRoundedRect(fillX, fillY, fillWidth, fillHeight, radius);

        // Second pass: pink overlay fading in from left to right
        const overlayStrips = Math.max(1, Math.floor(fillWidth / 3));
        for (let i = 0; i < overlayStrips; i++) {
          const t = i / overlayStrips;
          progressBar.fillStyle(0xdd44aa, t * 0.8);
          const sx = fillX + (fillWidth * (i / overlayStrips));
          const sw = fillWidth / overlayStrips + 1;
          progressBar.fillRect(sx, fillY + 2, sw, fillHeight - 4);
        }

        // Glossy highlight on top half
        progressBar.fillStyle(0xffffff, 0.2);
        progressBar.fillRoundedRect(fillX + 4, fillY + 2, fillWidth - 8, fillHeight * 0.4, radius / 2);
      }
    });

    // ── Store references for cleanup during transition ──
    this._loadingElements = [bg, centerStripes, border, barBg, progressBar, maskShape, loadingText, ...squares];

    // ── Load game assets ──
    // Load gem images
    GEM_KEYS.forEach((key) => {
      this.load.image(key, `assets/images/${key}.png`);
    });

    // Load product images
    this.load.image('fragance_image', 'assets/images/fragance_image.jpeg');
    this.load.image('good_girl', 'assets/images/good_girl.jpeg');

    // Load sounds
    this.load.audio('match', 'assets/sounds/match.wav');
    this.load.audio('swap', 'assets/sounds/swap.wav');
    this.load.audio('no-match', 'assets/sounds/no-match.wav');
    this.load.audio('gameover', 'assets/sounds/gameover.wav');
    this.load.audio('select', 'assets/sounds/select.wav');
    this.load.audio('land', 'assets/sounds/land.wav');
  }

  create() {
    // Hold the loading screen for 2 seconds, then fade out and transition
    this.time.delayedCall(1600, () => {
      // Fade out loading screen elements over 400ms
      this.tweens.add({
        targets: this._loadingElements,
        alpha: 0,
        duration: 400,
        onComplete: () => {
          this._loadingElements.forEach((el) => el.destroy());
          this.scene.start('MenuScene');
        },
      });
    });
  }
}
