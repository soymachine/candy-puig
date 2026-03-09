import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GEM_KEYS, ACCENT_COLOR } from '../config.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    // Background gradient effect
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a2e, 0x1a0a2e, 0x2d1b4e, 0x2d1b4e);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Decorative floating gems in the background
    this.createFloatingGems();

    // Title
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.2, 'CANDY', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '96px',
      color: '#ff6b9d',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.2 + 100, 'PUIG', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '96px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#ff6b9d',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.2 + 200, 'Match 3 Challenge', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ccaaff',
    }).setOrigin(0.5);

    // Play button
    const btnY = GAME_HEIGHT * 0.6;
    const btnWidth = 280;
    const btnHeight = 80;

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xff6b9d, 1);
    btnBg.fillRoundedRect(
      GAME_WIDTH / 2 - btnWidth / 2,
      btnY - btnHeight / 2,
      btnWidth,
      btnHeight,
      20
    );

    // Button glow
    const btnGlow = this.add.graphics();
    btnGlow.fillStyle(0xff6b9d, 0.3);
    btnGlow.fillRoundedRect(
      GAME_WIDTH / 2 - btnWidth / 2 - 6,
      btnY - btnHeight / 2 - 6,
      btnWidth + 12,
      btnHeight + 12,
      24
    );

    const btnText = this.add.text(GAME_WIDTH / 2, btnY, 'PLAY', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Make button interactive
    const btnZone = this.add.zone(GAME_WIDTH / 2, btnY, btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true });

    btnZone.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0xff8cb5, 1);
      btnBg.fillRoundedRect(
        GAME_WIDTH / 2 - btnWidth / 2,
        btnY - btnHeight / 2,
        btnWidth,
        btnHeight,
        20
      );
    });

    btnZone.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0xff6b9d, 1);
      btnBg.fillRoundedRect(
        GAME_WIDTH / 2 - btnWidth / 2,
        btnY - btnHeight / 2,
        btnWidth,
        btnHeight,
        20
      );
    });

    btnZone.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // Pulse animation on button glow
    this.tweens.add({
      targets: btnGlow,
      alpha: { from: 1, to: 0.3 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Instructions
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.78, 'Tap two adjacent gems to swap them\nMatch 3 or more to score!', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#9988bb',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5);

    // Footer
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'PUIG', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#554477',
      letterSpacing: 8,
    }).setOrigin(0.5);
  }

  createFloatingGems() {
    const positions = [
      { x: 100, y: 500, key: 0, delay: 0 },
      { x: 620, y: 450, key: 1, delay: 200 },
      { x: 150, y: 900, key: 2, delay: 400 },
      { x: 580, y: 850, key: 3, delay: 600 },
      { x: 360, y: 1050, key: 4, delay: 800 },
      { x: 500, y: 1100, key: 5, delay: 1000 },
    ];

    positions.forEach(({ x, y, key, delay }) => {
      const gem = this.add.image(x, y, GEM_KEYS[key])
        .setScale(0.35)
        .setAlpha(0.15);

      this.tweens.add({
        targets: gem,
        y: y - 30,
        duration: 2000 + delay,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: delay,
      });
    });
  }
}
