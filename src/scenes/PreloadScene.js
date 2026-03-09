import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GEM_KEYS } from '../config.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // Progress bar
    const barWidth = GAME_WIDTH * 0.6;
    const barHeight = 30;
    const barX = (GAME_WIDTH - barWidth) / 2;
    const barY = GAME_HEIGHT / 2;

    const bgBar = this.add.graphics();
    bgBar.fillStyle(0x333333, 1);
    bgBar.fillRoundedRect(barX, barY, barWidth, barHeight, 15);

    const progressBar = this.add.graphics();

    const loadingText = this.add.text(GAME_WIDTH / 2, barY - 40, 'Loading...', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xff6b9d, 1);
      progressBar.fillRoundedRect(barX + 4, barY + 4, (barWidth - 8) * value, barHeight - 8, 12);
    });

    this.load.on('complete', () => {
      bgBar.destroy();
      progressBar.destroy();
      loadingText.destroy();
    });

    // Load gem images
    GEM_KEYS.forEach((key) => {
      this.load.image(key, `assets/images/${key}.png`);
    });

    // Load sounds
    this.load.audio('match', 'assets/sounds/match.wav');
    this.load.audio('swap', 'assets/sounds/swap.wav');
    this.load.audio('no-match', 'assets/sounds/no-match.wav');
    this.load.audio('gameover', 'assets/sounds/gameover.wav');
    this.load.audio('select', 'assets/sounds/select.wav');
  }

  create() {
    this.scene.start('MenuScene');
  }
}
