import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, ACCENT_COLOR, GEM_KEYS } from '../config.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.won = data.won || false;
    this.fillPercent = data.fillPercent || 0;
    this.timeRemaining = data.timeRemaining || 0;
    this.finalScore = data.score || 0;
  }

  create() {
    // Light background
    const bg = this.add.graphics();
    const strips = 20;
    const stripH = GAME_HEIGHT / strips;
    for (let i = 0; i < strips; i++) {
      const t = i / strips;
      const r = Phaser.Math.Interpolation.Linear([0xf8, 0xf0], t);
      const g = Phaser.Math.Interpolation.Linear([0xf4, 0xea], t);
      const b = Phaser.Math.Interpolation.Linear([0xef, 0xe2], t);
      const color = (r << 16) | (g << 8) | b;
      bg.fillStyle(color, 1);
      bg.fillRect(0, i * stripH, GAME_WIDTH, stripH + 1);
    }

    // Decorative confetti
    this.createConfetti();

    if (this.won) {
      this.createWinScreen();
    } else {
      this.createLoseScreen();
    }

    // Play Again button
    const btnY = GAME_HEIGHT * 0.65;
    const btnWidth = 300;
    const btnHeight = 80;

    const btnGlow = this.add.graphics();
    btnGlow.fillStyle(0xc8964e, 0.3);
    btnGlow.fillRoundedRect(
      GAME_WIDTH / 2 - btnWidth / 2 - 6,
      btnY - btnHeight / 2 - 6,
      btnWidth + 12,
      btnHeight + 12,
      24
    );

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xc8964e, 1);
    btnBg.fillRoundedRect(
      GAME_WIDTH / 2 - btnWidth / 2,
      btnY - btnHeight / 2,
      btnWidth,
      btnHeight,
      20
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
      btnBg.fillStyle(0xd4a85e, 1);
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
      btnBg.fillStyle(0xc8964e, 1);
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
      color: '#999999',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuText.on('pointerover', () => menuText.setColor('#666666'));
    menuText.on('pointerout', () => menuText.setColor('#999999'));
    menuText.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    // Footer
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'PUIG', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ccbbaa',
      letterSpacing: 8,
    }).setOrigin(0.5);
  }

  createWinScreen() {
    // Title
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.15, 'PERFUME', {
      fontFamily: 'Georgia, serif',
      fontSize: '72px',
      color: ACCENT_COLOR,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.15 + 80, 'COMPLETE!', {
      fontFamily: 'Georgia, serif',
      fontSize: '72px',
      color: ACCENT_COLOR,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Score panel
    const panelY = GAME_HEIGHT * 0.42;
    const panelWidth = 400;
    const panelHeight = 200;

    const panel = this.add.graphics();
    panel.fillStyle(0xffffff, 0.8);
    panel.fillRoundedRect(
      GAME_WIDTH / 2 - panelWidth / 2,
      panelY - panelHeight / 2,
      panelWidth,
      panelHeight,
      20
    );
    panel.lineStyle(3, 0xc8964e, 0.6);
    panel.strokeRoundedRect(
      GAME_WIDTH / 2 - panelWidth / 2,
      panelY - panelHeight / 2,
      panelWidth,
      panelHeight,
      20
    );

    this.add.text(GAME_WIDTH / 2, panelY - 50, 'TIME BONUS', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#888888',
    }).setOrigin(0.5);

    const scoreText = this.add.text(GAME_WIDTH / 2, panelY + 10, '0', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '72px',
      color: ACCENT_COLOR,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, panelY + 65, 'seconds remaining', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#aaaaaa',
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
  }

  createLoseScreen() {
    // Title
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.15, "TIME'S", {
      fontFamily: 'Georgia, serif',
      fontSize: '72px',
      color: '#cc3333',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.15 + 80, 'UP!', {
      fontFamily: 'Georgia, serif',
      fontSize: '72px',
      color: '#cc3333',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Result panel
    const panelY = GAME_HEIGHT * 0.42;
    const panelWidth = 400;
    const panelHeight = 200;

    const panel = this.add.graphics();
    panel.fillStyle(0xffffff, 0.8);
    panel.fillRoundedRect(
      GAME_WIDTH / 2 - panelWidth / 2,
      panelY - panelHeight / 2,
      panelWidth,
      panelHeight,
      20
    );
    panel.lineStyle(3, 0xdddddd, 0.6);
    panel.strokeRoundedRect(
      GAME_WIDTH / 2 - panelWidth / 2,
      panelY - panelHeight / 2,
      panelWidth,
      panelHeight,
      20
    );

    this.add.text(GAME_WIDTH / 2, panelY - 50, 'PERFUME FILLED', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#888888',
    }).setOrigin(0.5);

    const percentText = this.add.text(GAME_WIDTH / 2, panelY + 10, '0%', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '72px',
      color: '#2c2c2c',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, panelY + 65, 'Try again — you can do it!', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Animate fill percentage counting up
    this.tweens.addCounter({
      from: 0,
      to: Math.round(this.fillPercent),
      duration: 1500,
      ease: 'Power2',
      onUpdate: (tween) => {
        percentText.setText(`${Math.floor(tween.getValue())}%`);
      },
    });
  }

  createConfetti() {
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const y = Phaser.Math.Between(-200, GAME_HEIGHT + 200);
      const key = GEM_KEYS[Phaser.Math.Between(0, GEM_KEYS.length - 1)];
      const gem = this.add.image(x, y, key)
        .setScale(Phaser.Math.FloatBetween(0.1, 0.25))
        .setAlpha(Phaser.Math.FloatBetween(0.05, 0.12))
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
