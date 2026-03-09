import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GEM_KEYS } from '../config.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.finalScore = data.score || 0;
  }

  create() {
    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a2e, 0x1a0a2e, 0x2d1b4e, 0x2d1b4e);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Decorative gems
    this.createConfetti();

    // "Game Over" title
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.18, 'GAME', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '80px',
      color: '#ff6b9d',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.18 + 85, 'OVER', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '80px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#ff6b9d',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Score panel
    const panelY = GAME_HEIGHT * 0.42;
    const panelWidth = 400;
    const panelHeight = 200;

    const panel = this.add.graphics();
    panel.fillStyle(0x2d1b4e, 0.8);
    panel.fillRoundedRect(
      GAME_WIDTH / 2 - panelWidth / 2,
      panelY - panelHeight / 2,
      panelWidth,
      panelHeight,
      20
    );
    panel.lineStyle(3, 0xff6b9d, 0.6);
    panel.strokeRoundedRect(
      GAME_WIDTH / 2 - panelWidth / 2,
      panelY - panelHeight / 2,
      panelWidth,
      panelHeight,
      20
    );

    this.add.text(GAME_WIDTH / 2, panelY - 45, 'YOUR SCORE', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#9988bb',
    }).setOrigin(0.5);

    // Animated score counter
    const scoreText = this.add.text(GAME_WIDTH / 2, panelY + 20, '0', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '72px',
      color: '#ffdd00',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Animate score counting up
    this.tweens.addCounter({
      from: 0,
      to: this.finalScore,
      duration: 1500,
      ease: 'Power2',
      onUpdate: (tween) => {
        scoreText.setText(String(Math.floor(tween.getValue())));
      },
    });

    // Play Again button
    const btnY = GAME_HEIGHT * 0.65;
    const btnWidth = 300;
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

    const btnGlow = this.add.graphics();
    btnGlow.fillStyle(0xff6b9d, 0.3);
    btnGlow.fillRoundedRect(
      GAME_WIDTH / 2 - btnWidth / 2 - 6,
      btnY - btnHeight / 2 - 6,
      btnWidth + 12,
      btnHeight + 12,
      24
    );

    this.add.text(GAME_WIDTH / 2, btnY, 'PLAY AGAIN', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '40px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const playBtn = this.add.zone(GAME_WIDTH / 2, btnY, btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true });

    playBtn.on('pointerover', () => {
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

    playBtn.on('pointerout', () => {
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

    playBtn.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // Pulse glow
    this.tweens.add({
      targets: btnGlow,
      alpha: { from: 1, to: 0.3 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Menu button
    const menuBtnY = GAME_HEIGHT * 0.75;
    const menuText = this.add.text(GAME_WIDTH / 2, menuBtnY, 'MAIN MENU', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#9988bb',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuText.on('pointerover', () => menuText.setColor('#ffffff'));
    menuText.on('pointerout', () => menuText.setColor('#9988bb'));
    menuText.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    // Footer
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'PUIG', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#554477',
      letterSpacing: 8,
    }).setOrigin(0.5);
  }

  createConfetti() {
    // Spawn falling gem confetti
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const y = Phaser.Math.Between(-200, GAME_HEIGHT + 200);
      const key = GEM_KEYS[Phaser.Math.Between(0, GEM_KEYS.length - 1)];
      const gem = this.add.image(x, y, key)
        .setScale(Phaser.Math.FloatBetween(0.1, 0.25))
        .setAlpha(Phaser.Math.FloatBetween(0.08, 0.2))
        .setAngle(Phaser.Math.Between(0, 360));

      this.tweens.add({
        targets: gem,
        y: gem.y + Phaser.Math.Between(100, 300),
        angle: gem.angle + Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(3000, 6000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }
}
