import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    // Set camera background to match loading screen cyan
    this.cameras.main.setBackgroundColor('#60d8f0');
    this.scene.start('PreloadScene');
  }
}
